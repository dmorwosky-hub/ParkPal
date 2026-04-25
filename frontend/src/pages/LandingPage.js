import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, Car, CurrencyDollar, Timer, CaretRight, Question, Lightning, ShieldCheck } from '@phosphor-icons/react';

/* Inline SVG line-art components */
const HeroLineArt = () => (
  <svg viewBox="0 0 800 500" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" className="absolute inset-0 w-full h-full">
    {/* House outline */}
    <path d="M300 350 L300 200 L400 130 L500 200 L500 350 Z" />
    <path d="M350 350 L350 270 L450 270 L450 350" />
    <path d="M400 130 L400 90" />
    {/* Driveway */}
    <path d="M320 350 L280 480 L520 480 L480 350" strokeDasharray="4 4" />
    {/* Car outline */}
    <path d="M340 430 L340 410 Q340 400 350 400 L450 400 Q460 400 460 410 L460 430 Z" />
    <path d="M350 400 L360 380 L440 380 L450 400" />
    <circle cx="365" cy="435" r="10" />
    <circle cx="435" cy="435" r="10" />
    {/* Measurement lines */}
    <path d="M270 200 L270 350" strokeDasharray="2 6" stroke="rgba(223,255,0,0.08)" />
    <path d="M530 200 L530 350" strokeDasharray="2 6" stroke="rgba(223,255,0,0.08)" />
    <path d="M270 200 L280 200 M270 350 L280 350" stroke="rgba(223,255,0,0.08)" />
    <path d="M530 200 L520 200 M530 350 L520 350" stroke="rgba(223,255,0,0.08)" />
    {/* Grid reference marks */}
    <path d="M100 250 L150 250" strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" />
    <path d="M650 300 L700 300" strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" />
    <path d="M400 50 L400 80" strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" />
    {/* Corner marks */}
    <path d="M50 50 L80 50 M50 50 L50 80" stroke="rgba(223,255,0,0.1)" strokeWidth="1" />
    <path d="M750 50 L720 50 M750 50 L750 80" stroke="rgba(223,255,0,0.1)" strokeWidth="1" />
    <path d="M50 450 L80 450 M50 450 L50 420" stroke="rgba(223,255,0,0.1)" strokeWidth="1" />
    <path d="M750 450 L720 450 M750 450 L750 420" stroke="rgba(223,255,0,0.1)" strokeWidth="1" />
  </svg>
);

const ParkingGridArt = () => (
  <svg viewBox="0 0 600 300" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.7" className="absolute inset-0 w-full h-full">
    {/* Parking spaces */}
    {[0,1,2,3,4,5].map(i => (
      <g key={i}>
        <rect x={60 + i * 85} y={80} width={70} height={140} strokeDasharray={i === 2 ? "none" : "3 3"} stroke={i === 2 ? "rgba(223,255,0,0.12)" : "rgba(255,255,255,0.04)"} />
        <text x={95 + i * 85} y={160} fill={i === 2 ? "rgba(223,255,0,0.15)" : "rgba(255,255,255,0.04)"} fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">{`P${i+1}`}</text>
      </g>
    ))}
    {/* Road lines */}
    <path d="M40 250 L560 250" strokeDasharray="12 8" stroke="rgba(255,255,255,0.04)" />
    <path d="M40 50 L560 50" stroke="rgba(255,255,255,0.03)" />
  </svg>
);

