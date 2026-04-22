import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, Car, CurrencyDollar, Timer, CaretRight, Question, Lightning, ShieldCheck } from '@phosphor-icons/react';

const HERO_IMG = "https://customer-assets.emergentagent.com/job_dda2a2e5-addf-4640-ac60-5e5f3f527caf/artifacts/r5h4h5hy_Gemini_Generated_Image_ri4iidri4iidri4i.png";
const MAP_PREVIEW = "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/12/702/1635.png";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#022c22] overflow-x-hidden">
      {/* Nav — heavy glassmorphism, no borders */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(2, 44, 34, 0.6)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#34d399] flex items-center justify-center shadow-[0_0_16px_rgba(52,211,153,0.3)]">
              <Car size={18} weight="bold" className="text-[#022c22]" />
            </div>
            <span className="font-heading font-bold text-xl text-white tracking-tight">Park-Pal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium" data-testid="header-login-btn">Log in</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold shadow-[0_0_20px_rgba(52,211,153,0.25)] btn-active" data-testid="header-register-btn">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — massive typography, variable weight */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Aerial view of house with driveway" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#022c22]/80 via-[#022c22]/40 to-[#022c22]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="uppercase text-[10px] sm:text-xs tracking-[0.3em] text-[#34d399]/80 font-medium mb-8"
          >
            Peer-to-peer parking marketplace
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading text-5xl sm:text-7xl lg:text-[6.5rem] text-white leading-[0.9] tracking-[-0.04em]"
          >
            <span className="font-extralight">Your Driveway.</span>
            <br />
            <span className="font-black text-[#34d399]">Their Parking.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 text-base sm:text-lg text-white/50 max-w-md mx-auto leading-relaxed font-light"
          >
            Rent out your empty driveway or find safe, affordable parking near events. Instant checkout.
          </motion.p>
        </div>

        {/* Floating Search — bridges hero and next section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 w-full max-w-xl px-4"
        >
          <div className="rounded-2xl p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.5)]" style={{ background: 'rgba(6, 78, 59, 0.7)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
            <div className="flex gap-2">
              <Link to="/register?role=guest" className="flex-1">
                <Button className="w-full h-14 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold text-base shadow-[0_0_20px_rgba(52,211,153,0.25)] btn-active" data-testid="hero-find-parking-btn">
                  <MapPin size={20} weight="bold" className="mr-2" />Find Parking
                </Button>
              </Link>
              <Link to="/register?role=host" className="flex-1">
                <Button className="w-full h-14 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl font-semibold text-base backdrop-blur-sm" data-testid="hero-list-spot-btn">
                  <CurrencyDollar size={20} weight="bold" className="mr-2" />List Your Spot
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats — no borders, inner glow separators */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { value: '85%', label: 'Host Payout' },
            { value: '2-Tap', label: 'Checkout' },
            { value: '24/7', label: 'Availability' },
            { value: '$0', label: 'To List' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`text-center py-6 ${i < 3 ? 'md:border-r md:border-white/[0.04]' : ''}`}
            >
              <p className="font-heading text-3xl sm:text-4xl font-black text-[#34d399] tracking-tight">{stat.value}</p>
              <p className="text-white/40 text-xs mt-1.5 tracking-wide uppercase">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bento Grid — How It Works — with map preview background */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="uppercase text-[10px] tracking-[0.3em] text-[#34d399]/60 font-medium mb-3">How it works</p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-[-0.03em] mb-14 leading-[0.95]">
            Three steps.<br /><span className="text-white/30">Zero hassle.</span>
          </h2>

          {/* Bento: 2/3 + 1/3 stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Large card — 2/3 width — with map preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[340px] group"
              style={{ background: 'rgba(6, 78, 59, 0.35)', backdropFilter: 'blur(20px)' }}
            >
              {/* Static dark map preview as background */}
              <div className="absolute inset-0 opacity-[0.15] group-hover:opacity-[0.22] transition-opacity duration-700">
                <div className="w-full h-full" style={{
                  backgroundImage: `url(${MAP_PREVIEW})`,
                  backgroundSize: '256px',
                  backgroundRepeat: 'repeat',
                  filter: 'brightness(0.8)'
                }} />
              </div>
              {/* Glowing pin dots */}
              <div className="absolute top-[30%] left-[25%] w-3 h-3 rounded-full bg-[#34d399] shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse" />
              <div className="absolute top-[50%] left-[55%] w-3 h-3 rounded-full bg-[#34d399] shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute top-[65%] left-[40%] w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-[25%] right-[20%] w-3 h-3 rounded-full bg-[#34d399] shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse" style={{ animationDelay: '1.5s' }} />

              <div className="relative z-10 p-10 flex flex-col justify-between h-full">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-[#34d399]/10 shadow-[inset_0_0_20px_rgba(52,211,153,0.1)] flex items-center justify-center mb-8">
                    <MapPin size={28} weight="light" className="text-[#34d399]" />
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">Find a Spot</h3>
                  <p className="text-white/40 leading-relaxed font-light max-w-md text-sm sm:text-base">
                    Browse available driveways on our interactive dark-mode map. Filter by price, distance, and real-time availability. Glowing pins show open spots near you.
                  </p>
                </div>
                <div className="mt-8">
                  <Link to="/register?role=guest">
                    <span className="text-[#34d399] text-sm font-medium hover:text-[#6ee7b7] transition-colors cursor-pointer inline-flex items-center gap-1">
                      Explore the map <CaretRight size={14} weight="bold" />
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Right column — 1/3 width, 2 stacked cards */}
            <div className="flex flex-col gap-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex-1 rounded-2xl p-8 card-hover"
                style={{ background: 'rgba(4, 60, 45, 0.5)', backdropFilter: 'blur(20px)' }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#34d399]/10 shadow-[inset_0_0_16px_rgba(52,211,153,0.08)] flex items-center justify-center mb-5">
                  <Timer size={24} weight="light" className="text-[#34d399]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-2 tracking-tight">Book Instantly</h3>
                <p className="text-white/35 leading-relaxed font-light text-sm">
                  2-tap checkout. Enter your plate, pay via Stripe, done. No back-and-forth.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex-1 rounded-2xl p-8 card-hover"
                style={{ background: 'rgba(2, 44, 34, 0.8)', backdropFilter: 'blur(20px)' }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#34d399]/10 shadow-[inset_0_0_16px_rgba(52,211,153,0.08)] flex items-center justify-center mb-5">
                  <Car size={24} weight="light" className="text-[#34d399]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-2 tracking-tight">Park & Go</h3>
                <p className="text-white/35 leading-relaxed font-light text-sm">
                  Get turn-by-turn directions. Park worry-free. We handle the rest.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Host CTA — no borders, gradient bg shift */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b]/30 to-[#022c22]" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <p className="uppercase text-[10px] tracking-[0.3em] text-[#34d399]/60 font-medium mb-3">For homeowners</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white tracking-[-0.03em] leading-[0.95]">
              <span className="font-extralight">Earn Money From</span><br />
              <span className="font-black">Your Empty Driveway</span>
            </h2>
            <p className="mt-6 text-base text-white/35 leading-relaxed font-light max-w-lg">
              Turn your unused driveway into a revenue stream. Set your own prices, 
              control availability, earn while you're at home.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { icon: CurrencyDollar, text: 'Set hourly or event rates' },
                { icon: Lightning, text: 'Toggle availability instantly' },
                { icon: ShieldCheck, text: 'Receive 85% of every booking' },
                { icon: Car, text: 'Real-time vehicle verification' }
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#34d399]/[0.07] shadow-[inset_0_0_12px_rgba(52,211,153,0.06)] flex items-center justify-center flex-shrink-0">
                    <Icon size={16} weight="light" className="text-[#34d399]" />
                  </div>
                  <span className="text-white/60 font-light text-sm">{text}</span>
                </div>
              ))}
            </div>
            <Link to="/register?role=host">
              <Button className="mt-10 bg-[#34d399] hover:bg-[#6ee7b7] text-[#022c22] rounded-xl font-semibold text-base px-8 py-6 shadow-[0_0_24px_rgba(52,211,153,0.2)] btn-active" data-testid="host-cta-btn">
                Start Hosting
              </Button>
            </Link>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
              <img
                src="https://images.unsplash.com/photo-1653930534246-5156ebfeddc8?auto=format&fit=crop&w=800&q=80"
                alt="Aerial view of parking"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#022c22]/70 via-transparent to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — no borders, inner glow cards */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="uppercase text-[10px] tracking-[0.3em] text-[#34d399]/60 font-medium mb-3">FAQ</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-[-0.03em] mb-14">
            Common Questions
          </h2>
          <div className="space-y-2">
            {[
              { q: 'How does pricing work?', a: 'Hosts set their own hourly and event rates. The Platform takes a 15% service fee and the Host receives 85% of each booking.' },
              { q: 'Is my vehicle safe?', a: 'All bookings include vehicle verification. Hosts can report violations for unauthorized vehicles, and notifications keep both parties informed.' },
              { q: 'How do Hosts get paid?', a: 'Payments are processed via Stripe. Hosts receive 85% of each booking amount after checkout completes.' },
              { q: 'Can I list multiple spots?', a: 'Yes! List as many spots as you have, each with its own pricing, description, and availability schedule.' },
              { q: 'What does promoting a spot do?', a: 'Promoted spots appear first in search and get a glowing featured badge on the map. Starts at $5 for 24 hours.' }
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl overflow-hidden" style={{ background: 'rgba(6, 78, 59, 0.2)' }}>
                <summary className="flex items-center justify-between cursor-pointer p-5 list-none select-none">
                  <div className="flex items-center gap-3">
                    <Question size={18} weight="light" className="text-[#34d399]/50 flex-shrink-0" />
                    <span className="font-medium text-white/80 text-sm sm:text-base">{faq.q}</span>
                  </div>
                  <CaretRight size={14} weight="bold" className="text-white/20 transition-transform duration-300 group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 pl-12 text-white/30 text-sm leading-relaxed font-light">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — subtle, no hard borders */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(2, 44, 34, 0.5)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#34d399] flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.2)]">
              <Car size={12} weight="bold" className="text-[#022c22]" />
            </div>
            <span className="font-heading font-bold text-white/60 tracking-tight text-sm">Park-Pal</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-xs text-white/20 hover:text-[#34d399] transition-colors" data-testid="footer-terms-link">Terms</Link>
            <Link to="/privacy" className="text-xs text-white/20 hover:text-[#34d399] transition-colors" data-testid="footer-privacy-link">Privacy</Link>
          </div>
          <p className="text-white/15 text-xs">&copy; {new Date().getFullYear()} Park-Pal</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
