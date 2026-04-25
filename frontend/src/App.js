import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { registerServiceWorker } from "./swRegister";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GuestDashboard from "./pages/GuestDashboard";
import HostDashboard from "./pages/HostDashboard";
import BookingSuccess from "./pages/BookingSuccess";
import BookingHistoryPage from "./pages/BookingHistoryPage";
import AddSpotPage from "./pages/AddSpotPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

// Force Park-Pal branding (title + favicon) + PWA
let deferredInstallPrompt = null;

function useBranding() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    const TITLE = "Park-Pal \u2014 Peer-to-Peer Parking Marketplace";

    function applyBranding() {
      document.title = TITLE;

      // Remove any existing favicons
      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(el => el.remove());

      // Inject Park-Pal favicon
      const ico = document.createElement('link');
      ico.rel = 'icon';
      ico.href = '/favicon.ico';
      document.head.appendChild(ico);

      const png = document.createElement('link');
      png.rel = 'icon';
      png.type = 'image/png';
      png.href = '/favicon.png';
      document.head.appendChild(png);

      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = '/favicon.png';
      document.head.appendChild(apple);
    }

    applyBranding();
    const t1 = setTimeout(applyBranding, 500);
    const t2 = setTimeout(applyBranding, 2000);

    // Watch for title changes and override
    const observer = new MutationObserver(() => {
      if (document.title !== TITLE) {
        document.title = TITLE;
      }
    });
    const titleEl = document.querySelector('title');
    if (titleEl) {
      observer.observe(titleEl, { childList: true });
    }

    // Capture install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      window.dispatchEvent(new Event('parkpal-install-ready'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);
}

function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (deferredInstallPrompt) setCanInstall(true);
    const handler = () => setCanInstall(true);
    window.addEventListener('parkpal-install-ready', handler);
    return () => window.removeEventListener('parkpal-install-ready', handler);
  }, []);

  const install = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setCanInstall(false);
    }
    deferredInstallPrompt = null;
  };

  return { canInstall, install };
}

const InstallBanner = () => {
  const { canInstall, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div
      className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 bg-[#1a1a1a] text-white p-4 z-[9998] flex items-center gap-3"
      style={{ border: '1px solid rgba(223, 255, 0, 0.15)' }}
      data-testid="install-banner"
    >
      <img src="/icon-96x96.png" alt="Park Pal" className="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-xs text-white">Install Park Pal</p>
        <p className="font-mono text-[10px] text-white/30">Add to home screen</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="font-mono text-[10px] text-white/20 hover:text-white/50 px-1"
          data-testid="install-dismiss-btn"
        >
          Later
        </button>
        <button
          onClick={install}
          className="btn-neon font-mono text-[10px] uppercase tracking-wider px-3 py-1.5"
          data-testid="install-accept-btn"
        >
          Install
        </button>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#DFFF00] border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    const dest = user.role === 'host' ? '/host/dashboard' : user.role === 'admin' ? '/admin' : '/guest/dashboard';
    return <Navigate to={dest} replace />;
  }
  
  return children;
};

const AuthRedirect = () => {
  const { user } = useAuth();
  if (user) {
    const dest = user.role === 'host' ? '/host/dashboard' : user.role === 'admin' ? '/admin' : '/guest/dashboard';
    return <Navigate to={dest} replace />;
  }
  return <LandingPage />;
};

function App() {
  useBranding();

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-center" 
          richColors 
          toastOptions={{
            style: {
              fontFamily: 'Roboto, sans-serif',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/guest/dashboard" 
            element={
              <ProtectedRoute allowedRole="guest">
                <GuestDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/guest/bookings" 
            element={
              <ProtectedRoute allowedRole="guest">
                <BookingHistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/host/dashboard" 
            element={
              <ProtectedRoute allowedRole="host">
                <HostDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/host/add-spot" 
            element={
              <ProtectedRoute allowedRole="host">
                <AddSpotPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking/success" 
            element={
              <ProtectedRoute allowedRole="guest">
                <BookingSuccess />
              </ProtectedRoute>
            } 
          />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <InstallBanner />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
