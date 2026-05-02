CREATE TYPE "product_audit_action" AS ENUM('create', 'update', 'delete', 'hard_delete', 'restore', 'stock_adjustment');

CREATE TABLE "product_audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "action" "product_audit_action" NOT NULL,
  "changes" jsonb,
  "snapshot" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "product_audit_logs_product_id_idx" ON "product_audit_logs" ("product_id");
CREATE INDEX "product_audit_logs_user_id_idx" ON "product_audit_logs" ("user_id");
CREATE INDEX "product_audit_logs_created_at_idx" ON "product_audit_logs" ("created_at");
