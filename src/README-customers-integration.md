# Customers Service & Store Integration

This document explains how the new customers service and Zustand store work together with the updated customers page.

## Service Layer (`/services/customers.service.ts`)

The service handles all database operations with Supabase:

### Available Functions:
- `getCustomers()` - Fetch all customers
- `getCustomerById(id)` - Fetch single customer
- `createCustomer(payload)` - Create new customer
- `updateCustomer(id, payload)` - Update customer
- `deleteCustomer(id)` - Delete customer (OWNER role required)
- `searchCustomers(term)` - Search customers by name/phone/national_id
- `getCustomerStats()` - Get dashboard statistics

### Example Usage:
```typescript
import { getCustomers, createCustomer } from '@/services/customers.service';

// Fetch customers
const result = await getCustomers();
if (result.success) {
  console.log('Customers:', result.data);
} else {
  console.error('Error:', result.error);
}

// Create customer
const newCustomer = await createCustomer({
  tenant_id: 'uuid-here',
  name: 'John Doe',
  phone: '+1-555-123-4567',
  address: '123 Main St',
  national_id: '123-45-6789'
});
```

## Store Layer (`/store/customers.store.ts`)

The Zustand store manages state and UI interactions:

### Available State:
- `customers` - Array of customers
- `stats` - Customer statistics
- `selectedCustomer` - Currently selected customer
- `isLoading`, `isCreating`, `isUpdating`, `isDeleting`, `isSearching` - Loading states
- `searchTerm` - Current search term
- `error` - Error message

### Available Actions:
- `fetchCustomers()` - Load customers from service
- `fetchCustomerStats()` - Load statistics
- `createNewCustomer(payload)` - Create customer and update state
- `updateExistingCustomer(id, payload)` - Update customer
- `deleteExistingCustomer(id)` - Delete customer
- `searchCustomersAction(term)` - Search customers
- `setSelectedCustomer(customer)` - Set selected customer
- `clearError()` - Clear error messages
- `reset()` - Reset store to initial state

### Example Usage in Components:
```typescript
import { useCustomersStore } from '@/store/customers.store';

function CustomerComponent() {
  const { 
    customers, 
    isLoading, 
    fetchCustomers,
    createNewCustomer 
  } = useCustomersStore();

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = async () => {
    const success = await createNewCustomer({
      tenant_id: 'uuid',
      name: 'Jane Doe',
      phone: '+1-555-987-6543'
    });
    
    if (success) {
      console.log('Customer created successfully!');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

## Updated Customers Page Features

The updated `/customers` page now includes:

### 🔄 Real-time Data Loading
- Automatically fetches customers on mount
- Shows loading spinners during data operations
- Displays proper empty states

### 🔍 Search Functionality
- Debounced search input (300ms delay)
- Searches across name, phone, and national_id
- Loading indicator during search

### 📊 Dynamic Statistics
- Real customer counts from database
- Calculated active customer percentage
- New customers this month tracking

### ⚠️ Error Handling
- Displays error alerts with dismiss button
- Graceful error recovery
- User-friendly error messages

### 🎨 Enhanced UX
- Loading states for all operations
- Smooth transitions and hover effects
- Responsive design maintained
- Proper TypeScript typing

## Next Steps

To complete the integration:

1. **Set up Supabase client** - Ensure `/supabase/database/server.ts` is configured
2. **Add authentication** - Verify user session and tenant_id
3. **Implement CRUD modals** - Add create/edit customer forms
4. **Add real revenue calculation** - Join with installment_plans table
5. **Implement tenant filtering** - Ensure customers are scoped to current tenant

## Database Schema

Based on `customers.sql`, the customers table includes:
- `id` (UUID, primary key)
- `tenant_id` (UUID, foreign key)
- `name` (TEXT, required)
- `phone` (TEXT, optional)
- `address` (TEXT, optional)
- `national_id` (TEXT, optional)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

Row Level Security (RLS) is enabled with policies for tenant-based access control. 