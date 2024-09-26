import React from 'react';
import { Link } from 'react-router-dom';
import LandingPageHeader from "../components/LandingPageHeader";
import LandingPageFooter from '../components/LandingPageFooter';

function SuccessPage() {
  return (
    <div className="App min-h-screen flex flex-col bg-yellow-50">
      <LandingPageHeader />
      <main className="flex-grow flex items-center pl-48">
        <div className="w-full max-w-lg">
          <h2 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h2>
          <p className="text-xl mb-6">Thank you for your booking.</p>
          <Link to="/" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300">
            Return to Home
          </Link>
        </div>
      </main>
      <LandingPageFooter />
    </div>
  );
}

export default SuccessPage;