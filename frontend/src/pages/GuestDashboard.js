import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Car, MapPin, MagnifyingGlass, Funnel, CurrencyDollar, Clock, NavigationArrow, SignOut, Bell, X, CaretRight, SpinnerGap, Star, ClockCountdown, Crosshair, ShieldCheck, PushPin, ArrowsClockwise, CreditCard, AppleLogo, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const mkIcon = (sel = false, promo = false) => {
  const c = '#DFFF00';
  const o = promo ? 1 : 0.7;
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `<div style="width:${sel?14:10}px;height:${sel?14:10}px;background:${c};opacity:${o};${sel?'box-shadow:0 0 12px rgba(223,255,0,0.6);':''}"></div>${promo?`<div class="map-pin-pulse" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;background:rgba(223,255,0,0.1);z-index:-1;"></div>`:''}`,
    iconSize: [sel?14:10, sel?14:10], iconAnchor: [sel?7:5, sel?7:5],
  });
};

const userIcon = () => L.divIcon({
  className: 'custom-marker-wrapper',
  html: `<div style="width:8px;height:8px;background:#3B82F6;border:2px solid white;"></div>`,
  iconSize: [8, 8], iconAnchor: [4, 4],
});

const demandIcon = () => L.divIcon({
  className: 'custom-marker-wrapper',
  html: `<div style="width:12px;height:12px;background:#FF6B35;border:2px solid rgba(255,107,53,0.4);box-shadow:0 0 8px rgba(255,107,53,0.5);"></div>`,
  iconSize: [12, 12], iconAnchor: [6, 6],
});

