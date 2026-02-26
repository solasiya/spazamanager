import { mysqlTable, text, int, boolean, timestamp, json, decimal, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("cashier"), // superuser, owner, supervisor, cashier, stock_manager
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

// Category model
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

// Supplier model
export const suppliers = mysqlTable("suppliers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  categories: json("categories").$type<string[]>(),
  lastOrderDate: timestamp("last_order_date"),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactPerson: true,
  phone: true,
  email: true,
  address: true,
  categories: true,
});

// Product model
export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  categoryId: int("category_id"),
  quantity: int("quantity").notNull().default(0),
  alertThreshold: int("alert_threshold").default(10),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  expiryDate: timestamp("expiry_date"),
  supplierId: int("supplier_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  sku: true,
  categoryId: true,
  quantity: true,
  alertThreshold: true,
  purchasePrice: true,
  sellingPrice: true,
  expiryDate: true,
  supplierId: true,
});

// Sale model
export const sales = mysqlTable("sales", {
  id: int("id").primaryKey().autoincrement(),
  date: timestamp("date").defaultNow(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  items: json("items").notNull(), // Array of {productId, quantity, price}
  userId: int("user_id").notNull(),
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  total: true,
  items: true,
  userId: true,
});

// Restock model
export const restocks = mysqlTable("restocks", {
  id: int("id").primaryKey().autoincrement(),
  date: timestamp("date").defaultNow(),
  supplierId: int("supplier_id"),
  items: json("items").notNull(), // Array of {productId, quantity, price}
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  userId: int("user_id").notNull(),
});

export const insertRestockSchema = createInsertSchema(restocks).pick({
  supplierId: true,
  items: true,
  total: true,
  userId: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Restock = typeof restocks.$inferSelect;
export type InsertRestock = z.infer<typeof insertRestockSchema>;
