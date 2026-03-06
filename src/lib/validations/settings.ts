import { storeSettings } from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const settingSchema = createInsertSchema(storeSettings);

export type StoreSettingType = z.infer<typeof settingSchema>;

export const validateStoreSettings = async (data: unknown) => {
  return settingSchema.safeParse(data);
};
