import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Car, MapPin, Search, Filter, DollarSign, Clock, Navigation, 
  LogOut, Bell, X, ChevronRight, Loader2, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom marker icon
const createMarkerIcon = (isSelected = false, isPromoted = false) => {
  const bgColor = isPromoted ? '#9B59B6' : '#E67E22';
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="
        width: ${isSelected ? '44px' : '36px'};
        height: ${isSelected ? '44px' : '36px'};
        background: ${bgColor};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        ${isSelected ? 'transform: scale(1.2);' : ''}
        ${isPromoted ? 'animation: promoted-glow 2s ease-in-out infinite;' : ''}
      ">
        ${isPromoted ? `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        ` : `
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        `}
      </div>
      ${!isSelected ? `
      <div class="map-pin-pulse" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50px;
        height: 50px;
        background: ${isPromoted ? 'rgba(155, 89, 182, 0.3)' : 'rgba(230, 126, 34, 0.3)'};
        border-radius: 50%;
        z-index: -1;
      "></div>
      ` : ''}
      ` : ''}
    `,
    iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
    iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
  });
};

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1 });
    }
  }, [center, map]);
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
  const [mapCenter, setMapCenter] = useState([34.0522, -118.2437]); // LA default
  
  const [bookingForm, setBookingForm] = useState({
    licensePlate: '',
    vehicleMake: '',
    vehicleModel: '',
    hours: 1,
    useEventRate: false
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchSpots = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (maxPrice) params.append('max_price', maxPrice);
      
      const response = await axios.get(`${API}/spots?${params.toString()}`);
      setSpots(response.data);
    } catch (error) {
      console.error('Error fetching spots:', error);
      toast.error('Failed to load parking spots');
    } finally {
      setLoading(false);
    }
  }, [maxPrice]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/notifications`, getAuthHeaders());
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchSpots();
    fetchNotifications();
    const interval = setInterval(fetchSpots, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchSpots, fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    setMapCenter([spot.latitude, spot.longitude]);
  };

  const handleBookNow = () => {
    setBookingOpen(true);
    setBookingForm({
      licensePlate: '',
      vehicleMake: '',
      vehicleModel: '',
      hours: 1,
      useEventRate: false
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.licensePlate || !bookingForm.vehicleMake || !bookingForm.vehicleModel) {
      toast.error('Please fill in all vehicle details');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await axios.post(
        `${API}/bookings/checkout`,
        {
          spot_id: selectedSpot.id,
          license_plate: bookingForm.licensePlate,
          vehicle_make: bookingForm.vehicleMake,
          vehicle_model: bookingForm.vehicleModel,
          hours: bookingForm.hours,
          use_event_rate: bookingForm.useEventRate,
          origin_url: window.location.origin
        },
        getAuthHeaders()
      );
      
      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
      setBookingLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedSpot) return 0;
    if (bookingForm.useEventRate && selectedSpot.event_rate) {
      return selectedSpot.event_rate;
    }
    return selectedSpot.hourly_rate * bookingForm.hours;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredSpots = spots.filter(spot => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      spot.address.toLowerCase().includes(query) ||
      spot.city.toLowerCase().includes(query) ||
      spot.state.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-screen flex flex-col bg-[#ECF0F1]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#E67E22] flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-[#34495E] hidden sm:block" style={{ fontFamily: 'Montserrat' }}>
            Park-Pal
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
            data-testid="notifications-btn"
          >
            <Bell className="w-5 h-5 text-[#34495E]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E67E22] text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <div className="w-8 h-8 rounded-full bg-[#34495E] flex items-center justify-center">
              <span className="text-white text-sm font-medium">{user?.full_name?.charAt(0)}</span>
            </div>
            <span className="text-sm font-medium text-[#34495E]">{user?.full_name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-500 hover:text-[#C0392B]"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-[#34495E]">Notifications</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-slate-500">No notifications</p>
              ) : (
                notifications.slice(0, 5).map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-slate-50 ${!notif.is_read ? 'bg-orange-50' : ''}`}
                  >
                    <p className="font-medium text-[#34495E] text-sm">{notif.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <Loader2 className="w-8 h-8 text-[#E67E22] animate-spin" />
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={12}
              className="h-full w-full"
              style={{ minHeight: '300px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} />
              {filteredSpots.map(spot => (
                <Marker
                  key={spot.id}
                  position={[spot.latitude, spot.longitude]}
                  icon={createMarkerIcon(selectedSpot?.id === spot.id)}
                  eventHandlers={{
                    click: () => handleSpotClick(spot)
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold text-[#34495E]">{spot.address}</p>
                      <p className="text-[#E67E22] font-bold">${spot.hourly_rate}/hr</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {/* Search Overlay */}
          <div className="absolute top-4 left-4 right-4 lg:right-auto lg:w-80 z-[1000]">
            <div className="bg-white rounded-xl shadow-lg p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-slate-50 border-0 rounded-lg"
                  data-testid="search-input"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Select value={maxPrice} onValueChange={setMaxPrice}>
                  <SelectTrigger className="h-9 bg-slate-50 border-0 rounded-lg" data-testid="price-filter">
                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Max Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Under $5/hr</SelectItem>
                    <SelectItem value="10">Under $10/hr</SelectItem>
                    <SelectItem value="15">Under $15/hr</SelectItem>
                    <SelectItem value="20">Under $20/hr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Bottom Sheet */}
        <div className="lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-bold text-[#34495E] mb-4" style={{ fontFamily: 'Montserrat' }}>
              {selectedSpot ? 'Spot Details' : `Available Spots (${filteredSpots.length})`}
            </h2>

            {selectedSpot ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Button
                  variant="ghost"
                  className="mb-2 text-slate-500"
                  onClick={() => setSelectedSpot(null)}
                  data-testid="back-to-list-btn"
                >
                  <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                  Back to list
                </Button>
                
                <Card className="bg-slate-50 border-0" data-testid="spot-details-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#E67E22] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#34495E]">{selectedSpot.address}</h3>
                        <p className="text-sm text-slate-500">{selectedSpot.city}, {selectedSpot.state} {selectedSpot.zip_code}</p>
                      </div>
                    </div>
                    
                    {selectedSpot.description && (
                      <p className="mt-4 text-sm text-slate-600">{selectedSpot.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Clock className="w-4 h-4" />
                          Hourly
                        </div>
                        <p className="text-xl font-bold text-[#34495E] mt-1">${selectedSpot.hourly_rate}</p>
                      </div>
                      {selectedSpot.event_rate && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <DollarSign className="w-4 h-4" />
                            Event Rate
                          </div>
                          <p className="text-xl font-bold text-[#E67E22] mt-1">${selectedSpot.event_rate}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <span>Hosted by</span>
                      <Badge variant="secondary" className="bg-slate-200 text-[#34495E]">
                        {selectedSpot.host_name}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.latitude},${selectedSpot.longitude}`;
                      window.open(url, '_blank');
                    }}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-[#34495E] text-[#34495E] rounded-full font-semibold"
                    data-testid="get-directions-btn"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                  <Button
                    onClick={handleBookNow}
                    className="flex-1 h-12 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold shadow-lg btn-active"
                    data-testid="book-now-btn"
                  >
                    Book Now
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredSpots.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No spots available</p>
                ) : (
                  filteredSpots.map(spot => (
                    <Card
                      key={spot.id}
                      className="bg-white border border-slate-100 cursor-pointer card-hover"
                      onClick={() => handleSpotClick(spot)}
                      data-testid={`spot-card-${spot.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 text-[#E67E22]" />
                            </div>
                            <div>
                              <h3 className="font-medium text-[#34495E] text-sm">{spot.address}</h3>
                              <p className="text-xs text-slate-500">{spot.city}, {spot.state}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#E67E22]">${spot.hourly_rate}/hr</p>
                            {spot.event_rate && (
                              <p className="text-xs text-slate-500">${spot.event_rate} event</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Sheet */}
      <Sheet open={bookingOpen} onOpenChange={setBookingOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[#34495E]" style={{ fontFamily: 'Montserrat' }}>
              Complete Your Booking
            </SheetTitle>
            <SheetDescription>
              Enter your vehicle details to proceed
            </SheetDescription>
          </SheetHeader>
          
          {selectedSpot && (
            <form onSubmit={handleBookingSubmit} className="mt-6 space-y-5">
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="font-medium text-[#34495E]">{selectedSpot.address}</p>
                <p className="text-sm text-slate-500">{selectedSpot.city}, {selectedSpot.state}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#34495E]">License Plate</Label>
                <Input
                  placeholder="ABC 1234"
                  value={bookingForm.licensePlate}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                  className="license-plate-input h-14 text-lg"
                  maxLength={10}
                  data-testid="booking-license-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[#34495E]">Vehicle Make</Label>
                  <Input
                    placeholder="Toyota"
                    value={bookingForm.vehicleMake}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, vehicleMake: e.target.value }))}
                    className="h-12 bg-slate-50 border-slate-200 rounded-lg"
                    data-testid="booking-make-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#34495E]">Vehicle Model</Label>
                  <Input
                    placeholder="Camry"
                    value={bookingForm.vehicleModel}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    className="h-12 bg-slate-50 border-slate-200 rounded-lg"
                    data-testid="booking-model-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#34495E]">Duration</Label>
                <Select
                  value={String(bookingForm.hours)}
                  onValueChange={(val) => setBookingForm(prev => ({ ...prev, hours: parseInt(val), useEventRate: false }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-lg" data-testid="booking-hours-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(h => (
                      <SelectItem key={h} value={String(h)}>{h} hour{h > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSpot.event_rate && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="eventRate"
                    checked={bookingForm.useEventRate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, useEventRate: e.target.checked }))}
                    className="w-5 h-5 rounded border-slate-300 text-[#E67E22] focus:ring-[#E67E22]"
                    data-testid="booking-event-rate-checkbox"
                  />
                  <label htmlFor="eventRate" className="text-sm">
                    <span className="font-medium text-[#34495E]">Use Event Rate</span>
                    <span className="text-slate-500 block">${selectedSpot.event_rate} flat rate (any duration)</span>
                  </label>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-[#34495E]">${calculateTotal().toFixed(2)}</span>
                </div>
                <Button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full h-14 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold text-lg shadow-lg btn-active"
                  data-testid="booking-submit-btn"
                >
                  {bookingLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Pay ${calculateTotal().toFixed(2)}
                    </>
                  )}
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
