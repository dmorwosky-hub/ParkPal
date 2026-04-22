import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, Car, CurrencyDollar, Timer, ShieldCheck, CaretRight, Question } from '@phosphor-icons/react';

const HERO_IMG = "https://customer-assets.emergentagent.com/job_dda2a2e5-addf-4640-ac60-5e5f3f527caf/artifacts/r5h4h5hy_Gemini_Generated_Image_ri4iidri4iidri4i.png";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#022c22]">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#34d399] flex items-center justify-center">
              <Car size={18} weight="bold" className="text-[#022c22]" />
            </div>
            <span className="font-heading font-bold text-xl text-white tracking-tight">Park-Pal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium" data-testid="header-login-btn">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold shadow-lg shadow-emerald-500/20 btn-active" data-testid="header-register-btn">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Aerial view of house with driveway" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#022c22]/70 via-black/50 to-[#022c22]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="uppercase text-xs tracking-[0.2em] text-[#34d399] font-medium mb-6"
          >
            Peer-to-peer parking marketplace
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]"
          >
            Your Driveway.
            <br />
            <span className="text-[#34d399]">Their Parking.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed font-light"
          >
            Connect with homeowners renting driveways near events and busy areas. Safe, affordable, instant.
          </motion.p>

          {/* Search Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 glass rounded-2xl p-2 max-w-lg mx-auto"
          >
            <div className="flex gap-2">
              <Link to="/register?role=guest" className="flex-1">
                <Button className="w-full h-14 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold text-base shadow-lg shadow-emerald-500/20 btn-active" data-testid="hero-find-parking-btn">
                  <MapPin size={20} weight="bold" className="mr-2" />
                  Find Parking
                </Button>
              </Link>
              <Link to="/register?role=host" className="flex-1">
                <Button variant="outline" className="w-full h-14 border-white/20 text-white hover:bg-white/5 rounded-xl font-semibold text-base" data-testid="hero-list-spot-btn">
                  <CurrencyDollar size={20} weight="bold" className="mr-2" />
                  List Your Spot
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-16 px-4 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '85%', label: 'Host Payout', sub: 'Industry leading' },
            { value: '2-Tap', label: 'Checkout', sub: 'Lightning fast' },
            { value: '24/7', label: 'Availability', sub: 'Always on' },
            { value: '$0', label: 'To List', sub: 'Free for hosts' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="font-heading text-3xl sm:text-4xl font-black text-[#34d399] tracking-tight">{stat.value}</p>
              <p className="text-white font-medium mt-1 text-sm">{stat.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bento Grid — How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <p className="uppercase text-xs tracking-[0.2em] text-[#34d399] font-medium mb-3">How it works</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight mb-12">
            Three steps. Zero hassle.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tall card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:row-span-2 glass rounded-xl p-8 flex flex-col justify-between min-h-[320px] card-hover"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center mb-6">
                  <MapPin size={24} weight="light" className="text-[#34d399]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-3">Find a Spot</h3>
                <p className="text-slate-400 leading-relaxed font-light">
                  Browse available driveways near your destination on our interactive dark-mode map. Filter by price, distance, and availability.
                </p>
              </div>
              <div className="mt-6 h-32 rounded-xl overflow-hidden bg-[#064e3b]">
                <img src="https://images.unsplash.com/photo-1558798950-b05b143f435b?auto=format&fit=crop&w=400&q=60" alt="" className="w-full h-full object-cover opacity-60" />
              </div>
            </motion.div>
            {/* Top right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-8 card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center mb-6">
                <Timer size={24} weight="light" className="text-[#34d399]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3">Book Instantly</h3>
              <p className="text-slate-400 leading-relaxed font-light">
                2-tap checkout. Enter your plate, pay securely via Stripe, and you're set.
              </p>
            </motion.div>
            {/* Bottom right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-8 card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center mb-6">
                <Car size={24} weight="light" className="text-[#34d399]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3">Park & Go</h3>
              <p className="text-slate-400 leading-relaxed font-light">
                Get directions to your spot and enjoy worry-free parking. We handle the rest.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Host CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#064e3b]/40">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="uppercase text-xs tracking-[0.2em] text-[#34d399] font-medium mb-3">For homeowners</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Earn Money From Your Empty Driveway
            </h2>
            <p className="mt-6 text-base text-slate-400 leading-relaxed font-light max-w-lg">
              Turn your unused driveway into a revenue stream. Set your own prices, 
              control your availability, and earn while you're at home.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                'Set hourly or event rates',
                'Toggle availability instantly',
                'Receive 85% of every booking',
                'Real-time vehicle verification'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#34d399]/20 flex items-center justify-center flex-shrink-0">
                    <CaretRight size={12} weight="bold" className="text-[#34d399]" />
                  </div>
                  <span className="font-light">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register?role=host">
              <Button className="mt-8 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold text-base px-8 py-6 shadow-lg shadow-emerald-500/20 btn-active" data-testid="host-cta-btn">
                Start Hosting
              </Button>
            </Link>
          </div>
          <div className="relative">
            <div className="rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <img
                src="https://images.unsplash.com/photo-1653930534246-5156ebfeddc8?auto=format&fit=crop&w=800&q=80"
                alt="Aerial view of parking"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#022c22]/60 to-transparent rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="uppercase text-xs tracking-[0.2em] text-[#34d399] font-medium mb-3">FAQ</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight mb-12">
            Common Questions
          </h2>
          <div className="space-y-3">
            {[
              { q: 'How does pricing work?', a: 'Hosts set their own hourly and event rates. The Platform takes a 15% service fee and the Host receives 85% of each booking.' },
              { q: 'Is my vehicle safe?', a: 'All bookings include vehicle verification. Hosts can report violations for unauthorized vehicles, and our notification system keeps both parties informed.' },
              { q: 'What if I need to leave early?', a: 'You are free to leave at any time. Refunds for early departure are handled on a case-by-case basis.' },
              { q: 'How do Hosts get paid?', a: 'Payments are processed via Stripe. Hosts receive 85% of each booking amount after checkout.' },
              { q: 'Can I list multiple spots?', a: 'Absolutely! Hosts can list as many spots as they have available, each with its own pricing and description.' },
              { q: 'What does "Promote Your Spot" do?', a: 'Promoted spots appear first in search results and get a featured badge. Packages start at $5 for 24 hours.' }
            ].map((faq, i) => (
              <details key={i} className="group glass rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-5 list-none">
                  <div className="flex items-center gap-3">
                    <Question size={20} weight="light" className="text-[#34d399] flex-shrink-0" />
                    <span className="font-medium text-white text-sm sm:text-base">{faq.q}</span>
                  </div>
                  <CaretRight size={16} weight="bold" className="text-slate-500 transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 pl-12 text-slate-400 text-sm leading-relaxed font-light">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#34d399] flex items-center justify-center">
              <Car size={14} weight="bold" className="text-[#022c22]" />
            </div>
            <span className="font-heading font-bold text-white tracking-tight">Park-Pal</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-sm text-slate-500 hover:text-[#34d399] transition-colors" data-testid="footer-terms-link">Terms</Link>
            <Link to="/privacy" className="text-sm text-slate-500 hover:text-[#34d399] transition-colors" data-testid="footer-privacy-link">Privacy</Link>
          </div>
          <p className="text-slate-600 text-sm">&copy; {new Date().getFullYear()} Park-Pal</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
