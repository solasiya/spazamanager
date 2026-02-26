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
import MySQLStore from 'express-mysql-session';
import { db, pool } from "./db";
import { eq, lt, gt, and, desc, sql, between } from "drizzle-orm";
import bcrypt from "bcrypt";
import { runMigrations } from './migrations';
import { Pool } from 'mysql2/promise';

const MySQLSessionStore = MySQLStore(session as any);

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Supplier operations
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  getExpiringProducts(days: number): Promise<Product[]>;

  // Sale operations
  getAllSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;

  // Restock operations
  getAllRestocks(): Promise<Restock[]>;
  getRestock(id: number): Promise<Restock | undefined>;
  createRestock(restock: InsertRestock): Promise<Restock>;

  // Dashboard stats
  getDashboardStats(range?: string): Promise<{
    totalSales: number;
    lowStockCount: number;
    expiringItemsCount: number;
    topCategory: string;
  }>;
  setLastBackupTime(date: Date): void;
  getLastBackupTime(): Date;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  private lastBackupAt: Date = new Date(Date.now() - 1000 * 60 * 60 * 8); // Default to 8h ago

  constructor(pool: Pool) {
    this.sessionStore = new MySQLSessionStore({
      clearExpired: true,
      checkExpirationInterval: 900000,
      expiration: 86400000,
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    }, pool as any);

    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      console.log('🔄 Initializing database schema and default data...');
      await runMigrations();
      console.log('✅ Migrations completed or tables already exist.');

      // Check for superuser
      const superuser = await this.getUserByUsername('cms');
      if (!superuser) {
        console.log('👤 Creating default superuser (cms)...');
        const hashedPassword = await bcrypt.hash('cms123', 12);
        await this.createUser({
          username: 'cms',
          password: hashedPassword,
          fullName: 'CMS Admin',
          role: 'superuser'
        });
        console.log('✅ Default superuser created successfully.');
      } else {
        console.log('👤 Superuser (cms) already exists.');
      }

      // Check for admin
      const adminUser = await this.getUserByUsername('admin');
      if (!adminUser) {
        console.log('👤 Creating default admin user (admin)...');
        const hashedPassword = await bcrypt.hash('password', 12);
        await this.createUser({
          username: 'admin',
          password: hashedPassword,
          fullName: 'Store Owner',
          role: 'owner'
        });
        console.log('✅ Default admin user created successfully.');
      } else {
        console.log('👤 Admin user (admin) already exists.');
      }
      
      console.log('🏁 Database successfully initialized.');
    } catch (error) {
      console.error("❌ Error initializing default data:", error);
      // We don't throw here to avoid crashing the server if the DB is momentarily unavailable
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.username, username));
    return result;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user);
    // In MySQL, we need to fetch the last inserted ID if result doesn't return the full object
    const [createdUser] = await db.select().from(users).where(eq(users.username, user.username));
    return createdUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    await db.update(users).set(userData).where(eq(users.id, id));
    return this.getUser(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true; // Simple return for now
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [result] = await db.select().from(categories).where(eq(categories.id, id));
    return result;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    await db.insert(categories).values(category);
    // Find the one we just created
    const [result] = await db.select().from(categories).where(eq(categories.name, category.name));
    return result;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    await db.update(categories).set(categoryData).where(eq(categories.id, id));
    return this.getCategory(id);
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // Supplier operations
  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [result] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    await db.insert(suppliers).values(supplier as any);
    // Find the one we just created - approximation by name
    const [result] = await db.select().from(suppliers).where(eq(suppliers.name, supplier.name));
    return result;
  }

  async updateSupplier(id: number, supplierData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    await db.update(suppliers).set(supplierData as any).where(eq(suppliers.id, id));
    return this.getSupplier(id);
  }

  async deleteSupplier(id: number): Promise<boolean> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [result] = await db.select().from(products).where(eq(products.id, id));
    return result;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    await db.insert(products).values(product as any);
    // Find by name (not ideal but works for unique-ish ones)
    const [result] = await db.select().from(products).where(eq(products.name, product.name));
    return result;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    await db.update(products).set(productData as any).where(eq(products.id, id));
    return this.getProduct(id);
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const all = await this.getAllProducts();
    return all.filter(p => p.quantity <= (threshold ?? (p.alertThreshold || 10)));
  }

  async getExpiringProducts(days: number): Promise<Product[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    
    // Simple filter since Drizzle and MySQL timestamps can be tricky in where
    const all = await this.getAllProducts();
    return all.filter(p => p.expiryDate && p.expiryDate > now && p.expiryDate <= future);
  }

  // Sale operations
  async getAllSales(): Promise<Sale[]> {
    return await db.select().from(sales);
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [result] = await db.select().from(sales).where(eq(sales.id, id));
    return result;
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    await db.insert(sales).values(sale as any);
    // Update product quantities
    const items = sale.items as any[];
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        await this.updateProduct(product.id, {
          quantity: Math.max(0, product.quantity - item.quantity)
        });
      }
    }
    // Return last sale
    const [lastSale] = await db.select().from(sales).orderBy(desc(sales.id)).limit(1);
    return lastSale;
  }

  // Restock operations
  async getAllRestocks(): Promise<Restock[]> {
    return await db.select().from(restocks);
  }

  async getRestock(id: number): Promise<Restock | undefined> {
    const [result] = await db.select().from(restocks).where(eq(restocks.id, id));
    return result;
  }

  async createRestock(restock: InsertRestock): Promise<Restock> {
    await db.insert(restocks).values(restock as any);
    // Update product quantities
    const items = restock.items as any[];
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        await this.updateProduct(product.id, {
          quantity: product.quantity + item.quantity
        });
      }
    }
    // Return last restock
    const [lastRestock] = await db.select().from(restocks).orderBy(desc(restocks.id)).limit(1);
    return lastRestock;
  }

  async getDashboardStats(range: string = "today"): Promise<{
    totalSales: number;
    lowStockCount: number;
    expiringItemsCount: number;
    topCategory: string;
  }> {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (range === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (range === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const periodSales = await db.select()
      .from(sales)
      .where(gt(sales.date, startDate));
    
    const totalSales = periodSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const lowStock = await this.getLowStockProducts();
    const expiring = await this.getExpiringProducts(7);

    let topCategory = "None";
    if (periodSales.length > 0) {
      const catCounts: Record<string, number> = {};
      for (const sale of periodSales) {
        const items = (sale.items as any[]) || [];
        for (const item of items) {
          const product = await this.getProduct(item.productId);
          if (product && product.categoryId) {
            const cat = await this.getCategory(product.categoryId);
            const name = cat?.name || "Other";
            catCounts[name] = (catCounts[name] || 0) + Number(item.quantity);
          }
        }
      }
      const sorted = Object.entries(catCounts).sort((a,b) => b[1] - a[1]);
      if (sorted.length > 0) topCategory = sorted[0][0];
    }

    return {
      totalSales,
      lowStockCount: lowStock.length,
      expiringItemsCount: expiring.length,
      topCategory
    };
  }

  setLastBackupTime(date: Date): void {
    this.lastBackupAt = date;
  }

  getLastBackupTime(): Date {
    return this.lastBackupAt;
  }
}

export const storage = new DatabaseStorage(pool);