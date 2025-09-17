"use client";

import { useState } from "react";
import { Users, UserPlus, Shield, Mail, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteMemberModal } from "./InviteMemberModal";
import { MemberList } from "./MemberList";

export default function MembersManagementScreen() {
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mock data - will be replaced with real data later
  const mockMembers = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "OWNER" as const,
      avatar: null,
      joinedAt: "2024-01-15T10:00:00Z",
      status: "active" as const,
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "MANAGER" as const,
      avatar: null,
      joinedAt: "2024-02-20T14:30:00Z",
      status: "active" as const,
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      role: "AGENT" as const,
      avatar: null,
      joinedAt: "2024-03-10T09:15:00Z",
      status: "pending" as const,
    },
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "MANAGER":
        return "secondary";
      case "AGENT":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Shield className="h-4 w-4" />;
      case "MANAGER":
        return <Users className="h-4 w-4" />;
      case "AGENT":
        return <UserPlus className="h-4 w-4" />;
      default:
        return <UserPlus className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your team members and invite new collaborators to your workspace.
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{mockMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Owners</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockMembers.filter(m => m.role === "OWNER").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockMembers.filter(m => m.role === "MANAGER").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockMembers.filter(m => m.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage your organization members and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberList members={mockMembers} />
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      <InviteMemberModal 
        open={showInviteModal} 
        onOpenChange={setShowInviteModal} 
      />
    </div>
  );
}
