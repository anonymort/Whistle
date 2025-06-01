import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminLogin from "@/components/admin-login";
import AdminDashboardContent from "@/components/admin-dashboard-content";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const { toast } = useToast();

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin dashboard",
    });
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboardContent onLogout={handleLogout} />;
}