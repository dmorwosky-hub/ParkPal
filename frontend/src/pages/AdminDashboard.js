import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Car, Users, MapPin, CurrencyDollar, ChartBar, ShieldCheck, WarningCircle, SignOut, Gear, Check, X, Prohibit, Eye, SpinnerGap } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState({ users: [], total: 0 });
  const [violations, setViolations] = useState({ violations: [] });
  const [pendingSpots, setPendingSpots] = useState({ spots: [] });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const h = useCallback(() => getAuthHeaders(), [getAuthHeaders]);
  const fetchDashboard = useCallback(async () => { try { const r = await axios.get(`${API}/admin/dashboard`, h()); setDashboard(r.data); } catch(e){ console.error(e); } }, [h]);
  const fetchUsers = useCallback(async () => { try { const r = await axios.get(`${API}/admin/users`, h()); setUsers(r.data); } catch(e){} }, [h]);
  const fetchViolations = useCallback(async () => { try { const r = await axios.get(`${API}/admin/violations`, h()); setViolations(r.data); } catch(e){} }, [h]);
  const fetchPending = useCallback(async () => { try { const r = await axios.get(`${API}/admin/spots/pending-verification`, h()); setPendingSpots(r.data); } catch(e){} }, [h]);
  const fetchHealth = useCallback(async () => { try { const r = await axios.get(`${API}/admin/system-health`, h()); setHealth(r.data); } catch(e){} }, [h]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchUsers(), fetchViolations(), fetchPending(), fetchHealth()]);
      setLoading(false);
    })();
  }, [fetchDashboard, fetchUsers, fetchViolations, fetchPending, fetchHealth]);

  const handleBlockUser = async (userId) => {
    try { await axios.post(`${API}/admin/users/${userId}/block`, {}, h()); fetchUsers(); toast.success('User status updated'); } catch(e) { toast.error('Failed'); }
  };
  const handleVerifySpot = async (spotId) => {
    try { await axios.post(`${API}/admin/spots/${spotId}/verify`, {}, h()); fetchPending(); fetchDashboard(); toast.success('Spot verified'); } catch(e) { toast.error('Failed'); }
  };
  const handleRejectSpot = async (spotId) => {
    try { await axios.post(`${API}/admin/spots/${spotId}/reject`, {}, h()); fetchPending(); toast.success('Spot rejected'); } catch(e) { toast.error('Failed'); }
  };
  const handleResolveViolation = async (vid) => {
    try { await axios.post(`${API}/admin/violations/${vid}/resolve`, {}, h()); fetchViolations(); toast.success('Resolved'); } catch(e) { toast.error('Failed'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#121212]"><SpinnerGap size={32} className="text-[#DFFF00] animate-spin" /></div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'disputes', label: 'Disputes', icon: WarningCircle },
    { id: 'health', label: 'System', icon: Gear },
  ];

  return (
    <div className="min-h-screen bg-[#121212] bg-grid">
      {/* Header */}
      <header className="bg-[#121212] px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center" style={{ border: '1px solid rgba(223,255,0,0.3)' }}><Car size={12} weight="bold" className="text-[#DFFF00]" /></div>
          <span className="font-heading font-bold text-xs text-white tracking-wide uppercase">Admin</span>
          <span className="font-mono text-[9px] text-[#DFFF00]/30 uppercase tracking-wider ml-2">// control_panel</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/30">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }} className="text-white/20 hover:text-red-400 rounded-none h-7 w-7" data-testid="admin-logout"><SignOut size={14} /></Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-48 min-h-[calc(100vh-45px)] bg-[#0e0e0e] py-4" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider transition-colors ${tab === t.id ? 'text-[#DFFF00] bg-[#DFFF00]/[0.04]' : 'text-white/20 hover:text-white/40'}`}
              style={tab === t.id ? { borderLeft: '2px solid #DFFF00' } : { borderLeft: '2px solid transparent' }}>
              <t.icon size={14} weight="light" /> {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-45px)]">
          {/* OVERVIEW */}
          {tab === 'overview' && dashboard && (
            <div className="space-y-6">
              <div className="font-mono text-[10px] text-[#DFFF00]/30 uppercase tracking-[0.3em]">// revenue_overview</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04]">
                {[
                  { label: 'TOTAL_REVENUE', value: `$${dashboard.revenue.total.toFixed(2)}`, color: 'text-[#DFFF00]' },
                  { label: 'PLATFORM_FEES', value: `$${dashboard.revenue.platform_fees.toFixed(2)}`, color: 'text-[#DFFF00]' },
                  { label: 'HOST_PAYOUTS', value: `$${dashboard.revenue.host_payouts.toFixed(2)}`, color: 'text-white' },
                  { label: 'PROMO_REVENUE', value: `$${dashboard.revenue.promotion_revenue.toFixed(2)}`, color: 'text-white' },
                ].map(s => (
                  <div key={s.label} className="bg-[#1a1a1a] p-5" data-testid={`stat-${s.label.toLowerCase()}`}>
                    <p className="font-mono text-[9px] text-white/20 uppercase tracking-wider">{s.label}</p>
                    <p className={`data-value text-2xl mt-2 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04]">
                {[
                  { label: 'USERS', value: dashboard.users.total },
                  { label: 'HOSTS', value: dashboard.users.hosts },
                  { label: 'ACTIVE_SPOTS', value: dashboard.spots.active },
                  { label: 'VERIFIED', value: dashboard.spots.verified },
                ].map(s => (
                  <div key={s.label} className="bg-[#161616] p-4">
                    <p className="font-mono text-[9px] text-white/20 uppercase tracking-wider">{s.label}</p>
                    <p className="data-value text-xl text-white mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
              {dashboard.monthly.length > 0 && (
                <div className="bg-[#1a1a1a] p-6" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="font-mono text-[10px] text-white/20 uppercase tracking-wider mb-4">Monthly Revenue</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboard.monthly}>
                        <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip formatter={v => [`$${v.toFixed(2)}`]} contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#fff' }} />
                        <Bar dataKey="revenue" fill="#DFFF00" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="font-mono text-[10px] text-[#DFFF00]/30 uppercase tracking-[0.3em]">// user_management ({users.total})</div>
              <div className="space-y-[1px]">
                {users.users.map(u => (
                  <div key={u.id} className="bg-[#1a1a1a] p-4 flex items-center justify-between" data-testid={`user-${u.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 flex items-center justify-center" style={{ border: `1px solid ${u.is_blocked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                        <span className={`font-mono text-xs font-bold ${u.is_blocked ? 'text-red-400' : 'text-white/40'}`}>{u.full_name?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm">{u.full_name} <span className="font-mono text-[9px] text-white/20 uppercase ml-2">{u.role}</span></p>
                        <p className="font-mono text-[10px] text-white/20">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.is_blocked && <span className="font-mono text-[9px] text-red-400 uppercase">Blocked</span>}
                      {u.is_verified && <ShieldCheck size={14} className="text-[#DFFF00]" />}
                      <span className="font-mono text-[10px] text-white/15">{u.role === 'host' ? `${u.spot_count || 0} spots` : `${u.booking_count || 0} bookings`}</span>
                      {u.role !== 'admin' && (
                        <Button onClick={() => handleBlockUser(u.id)} className={`h-7 rounded-none font-mono text-[9px] uppercase ${u.is_blocked ? 'bg-white/5 text-white/30' : 'bg-red-500/10 text-red-400'}`} style={{ border: '1px solid rgba(255,255,255,0.04)' }} data-testid={`block-${u.id}`}>
                          {u.is_blocked ? 'Unblock' : 'Block'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VERIFICATION */}
          {tab === 'verification' && (
            <div className="space-y-4">
              <div className="font-mono text-[10px] text-[#DFFF00]/30 uppercase tracking-[0.3em]">// pending_verification ({pendingSpots.spots.length})</div>
              {pendingSpots.spots.length === 0 ? (
                <div className="bg-[#1a1a1a] p-12 text-center" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                  <ShieldCheck size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="font-mono text-[10px] text-white/20">No pending verifications</p>
                </div>
              ) : pendingSpots.spots.map(s => (
                <div key={s.id} className="bg-[#1a1a1a] p-5" style={{ border: '1px solid rgba(255,255,255,0.04)' }} data-testid={`verify-spot-${s.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-heading text-white text-sm">{s.address}</p>
                      <p className="font-mono text-[10px] text-white/20">{s.city}, {s.state} &middot; Host: {s.host_name} ({s.host_email})</p>
                    </div>
                    <span className="font-mono text-[9px] text-amber-400 uppercase">Pending</span>
                  </div>
                  {s.verification_photo_path && (
                    <div className="mb-3 text-xs text-white/30 font-mono">Photo uploaded: {s.verification_photo_path.split('/').pop()}</div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => handleVerifySpot(s.id)} className="h-8 btn-neon rounded-none font-mono text-[10px] uppercase" data-testid={`approve-${s.id}`}>
                      <Check size={12} className="mr-1" /> Approve
                    </Button>
                    <Button onClick={() => handleRejectSpot(s.id)} className="h-8 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-none font-mono text-[10px] uppercase" style={{ border: '1px solid rgba(239,68,68,0.2)' }} data-testid={`reject-${s.id}`}>
                      <X size={12} className="mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DISPUTES */}
          {tab === 'disputes' && (
            <div className="space-y-4">
              <div className="font-mono text-[10px] text-[#DFFF00]/30 uppercase tracking-[0.3em]">// disputes ({violations.violations.length})</div>
              {violations.violations.length === 0 ? (
                <div className="bg-[#1a1a1a] p-12 text-center" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                  <WarningCircle size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="font-mono text-[10px] text-white/20">No disputes</p>
                </div>
              ) : violations.violations.map(v => (
                <div key={v.id} className="bg-[#1a1a1a] p-5" style={{ border: '1px solid rgba(255,255,255,0.04)' }} data-testid={`violation-${v.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white text-sm">Violation: {v.reason}</p>
                      <p className="font-mono text-[10px] text-white/20">
                        Host: {v.host_name} &middot; Plate: {v.booking?.license_plate} &middot; ${v.booking?.total_amount?.toFixed(2)}
                      </p>
                    </div>
                    <span className={`font-mono text-[9px] uppercase ${v.status === 'reported' ? 'text-amber-400' : 'text-white/20'}`}>{v.status}</span>
                  </div>
                  {v.status === 'reported' && (
                    <Button onClick={() => handleResolveViolation(v.id)} className="h-8 btn-neon rounded-none font-mono text-[10px] uppercase" data-testid={`resolve-${v.id}`}>
                      <Check size={12} className="mr-1" /> Mark Resolved
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SYSTEM HEALTH */}
          {tab === 'health' && health && (
            <div className="space-y-6">
              <div className="font-mono text-[10px] text-[#DFFF00]/30 uppercase tracking-[0.3em]">// system_health</div>
              <div className="space-y-[1px]">
                {Object.entries(health.integrations).map(([key, val]) => (
                  <div key={key} className="bg-[#1a1a1a] p-4 flex items-center justify-between" data-testid={`health-${key}`}>
                    <div>
                      <p className="font-mono text-xs text-white uppercase">{key.replace('_', ' ')}</p>
                      <p className="font-mono text-[10px] text-white/20 mt-0.5">{val.message}</p>
                    </div>
                    <div className={`w-2 h-2 ${val.status === 'active' ? 'bg-[#DFFF00]' : 'bg-red-500'}`} />
                  </div>
                ))}
              </div>

              <div className="font-mono text-[10px] text-white/20 uppercase tracking-wider mt-6">Database Collections</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
                {Object.entries(health.database).map(([col, count]) => (
                  <div key={col} className="bg-[#161616] p-3">
                    <p className="font-mono text-[9px] text-white/20">{col}</p>
                    <p className="data-value text-lg text-white mt-1">{count}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#1a1a1a] p-6" style={{ border: '1px solid rgba(223,255,0,0.08)' }}>
                <p className="font-mono text-[10px] text-[#DFFF00]/40 uppercase tracking-wider mb-4">// handover_guide</p>
                <div className="space-y-2">
                  {health.handover_guide.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 py-2" style={i < health.handover_guide.steps.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.03)' } : {}}>
                      <span className="font-mono text-[10px] text-[#DFFF00]/30">{String(i + 1).padStart(2, '0')}</span>
                      <p className="font-mono text-xs text-white/40">{step.replace(/^\d+\.\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
