import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [theatreNames, setTheatreNames] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (location.state) {
        setPaymentData(location.state);
        await fetchTheatreNames(location.state);
        setLoading(false);
      } else {
        setError('No prebooking data found');
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state]);

  const fetchTheatreNames = async (data) => {
    const preferences = ['firstPreference', 'secondPreference', 'thirdPreference'];
    const names = {};

    for (const pref of preferences) {
      if (data[pref]) {
        try {
          const theatreRef = doc(db, 'theatres', data[pref]);
          const theatreSnap = await getDoc(theatreRef);
          if (theatreSnap.exists()) {
            names[pref] = theatreSnap.data().owner;
          }
        } catch (err) {
          console.error(`Error fetching theatre name for ${pref}:`, err);
        }
      }
    }

    setTheatreNames(names);
  };

  const initiatePhonePePayment = async () => {
    try {
      setPaymentInitiated(true);
      // This is a placeholder for the actual PhonePe API call
      const phonePeResponse = await fetch('https://api.phonepe.com/api/v1/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Your-PhonePe-API-Key'
        },
        body: JSON.stringify({
          amount: paymentData.amount * 100, // Amount in paise
          merchantId: 'Your-Merchant-ID',
          merchantTransactionId: paymentData.prebookingId,
          redirectUrl: `${window.location.origin}/payment-status`,
          callbackUrl: `${window.location.origin}/api/phonepe-callback`,
          merchantUserId: paymentData.email, // Assuming email is used as userId
          mobileNumber: paymentData.phone,
          deviceContext: {
            deviceOS: "WEB"
          }
        })
      });

      const responseData = await phonePeResponse.json();

      if (responseData.success) {
        // Redirect to PhonePe payment page
        window.location.href = responseData.data.instrumentResponse.redirectInfo.url;
      } else {
        throw new Error(responseData.message || 'Payment initiation failed');
      }
    } catch (err) {
      setError(err.message);
      setPaymentInitiated(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Checkout</h2>
          <div className="space-y-4 mb-6">
            <p><strong>Movie:</strong> {paymentData.movieName}</p>
            <p><strong>First Preference Theatre:</strong> {theatreNames.firstPreference || 'Not available'}</p>
            {paymentData.secondPreference && (
              <p><strong>Second Preference Theatre:</strong> {theatreNames.secondPreference || 'Not available'}</p>
            )}
            {paymentData.thirdPreference && (
              <p><strong>Third Preference Theatre:</strong> {theatreNames.thirdPreference || 'Not available'}</p>
            )}
            <p><strong>Seats:</strong> {paymentData.numberOfSeats} ({paymentData.class})</p>
            <p><strong>Total Amount:</strong> ₹{paymentData.amount}</p>
          </div>
          <button
            onClick={initiatePhonePePayment}
            className={`w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-colors ${
              paymentInitiated ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={paymentInitiated}
          >
            {paymentInitiated ? 'Processing...' : 'Pay with PhonePe'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;