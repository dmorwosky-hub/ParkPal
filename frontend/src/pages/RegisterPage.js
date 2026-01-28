import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Car, Mail, Lock, User, ArrowLeft, MapPin, Home } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: searchParams.get('role') || 'guest'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && (roleParam === 'host' || roleParam === 'guest')) {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) {
      toast.error('Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      const user = await register(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role
      );
      toast.success('Account created successfully!');
      navigate(user.role === 'host' ? '/host/dashboard' : '/guest/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECF0F1] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-[#34495E] hover:text-[#E67E22] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        
        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="w-16 h-16 rounded-full bg-[#E67E22] flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#34495E]" style={{ fontFamily: 'Montserrat' }}>
              Create Account
            </CardTitle>
            <CardDescription className="text-slate-500">
              Join Park-Pal today
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'guest' }))}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  formData.role === 'guest'
                    ? "border-[#E67E22] bg-orange-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
                data-testid="role-guest-btn"
              >
                <MapPin className={cn("w-6 h-6", formData.role === 'guest' ? "text-[#E67E22]" : "text-slate-400")} />
                <span className={cn("font-semibold", formData.role === 'guest' ? "text-[#E67E22]" : "text-slate-600")}>
                  I'm a Driver
                </span>
                <span className="text-xs text-slate-500">Find parking</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'host' }))}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  formData.role === 'host'
                    ? "border-[#E67E22] bg-orange-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
                data-testid="role-host-btn"
              >
                <Home className={cn("w-6 h-6", formData.role === 'host' ? "text-[#E67E22]" : "text-slate-400")} />
                <span className={cn("font-semibold", formData.role === 'host' ? "text-[#E67E22]" : "text-slate-600")}>
                  I'm a Host
                </span>
                <span className="text-xs text-slate-500">List my driveway</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#34495E] font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-[#E67E22] focus:ring-[#E67E22] rounded-xl"
                    data-testid="register-name-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#34495E] font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-[#E67E22] focus:ring-[#E67E22] rounded-xl"
                    data-testid="register-email-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#34495E] font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-[#E67E22] focus:ring-[#E67E22] rounded-xl"
                    data-testid="register-password-input"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all btn-active"
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
            <p className="text-center text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#E67E22] font-semibold hover:underline" data-testid="register-to-login-link">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
