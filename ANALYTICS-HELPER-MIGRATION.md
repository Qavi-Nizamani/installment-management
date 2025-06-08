# Analytics Helper Migration Guide

## Overview

This document explains the migration of analytics utility functions from `src/services/installments/installments.analytics.ts` to `src/helpers/installments.analytics.helper.ts` to comply with Next.js server-side directive requirements.

## Problem Statement

The original analytics service file contained a mix of server-side async functions and pure utility functions. Next.js requires that files using the `"use server"` directive only export async functions, causing linter errors for pure utility functions.

## Migration Summary

### Functions Moved to Helpers

The following pure utility functions have been moved to `src/helpers/installments.analytics.helper.ts`:

1. **`calculatePaymentAnalytics()`** - Calculate payment trends and delays
2. **`calculateCollectionAnalytics()`** - Calculate collection rates and risk analysis
3. **`calculatePeriodAnalytics()`** - Calculate period-based analytics with trends
4. **`calculatePeriodDates()`** - Calculate date ranges for time periods
5. **`calculatePreviousPeriodDates()`** - Calculate previous period dates for comparisons
6. **`calculateAveragePaymentDelay()`** - Calculate average payment delays

### Functions Remaining in Service

These async functions remain in the analytics service file:

1. **`getInstallmentStats()`** - Get comprehensive dashboard statistics
2. **`getPaymentAnalytics()`** - Get payment analytics with database queries
3. **`getCollectionAnalytics()`** - Get collection analytics with database queries
4. **`getPeriodAnalytics()`** - Get period analytics with database queries

## Usage Changes

### Before Migration
```typescript
// Direct function calls within the same file
const analytics = calculatePaymentAnalytics(paidInstallments);
const stats = calculatePeriodAnalytics(period, start, end, currentData, prevData);
```

### After Migration
```typescript
// Dynamic imports for helper functions
const { calculatePaymentAnalytics } = await import('@/helpers/installments.analytics.helper');
const analytics = calculatePaymentAnalytics(paidInstallments);

const { calculatePeriodAnalytics } = await import('@/helpers/installments.analytics.helper');
const stats = calculatePeriodAnalytics(period, start, end, currentData, prevData);
```

## Type Exports

All analytics types are now defined in the helper file and re-exported from the service file for backward compatibility:

```typescript
// Available from both files
export type {
  PaymentAnalytics,
  MonthlyPaymentTrend,
  CollectionAnalytics,
  RiskAnalysis,
  PeriodAnalytics
} from '@/helpers/installments.analytics.helper';
```

## Benefits

1. **Server Compliance**: Resolves Next.js "use server" directive errors
2. **Better Organization**: Separates pure utility functions from server-side logic
3. **Improved Tree-shaking**: Allows better bundle optimization
4. **Cleaner Architecture**: Clear separation of concerns
5. **Backward Compatibility**: Existing imports continue to work

## File Structure

```
src/services/installments/
├── installments.service.ts      # Server-side CRUD operations
├── installments.analytics.ts    # Server-side analytics with DB queries
└── README.md                    # Documentation

src/helpers/
├── installments.helper.ts           # General utility functions
└── installments.analytics.helper.ts # Analytics calculation functions

src/store/
└── installments.store.ts        # Client-side Zustand store
```

## Migration Testing

To verify the migration was successful:

1. **Linter Compliance**: No "use server" errors should appear
2. **Function Availability**: All analytics functions should work as before
3. **Type Safety**: TypeScript should recognize all types correctly
4. **Runtime Testing**: All analytics calculations should produce the same results

## Future Considerations

- Helper functions can be easily unit tested in isolation
- New analytics functions should be added to helpers if they're pure calculations
- Server-side functions that require database access should remain in the service file
- Consider creating additional helper categories as the application grows

## Migration Command Summary

```bash
# Moved functions from service to helper
src/services/installments/installments.analytics.ts → src/helpers/installments.analytics.helper.ts

# Updated imports in service file to use dynamic imports
# Re-exported types for backward compatibility
# Removed unused imports to resolve linter errors
```

This migration maintains full functionality while ensuring compliance with Next.js server-side requirements and improving code organization. 