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
  const { isAuthenticated, isAdmin, isCliente, logout } = useAuth();
  const [publicView, setPublicView] = useState<"landing" | "login" | "register" | "verify">("landing");

  // Estados para forzar cambio de contraseña
  const [pwdStatus, setPwdStatus] = useState<'OK' | 'FIRST_LOGIN' | 'EXPIRED' | null>(null);
  const [checkingPwd, setCheckingPwd] = useState(false);

  const [resetData, setResetData] = useState<{ email: string; token: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      setPublicView("landing");
      setCheckingPwd(true);

      const checkPwd = async () => {
        const { auth } = await import('./services/firebase');
        const { checkPasswordPolicy } = await import('./services/authUtils');

        // Esperamos a que Firebase actualice auth.currentUser si es necesario
        // En un hook o contexto onAuthStateChanged esto sería inmediato
        const status = await checkPasswordPolicy(auth.currentUser);
        setPwdStatus(status);
        setCheckingPwd(false);
      };
      checkPwd();
    } else {
      setPwdStatus(null);
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

  if (checkingPwd) {
    return (
      <div className="min-h-screen bg-gray-darkest flex items-center justify-center">
        <div className="text-white-primary animate-pulse">Validando credenciales Seguras...</div>
      </div>
    );
  }

  if (pwdStatus === 'FIRST_LOGIN' || pwdStatus === 'EXPIRED') {
    const { ForzarCambioPassword } = require('./components/ForzarCambioPassword');
    return (
      <ForzarCambioPassword
        reason={pwdStatus === 'FIRST_LOGIN' ? 'first_login' : 'expired'}
        onComplete={() => setPwdStatus('OK')}
        onCancelLogout={logout}
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