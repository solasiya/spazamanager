import { 
  User, InsertUser, 
  Category, InsertCategory, 
  Supplier, InsertSupplier, 
  Product, InsertProduct, 
  Sale, InsertSale, 
  Restock, InsertRestock,
  users, categories, suppliers, products, sales, restocks
} from "@shared/schema";
import session from "express-session";
import MySQLStore from 'express-mysql-session'; // Changed from connect-pg-simple
import { db, pool } from "./db";
import { eq, lt, gt, and, desc, sql, between } from "drizzle-orm";
import bcrypt from "bcrypt";
import { migrate } from 'drizzle-orm/mysql2/migrator'; // Changed from node-postgres
import { runMigrations } from './migrations';
import { Pool } from 'mysql2/promise';
import { DatabaseStorage } from './storage';

const MySQLSessionStore = MySQLStore(session);

export interface IStorage {
  // ... (keep all your existing interface methods)
}

export class DatabaseStorage implements IStorage {
  private pool: Pool;
  sessionStore: session.SessionStore;

  constructor(pool: Pool) {
    this.pool = pool;

    this.sessionStore = new MySQLSessionStore({
      clearExpired: true,
      checkExpirationInterval: 900000, // 15 minutes
      expiration: 86400000, // 24 hours
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    }, this.pool); // use this.pool here too

    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      await runMigrations();
      
      // Check if admin user exists
      const adminUser = await this.getUserByUsername('admin');
      if (!adminUser) {
        console.log('Creating default admin user...');
        const hashedPassword = await bcrypt.hash('password', 12);
        await this.createUser({
          username: 'admin',
          password: hashedPassword,
          fullName: 'Store Owner',
          role: 'owner'
        });
        console.log('✅ Default admin user created (username: admin, password: password)');
      }
      
      // Check if categories exist
      const [result] = await db.execute(sql`
        SELECT COUNT(*) as count FROM categories
      `);
      
      if (result[0].count === 0) {
        console.log('Creating default categories...');
        const defaultCategories = [
          { name: "Beverages" },
          { name: "Bread & Bakery" },
          { name: "Dairy" },
          { name: "Canned Goods" },
          { name: "Cleaning" }
        ];
        
        for (const category of defaultCategories) {
          await this.createCategory(category);
        }
        console.log('✅ Default categories created');
      }
    } catch (error) {
      console.error("Error initializing default data:", error);
      throw error;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [rows] = await this.pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] as User : undefined;
  }

async getUserByUsername(username: string): Promise<User | undefined> {
    const [rows] = await this.pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] as User : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Password should already be hashed by the time it reaches this method
    await db.insert(users).values(user);
    
    // Return the created user
    const createdUser = await this.getUserByUsername(user.username);
    if (!createdUser) {
      throw new Error('Failed to create user');
    }
    return createdUser;
  }

  // ... (implement all other interface methods following the same MySQL pattern)

  // Example of a more complex method
  async getDashboardStats(): Promise<{
    totalSales: number;
    lowStockCount: number;
    expiringItemsCount: number;
    topCategory: string;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Get today's sales
    const [salesResult] = await db.select()
      .from(sales)
      .where(between(sales.date, startOfDay, endOfDay));
    
    const totalSales = salesResult.reduce((sum, sale) => sum + Number(sale.total), 0);

    // Get low stock count
    const [lowStockResult] = await db.select()
      .from(products)
      .where(lt(products.quantity, products.alertThreshold));
    const lowStockCount = lowStockResult.length;

    // Get expiring items (next 7 days)
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 7);
    const [expiringResult] = await db.select()
      .from(products)
      .where(and(
        gt(products.expiryDate, now),
        lt(products.expiryDate, futureDate)
      ));
    const expiringItemsCount = expiringResult.length;

    // Find top category (simplified for MySQL)
    let topCategory = "None";
    if (salesResult.length > 0) {
      const [categoryResult] = await db.execute(sql`
        SELECT c.name, COUNT(*) as sales_count
        FROM sales s
        JOIN products p ON JSON_CONTAINS(s.items, JSON_OBJECT('productId', p.id))
        JOIN categories c ON p.category_id = c.id
        WHERE s.date BETWEEN ? AND ?
        GROUP BY c.id
        ORDER BY sales_count DESC
        LIMIT 1
      `, [startOfDay, endOfDay]);
      
      if (categoryResult[0]) {
        topCategory = categoryResult[0].name;
      }
    }

    return {
      totalSales,
      lowStockCount,
      expiringItemsCount,
      topCategory
    };
  }
}
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private suppliers: Map<number, Supplier>;
  private products: Map<number, Product>;
  private sales: Map<number, Sale>;
  private restocks: Map<number, Restock>;

  private userCurrentId: number;
  private categoryCurrentId: number;
  private supplierCurrentId: number;
  private productCurrentId: number;
  private saleCurrentId: number;
  private restockCurrentId: number;

  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.suppliers = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.restocks = new Map();

    this.userCurrentId = 1;
    this.categoryCurrentId = 1;
    this.supplierCurrentId = 1;
    this.productCurrentId = 1;
    this.saleCurrentId = 1;
    this.restockCurrentId = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add default admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password"
      fullName: "Store Owner",
      role: "owner"
    });

    // Add some default categories
    this.createCategory({ name: "Beverages" });
    this.createCategory({ name: "Bread & Bakery" });
    this.createCategory({ name: "Dairy" });
    this.createCategory({ name: "Canned Goods" });
    this.createCategory({ name: "Cleaning" });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

 async getUserByUsername(username: string): Promise<User | undefined> {
  const [result] = await db.select()
    .from(users)
    .where(eq(users.username, username));
  return result[0];
}

