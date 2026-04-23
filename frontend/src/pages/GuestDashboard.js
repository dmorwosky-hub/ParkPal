import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Car, MapPin, MagnifyingGlass, Funnel, CurrencyDollar, Clock, NavigationArrow, SignOut, Bell, X, CaretRight, SpinnerGap, Star, ClockCountdown, Crosshair } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const mkIcon = (sel = false, promo = false) => {
  const c = promo ? '#DFFF00' : '#DFFF00';
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

const MapCtrl = ({ center, zoom }) => { const m = useMap(); useEffect(() => { if (center) m.flyTo(center, zoom || 14, { duration: 1 }); }, [center, zoom, m]); return null; };

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
  const [bookingForm, setBookingForm] = useState({ licensePlate: '', vehicleMake: '', vehicleModel: '', hours: 1, useEventRate: false });
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchSpots = useCallback(async () => { try { const p = new URLSearchParams(); if (maxPrice) p.append('max_price', maxPrice); const r = await axios.get(`${API}/spots?${p.toString()}`); setSpots(r.data); } catch(e){ toast.error('Failed to load'); } finally { setLoading(false); } }, [maxPrice]);
  const fetchNotifications = useCallback(async () => { try { const r = await axios.get(`${API}/notifications`, getAuthHeaders()); setNotifications(r.data); } catch(e){} }, [getAuthHeaders]);

  useEffect(() => { fetchSpots(); fetchNotifications(); const i = setInterval(fetchSpots, 30000); return () => clearInterval(i); }, [fetchSpots, fetchNotifications]);

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
  const handleBookNow = () => { setBookingOpen(true); setBookingForm({ licensePlate: '', vehicleMake: '', vehicleModel: '', hours: 1, useEventRate: false }); };
  const calcTotal = () => { if (!selectedSpot) return 0; return bookingForm.useEventRate && selectedSpot.event_rate ? selectedSpot.event_rate : selectedSpot.hourly_rate * bookingForm.hours; };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.licensePlate || !bookingForm.vehicleMake || !bookingForm.vehicleModel) { toast.error('Fill in vehicle details'); return; }
    setBookingLoading(true);
    try { const r = await axios.post(`${API}/bookings/checkout`, { spot_id: selectedSpot.id, license_plate: bookingForm.licensePlate, vehicle_make: bookingForm.vehicleMake, vehicle_model: bookingForm.vehicleModel, hours: bookingForm.hours, use_event_rate: bookingForm.useEventRate, origin_url: window.location.origin }, getAuthHeaders()); window.location.href = r.data.checkout_url; }
    catch (error) { toast.error(error.response?.data?.detail || 'Failed'); setBookingLoading(false); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredSpots = spots.filter(s => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return s.address.toLowerCase().includes(q) || s.city.toLowerCase().includes(q); });

  return (
    <div className="h-screen flex flex-col bg-[#121212]">
      {/* Header */}
      <header className="bg-[#121212] px-4 py-2.5 flex items-center justify-between z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center" style={{ border: '1px solid rgba(223,255,0,0.3)' }}><Car size={12} weight="bold" className="text-[#DFFF00]" /></div>
          <span className="font-heading font-bold text-xs text-white tracking-wide uppercase hidden sm:block">Park-Pal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="text-white/30 hover:text-[#DFFF00] rounded-none font-mono text-[10px] uppercase tracking-wider h-7" onClick={() => navigate('/guest/bookings')} data-testid="my-bookings-btn"><ClockCountdown size={12} weight="light" className="mr-1" /> Bookings</Button>
          <Button variant="ghost" size="icon" className="relative text-white/30 hover:text-white rounded-none h-7 w-7" onClick={() => setShowNotifications(!showNotifications)} data-testid="notifications-btn">
            <Bell size={14} weight="light" />{unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#DFFF00] text-[#121212] text-[8px] font-mono font-bold flex items-center justify-center">{unreadCount}</span>}
          </Button>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 ml-1" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="font-mono text-[10px] text-white/30">{user?.full_name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }} className="text-white/20 hover:text-red-400 rounded-none h-7 w-7" data-testid="logout-btn"><SignOut size={14} weight="light" /></Button>
        </div>
      </header>

      {/* Notifications */}
      <AnimatePresence>{showNotifications && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
          className="absolute top-12 right-4 w-72 bg-[#1a1a1a] z-50" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Notifications</span>
            <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)} className="text-white/20 h-5 w-5 p-0"><X size={10} /></Button>
          </div>
          <div className="max-h-64 overflow-y-auto">{notifications.length === 0 ? <p className="p-4 text-center font-mono text-[10px] text-white/15">Empty</p> : notifications.slice(0, 5).map(n => (
            <div key={n.id} className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><p className="font-heading text-xs text-white/60">{n.title}</p><p className="font-mono text-[10px] text-white/20 mt-1">{n.message}</p></div>
          ))}</div>
        </motion.div>
      )}</AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]"><SpinnerGap size={24} className="text-[#DFFF00] animate-spin" /></div> : (
            <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" style={{ minHeight: '300px' }}>
              <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
              <MapCtrl center={mapCenter} zoom={mapZoom} />
              {userLocation && <Marker position={userLocation} icon={userIcon()}><Popup><div className="p-2 font-mono text-[10px]">YOU</div></Popup></Marker>}
              {filteredSpots.map(s => (
                <Marker key={s.id} position={[s.latitude, s.longitude]} icon={mkIcon(selectedSpot?.id === s.id, s.is_promoted)} eventHandlers={{ click: () => handleSpotClick(s) }}>
                  <Popup><div className="p-3">{s.is_promoted && <div className="font-mono text-[9px] text-[#DFFF00] uppercase tracking-wider mb-1">Featured</div>}<p className="font-heading text-sm text-white">{s.address}</p><p className="font-mono text-xs text-[#DFFF00]">${s.hourly_rate}/hr</p></div></Popup>
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
                  <h3 className="font-heading font-bold text-white text-sm">{selectedSpot.address}</h3>
                  <p className="font-mono text-[10px] text-white/20 mt-1">{selectedSpot.city}, {selectedSpot.state} {selectedSpot.zip_code}</p>
                  {selectedSpot.description && <p className="text-white/25 text-xs mt-3">{selectedSpot.description}</p>}
                  <div className="grid grid-cols-2 gap-[1px] bg-white/[0.04] mt-4">
                    <div className="bg-[#161616] p-3"><p className="font-mono text-[9px] text-white/20 uppercase">Hourly</p><p className="data-value text-lg text-[#DFFF00]">${selectedSpot.hourly_rate}</p></div>
                    {selectedSpot.event_rate && <div className="bg-[#161616] p-3"><p className="font-mono text-[9px] text-white/20 uppercase">Event</p><p className="data-value text-lg text-white">${selectedSpot.event_rate}</p></div>}
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
              <div className="space-y-1.5"><Label className="font-mono text-[10px] text-white/30 uppercase tracking-wider">License Plate</Label>
                <Input placeholder="ABC 1234" value={bookingForm.licensePlate} onChange={(e) => setBookingForm(p => ({ ...p, licensePlate: e.target.value.toUpperCase() }))}
                  className="license-plate-input h-14 text-lg rounded-none" maxLength={10} data-testid="booking-license-input" /></div>
              <div className="grid grid-cols-2 gap-[1px]">
                <div className="space-y-1.5"><Label className="font-mono text-[10px] text-white/30 uppercase">Make</Label><Input placeholder="Toyota" value={bookingForm.vehicleMake} onChange={(e) => setBookingForm(p => ({ ...p, vehicleMake: e.target.value }))} className="h-10 bg-[#1a1a1a] border-white/[0.04] text-white placeholder:text-white/15 rounded-none font-mono text-xs" data-testid="booking-make-input" /></div>
                <div className="space-y-1.5"><Label className="font-mono text-[10px] text-white/30 uppercase">Model</Label><Input placeholder="Camry" value={bookingForm.vehicleModel} onChange={(e) => setBookingForm(p => ({ ...p, vehicleModel: e.target.value }))} className="h-10 bg-[#1a1a1a] border-white/[0.04] text-white placeholder:text-white/15 rounded-none font-mono text-xs" data-testid="booking-model-input" /></div>
              </div>
              <div className="space-y-1.5"><Label className="font-mono text-[10px] text-white/30 uppercase">Duration</Label>
                <Select value={String(bookingForm.hours)} onValueChange={(v) => setBookingForm(p => ({ ...p, hours: parseInt(v), useEventRate: false }))}>
                  <SelectTrigger className="h-10 bg-[#1a1a1a] border-white/[0.04] text-white rounded-none font-mono text-xs" data-testid="booking-hours-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/[0.06] text-white rounded-none">{[1,2,3,4,5,6,8,10,12].map(h => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedSpot.event_rate && (
                <div className="flex items-center gap-3 p-3 bp-card">
                  <input type="checkbox" id="eventRate" checked={bookingForm.useEventRate} onChange={(e) => setBookingForm(p => ({ ...p, useEventRate: e.target.checked }))} className="accent-[#DFFF00]" data-testid="booking-event-rate-checkbox" />
                  <label htmlFor="eventRate" className="font-mono text-xs"><span className="text-white/50">Event rate</span> <span className="data-value text-[#DFFF00]">${selectedSpot.event_rate}</span></label>
                </div>
              )}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} className="pt-4">
                <div className="flex items-center justify-between mb-4"><span className="font-mono text-[10px] text-white/20 uppercase">Total</span><span className="data-value text-2xl text-[#DFFF00]">${calcTotal().toFixed(2)}</span></div>
                <Button type="submit" disabled={bookingLoading} className="w-full h-12 btn-neon rounded-none font-mono text-xs uppercase tracking-wider" data-testid="booking-submit-btn">
                  {bookingLoading ? <SpinnerGap size={16} className="animate-spin" /> : `Pay $${calcTotal().toFixed(2)}`}
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default GuestDashboard;
