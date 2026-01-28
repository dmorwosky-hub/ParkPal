import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GuestDashboard from "./pages/GuestDashboard";
import HostDashboard from "./pages/HostDashboard";
import BookingSuccess from "./pages/BookingSuccess";
import AddSpotPage from "./pages/AddSpotPage";
import "./App.css";

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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
