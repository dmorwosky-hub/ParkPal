import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, MapPin, CurrencyDollar, SpinnerGap, Check, Crosshair, Sparkle, ArrowsClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const markerIcon = L.divIcon({
  className: 'custom-marker-wrapper',
  html: '<div style="width:40px;height:40px;background:#DFFF00;border-radius:50%;border:4px solid rgba(255,255,255,0.9);box-shadow:0 0 12px rgba(52,211,153,0.5);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:white;border-radius:50%;"></div></div>',
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
  const [formData, setFormData] = useState({
    address: '', city: '', state: '', zip_code: '',
    hourly_rate: '', event_rate: '', description: '',
    has_monthly_lease: false, monthly_rate: '', lease_schedule: 'first_of_month'
  });
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) navigator.geolocation.getCurrentPosition(
      p => setMapCenter([p.coords.latitude, p.coords.longitude]),
      () => {}, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
    );
  }, []);

  const fetchPriceSuggestion = useCallback(async (zip) => {
    if (!zip || zip.length < 5) return;
    setLoadingSuggestion(true);
    try {
      const r = await axios.get(`${API}/spots/price-suggestion?zip_code=${zip}`);
      setPriceSuggestion(r.data);
    } catch(e) { setPriceSuggestion(null); } finally { setLoadingSuggestion(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (formData.zip_code.length === 5) fetchPriceSuggestion(formData.zip_code); }, 600);
    return () => clearTimeout(t);
  }, [formData.zip_code, fetchPriceSuggestion]);

  const handleLocate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => { setMapCenter([p.coords.latitude, p.coords.longitude]); setLocating(false); toast.success('Location found!'); },
      (err) => {
        setLocating(false);
        if (err.code === 1) toast.error('Location access denied. Enable it in browser settings.');
        else if (err.code === 2) toast.error('Location unavailable. Check your device GPS.');
        else toast.error('Location timed out. Try again.');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.address || !formData.city || !formData.state || !formData.zip_code || !formData.hourly_rate) { toast.error('Fill in all required fields'); return; }
    if (!position) { toast.error('Click the map to set location'); return; }
    if (formData.has_monthly_lease && !formData.monthly_rate) { toast.error('Enter a monthly rate'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/spots`, {
        ...formData,
        latitude: position[0],
        longitude: position[1],
        hourly_rate: parseFloat(formData.hourly_rate),
        event_rate: formData.event_rate ? parseFloat(formData.event_rate) : null,
        monthly_rate: formData.has_monthly_lease && formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
      }, getAuthHeaders());
      toast.success('Spot added!'); navigate('/host/dashboard');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/host/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#DFFF00] mb-6 transition-colors text-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
        <div className="bp-card overflow-hidden">
          <div className="bg-[#1a1a1a] p-6 border-b border-white/5">
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight flex items-center gap-3"><MapPin size={24} weight="light" className="text-[#DFFF00]" /> Add New Parking Spot</h1>
            <p className="text-slate-400 text-sm mt-1">List your driveway and start earning</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white font-semibold">Click map to set location *</Label>
                  <Button type="button" onClick={handleLocate} disabled={locating} className="bg-[#DFFF00] hover:bg-[#E8FF33] text-[#121212] rounded-none px-3 h-8 text-xs font-medium" data-testid="add-spot-locate-btn">
                    {locating ? <SpinnerGap size={12} className="animate-spin mr-1" /> : <Crosshair size={12} weight="bold" className="mr-1" />} My Location
                  </Button>
                </div>
                <div className="h-64 rounded-none overflow-hidden border border-white/10">
                  <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
                    <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <FlyTo center={mapCenter} /><LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                {position && <p className="mt-2 text-sm text-[#DFFF00] flex items-center gap-1"><Check size={14} /> Location set: {position[0].toFixed(4)}, {position[1].toFixed(4)}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2"><Label className="text-slate-300">Street Address *</Label><Input placeholder="123 Main St" value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none" data-testid="address-input" /></div>
                <div className="space-y-2"><Label className="text-slate-300">City *</Label><Input placeholder="Los Angeles" value={formData.city} onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none" data-testid="city-input" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-slate-300">State *</Label><Input placeholder="CA" value={formData.state} onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none" maxLength={2} data-testid="state-input" /></div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">ZIP *</Label>
                    <Input placeholder="90001" value={formData.zip_code} onChange={(e) => setFormData(p => ({ ...p, zip_code: e.target.value }))} className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none" maxLength={5} data-testid="zip-input" />
                  </div>
                </div>
              </div>

              {/* Price Suggestion Engine */}
              {(loadingSuggestion || priceSuggestion) && (
                <div className={`p-4 rounded-none ${priceSuggestion ? 'bg-[#DFFF00]/5' : 'bg-white/3'}`} style={{ border: '1px solid rgba(223,255,0,0.15)' }}>
                  {loadingSuggestion ? (
                    <div className="flex items-center gap-2">
                      <SpinnerGap size={14} className="text-[#DFFF00] animate-spin" />
                      <span className="font-mono text-[11px] text-white/30">Analyzing local demand...</span>
                    </div>
                  ) : priceSuggestion ? (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkle size={14} weight="fill" className="text-[#DFFF00]" />
                        <span className="font-mono text-[10px] text-[#DFFF00] uppercase tracking-wider">AI Price Suggestion</span>
                        <span className="font-mono text-[9px] text-white/20 ml-1">ZIP {formData.zip_code}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Min', val: priceSuggestion.suggested_min, desc: 'Stay competitive' },
                          { label: 'Optimal', val: priceSuggestion.suggested_rate, desc: 'Best earnings', highlight: true },
                          { label: 'Max', val: priceSuggestion.suggested_max, desc: 'Premium rate' },
                        ].map(({ label, val, desc, highlight }) => (
                          <button type="button" key={label}
                            onClick={() => setFormData(p => ({ ...p, hourly_rate: String(val) }))}
                            className={`p-2 text-left rounded-none transition-all ${highlight ? 'bg-[#DFFF00]/10 border border-[#DFFF00]/20' : 'bg-white/5 border border-white/5 hover:border-white/10'}`}>
                            <p className="font-mono text-[9px] text-white/30 uppercase">{label}</p>
                            <p className={`data-value text-lg ${highlight ? 'text-[#DFFF00]' : 'text-white'}`}>${val}</p>
                            <p className="font-mono text-[9px] text-white/20">{desc}</p>
                          </button>
                        ))}
                      </div>
                      <p className="font-mono text-[9px] text-white/20 mt-2">{priceSuggestion.reasoning} · {priceSuggestion.demand_level} demand</p>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2"><CurrencyDollar size={14} weight="light" className="text-[#DFFF00]" /> Hourly Rate *</Label>
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span><Input type="number" placeholder="5.00" value={formData.hourly_rate} onChange={(e) => setFormData(p => ({ ...p, hourly_rate: e.target.value }))} className="h-12 pl-8 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none" min="1" step="0.50" data-testid="hourly-rate-input" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2"><CurrencyDollar size={14} weight="light" className="text-slate-500" /> Event Rate</Label>
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span><Input type="number" placeholder="20.00" value={formData.event_rate} onChange={(e) => setFormData(p => ({ ...p, event_rate: e.target.value }))} className="h-12 pl-8 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none" min="1" step="0.50" data-testid="event-rate-input" /></div>
                  <p className="text-xs text-slate-600">Flat rate for events</p>
                </div>
              </div>

              {/* Monthly Lease Option */}
              <div className={`p-4 rounded-none transition-all ${formData.has_monthly_lease ? 'bg-blue-500/5 border border-blue-400/20' : 'bg-white/3 border border-white/5'}`}>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setFormData(p => ({ ...p, has_monthly_lease: !p.has_monthly_lease }))}
                    className={`w-8 h-5 rounded-full transition-all relative ${formData.has_monthly_lease ? 'bg-blue-400' : 'bg-white/10'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${formData.has_monthly_lease ? 'left-4' : 'left-0.5'}`} />
                  </button>
                  <div>
                    <p className="font-mono text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowsClockwise size={12} className="text-blue-400" /> Offer Monthly Lease
                    </p>
                    <p className="font-mono text-[10px] text-white/30 mt-0.5">Allow commuters to subscribe monthly</p>
                  </div>
                </div>
                {formData.has_monthly_lease && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs">Monthly Rate *</Label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span><Input type="number" placeholder="120.00" value={formData.monthly_rate} onChange={(e) => setFormData(p => ({ ...p, monthly_rate: e.target.value }))} className="h-10 pl-7 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none text-sm" min="1" step="1" /></div>
                      {priceSuggestion?.suggested_monthly && <p className="font-mono text-[9px] text-blue-400/60">Suggested: ${priceSuggestion.suggested_monthly}/mo</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs">Billing Day</Label>
                      <select value={formData.lease_schedule} onChange={(e) => setFormData(p => ({ ...p, lease_schedule: e.target.value }))}
                        className="h-10 w-full bg-white/5 border border-white/10 text-white rounded-none text-sm px-3 font-mono text-xs">
                        <option value="first_of_month">1st of month</option>
                        <option value="15th_of_month">15th of month</option>
                        <option value="signup_date">Day of signup</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2"><Label className="text-slate-300">Description</Label><Textarea placeholder="Covered driveway, fits 2 cars, near stadium..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-none resize-none" rows={3} data-testid="description-input" /></div>
              <Button type="submit" disabled={loading} className="w-full h-14 bg-[#DFFF00] hover:bg-[#E8FF33] text-[#121212] rounded-none font-bold text-lg btn-active" data-testid="submit-spot-btn">
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
