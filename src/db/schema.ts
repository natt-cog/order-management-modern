import {
  pgTable, serial, integer, bigserial, bigint, text, varchar, boolean, numeric, timestamp, date, customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });
const audit = {
  createdBy: integer("created_by"),
  createdOn: timestamp("created_on", { mode: "date" }).defaultNow(),
  updatedBy: integer("updated_by"),
  updatedOn: timestamp("updated_on", { mode: "date" }),
};

// (System) User + role grants (OutSystems Users provider equivalent)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 250 }).notNull().unique(),
  email: varchar("email", { length: 250 }),
  passwordHash: text("password_hash"),
  isActive: boolean("is_active").notNull().default(true),
});
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 50 }).notNull(), // OrderManager | OrderRepresentative
});

export const siteProperties = pgTable("site_properties", {
  name: varchar("name", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
});

export const countries = pgTable("country", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...audit,
});

export const accounts = pgTable("account", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  company: varchar("company", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  contact: varchar("contact", { length: 100 }).notNull(),
  countryId: bigint("country_id", { mode: "number" }).references(() => countries.id),
  address: varchar("address", { length: 250 }),
  city: varchar("city", { length: 50 }),
  postalCode: varchar("postal_code", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 250 }),
  ...audit,
});

export const opportunityStages = pgTable("opportunity_stage", {
  id: integer("id").primaryKey(),
  identifier: varchar("identifier", { length: 50 }).notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  order: integer("order").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});
export const opportunityTypes = pgTable("opportunity_type", {
  id: integer("id").primaryKey(),
  identifier: varchar("identifier", { length: 50 }).notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  order: integer("order").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const opportunities = pgTable("opportunity", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  name: varchar("name", { length: 100 }).notNull(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  description: varchar("description", { length: 1500 }),
  opportunityTypeId: integer("opportunity_type_id").notNull().references(() => opportunityTypes.id),
  opportunityStageId: integer("opportunity_stage_id").notNull().references(() => opportunityStages.id),
  amount: numeric("amount", { precision: 37, scale: 8 }),
  probability: numeric("probability", { precision: 2, scale: 0 }),
  expectedRevenue: numeric("expected_revenue", { precision: 37, scale: 8 }),
  closeOn: timestamp("close_on", { mode: "date" }),
  ...audit,
});

export const orderStatuses = pgTable("order_status", {
  id: integer("id").primaryKey(),
  identifier: varchar("identifier", { length: 50 }).notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  order: integer("order").notNull(),
  description: varchar("description", { length: 200 }),
  iconName: varchar("icon_name", { length: 50 }),
  colorRgb: varchar("color_rgb", { length: 50 }),
});

export const brands = pgTable("brand", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  ...audit,
});
export const models = pgTable("model", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  brandId: bigint("brand_id", { mode: "number" }).notNull().references(() => brands.id),
  isActive: boolean("is_active").default(true),
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
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 250 }).notNull(),
  description: varchar("description", { length: 1000 }),
  categoryId: integer("category_id").notNull().references(() => productCategories.id),
  modelId: bigint("model_id", { mode: "number" }).references(() => models.id),
  price: numeric("price", { precision: 37, scale: 8 }).notNull(),
  discount: numeric("discount", { precision: 37, scale: 8 }),
  stock: integer("stock"),
  reference: varchar("reference", { length: 50 }),
  ean: varchar("ean", { length: 50 }),
  weight: varchar("weight", { length: 50 }),
  dimensions: varchar("dimensions", { length: 150 }),
  isActive: boolean("is_active").default(true),
  reorderLevel: integer("reorder_level"),
  ...audit,
});
export const productFeatures = pgTable("product_feature", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
  ...audit,
});
export const productPictures = pgTable("product_picture", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 250 }),
  filetype: varchar("filetype", { length: 150 }),
  file: bytea("file"),
  isCover: boolean("is_cover").default(false),
  isActive: boolean("is_active").default(true),
  ...audit,
});

export const orders = pgTable("order", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  code: varchar("code", { length: 10 }).notNull(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  opportunityId: integer("opportunity_id").references(() => opportunities.id),
  totalAmount: numeric("total_amount", { precision: 37, scale: 8 }).default("0"),
  orderStatusId: integer("order_status_id").notNull().references(() => orderStatuses.id),
  expectedClosedOn: date("expected_closed_on", { mode: "string" }),
  requiredOn: timestamp("required_on", { mode: "date" }),
  shippedOn: timestamp("shipped_on", { mode: "date" }),
  ...audit,
});
export const orderItems = pgTable("order_item", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  discount: numeric("discount", { precision: 2, scale: 0 }),
  amount: numeric("amount", { precision: 37, scale: 8 }),
  ...audit,
});
