import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import WhistleblowingPortal from "@/pages/whistleblowing-portal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={WhistleblowingPortal} />
      <Route path="/portal" component={WhistleblowingPortal} />
      <Route component={WhistleblowingPortal} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
