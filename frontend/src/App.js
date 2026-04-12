import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
import "./App.css";

// Force Park-Pal branding (title + favicon)
function useBranding() {
  useEffect(() => {
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
    // Re-apply after a delay to beat any async scripts
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

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, []);
}

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F1]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E67E22] border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'host' ? '/host/dashboard' : '/guest/dashboard'} replace />;
  }
  
  return children;
};

const AuthRedirect = () => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.role === 'host' ? '/host/dashboard' : '/guest/dashboard'} replace />;
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
