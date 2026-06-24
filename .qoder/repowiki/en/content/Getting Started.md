# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [drizzle.config.ts](file://drizzle.config.ts)
- [src/drizzle/schema.ts](file://src/drizzle/schema.ts)
- [src/lib/db.ts](file://src/lib/db.ts)
- [next.config.ts](file://next.config.ts)
- [src/app/layout.tsx](file://src/app/layout.tsx)
- [src/app/login/page.tsx](file://src/app/login/page.tsx)
- [src/services/authService.ts](file://src/services/authService.ts)
- [src/hooks/use-auth.ts](file://src/hooks/use-auth.ts)
- [src/components/ui/button.tsx](file://src/components/ui/button.tsx)
- [src/app/api/auth/register/route.ts](file://src/app/api/auth/register/route.ts)
- [src/app/api/auth/login/route.ts](file://src/app/api/auth/login/route.ts)
- [src/app/api/settings/route.ts](file://src/app/api/settings/route.ts)
- [src/app/dashboard/page.tsx](file://src/app/dashboard/page.tsx)
- [src/app/api/products/route.ts](file://src/app/api/products/route.ts)
- [src/app/api/customers/route.ts](file://src/app/api/customers/route.ts)
- [src/app/api/suppliers/route.ts](file://src/app/api/suppliers/route.ts)
- [src/app/api/categories/route.ts](file://src/app/api/categories/route.ts)
- [src/app/api/units/route.ts](file://src/app/api/units/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Development Environment Setup](#development-environment-setup)
5. [First Run](#first-run)
6. [Architecture Overview](#architecture-overview)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Verification Checklist](#verification-checklist)
9. [Next Steps](#next-steps)

## Introduction
This guide helps you set up and run the Point of Sale (POS) application locally. It covers prerequisites, installation via pnpm, environment configuration, database setup, and first-run procedures. The application is a Next.js-based web app with TypeScript, featuring modular APIs, Drizzle ORM for database operations, and a modern UI built with shadcn/ui components.

## Prerequisites
Before installing, ensure your system meets these requirements:

- **Node.js**: Version 18.x or later is recommended for compatibility with Next.js and modern toolchains.
- **PostgreSQL**: Version 12 or higher. The application uses Drizzle ORM migrations to manage schema updates.
- **pnpm**: Package manager used for dependency management in this project.
- **Git**: For cloning the repository.

Environment variables are required for database connectivity and application behavior. The minimal required variables include:
- DATABASE_URL: PostgreSQL connection string (format: postgresql://user:password@host:port/dbname)
- NEXT_PUBLIC_APP_ENV: Application environment (development, production)
- NEXTAUTH_SECRET: Secret key for NextAuth sessions
- NEXT_PUBLIC_APP_URL: Public URL for the application (used for redirects and emails)

These variables are referenced across the application for database connections and authentication.

**Section sources**
- [package.json:1-200](file://package.json#L1-L200)
- [src/lib/db.ts:1-120](file://src/lib/db.ts#L1-L120)
- [src/app/api/auth/register/route.ts:1-120](file://src/app/api/auth/register/route.ts#L1-L120)
- [src/app/api/auth/login/route.ts:1-120](file://src/app/api/auth/login/route.ts#L1-L120)

## Installation
Follow these steps to install the application:

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/pos-app.git
   cd pos-app
   ```

2. **Install dependencies using pnpm**
   ```bash
   pnpm install
   ```

3. **Verify installation**
   After installation completes, confirm that all dependencies resolve correctly and the build toolchain is ready.

Notes:
- This project uses pnpm workspaces and a monorepo-like structure. Ensure pnpm is installed globally and compatible with the workspace configuration.
- If you encounter permission errors during installation, review your pnpm and npm cache permissions.

**Section sources**
- [package.json:1-200](file://package.json#L1-L200)
- [pnpm-workspace.yaml:1-200](file://pnpm-workspace.yaml#L1-L200)

## Development Environment Setup
Configure your local development environment:

1. **Set up PostgreSQL**
   - Install PostgreSQL 12+.
   - Create a database and user with appropriate privileges.
   - Construct a connection string in the format: `postgresql://user:password@host:port/dbname`.

2. **Configure environment variables**
   Create a `.env.local` file in the project root with the following keys:
   - DATABASE_URL
   - NEXT_PUBLIC_APP_ENV
   - NEXTAUTH_SECRET
   - NEXT_PUBLIC_APP_URL

   These variables are consumed by the database client and authentication layer.

3. **Run database migrations**
   Apply schema migrations using Drizzle Kit:
   ```bash
   npx drizzle-kit migrate
   ```
   This creates tables defined in the schema and applies incremental changes tracked by migration snapshots.

4. **Start the development server**
   ```bash
   pnpm dev
   ```
   The application starts on the port specified in the Next.js configuration (commonly 3000).

5. **Access the application**
   Open http://localhost:3000 in your browser. You should see the login page.

**Section sources**
- [drizzle.config.ts:1-200](file://drizzle.config.ts#L1-L200)
- [src/drizzle/schema.ts:1-200](file://src/drizzle/schema.ts#L1-L200)
- [src/lib/db.ts:1-120](file://src/lib/db.ts#L1-L120)
- [next.config.ts:1-200](file://next.config.ts#L1-L200)

## First Run
Complete the initial setup after the development server is running:

1. **Open the application**
   Navigate to http://localhost:3000.

2. **Register the first admin user**
   - Go to the registration endpoint handled by the auth API.
   - Submit the registration form with your desired credentials.
   - The backend validates inputs and creates the user record.

3. **Log in**
   - Use the credentials from registration to log in via the login endpoint.
   - Authentication integrates with NextAuth and session management.

4. **Initial system configuration**
   - Access the settings API to configure store settings and tax configurations.
   - Configure units, categories, and initial master data (products, customers, suppliers) via their respective endpoints.

5. **Explore the dashboard**
   - After logging in, the dashboard page loads and displays summary metrics and navigation to modules.

Verification steps:
- Confirm successful login by accessing protected routes.
- Verify that the dashboard renders without errors.
- Test CRUD operations for master data (products, customers, suppliers, categories, units).

**Section sources**
- [src/app/api/auth/register/route.ts:1-120](file://src/app/api/auth/register/route.ts#L1-L120)
- [src/app/api/auth/login/route.ts:1-120](file://src/app/api/auth/login/route.ts#L1-L120)
- [src/app/api/settings/route.ts:1-120](file://src/app/api/settings/route.ts#L1-L120)
- [src/app/dashboard/page.tsx:1-120](file://src/app/dashboard/page.tsx#L1-L120)
- [src/app/api/products/route.ts:1-120](file://src/app/api/products/route.ts#L1-L120)
- [src/app/api/customers/route.ts:1-120](file://src/app/api/customers/route.ts#L1-L120)
- [src/app/api/suppliers/route.ts:1-120](file://src/app/api/suppliers/route.ts#L1-L120)
- [src/app/api/categories/route.ts:1-120](file://src/app/api/categories/route.ts#L1-L120)
- [src/app/api/units/route.ts:1-120](file://src/app/api/units/route.ts#L1-L120)

## Architecture Overview
The application follows a layered architecture:
- Frontend: Next.js App Router pages and React components.
- Services: API handlers under src/app/api/* implementing REST-style endpoints.
- Data Access: Drizzle ORM with schema definitions and migrations.
- Authentication: NextAuth-based authentication integrated with API routes.
- UI Components: Reusable components built with shadcn/ui primitives.

```mermaid
graph TB
subgraph "Frontend"
UI["Next.js Pages<br/>and Components"]
end
subgraph "Backend"
API["API Handlers<br/>(src/app/api/*)"]
AUTH["Auth Service<br/>(src/services/authService.ts)"]
DB["Drizzle ORM<br/>(src/lib/db.ts)"]
SCHEMA["Schema & Migrations<br/>(src/drizzle/schema.ts, drizzle.config.ts)"]
end
UI --> API
API --> AUTH
API --> DB
DB --> SCHEMA
```

**Diagram sources**
- [src/app/layout.tsx:1-120](file://src/app/layout.tsx#L1-L120)
- [src/services/authService.ts:1-120](file://src/services/authService.ts#L1-L120)
- [src/lib/db.ts:1-120](file://src/lib/db.ts#L1-L120)
- [src/drizzle/schema.ts:1-120](file://src/drizzle/schema.ts#L1-L120)
- [drizzle.config.ts:1-120](file://drizzle.config.ts#L1-L120)

## Troubleshooting Guide
Common setup issues and resolutions:

- **Database connection fails**
  - Verify DATABASE_URL format and credentials.
  - Ensure PostgreSQL is running and accepts connections on the specified host/port.
  - Check firewall and network policies if connecting remotely.

- **pnpm install fails**
  - Clear pnpm store and cache if corrupted.
  - Use a stable Node.js version (18.x recommended).
  - Retry installation after resolving permission issues.

- **Migrations fail**
  - Confirm DATABASE_URL points to the correct database.
  - Review migration snapshots and logs for errors.
  - Re-run migrations after fixing schema inconsistencies.

- **Authentication errors**
  - Ensure NEXTAUTH_SECRET is set and sufficiently random.
  - Verify NEXT_PUBLIC_APP_URL matches the deployed/public URL.
  - Check session storage and cookies in the browser.

- **Build or runtime errors**
  - Clean Next.js cache and recompile.
  - Validate TypeScript configuration and module resolution.
  - Check for missing environment variables at runtime.

**Section sources**
- [src/lib/db.ts:1-120](file://src/lib/db.ts#L1-L120)
- [src/services/authService.ts:1-120](file://src/services/authService.ts#L1-L120)
- [drizzle.config.ts:1-120](file://drizzle.config.ts#L1-L120)

## Verification Checklist
After completing setup, verify the installation:

- [ ] Application starts without errors on the configured port.
- [ ] Database migrations apply successfully.
- [ ] Registration endpoint accepts new user creation.
- [ ] Login endpoint authenticates users and establishes sessions.
- [ ] Dashboard loads and displays navigation.
- [ ] Master data endpoints (products, customers, suppliers, categories, units) are accessible.
- [ ] Settings endpoint allows configuration updates.
- [ ] UI components render correctly without console errors.

## Next Steps
- Explore module-specific APIs for sales, purchases, reports, and operational costs.
- Customize UI components and integrate additional payment methods.
- Set up automated deployments and monitoring.
- Add tests for critical business logic and API endpoints.