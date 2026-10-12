import { relations } from "drizzle-orm";
import { boolean, customType, date, integer, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Mirrors OrderManagement_CS (O11) as read through the Service Studio MCP (getDataModel).
const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });
const currency = (name: string) => numeric(name, { precision: 37, scale: 8, mode: "number" });

const audit = {
  createdBy: integer("created_by").references(() => users.id),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedOn: timestamp("updated_on"),
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 250 }).notNull().unique(),
  name: varchar("name", { length: 250 }).notNull(),
  email: varchar("email", { length: 250 }),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 30 }).$type<"OrderManager" | "OrderRepresentative">().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Static entities (Id = OutSystems "Order" attribute)
export const orderStatuses = pgTable("order_status", {
  id: integer("id").primaryKey(),
  identifier: varchar("identifier", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 50 }).notNull(),
  order: integer("order").notNull(),
  description: varchar("description", { length: 200 }),
  colorRgb: varchar("color_rgb", { length: 50 }),
});
export const opportunityStages = pgTable("opportunity_stage", {
  id: integer("id").primaryKey(),
  identifier: varchar("identifier", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 50 }).notNull(),
  order: integer("order").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});
export const opportunityTypes = pgTable("opportunity_type", {
  id: integer("id").primaryKey(),
  identifier: varchar("identifier", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 50 }).notNull(),
  order: integer("order").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const countries = pgTable("country", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const accounts = pgTable("account", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  company: varchar("company", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  contact: varchar("contact", { length: 100 }).notNull(),
  countryId: integer("country_id").references(() => countries.id, { onDelete: "restrict" }),
  address: varchar("address", { length: 250 }),
  city: varchar("city", { length: 50 }),
  postalCode: varchar("postal_code", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 250 }),
  ...audit,
});

export const brands = pgTable("brand", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...audit,
});

export const models = pgTable("model", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  brandId: integer("brand_id").notNull().references(() => brands.id, { onDelete: "restrict" }),
  isActive: boolean("is_active").notNull().default(true),
  ...audit,
});

export const productCategories = pgTable("product_category", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }),
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 250 }),
  isActive: boolean("is_active").notNull().default(true),
  ...audit,
});

export const products = pgTable("product", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 250 }).notNull(),
  description: varchar("description", { length: 1000 }),
  categoryId: integer("category_id").notNull().references(() => productCategories.id, { onDelete: "restrict" }),
  modelId: integer("model_id").references(() => models.id, { onDelete: "restrict" }),
  price: currency("price").notNull(),
  discount: currency("discount"),
  stock: integer("stock").notNull().default(0),
  reference: varchar("reference", { length: 50 }),
  ean: varchar("ean", { length: 50 }),
  weight: varchar("weight", { length: 50 }),
  dimensions: varchar("dimensions", { length: 150 }),
  reorderLevel: integer("reorder_level"),
  isActive: boolean("is_active").notNull().default(true),
  ...audit,
});

export const productFeatures = pgTable("product_feature", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...audit,
});

export const productPictures = pgTable("product_picture", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 250 }),
  filetype: varchar("filetype", { length: 150 }),
  file: bytea("file"),
  isCover: boolean("is_cover").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  ...audit,
});

export const opportunities = pgTable("opportunity", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  name: varchar("name", { length: 100 }).notNull().unique(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  description: varchar("description", { length: 1500 }),
  opportunityTypeId: integer("opportunity_type_id").notNull().references(() => opportunityTypes.id),
  opportunityStageId: integer("opportunity_stage_id").notNull().references(() => opportunityStages.id),
  amount: currency("amount"),
  probability: integer("probability"),
  expectedRevenue: currency("expected_revenue"),
  closeOn: timestamp("close_on"),
  ...audit,
});

export const orders = pgTable("order", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  code: varchar("code", { length: 10 }).notNull().unique(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  opportunityId: integer("opportunity_id").references(() => opportunities.id, { onDelete: "restrict" }),
  totalAmount: currency("total_amount").notNull().default(0),
  orderStatusId: integer("order_status_id").notNull().references(() => orderStatuses.id),
  expectedClosedOn: date("expected_closed_on"),
  requiredOn: timestamp("required_on"),
  shippedOn: timestamp("shipped_on"),
  ...audit,
});

export const orderItems = pgTable("order_item", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  discount: integer("discount").notNull().default(0),
  amount: currency("amount").notNull().default(0),
  ...audit,
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, { fields: [products.categoryId], references: [productCategories.id] }),
  model: one(models, { fields: [products.modelId], references: [models.id] }),
  features: many(productFeatures),
  pictures: many(productPictures),
}));
export const modelsRelations = relations(models, ({ one }) => ({ brand: one(brands, { fields: [models.brandId], references: [brands.id] }) }));
export const productFeaturesRelations = relations(productFeatures, ({ one }) => ({
  product: one(products, { fields: [productFeatures.productId], references: [products.id] }),
}));
export const productPicturesRelations = relations(productPictures, ({ one }) => ({
  product: one(products, { fields: [productPictures.productId], references: [products.id] }),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  account: one(accounts, { fields: [orders.accountId], references: [accounts.id] }),
  opportunity: one(opportunities, { fields: [orders.opportunityId], references: [opportunities.id] }),
  status: one(orderStatuses, { fields: [orders.orderStatusId], references: [orderStatuses.id] }),
  creator: one(users, { fields: [orders.createdBy], references: [users.id] }),
  items: many(orderItems),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  country: one(countries, { fields: [accounts.countryId], references: [countries.id] }),
  orders: many(orders),
  opportunities: many(opportunities),
}));
export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  account: one(accounts, { fields: [opportunities.accountId], references: [accounts.id] }),
  stage: one(opportunityStages, { fields: [opportunities.opportunityStageId], references: [opportunityStages.id] }),
  type: one(opportunityTypes, { fields: [opportunities.opportunityTypeId], references: [opportunityTypes.id] }),
  orders: many(orders),
}));