const LOGO = "/logo.png";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#121212] bg-grid">
      {/* Nav — flat, sharp, 1px bottom border */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/90 backdrop-blur-sm" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Park Pal" className="h-10" />
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="text-white/50 hover:text-white rounded-none font-mono text-xs uppercase tracking-wider h-8" data-testid="header-login-btn">Log in</Button>
            </Link>
            <Link to="/register">
              <Button className="btn-neon rounded-none h-8 px-4 font-mono text-xs uppercase tracking-wider" data-testid="header-register-btn">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — massive technical typography + line art */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <HeroLineArt />
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[10px] text-[#DFFF00]/40 uppercase tracking-[0.5em] mb-10"
          >
            // peer-to-peer parking protocol
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-5xl sm:text-7xl lg:text-[7rem] text-white leading-[0.85] tracking-[-0.05em]"
          >
            <span className="font-light text-white/40">Your Driveway.</span>
            <br />
            <span className="font-bold text-[#DFFF00]">Their Parking.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-8 font-mono text-xs sm:text-sm text-white/30 max-w-md mx-auto leading-relaxed"
          >
            Rent out your empty driveway or find safe, affordable parking near events. Instant checkout via Stripe.
          </motion.p>

          {/* Floating search — sharp edges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 max-w-lg mx-auto"
          >
            <div className="p-[1px]" style={{ background: 'rgba(223,255,0,0.15)' }}>
              <div className="bg-[#1a1a1a] p-2 flex gap-2">
                <Link to="/register?role=guest" className="flex-1">
                  <Button className="w-full h-12 btn-neon rounded-none font-mono text-xs uppercase tracking-wider" data-testid="hero-find-parking-btn">
                    <MapPin size={14} weight="bold" className="mr-2" />Find Parking
                  </Button>
                </Link>
                <Link to="/register?role=host" className="flex-1">
                  <Button className="w-full h-12 bg-transparent text-white/60 hover:text-white hover:bg-white/[0.03] rounded-none font-mono text-xs uppercase tracking-wider" style={{ border: '1px solid rgba(255,255,255,0.08)' }} data-testid="hero-list-spot-btn">
                    <CurrencyDollar size={14} weight="bold" className="mr-2" />List Your Spot
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats — mono data, sharp dividers */}
      <section className="py-16 px-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { value: '85%', label: 'HOST_PAYOUT' },
            { value: '2-TAP', label: 'CHECKOUT' },
            { value: '24/7', label: 'UPTIME' },
            { value: '$0', label: 'LIST_FEE' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center py-6"
              style={i < 3 ? { borderRight: '1px solid rgba(255,255,255,0.04)' } : {}}
            >
              <p className="data-value text-2xl sm:text-3xl text-[#DFFF00]">{stat.value}</p>
              <p className="font-mono text-[10px] text-white/20 mt-2 tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bento Grid — asymmetrical, different charcoal shades */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="font-mono text-[10px] text-[#DFFF00]/30 uppercase tracking-[0.4em] mb-3">// how_it_works</div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-[-0.04em] mb-16 leading-[0.9]">
            Three steps.<br /><span className="text-white/15">Zero hassle.</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-white/[0.04]">
            {/* Large card — 2/3 with parking grid art */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 bg-[#161616] p-10 min-h-[360px] relative overflow-hidden"
            >
              <ParkingGridArt />
              <div className="relative z-10">
                <div className="w-10 h-10 flex items-center justify-center mb-8" style={{ border: '1px solid rgba(223,255,0,0.2)' }}>
                  <MapPin size={20} weight="light" className="text-[#DFFF00]" />
                </div>
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">Find a Spot</h3>
                <p className="text-white/25 leading-relaxed text-sm max-w-md">
                  Browse available driveways on our dark-mode map. Filter by price, distance, and real-time availability. Neon pins mark open spots near you.
                </p>
                <Link to="/register?role=guest">
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-[#DFFF00]/60 hover:text-[#DFFF00] mt-8 uppercase tracking-wider cursor-pointer transition-colors">
                    explore_map <CaretRight size={12} weight="bold" />
                  </span>
                </Link>
              </div>
            </motion.div>

            {/* Right column — 2 stacked */}
            <div className="flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex-1 bg-[#1a1a1a] p-8"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="w-10 h-10 flex items-center justify-center mb-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Timer size={20} weight="light" className="text-white/40" />
                </div>
                <h3 className="font-heading text-lg font-bold text-white mb-2 tracking-tight">Book Instantly</h3>
                <p className="text-white/20 leading-relaxed text-sm">2-tap checkout. Enter plate, pay via Stripe, done.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex-1 bg-[#141414] p-8"
              >
                <div className="w-10 h-10 flex items-center justify-center mb-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Car size={20} weight="light" className="text-white/40" />
                </div>
                <h3 className="font-heading text-lg font-bold text-white mb-2 tracking-tight">Park & Go</h3>
                <p className="text-white/20 leading-relaxed text-sm">Get directions. Park worry-free. We handle the rest.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Host CTA — flat, architectural */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="font-mono text-[10px] text-[#DFFF00]/30 uppercase tracking-[0.4em] mb-3">// for_homeowners</div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white tracking-[-0.04em] leading-[0.9]">
              <span className="font-light text-white/30">Earn Money From</span><br />
              <span className="font-bold">Your Empty Driveway</span>
            </h2>
            <p className="mt-6 font-mono text-xs text-white/20 leading-relaxed max-w-md">
              Turn unused space into revenue. Set prices, control availability, earn while you're home.
            </p>
            <div className="mt-10 space-y-0">
              {[
                { icon: CurrencyDollar, text: 'Set hourly or event rates' },
                { icon: Lightning, text: 'Toggle availability instantly' },
                { icon: ShieldCheck, text: 'Receive 85% of every booking' },
                { icon: Car, text: 'Real-time vehicle verification' }
              ].map(({ icon: Icon, text }, i) => (
                <div key={text} className="flex items-center gap-3 py-3" style={i < 3 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                  <Icon size={14} weight="light" className="text-[#DFFF00]/40" />
                  <span className="text-white/40 text-sm">{text}</span>
                </div>
              ))}
            </div>
            <Link to="/register?role=host">
              <Button className="mt-10 btn-neon rounded-none h-12 px-8 font-mono text-xs uppercase tracking-wider" data-testid="host-cta-btn">
                Start Hosting
              </Button>
            </Link>
          </div>
          {/* Line art illustration instead of photo */}
          <div className="relative h-[400px]" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
            <svg viewBox="0 0 500 400" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.7" className="w-full h-full p-8">
              {/* House */}
              <path d="M150 300 L150 180 L250 120 L350 180 L350 300 Z" />
              <path d="M200 300 L200 230 L300 230 L300 300" />
              <path d="M250 120 L250 90" />
              <path d="M170 220 L190 220 L190 240 L170 240 Z" />
              <path d="M310 220 L330 220 L330 240 L310 240 Z" />
              {/* Driveway with car */}
              <path d="M180 300 L140 380 L360 380 L320 300" strokeDasharray="4 4" stroke="rgba(223,255,0,0.12)" />
              {/* Car */}
              <path d="M200 360 Q200 345 215 345 L285 345 Q300 345 300 360 L300 370 L200 370 Z" stroke="rgba(223,255,0,0.2)" />
              <path d="M215 345 L225 325 L275 325 L285 345" stroke="rgba(223,255,0,0.2)" />
              <circle cx="225" cy="373" r="7" stroke="rgba(223,255,0,0.15)" />
              <circle cx="275" cy="373" r="7" stroke="rgba(223,255,0,0.15)" />
              {/* Dollar signs floating */}
              <text x="380" y="180" fill="rgba(223,255,0,0.1)" fontSize="24" fontFamily="JetBrains Mono">$</text>
              <text x="400" y="230" fill="rgba(223,255,0,0.06)" fontSize="18" fontFamily="JetBrains Mono">$</text>
              <text x="100" y="160" fill="rgba(223,255,0,0.06)" fontSize="16" fontFamily="JetBrains Mono">$</text>
              {/* Corner marks */}
              <path d="M20 20 L50 20 M20 20 L20 50" stroke="rgba(223,255,0,0.08)" strokeWidth="1" />
              <path d="M480 20 L450 20 M480 20 L480 50" stroke="rgba(223,255,0,0.08)" strokeWidth="1" />
              <path d="M20 380 L50 380 M20 380 L20 350" stroke="rgba(223,255,0,0.08)" strokeWidth="1" />
              <path d="M480 380 L450 380 M480 380 L480 350" stroke="rgba(223,255,0,0.08)" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ — flat, no rounded anything */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="font-mono text-[10px] text-[#DFFF00]/30 uppercase tracking-[0.4em] mb-3">// faq</div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-[-0.04em] mb-14">Common Questions</h2>
          <div className="space-y-0">
            {[
              { q: 'How does pricing work?', a: 'Hosts set their own rates. Platform takes 15% service fee, Host receives 85%.' },
              { q: 'Is my vehicle safe?', a: 'All bookings include vehicle verification. Hosts can report violations. Notifications keep both parties informed.' },
              { q: 'How do Hosts get paid?', a: 'Payments via Stripe. Hosts receive 85% after checkout.' },
              { q: 'Can I list multiple spots?', a: 'Yes. Each spot gets its own pricing, description, and availability.' },
              { q: 'What does promoting a spot do?', a: 'Featured placement + glowing badge on map. From $5/24hrs.' }
            ].map((faq, i) => (
              <details key={i} className="group" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <summary className="flex items-center justify-between cursor-pointer py-5 list-none select-none">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[#DFFF00]/20">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-medium text-white/60 text-sm">{faq.q}</span>
                  </div>
                  <CaretRight size={12} weight="bold" className="text-white/10 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="pb-5 pl-9 font-mono text-xs text-white/20 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — minimal */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Park Pal" className="h-5" />
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="font-mono text-[10px] text-white/15 hover:text-[#DFFF00]/50 transition-colors uppercase tracking-wider" data-testid="footer-terms-link">Terms</Link>
            <Link to="/privacy" className="font-mono text-[10px] text-white/15 hover:text-[#DFFF00]/50 transition-colors uppercase tracking-wider" data-testid="footer-privacy-link">Privacy</Link>
          </div>
          <p className="font-mono text-[10px] text-white/10">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