async createUser(user: InsertUser): Promise<User> {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  await db.insert(users).values({
    full_name: user.full_name, // ✅ Add this
    username: user.username,
    password: hashedPassword,
    role: user.role
  });
  
  const [result] = await db.execute(sql`
    SELECT * FROM users WHERE id = LAST_INSERT_ID()
  `);
  return result[0];
}

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.name === name,
    );
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // Supplier operations
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierCurrentId++;
    const now = new Date();
    const supplier: Supplier = { ...insertSupplier, id, lastOrderDate: now };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: number, supplierData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    
    const updatedSupplier = { ...supplier, ...supplierData };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productCurrentId++;
    const now = new Date();
    const product: Product = { ...insertProduct, id, createdAt: now };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.quantity <= (threshold ?? product.alertThreshold)
    );
  }

  async getExpiringProducts(days: number = 7): Promise<Product[]> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    
    return Array.from(this.products.values()).filter(
      (product) => product.expiryDate && product.expiryDate <= futureDate && product.expiryDate >= now
    );
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId
    );
  }

  async getProductsBySupplier(supplierId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.supplierId === supplierId
    );
  }

  // Sale operations
  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.saleCurrentId++;
    const now = new Date();
    const sale: Sale = { ...insertSale, id, date: now };
    this.sales.set(id, sale);
    
    // Update product quantities
    const saleItems = sale.items as Array<{productId: number, quantity: number}>;
    for (const item of saleItems) {
      const product = this.products.get(item.productId);
      if (product) {
        product.quantity = Number(product.quantity) - Number(item.quantity);
        this.products.set(product.id, product);
      }
    }
    
    return sale;
  }

  async getAllSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(
      (sale) => sale.date >= startDate && sale.date <= endDate
    );
  }

  // Restock operations
  async getRestock(id: number): Promise<Restock | undefined> {
    return this.restocks.get(id);
  }

  async createRestock(insertRestock: InsertRestock): Promise<Restock> {
    const id = this.restockCurrentId++;
    const now = new Date();
    const restock: Restock = { ...insertRestock, id, date: now };
    this.restocks.set(id, restock);
    
    // Update product quantities and supplier's last order date
    const restockItems = restock.items as Array<{productId: number, quantity: number}>;
    for (const item of restockItems) {
      const product = this.products.get(item.productId);
      if (product) {
        product.quantity = Number(product.quantity) + Number(item.quantity);
        this.products.set(product.id, product);
      }
    }
    
    if (restock.supplierId) {
      const supplier = this.suppliers.get(restock.supplierId);
      if (supplier) {
        supplier.lastOrderDate = now;
        this.suppliers.set(supplier.id, supplier);
      }
    }
    
    return restock;
  }

  async getAllRestocks(): Promise<Restock[]> {
    return Array.from(this.restocks.values());
  }

  async getRestocksByDateRange(startDate: Date, endDate: Date): Promise<Restock[]> {
    return Array.from(this.restocks.values()).filter(
      (restock) => restock.date >= startDate && restock.date <= endDate
    );
  }

  // Dashboard data
  async getDashboardStats(): Promise<{
    totalSales: number;
    lowStockCount: number;
    expiringItemsCount: number;
    topCategory: string;
  }> {
    // Calculate total sales for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const todaySales = await this.getSalesByDateRange(startOfDay, endOfDay);
    const totalSales = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
    
    // Get low stock items
    const lowStockProducts = await this.getLowStockProducts();
    
    // Get expiring items
    const expiringProducts = await this.getExpiringProducts();
    
    // Find top category
    const categorySales = new Map<number, number>();
    for (const sale of todaySales) {
      const items = sale.items as Array<{productId: number, quantity: number}>;
      for (const item of items) {
        const product = await this.getProduct(item.productId);
        if (product && product.categoryId) {
          const currentTotal = categorySales.get(product.categoryId) || 0;
          categorySales.set(product.categoryId, currentTotal + 1);
        }
      }
    }
    
    let topCategoryId = 0;
    let maxSales = 0;
    for (const [categoryId, sales] of categorySales.entries()) {
      if (sales > maxSales) {
        maxSales = sales;
        topCategoryId = categoryId;
      }
    }
    
    let topCategoryName = "None";
    if (topCategoryId > 0) {
      const topCategory = await this.getCategory(topCategoryId);
      if (topCategory) {
        topCategoryName = topCategory.name;
      }
    }
    
    return {
      totalSales,
      lowStockCount: lowStockProducts.length,
      expiringItemsCount: expiringProducts.length,
      topCategory: topCategoryName
    };
  }
}

// Export
export const storage = new DatabaseStorage(pool);