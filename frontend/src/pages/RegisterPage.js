import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Car, EnvelopeSimple, Lock, User, MapPin, House } from '@phosphor-icons/react';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: searchParams.get('role') || 'guest' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const r = searchParams.get('role');
    if (r && (r === 'host' || r === 'guest')) setFormData(p => ({ ...p, role: r }));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) { toast.error('Fill in all fields'); return; }
    if (formData.password.length < 6) { toast.error('Min 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(formData.email, formData.password, formData.fullName, formData.role);
      toast.success('Account created');
      navigate(user.role === 'host' ? '/host/dashboard' : '/guest/dashboard');
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed'); }
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
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">// register</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight mb-1">Create Account</h1>
            <p className="font-mono text-xs text-white/20 mb-6">Join Park-Pal</p>
            {/* Role toggle */}
            <div className="grid grid-cols-2 gap-[1px] bg-white/[0.04] mb-6">
              {[
                { value: 'guest', label: 'DRIVER', icon: MapPin, sub: 'Find parking' },
                { value: 'host', label: 'HOST', icon: House, sub: 'List driveway' }
              ].map(r => (
                <button key={r.value} type="button" onClick={() => setFormData(p => ({ ...p, role: r.value }))}
                  className={`p-4 text-center transition-all ${formData.role === r.value ? 'bg-[#DFFF00]/[0.05]' : 'bg-[#161616]'}`}
                  style={formData.role === r.value ? { border: '1px solid rgba(223,255,0,0.2)' } : { border: '1px solid transparent' }}
                  data-testid={`role-${r.value}-btn`}>
                  <r.icon size={18} weight="light" className={formData.role === r.value ? 'text-[#DFFF00] mx-auto mb-2' : 'text-white/20 mx-auto mb-2'} />
                  <p className={`font-mono text-[10px] uppercase tracking-wider ${formData.role === r.value ? 'text-[#DFFF00]' : 'text-white/30'}`}>{r.label}</p>
                  <p className="font-mono text-[9px] text-white/15 mt-0.5">{r.sub}</p>
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Full Name</Label>
                <div className="relative">
                  <User size={14} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <Input type="text" placeholder="John Doe" value={formData.fullName} onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                    className="pl-9 h-11 bg-[#121212] border-white/[0.06] text-white placeholder:text-white/15 focus:border-[#DFFF00]/30 focus:ring-0 rounded-none font-mono text-sm"
                    data-testid="register-name-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Email</Label>
                <div className="relative">
                  <EnvelopeSimple size={14} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <Input type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="pl-9 h-11 bg-[#121212] border-white/[0.06] text-white placeholder:text-white/15 focus:border-[#DFFF00]/30 focus:ring-0 rounded-none font-mono text-sm"
                    data-testid="register-email-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock size={14} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <Input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                    className="pl-9 h-11 bg-[#121212] border-white/[0.06] text-white placeholder:text-white/15 focus:border-[#DFFF00]/30 focus:ring-0 rounded-none font-mono text-sm"
                    data-testid="register-password-input" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 btn-neon rounded-none font-mono text-xs uppercase tracking-wider" data-testid="register-submit-btn">
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" /> : 'Create Account'}
              </Button>
            </form>
            <p className="text-center font-mono text-[10px] text-white/20 mt-6">
              Have an account? <Link to="/login" className="text-[#DFFF00]/50 hover:text-[#DFFF00]" data-testid="register-to-login-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
