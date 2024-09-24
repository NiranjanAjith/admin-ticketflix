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
        <div className="space-y-4">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
            <p>We collect personal information that you provide to us, such as your name, email address, and payment information when you create an account or make a purchase.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Information</h2>
            <p>We use your information to process transactions, provide customer support, and improve our services. We may also use your information to send you updates about our services and promotional offers.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">3. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. You may also have the right to restrict or object to certain types of processing of your data.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
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

export default PrivacyPolicy;