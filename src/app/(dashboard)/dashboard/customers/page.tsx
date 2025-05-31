import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Users, 
  CreditCard,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";

export const metadata: Metadata = {
  title: "Customers - Installment Management",
  description: "Manage your customers and their information",
};

const mockCustomers = [
  {
    id: "1",
    name: "Alice Johnson",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, New York, NY",
    nationalId: "123-45-6789",
    activePlans: 2,
    totalSpent: 5500.00,
    joinDate: "2023-12-15",
    status: "Active",
  },
  {
    id: "2",
    name: "Bob Smith",
    phone: "+1 (555) 987-6543",
    address: "456 Oak Ave, Los Angeles, CA",
    nationalId: "987-65-4321",
    activePlans: 1,
    totalSpent: 3200.00,
    joinDate: "2024-01-02",
    status: "Active",
  },
  {
    id: "3",
    name: "Carol Davis",
    phone: "+1 (555) 456-7890",
    address: "789 Pine St, Chicago, IL",
    nationalId: "456-78-9012",
    activePlans: 3,
    totalSpent: 8900.00,
    joinDate: "2023-11-20",
    status: "Active",
  },
  {
    id: "4",
    name: "David Wilson",
    phone: "+1 (555) 321-0987",
    address: "321 Elm St, Houston, TX",
    nationalId: "321-09-8765",
    activePlans: 0,
    totalSpent: 1200.00,
    joinDate: "2023-10-10",
    status: "Inactive",
  },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">
            Manage your customer base and track their installment plans
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCustomers.length}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCustomers.filter(c => c.status === "Active").length}
            </div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCustomers.reduce((sum, c) => sum + c.activePlans, 0)}
            </div>
            <p className="text-xs text-muted-foreground">+10% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search customers..." className="pl-10" />
        </div>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`/avatars/${customer.name.split(' ').map(n => n[0]).join('').toLowerCase()}.png`} />
                  <AvatarFallback>
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <Badge variant={customer.status === "Active" ? "default" : "secondary"}>
                      {customer.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {customer.address}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Joined: {new Date(customer.joinDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      {customer.activePlans} active plans
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Total Spent: </span>
                      <span className="font-semibold text-green-600">
                        ${customer.totalSpent.toLocaleString()}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 