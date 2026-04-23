import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Car, MapPin, Check, Clock, NavigationArrow, SpinnerGap, WarningCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const { getAuthHeaders } = useAuth();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading');
  const [booking, setBooking] = useState(null);
  const [spot, setSpot] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    const poll = async () => {
      try {
        const r = await axios.get(`${API}/bookings/status/${sessionId}`, getAuthHeaders());
        if (r.data.payment_status === 'paid') {
          setStatus('success');
          const br = await axios.get(`${API}/bookings/${r.data.booking_id}`, getAuthHeaders()); setBooking(br.data);
          const sr = await axios.get(`${API}/spots/${br.data.spot_id}`); setSpot(sr.data);
          toast.success('Booking confirmed!');
        } else if (attempts < 5) { setAttempts(p => p + 1); setTimeout(poll, 2000); }
        else { setStatus('pending'); }
      } catch (e) { if (attempts < 5) { setAttempts(p => p + 1); setTimeout(poll, 2000); } else setStatus('error'); }
    };
    poll();
  }, [sessionId, getAuthHeaders, attempts]);

  const getRemainingTime = () => {
    if (!booking?.end_time) return '';
    const d = new Date(booking.end_time) - new Date();
    if (d <= 0) return 'Expired';
    return `${Math.floor(d/(1000*60*60))}h ${Math.floor((d%(1000*60*60))/(1000*60))}m`;
  };

  if (status === 'loading') return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><div className="text-center"><SpinnerGap size={48} weight="light" className="text-[#DFFF00] animate-spin mx-auto mb-4" /><p className="text-white font-medium">Processing payment...</p></div></div>;
  if (status === 'error') return <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4"><div className="bp-card p-8 text-center max-w-md"><WarningCircle size={48} weight="light" className="text-red-400 mx-auto mb-4" /><h1 className="font-heading text-2xl font-bold text-white mb-2">Something Went Wrong</h1><p className="text-slate-400 mb-6">Couldn't confirm payment. Please try again.</p><Link to="/guest/dashboard"><Button className="bg-[#DFFF00] hover:bg-[#E8FF33] text-[#121212] rounded-none font-semibold" data-testid="back-to-dashboard-btn">Back to Dashboard</Button></Link></div></div>;
  if (status === 'pending') return <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4"><div className="bp-card p-8 text-center max-w-md"><Clock size={48} weight="light" className="text-amber-400 mx-auto mb-4" /><h1 className="font-heading text-2xl font-bold text-white mb-2">Processing</h1><p className="text-slate-400 mb-6">Payment is being processed. You'll get confirmation shortly.</p><Link to="/guest/dashboard"><Button className="bg-[#DFFF00] hover:bg-[#E8FF33] text-[#121212] rounded-none font-semibold" data-testid="back-to-dashboard-btn">Back to Dashboard</Button></Link></div></div>;

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bp-card overflow-hidden">
          <div className="bg-[#DFFF00] p-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-20 h-20 rounded-full bg-[#121212] flex items-center justify-center mx-auto mb-4">
              <Check size={40} weight="bold" className="text-[#DFFF00]" />
            </motion.div>
            <h1 className="font-heading text-2xl font-bold text-[#121212]">Booking Confirmed!</h1>
          </div>
          <div className="p-6 space-y-4" data-testid="booking-success-card">
            {spot && <div className="bg-white/5 rounded-none p-4"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-none bg-[#DFFF00]/10 flex items-center justify-center"><MapPin size={20} weight="light" className="text-[#DFFF00]" /></div><div><h3 className="font-semibold text-white">{spot.address}</h3><p className="text-sm text-slate-500">{spot.city}, {spot.state}</p></div></div></div>}
            {booking && <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-none p-4 text-center"><Clock size={20} weight="light" className="text-[#DFFF00] mx-auto mb-2" /><p className="text-xs text-slate-500">Remaining</p><p className="font-bold text-white">{getRemainingTime()}</p></div>
                <div className="bg-white/5 rounded-none p-4 text-center"><Car size={20} weight="light" className="text-[#DFFF00] mx-auto mb-2" /><p className="text-xs text-slate-500">Plate</p><p className="font-bold text-white font-mono">{booking.license_plate}</p></div>
              </div>
              <div className="bg-[#DFFF00]/10 rounded-none p-4 flex items-center justify-between border border-[#DFFF00]/20"><span className="text-slate-300">Total Paid</span><span className="text-xl font-bold text-[#DFFF00]">${booking.total_amount.toFixed(2)}</span></div>
              <p className="text-center text-sm text-slate-500">{booking.vehicle_make} {booking.vehicle_model} &middot; {booking.hours}h</p>
            </>}
            <div className="space-y-3 pt-4">
              <Button onClick={() => spot && window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`, '_blank')}
                className="w-full h-14 bg-[#DFFF00] hover:bg-[#E8FF33] text-[#121212] rounded-none font-bold text-lg  btn-active" data-testid="get-directions-btn">
                <NavigationArrow size={20} weight="bold" className="mr-2" /> Get Directions
              </Button>
              <Link to="/guest/dashboard" className="block"><Button variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/5 rounded-none font-semibold" data-testid="back-to-map-btn">Back to Map</Button></Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingSuccess;
