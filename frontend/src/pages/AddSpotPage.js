import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, MapPin, DollarSign, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom marker icon
const markerIcon = L.divIcon({
  className: 'custom-marker-wrapper',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: #E67E22;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} icon={markerIcon} /> : null;
};

const FlyToLocation = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1 });
  }, [center, map]);
  return null;
};

const AddSpotPage = () => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([34.0522, -118.2437]);
  
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    hourly_rate: '',
    event_rate: '',
    description: ''
  });

  // Get user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.address || !formData.city || !formData.state || !formData.zip_code || !formData.hourly_rate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!position) {
      toast.error('Please click on the map to set your spot location');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/spots`,
        {
          ...formData,
          latitude: position[0],
          longitude: position[1],
          hourly_rate: parseFloat(formData.hourly_rate),
          event_rate: formData.event_rate ? parseFloat(formData.event_rate) : null
        },
        getAuthHeaders()
      );
      toast.success('Parking spot added successfully!');
      navigate('/host/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add spot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECF0F1] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/host/dashboard" className="inline-flex items-center gap-2 text-[#34495E] hover:text-[#E67E22] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#34495E] text-white p-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'Montserrat' }}>
              <MapPin className="w-6 h-6" />
              Add New Parking Spot
            </CardTitle>
            <CardDescription className="text-slate-300">
              List your driveway and start earning money
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Picker */}
              <div>
                <Label className="text-[#34495E] font-semibold mb-3 block">
                  Click on the map to set your spot location *
                </Label>
                <div className="h-64 rounded-xl overflow-hidden border-2 border-slate-200">
                  <MapContainer
                    center={mapCenter}
                    zoom={12}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FlyToLocation center={mapCenter} />
                    <LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                {position && (
                  <p className="mt-2 text-sm text-[#27AE60] flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Location set: {position[0].toFixed(4)}, {position[1].toFixed(4)}
                  </p>
                )}
              </div>

              {/* Address Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[#34495E]">Street Address *</Label>
                  <Input
                    placeholder="123 Main St"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                    data-testid="address-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#34495E]">City *</Label>
                  <Input
                    placeholder="Los Angeles"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                    data-testid="city-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#34495E]">State *</Label>
                    <Input
                      placeholder="CA"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                      maxLength={2}
                      data-testid="state-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#34495E]">ZIP *</Label>
                    <Input
                      placeholder="90001"
                      value={formData.zip_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                      className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                      data-testid="zip-input"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#34495E] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#E67E22]" />
                    Hourly Rate *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      type="number"
                      placeholder="5.00"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      className="h-12 pl-8 bg-slate-50 border-slate-200 rounded-xl"
                      min="1"
                      step="0.50"
                      data-testid="hourly-rate-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#34495E] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Event Rate (Optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      type="number"
                      placeholder="20.00"
                      value={formData.event_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, event_rate: e.target.value }))}
                      className="h-12 pl-8 bg-slate-50 border-slate-200 rounded-xl"
                      min="1"
                      step="0.50"
                      data-testid="event-rate-input"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Flat rate for events (any duration)</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-[#34495E]">Description (Optional)</Label>
                <Textarea
                  placeholder="Describe your parking spot... (e.g., 'Covered driveway, fits 2 cars, near stadium entrance')"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-50 border-slate-200 rounded-xl resize-none"
                  rows={3}
                  data-testid="description-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold text-lg shadow-lg btn-active"
                data-testid="submit-spot-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Add Parking Spot
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddSpotPage;
