import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define image format types
export const imageFormatEnum = z.enum([
  'jpeg', 'jpg', 'png', 'gif', 'webp', 'svg', 'avif', 
  'bmp', 'ico', 'tiff', 'heic', 'heif', 'unknown'
]);

export type ImageFormat = z.infer<typeof imageFormatEnum>;

// Image schema to represent extracted images with enhanced metadata
export const imageSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  size: z.number().optional(),
  type: z.string().optional(), // MIME type
  format: imageFormatEnum.optional().default('unknown'),
  alt: z.string().optional(),
  selected: z.boolean().optional().default(true),
  sourceType: z.enum(['img', 'background', 'svg', 'picture', 'canvas', 'iframe', 'other']).optional().default('img'),
  mimeType: z.string().optional(),
  aspectRatio: z.number().optional(),
  isResponsive: z.boolean().optional(),
  isLazyLoaded: z.boolean().optional(),
  dataSrc: z.string().optional(), // For lazy-loaded images
  originalElement: z.string().optional(), // HTML snippet of original element
});

export const extractRequestSchema = z.object({
  url: z.string().url(),
});

export type Image = z.infer<typeof imageSchema>;
export type ExtractRequest = z.infer<typeof extractRequestSchema>;
