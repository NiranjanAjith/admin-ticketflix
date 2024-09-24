import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const PrivacyPolicy = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p>We gather personal details such as your name, email address, and payment information when you register an account or make a purchase on our platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How Your Information is Used</h2>
            <p>Your information is used to complete transactions, provide customer service, and enhance our offerings. We may also use it to send updates or promotional materials regarding our services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Data Protection and Security</h2>
            <p>We employ strong security measures to safeguard your personal data from unauthorized access, misuse, loss, or destruction, ensuring its integrity and confidentiality.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Your Data Rights</h2>
            <p>You hold the right to access, modify, or delete your personal information. You may also exercise control over how your data is processed by limiting or objecting to specific processing activities.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Policy Updates</h2>
            <p>Our privacy policy may change from time to time. Any modifications will be posted on this page, and we encourage you to review it periodically to stay informed of updates.</p>
          </section>
        </div>
        <div className="mt-8 text-center">
          <Link to="/" className="text-blue-600 hover:text-blue-800">Back to Home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
