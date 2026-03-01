  import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ThemeProvider } from "./components/ThemeContext";
import { Dashboard } from "./components/Dashboard";
import { ClienteDashboard } from "./components/ClienteDashboard";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { EmailVerificationPage } from "./components/EmailVerificationPage";

function AppContent() {
  const { isAuthenticated, isAdmin, isCliente } = useAuth();
  const [publicView, setPublicView] = useState<"landing" | "login" | "register" | "verify">("landing");

  const [resetData, setResetData] = useState<{ email: string; token: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      setPublicView("landing");
    }

    // Solución REAL: Detectar parámetros y ruta de recuperación/verificación
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');
    const isResetPage = window.location.pathname.includes('reset-password');
    const isVerifyPage = window.location.pathname.includes('verify-email');

    // Priorizar siempre el mode proporcionado por Firebase por encima de la ruta, 
    // en caso de que la URL de redirección en Firebase Console esté mal configurada.
    if ((mode === 'resetPassword' || (isResetPage && mode !== 'verifyEmail')) && oobCode) {
      console.log('🎯 Solución REAL: Detectado oobCode para reseteo, abriendo formulario personalizado');
      setPublicView("login");
      setResetData({ email: '', token: oobCode });

      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } 
    else if ((mode === 'verifyEmail' || (isVerifyPage && mode !== 'resetPassword')) && oobCode) {
      console.log('📧 Detectado oobCode para verificación de email');
      setVerifyCode(oobCode);
      setPublicView("verify");

      const newUrl = window.location.origin + '/'; // O la ruta base
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [isAuthenticated]);

  // Render landing page if not authenticated
  if (!isAuthenticated) {
    if (publicView === "verify") {
      return (
        <EmailVerificationPage 
          oobCode={verifyCode}
          onVerificationComplete={() => {
            setVerifyCode('');
            setPublicView('login');
          }}
          onBackToLogin={() => {
            setVerifyCode('');
            setPublicView('login');
          }}
        />
      );
    }
    if (publicView === "login") {
      return (
        <LoginPage
          onRequestRegister={() => setPublicView("register")}
          onBackToLanding={() => setPublicView("landing")}
          initialResetData={resetData}
          onResetComplete={() => setResetData(null)}
        />
      );
    }

    if (publicView === "register") {
      return <RegisterPage onBack={() => setPublicView("login")} />;
    }

    return (
      <LandingPage
        onRequestLogin={() => setPublicView("login")}
        onRequestRegister={() => setPublicView("register")}
      />
    );
  }

  // Full dashboard for admin users
  if (isAdmin()) {
    return <Dashboard />;
  }

  // Cliente dashboard with full navigation
  if (isCliente()) {
    return <ClienteDashboard />;
  }

  return <LandingPage />;
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