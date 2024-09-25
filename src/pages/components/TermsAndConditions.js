import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const TermsAndConditions = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By using the TicketFlix app, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">2. User Accounts</h2>
            <p>To use certain features of the app, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">3. Ticket Booking</h2>
            <p>Once a ticket is successfully booked, you will receive an electronic ticket that must be presented at the theater. Booking is subject to seat availability, and we will notify you of any issues during the booking process.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Pre-Booking of Tickets</h2>
            <p>Pre-booking is available for upcoming movies. However, it does not guarantee seat allocation. Seats will be allocated based on availability at the time of the movie release or final booking. If seats are unavailable in your preferred theaters, you will be notified, and the pre-booked amount will be refunded to your app wallet.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Payment and Refund Policy</h2>
            <p>All payments must be made through the integrated payment gateway. In case of failed payments or cancellations, refunds will be processed to your app wallet within 5-7 business days. We do not support direct refunds to bank accounts or credit cards.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">6. Coupons and Discounts</h2>
            <p>Coupons provided by TicketFlix can be redeemed during payment. Once redeemed, coupons are non-transferable and cannot be reused. We reserve the right to revoke or cancel any coupon in case of misuse or fraudulent activity.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">7. Cancellation Policy</h2>
            <p>You may cancel bookings within the cancellation window, subject to theater policies. Refunds for cancellations will be issued to your app wallet only.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">8. User Responsibilities</h2>
            <p>You must ensure that the contact details provided during booking or pre-booking are accurate. We are not responsible for issues arising from incorrect contact information or miscommunication.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">9. App Wallet Usage</h2>
            <p>The app wallet is a secure virtual wallet within TicketFlix where refunds and credit balances are stored. Wallet balance can only be used for bookings or purchases within the app and cannot be withdrawn or transferred to external accounts.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">10. Theater and Movie Availability</h2>
            <p>Movie schedules, theater availability, and seat allocations are subject to change. TicketFlix is not liable for any changes or cancellations made by theaters or distributors. We will notify you of any changes in theater allocation or movie schedules.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">11. Intellectual Property</h2>
            <p>All content and materials available on TicketFlix, including but not limited to text, graphics, website name, code, images and logos are the intellectual property of TicketFlix and are protected by applicable copyright and trademark law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">12. Limitation of Liability</h2>
            <p>TicketFlix is not responsible for any issues arising from theater operations, including but not limited to show cancellations, technical errors, or disputes regarding seating arrangements. Our liability is limited to the amount paid for the ticket through our app.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">13. Modifications to the Service</h2>
            <p>We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice. You agree that we will not be liable to you or to any third party for any modification, suspension or discontinuance of the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">14. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">15. Changes to Terms</h2>
            <p>We reserve the right to update or change these terms and conditions at any time without prior notice. Your continued use of the service after we post any modifications to the Terms on this page will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">16. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at [Your Contact Information].</p>
          </section>
        </div>
        <div className="mt-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800">Back to Home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;