import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Car, EnvelopeSimple, Lock } from '@phosphor-icons/react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      navigate(user.role === 'host' ? '/host/dashboard' : '/guest/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
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
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in to your Park-Pal account</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium text-sm">Email</Label>
                <div className="relative">
                  <EnvelopeSimple size={18} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="email" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#34d399] focus:ring-[#34d399]/20 rounded-xl"
                    data-testid="login-email-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 font-medium text-sm">Password</Label>
                <div className="relative">
                  <Lock size={18} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#34d399] focus:ring-[#34d399]/20 rounded-xl"
                    data-testid="login-password-input"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full h-12 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold shadow-lg shadow-emerald-500/20 btn-active"
                data-testid="login-submit-btn"
              >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#022c22] border-t-transparent" /> : 'Sign In'}
              </Button>
            </form>
            <p className="text-center text-slate-500 mt-6 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#34d399] font-semibold hover:underline" data-testid="login-to-register-link">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
