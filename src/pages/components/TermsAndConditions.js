import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const TermsAndConditions = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Terms and Conditions</h1>
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using the TicketFlix app, you acknowledge that you have read, understood, and agree to abide by these Terms and Conditions. If you do not consent to these terms, you should discontinue using our services immediately.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">2. User Accounts</h2>
            <p>To unlock certain features of the app, you will need to register and create an account. It is your responsibility to protect the confidentiality of your login credentials. Any actions taken using your account are your responsibility.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">3. Ticket Booking</h2>
            <p>Once a ticket is successfully booked, an electronic ticket will be sent to your registered email and must be presented at the theater. Please note that bookings are subject to seat availability, and we will inform you of any issues during the booking process.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Pre-Booking of Tickets</h2>
            <p>Pre-booking tickets for upcoming movies is available, but it does not guarantee specific seat allocation. Seat assignment will depend on availability at the time of the movie release. If your preferred seats are not available, we will notify you, and the pre-booked amount will be credited to your app wallet.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Payment and Refund Policy</h2>
            <p>All payments must be completed through the integrated payment gateway. In the event of a failed transaction or cancellation, refunds will be credited to your app wallet within 5-7 business days. Direct refunds to bank accounts or credit cards are not supported.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">6. Coupons and Discounts</h2>
            <p>TicketFlix provides promotional coupons, which can be redeemed at the time of booking. Once applied, these coupons cannot be transferred or reused. In cases of fraudulent usage, we reserve the right to revoke or cancel the coupon.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">7. Cancellation Policy</h2>
            <p>You may cancel your booking within the allowed cancellation window, subject to theater-specific policies. Refunds for canceled tickets will be credited only to your app wallet.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">8. User Responsibilities</h2>
            <p>As a user, you must ensure that the contact information provided during the booking process is accurate. TicketFlix is not liable for any issues resulting from incorrect contact details or miscommunication.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">9. App Wallet Usage</h2>
            <p>The app wallet allows you to store refunds and credit balances, which can be used for future bookings. However, the balance cannot be withdrawn or transferred to external accounts. Ensure you manage your wallet securely.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">10. Theater and Movie Availability</h2>
            <p>Showtimes, seat availability, and theater listings may change without notice due to third-party control. TicketFlix is not responsible for any cancellations or modifications by theaters or distributors, but we will notify you promptly of any significant changes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">11. Intellectual Property</h2>
            <p>All materials on the TicketFlix platform, including text, images, logos, and other content, are owned by TicketFlix and are protected by copyright, trademark, and other intellectual property laws. Unauthorized use is prohibited.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">12. Limitation of Liability</h2>
            <p>TicketFlix disclaims liability for theater-related issues, including but not limited to show cancellations, technical failures, or seat disputes. Our responsibility is limited to the amount paid through the app for the ticket in question.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">13. Modifications to the Service</h2>
            <p>TicketFlix reserves the right to modify or discontinue any part of the service temporarily or permanently without prior notice. We are not liable for any disruption to services caused by such modifications or discontinuation.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">14. Governing Law</h2>
            <p>These Terms and Conditions shall be governed in accordance with the laws of India. In the event of disputes or claims, Indian courts will have jurisdiction over such matters.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">15. Changes to Terms</h2>
            <p>We may update these Terms and Conditions from time to time. Any changes will be posted on this page, and your continued use of the TicketFlix app following these changes will constitute your acceptance of the revised terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">16. Contact Us</h2>
            <p>If you have any questions or concerns regarding these terms, feel free to reach out to us at support@ticketflix.com.</p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
