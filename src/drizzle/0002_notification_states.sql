CREATE TABLE "notification_states" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "notification_id" varchar(255) NOT NULL,
  "read_at" timestamp,
  "dismissed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "notification_states"
ADD CONSTRAINT "notification_states_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

CREATE UNIQUE INDEX "notification_states_user_notification_uidx"
ON "notification_states" ("user_id", "notification_id");

CREATE INDEX "notification_states_user_idx"
ON "notification_states" ("user_id");
