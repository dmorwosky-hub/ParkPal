import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Car, MapPin, Check, Clock, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');
  
  const [status, setStatus] = useState('loading');
  const [booking, setBooking] = useState(null);
  const [spot, setSpot] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const pollPaymentStatus = async () => {
      try {
        const response = await axios.get(
          `${API}/bookings/status/${sessionId}`,
          getAuthHeaders()
        );
        
        if (response.data.payment_status === 'paid') {
          setStatus('success');
          // Fetch booking details
          const bookingRes = await axios.get(
            `${API}/bookings/${response.data.booking_id}`,
            getAuthHeaders()
          );
          setBooking(bookingRes.data);
          
          // Fetch spot details
          const spotRes = await axios.get(
            `${API}/spots/${bookingRes.data.spot_id}`
          );
          setSpot(spotRes.data);
          toast.success('Booking confirmed!');
        } else if (attempts < 5) {
          setAttempts(prev => prev + 1);
          setTimeout(pollPaymentStatus, 2000);
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        if (attempts < 5) {
          setAttempts(prev => prev + 1);
          setTimeout(pollPaymentStatus, 2000);
        } else {
          setStatus('error');
        }
      }
    };

    pollPaymentStatus();
  }, [sessionId, getAuthHeaders, attempts]);

  const getRemainingTime = () => {
    if (!booking?.end_time) return '';
    const end = new Date(booking.end_time);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleGetDirections = () => {
    if (spot) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#ECF0F1] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#E67E22] animate-spin mx-auto mb-4" />
          <p className="text-[#34495E] font-medium">Processing your payment...</p>
          <p className="text-slate-500 text-sm">Please wait</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#ECF0F1] flex items-center justify-center p-4">
        <Card className="bg-white border-0 shadow-xl rounded-2xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#C0392B]" />
            </div>
            <h1 className="text-2xl font-bold text-[#34495E] mb-2" style={{ fontFamily: 'Montserrat' }}>
              Something Went Wrong
            </h1>
            <p className="text-slate-500 mb-6">
              We couldn't confirm your payment. Please try again or contact support.
            </p>
            <Link to="/guest/dashboard">
              <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold" data-testid="back-to-dashboard-btn">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-[#ECF0F1] flex items-center justify-center p-4">
        <Card className="bg-white border-0 shadow-xl rounded-2xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-[#E67E22]" />
            </div>
            <h1 className="text-2xl font-bold text-[#34495E] mb-2" style={{ fontFamily: 'Montserrat' }}>
              Payment Processing
            </h1>
            <p className="text-slate-500 mb-6">
              Your payment is being processed. You'll receive a confirmation shortly.
            </p>
            <Link to="/guest/dashboard">
              <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold" data-testid="back-to-dashboard-btn">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECF0F1] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#27AE60] p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4"
            >
              <Check className="w-10 h-10 text-[#27AE60]" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Montserrat' }}>
              Booking Confirmed!
            </h1>
          </div>
          
          <CardContent className="p-6 space-y-4" data-testid="booking-success-card">
            {spot && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E67E22] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#34495E]">{spot.address}</h3>
                    <p className="text-sm text-slate-500">{spot.city}, {spot.state} {spot.zip_code}</p>
                  </div>
                </div>
              </div>
            )}

            {booking && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <Clock className="w-6 h-6 text-[#E67E22] mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Time Remaining</p>
                    <p className="font-bold text-[#34495E]">{getRemainingTime()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <Car className="w-6 h-6 text-[#E67E22] mx-auto mb-2" />
                    <p className="text-xs text-slate-500">License Plate</p>
                    <p className="font-bold text-[#34495E] font-mono">{booking.license_plate}</p>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#34495E]">Total Paid</span>
                    <span className="text-xl font-bold text-[#E67E22]">
                      ${booking.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-center text-sm text-slate-500">
                  <p>{booking.vehicle_make} {booking.vehicle_model}</p>
                  <p>Duration: {booking.hours} hour{booking.hours > 1 ? 's' : ''}</p>
                </div>
              </>
            )}

            <div className="space-y-3 pt-4">
              <Button
                onClick={handleGetDirections}
                className="w-full h-14 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold text-lg shadow-lg btn-active"
                data-testid="get-directions-btn"
              >
                <Navigation className="w-5 h-5 mr-2" />
                Get Directions
              </Button>
              <Link to="/guest/dashboard" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-[#34495E] text-[#34495E] rounded-full font-semibold"
                  data-testid="back-to-map-btn"
                >
                  Back to Map
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BookingSuccess;
