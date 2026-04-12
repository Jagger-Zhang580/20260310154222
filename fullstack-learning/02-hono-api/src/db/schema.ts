/**
 * Drizzle ORM - 数据库 Schema 定义
 * 
 * 学习要点:
 * 1. Drizzle: SQL-like 语法，类型安全，零运行时开销
 * 2. 对比 Prisma: 更轻量、更接近 SQL、编译更快
 * 3. pgTable 定义表，relations 定义关系
 * 4. 自动推导 TypeScript 类型
 */
import { pgTable, varchar, text, timestamp, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============ Enums ============
export const roleEnum = pgEnum('role', ['super_admin', 'admin', 'editor', 'viewer'])
export const statusEnum = pgEnum('status', ['active', 'inactive'])
export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived'])

// ============ 用户表 ============
export const users = pgTable('users', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').default('viewer').notNull(),
  avatar: varchar('avatar', { length: 500 }),
  status: statusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============ 文章表 ============
export const posts = pgTable('posts', {
  id: varchar('id', { length: 32 }).primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  summary: varchar('summary', { length: 500 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  status: postStatusEnum('status').default('draft').notNull(),
  authorId: varchar('author_id', { length: 32 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============ 评论表 ============
export const comments = pgTable('comments', {
  id: varchar('id', { length: 32 }).primaryKey(),
  content: text('content').notNull(),
  postId: varchar('post_id', { length: 32 }).notNull().references(() => posts.id),
  userId: varchar('user_id', { length: 32 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============ 角色权限表 (RBAC) ============
export const permissions = pgTable('permissions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  role: roleEnum('role').notNull(),
  action: varchar('action', { length: 20 }).notNull(),  // create/read/update/delete/manage
  subject: varchar('subject', { length: 50 }).notNull(), // User/Post/Comment/Settings
  conditions: jsonb('conditions'),                        // 条件 (如 { authorId: "${user.id}" })
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============ 操作日志表 ============
export const auditLogs = pgTable('audit_logs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar('user_id', { length: 32 }),
  action: varchar('action', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  details: jsonb('details'),
  ip: varchar('ip', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============ 关系定义 ============
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}))

// ============ 自动推导类型 ============
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
