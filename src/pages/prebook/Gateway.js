import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LandingPageHeader from "../components/LandingPageHeader";
import LandingPageFooter from "../components/LandingPageFooter";

function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state) {
      setPaymentData(location.state);
    } else {
      navigate('/pre-book');
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/initiate-payment', paymentData);
      window.location.href = response.data.redirectUrl;
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError('An error occurred while initiating the payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
        </main>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
        <LandingPageHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-2xl font-bold text-purple-700">Loading payment details...</div>
        </main>
        <LandingPageFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
      <LandingPageHeader />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Confirm Payment
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-700">Booking Details:</h3>
            <p><strong>Name:</strong> {paymentData.name}</p>
            <p><strong>Movie:</strong> {paymentData.movieName}</p>
            <p><strong>Number of Seats:</strong> {paymentData.numberOfSeats}</p>
            <p><strong>Class:</strong> {paymentData.class}</p>
          </div>
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-700">Payment Details:</h3>
            <p><strong>Amount:</strong> ₹{paymentData.amount}</p>
            <p><strong>Mobile Number:</strong> {paymentData.mobileNumber}</p>
            <p><strong>Email:</strong> {paymentData.email}</p>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-colors"
          >
            Confirm and Pay
          </button>
        </div>
      </main>
      <LandingPageFooter />
    </div>
  );
}

export default PaymentGateway;