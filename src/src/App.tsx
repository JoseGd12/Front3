import { AuthProvider, useAuth } from "./features/auth/contexts/AuthContext";
import { ThemeProvider } from "./shared/contexts/ThemeContext";
import { LoginPageSimplified } from "./features/auth/components/LoginPageSimplified";
import { Dashboard } from "./features/dashboard/components/Dashboard";
import { ClienteDashboard } from "./features/clientes/components/ClienteDashboard";

function AppContent() {
  const { isAuthenticated, isAdmin, isCliente } = useAuth();

  // Render login if not authenticated
  if (!isAuthenticated) {
    return <LoginPageSimplified />;
  }

  // Full dashboard for admin users
  if (isAdmin()) {
    return <Dashboard />;
  }

  // Cliente dashboard with full navigation
  if (isCliente()) {
    return <ClienteDashboard />;
  }

  return <LoginPageSimplified />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
