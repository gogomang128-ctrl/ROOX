CREATE TABLE "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sender" text NOT NULL,
	"body" text NOT NULL,
	"read_by_admin" boolean DEFAULT false NOT NULL,
	"read_by_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_no" text NOT NULL,
	"user_id" integer NOT NULL,
	"username" text NOT NULL,
	"public_id" text NOT NULL,
	"roblox_username" text DEFAULT '' NOT NULL,
	"items" jsonb NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_ref" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_invoice_no_unique" UNIQUE("invoice_no")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'robux' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"old_price" numeric(12, 2),
	"image_url" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"username" text NOT NULL,
	"username_key" text NOT NULL,
	"password_hash" text NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "users_username_key_unique" UNIQUE("username_key")
);
--> statement-breakpoint
CREATE TABLE "wallet_tx" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"balance_after" numeric(12, 2) NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
