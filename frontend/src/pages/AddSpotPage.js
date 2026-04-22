import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, MapPin, CurrencyDollar, SpinnerGap, Check, Crosshair } from '@phosphor-icons/react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const markerIcon = L.divIcon({
  className: 'custom-marker-wrapper',
  html: '<div style="width:40px;height:40px;background:#34d399;border-radius:50%;border:4px solid rgba(255,255,255,0.9);box-shadow:0 0 12px rgba(52,211,153,0.5);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:white;border-radius:50%;"></div></div>',
  iconSize: [40, 40], iconAnchor: [20, 20],
});

const LocationPicker = ({ position, setPosition }) => { useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } }); return position ? <Marker position={position} icon={markerIcon} /> : null; };
const FlyTo = ({ center }) => { const map = useMap(); useEffect(() => { if (center) map.flyTo(center, 14, { duration: 1 }); }, [center, map]); return null; };

const AddSpotPage = () => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([34.0522, -118.2437]);
  const [locating, setLocating] = useState(false);
  const [formData, setFormData] = useState({ address: '', city: '', state: '', zip_code: '', hourly_rate: '', event_rate: '', description: '' });

  useEffect(() => { if ('geolocation' in navigator) navigator.geolocation.getCurrentPosition(p => setMapCenter([p.coords.latitude, p.coords.longitude]), () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }); }, []);

  const handleLocate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p => { setMapCenter([p.coords.latitude, p.coords.longitude]); setLocating(false); }, () => { toast.error('Allow location access'); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.address || !formData.city || !formData.state || !formData.zip_code || !formData.hourly_rate) { toast.error('Fill in all required fields'); return; }
    if (!position) { toast.error('Click the map to set location'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/spots`, { ...formData, latitude: position[0], longitude: position[1], hourly_rate: parseFloat(formData.hourly_rate), event_rate: formData.event_rate ? parseFloat(formData.event_rate) : null }, getAuthHeaders());
      toast.success('Spot added!'); navigate('/host/dashboard');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#022c22] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/host/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#34d399] mb-6 transition-colors text-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
        <div className="glass rounded-xl overflow-hidden">
          <div className="bg-[#064e3b] p-6 border-b border-white/5">
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight flex items-center gap-3"><MapPin size={24} weight="light" className="text-[#34d399]" /> Add New Parking Spot</h1>
            <p className="text-slate-400 text-sm mt-1">List your driveway and start earning</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white font-semibold">Click map to set location *</Label>
                  <Button type="button" onClick={handleLocate} disabled={locating} className="bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl px-3 h-8 text-xs font-medium" data-testid="add-spot-locate-btn">
                    {locating ? <SpinnerGap size={12} className="animate-spin mr-1" /> : <Crosshair size={12} weight="bold" className="mr-1" />} My Location
                  </Button>
                </div>
                <div className="h-64 rounded-xl overflow-hidden border border-white/10">
                  <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
                    <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <FlyTo center={mapCenter} /><LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                {position && <p className="mt-2 text-sm text-[#34d399] flex items-center gap-1"><Check size={14} /> Location set: {position[0].toFixed(4)}, {position[1].toFixed(4)}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2"><Label className="text-slate-300">Street Address *</Label><Input placeholder="123 Main St" value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" data-testid="address-input" /></div>
                <div className="space-y-2"><Label className="text-slate-300">City *</Label><Input placeholder="Los Angeles" value={formData.city} onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" data-testid="city-input" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-slate-300">State *</Label><Input placeholder="CA" value={formData.state} onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" maxLength={2} data-testid="state-input" /></div>
                  <div className="space-y-2"><Label className="text-slate-300">ZIP *</Label><Input placeholder="90001" value={formData.zip_code} onChange={(e) => setFormData(p => ({ ...p, zip_code: e.target.value }))} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" data-testid="zip-input" /></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-slate-300 flex items-center gap-2"><CurrencyDollar size={14} weight="light" className="text-[#34d399]" /> Hourly Rate *</Label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span><Input type="number" placeholder="5.00" value={formData.hourly_rate} onChange={(e) => setFormData(p => ({ ...p, hourly_rate: e.target.value }))} className="h-12 pl-8 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" min="1" step="0.50" data-testid="hourly-rate-input" /></div></div>
                <div className="space-y-2"><Label className="text-slate-300 flex items-center gap-2"><CurrencyDollar size={14} weight="light" className="text-slate-500" /> Event Rate</Label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span><Input type="number" placeholder="20.00" value={formData.event_rate} onChange={(e) => setFormData(p => ({ ...p, event_rate: e.target.value }))} className="h-12 pl-8 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" min="1" step="0.50" data-testid="event-rate-input" /></div><p className="text-xs text-slate-600">Flat rate for events</p></div>
              </div>
              <div className="space-y-2"><Label className="text-slate-300">Description</Label><Textarea placeholder="Covered driveway, fits 2 cars, near stadium..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl resize-none" rows={3} data-testid="description-input" /></div>
              <Button type="submit" disabled={loading} className="w-full h-14 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 btn-active" data-testid="submit-spot-btn">
                {loading ? <SpinnerGap size={20} className="animate-spin" /> : <><Check size={20} weight="bold" className="mr-2" /> Add Parking Spot</>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSpotPage;
