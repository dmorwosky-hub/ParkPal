import { Link } from 'react-router-dom';
import { Car, ArrowLeft } from '@phosphor-icons/react';

const PrivacyPage = () => (
  <div className="min-h-screen bg-[#022c22]">
    <header className="glass border-b border-white/5 sticky top-0 z-50"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-3"><Link to="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#34d399] flex items-center justify-center"><Car size={14} weight="bold" className="text-[#022c22]" /></div><span className="font-heading font-bold text-white tracking-tight">Park-Pal</span></Link></div></header>
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#34d399] mb-8 transition-colors text-sm"><ArrowLeft size={16} /> Back to home</Link>
      <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight mb-2" data-testid="privacy-heading">Privacy Policy</h1>
      <p className="text-slate-500 mb-10 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <div className="glass rounded-xl p-6 sm:p-10 space-y-8 text-slate-300 leading-relaxed">
        {[
          ['1. Information We Collect', 'Account info (name, email, password), booking details (vehicle, duration, payment), location data, usage data, and Stripe payment identifiers.'],
          ['2. How We Use It', 'To provide the marketplace, process bookings, send notifications, resolve disputes, analyze usage, and communicate updates.'],
          ['3. Information Sharing', 'Between users (names, vehicle details for bookings), with Stripe for payments, for legal compliance, and in business transfers. We never sell your data.'],
          ['4. Data Security', 'Passwords hashed with bcrypt. All transmissions encrypted via HTTPS. Payments handled by PCI-DSS compliant Stripe.'],
          ['5. Data Retention', 'Account data retained while active. Booking records kept for accounting. Request deletion via support — processed within 30 days.'],
          ['6. Cookies & Tracking', 'We use local storage for sessions. Essential cookies only. No third-party ad trackers. Map tiles from OpenStreetMap.'],
          ['7. Your Rights', 'Access, correct, delete your data. Opt out of non-essential comms. Export data in portable format.'],
          ['8. Children\'s Privacy', 'Not intended for users under 18. We delete underage accounts promptly upon discovery.'],
          ['9. Changes', 'We notify users of material changes via email or in-app notification. Check the "Last updated" date.'],
          ['10. Contact', 'Privacy inquiries: privacy@parkpal.com.'],
        ].map(([title, text]) => (
          <section key={title}><h2 className="font-heading text-lg font-bold text-white mb-2">{title}</h2><p className="text-slate-400 font-light">{text}</p></section>
        ))}
      </div>
    </main>
    <footer className="py-8 px-4 border-t border-white/5 mt-12"><div className="max-w-4xl mx-auto text-center text-slate-600 text-sm">&copy; {new Date().getFullYear()} Park-Pal</div></footer>
  </div>
);

export default PrivacyPage;
