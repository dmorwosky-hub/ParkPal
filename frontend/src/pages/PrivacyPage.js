import { Link } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
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

        <h1 className="text-3xl sm:text-4xl font-bold text-[#34495E] mb-2" style={{ fontFamily: 'Montserrat' }} data-testid="privacy-heading">
          Privacy Policy
        </h1>
        <p className="text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 text-[#34495E] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>1. Information We Collect</h2>
            <p className="text-slate-600 mb-3">We collect the following types of information when you use Park-Pal:</p>
            <ul className="list-disc ml-6 text-slate-600 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, and password when you register</li>
              <li><strong>Booking Information:</strong> Vehicle details (make, model, license plate), booking duration, and payment information</li>
              <li><strong>Location Data:</strong> Parking spot addresses and coordinates provided by Hosts</li>
              <li><strong>Usage Data:</strong> How you interact with the Platform, including pages visited and features used</li>
              <li><strong>Payment Data:</strong> Transaction amounts and Stripe payment identifiers (we do not store full card numbers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>2. How We Use Your Information</h2>
            <p className="text-slate-600 mb-3">We use collected information to:</p>
            <ul className="list-disc ml-6 text-slate-600 space-y-1">
              <li>Provide and improve the Park-Pal marketplace</li>
              <li>Process bookings and payments between Hosts and Guests</li>
              <li>Send booking confirmations and notifications</li>
              <li>Facilitate violation reporting and dispute resolution</li>
              <li>Analyze usage patterns to improve the user experience</li>
              <li>Communicate important service updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>3. Information Sharing</h2>
            <p className="text-slate-600 mb-3">We share your information only in the following circumstances:</p>
            <ul className="list-disc ml-6 text-slate-600 space-y-1">
              <li><strong>Between Users:</strong> Hosts see Guest names and vehicle details for confirmed bookings. Guests see Host names and spot locations.</li>
              <li><strong>Payment Processing:</strong> Stripe processes all payments and receives necessary transaction data.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or to protect our rights.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, user data may be transferred.</li>
            </ul>
            <p className="text-slate-600 mt-3">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>4. Data Security</h2>
            <p className="text-slate-600">
              We implement industry-standard security measures to protect your information. Passwords are hashed using bcrypt. All data transmissions are encrypted via HTTPS. Payment processing is handled by Stripe, a PCI-DSS compliant payment processor. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>5. Data Retention</h2>
            <p className="text-slate-600">
              We retain your account information for as long as your account is active. Booking records are retained for accounting and dispute resolution purposes. You may request account deletion by contacting our support team, after which your personal data will be removed within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>6. Cookies & Tracking</h2>
            <p className="text-slate-600">
              Park-Pal uses local storage to maintain your login session. We use essential cookies for platform functionality. We do not use third-party advertising trackers. Map tiles are loaded from OpenStreetMap, which has its own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>7. Your Rights</h2>
            <p className="text-slate-600 mb-3">You have the right to:</p>
            <ul className="list-disc ml-6 text-slate-600 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of non-essential communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>8. Children's Privacy</h2>
            <p className="text-slate-600">
              Park-Pal is not intended for users under the age of 18. We do not knowingly collect information from children. If we discover that a user is under 18, we will promptly delete their account and associated data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>9. Changes to This Policy</h2>
            <p className="text-slate-600">
              We may update this Privacy Policy periodically. We will notify registered users of material changes via email or in-app notification. The "Last updated" date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Montserrat' }}>10. Contact Us</h2>
            <p className="text-slate-600">
              For privacy-related inquiries, data requests, or concerns, please contact us at <span className="text-[#E67E22] font-medium">privacy@parkpal.com</span>.
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

export default PrivacyPage;
