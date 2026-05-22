import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role", {
    enum: ["admin", "retoucher", "hirer"],
  }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").default("datetime('now')"),
})

export const workEntries = sqliteTable("work_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  retoucherId: integer("retoucher_id")
    .notNull()
    .references(() => users.id),
  hirerId: integer("hirer_id").references(() => users.id),
  title: text("title").notNull(),
  originalFilename: text("original_filename").notNull(),
  imagePath: text("image_path"),
  editingType: text("editing_type").notNull(),
  price: real("price").notNull(),
  folder: text("folder"),
  privateNotes: text("private_notes"),
  amountPaid: real("amount_paid").default(0),
  paymentStatus: text("payment_status", {
    enum: ["unpaid", "partial", "paid"],
  })
    .notNull()
    .default("unpaid"),
  expectedDelivery: text("expected_delivery").notNull(),
  status: text("status", { enum: ["in-progress", "completed"] })
    .notNull()
    .default("in-progress"),
  createdAt: text("created_at").default("datetime('now')"),
  updatedAt: text("updated_at").default("datetime('now')"),
})

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workEntryId: integer("work_entry_id")
    .notNull()
    .references(() => workEntries.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  paidAt: text("paid_at").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").default("datetime('now')"),
})

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  message: text("message").notNull(),
  link: text("link"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default("datetime('now')"),
})

export const workTypes = sqliteTable("work_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").default("datetime('now')"),
})

export const folderNotes = sqliteTable("folder_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  folder: text("folder").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: text("created_at").default("datetime('now')"),
  updatedAt: text("updated_at").default("datetime('now')"),
})

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workEntryId: integer("work_entry_id")
    .notNull()
    .references(() => workEntries.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: text("created_at").default("datetime('now')"),
})
