import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  MoreHorizontal, 
  Users, 
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  Loader2
} from "lucide-react";
import { Customer } from "@/services/customers.service";

interface CustomerListProps {
  customers: Customer[];
  isLoading: boolean;
  searchTerm: string;
}

export default function CustomerList({ customers, isLoading, searchTerm }: CustomerListProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const mockCustomerData = () => ({
    activePlans: Math.floor(Math.random() * 4),
    totalSpent: Math.floor(Math.random() * 10000) + 1000,
    status: Math.random() > 0.2 ? "Active" : "Inactive"
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer List</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No customers match your search criteria.' : 'Get started by adding your first customer.'}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => {
              const mockData = mockCustomerData();
              return (
                <div
                  key={customer.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/avatars/${getInitials(customer.name).toLowerCase()}.png`} />
                    <AvatarFallback>
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <Badge variant={mockData.status === "Active" ? "default" : "secondary"}>
                        {mockData.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {customer.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {customer.address}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Joined: {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        {mockData.activePlans} active plans
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Total Spent: </span>
                        <span className="font-semibold text-green-600">
                          ${mockData.totalSpent.toLocaleString()}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 