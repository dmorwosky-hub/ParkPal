import { Link } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#ECF0F1]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E67E22] flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-[#34495E]" style={{ fontFamily: 'Montserrat' }}>Park-Pal</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-[#34495E] hover:text-[#E67E22] mb-8 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#34495E] mb-2" style={{ fontFamily: 'Montserrat' }} data-testid="terms-heading">
          Terms of Service
        </h1>
        <p className="text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 text-[#34495E] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>1. Acceptance of Terms</h2>
            <p className="text-slate-600">
              By accessing or using Park-Pal ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform. Park-Pal reserves the right to update these terms at any time, and continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>2. Description of Service</h2>
            <p className="text-slate-600">
              Park-Pal is a peer-to-peer marketplace that connects homeowners ("Hosts") who have available driveway or parking space with drivers ("Guests") seeking parking. The Platform facilitates discovery, booking, and payment between Hosts and Guests. Park-Pal is not a parking company and does not own or operate parking facilities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>3. User Accounts</h2>
            <p className="text-slate-600 mb-3">To use Park-Pal, you must create an account and provide accurate information. You are responsible for:</p>
            <ul className="list-disc ml-6 text-slate-600 space-y-1">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring that all information provided is accurate and current</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>4. Host Responsibilities</h2>
            <p className="text-slate-600 mb-3">As a Host, you agree to:</p>
            <ul className="list-disc ml-6 text-slate-600 space-y-1">
              <li>Only list parking spaces you are legally authorized to rent</li>
              <li>Provide accurate descriptions, location, and pricing information</li>
              <li>Maintain a safe and accessible parking space</li>
              <li>Comply with all local laws, zoning regulations, and HOA rules</li>
              <li>Accept the Platform's 85/15 revenue split (85% Host, 15% Platform fee)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>5. Guest Responsibilities</h2>
            <p className="text-slate-600 mb-3">As a Guest, you agree to:</p>
            <ul className="list-disc ml-6 text-slate-600 space-y-1">
              <li>Provide accurate vehicle information when booking</li>
              <li>Vacate the parking space by the end of your booking period</li>
              <li>Not damage the Host's property or surrounding area</li>
              <li>Comply with any reasonable instructions provided by the Host</li>
              <li>Park only the vehicle specified in the booking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>6. Payments & Fees</h2>
            <p className="text-slate-600">
              All payments are processed securely through Stripe. The Platform charges a 15% service fee on each booking, deducted before Host payouts. Promotion fees are non-refundable. Refund requests for bookings must be submitted within 24 hours and are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>7. Violations & Disputes</h2>
            <p className="text-slate-600">
              Hosts may report violations (overstaying, unauthorized vehicles) through the Platform. Park-Pal will review reported violations and may suspend accounts with repeated violations. Disputes between Hosts and Guests should first be attempted to resolve directly, with Park-Pal mediating if necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>8. Limitation of Liability</h2>
            <p className="text-slate-600">
              Park-Pal is a marketplace platform and is not liable for any damages, theft, injury, or losses that occur on or near listed parking spaces. Users acknowledge that they use the Platform at their own risk. Park-Pal's total liability shall not exceed the amount of fees paid by you in the preceding 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>9. Termination</h2>
            <p className="text-slate-600">
              Park-Pal reserves the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any behavior deemed harmful to the community. Upon termination, your right to use the Platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>10. Contact</h2>
            <p className="text-slate-600">
              For questions about these Terms of Service, please contact us at <span className="text-[#E67E22] font-medium">support@parkpal.com</span>.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 px-4 bg-white border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Park-Pal. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
