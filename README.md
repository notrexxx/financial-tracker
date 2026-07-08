# Enterprise Financial Tracker (SaaS)

A wealth and budget monitoring dashboard engineered to ingest thousands of transactions, calculate historical trends via advanced SQL aggregation, and fetch real-time market data through background task scheduling.

## 🏗️ Architecture & Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, shadcn/ui, Recharts.
- **Backend:** NestJS, TypeScript, TypeORM, `@nestjs/schedule` (Cron Jobs).
- **Database:** Neon.tech Serverless PostgreSQL.
- **Deployment:** Vercel (Web), Render (API).

## 🚀 Core Functionality

1. **Task Scheduling (Cron Jobs):** Automated background processes that fetch and synchronize the latest currency exchange rates at midnight.
2. **Database-Level Aggregation:** Utilizing `GROUP BY`, `SUM`, and `AVG` SQL functions to process massive datasets directly on the server, ensuring the frontend only ever receives lightweight, calculated JSON payloads.
3. **Data Seeding & Benchmarking:** Built-in scripting to instantly generate 10,000+ realistic transaction records to benchmark query optimization.
4. **Multi-Tenant Isolation:** Strict database-level isolation ensuring user data privacy and security.

## 🎨 UI/UX Identity

The dashboard utilizes a strictly professional "Wealth Management" aesthetic, prioritizing trust, data readability, and accessibility over flashy animations. Powered by shadcn/ui for enterprise-grade component architecture.