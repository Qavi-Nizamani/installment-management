# Installments Service Module

## 📁 **File Structure**

```
src/services/installments/
├── installments.service.ts      # Main service with CRUD operations
├── installments.analytics.ts    # Analytics and statistics functions
└── README.md                    # This documentation

src/helpers/
└── installments.helper.ts       # Utility and calculation functions (client-side)
```

---

## 🎯 **Module Organization**

### **1. Main Service (`installments.service.ts`)**
**Purpose**: Core CRUD operations and data fetching
- `getInstallments(tenantId)` - Fetch installments with filters and pagination
- `updateInstallment(tenantId)` - Update installment data
- `markAsPaid(tenantId)` - Mark installment as paid
- `markAsPending(tenantId)` - Mark installment as pending

**Re-exports for backward compatibility**:
- Analytics functions from `./installments.analytics.ts`
- Helper functions from `@/helpers/installments.helper.ts`

### **2. Analytics (`installments.analytics.ts`)**
**Purpose**: Statistical analysis and business intelligence
- `getInstallmentStats()` - Basic dashboard statistics
- `getPaymentAnalytics()` - Payment trends and delays
- `getCollectionAnalytics()` - Collection rates and risk assessment
- `getPeriodAnalytics()` - Period-based analytics with trends

### **3. Helpers (`@/helpers/installments.helper.ts`)**
**Purpose**: Reusable utility functions and calculations (client-side)
- **Calculation Helpers**: `calculateRemainingDue()`, `calculateDaysOverdue()`, `isUpcoming()`
- **Date Helpers**: `formatDueDate()`, `getRelativeDueTime()`
- **Status Helpers**: `getInstallmentPriority()`, `requiresAttention()`
- **Validation Helpers**: `validatePaymentAmount()`, `validateDueDate()`

---

## 🚀 **Usage Examples**

### **Basic Service Usage**
```typescript
import { getInstallments, markAsPaid } from '@/services/installments/installments.service';

const tenantId = "your-tenant-id";

// Fetch installments with filters
const response = await getInstallments({
  search_term: "John",
  filters: { status: ['PENDING'] }
}, tenantId);

if (response.success) {
  console.log(response.data);
}

// Mark as paid
const paidResponse = await markAsPaid('installment-id', {
  amount_paid: 500,
  paid_date: '2024-01-15',
  notes: 'Cash payment'
}, tenantId);
```

### **Analytics Usage**
```typescript
import { 
  getInstallmentStats, 
  getPaymentAnalytics, 
  getCollectionAnalytics 
} from '@/services/installments/installments.analytics';

// Get dashboard stats
const stats = await getInstallmentStats(tenantId);

// Get payment analytics
const paymentAnalytics = await getPaymentAnalytics(tenantId);

// Get collection analytics
const collectionAnalytics = await getCollectionAnalytics(tenantId);
```

### **Helper Functions Usage**
```typescript
import { 
  calculateRemainingDue,
  getRelativeDueTime,
  getInstallmentPriority,
  validatePaymentAmount
} from '@/helpers/installments.helper';

// Calculate remaining amount
const remaining = calculateRemainingDue(1000, 300); // 700

// Get human-readable due time
const dueTime = getRelativeDueTime('2024-01-20'); // "Due in 3 days"

// Get priority level
const priority = getInstallmentPriority('PENDING', '2024-01-20'); // "medium"

// Validate payment
const validation = validatePaymentAmount(500, 1000); // { isValid: true }
```

---

## 📊 **Analytics Types**

### **Payment Analytics**
```typescript
interface PaymentAnalytics {
  onTimePayments: number;
  latePayments: number;
  averageDelayDays: number;
  paymentTrends: MonthlyPaymentTrend[];
}
```

### **Collection Analytics**
```typescript
interface CollectionAnalytics {
  collectionRate: number;
  totalCollectable: number;
  totalCollected: number;
  projectedCollection: number;
  riskAnalysis: RiskAnalysis;
}
```

### **Period Analytics**
```typescript
interface PeriodAnalytics {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  stats: InstallmentStats;
  trends: {
    paidTrend: number;
    overdueTrend: number;
    collectionTrend: number;
  };
}
```

---

## 🔧 **Helper Function Categories**

### **Calculation Helpers**
- `calculateRemainingDue(amountDue, amountPaid)` - Calculate remaining amount
- `calculateDaysOverdue(dueDate)` - Calculate overdue days
- `isUpcoming(dueDate, status, daysAhead)` - Check if due soon

### **Date Helpers**
- `formatDueDate(dateString)` - Format date for display
- `getRelativeDueTime(dueDate)` - Human-readable relative time

### **Status Helpers**
- `getInstallmentPriority(status, dueDate)` - Get priority level
- `requiresAttention(status, dueDate)` - Check if needs attention

### **Validation Helpers**
- `validatePaymentAmount(amountPaid, amountDue)` - Validate payment
- `validateDueDate(dueDate)` - Validate due date

---

## 🛡️ **Security & Consistency**

### **Server-Side Security**
- All main functions use `"use server"` directive
- Tenant isolation with `withTenantFilter()` and explicit `tenantId` inputs
- Proper error handling and logging

### **Type Safety**
- Full TypeScript support with proper interfaces
- No `any` types used
- Consistent `ServiceResponse<T>` pattern

### **Backward Compatibility**
- Main service re-exports functions from sub-modules
- Existing imports continue to work
- Gradual migration path available

---

## 🧪 **Testing Strategy**

### **Unit Tests Structure**
```
tests/services/installments/
├── installments.service.test.ts
└── installments.analytics.test.ts

tests/helpers/
└── installments.helper.test.ts
```

### **Test Categories**
- **Service Tests**: CRUD operations, error handling
- **Analytics Tests**: Statistical calculations, trend analysis
- **Helper Tests**: Pure function testing, edge cases

---

## 📈 **Benefits of This Structure**

1. **Separation of Concerns**: Each file has a clear, focused responsibility
2. **Reusability**: Helper functions can be used across components
3. **Maintainability**: Easier to locate and modify specific functionality
4. **Testing**: Each module can be tested independently
5. **Performance**: Analytics can be cached/optimized separately
6. **Scalability**: Easy to add new analytics or helper functions

---

## 🔄 **Migration Guide**

### **From Old Structure**
```typescript
// OLD: Everything in one file
import { getInstallments, calculateRemainingDue } from './installments.service';

// NEW: Still works (backward compatible)
import { getInstallments, calculateRemainingDue } from './installments.service';

// NEW: Direct imports for better tree-shaking
import { getInstallments } from './installments.service';
import { calculateRemainingDue } from '@/helpers/installments.helper';
import { getPaymentAnalytics } from './installments.analytics';
```

### **Recommended Migration**
1. Update imports to use specific modules
2. Use analytics functions for complex reporting
3. Leverage helper functions in components
4. Implement comprehensive testing

---

*This modular structure follows industry best practices and ensures the installments service scales effectively with your application needs.* 