CREATE TABLE IF NOT EXISTS "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"contact" varchar(100) NOT NULL,
	"country_id" bigint,
	"address" varchar(250),
	"city" varchar(50),
	"postal_code" varchar(50),
	"phone" varchar(20),
	"email" varchar(250),
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "country" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"brand_id" bigint NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(100) NOT NULL,
	"account_id" integer NOT NULL,
	"description" varchar(1500),
	"opportunity_type_id" integer NOT NULL,
	"opportunity_stage_id" integer NOT NULL,
	"amount" numeric(37, 8),
	"probability" numeric(2, 0),
	"expected_revenue" numeric(37, 8),
	"close_on" timestamp,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_stage" (
	"id" integer PRIMARY KEY NOT NULL,
	"identifier" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_type" (
	"id" integer PRIMARY KEY NOT NULL,
	"identifier" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"discount" numeric(2, 0),
	"amount" numeric(37, 8),
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_status" (
	"id" integer PRIMARY KEY NOT NULL,
	"identifier" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"description" varchar(200),
	"icon_name" varchar(50),
	"color_rgb" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"code" varchar(10) NOT NULL,
	"account_id" integer NOT NULL,
	"opportunity_id" integer,
	"total_amount" numeric(37, 8) DEFAULT '0',
	"order_status_id" integer NOT NULL,
	"expected_closed_on" date,
	"required_on" timestamp,
	"shipped_on" timestamp,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10),
	"name" varchar(50) NOT NULL,
	"description" varchar(250),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_feature" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"description" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_picture" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"filename" varchar(250),
	"filetype" varchar(150),
	"file" "bytea",
	"is_cover" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" varchar(1000),
	"category_id" integer NOT NULL,
	"model_id" bigint,
	"price" numeric(37, 8) NOT NULL,
	"discount" numeric(37, 8),
	"stock" integer,
	"reference" varchar(50),
	"ean" varchar(50),
	"weight" varchar(50),
	"dimensions" varchar(150),
	"is_active" boolean DEFAULT true,
	"reorder_level" integer,
	"created_by" integer,
	"created_on" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_properties" (
	"name" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"username" varchar(250) NOT NULL,
	"email" varchar(250),
	"password_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_country_id_country_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."country"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model" ADD CONSTRAINT "model_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity" ADD CONSTRAINT "opportunity_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity" ADD CONSTRAINT "opportunity_opportunity_type_id_opportunity_type_id_fk" FOREIGN KEY ("opportunity_type_id") REFERENCES "public"."opportunity_type"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "opportunity" ADD CONSTRAINT "opportunity_opportunity_stage_id_opportunity_stage_id_fk" FOREIGN KEY ("opportunity_stage_id") REFERENCES "public"."opportunity_stage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order" ADD CONSTRAINT "order_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order" ADD CONSTRAINT "order_opportunity_id_opportunity_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunity"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order" ADD CONSTRAINT "order_order_status_id_order_status_id_fk" FOREIGN KEY ("order_status_id") REFERENCES "public"."order_status"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_feature" ADD CONSTRAINT "product_feature_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_picture" ADD CONSTRAINT "product_picture_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product" ADD CONSTRAINT "product_category_id_product_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product" ADD CONSTRAINT "product_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
