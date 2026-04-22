import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Car, MapPin, Clock, CurrencyDollar, ArrowLeft, NavigationArrow, SpinnerGap, CalendarBlank } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BookingHistoryPage = () => {
  const { getAuthHeaders } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([axios.get(`${API}/bookings/history`, getAuthHeaders()), axios.get(`${API}/stats/guest`, getAuthHeaders())]);
      setBookings(h.data); setStats(s.data);
    } catch (e) {} finally { setLoading(false); }
  }, [getAuthHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStatusLabel = (status, paymentStatus, endTime) => {
    if (status === 'confirmed' && paymentStatus === 'paid') return endTime && new Date(endTime) < new Date() ? 'Completed' : 'Active';
    if (status === 'pending') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (label) => {
    if (label === 'Active') return 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20';
    if (label === 'Completed') return 'bg-white/5 text-slate-400 border-white/10';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    const label = getStatusLabel(b.status, b.payment_status, b.end_time);
    return label.toLowerCase() === filter;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#022c22]"><SpinnerGap size={32} weight="light" className="text-[#34d399] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#022c22]">
      <header className="glass px-4 py-3 sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/guest/dashboard"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl" data-testid="back-to-dashboard-btn"><ArrowLeft size={18} /></Button></Link>
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#34d399] flex items-center justify-center"><Car size={16} weight="bold" className="text-[#022c22]" /></div><h1 className="font-heading font-bold text-white tracking-tight">My Bookings</h1></div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[{ v: stats.total_bookings, l: 'Bookings', c: 'text-white' }, { v: stats.active_bookings, l: 'Active', c: 'text-[#34d399]' }, { v: `$${stats.total_spent.toFixed(2)}`, l: 'Spent', c: 'text-[#34d399]' }, { v: `${stats.total_hours_parked}h`, l: 'Parked', c: 'text-white' }].map(s => (
              <div key={s.l} className="glass rounded-xl p-4 text-center"><p className={`text-2xl font-bold ${s.c}`}>{s.v}</p><p className="text-xs text-slate-500 mt-1">{s.l}</p></div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['all', 'active', 'completed', 'pending'].map(f => (
            <Button key={f} size="sm" onClick={() => setFilter(f)} className={filter === f ? 'bg-[#34d399] text-[#022c22] rounded-xl' : 'bg-white/5 text-slate-400 hover:bg-white/10 rounded-xl border border-white/10'} data-testid={`filter-${f}-btn`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        {filteredBookings.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center"><CalendarBlank size={48} weight="light" className="text-slate-600 mx-auto mb-4" /><p className="text-slate-500 mb-4">No bookings found</p><Link to="/guest/dashboard"><Button className="bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold" data-testid="find-parking-btn">Find Parking</Button></Link></div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b, i) => {
              const label = getStatusLabel(b.status, b.payment_status, b.end_time);
              const isActive = label === 'Active';
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className={`glass rounded-xl overflow-hidden ${isActive ? 'border-[#34d399]/20' : ''}`} data-testid={`booking-item-${b.id}`}>
                    {isActive && <div className="bg-[#34d399]/10 text-[#34d399] text-xs font-bold px-4 py-1.5 flex items-center gap-1 border-b border-[#34d399]/10"><div className="w-1.5 h-1.5 bg-[#34d399] rounded-full animate-pulse" /> ACTIVE</div>}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3"><div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#34d399]/10' : 'bg-white/5'}`}><MapPin size={18} weight="light" className={isActive ? 'text-[#34d399]' : 'text-slate-600'} /></div><div><p className="font-semibold text-white text-sm">{b.spot_address || 'Spot'}</p>{b.spot_city && <p className="text-xs text-slate-600">{b.spot_city}, {b.spot_state}</p>}</div></div>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${getStatusColor(label)}`}>{label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-white/5 rounded-lg p-2 text-center"><Car size={14} weight="light" className="text-[#34d399] mx-auto mb-1" /><p className="text-[10px] font-mono font-bold text-white">{b.license_plate}</p></div>
                        <div className="bg-white/5 rounded-lg p-2 text-center"><Clock size={14} weight="light" className="text-slate-400 mx-auto mb-1" /><p className="text-[10px] font-bold text-white">{b.hours}h</p></div>
                        <div className="bg-white/5 rounded-lg p-2 text-center"><CurrencyDollar size={14} weight="light" className="text-[#34d399] mx-auto mb-1" /><p className="text-[10px] font-bold text-[#34d399]">${b.total_amount.toFixed(2)}</p></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>{new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {isActive && b.spot_address && <Button size="sm" variant="outline" className="h-6 text-[10px] border-[#34d399]/20 text-[#34d399] hover:bg-[#34d399]/10 rounded-lg" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.spot_address)}`, '_blank')} data-testid={`directions-${b.id}`}><NavigationArrow size={10} className="mr-1" /> Directions</Button>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingHistoryPage;
