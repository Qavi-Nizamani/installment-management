import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pl-16">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className=" mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 