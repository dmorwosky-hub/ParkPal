import { Link } from 'react-router-dom';
import { Car, ArrowLeft } from '@phosphor-icons/react';

const TermsPage = () => (
  <div className="min-h-screen bg-[#022c22]">
    <header className="glass border-b border-white/5 sticky top-0 z-50"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-3"><Link to="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#34d399] flex items-center justify-center"><Car size={14} weight="bold" className="text-[#022c22]" /></div><span className="font-heading font-bold text-white tracking-tight">Park-Pal</span></Link></div></header>
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#34d399] mb-8 transition-colors text-sm"><ArrowLeft size={16} /> Back to home</Link>
      <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight mb-2" data-testid="terms-heading">Terms of Service</h1>
      <p className="text-slate-500 mb-10 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <div className="glass rounded-xl p-6 sm:p-10 space-y-8 text-slate-300 leading-relaxed">
        {[
          ['1. Acceptance of Terms', 'By accessing Park-Pal, you agree to these Terms. Continued use constitutes acceptance of changes.'],
          ['2. Description of Service', 'Park-Pal is a peer-to-peer marketplace connecting homeowners ("Hosts") with drivers ("Guests") for parking. We facilitate discovery, booking, and payment.'],
          ['3. User Accounts', 'You must provide accurate information and maintain credential confidentiality. You are responsible for all activity under your account.'],
          ['4. Host Responsibilities', 'Hosts must only list spaces they\'re authorized to rent, provide accurate info, maintain safe spaces, comply with local laws, and accept the 85/15 revenue split.'],
          ['5. Guest Responsibilities', 'Guests must provide accurate vehicle info, vacate on time, not damage property, and park only the specified vehicle.'],
          ['6. Payments & Fees', 'All payments processed via Stripe. 15% platform fee deducted before Host payout. Promotion fees are non-refundable.'],
          ['7. Violations & Disputes', 'Hosts may report violations. Repeated violations may result in suspension. Disputes should be resolved directly first.'],
          ['8. Limitation of Liability', 'Park-Pal is a marketplace and is not liable for damages on listed spaces. Use at your own risk. Total liability capped at fees paid in 12 months.'],
          ['9. Termination', 'We may suspend accounts for violations, fraud, or harmful behavior. Upon termination, Platform access ceases immediately.'],
          ['10. Contact', 'Questions? Contact support@parkpal.com.'],
        ].map(([title, text]) => (
          <section key={title}><h2 className="font-heading text-lg font-bold text-white mb-2">{title}</h2><p className="text-slate-400 font-light">{text}</p></section>
        ))}
      </div>
    </main>
    <footer className="py-8 px-4 border-t border-white/5 mt-12"><div className="max-w-4xl mx-auto text-center text-slate-600 text-sm">&copy; {new Date().getFullYear()} Park-Pal</div></footer>
  </div>
);

export default TermsPage;
