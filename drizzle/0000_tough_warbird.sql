CREATE TABLE "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"contact" varchar(100) NOT NULL,
	"country_id" integer,
	"address" varchar(250),
	"city" varchar(50),
	"postal_code" varchar(50),
	"phone" varchar(20),
	"email" varchar(250),
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp,
	CONSTRAINT "account_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "brand" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE "country" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"brand_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE "opportunity" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"name" varchar(100) NOT NULL,
	"account_id" integer NOT NULL,
	"description" varchar(1500),
	"opportunity_type_id" integer NOT NULL,
	"opportunity_stage_id" integer NOT NULL,
	"amount" numeric(37, 8),
	"probability" integer,
	"expected_revenue" numeric(37, 8),
	"close_on" timestamp,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp,
	CONSTRAINT "opportunity_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "opportunity_stage" (
	"id" integer PRIMARY KEY NOT NULL,
	"identifier" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "opportunity_stage_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "opportunity_type" (
	"id" integer PRIMARY KEY NOT NULL,
	"identifier" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "opportunity_type_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"amount" numeric(37, 8) DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_status" (
	"id" integer PRIMARY KEY NOT NULL,
	"identifier" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"description" varchar(200),
	"color_rgb" varchar(50),
	CONSTRAINT "order_status_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"code" varchar(10) NOT NULL,
	"account_id" integer NOT NULL,
	"opportunity_id" integer,
	"total_amount" numeric(37, 8) DEFAULT 0 NOT NULL,
	"order_status_id" integer NOT NULL,
	"expected_closed_on" date,
	"required_on" timestamp,
	"shipped_on" timestamp,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp,
	CONSTRAINT "order_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "product_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10),
	"name" varchar(50) NOT NULL,
	"description" varchar(250),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_feature" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"description" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_picture" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"filename" varchar(250),
	"filetype" varchar(150),
	"file" "bytea",
	"is_cover" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" varchar(1000),
	"category_id" integer NOT NULL,
	"model_id" integer,
	"price" numeric(37, 8) NOT NULL,
	"discount" numeric(37, 8),
	"stock" integer DEFAULT 0 NOT NULL,
	"reference" varchar(50),
	"ean" varchar(50),
	"weight" varchar(50),
	"dimensions" varchar(150),
	"reorder_level" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_on" timestamp,
	CONSTRAINT "product_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(250) NOT NULL,
	"name" varchar(250) NOT NULL,
	"email" varchar(250),
	"password_hash" text NOT NULL,
	"role" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_country_id_country_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."country"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand" ADD CONSTRAINT "brand_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand" ADD CONSTRAINT "brand_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model" ADD CONSTRAINT "model_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model" ADD CONSTRAINT "model_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model" ADD CONSTRAINT "model_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity" ADD CONSTRAINT "opportunity_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity" ADD CONSTRAINT "opportunity_opportunity_type_id_opportunity_type_id_fk" FOREIGN KEY ("opportunity_type_id") REFERENCES "public"."opportunity_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity" ADD CONSTRAINT "opportunity_opportunity_stage_id_opportunity_stage_id_fk" FOREIGN KEY ("opportunity_stage_id") REFERENCES "public"."opportunity_stage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity" ADD CONSTRAINT "opportunity_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity" ADD CONSTRAINT "opportunity_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_opportunity_id_opportunity_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_order_status_id_order_status_id_fk" FOREIGN KEY ("order_status_id") REFERENCES "public"."order_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_feature" ADD CONSTRAINT "product_feature_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_feature" ADD CONSTRAINT "product_feature_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_feature" ADD CONSTRAINT "product_feature_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_picture" ADD CONSTRAINT "product_picture_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_picture" ADD CONSTRAINT "product_picture_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_picture" ADD CONSTRAINT "product_picture_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_product_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_model_id_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."model"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;