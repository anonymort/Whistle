import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLogin from "@/components/admin-login";
import AdminDashboardContent from "@/components/admin-dashboard-content";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user has valid session on mount
  const { data: sessionValid, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/admin/check-auth'],
    retry: false,
    staleTime: 0,
    enabled: true,
  });

  useEffect(() => {
    if (!sessionLoading) {
      if (sessionValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_authenticated');
      }
      setIsLoading(false);
    }
  }, [sessionValid, sessionLoading]);

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
    sessionStorage.setItem('admin_authenticated', 'true');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-soft flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboardContent onLogout={handleLogout} />;
}