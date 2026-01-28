import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { 
  Car, MapPin, Plus, DollarSign, Clock, Power, AlertTriangle,
  LogOut, Bell, X, ChevronRight, Loader2, Timer, Edit2, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HostDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [editingSpot, setEditingSpot] = useState(null);
  const [autoOffHours, setAutoOffHours] = useState('');
  
  const [violationDialog, setViolationDialog] = useState(false);
  const [violationBooking, setViolationBooking] = useState(null);
  const [violationReason, setViolationReason] = useState('');
  const [violationLoading, setViolationLoading] = useState(false);

  const fetchSpots = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/spots/my`, getAuthHeaders());
      setSpots(response.data);
    } catch (error) {
      console.error('Error fetching spots:', error);
    }
  }, [getAuthHeaders]);

  const fetchActiveBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/bookings/active/host`, getAuthHeaders());
      setActiveBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, [getAuthHeaders]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/notifications`, getAuthHeaders());
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSpots(), fetchActiveBookings(), fetchNotifications()]);
      setLoading(false);
    };
    loadData();
    
    const interval = setInterval(() => {
      fetchSpots();
      fetchActiveBookings();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchSpots, fetchActiveBookings, fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleToggleActive = async (spotId) => {
    try {
      const response = await axios.post(
        `${API}/spots/${spotId}/toggle`,
        {},
        getAuthHeaders()
      );
      setSpots(prev => prev.map(s => s.id === spotId ? response.data : s));
      toast.success(response.data.is_active ? 'Spot is now active!' : 'Spot deactivated');
    } catch (error) {
      toast.error('Failed to toggle spot');
    }
  };

  const handleSetAutoOff = async (spotId) => {
    if (!autoOffHours) return;
    
    try {
      const response = await axios.patch(
        `${API}/spots/${spotId}`,
        { auto_off_hours: parseInt(autoOffHours), is_active: true },
        getAuthHeaders()
      );
      setSpots(prev => prev.map(s => s.id === spotId ? response.data : s));
      setAutoOffHours('');
      toast.success(`Auto-off set for ${autoOffHours} hours`);
    } catch (error) {
      toast.error('Failed to set auto-off timer');
    }
  };

  const handleUpdatePricing = async (spotId) => {
    if (!editingSpot) return;
    
    try {
      const response = await axios.patch(
        `${API}/spots/${spotId}`,
        {
          hourly_rate: parseFloat(editingSpot.hourly_rate),
          event_rate: editingSpot.event_rate ? parseFloat(editingSpot.event_rate) : null
        },
        getAuthHeaders()
      );
      setSpots(prev => prev.map(s => s.id === spotId ? response.data : s));
      setEditingSpot(null);
      toast.success('Pricing updated');
    } catch (error) {
      toast.error('Failed to update pricing');
    }
  };

  const handleReportViolation = async () => {
    if (!violationBooking || !violationReason) return;
    
    setViolationLoading(true);
    try {
      await axios.post(
        `${API}/violations/report`,
        {
          booking_id: violationBooking.id,
          reason: violationReason
        },
        getAuthHeaders()
      );
      toast.success('Violation reported');
      setViolationDialog(false);
      setViolationBooking(null);
      setViolationReason('');
    } catch (error) {
      toast.error('Failed to report violation');
    } finally {
      setViolationLoading(false);
    }
  };

  const getRemainingTime = (endTime) => {
    if (!endTime) return null;
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F1]">
        <Loader2 className="w-8 h-8 text-[#E67E22] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECF0F1]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#E67E22] flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-[#34495E] hidden sm:block" style={{ fontFamily: 'Montserrat' }}>
            Park-Pal
          </span>
          <Badge className="bg-[#34495E] text-white ml-2">Host</Badge>
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
            className="fixed top-16 right-4 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
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
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Spots</p>
                  <p className="text-2xl font-bold text-[#34495E]">{spots.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#34495E]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Now</p>
                  <p className="text-2xl font-bold text-[#27AE60]">
                    {spots.filter(s => s.is_active).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Power className="w-6 h-6 text-[#27AE60]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Bookings</p>
                  <p className="text-2xl font-bold text-[#E67E22]">{activeBookings.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Car className="w-6 h-6 text-[#E67E22]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <Link to="/host/add-spot">
                <Button className="w-full h-full bg-[#E67E22] hover:bg-[#D35400] text-white rounded-xl font-bold shadow-lg btn-active" data-testid="add-spot-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Spot
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* My Spots */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#34495E] mb-4" style={{ fontFamily: 'Montserrat' }}>
            My Parking Spots
          </h2>
          
          {spots.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">You haven't listed any parking spots yet</p>
                <Link to="/host/add-spot">
                  <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Spot
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spots.map(spot => (
                <Card key={spot.id} className="bg-white border-0 shadow-sm card-hover overflow-hidden" data-testid={`host-spot-${spot.id}`}>
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${spot.is_active ? 'bg-green-100' : 'bg-slate-100'}`}>
                            <MapPin className={`w-5 h-5 ${spot.is_active ? 'text-[#27AE60]' : 'text-slate-400'}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#34495E] text-sm">{spot.address}</h3>
                            <p className="text-xs text-slate-500">{spot.city}, {spot.state}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{spot.is_active ? 'Active' : 'Inactive'}</span>
                          <Switch
                            checked={spot.is_active}
                            onCheckedChange={() => handleToggleActive(spot.id)}
                            className="data-[state=checked]:bg-[#27AE60]"
                            data-testid={`toggle-spot-${spot.id}`}
                          />
                        </div>
                      </div>

                      {/* Pricing */}
                      {editingSpot?.id === spot.id ? (
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label className="text-xs text-slate-500">Hourly Rate</Label>
                            <Input
                              type="number"
                              value={editingSpot.hourly_rate}
                              onChange={(e) => setEditingSpot(prev => ({ ...prev, hourly_rate: e.target.value }))}
                              className="h-9 bg-slate-50"
                              data-testid="edit-hourly-rate-input"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-slate-500">Event Rate</Label>
                            <Input
                              type="number"
                              value={editingSpot.event_rate || ''}
                              onChange={(e) => setEditingSpot(prev => ({ ...prev, event_rate: e.target.value }))}
                              placeholder="Optional"
                              className="h-9 bg-slate-50"
                              data-testid="edit-event-rate-input"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePricing(spot.id)}
                            className="bg-[#27AE60] hover:bg-green-600"
                            data-testid="save-pricing-btn"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSpot(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-[#E67E22]" />
                            <span className="font-bold text-[#34495E]">${spot.hourly_rate}/hr</span>
                          </div>
                          {spot.event_rate && (
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <span>${spot.event_rate} event</span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSpot({ ...spot })}
                            className="ml-auto"
                            data-testid={`edit-spot-${spot.id}`}
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Auto-Off Timer */}
                    {spot.is_active && (
                      <div className="p-4 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Timer className="w-4 h-4 text-[#E67E22]" />
                            {spot.auto_off_time ? (
                              <span className="text-[#34495E]">
                                Auto-off: {new Date(spot.auto_off_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-slate-500">No auto-off set</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={autoOffHours} onValueChange={setAutoOffHours}>
                              <SelectTrigger className="h-8 w-24 bg-white text-sm" data-testid={`auto-off-select-${spot.id}`}>
                                <SelectValue placeholder="Hours" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(h => (
                                  <SelectItem key={h} value={String(h)}>{h}h</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleSetAutoOff(spot.id)}
                              disabled={!autoOffHours}
                              className="bg-[#34495E] hover:bg-slate-700 h-8"
                              data-testid={`set-auto-off-${spot.id}`}
                            >
                              Set
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Authorized Vehicles */}
        {activeBookings.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#34495E] mb-4" style={{ fontFamily: 'Montserrat' }}>
              Authorized Vehicles
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activeBookings.map(booking => (
                <Card key={booking.id} className="bg-white border-0 shadow-sm" data-testid={`booking-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <Car className="w-6 h-6 text-[#27AE60]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#34495E]">{booking.license_plate}</h3>
                          <p className="text-sm text-slate-500">
                            {booking.vehicle_make} {booking.vehicle_model}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-[#27AE60]">Active</Badge>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[#E67E22]" />
                          <span className="text-slate-500">Time Remaining:</span>
                        </div>
                        <span className="font-semibold text-[#34495E]">
                          {getRemainingTime(booking.end_time)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                      <span>Guest: {booking.guest_name}</span>
                      <span>Payout: ${booking.host_payout.toFixed(2)}</span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-[#C0392B] text-[#C0392B] hover:bg-red-50"
                      onClick={() => {
                        setViolationBooking(booking);
                        setViolationDialog(true);
                      }}
                      data-testid={`report-violation-${booking.id}`}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report Violation
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Violation Dialog */}
      <Dialog open={violationDialog} onOpenChange={setViolationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#C0392B]" style={{ fontFamily: 'Montserrat' }}>
              Report Violation
            </DialogTitle>
            <DialogDescription>
              Report if the vehicle is overstaying or doesn't match the booking details.
            </DialogDescription>
          </DialogHeader>
          
          {violationBooking && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="font-mono font-bold text-[#34495E]">{violationBooking.license_plate}</p>
                <p className="text-sm text-slate-500">
                  {violationBooking.vehicle_make} {violationBooking.vehicle_model}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Reason for Report</Label>
                <Textarea
                  placeholder="Describe the violation..."
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="bg-slate-50 resize-none"
                  rows={3}
                  data-testid="violation-reason-input"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setViolationDialog(false);
                setViolationReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportViolation}
              disabled={!violationReason || violationLoading}
              className="bg-[#C0392B] hover:bg-red-700 text-white"
              data-testid="submit-violation-btn"
            >
              {violationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Submit Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostDashboard;
