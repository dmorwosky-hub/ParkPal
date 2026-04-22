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

const createMarkerIcon = (isSelected = false, isPromoted = false) => {
  const color = isPromoted ? '#fbbf24' : '#34d399';
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="width:${isSelected ? 44 : 36}px;height:${isSelected ? 44 : 36}px;background:${color};border-radius:50%;border:3px solid rgba(255,255,255,0.9);box-shadow:0 0 12px ${color}80;display:flex;align-items:center;justify-content:center;transition:all 0.2s;${isSelected ? 'transform:scale(1.15);' : ''}${isPromoted ? 'animation:promoted-glow 2s ease-in-out infinite;' : ''}">
        ${isPromoted ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : '<div style="width:8px;height:8px;background:white;border-radius:50%;"></div>'}
      </div>
      ${!isSelected ? `<div class="map-pin-pulse" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;background:${color}30;border-radius:50%;z-index:-1;"></div>` : ''}
    `,
    iconSize: [isSelected ? 44 : 36, isSelected ? 44 : 36],
    iconAnchor: [isSelected ? 22 : 18, isSelected ? 22 : 18],
  });
};

const createUserLocationIcon = () => L.divIcon({
  className: 'custom-marker-wrapper',
  html: `<div style="width:18px;height:18px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #3B82F6,0 0 12px rgba(59,130,246,0.5);"></div><div class="map-pin-pulse" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:36px;height:36px;background:rgba(59,130,246,0.15);border-radius:50%;z-index:-1;"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom || 14, { duration: 1 }); }, [center, zoom, map]);
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
  const [bookingForm, setBookingForm] = useState({ licensePlate: '', vehicleMake: '', vehicleModel: '', hours: 1, useEventRate: false });
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchSpots = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (maxPrice) params.append('max_price', maxPrice);
      const response = await axios.get(`${API}/spots?${params.toString()}`);
      setSpots(response.data);
    } catch (error) { toast.error('Failed to load spots'); }
    finally { setLoading(false); }
  }, [maxPrice]);

  const fetchNotifications = useCallback(async () => {
    try { const r = await axios.get(`${API}/notifications`, getAuthHeaders()); setNotifications(r.data); } catch (e) {}
  }, [getAuthHeaders]);

  useEffect(() => { fetchSpots(); fetchNotifications(); const i = setInterval(fetchSpots, 30000); return () => clearInterval(i); }, [fetchSpots, fetchNotifications]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => { const loc = [p.coords.latitude, p.coords.longitude]; setUserLocation(loc); setMapCenter(loc); setMapZoom(14); },
        () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) { toast.error('Geolocation not supported'); return; }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { const loc = [p.coords.latitude, p.coords.longitude]; setUserLocation(loc); setMapCenter(loc); setMapZoom(15); setLocatingUser(false); },
      () => { toast.error('Allow location access'); setLocatingUser(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSpotClick = (spot) => { setSelectedSpot(spot); setMapCenter([spot.latitude, spot.longitude]); setMapZoom(15); };
  const handleBookNow = () => { setBookingOpen(true); setBookingForm({ licensePlate: '', vehicleMake: '', vehicleModel: '', hours: 1, useEventRate: false }); };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.licensePlate || !bookingForm.vehicleMake || !bookingForm.vehicleModel) { toast.error('Fill in all vehicle details'); return; }
    setBookingLoading(true);
    try {
      const r = await axios.post(`${API}/bookings/checkout`, {
        spot_id: selectedSpot.id, license_plate: bookingForm.licensePlate, vehicle_make: bookingForm.vehicleMake,
        vehicle_model: bookingForm.vehicleModel, hours: bookingForm.hours, use_event_rate: bookingForm.useEventRate, origin_url: window.location.origin
      }, getAuthHeaders());
      window.location.href = r.data.checkout_url;
    } catch (error) { toast.error(error.response?.data?.detail || 'Booking failed'); setBookingLoading(false); }
  };

  const calculateTotal = () => {
    if (!selectedSpot) return 0;
    return bookingForm.useEventRate && selectedSpot.event_rate ? selectedSpot.event_rate : selectedSpot.hourly_rate * bookingForm.hours;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredSpots = spots.filter(spot => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return spot.address.toLowerCase().includes(q) || spot.city.toLowerCase().includes(q) || spot.state.toLowerCase().includes(q);
  });

  return (
    <div className="h-screen flex flex-col bg-[#022c22]">
      {/* Header */}
      <header className="glass px-4 py-3 flex items-center justify-between z-50 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#34d399] flex items-center justify-center">
            <Car size={18} weight="bold" className="text-[#022c22]" />
          </div>
          <span className="font-heading font-bold text-white tracking-tight hidden sm:block">Park-Pal</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-[#34d399] hover:bg-white/5 rounded-xl text-xs" onClick={() => navigate('/guest/bookings')} data-testid="my-bookings-btn">
            <ClockCountdown size={16} weight="light" className="mr-1" /> My Bookings
          </Button>
          <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white hover:bg-white/5 rounded-xl" onClick={() => setShowNotifications(!showNotifications)} data-testid="notifications-btn">
            <Bell size={18} weight="light" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#34d399] text-[#022c22] text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
          </Button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-[#064e3b] flex items-center justify-center"><span className="text-[#34d399] text-xs font-bold">{user?.full_name?.charAt(0)}</span></div>
            <span className="text-sm text-slate-300">{user?.full_name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }} className="text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-xl" data-testid="logout-btn">
            <SignOut size={18} weight="light" />
          </Button>
        </div>
      </header>

      {/* Notifications */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 w-80 glass rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-heading font-bold text-white text-sm">Notifications</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white"><X size={14} /></Button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? <p className="p-4 text-center text-slate-600 text-sm">No notifications</p> :
                notifications.slice(0, 5).map(n => (
                  <div key={n.id} className={`p-4 border-b border-white/5 ${!n.is_read ? 'bg-[#34d399]/5' : ''}`}>
                    <p className="font-medium text-white text-sm">{n.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{n.message}</p>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
              <SpinnerGap size={32} weight="light" className="text-[#34d399] animate-spin" />
            </div>
          ) : (
            <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" style={{ minHeight: '300px' }}>
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <MapController center={mapCenter} zoom={mapZoom} />
              {userLocation && <Marker position={userLocation} icon={createUserLocationIcon()}><Popup><div className="p-2 text-sm font-medium">Your Location</div></Popup></Marker>}
              {filteredSpots.map(spot => (
                <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={createMarkerIcon(selectedSpot?.id === spot.id, spot.is_promoted)} eventHandlers={{ click: () => handleSpotClick(spot) }}>
                  <Popup>
                    <div className="p-3">
                      {spot.is_promoted && <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-1"><Star size={12} weight="fill" /> FEATURED</div>}
                      <p className="font-semibold text-white">{spot.address}</p>
                      <p className="text-[#34d399] font-bold">${spot.hourly_rate}/hr</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
          {/* Search */}
          <div className="absolute top-4 left-4 right-4 lg:right-auto lg:w-80 z-[1000]">
            <div className="glass rounded-xl p-3">
              <div className="relative">
                <MagnifyingGlass size={18} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input placeholder="Search by location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" data-testid="search-input" />
              </div>
              <div className="flex gap-2 mt-2">
                <Select value={maxPrice} onValueChange={setMaxPrice}>
                  <SelectTrigger className="h-9 bg-white/5 border-white/10 text-slate-300 rounded-xl flex-1" data-testid="price-filter">
                    <Funnel size={14} weight="light" className="mr-1.5 text-slate-500" /><SelectValue placeholder="Max Price" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#064e3b] border-white/10 text-white">
                    <SelectItem value="5">Under $5/hr</SelectItem><SelectItem value="10">Under $10/hr</SelectItem>
                    <SelectItem value="15">Under $15/hr</SelectItem><SelectItem value="20">Under $20/hr</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleLocateMe} disabled={locatingUser} className="h-9 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl px-3 font-medium text-xs" data-testid="locate-me-btn">
                  {locatingUser ? <SpinnerGap size={14} className="animate-spin" /> : <><Crosshair size={14} weight="bold" className="mr-1" /><span className="hidden sm:inline">Near Me</span></>}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-96 bg-[#022c22] border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-heading text-lg font-bold text-white mb-4 tracking-tight">
              {selectedSpot ? 'Spot Details' : `Available Spots (${filteredSpots.length})`}
            </h2>
            {selectedSpot ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Button variant="ghost" className="text-slate-500 hover:text-white text-sm" onClick={() => setSelectedSpot(null)} data-testid="back-to-list-btn">
                  <CaretRight size={14} className="rotate-180 mr-1" /> Back to list
                </Button>
                <div className={`glass rounded-xl p-5 ${selectedSpot.is_promoted ? 'border-amber-500/30' : ''}`} data-testid="spot-details-card">
                  {selectedSpot.is_promoted && (
                    <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1 w-fit border border-amber-500/20">
                      <Star size={12} weight="fill" /> FEATURED SPOT
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${selectedSpot.is_promoted ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-[#34d399]/10 border border-[#34d399]/20'}`}>
                      <MapPin size={22} weight="light" className={selectedSpot.is_promoted ? "text-amber-400" : "text-[#34d399]"} />
                    </div>
                    <div><h3 className="font-semibold text-white">{selectedSpot.address}</h3><p className="text-sm text-slate-500">{selectedSpot.city}, {selectedSpot.state} {selectedSpot.zip_code}</p></div>
                  </div>
                  {selectedSpot.description && <p className="mt-4 text-sm text-slate-400 font-light">{selectedSpot.description}</p>}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/5 rounded-xl p-3"><div className="flex items-center gap-1.5 text-slate-500 text-xs"><Clock size={14} weight="light" />Hourly</div><p className="text-xl font-bold text-white mt-1">${selectedSpot.hourly_rate}</p></div>
                    {selectedSpot.event_rate && <div className="bg-white/5 rounded-xl p-3"><div className="flex items-center gap-1.5 text-slate-500 text-xs"><CurrencyDollar size={14} weight="light" />Event</div><p className="text-xl font-bold text-[#34d399] mt-1">${selectedSpot.event_rate}</p></div>}
                  </div>
                  <div className="mt-4 text-sm text-slate-500">Hosted by <span className="text-slate-300 font-medium">{selectedSpot.host_name}</span></div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.latitude},${selectedSpot.longitude}`, '_blank')}
                    variant="outline" className="flex-1 h-12 border-white/10 text-white hover:bg-white/5 rounded-xl font-semibold" data-testid="get-directions-btn">
                    <NavigationArrow size={16} weight="light" className="mr-2" /> Directions
                  </Button>
                  <Button onClick={handleBookNow} className="flex-1 h-12 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-bold shadow-lg shadow-emerald-500/20 btn-active" data-testid="book-now-btn">
                    Book Now
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {filteredSpots.length === 0 ? <p className="text-center text-slate-600 py-8">No spots available</p> :
                  filteredSpots.map(spot => (
                    <div key={spot.id} className={`glass rounded-xl p-4 cursor-pointer card-hover ${spot.is_promoted ? 'border-amber-500/20' : ''}`} onClick={() => handleSpotClick(spot)} data-testid={`spot-card-${spot.id}`}>
                      {spot.is_promoted && <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-2"><Star size={12} weight="fill" /> FEATURED</div>}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${spot.is_promoted ? 'bg-amber-500/10' : 'bg-[#34d399]/10'}`}>
                            <MapPin size={18} weight="light" className={spot.is_promoted ? "text-amber-400" : "text-[#34d399]"} />
                          </div>
                          <div><h3 className="font-medium text-white text-sm">{spot.address}</h3><p className="text-xs text-slate-600">{spot.city}, {spot.state}</p></div>
                        </div>
                        <div className="text-right"><p className={`font-bold text-sm ${spot.is_promoted ? 'text-amber-400' : 'text-[#34d399]'}`}>${spot.hourly_rate}/hr</p>
                          {spot.event_rate && <p className="text-xs text-slate-600">${spot.event_rate} event</p>}</div>
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
        <SheetContent className="w-full sm:max-w-md bg-[#022c22] border-l border-white/5 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-heading text-white tracking-tight">Complete Your Booking</SheetTitle>
            <SheetDescription className="text-slate-500">Enter vehicle details to proceed</SheetDescription>
          </SheetHeader>
          {selectedSpot && (
            <form onSubmit={handleBookingSubmit} className="mt-6 space-y-5">
              <div className="glass rounded-xl p-4"><p className="font-medium text-white">{selectedSpot.address}</p><p className="text-sm text-slate-500">{selectedSpot.city}, {selectedSpot.state}</p></div>
              <div className="space-y-2"><Label className="text-slate-300 text-sm">License Plate</Label>
                <Input placeholder="ABC 1234" value={bookingForm.licensePlate} onChange={(e) => setBookingForm(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                  className="license-plate-input h-14 text-lg bg-white/5 border-white/10 rounded-xl" maxLength={10} data-testid="booking-license-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-slate-300 text-sm">Make</Label>
                  <Input placeholder="Toyota" value={bookingForm.vehicleMake} onChange={(e) => setBookingForm(prev => ({ ...prev, vehicleMake: e.target.value }))}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" data-testid="booking-make-input" /></div>
                <div className="space-y-2"><Label className="text-slate-300 text-sm">Model</Label>
                  <Input placeholder="Camry" value={bookingForm.vehicleModel} onChange={(e) => setBookingForm(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" data-testid="booking-model-input" /></div>
              </div>
              <div className="space-y-2"><Label className="text-slate-300 text-sm">Duration</Label>
                <Select value={String(bookingForm.hours)} onValueChange={(v) => setBookingForm(prev => ({ ...prev, hours: parseInt(v), useEventRate: false }))}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl" data-testid="booking-hours-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#064e3b] border-white/10 text-white">{[1,2,3,4,5,6,8,10,12].map(h => <SelectItem key={h} value={String(h)}>{h} hour{h>1?'s':''}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedSpot.event_rate && (
                <div className="flex items-center gap-3 p-4 glass rounded-xl">
                  <input type="checkbox" id="eventRate" checked={bookingForm.useEventRate} onChange={(e) => setBookingForm(prev => ({ ...prev, useEventRate: e.target.checked }))}
                    className="w-5 h-5 rounded border-white/20 text-[#34d399] focus:ring-[#34d399] bg-white/5" data-testid="booking-event-rate-checkbox" />
                  <label htmlFor="eventRate" className="text-sm"><span className="font-medium text-white">Event Rate</span><span className="text-slate-500 block">${selectedSpot.event_rate} flat (any duration)</span></label>
                </div>
              )}
              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center justify-between mb-4"><span className="text-slate-500">Total</span><span className="text-2xl font-bold text-white">${calculateTotal().toFixed(2)}</span></div>
                <Button type="submit" disabled={bookingLoading} className="w-full h-14 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 btn-active" data-testid="booking-submit-btn">
                  {bookingLoading ? <SpinnerGap size={20} className="animate-spin" /> : <><CurrencyDollar size={20} weight="bold" className="mr-2" />Pay ${calculateTotal().toFixed(2)}</>}
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
