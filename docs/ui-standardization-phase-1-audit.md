# UI Standardization Phase 1 Audit

Date: 2026-04-25
Scope: `src/app/dashboard`, `src/components`, `src/app/api/notifications`, `src/services`

## 1) Visual Design Audit

### Border Radius Inventory (quick scan)
- `rounded-lg`: 116 usages
- `rounded-full`: 99 usages
- `rounded-md`: 58 usages
- `rounded-xl`: 58 usages
- `rounded-2xl`: 17 usages
- `rounded-t-4xl`: 12 usages
- `rounded-sm`: 11 usages
- Others: `rounded-3xl`, `rounded-none`, custom arbitrary values

Risk:
- Mixed radius scale in peer components causes inconsistent visual rhythm.
- Several one-off values (`rounded-t-[20px]`, `rounded-[2px]`) should be minimized.

Phase-1 Decision:
- Introduce app-level non-breaking radius tokens in global CSS.
- Keep current UI behavior unchanged for now.

### Filter Button Harmonization
Current state:
- `FilterWrap` exists and is reused in many pages (products, purchases, sales, users, cost, returns).
- Some pages still use local custom filter trigger patterns (example: customers/trash/notifications).

Risk:
- Inconsistent trigger style, spacing, and alignment.
- Mixed mobile/desktop behavior for filter controls.

Phase-2 target:
- Normalize all dashboard filter triggers through one reusable wrapper pattern.
- Keep desktop and mobile interaction model identical across modules.

## 2) Navigation & Interaction Audit

### Business Alert Navigation
Observed in dashboard alerts:
- Low stock card links to `/dashboard/products` without query context.
- Debt alert links to `/dashboard/sales?tab=history-sales` without customer/invoice context.

Observed in notifications API:
- Some actions already include context-aware routing:
  - `/dashboard/products?q=...`
  - `/dashboard/sales?tab=history-sales&customerId=...`
  - `/dashboard/sales?tab=history-sales&q=...`

Risk:
- Dashboard alert routing is less contextual than notification action routing.
- User requires extra manual filtering after navigation.

Phase-2/3 target:
- Standardize alert route contract with contextual query params.
- Use one mapping strategy for alert source -> destination URL.

## 3) Terminology Audit

### Revenue terms found
- `Omset`
- `Pendapatan`
- `Revenue` / `Net Revenue`

### Profit terms found
- `Profit`
- `Laba Kotor`
- `Laba Bersih`

Risk:
- Mixed English/Indonesian terms in UI and API naming.
- Potential business confusion between gross/net semantics.

Phase-3 target proposal:
- UI public labels:
  - Revenue => `Pendapatan (Omset)`
  - Gross Profit => `Laba Kotor`
  - Net Profit => `Laba Bersih`
- Internal API fields can remain technical for backward compatibility (`netRevenue`, `grossProfit`) and mapped at UI layer.

## 4) Phase-1 Deliverables Completed

- Audit completed for:
  - Border radius consistency
  - Filter trigger consistency
  - Business alert navigation consistency
  - Revenue/profit terminology consistency
- Foundation token prepared:
  - Added app-level radius token scale in `src/app/globals.css`:
    - `--app-radius-xs|sm|md|lg|xl|pill`
  - Added utility classes:
    - `rounded-app-xs|sm|md|lg|xl|pill`

## 5) Next Implementation Slice (Phase 2)

Recommended next patch batch:
1. Standardize all dashboard filter triggers to `FilterWrap` style contract.
2. Replace one-off radius classes in high-traffic pages:
   - dashboard home
   - products
   - sales
   - customers
3. Add a centralized business alert route builder and apply it in dashboard alert cards.

## 6) Phase-2 Progress (Partial)

Completed on this pass:
- Added centralized business alert route builder:
  - `src/lib/business-alert-routes.ts`
- Applied contextual routing in dashboard alert cards:
  - low stock -> product page with query context
  - unpaid debt -> sales history with invoice query context
- Standardized custom filter triggers to `FilterWrap` pattern:
  - `customers/_components/customer-list-section.tsx`
  - `trash/page.tsx`
- Started radius token adoption on high-traffic pages:
  - `dashboard/page.tsx`
  - `products/page.tsx`
  - `customers/page.tsx`
  - `sales/page.tsx`

## 7) Phase-2 Progress (Continued)

Completed on this pass:
- Standardized radius usage in shared UI components:
  - `src/components/filter-wrap.tsx`
  - `src/components/ui/view-mode-switch.tsx`
  - `src/components/ui/tabs.tsx`
- Reduced one-off radius in filter sheet:
  - `rounded-t-[20px]` -> `rounded-t-4xl`
- Added centralized business terminology map:
  - `src/lib/business-terms.ts`
- Applied terminology map on dashboard/sales surface labels (UI only, no logic/API rename):
  - `src/app/dashboard/page.tsx`
  - `src/app/dashboard/sales/page.tsx`
- Applied terminology map on report pie chart defaults:
  - `src/app/dashboard/report/_components/report-pie-chart.tsx`
- Continued radius token adoption in sales screen:
  - growth badges, scanner button, cashier mode switch now use `rounded-app-pill`
