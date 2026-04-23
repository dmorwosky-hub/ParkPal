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
    if (!email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back');
      navigate(user.role === 'host' ? '/host/dashboard' : '/guest/dashboard');
    } catch (error) { toast.error(error.response?.data?.detail || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#121212] bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-white/20 hover:text-[#DFFF00]/50 mb-10 font-mono text-[10px] uppercase tracking-wider transition-colors">&larr; back</Link>
        <div style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="bg-[#1a1a1a] p-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-7 h-7 flex items-center justify-center" style={{ border: '1px solid rgba(223,255,0,0.3)' }}>
                <Car size={14} weight="bold" className="text-[#DFFF00]" />
              </div>
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">// login</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">Welcome Back</h1>
            <p className="font-mono text-xs text-white/20 mb-8">Sign in to continue</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Email</Label>
                <div className="relative">
                  <EnvelopeSimple size={14} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 bg-[#121212] border-white/[0.06] text-white placeholder:text-white/15 focus:border-[#DFFF00]/30 focus:ring-0 rounded-none font-mono text-sm"
                    data-testid="login-email-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock size={14} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-11 bg-[#121212] border-white/[0.06] text-white placeholder:text-white/15 focus:border-[#DFFF00]/30 focus:ring-0 rounded-none font-mono text-sm"
                    data-testid="login-password-input" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 btn-neon rounded-none font-mono text-xs uppercase tracking-wider" data-testid="login-submit-btn">
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" /> : 'Sign In'}
              </Button>
            </form>
            <p className="text-center font-mono text-[10px] text-white/20 mt-6">
              No account? <Link to="/register" className="text-[#DFFF00]/50 hover:text-[#DFFF00]" data-testid="login-to-register-link">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
