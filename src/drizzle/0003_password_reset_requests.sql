CREATE TYPE "password_reset_status" AS ENUM ('pending', 'completed', 'rejected');

CREATE TABLE "password_reset_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "email" text NOT NULL,
  "status" "password_reset_status" DEFAULT 'pending' NOT NULL,
  "requested_at" timestamp DEFAULT now() NOT NULL,
  "resolved_at" timestamp,
  "resolved_by" integer
);

ALTER TABLE "password_reset_requests"
ADD CONSTRAINT "password_reset_requests_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

ALTER TABLE "password_reset_requests"
ADD CONSTRAINT "password_reset_requests_resolved_by_users_id_fk"
FOREIGN KEY ("resolved_by") REFERENCES "users"("id");

CREATE INDEX "password_reset_requests_status_idx"
ON "password_reset_requests" ("status");
