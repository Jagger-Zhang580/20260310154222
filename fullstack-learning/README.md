# 全栈前后端分离学习系统

## 技术架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          前端渲染层 (CSR/SSR)                           │
│                                                                         │
│   ┌──────────────────────┐    ┌──────────────────────┐                 │
│   │  方案A: React 生态    │    │  方案B: Vue 生态      │                 │
│   │  Next.js 15 (App)    │    │  Nuxt 4              │                 │
│   │  React 19            │    │  Vue 3.5              │                 │
│   │  shadcn/ui           │    │  Element Plus         │                 │
│   │  TailwindCSS v4      │    │  UnoCSS              │                 │
│   │  Zustand             │    │  Pinia                │                 │
│   │  @casl/ability       │    │  @casl/vue            │                 │
│   └──────────────────────┘    └──────────────────────┘                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTP / WebSocket
┌────────────────────────────────┼────────────────────────────────────────┐
│                          后端 API 层 (BFF)                              │
│                                                                         │
│   ┌──────────────────────┐    ┌──────────────────────┐                 │
│   │  方案A: Node.js 生态  │    │  方案B: Python 生态   │                 │
│   │  Hono (Web框架)      │    │  FastAPI              │                 │
│   │  Drizzle ORM         │    │  SQLAlchemy 2.0      │                 │
│   │  JWT + RBAC          │    │  JWT + RBAC          │                 │
│   │  Zod 验证            │    │  Pydantic v2         │                 │
│   │  tRPC (类型安全API)   │    │  OpenAPI 自动文档     │                 │
│   └──────────────────────┘    └──────────────────────┘                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                          数据存储层                                      │
│                                                                         │
│   PostgreSQL          Redis           MinIO            Meilisearch      │
│   (主数据库)          (缓存/Session)  (对象存储)        (全文搜索)        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 学习路径

| 阶段 | 内容 | 技术点 |
|------|------|--------|
| 1 | 前端基础 | React 19 / Vue 3 + TypeScript |
| 2 | 前端框架 | Next.js 15 App Router / Nuxt 4 |
| 3 | UI 组件库 | shadcn/ui + Radix / Element Plus |
| 4 | 状态管理 | Zustand / Pinia |
| 5 | 权限控制 | @casl/ability 前端权限 |
| 6 | 后端 API | Hono / FastAPI |
| 7 | ORM | Drizzle ORM / SQLAlchemy 2.0 |
| 8 | 验证 | Zod / Pydantic v2 |
| 9 | 认证授权 | JWT + RBAC + CASL |
| 10 | 类型安全 API | tRPC / OpenAPI |

## 技术选型亮点

### 为什么选这些新技术？

| 技术 | 版本 | 为什么选它 |
|------|------|-----------|
| **Next.js 15** | 2025 | App Router + Server Actions + PPR(部分预渲染) |
| **React 19** | 2025 | use() hook + Server Components + Actions |
| **Hono** | v4 | 超轻量、边缘计算友好、TypeScript 优先 |
| **Drizzle ORM** | 2025 | 类型安全、SQL-like 语法、零运行时开销 |
| **shadcn/ui** | 2025 | 不是组件库而是代码，完全可控 |
| **CASL** | v6 | 前后端统一权限模型，细粒度控制 |
| **Zod** | v3 | TypeScript 优先的验证库，前后端共享 |
| **tRPC** | v11 | 端到端类型安全，无需写 API 文档 |
| **FastAPI** | 0.115 | Python 最快的异步框架，自动 OpenAPI |
| **Pydantic** | v2 | Rust 内核，比 v1 快 5-50x |
| **TailwindCSS** | v4 | Oxide 引擎，构建速度 10x 提升 |

## 项目结构

```
fullstack-learning/
├── README.md                    # 本文件
├── docker-compose.yml           # 全栈编排
├── 01-react-next/               # React + Next.js 前端
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   ├── components/          # UI组件
│   │   ├── lib/                 # 工具库
│   │   └── stores/              # Zustand 状态
│   ├── package.json
│   └── tsconfig.json
├── 02-hono-api/                 # Hono 后端 API
│   ├── src/
│   │   ├── routes/              # API 路由
│   │   ├── middleware/          # 中间件(JWT/RBAC)
│   │   ├── db/                  # Drizzle ORM
│   │   └── schema/              # Zod 验证
│   ├── drizzle.config.ts
│   └── package.json
├── 03-vue-nuxt/                 # Vue + Nuxt 前端
├── 04-fastapi/                  # FastAPI 后端
├── 05-shared/                   # 前后端共享代码
│   ├── permissions/             # CASL 权限定义
│   ├── types/                   # TypeScript 类型
│   └── schemas/                 # Zod 验证 Schema
└── guides/                      # 学习指南
    ├── 01-frontend-basics.md
    ├── 02-nextjs-app-router.md
    ├── 03-hono-api.md
    ├── 04-drizzle-orm.md
    ├── 05-auth-rbac.md
    └── 06-trpc-typesafe.md
```

## 快速开始

```bash
# 启动所有服务
docker compose up -d

# React 前端 → http://localhost:3001
# Vue 前端   → http://localhost:3002
# Hono API   → http://localhost:3003
# FastAPI    → http://localhost:3004
# PostgreSQL → localhost:5433
# Redis      → localhost:6380
```
