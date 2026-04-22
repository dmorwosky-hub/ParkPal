import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Car, EnvelopeSimple, Lock, User, MapPin, House } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '',
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
    if (!formData.email || !formData.password || !formData.fullName) { toast.error('Please fill in all fields'); return; }
    if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(formData.email, formData.password, formData.fullName, formData.role);
      toast.success('Account created!');
      navigate(user.role === 'host' ? '/host/dashboard' : '/guest/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#022c22] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#34d399] mb-8 transition-colors text-sm">
          &larr; Back to home
        </Link>
        <div className="glass rounded-xl overflow-hidden">
          <div className="text-center pb-2 pt-10 px-8">
            <div className="w-14 h-14 rounded-xl bg-[#34d399] flex items-center justify-center mx-auto mb-5">
              <Car size={28} weight="bold" className="text-[#022c22]" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">Create Account</h1>
            <p className="text-slate-400 text-sm mt-1">Join Park-Pal today</p>
          </div>
          <div className="p-8">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, role: 'guest' }))}
                className={cn("p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                  formData.role === 'guest' ? "border-[#34d399] bg-[#34d399]/10" : "border-white/10 hover:border-white/20"
                )} data-testid="role-guest-btn">
                <MapPin size={24} weight="light" className={formData.role === 'guest' ? "text-[#34d399]" : "text-slate-500"} />
                <span className={cn("font-semibold text-sm", formData.role === 'guest' ? "text-[#34d399]" : "text-slate-400")}>I'm a Driver</span>
                <span className="text-xs text-slate-600">Find parking</span>
              </button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, role: 'host' }))}
                className={cn("p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                  formData.role === 'host' ? "border-[#34d399] bg-[#34d399]/10" : "border-white/10 hover:border-white/20"
                )} data-testid="role-host-btn">
                <House size={24} weight="light" className={formData.role === 'host' ? "text-[#34d399]" : "text-slate-500"} />
                <span className={cn("font-semibold text-sm", formData.role === 'host' ? "text-[#34d399]" : "text-slate-400")}>I'm a Host</span>
                <span className="text-xs text-slate-600">List my driveway</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium text-sm">Full Name</Label>
                <div className="relative">
                  <User size={18} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input type="text" placeholder="John Doe" value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#34d399] focus:ring-[#34d399]/20 rounded-xl"
                    data-testid="register-name-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium text-sm">Email</Label>
                <div className="relative">
                  <EnvelopeSimple size={18} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input type="email" placeholder="you@example.com" value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#34d399] focus:ring-[#34d399]/20 rounded-xl"
                    data-testid="register-email-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium text-sm">Password</Label>
                <div className="relative">
                  <Lock size={18} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input type="password" placeholder="••••••••" value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#34d399] focus:ring-[#34d399]/20 rounded-xl"
                    data-testid="register-password-input" />
                </div>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full h-12 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold shadow-lg shadow-emerald-500/20 btn-active"
                data-testid="register-submit-btn">
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#022c22] border-t-transparent" /> : 'Create Account'}
              </Button>
            </form>
            <p className="text-center text-slate-500 mt-6 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#34d399] font-semibold hover:underline" data-testid="register-to-login-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
