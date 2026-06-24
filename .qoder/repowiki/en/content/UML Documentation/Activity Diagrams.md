# Activity Diagrams

<cite>
**Referenced Files in This Document**
- [uml-activity-product.puml](file://docs/uml-activity-product.puml)
- [uml-activity-purchase.puml](file://docs/uml-activity-purchase.puml)
- [uml-activity-sales.puml](file://docs/uml-activity-sales.puml)
- [uml-activity-debt.puml](file://docs/uml-activity-debt.puml)
- [uml-activity-debt-payment.puml](file://docs/uml-activity-debt-payment.puml)
- [uml-activity-return.puml](file://docs/uml-activity-return.puml)
- [uml-activity-stock.puml](file://docs/uml-activity-stock.puml)
- [uml-activity-users.puml](file://docs/uml-activity-users.puml)
- [uml-activity-operations.puml](file://docs/uml-activity-operations.puml)
- [product-service.ts](file://src/services/productService.ts)
- [purchaseService.ts](file://src/services/purchaseService.ts)
- [saleService.ts](file://src/services/saleService.ts)
- [debtService.ts](file://src/services/debtService.ts)
- [customerReturnService.ts](file://src/services/customerReturnService.ts)
- [stockMutationService.ts](file://src/services/stockMutationService.ts)
- [userService.ts](file://src/services/userService.ts)
- [operationalCostService.ts](file://src/services/costService.ts)
- [product-api-route.ts](file://src/app/api/products/route.ts)
- [purchase-api-route.ts](file://src/app/api/purchases/route.ts)
- [sales-api-route.ts](file://src/app/api/sales/route.ts)
- [debts-api-route.ts](file://src/app/api/debts/route.ts)
- [return-api-route.ts](file://src/app/api/customer-returns/route.ts)
- [stock-api-route.ts](file://src/app/api/stock-mutations/route.ts)
- [users-api-route.ts](file://src/app/api/users/route.ts)
- [operations-api-route.ts](file://src/app/api/operational-costs/route.ts)
- [product-form.tsx](file://src/app/dashboard/products/_components/product-form.tsx)
- [purchase-form.tsx](file://src/app/dashboard/purchases/_components/purchase-form.tsx)
- [transaction-form.tsx](file://src/app/dashboard/sales/_components/_forms/transaction-form.tsx)
- [debt-payment-dialog.tsx](file://src/app/dashboard/sales/_components/debt-payment-dialog.tsx)
- [return-form.tsx](file://src/app/dashboard/sales/_components/_forms/return-form.tsx)
- [stock-adjustment-modal.tsx](file://src/app/dashboard/products/_components/stock-adjustment-modal.tsx)
- [user-form-modal.tsx](file://src/app/dashboard/users/_components/user-form-modal.tsx)
- [operational-cost-form.tsx](file://src/app/dashboard/cost/_components/_forms/operational-cost-form.tsx)
- [notification-logic.ts](file://src/app/api/notifications/_lib/notification-logic.ts)
- [notification-store.ts](file://src/app/api/notifications/_lib/notification-store.ts)
- [notification-state-db.ts](file://src/app/api/notifications/_lib/notification-state-db.ts)
- [notification-read-route.ts](file://src/app/api/notifications/[id]/read/route.ts)
- [notification-clear-route.ts](file://src/app/api/notifications/clear/route.ts)
- [notification-route.ts](file://src/app/api/notifications/route.ts)
- [system-flow-uml.md](file://docs/system-flow-uml.md)
- [uml-presentation-guide.md](file://docs/uml-presentation-guide.md)
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
This document provides comprehensive activity diagram documentation for key business workflows in the Point-of-Sale (POS) application. It focuses on process modeling using swimlanes, decision points, concurrency, and synchronization. The diagrams capture end-to-end workflows for product management, purchase processing, sales transactions, debt payment, return processing, stock management, user management, and operational costs. Guidance is included for creating and interpreting activity diagrams aligned with the application’s module boundaries and service-layer design.

## Project Structure
The POS application follows a modular structure with dedicated API routes, services, and UI components per domain. Activity diagrams map to these modules and their interactions:
- Product Management: product creation, updates, variants, audit logs, and stock mutations
- Purchase Processing: supplier orders, receipts, and purchase records
- Sales Transactions: cash/credit transactions, receipts, and debt tracking
- Debt Payment Procedures: partial/full payments against outstanding balances
- Return Processing: customer returns, item selection, and refund/replacement flows
- Stock Management: adjustments, opname, and mutation logging
- User Management: user CRUD, roles, and password reset requests
- Operational Costs: daily operational expenses and tax configurations

```mermaid
graph TB
subgraph "UI Layer"
PF["Product Form<br/>(product-form.tsx)"]
PURF["Purchase Form<br/>(purchase-form.tsx)"]
TF["Transaction Form<br/>(transaction-form.tsx)"]
DP["Debt Payment Dialog<br/>(debt-payment-dialog.tsx)"]
RF["Return Form<br/>(return-form.tsx)"]
SAM["Stock Adjustment Modal<br/>(stock-adjustment-modal.tsx)"]
UF["User Form Modal<br/>(user-form-modal.tsx)"]
OCF["Operational Cost Form<br/>(operational-cost-form.tsx)"]
end
subgraph "API Routes"
PR["Products API<br/>(products/route.ts)"]
PURR["Purchases API<br/>(purchases/route.ts)"]
SR["Sales API<br/>(sales/route.ts)"]
DR["Debts API<br/>(debts/route.ts)"]
RFR["Returns API<br/>(customer-returns/route.ts)"]
STR["Stock API<br/>(stock-mutations/route.ts)"]
UR["Users API<br/>(users/route.ts)"]
OR["Operations API<br/>(operational-costs/route.ts)"]
end
subgraph "Services"
PS["Product Service"]
PuS["Purchase Service"]
SaS["Sale Service"]
DeS["Debt Service"]
CRS["Customer Return Service"]
StS["Stock Mutation Service"]
US["User Service"]
OS["Operational Cost Service"]
end
PF --> PR --> PS
PURF --> PURR --> PuS
TF --> SR --> SaS
DP --> DR --> DeS
RF --> RFR --> CRS
SAM --> STR --> StS
UF --> UR --> US
OCF --> OR --> OS
```

**Diagram sources**
- [product-form.tsx](file://src/app/dashboard/products/_components/product-form.tsx)
- [purchase-form.tsx](file://src/app/dashboard/purchases/_components/purchase-form.tsx)
- [transaction-form.tsx](file://src/app/dashboard/sales/_components/_forms/transaction-form.tsx)
- [debt-payment-dialog.tsx](file://src/app/dashboard/sales/_components/debt-payment-dialog.tsx)
- [return-form.tsx](file://src/app/dashboard/sales/_components/_forms/return-form.tsx)
- [stock-adjustment-modal.tsx](file://src/app/dashboard/products/_components/stock-adjustment-modal.tsx)
- [user-form-modal.tsx](file://src/app/dashboard/users/_components/user-form-modal.tsx)
- [operational-cost-form.tsx](file://src/app/dashboard/cost/_components/_forms/operational-cost-form.tsx)
- [product-api-route.ts](file://src/app/api/products/route.ts)
- [purchase-api-route.ts](file://src/app/api/purchases/route.ts)
- [sales-api-route.ts](file://src/app/api/sales/route.ts)
- [debts-api-route.ts](file://src/app/api/debts/route.ts)
- [return-api-route.ts](file://src/app/api/customer-returns/route.ts)
- [stock-api-route.ts](file://src/app/api/stock-mutations/route.ts)
- [users-api-route.ts](file://src/app/api/users/route.ts)
- [operations-api-route.ts](file://src/app/api/operational-costs/route.ts)

**Section sources**
- [system-flow-uml.md](file://docs/system-flow-uml.md)

## Core Components
This section outlines the primary workflows and their swimlane organization. Each workflow spans UI, API, and service layers, with decision points, concurrency (parallel tasks), and synchronization barriers.

- Product Management Workflow
  - Swimlanes: UI > API > Services > Persistence
  - Activities: create/update product, manage variants, adjust stock, log audit events
  - Decisions: variant existence, stock threshold checks
  - Concurrency: variant creation in parallel; audit logging asynchronous
  - Synchronization: stock update after variant creation; audit logged after persistence

- Purchase Processing Workflow
  - Swimlanes: UI > API > Services > Supplier Records
  - Activities: submit purchase order, persist purchase, update supplier records
  - Decisions: payment method, invoice completeness
  - Concurrency: supplier lookup and product validation in parallel
  - Synchronization: purchase persisted before supplier record update

- Sales Transaction Workflow
  - Swimlanes: UI > API > Services > Inventory > Debts
  - Activities: scan items, compute totals, apply discounts/taxes, finalize sale
  - Decisions: payment type (cash/credit), stock sufficiency, debt creation
  - Concurrency: inventory deduction and receipt generation in parallel
  - Synchronization: inventory updated before receipt finalized; debt recorded if applicable

- Debt Payment Procedure
  - Swimlanes: UI > API > Services > Debts
  - Activities: select debt, enter payment amount, validate balance
  - Decisions: full vs partial payment, remaining balance
  - Concurrency: none significant
  - Synchronization: payment recorded before balance update

- Return Processing Workflow
  - Swimlanes: UI > API > Services > Inventory
  - Activities: select items, compute refund, update inventory
  - Decisions: return eligibility, refund method
  - Concurrency: inventory adjustment and return record creation in parallel
  - Synchronization: inventory adjusted before return finalized

- Stock Management Workflow
  - Swimlanes: UI > API > Services > Inventory
  - Activities: perform stock adjustment/opname, log mutation
  - Decisions: adjustment type, threshold alerts
  - Concurrency: mutation logging asynchronous
  - Synchronization: mutation persisted before alert triggers

- User Management Workflow
  - Swimlanes: UI > API > Services > Users
  - Activities: create/update/delete user, manage roles, password reset requests
  - Decisions: role validity, reset request resolution
  - Concurrency: none significant
  - Synchronization: user persisted before role assignment

- Operational Costs Workflow
  - Swimlanes: UI > API > Services > Costs
  - Activities: record operational cost, configure taxes
  - Decisions: cost type, tax applicability
  - Concurrency: none significant
  - Synchronization: cost recorded before reporting

**Section sources**
- [uml-activity-product.puml](file://docs/uml-activity-product.puml)
- [uml-activity-purchase.puml](file://docs/uml-activity-purchase.puml)
- [uml-activity-sales.puml](file://docs/uml-activity-sales.puml)
- [uml-activity-debt.puml](file://docs/uml-activity-debt.puml)
- [uml-activity-debt-payment.puml](file://docs/uml-activity-debt-payment.puml)
- [uml-activity-return.puml](file://docs/uml-activity-return.puml)
- [uml-activity-stock.puml](file://docs/uml-activity-stock.puml)
- [uml-activity-users.puml](file://docs/uml-activity-users.puml)
- [uml-activity-operations.puml](file://docs/uml-activity-operations.puml)

## Architecture Overview
The activity diagrams reflect the layered architecture:
- UI layer: forms and dialogs orchestrate user actions
- API layer: route handlers validate and delegate to services
- Service layer: business logic, validations, and external integrations
- Persistence layer: database operations and audit trails

```mermaid
graph TB
UI["UI Components"] --> API["API Routes"]
API --> SVC["Services"]
SVC --> DB["Database"]
SVC --> EXT["External Integrations"]
UI --> API
API --> SVC
SVC --> DB
```

**Diagram sources**
- [product-api-route.ts](file://src/app/api/products/route.ts)
- [purchase-api-route.ts](file://src/app/api/purchases/route.ts)
- [sales-api-route.ts](file://src/app/api/sales/route.ts)
- [debts-api-route.ts](file://src/app/api/debts/route.ts)
- [return-api-route.ts](file://src/app/api/customer-returns/route.ts)
- [stock-api-route.ts](file://src/app/api/stock-mutations/route.ts)
- [users-api-route.ts](file://src/app/api/users/route.ts)
- [operations-api-route.ts](file://src/app/api/operational-costs/route.ts)

## Detailed Component Analysis

### Product Management Workflow
- Swimlanes: UI > API > Services > Persistence
- Key Activities: product creation, variant management, stock adjustment, audit logging
- Decision Points: variant exists?, stock below threshold?
- Concurrency: variant creation parallelized; audit logging asynchronous
- Synchronization: stock update after variant creation; audit logged after persistence

```mermaid
flowchart TD
Start(["Start"]) --> CreateProduct["Create/Update Product"]
CreateProduct --> ManageVariants["Manage Variants"]
ManageVariants --> CheckStock["Check Stock Threshold"]
CheckStock --> BelowThreshold{"Below Threshold?"}
BelowThreshold --> |Yes| AdjustStock["Adjust Stock"]
BelowThreshold --> |No| LogAudit["Log Audit Event"]
AdjustStock --> LogAudit
LogAudit --> Persist["Persist Changes"]
Persist --> Notify["Notify Stakeholders"]
Notify --> End(["End"])
```

**Diagram sources**
- [product-form.tsx](file://src/app/dashboard/products/_components/product-form.tsx)
- [product-api-route.ts](file://src/app/api/products/route.ts)
- [product-service.ts](file://src/services/productService.ts)

**Section sources**
- [uml-activity-product.puml](file://docs/uml-activity-product.puml)
- [product-form.tsx](file://src/app/dashboard/products/_components/product-form.tsx)
- [product-api-route.ts](file://src/app/api/products/route.ts)
- [product-service.ts](file://src/services/productService.ts)

### Purchase Processing Workflow
- Swimlanes: UI > API > Services > Supplier Records
- Key Activities: submit purchase order, persist purchase, update supplier records
- Decision Points: payment method, invoice completeness
- Concurrency: supplier lookup and product validation in parallel
- Synchronization: purchase persisted before supplier record update

```mermaid
sequenceDiagram
participant UI as "UI"
participant API as "Purchases API"
participant SVC as "Purchase Service"
participant SUP as "Supplier Records"
UI->>API : "Submit Purchase Order"
API->>SVC : "Validate & Prepare"
SVC->>SUP : "Lookup Supplier"
SVC->>SVC : "Validate Products"
SVC-->>API : "Ready to Persist"
API->>SVC : "Persist Purchase"
SVC->>SUP : "Update Supplier Records"
SVC-->>API : "Success"
API-->>UI : "Purchase Created"
```

**Diagram sources**
- [purchase-form.tsx](file://src/app/dashboard/purchases/_components/purchase-form.tsx)
- [purchase-api-route.ts](file://src/app/api/purchases/route.ts)
- [purchaseService.ts](file://src/services/purchaseService.ts)

**Section sources**
- [uml-activity-purchase.puml](file://docs/uml-activity-purchase.puml)
- [purchase-form.tsx](file://src/app/dashboard/purchases/_components/purchase-form.tsx)
- [purchase-api-route.ts](file://src/app/api/purchases/route.ts)
- [purchaseService.ts](file://src/services/purchaseService.ts)

### Sales Transaction Workflow
- Swimlanes: UI > API > Services > Inventory > Debts
- Key Activities: scan items, compute totals, apply discounts/taxes, finalize sale
- Decision Points: payment type (cash/credit), stock sufficiency, debt creation
- Concurrency: inventory deduction and receipt generation in parallel
- Synchronization: inventory updated before receipt finalized; debt recorded if applicable

```mermaid
sequenceDiagram
participant UI as "UI"
participant API as "Sales API"
participant SVC as "Sale Service"
participant INV as "Inventory"
participant DEBT as "Debt Service"
UI->>API : "Submit Transaction"
API->>SVC : "Compute Totals"
SVC->>INV : "Deduct Stock (Parallel)"
SVC->>DEBT : "Create Debt (if credit)"
SVC-->>API : "Transaction Ready"
API->>SVC : "Finalize Sale"
SVC->>INV : "Confirm Stock Deduction"
SVC-->>API : "Receipt Generated"
API-->>UI : "Transaction Complete"
```

**Diagram sources**
- [transaction-form.tsx](file://src/app/dashboard/sales/_components/_forms/transaction-form.tsx)
- [sales-api-route.ts](file://src/app/api/sales/route.ts)
- [saleService.ts](file://src/services/saleService.ts)
- [debtService.ts](file://src/services/debtService.ts)

**Section sources**
- [uml-activity-sales.puml](file://docs/uml-activity-sales.puml)
- [transaction-form.tsx](file://src/app/dashboard/sales/_components/_forms/transaction-form.tsx)
- [sales-api-route.ts](file://src/app/api/sales/route.ts)
- [saleService.ts](file://src/services/saleService.ts)
- [debtService.ts](file://src/services/debtService.ts)

### Debt Payment Procedure
- Swimlanes: UI > API > Services > Debts
- Key Activities: select debt, enter payment amount, validate balance
- Decision Points: full vs partial payment, remaining balance
- Concurrency: none significant
- Synchronization: payment recorded before balance update

```mermaid
flowchart TD
Start(["Start"]) --> SelectDebt["Select Outstanding Debt"]
SelectDebt --> EnterAmount["Enter Payment Amount"]
EnterAmount --> Validate["Validate Against Balance"]
Validate --> FullPayment{"Full Payment?"}
FullPayment --> |Yes| RecordFull["Record Full Payment"]
FullPayment --> |No| RecordPartial["Record Partial Payment"]
RecordFull --> UpdateBalance["Update Remaining Balance"]
RecordPartial --> UpdateBalance
UpdateBalance --> Notify["Notify Customer"]
Notify --> End(["End"])
```

**Diagram sources**
- [debt-payment-dialog.tsx](file://src/app/dashboard/sales/_components/debt-payment-dialog.tsx)
- [debts-api-route.ts](file://src/app/api/debts/[id]/payment/route.ts)
- [debtService.ts](file://src/services/debtService.ts)

**Section sources**
- [uml-activity-debt-payment.puml](file://docs/uml-activity-debt-payment.puml)
- [debt-payment-dialog.tsx](file://src/app/dashboard/sales/_components/debt-payment-dialog.tsx)
- [debts-api-route.ts](file://src/app/api/debts/[id]/payment/route.ts)
- [debtService.ts](file://src/services/debtService.ts)

### Return Processing Workflow
- Swimlanes: UI > API > Services > Inventory
- Key Activities: select items, compute refund, update inventory
- Decision Points: return eligibility, refund method
- Concurrency: inventory adjustment and return record creation in parallel
- Synchronization: inventory adjusted before return finalized

```mermaid
sequenceDiagram
participant UI as "UI"
participant API as "Returns API"
participant SVC as "Customer Return Service"
participant INV as "Inventory"
UI->>API : "Submit Return"
API->>SVC : "Validate Items"
SVC->>INV : "Adjust Stock (Parallel)"
SVC-->>API : "Ready to Record"
API->>SVC : "Persist Return"
SVC->>INV : "Confirm Adjustment"
SVC-->>API : "Return Finalized"
API-->>UI : "Return Complete"
```

**Diagram sources**
- [return-form.tsx](file://src/app/dashboard/sales/_components/_forms/return-form.tsx)
- [return-api-route.ts](file://src/app/api/customer-returns/route.ts)
- [customerReturnService.ts](file://src/services/customerReturnService.ts)

**Section sources**
- [uml-activity-return.puml](file://docs/uml-activity-return.puml)
- [return-form.tsx](file://src/app/dashboard/sales/_components/_forms/return-form.tsx)
- [return-api-route.ts](file://src/app/api/customer-returns/route.ts)
- [customerReturnService.ts](file://src/services/customerReturnService.ts)

### Stock Management Workflow
- Swimlanes: UI > API > Services > Inventory
- Key Activities: perform stock adjustment/opname, log mutation
- Decision Points: adjustment type, threshold alerts
- Concurrency: mutation logging asynchronous
- Synchronization: mutation persisted before alert triggers

```mermaid
flowchart TD
Start(["Start"]) --> ChooseAction["Choose Action: Adjustment / Opname"]
ChooseAction --> PerformOp["Perform Operation"]
PerformOp --> LogMutation["Log Mutation"]
LogMutation --> Persist["Persist Mutation"]
Persist --> Alert{"Threshold Breach?"}
Alert --> |Yes| TriggerAlert["Trigger Alert"]
Alert --> |No| End(["End"])
TriggerAlert --> End
```

**Diagram sources**
- [stock-adjustment-modal.tsx](file://src/app/dashboard/products/_components/stock-adjustment-modal.tsx)
- [stock-api-route.ts](file://src/app/api/stock-mutations/route.ts)
- [stockMutationService.ts](file://src/services/stockMutationService.ts)

**Section sources**
- [uml-activity-stock.puml](file://docs/uml-activity-stock.puml)
- [stock-adjustment-modal.tsx](file://src/app/dashboard/products/_components/stock-adjustment-modal.tsx)
- [stock-api-route.ts](file://src/app/api/stock-mutations/route.ts)
- [stockMutationService.ts](file://src/services/stockMutationService.ts)

### User Management Workflow
- Swimlanes: UI > API > Services > Users
- Key Activities: create/update/delete user, manage roles, password reset requests
- Decision Points: role validity, reset request resolution
- Concurrency: none significant
- Synchronization: user persisted before role assignment

```mermaid
flowchart TD
Start(["Start"]) --> CreateUser["Create/Update/Delete User"]
CreateUser --> ManageRoles["Assign Roles"]
ManageRoles --> ResetRequests["Handle Password Reset Requests"]
ResetRequests --> Persist["Persist Changes"]
Persist --> Notify["Notify User"]
Notify --> End(["End"])
```

**Diagram sources**
- [user-form-modal.tsx](file://src/app/dashboard/users/_components/user-form-modal.tsx)
- [users-api-route.ts](file://src/app/api/users/route.ts)
- [userService.ts](file://src/services/userService.ts)

**Section sources**
- [uml-activity-users.puml](file://docs/uml-activity-users.puml)
- [user-form-modal.tsx](file://src/app/dashboard/users/_components/user-form-modal.tsx)
- [users-api-route.ts](file://src/app/api/users/route.ts)
- [userService.ts](file://src/services/userService.ts)

### Operational Costs Workflow
- Swimlanes: UI > API > Services > Costs
- Key Activities: record operational cost, configure taxes
- Decision Points: cost type, tax applicability
- Concurrency: none significant
- Synchronization: cost recorded before reporting

```mermaid
flowchart TD
Start(["Start"]) --> RecordCost["Record Operational Cost"]
RecordCost --> ConfigureTax["Configure Taxes"]
ConfigureTax --> Persist["Persist Cost"]
Persist --> Report["Generate Reports"]
Report --> End(["End"])
```

**Diagram sources**
- [operational-cost-form.tsx](file://src/app/dashboard/cost/_components/_forms/operational-cost-form.tsx)
- [operations-api-route.ts](file://src/app/api/operational-costs/route.ts)
- [operationalCostService.ts](file://src/services/costService.ts)

**Section sources**
- [uml-activity-operations.puml](file://docs/uml-activity-operations.puml)
- [operational-cost-form.tsx](file://src/app/dashboard/cost/_components/_forms/operational-cost-form.tsx)
- [operations-api-route.ts](file://src/app/api/operational-costs/route.ts)
- [operationalCostService.ts](file://src/services/costService.ts)

### Notifications Workflow (Supporting Process)
- Swimlanes: API > Services > Store > State > DB
- Key Activities: create/read/clear notifications, maintain state
- Decision Points: read/unread state, clear all
- Concurrency: none significant
- Synchronization: state updated before DB write

```mermaid
sequenceDiagram
participant API as "Notifications API"
participant LOGIC as "Notification Logic"
participant STORE as "Notification Store"
participant STATE as "State DB"
participant DB as "Persistence"
API->>LOGIC : "Create Notification"
LOGIC->>STORE : "Update Memory Store"
STORE->>STATE : "Update State"
STATE->>DB : "Persist State"
API->>LOGIC : "Mark Read/Clear"
LOGIC->>STORE : "Update Store"
STORE->>STATE : "Update State"
STATE->>DB : "Persist State"
```

**Diagram sources**
- [notification-logic.ts](file://src/app/api/notifications/_lib/notification-logic.ts)
- [notification-store.ts](file://src/app/api/notifications/_lib/notification-store.ts)
- [notification-state-db.ts](file://src/app/api/notifications/_lib/notification-state-db.ts)
- [notification-read-route.ts](file://src/app/api/notifications/[id]/read/route.ts)
- [notification-clear-route.ts](file://src/app/api/notifications/clear/route.ts)
- [notification-route.ts](file://src/app/api/notifications/route.ts)

**Section sources**
- [notification-logic.ts](file://src/app/api/notifications/_lib/notification-logic.ts)
- [notification-store.ts](file://src/app/api/notifications/_lib/notification-store.ts)
- [notification-state-db.ts](file://src/app/api/notifications/_lib/notification-state-db.ts)
- [notification-read-route.ts](file://src/app/api/notifications/[id]/read/route.ts)
- [notification-clear-route.ts](file://src/app/api/notifications/clear/route.ts)
- [notification-route.ts](file://src/app/api/notifications/route.ts)

## Dependency Analysis
The activity diagrams reveal dependencies across UI, API, and service layers. Key observations:
- UI components trigger API routes; API routes delegate to services
- Services encapsulate business logic and coordinate with persistence
- Decision points often branch based on validation outcomes
- Parallel activities improve throughput while maintaining correctness via synchronization

```mermaid
graph LR
UI["UI Components"] --> API["API Routes"]
API --> SVC["Services"]
SVC --> DB["Database"]
SVC --> EXT["External Integrations"]
```

**Diagram sources**
- [product-api-route.ts](file://src/app/api/products/route.ts)
- [purchase-api-route.ts](file://src/app/api/purchases/route.ts)
- [sales-api-route.ts](file://src/app/api/sales/route.ts)
- [debts-api-route.ts](file://src/app/api/debts/route.ts)
- [return-api-route.ts](file://src/app/api/customer-returns/route.ts)
- [stock-api-route.ts](file://src/app/api/stock-mutations/route.ts)
- [users-api-route.ts](file://src/app/api/users/route.ts)
- [operations-api-route.ts](file://src/app/api/operational-costs/route.ts)

**Section sources**
- [system-flow-uml.md](file://docs/system-flow-uml.md)

## Performance Considerations
- Minimize blocking operations in UI by offloading heavy computations to services
- Use parallelizable steps (e.g., inventory deduction and receipt generation) to reduce latency
- Asynchronous logging and notifications prevent UI stalls
- Batch operations for bulk stock adjustments or user imports to reduce repeated API calls

## Troubleshooting Guide
Common issues and resolutions:
- Validation Failures: Ensure UI pre-validates inputs; API routes should return explicit errors; services should centralize validation logic
- Concurrency Conflicts: Use atomic operations for inventory and debt updates; synchronize parallel branches
- Persistence Errors: Wrap critical sections in transactions; log failures with context
- Notification Delays: Verify state updates occur before DB writes; monitor store consistency

**Section sources**
- [notification-logic.ts](file://src/app/api/notifications/_lib/notification-logic.ts)
- [notification-store.ts](file://src/app/api/notifications/_lib/notification-store.ts)
- [notification-state-db.ts](file://src/app/api/notifications/_lib/notification-state-db.ts)

## Conclusion
Activity diagrams provide a powerful way to model complex business processes in the POS application. By organizing workflows into swimlanes, capturing decision points, enabling concurrency where safe, and enforcing synchronization, teams can align development with business intent. The diagrams documented here serve as templates for consistent modeling across modules.

## Appendices

### Guidelines for Creating Activity Diagrams
- Define swimlanes representing UI, API, Services, and Persistence
- Model start and end nodes clearly
- Use decision forks for branching logic (yes/no, pass/fail)
- Indicate parallel activities with fork/join semantics
- Synchronize after parallel branches to ensure consistency
- Keep labels concise but descriptive
- Validate against actual route and service implementations

### Interpreting Workflow Logic
- Trace the swimlane sequence to understand cross-layer interactions
- Identify synchronization points where later steps depend on earlier outcomes
- Look for parallelism opportunities to improve throughput
- Confirm decision coverage with positive and negative paths

### Templates for Common Workflow Patterns
- CRUD Pattern: Create -> Validate -> Persist -> Notify
- Approval Pattern: Submit -> Approve/Reject -> Update Status -> Notify
- Parallel Processing Pattern: Split -> Work in Parallel -> Merge -> Continue
- Conditional Branching Pattern: Evaluate Condition -> Route to Path -> Rejoin

**Section sources**
- [uml-presentation-guide.md](file://docs/uml-presentation-guide.md)