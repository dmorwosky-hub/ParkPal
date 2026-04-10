import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Car, MapPin, Clock, DollarSign, ArrowLeft, Navigation,
  Loader2, Calendar, ChevronRight
} from 'lucide-react';
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
      const [historyRes, statsRes] = await Promise.all([
        axios.get(`${API}/bookings/history`, getAuthHeaders()),
        axios.get(`${API}/stats/guest`, getAuthHeaders())
      ]);
      setBookings(historyRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status, paymentStatus) => {
    if (status === 'confirmed' && paymentStatus === 'paid') return 'bg-emerald-100 text-emerald-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    if (status === 'completed') return 'bg-slate-100 text-slate-600';
    return 'bg-slate-100 text-slate-600';
  };

  const getStatusLabel = (status, paymentStatus, endTime) => {
    if (status === 'confirmed' && paymentStatus === 'paid') {
      if (endTime && new Date(endTime) < new Date()) return 'Completed';
      return 'Active';
    }
    if (status === 'pending') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return b.status === 'confirmed' && b.end_time && new Date(b.end_time) > new Date();
    }
    if (filter === 'completed') {
      return b.status === 'confirmed' && b.end_time && new Date(b.end_time) <= new Date();
    }
    return b.status === filter;
  });

  const handleGetDirections = (booking) => {
    if (booking.spot_address) {
      const query = encodeURIComponent(`${booking.spot_address}, ${booking.spot_city || ''} ${booking.spot_state || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF0F1]">
        <Loader2 className="w-8 h-8 text-[#E67E22] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECF0F1]">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/guest/dashboard">
            <Button variant="ghost" size="icon" data-testid="back-to-dashboard-btn">
              <ArrowLeft className="w-5 h-5 text-[#34495E]" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E67E22] flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-[#34495E]" style={{ fontFamily: 'Montserrat' }}>
              My Bookings
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#34495E]">{stats.total_bookings}</p>
                <p className="text-xs text-slate-500 mt-1">Total Bookings</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.active_bookings}</p>
                <p className="text-xs text-slate-500 mt-1">Active Now</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#E67E22]">${stats.total_spent.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Total Spent</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#34495E]">{stats.total_hours_parked}h</p>
                <p className="text-xs text-slate-500 mt-1">Hours Parked</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'pending', label: 'Pending' }
          ].map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className={filter === f.value
                ? 'bg-[#34495E] text-white rounded-full'
                : 'border-slate-200 text-slate-600 rounded-full'
              }
              data-testid={`filter-${f.value}-btn`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No bookings found</p>
              <Link to="/guest/dashboard">
                <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold mt-2" data-testid="find-parking-btn">
                  Find Parking
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking, index) => {
              const statusLabel = getStatusLabel(booking.status, booking.payment_status, booking.end_time);
              const isActive = statusLabel === 'Active';

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`bg-white border-0 shadow-sm overflow-hidden ${isActive ? 'ring-2 ring-emerald-400' : ''}`} data-testid={`booking-item-${booking.id}`}>
                    <CardContent className="p-0">
                      {isActive && (
                        <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          ACTIVE BOOKING
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                              <MapPin className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-[#34495E] text-sm">
                                {booking.spot_address || 'Parking Spot'}
                              </p>
                              {booking.spot_city && (
                                <p className="text-xs text-slate-500">
                                  {booking.spot_city}, {booking.spot_state}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.status, booking.payment_status)}>
                            {statusLabel}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <Car className="w-4 h-4 text-[#E67E22] mx-auto mb-1" />
                            <p className="text-xs font-mono font-bold text-[#34495E]">{booking.license_plate}</p>
                            <p className="text-[10px] text-slate-500">{booking.vehicle_make} {booking.vehicle_model}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <Clock className="w-4 h-4 text-[#34495E] mx-auto mb-1" />
                            <p className="text-xs font-bold text-[#34495E]">{booking.hours}h</p>
                            <p className="text-[10px] text-slate-500">Duration</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <DollarSign className="w-4 h-4 text-[#E67E22] mx-auto mb-1" />
                            <p className="text-xs font-bold text-[#E67E22]">${booking.total_amount.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-500">Paid</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {isActive && booking.spot_address && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-[#E67E22] text-[#E67E22] hover:bg-orange-50 rounded-full"
                              onClick={() => handleGetDirections(booking)}
                              data-testid={`directions-${booking.id}`}
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              Directions
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
