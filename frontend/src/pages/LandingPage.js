import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Car, MapPin, DollarSign, Clock, Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#ECF0F1]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#E67E22] flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-[#34495E]" style={{ fontFamily: 'Montserrat' }}>
                Park-Pal
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-[#34495E] hover:bg-slate-100 rounded-full font-medium" data-testid="header-login-btn">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all btn-active" data-testid="header-register-btn">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#34495E] tracking-tight leading-tight" style={{ fontFamily: 'Montserrat' }}>
                Your Driveway.
                <br />
                <span className="text-[#E67E22]">Their Parking.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-lg">
                The peer-to-peer parking marketplace that connects homeowners with drivers looking for safe, convenient parking near events and busy areas.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register?role=guest">
                  <Button className="w-full sm:w-auto bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all btn-active" data-testid="hero-find-parking-btn">
                    <MapPin className="w-5 h-5 mr-2" />
                    Find Parking
                  </Button>
                </Link>
                <Link to="/register?role=host">
                  <Button variant="outline" className="w-full sm:w-auto border-2 border-[#34495E] text-[#34495E] hover:bg-slate-50 rounded-full font-semibold text-lg px-8 py-6" data-testid="hero-list-spot-btn">
                    <DollarSign className="w-5 h-5 mr-2" />
                    List Your Spot
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1759369484704-fefd537878f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjYXIlMjBpbiUyMGRyaXZld2F5fGVufDB8fHx8MTc2OTY0MDg2MXww&ixlib=rb-4.1.0&q=85&w=800"
                  alt="Modern car parked in driveway"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Safe & Verified</p>
                    <p className="font-bold text-[#34495E]">100% Secure</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#34495E] tracking-tight" style={{ fontFamily: 'Montserrat' }}>
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-600">Simple, fast, and secure parking</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: 'Find a Spot',
                description: 'Browse available driveways near your destination on our interactive map.'
              },
              {
                icon: Clock,
                title: 'Book Instantly',
                description: '2-tap checkout. Enter your license plate, pay, and you\'re set.'
              },
              {
                icon: Car,
                title: 'Park & Go',
                description: 'Get directions to your spot and enjoy worry-free parking.'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#ECF0F1] rounded-2xl p-8 card-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-[#E67E22] flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#34495E] mb-3" style={{ fontFamily: 'Montserrat' }}>
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Host CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#34495E]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Montserrat' }}>
                Earn Money From Your Empty Driveway
              </h2>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                Turn your unused driveway into a revenue stream. Set your own prices, 
                control your availability, and earn money while you're at home.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Set hourly or event rates',
                  'Toggle availability on/off instantly',
                  'Receive 85% of every booking',
                  'Real-time vehicle verification'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 rounded-full bg-[#E67E22] flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=host">
                <Button className="mt-8 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-full font-bold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all btn-active" data-testid="host-cta-btn">
                  Start Hosting
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1653930534246-5156ebfeddc8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxjaXR5JTIwc3RyZWV0JTIwcGFya2luZyUyMG92ZXJoZWFkfGVufDB8fHx8MTc2OTY0MDg2NXww&ixlib=rb-4.1.0&q=85&w=800"
                  alt="Aerial view of parking"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E67E22] flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-[#34495E]" style={{ fontFamily: 'Montserrat' }}>
                Park-Pal
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-sm text-slate-500 hover:text-[#E67E22] transition-colors" data-testid="footer-terms-link">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-[#E67E22] transition-colors" data-testid="footer-privacy-link">
                Privacy Policy
              </Link>
            </div>
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Park-Pal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
