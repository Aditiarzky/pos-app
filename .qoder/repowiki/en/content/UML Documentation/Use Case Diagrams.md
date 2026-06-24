# Use Case Diagrams

<cite>
**Referenced Files in This Document**
- [uml-use-case.puml](file://docs/uml-use-case.puml)
- [deskripsi-sistem.md](file://docs/deskripsi-sistem.md)
- [kebutuhan-fungsional.md](file://docs/kebutuhan-fungsional.md)
- [system-flow-uml.md](file://docs/system-flow-uml.md)
- [uml-class-functional.puml](file://docs/uml-class-functional.puml)
- [product-service-api](file://src/app/api/products/route.ts)
- [purchase-service-api](file://src/app/api/purchases/route.ts)
- [sale-service-api](file://src/app/api/sales/route.ts)
- [customer-return-service-api](file://src/app/api/customer-returns/route.ts)
- [debt-service-api](file://src/app/api/debts/route.ts)
- [dashboard-service-api](file://src/app/api/dashboard/route.ts)
- [notification-service-api](file://src/app/api/notifications/route.ts)
- [user-service-api](file://src/app/api/users/route.ts)
- [category-service-api](file://src/app/api/categories/route.ts)
- [stock-service-api](file://src/app/api/stock-mutations/route.ts)
- [report-service-api](file://src/app/api/reports/route.ts)
- [auth-login-api](file://src/app/api/auth/login/route.ts)
- [auth-register-api](file://src/app/api/auth/register/route.ts)
- [auth-logout-api](file://src/app/api/auth/logout/route.ts)
- [auth-me-api](file://src/app/api/auth/me/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive use case diagram documentation for the Point of Sale (POS) application. It explains how to interpret use case diagrams, define system boundaries, map functional requirements to use cases, and apply best practices for creating and maintaining use case documentation. The POS system supports cashier transactions, inventory management, purchasing, returns, debt handling, reporting, notifications, and user administration. The diagrams and guidelines here help stakeholders visualize user workflows, actor roles, and system capabilities.

## Project Structure
The POS application is a Next.js-based web application with a modular frontend and a set of REST-like API routes grouped by domain capabilities. The use case documentation references:
- Functional requirement and system description documents
- UML use case diagram source
- Domain-specific API route files that implement use case functionality

```mermaid
graph TB
subgraph "Documentation"
UC["Use Case Diagram<br/>docs/uml-use-case.puml"]
REQ["Functional Requirements<br/>docs/kebutuhan-fungsional.md"]
SYS["System Description<br/>docs/deskripsi-sistem.md"]
FLOW["System Flow Overview<br/>docs/system-flow-uml.md"]
end
subgraph "API Layer"
AUTH["Auth APIs<br/>src/app/api/auth/*"]
INV["Inventory & Products<br/>src/app/api/products/*"]
PUR["Purchases<br/>src/app/api/purchases/*"]
SAL["Sales<br/>src/app/api/sales/*"]
RET["Returns<br/>src/app/api/customer-returns/*"]
DEBT["Debts<br/>src/app/api/debts/*"]
DASH["Dashboard<br/>src/app/api/dashboard/*"]
NOTI["Notifications<br/>src/app/api/notifications/*"]
REP["Reports<br/>src/app/api/reports/*"]
CAT["Categories<br/>src/app/api/categories/*"]
STOCK["Stock Mutations<br/>src/app/api/stock-mutations/*"]
USR["Users<br/>src/app/api/users/*"]
end
REQ --> UC
SYS --> UC
FLOW --> UC
UC --> AUTH
UC --> INV
UC --> PUR
UC --> SAL
UC --> RET
UC --> DEBT
UC --> DASH
UC --> NOTI
UC --> REP
UC --> CAT
UC --> STOCK
UC --> USR
```

**Diagram sources**
- [uml-use-case.puml](file://docs/uml-use-case.puml)
- [kebutuhan-fungsional.md](file://docs/kebutuhan-fungsional.md)
- [deskripsi-sistem.md](file://docs/deskripsi-sistem.md)
- [system-flow-uml.md](file://docs/system-flow-uml.md)

**Section sources**
- [uml-use-case.puml](file://docs/uml-use-case.puml)
- [kebutuhan-fungsional.md](file://docs/kebutuhan-fungsional.md)
- [deskripsi-sistem.md](file://docs/deskripsi-sistem.md)
- [system-flow-uml.md](file://docs/system-flow-uml.md)

## Core Components
This section defines the primary actors and major use cases that structure the POS application’s functional scope. Use cases represent tasks performed by actors to achieve specific goals within the system.

- Actors
  - Cashier: Performs sales transactions, handles returns, and manages daily operations.
  - Manager: Oversees inventory, purchases, reports, and user administration.
  - Administrator: Manages system users, roles, and global configurations.

- Major Use Cases
  - Manage Products (inventory CRUD, variants, audit logs)
  - Manage Categories
  - Manage Units
  - Record Sales Transactions
  - Process Returns
  - Record Purchases
  - Manage Stock Adjustments
  - Track Debts and Payments
  - View Dashboard Analytics
  - Send Notifications
  - Generate Reports
  - Manage Users and Roles
  - Authentication and Session Management

These use cases correspond to domain areas implemented by the API routes and UI pages in the application.

**Section sources**
- [uml-use-case.puml](file://docs/uml-use-case.puml)
- [kebutuhan-fungsional.md](file://docs/kebutuhan-fungsional.md)
- [deskripsi-sistem.md](file://docs/deskripsi-sistem.md)

## Architecture Overview
The POS system follows a layered architecture:
- Presentation layer: Next.js pages and components
- API layer: Route handlers implementing use case logic
- Data layer: Drizzle ORM schema and database tables

Use case diagrams capture the system boundary and show how actors interact with use cases. The API routes implement the behavior behind each use case.

```mermaid
graph TB
CASHIER["Cashier"]
MANAGER["Manager"]
ADMIN["Administrator"]
subgraph "POS System Boundary"
UC_SET["Use Cases"]
end
CASHIER --> UC_SET
MANAGER --> UC_SET
ADMIN --> UC_SET
```

[No sources needed since this diagram shows conceptual architecture, not a direct code mapping]

## Detailed Component Analysis

### Use Case Diagram Interpretation
- System boundary: Defined by the scope of supported use cases (transactions, inventory, purchases, returns, debts, reports, notifications, users).
- Actor roles:
  - Cashier: Initiates sales, returns, and daily operations.
  - Manager: Maintains inventory, reviews reports, and administers users.
  - Administrator: Controls user accounts and system settings.
- Use case relationships:
  - Include: Some use cases rely on others (e.g., Sales may include Inventory Updates).
  - Extend: Optional behavior (e.g., Debt Payment extends Sales).
  - Generalization: Roles may share common capabilities.

Best practices for reading use case diagrams:
- Identify the actor’s goal and the resulting value delivered by the use case.
- Look for included or extended use cases to understand optional or prerequisite steps.
- Verify system boundaries by ensuring all covered functionality maps to implemented API routes.

**Section sources**
- [uml-use-case.puml](file://docs/uml-use-case.puml)

### Use Case-to-API Mapping
Each use case corresponds to one or more API routes that implement the required functionality. The following mapping demonstrates how use cases connect to backend endpoints:

```mermaid
graph LR
subgraph "Use Cases"
UC_SALES["Record Sales Transactions"]
UC_RETURNS["Process Returns"]
UC_PURCHASES["Record Purchases"]
UC_PRODUCTS["Manage Products"]
UC_CATEGORIES["Manage Categories"]
UC_UNITS["Manage Units"]
UC_STOCK["Manage Stock Adjustments"]
UC_DEBTS["Track Debts and Payments"]
UC_DASHBOARD["View Dashboard Analytics"]
UC_NOTIFICATIONS["Send Notifications"]
UC_REPORTS["Generate Reports"]
UC_USERS["Manage Users and Roles"]
UC_AUTH["Authentication and Session Management"]
end
UC_SALES --> SALES_API["Sales API"]
UC_RETURNS --> RETURNS_API["Returns API"]
UC_PURCHASES --> PURCHASES_API["Purchases API"]
UC_PRODUCTS --> PRODUCTS_API["Products API"]
UC_CATEGORIES --> CATEGORIES_API["Categories API"]
UC_UNITS --> UNITS_API["Units API"]
UC_STOCK --> STOCK_API["Stock Mutations API"]
UC_DEBTS --> DEBTS_API["Debts API"]
UC_DASHBOARD --> DASHBOARD_API["Dashboard API"]
UC_NOTIFICATIONS --> NOTIFICATIONS_API["Notifications API"]
UC_REPORTS --> REPORTS_API["Reports API"]
UC_USERS --> USERS_API["Users API"]
UC_AUTH --> AUTH_API["Auth APIs"]
```

**Diagram sources**
- [sale-service-api](file://src/app/api/sales/route.ts)
- [customer-return-service-api](file://src/app/api/customer-returns/route.ts)
- [purchase-service-api](file://src/app/api/purchases/route.ts)
- [product-service-api](file://src/app/api/products/route.ts)
- [category-service-api](file://src/app/api/categories/route.ts)
- [stock-service-api](file://src/app/api/stock-mutations/route.ts)
- [debt-service-api](file://src/app/api/debts/route.ts)
- [dashboard-service-api](file://src/app/api/dashboard/route.ts)
- [notification-service-api](file://src/app/api/notifications/route.ts)
- [report-service-api](file://src/app/api/reports/route.ts)
- [user-service-api](file://src/app/api/users/route.ts)
- [auth-login-api](file://src/app/api/auth/login/route.ts)
- [auth-register-api](file://src/app/api/auth/register/route.ts)
- [auth-logout-api](file://src/app/api/auth/logout/route.ts)
- [auth-me-api](file://src/app/api/auth/me/route.ts)

**Section sources**
- [sale-service-api](file://src/app/api/sales/route.ts)
- [customer-return-service-api](file://src/app/api/customer-returns/route.ts)
- [purchase-service-api](file://src/app/api/purchases/route.ts)
- [product-service-api](file://src/app/api/products/route.ts)
- [category-service-api](file://src/app/api/categories/route.ts)
- [stock-service-api](file://src/app/api/stock-mutations/route.ts)
- [debt-service-api](file://src/app/api/debts/route.ts)
- [dashboard-service-api](file://src/app/api/dashboard/route.ts)
- [notification-service-api](file://src/app/api/notifications/route.ts)
- [report-service-api](file://src/app/api/reports/route.ts)
- [user-service-api](file://src/app/api/users/route.ts)
- [auth-login-api](file://src/app/api/auth/login/route.ts)
- [auth-register-api](file://src/app/api/auth/register/route.ts)
- [auth-logout-api](file://src/app/api/auth/logout/route.ts)
- [auth-me-api](file://src/app/api/auth/me/route.ts)

### Use Case Workflow Examples

#### Example: Record Sales Transactions
This use case involves the cashier capturing items, calculating totals, applying discounts or taxes, and finalizing the sale. The process typically includes:
- Search and select products
- Add items to cart
- Apply customer and payment details
- Generate receipt and update inventory

```mermaid
sequenceDiagram
participant Cashier as "Cashier"
participant UI as "Sales Page"
participant API as "Sales API"
participant Inv as "Products API"
Cashier->>UI : "Open Sales"
UI->>Inv : "Search Product"
Inv-->>UI : "Product Info"
UI->>API : "Create Sale Transaction"
API-->>UI : "Sale Created"
UI-->>Cashier : "Show Receipt"
```

**Diagram sources**
- [sale-service-api](file://src/app/api/sales/route.ts)
- [product-service-api](file://src/app/api/products/route.ts)

**Section sources**
- [sale-service-api](file://src/app/api/sales/route.ts)
- [product-service-api](file://src/app/api/products/route.ts)

#### Example: Process Returns
Returns involve validating return eligibility, restocking items, issuing refunds, and updating records.

```mermaid
sequenceDiagram
participant Cashier as "Cashier"
participant UI as "Returns Page"
participant API as "Returns API"
participant Inv as "Products API"
Cashier->>UI : "Initiate Return"
UI->>API : "Submit Return Details"
API->>Inv : "Update Stock"
Inv-->>API : "Stock Updated"
API-->>UI : "Return Processed"
UI-->>Cashier : "Refund/Receipt"
```

**Diagram sources**
- [customer-return-service-api](file://src/app/api/customer-returns/route.ts)
- [product-service-api](file://src/app/api/products/route.ts)

**Section sources**
- [customer-return-service-api](file://src/app/api/customer-returns/route.ts)
- [product-service-api](file://src/app/api/products/route.ts)

#### Example: Track Debts and Payments
Debt tracking allows recording sales on credit and processing partial/full payments over time.

```mermaid
sequenceDiagram
participant Cashier as "Cashier"
participant UI as "Debts Page"
participant API as "Debts API"
Cashier->>UI : "Create Credit Sale"
UI->>API : "Create Debt Record"
API-->>UI : "Debt Created"
Cashier->>UI : "Make Payment"
UI->>API : "Record Payment"
API-->>UI : "Payment Applied"
```

**Diagram sources**
- [debt-service-api](file://src/app/api/debts/route.ts)

**Section sources**
- [debt-service-api](file://src/app/api/debts/route.ts)

### Best Practices for Creating Use Case Documentation
- Define clear system boundaries based on functional requirements.
- Model actors by their roles and goals; avoid conflating roles with implementation details.
- Use Include/Extend relationships to express mandatory and optional behaviors.
- Keep use case names concise and goal-oriented; write brief descriptions linking to detailed activity diagrams.
- Map each use case to concrete API routes and UI pages to ensure traceability.
- Validate use cases against the system description and functional requirements documents.

**Section sources**
- [kebutuhan-fungsional.md](file://docs/kebutuhan-fungsional.md)
- [deskripsi-sistem.md](file://docs/deskripsi-sistem.md)
- [uml-use-case.puml](file://docs/uml-use-case.puml)

## Dependency Analysis
Use case dependencies reflect how functionality builds upon shared capabilities:
- Sales depends on Products and Payments
- Returns depends on Sales and Products
- Debts depend on Sales and Payments
- Reports depend on Sales, Purchases, and Debts
- Notifications depend on Users and system events

```mermaid
graph TB
SALES["Sales"]
RETURNS["Returns"]
PURCHASES["Purchases"]
PRODUCTS["Products"]
DEBTS["Debts"]
REPORTS["Reports"]
NOTIFICATIONS["Notifications"]
USERS["Users"]
SALES --> PRODUCTS
RETURNS --> SALES
RETURNS --> PRODUCTS
DEBTS --> SALES
REPORTS --> SALES
REPORTS --> PURCHASES
REPORTS --> DEBTS
NOTIFICATIONS --> USERS
```

[No sources needed since this diagram shows conceptual dependencies, not a direct code mapping]

## Performance Considerations
- Minimize cross-domain API calls within a single use case to reduce latency.
- Batch related operations (e.g., multiple item additions) to reduce network overhead.
- Cache frequently accessed reference data (categories, units) to improve responsiveness.
- Ensure database queries for inventory updates are efficient and transactional.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues when working with use case documentation:
- Misaligned use cases: If a use case lacks supporting API routes, revisit requirements and refine scope.
- Unclear boundaries: Consult the system description and functional requirements to clarify inclusion criteria.
- Missing relationships: Review Include/Extend links to ensure optional and prerequisite behaviors are captured.

Recommended actions:
- Cross-reference use case diagrams with API route implementations.
- Validate use cases against activity diagrams and sequence diagrams.
- Maintain traceability matrices linking requirements to use cases and test scenarios.

**Section sources**
- [deskripsi-sistem.md](file://docs/deskripsi-sistem.md)
- [kebutuhan-fungsional.md](file://docs/kebutuhan-fungsional.md)
- [uml-use-case.puml](file://docs/uml-use-case.puml)

## Conclusion
Use case diagrams provide a high-level view of the POS application’s functional landscape, aligning actors’ goals with system capabilities. By clearly defining system boundaries, modeling actor interactions, and mapping use cases to API implementations, teams can maintain coherent documentation that supports development, testing, and stakeholder communication. Applying the best practices outlined here ensures accurate, actionable use case documentation.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Appendix A: System Scope and Boundaries
- Included domains: Sales, Returns, Purchases, Inventory (Products/Categories/Units), Debts, Dashboard, Notifications, Reports, Users.
- Excluded domains: Third-party integrations not yet implemented (e.g., external payment gateways beyond built-in mechanisms).

**Section sources**
- [deskripsi-sistem.md](file://docs/deskripsi-sistem.md)
- [system-flow-uml.md](file://docs/system-flow-uml.md)

### Appendix B: Functional Requirements Reference
- Use the functional requirements document to validate whether a use case is within scope and to derive detailed descriptions and acceptance criteria.

**Section sources**
- [kebutuhan-fungsional.md](file://docs/kebutuhan-fungsional.md)

### Appendix C: Completed Use Case Diagram
- The official use case diagram is available in the documentation folder and serves as the canonical reference for current system coverage.

**Section sources**
- [uml-use-case.puml](file://docs/uml-use-case.puml)