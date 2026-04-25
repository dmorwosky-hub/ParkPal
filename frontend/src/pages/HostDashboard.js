import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Car, MapPin, Plus, CurrencyDollar, Clock, Power, WarningCircle, SignOut, Bell, X, SpinnerGap, Timer, PencilSimple, Check, Sparkle, Star, Lightning, Trash, TrendUp } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HostDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [spots, setSpots] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingSpot, setEditingSpot] = useState(null);
  const [autoOffHours, setAutoOffHours] = useState('');
  const [violationDialog, setViolationDialog] = useState(false);
  const [violationBooking, setViolationBooking] = useState(null);
  const [violationReason, setViolationReason] = useState('');
  const [violationLoading, setViolationLoading] = useState(false);
  const [promoDialog, setPromoDialog] = useState(false);
  const [promoSpot, setPromoSpot] = useState(null);
  const [promoPackage, setPromoPackage] = useState('');
  const [promoPackages, setPromoPackages] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [earnings, setEarnings] = useState(null);

  const fetchSpots = useCallback(async () => { try { const r = await axios.get(`${API}/spots/my`, getAuthHeaders()); setSpots(r.data); } catch(e){} }, [getAuthHeaders]);
  const fetchActiveBookings = useCallback(async () => { try { const r = await axios.get(`${API}/bookings/active/host`, getAuthHeaders()); setActiveBookings(r.data); } catch(e){} }, [getAuthHeaders]);
  const fetchNotifications = useCallback(async () => { try { const r = await axios.get(`${API}/notifications`, getAuthHeaders()); setNotifications(r.data); } catch(e){} }, [getAuthHeaders]);
  const fetchPromoPackages = useCallback(async () => { try { const r = await axios.get(`${API}/promotions/packages`); setPromoPackages(r.data.packages); } catch(e){} }, []);
  const fetchEarnings = useCallback(async () => { try { const r = await axios.get(`${API}/stats/host`, getAuthHeaders()); setEarnings(r.data); } catch(e){} }, [getAuthHeaders]);

  useEffect(() => {
    const promoSuccess = searchParams.get('promo_success');
    const sessionId = searchParams.get('session_id');
    if (promoSuccess === 'true' && sessionId) {
      (async () => { try { await axios.get(`${API}/promotions/status/${sessionId}`, getAuthHeaders()); toast.success('Spot promoted!'); fetchSpots(); navigate('/host/dashboard', { replace: true }); } catch(e){} })();
    }
  }, [searchParams, getAuthHeaders, navigate, fetchSpots]);

  useEffect(() => {
    (async () => { setLoading(true); await Promise.all([fetchSpots(), fetchActiveBookings(), fetchNotifications(), fetchPromoPackages(), fetchEarnings()]); setLoading(false); })();
    const i = setInterval(() => { fetchSpots(); fetchActiveBookings(); }, 30000);
    return () => clearInterval(i);
  }, [fetchSpots, fetchActiveBookings, fetchNotifications, fetchPromoPackages, fetchEarnings]);

  const handleToggleActive = async (spotId) => { try { const r = await axios.post(`${API}/spots/${spotId}/toggle`, {}, getAuthHeaders()); setSpots(p => p.map(s => s.id === spotId ? r.data : s)); toast.success(r.data.is_active ? 'Spot active!' : 'Spot deactivated'); } catch(e) { toast.error('Failed'); } };
  const handleSetAutoOff = async (spotId) => { if (!autoOffHours) return; try { const r = await axios.patch(`${API}/spots/${spotId}`, { auto_off_hours: parseInt(autoOffHours), is_active: true }, getAuthHeaders()); setSpots(p => p.map(s => s.id === spotId ? r.data : s)); setAutoOffHours(''); toast.success(`Auto-off: ${autoOffHours}h`); } catch(e) { toast.error('Failed'); } };
  const handleUpdatePricing = async (spotId) => { if (!editingSpot) return; try { const r = await axios.patch(`${API}/spots/${spotId}`, { hourly_rate: parseFloat(editingSpot.hourly_rate), event_rate: editingSpot.event_rate ? parseFloat(editingSpot.event_rate) : null }, getAuthHeaders()); setSpots(p => p.map(s => s.id === spotId ? r.data : s)); setEditingSpot(null); toast.success('Pricing updated'); } catch(e) { toast.error('Failed'); } };
  const handleDeleteSpot = async (spotId) => { if (!window.confirm('Delete this spot?')) return; try { await axios.delete(`${API}/spots/${spotId}`, getAuthHeaders()); setSpots(p => p.filter(s => s.id !== spotId)); toast.success('Deleted'); } catch(e) { toast.error(e.response?.data?.detail || 'Failed'); } };
  const handleReportViolation = async () => { if (!violationBooking || !violationReason) return; setViolationLoading(true); try { await axios.post(`${API}/violations/report`, { booking_id: violationBooking.id, reason: violationReason }, getAuthHeaders()); toast.success('Violation reported'); setViolationDialog(false); setViolationBooking(null); setViolationReason(''); } catch(e) { toast.error('Failed'); } finally { setViolationLoading(false); } };
  const handlePromoteSpot = async () => { if (!promoSpot || !promoPackage) return; setPromoLoading(true); try { const r = await axios.post(`${API}/promotions/checkout`, { spot_id: promoSpot.id, package: promoPackage, origin_url: window.location.origin }, getAuthHeaders()); window.location.href = r.data.checkout_url; } catch(e) { toast.error(e.response?.data?.detail || 'Failed'); setPromoLoading(false); } };

  const getRemainingTime = (endTime) => { if (!endTime) return null; const d = new Date(endTime) - new Date(); if (d <= 0) return 'Expired'; const h = Math.floor(d/(1000*60*60)); const m = Math.floor((d%(1000*60*60))/(1000*60)); return `${h}h ${m}m`; };
  const getPromoTimeLeft = (expires) => { if (!expires) return null; const d = new Date(expires) - new Date(); if (d <= 0) return 'Expired'; const days = Math.floor(d/(1000*60*60*24)); const h = Math.floor((d%(1000*60*60*24))/(1000*60*60)); return days > 0 ? `${days}d ${h}h` : `${h}h`; };
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#121212]"><SpinnerGap size={32} weight="light" className="text-[#DFFF00] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="glass px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Park Pal" className="h-7" />
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#DFFF00]/10 text-[#DFFF00] font-medium border border-[#DFFF00]/20 ml-1">Host</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white hover:bg-white/5 rounded-none" onClick={() => setShowNotifications(!showNotifications)} data-testid="notifications-btn">
            <Bell size={18} weight="light" />{unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DFFF00] text-[#022c22] text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
          </Button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bp-card">
            <div className="w-7 h-7 rounded-none bg-[#1a1a1a] flex items-center justify-center"><span className="text-[#DFFF00] text-xs font-bold">{user?.full_name?.charAt(0)}</span></div>
            <span className="text-sm text-slate-300">{user?.full_name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }} className="text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-none" data-testid="logout-btn"><SignOut size={18} weight="light" /></Button>
        </div>
      </header>

      {/* Notifications */}
      <AnimatePresence>{showNotifications && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed top-16 right-4 w-80 bp-card shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between"><h3 className="font-heading font-bold text-white text-sm">Notifications</h3><Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white"><X size={14} /></Button></div>
          <div className="max-h-72 overflow-y-auto">{notifications.length === 0 ? <p className="p-4 text-center text-slate-600 text-sm">No notifications</p> : notifications.slice(0, 5).map(n => <div key={n.id} className={`p-4 border-b border-white/5 ${!n.is_read ? 'bg-[#DFFF00]/5' : ''}`}><p className="font-medium text-white text-sm">{n.title}</p><p className="text-slate-500 text-xs mt-1">{n.message}</p></div>)}</div>
        </motion.div>
      )}</AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Spots', value: spots.length, icon: MapPin, color: 'text-white', bg: 'bg-white/5' },
            { label: 'Active Now', value: spots.filter(s => s.is_active).length, icon: Power, color: 'text-[#DFFF00]', bg: 'bg-[#DFFF00]/10' },
            { label: 'Earnings', value: `$${earnings?.total_earnings?.toFixed(2) || '0.00'}`, icon: TrendUp, color: 'text-[#DFFF00]', bg: 'bg-[#DFFF00]/10' },
            { label: 'Promoted', value: spots.filter(s => s.is_promoted).length, icon: Sparkle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map(s => (
            <div key={s.label} className="bp-card p-4 card-hover">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-slate-500">{s.label}</p><p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p></div>
                <div className={`w-10 h-10 rounded-none ${s.bg} flex items-center justify-center border border-white/5`}><s.icon size={20} weight="light" className={s.color} /></div>
              </div>
            </div>
          ))}
          <Link to="/host/add-spot" className="bp-card p-4 card-hover flex items-center justify-center">
            <Button className="w-full bg-[#DFFF00] hover:bg-[#E8FF33] text-[#022c22] rounded-none font-semibold  shadow-none btn-active" data-testid="add-spot-btn">
              <Plus size={18} weight="bold" className="mr-2" /> Add Spot
            </Button>
          </Link>
        </div>

        {/* Earnings Chart */}
        {earnings?.monthly_earnings?.length > 0 && (
          <div className="bp-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-white tracking-tight">Monthly Earnings</h2>
              <span className="text-xs text-slate-500">{earnings.total_bookings} bookings total</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earnings.monthly_earnings}>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={v => [`$${v.toFixed(2)}`, 'Earnings']} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a', color: '#fff', fontSize: '13px' }} />
                  <Bar dataKey="earnings" fill="#DFFF00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Spots */}
        <section className="mb-8">
          <h2 className="font-heading text-xl font-bold text-white mb-4 tracking-tight">My Parking Spots</h2>
          {spots.length === 0 ? (
            <div className="bp-card p-12 text-center">
              <MapPin size={48} weight="light" className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No parking spots listed yet</p>
              <Link to="/host/add-spot"><Button className="bg-[#DFFF00] hover:bg-[#E8FF33] text-[#022c22] rounded-none font-semibold"><Plus size={16} weight="bold" className="mr-2" /> Add Your First Spot</Button></Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spots.map(spot => (
                <div key={spot.id} className={`bp-card overflow-hidden card-hover ${spot.is_promoted ? 'border-amber-500/20' : ''}`} data-testid={`host-spot-${spot.id}`}>
                  {spot.is_promoted && <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 text-xs font-bold px-3 py-1.5 flex items-center justify-center gap-1 border-b border-amber-500/10"><Star size={12} weight="fill" /> PROMOTED &middot; {getPromoTimeLeft(spot.promotion_expires)}</div>}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-none flex items-center justify-center ${spot.is_active ? 'bg-[#DFFF00]/10' : 'bg-white/5'}`}><MapPin size={18} weight="light" className={spot.is_active ? 'text-[#DFFF00]' : 'text-slate-600'} /></div>
                        <div><h3 className="font-semibold text-white text-sm">{spot.address}</h3><p className="text-xs text-slate-600">{spot.city}, {spot.state}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{spot.is_active ? 'Active' : 'Off'}</span>
                        <Switch checked={spot.is_active} onCheckedChange={() => handleToggleActive(spot.id)} className="data-[state=checked]:bg-[#DFFF00]" data-testid={`toggle-spot-${spot.id}`} />
                      </div>
                    </div>
                    {editingSpot?.id === spot.id ? (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1"><Label className="text-xs text-slate-500">Hourly</Label><Input type="number" value={editingSpot.hourly_rate} onChange={(e) => setEditingSpot(p => ({ ...p, hourly_rate: e.target.value }))} className="h-9 bg-white/5 border-white/10 text-white rounded-none" data-testid="edit-hourly-rate-input" /></div>
                        <div className="flex-1"><Label className="text-xs text-slate-500">Event</Label><Input type="number" value={editingSpot.event_rate || ''} onChange={(e) => setEditingSpot(p => ({ ...p, event_rate: e.target.value }))} placeholder="Optional" className="h-9 bg-white/5 border-white/10 text-white rounded-none" data-testid="edit-event-rate-input" /></div>
                        <Button size="sm" onClick={() => handleUpdatePricing(spot.id)} className="bg-[#DFFF00] hover:bg-[#E8FF33] text-[#022c22]" data-testid="save-pricing-btn"><Check size={14} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingSpot(null)} className="text-slate-500 hover:text-white"><X size={14} /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5"><CurrencyDollar size={14} weight="light" className="text-[#DFFF00]" /><span className="font-bold text-white text-sm">${spot.hourly_rate}/hr</span></div>
                        {spot.event_rate && <span className="text-xs text-slate-500">${spot.event_rate} event</span>}
                        <Button variant="ghost" size="sm" onClick={() => setEditingSpot({ ...spot })} className="ml-auto text-slate-600 hover:text-white" data-testid={`edit-spot-${spot.id}`}><PencilSimple size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSpot(spot.id)} className="text-slate-600 hover:text-red-400" data-testid={`delete-spot-${spot.id}`}><Trash size={14} /></Button>
                      </div>
                    )}
                  </div>
                  {spot.is_active && (
                    <div className="p-4 bg-white/[0.02]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm"><Timer size={14} weight="light" className="text-[#DFFF00]" />
                          {spot.auto_off_time ? <span className="text-slate-300 text-xs">Off: {new Date(spot.auto_off_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> : <span className="text-slate-600 text-xs">No auto-off</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={autoOffHours} onValueChange={setAutoOffHours}><SelectTrigger className="h-7 w-20 bg-white/5 border-white/10 text-white text-xs rounded-none" data-testid={`auto-off-select-${spot.id}`}><SelectValue placeholder="Hrs" /></SelectTrigger><SelectContent className="bg-[#1a1a1a] border-white/10 text-white">{[1,2,3,4,5,6,8,10,12].map(h => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}</SelectContent></Select>
                          <Button size="sm" onClick={() => handleSetAutoOff(spot.id)} disabled={!autoOffHours} className="bg-white/10 hover:bg-white/20 text-white h-7 text-xs rounded-none" data-testid={`set-auto-off-${spot.id}`}>Set</Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4 border-t border-white/5">
                    <Button onClick={() => { setPromoSpot(spot); setPromoPackage(''); setPromoDialog(true); }}
                      variant={spot.is_promoted ? "outline" : "default"}
                      className={`w-full rounded-none ${spot.is_promoted ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'}`}
                      data-testid={`promote-spot-${spot.id}`}>
                      <Lightning size={16} weight="fill" className="mr-2" /> {spot.is_promoted ? 'Extend Promotion' : 'Promote Spot'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Bookings */}
        {activeBookings.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-bold text-white mb-4 tracking-tight">Authorized Vehicles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activeBookings.map(b => (
                <div key={b.id} className="bp-card p-4" data-testid={`booking-${b.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-none bg-[#DFFF00]/10 flex items-center justify-center border border-[#DFFF00]/20"><Car size={22} weight="light" className="text-[#DFFF00]" /></div>
                      <div><h3 className="font-bold text-white">{b.license_plate}</h3><p className="text-sm text-slate-500">{b.vehicle_make} {b.vehicle_model}</p></div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#DFFF00]/10 text-[#DFFF00] font-medium border border-[#DFFF00]/20">Active</span>
                  </div>
                  <div className="bg-white/5 rounded-none p-3 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm"><Clock size={14} weight="light" className="text-[#DFFF00]" /><span className="text-slate-500 text-xs">Remaining:</span></div>
                    <span className="font-semibold text-white text-sm">{getRemainingTime(b.end_time)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3"><span>Guest: {b.guest_name}</span><span>Payout: ${b.host_payout.toFixed(2)}</span></div>
                  <Button variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-none" onClick={() => { setViolationBooking(b); setViolationDialog(true); }} data-testid={`report-violation-${b.id}`}>
                    <WarningCircle size={16} weight="light" className="mr-2" /> Report Violation
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Violation Dialog */}
      <Dialog open={violationDialog} onOpenChange={setViolationDialog}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader><DialogTitle className="font-heading text-red-400">Report Violation</DialogTitle><DialogDescription className="text-slate-400">Report overstaying or mismatched vehicles.</DialogDescription></DialogHeader>
          {violationBooking && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-none p-3"><p className="font-mono font-bold text-white">{violationBooking.license_plate}</p><p className="text-sm text-slate-500">{violationBooking.vehicle_make} {violationBooking.vehicle_model}</p></div>
              <div className="space-y-2"><Label className="text-slate-300">Reason</Label><Textarea placeholder="Describe the violation..." value={violationReason} onChange={(e) => setViolationReason(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none resize-none" rows={3} data-testid="violation-reason-input" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setViolationDialog(false); setViolationReason(''); }} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handleReportViolation} disabled={!violationReason || violationLoading} className="bg-red-500 hover:bg-red-600 text-white rounded-none" data-testid="submit-violation-btn">
              {violationLoading ? <SpinnerGap size={16} className="animate-spin" /> : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promo Dialog */}
      <Dialog open={promoDialog} onOpenChange={setPromoDialog}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader><DialogTitle className="font-heading flex items-center gap-2"><Sparkle size={20} weight="fill" className="text-amber-400" /> Promote Your Spot</DialogTitle><DialogDescription className="text-slate-400">Featured spots appear first with a special badge.</DialogDescription></DialogHeader>
          {promoSpot && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-none p-3"><p className="font-semibold text-white">{promoSpot.address}</p><p className="text-sm text-slate-500">{promoSpot.city}, {promoSpot.state}</p></div>
              <div className="space-y-3"><Label className="text-slate-300">Select Package</Label>
                {promoPackages.map(pkg => (
                  <button key={pkg.id} type="button" onClick={() => setPromoPackage(pkg.id)}
                    className={`w-full p-4 rounded-none border text-left transition-all ${promoPackage === pkg.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 hover:border-white/20'}`}
                    data-testid={`promo-package-${pkg.id}`}>
                    <div className="flex items-center justify-between">
                      <div><p className="font-semibold text-white">{pkg.label}</p><p className="text-sm text-slate-500">{pkg.description}</p></div>
                      <p className="text-xl font-bold text-amber-400">${pkg.price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setPromoDialog(false); setPromoPackage(''); }} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handlePromoteSpot} disabled={!promoPackage || promoLoading} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-none" data-testid="confirm-promotion-btn">
              {promoLoading ? <SpinnerGap size={16} className="animate-spin" /> : <><Lightning size={16} weight="fill" className="mr-2" /> Promote Now</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostDashboard;