const demandPinIcon = () => L.divIcon({
  className: 'custom-marker-wrapper',
  html: `<div style="width:16px;height:16px;background:#FF6B35;border:3px solid white;box-shadow:0 0 12px rgba(255,107,53,0.7);animation:pulse 1.5s ease-in-out infinite;"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});

const MapCtrl = ({ center, zoom }) => { const m = useMap(); useEffect(() => { if (center) m.flyTo(center, zoom || 14, { duration: 1 }); }, [center, zoom, m]); return null; };

const DemandPinPicker = ({ active, onPlace }) => {
  useMapEvents({ click(e) { if (active) onPlace([e.latlng.lat, e.latlng.lng]); } });
  return null;
};

const GuestDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mapCenter, setMapCenter] = useState([34.0522, -118.2437]);
  const [mapZoom, setMapZoom] = useState(12);
  const [userLocation, setUserLocation] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [bookingForm, setBookingForm] = useState({ licensePlate: '', vehicleMake: '', vehicleModel: '', hours: 1, useEventRate: false, useMonthlyLease: false });
  const [bookingLoading, setBookingLoading] = useState(false);

  const [demandPins, setDemandPins] = useState([]);
  const [showDemandPins, setShowDemandPins] = useState(false);
  const [placingDemandPin, setPlacingDemandPin] = useState(false);
  const [demandPinPos, setDemandPinPos] = useState(null);
  const [demandDialog, setDemandDialog] = useState(false);
  const [demandForm, setDemandForm] = useState({ address_hint: '', zip_code: '', note: '' });
  const [demandLoading, setDemandLoading] = useState(false);

  const fetchSpots = useCallback(async () => { try { const p = new URLSearchParams(); if (maxPrice) p.append('max_price', maxPrice); const r = await axios.get(`${API}/spots?${p.toString()}`); setSpots(r.data); } catch(e){ toast.error('Failed to load'); } finally { setLoading(false); } }, [maxPrice]);
  const fetchNotifications = useCallback(async () => { try { const r = await axios.get(`${API}/notifications`, getAuthHeaders()); setNotifications(r.data); } catch(e){} }, [getAuthHeaders]);
  const fetchDemandPins = useCallback(async () => { try { const r = await axios.get(`${API}/demand-pins`); setDemandPins(r.data); } catch(e){} }, []);

  useEffect(() => {
    fetchSpots(); fetchNotifications(); fetchDemandPins();
    const i = setInterval(fetchSpots, 30000);
    const n = setInterval(fetchNotifications, 15000);
    return () => { clearInterval(i); clearInterval(n); };
  }, [fetchSpots, fetchNotifications, fetchDemandPins]);

  useEffect(() => {
    if ('geolocation' in navigator) navigator.geolocation.getCurrentPosition(
      (p) => { const loc = [p.coords.latitude, p.coords.longitude]; setUserLocation(loc); setMapCenter(loc); setMapZoom(14); },
      () => {}, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
    );
  }, []);

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) { toast.error('Geolocation not supported'); return; }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { const loc = [p.coords.latitude, p.coords.longitude]; setUserLocation(loc); setMapCenter(loc); setMapZoom(15); setLocatingUser(false); toast.success('Located'); },
      (err) => { setLocatingUser(false); toast.error(err.code === 1 ? 'Location denied. Enable in browser settings.' : err.code === 3 ? 'Timed out. Try again.' : 'Location unavailable.'); },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSpotClick = (s) => { setSelectedSpot(s); setMapCenter([s.latitude, s.longitude]); setMapZoom(15); };
  const handleBookNow = () => { setBookingOpen(true); setBookingForm({ licensePlate: '', vehicleMake: '', vehicleModel: '', hours: 1, useEventRate: false, useMonthlyLease: false }); };

  const calcTotal = () => {
    if (!selectedSpot) return 0;
    if (bookingForm.useMonthlyLease && selectedSpot.monthly_rate) return selectedSpot.monthly_rate;
    return bookingForm.useEventRate && selectedSpot.event_rate ? selectedSpot.event_rate : selectedSpot.hourly_rate * bookingForm.hours;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.licensePlate || !bookingForm.vehicleMake || !bookingForm.vehicleModel) { toast.error('Fill in vehicle details'); return; }
    setBookingLoading(true);
    try {
      if (bookingForm.useMonthlyLease && selectedSpot.has_monthly_lease) {
        const r = await axios.post(`${API}/subscriptions/checkout`, {
          spot_id: selectedSpot.id,
          license_plate: bookingForm.licensePlate,
          vehicle_make: bookingForm.vehicleMake,
          vehicle_model: bookingForm.vehicleModel,
          origin_url: window.location.origin
        }, getAuthHeaders());
        window.location.href = r.data.checkout_url;
      } else {
        const r = await axios.post(`${API}/bookings/checkout`, {
          spot_id: selectedSpot.id,
          license_plate: bookingForm.licensePlate,
          vehicle_make: bookingForm.vehicleMake,
          vehicle_model: bookingForm.vehicleModel,
          hours: bookingForm.hours,
          use_event_rate: bookingForm.useEventRate,
          origin_url: window.location.origin
        }, getAuthHeaders());
        window.location.href = r.data.checkout_url;
      }
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed'); setBookingLoading(false); }
  };

  const handleDemandPinPlace = (pos) => {
    setDemandPinPos(pos);
    setPlacingDemandPin(false);
    setDemandDialog(true);
  };

  const handleDemandSubmit = async () => {
    if (!demandPinPos) return;
    setDemandLoading(true);
    try {
      await axios.post(`${API}/demand-pins`, {
        latitude: demandPinPos[0],
        longitude: demandPinPos[1],
        address_hint: demandForm.address_hint,
        zip_code: demandForm.zip_code,
        note: demandForm.note
      }, getAuthHeaders());
      toast.success('Demand pin placed! Hosts will see this.');
      setDemandDialog(false);
      setDemandPinPos(null);
      setDemandForm({ address_hint: '', zip_code: '', note: '' });
      fetchDemandPins();
    } catch(e) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setDemandLoading(false); }
  };

  const handleUpvoteDemand = async (pinId) => {
    try {
      await axios.post(`${API}/demand-pins/${pinId}/upvote`, {}, getAuthHeaders());
      fetchDemandPins();
      toast.success('Upvoted!');
    } catch(e) { toast.error(e.response?.data?.detail || 'Already voted'); }
  };

  const markNotificationsRead = async () => {
    try { await axios.post(`${API}/notifications/read-all`, {}, getAuthHeaders()); setNotifications(p => p.map(n => ({ ...n, is_read: true }))); } catch(e) {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const warningNotifs = notifications.filter(n => n.type === 'warning' && !n.is_read);
  const filteredSpots = spots.filter(s => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return s.address.toLowerCase().includes(q) || s.city.toLowerCase().includes(q); });

  return (
    <div className="h-screen flex flex-col bg-[#121212]">
      {/* 15-min Warning Banner */}
      <AnimatePresence>
        {warningNotifs.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warning size={14} weight="fill" className="text-amber-400" />
              <span className="font-mono text-[11px] text-amber-300">{warningNotifs[0].message}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-6 btn-neon rounded-none font-mono text-[9px] uppercase px-2" onClick={() => navigate('/guest/bookings')}>Extend</Button>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-amber-400/50 hover:text-amber-400" onClick={markNotificationsRead}><X size={10} /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-[#121212] px-4 py-2.5 flex items-center justify-between z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Park Pal" className="h-6" />
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm"
            className={`rounded-none font-mono text-[10px] uppercase tracking-wider h-7 ${placingDemandPin ? 'text-[#FF6B35] bg-[#FF6B35]/10' : 'text-white/30 hover:text-[#FF6B35]'}`}
            onClick={() => { setPlacingDemandPin(!placingDemandPin); setShowDemandPins(true); }}
            title="Request a parking spot in an area">
            <PushPin size={12} weight={placingDemandPin ? 'fill' : 'light'} className="mr-1" />
            {placingDemandPin ? 'Click Map' : 'Request Spot'}
          </Button>
          <Button variant="ghost" size="sm" className="text-white/30 hover:text-[#DFFF00] rounded-none font-mono text-[10px] uppercase tracking-wider h-7" onClick={() => navigate('/guest/bookings')} data-testid="my-bookings-btn"><ClockCountdown size={12} weight="light" className="mr-1" /> Bookings</Button>
          <Button variant="ghost" size="icon" className="relative text-white/30 hover:text-white rounded-none h-7 w-7" onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications && unreadCount > 0) markNotificationsRead(); }} data-testid="notifications-btn">
            <Bell size={14} weight="light" />{unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#DFFF00] text-[#121212] text-[8px] font-mono font-bold flex items-center justify-center">{unreadCount}</span>}
          </Button>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 ml-1" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="font-mono text-[10px] text-white/30">{user?.full_name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }} className="text-white/20 hover:text-red-400 rounded-none h-7 w-7" data-testid="logout-btn"><SignOut size={14} weight="light" /></Button>
        </div>
      </header>

      {/* Demand pin placing hint */}
      <AnimatePresence>
        {placingDemandPin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-[#FF6B35]/10 border-b border-[#FF6B35]/20 px-4 py-2 text-center">
            <span className="font-mono text-[11px] text-[#FF6B35]">Click anywhere on the map to request a new parking spot in that area</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>{showNotifications && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
          className="absolute top-12 right-4 w-72 bg-[#1a1a1a] z-50" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Notifications</span>
            <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)} className="text-white/20 h-5 w-5 p-0"><X size={10} /></Button>
          </div>
          <div className="max-h-64 overflow-y-auto">{notifications.length === 0 ? <p className="p-4 text-center font-mono text-[10px] text-white/15">Empty</p> : notifications.slice(0, 8).map(n => (
            <div key={n.id} className={`p-3 ${n.type === 'warning' ? 'bg-amber-500/5' : ''}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {n.type === 'warning' && <Warning size={10} weight="fill" className="text-amber-400 flex-shrink-0" />}
                <p className="font-heading text-xs text-white/60">{n.title}</p>
              </div>
              <p className="font-mono text-[10px] text-white/20 mt-1">{n.message}</p>
            </div>
          ))}</div>
        </motion.div>
      )}</AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]"><SpinnerGap size={24} className="text-[#DFFF00] animate-spin" /></div> : (
            <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" style={{ minHeight: '300px', cursor: placingDemandPin ? 'crosshair' : undefined }}>
              <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
              <MapCtrl center={mapCenter} zoom={mapZoom} />
              <DemandPinPicker active={placingDemandPin} onPlace={handleDemandPinPlace} />
              {userLocation && <Marker position={userLocation} icon={userIcon()}><Popup><div className="p-2 font-mono text-[10px]">YOU</div></Popup></Marker>}
              {demandPinPos && <Marker position={demandPinPos} icon={demandPinIcon()} />}
              {filteredSpots.map(s => (
                <Marker key={s.id} position={[s.latitude, s.longitude]} icon={mkIcon(selectedSpot?.id === s.id, s.is_promoted)} eventHandlers={{ click: () => handleSpotClick(s) }}>
                  <Popup><div className="p-3">{s.is_promoted && <div className="font-mono text-[9px] text-[#DFFF00] uppercase tracking-wider mb-1">Featured</div>}<p className="font-heading text-sm text-white">{s.address}</p><p className="font-mono text-xs text-[#DFFF00]">${s.hourly_rate}/hr</p></div></Popup>
                </Marker>
              ))}
              {showDemandPins && demandPins.map(d => (
                <Marker key={d.id} position={[d.latitude, d.longitude]} icon={demandIcon()}>
                  <Popup>
                    <div className="p-3 font-mono text-xs">
                      <div className="text-[#FF6B35] uppercase text-[9px] mb-1">Demand Request</div>
                      {d.address_hint && <p className="text-white/70 text-[10px]">{d.address_hint}</p>}
                      {d.note && <p className="text-white/40 text-[10px] mt-1">{d.note}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white/30">{d.upvote_count || 0} wants this</span>
                        <button onClick={() => handleUpvoteDemand(d.id)} className="text-[#FF6B35] hover:text-[#FF8B55] text-[10px]">+1 Want it</button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
          {/* Search */}
          <div className="absolute top-3 left-3 right-3 lg:right-auto lg:w-72 z-[1000]">
            <div className="bg-[#1a1a1a]/95 backdrop-blur-sm p-2.5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="relative">
                <MagnifyingGlass size={12} weight="light" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <Input placeholder="Search location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 bg-[#121212] border-white/[0.04] text-white placeholder:text-white/15 rounded-none font-mono text-xs" data-testid="search-input" />
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <Select value={maxPrice} onValueChange={setMaxPrice}>
                  <SelectTrigger className="h-8 bg-[#121212] border-white/[0.04] text-white/40 rounded-none flex-1 font-mono text-[10px]" data-testid="price-filter"><Funnel size={10} className="mr-1 text-white/20" /><SelectValue placeholder="Max $" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/[0.06] text-white rounded-none"><SelectItem value="5">$5/hr</SelectItem><SelectItem value="10">$10/hr</SelectItem><SelectItem value="15">$15/hr</SelectItem><SelectItem value="20">$20/hr</SelectItem></SelectContent>
                </Select>
                <Button onClick={handleLocateMe} disabled={locatingUser} className="h-8 btn-neon rounded-none px-3 font-mono text-[10px] uppercase" data-testid="locate-me-btn">
                  {locatingUser ? <SpinnerGap size={10} className="animate-spin" /> : <><Crosshair size={10} weight="bold" className="mr-1" />Near Me</>}
                </Button>
              </div>
              <button className="mt-1.5 w-full flex items-center justify-between font-mono text-[9px] text-white/20 hover:text-[#FF6B35]/60 uppercase tracking-wider"
                onClick={() => setShowDemandPins(!showDemandPins)}>
                <span>Demand Requests</span>
                <span className={`w-1.5 h-1.5 ${showDemandPins ? 'bg-[#FF6B35]' : 'bg-white/10'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 bg-[#121212] overflow-y-auto" style={{ borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="p-3">
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-wider mb-3">
              {selectedSpot ? '// spot_details' : `// available (${filteredSpots.length})`}
            </div>
            {selectedSpot ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <button className="font-mono text-[10px] text-white/20 hover:text-[#DFFF00]/50 uppercase tracking-wider" onClick={() => setSelectedSpot(null)} data-testid="back-to-list-btn">&larr; back</button>
                <div className="bp-card p-4" data-testid="spot-details-card">
                  {selectedSpot.is_promoted && <div className="font-mono text-[9px] text-[#DFFF00] uppercase tracking-widest mb-3 flex items-center gap-1"><Star size={10} weight="fill" /> FEATURED</div>}
                  {selectedSpot.is_verified && <div className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1" data-testid="verified-badge"><ShieldCheck size={10} weight="fill" /> VERIFIED</div>}
                  <h3 className="font-heading font-bold text-white text-sm">{selectedSpot.address}</h3>
                  <p className="font-mono text-[10px] text-white/20 mt-1">{selectedSpot.city}, {selectedSpot.state} {selectedSpot.zip_code}</p>
                  {selectedSpot.description && <p className="text-white/25 text-xs mt-3">{selectedSpot.description}</p>}
                  <div className="grid grid-cols-2 gap-[1px] bg-white/[0.04] mt-4">
                    <div className="bg-[#161616] p-3"><p className="font-mono text-[9px] text-white/20 uppercase">Hourly</p><p className="data-value text-lg text-[#DFFF00]">${selectedSpot.hourly_rate}</p></div>
                    {selectedSpot.event_rate && <div className="bg-[#161616] p-3"><p className="font-mono text-[9px] text-white/20 uppercase">Event</p><p className="data-value text-lg text-white">${selectedSpot.event_rate}</p></div>}
                    {selectedSpot.has_monthly_lease && selectedSpot.monthly_rate && <div className="bg-[#161616] p-3 col-span-2"><p className="font-mono text-[9px] text-white/20 uppercase">Monthly Lease</p><p className="data-value text-lg text-[#DFFF00]">${selectedSpot.monthly_rate}<span className="font-mono text-[9px] text-white/20">/mo</span></p></div>}
                  </div>
                  <p className="font-mono text-[10px] text-white/15 mt-3">Host: {selectedSpot.host_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-[1px]">
                  <Button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.latitude},${selectedSpot.longitude}`, '_blank')}
                    className="h-10 bg-[#1a1a1a] text-white/40 hover:text-white hover:bg-white/[0.03] rounded-none font-mono text-[10px] uppercase" style={{ border: '1px solid rgba(255,255,255,0.06)' }} data-testid="get-directions-btn"><NavigationArrow size={12} className="mr-1" /> Navigate</Button>
                  <Button onClick={handleBookNow} className="h-10 btn-neon rounded-none font-mono text-[10px] uppercase" data-testid="book-now-btn">Book Now</Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-[1px]">
                {filteredSpots.length === 0 ? <p className="text-center font-mono text-[10px] text-white/15 py-8">No spots</p> :
                  filteredSpots.map(s => (
                    <div key={s.id} className="bp-card bp-card-hover p-3 cursor-pointer" onClick={() => handleSpotClick(s)} data-testid={`spot-card-${s.id}`}>
                      {s.is_promoted && <div className="font-mono text-[8px] text-[#DFFF00] uppercase tracking-widest mb-1"><Star size={8} weight="fill" className="inline mr-1" />Featured</div>}
                      {s.has_monthly_lease && <div className="font-mono text-[8px] text-blue-400 uppercase tracking-widest mb-1"><ArrowsClockwise size={8} className="inline mr-1" />Monthly Lease</div>}
                      <div className="flex items-start justify-between">
                        <div><p className="font-heading text-xs text-white/70">{s.address}</p><p className="font-mono text-[10px] text-white/15">{s.city}, {s.state}</p></div>
                        <p className="data-value text-sm text-[#DFFF00]">${s.hourly_rate}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Sheet */}
      <Sheet open={bookingOpen} onOpenChange={setBookingOpen}>
        <SheetContent className="w-full sm:max-w-sm bg-[#121212] rounded-none overflow-y-auto" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <SheetHeader><SheetTitle className="font-heading text-white tracking-tight">Booking</SheetTitle><SheetDescription className="font-mono text-[10px] text-white/20">Enter vehicle details</SheetDescription></SheetHeader>
          {selectedSpot && (
            <form onSubmit={handleBookingSubmit} className="mt-6 space-y-4">
              <div className="bp-card p-3"><p className="font-heading text-xs text-white">{selectedSpot.address}</p><p className="font-mono text-[10px] text-white/20">{selectedSpot.city}, {selectedSpot.state}</p></div>

              {selectedSpot.has_monthly_lease && selectedSpot.monthly_rate && (
                <div className={`p-3 bp-card cursor-pointer ${bookingForm.useMonthlyLease ? 'border border-blue-400/30 bg-blue-400/5' : ''}`}
                  onClick={() => setBookingForm(p => ({ ...p, useMonthlyLease: !p.useMonthlyLease, useEventRate: false }))}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 border ${bookingForm.useMonthlyLease ? 'bg-blue-400 border-blue-400' : 'border-white/20'}`} />
                    <div>
                      <p className="font-mono text-[10px] text-white/60 uppercase tracking-wider">Monthly Lease</p>
                      <p className="font-heading text-sm text-blue-400">${selectedSpot.monthly_rate}/mo</p>
                      <p className="font-mono text-[9px] text-white/20">Recurring billing · Cancel anytime</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5"><Label className="font-mono text-[10px] text-white/30 uppercase tracking-wider">License Plate</Label>
                <Input placeholder="ABC 1234" value={bookingForm.licensePlate} onChange={(e) => setBookingForm(p => ({ ...p, licensePlate: e.target.value.toUpperCase() }))}
                  className="license-plate-input h-14 text-lg rounded-none" maxLength={10} data-testid="booking-license-input" /></div>
              <div className="grid grid-cols-2 gap-[1px]">
                <div className="space-y-1.5"><Label className="font-mono text-[10px] text-white/30 uppercase">Make</Label><Input placeholder="Toyota" value={bookingForm.vehicleMake} onChange={(e) => setBookingForm(p => ({ ...p, vehicleMake: e.target.value }))} className="h-10 bg-[#1a1a1a] border-white/[0.04] text-white placeholder:text-white/15 rounded-none font-mono text-xs" data-testid="booking-make-input" /></div>
                <div className="space-y-1.5"><Label className="font-mono text-[10px] text-white/30 uppercase">Model</Label><Input placeholder="Camry" value={bookingForm.vehicleModel} onChange={(e) => setBookingForm(p => ({ ...p, vehicleModel: e.target.value }))} className="h-10 bg-[#1a1a1a] border-white/[0.04] text-white placeholder:text-white/15 rounded-none font-mono text-xs" data-testid="booking-model-input" /></div>
              </div>
              {!bookingForm.useMonthlyLease && (
                <div className="space-y-1.5"><Label className="font-mono text-[10px] text-white/30 uppercase">Duration</Label>
                  <Select value={String(bookingForm.hours)} onValueChange={(v) => setBookingForm(p => ({ ...p, hours: parseInt(v), useEventRate: false }))}>
                    <SelectTrigger className="h-10 bg-[#1a1a1a] border-white/[0.04] text-white rounded-none font-mono text-xs" data-testid="booking-hours-select"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/[0.06] text-white rounded-none">{[1,2,3,4,5,6,8,10,12].map(h => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {!bookingForm.useMonthlyLease && selectedSpot.event_rate && (
                <div className="flex items-center gap-3 p-3 bp-card">
                  <input type="checkbox" id="eventRate" checked={bookingForm.useEventRate} onChange={(e) => setBookingForm(p => ({ ...p, useEventRate: e.target.checked }))} className="accent-[#DFFF00]" data-testid="booking-event-rate-checkbox" />
                  <label htmlFor="eventRate" className="font-mono text-xs"><span className="text-white/50">Event rate</span> <span className="data-value text-[#DFFF00]">${selectedSpot.event_rate}</span></label>
                </div>
              )}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] text-white/20 uppercase">Total</span>
                  <div className="text-right">
                    <span className="data-value text-2xl text-[#DFFF00]">${calcTotal().toFixed(2)}</span>
                    {bookingForm.useMonthlyLease && <p className="font-mono text-[9px] text-white/20">/month recurring</p>}
                  </div>
                </div>
                <div className="font-mono text-[9px] text-white/20 mb-3 flex items-center gap-1.5">
                  <CreditCard size={10} className="text-white/30" />
                  <span>Apple Pay &amp; Google Pay available at checkout</span>
                </div>
                <Button type="submit" disabled={bookingLoading} className="w-full h-12 btn-neon rounded-none font-mono text-xs uppercase tracking-wider" data-testid="booking-submit-btn">
                  {bookingLoading ? <SpinnerGap size={16} className="animate-spin" /> : bookingForm.useMonthlyLease ? `Subscribe $${calcTotal().toFixed(2)}/mo` : `Pay $${calcTotal().toFixed(2)}`}
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Demand Pin Dialog */}
      <Dialog open={demandDialog} onOpenChange={setDemandDialog}>
        <DialogContent className="sm:max-w-sm bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2 text-[#FF6B35]">
              <PushPin size={18} weight="fill" /> Request a Spot Here
            </DialogTitle>
            <DialogDescription className="text-white/30 font-mono text-[10px]">
              Tell hosts you need parking in this area.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] text-white/30 uppercase">Location hint (optional)</Label>
              <Input placeholder="Near stadium, event center..." value={demandForm.address_hint}
                onChange={(e) => setDemandForm(p => ({ ...p, address_hint: e.target.value }))}
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-none font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] text-white/30 uppercase">ZIP Code</Label>
              <Input placeholder="90001" value={demandForm.zip_code}
                onChange={(e) => setDemandForm(p => ({ ...p, zip_code: e.target.value }))}
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-none font-mono text-xs" maxLength={5} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] text-white/30 uppercase">Note</Label>
              <Textarea placeholder="Event date, time needed, etc..." value={demandForm.note}
                onChange={(e) => setDemandForm(p => ({ ...p, note: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-none resize-none font-mono text-xs" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setDemandDialog(false); setDemandPinPos(null); }} className="text-white/30 hover:text-white rounded-none font-mono text-[10px] uppercase">Cancel</Button>
            <Button onClick={handleDemandSubmit} disabled={demandLoading}
              className="bg-[#FF6B35] hover:bg-[#FF8B55] text-white rounded-none font-mono text-[10px] uppercase">
              {demandLoading ? <SpinnerGap size={14} className="animate-spin" /> : <><PushPin size={12} weight="fill" className="mr-1" />Pin It</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestDashboard;
