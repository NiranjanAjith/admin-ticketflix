import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PaymentStatus = () => {
  const [status, setStatus] = useState('loading');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(location.search);
      const transactionId = urlParams.get('transactionId');
      const prebookingId = urlParams.get('merchantTransactionId');

      if (!transactionId || !prebookingId) {
        setStatus('error');
        return;
      }

      try {
        // Verify payment status with PhonePe
        const paymentVerified = await verifyPhonePePayment(transactionId);

        if (paymentVerified) {
          // Update Firestore
          const prebookingRef = doc(db, 'prebook', prebookingId);
          await updateDoc(prebookingRef, {
            paymentStatus: 'completed',
            paymentTimestamp: new Date(),
            transactionId: transactionId
          });

          // Fetch updated prebooking data
          const updatedPrebooking = await getDoc(prebookingRef);
          
          if (updatedPrebooking.exists()) {
            setStatus('success');
          } else {
            setStatus('error');
          }
        } else {
          setStatus('failed');
          // Update Firestore with failed status
          const prebookingRef = doc(db, 'prebook', prebookingId);
          await updateDoc(prebookingRef, {
            paymentStatus: 'failed',
            paymentTimestamp: new Date(),
            transactionId: transactionId
          });
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [location]);

  // You'll need to implement this function to verify the payment with PhonePe
  const verifyPhonePePayment = async (transactionId) => {
    // Implement PhonePe payment verification logic here
    // This should make a call to PhonePe's API to verify the transaction
    // Return true if payment is verified, false otherwise
    
    // Placeholder implementation
    console.log("Verifying payment with transactionId:", transactionId);
    return new Promise((resolve) => {
      setTimeout(() => resolve(Math.random() > 0.2), 2000); // Simulates API call with 80% success rate
    });
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-xl">Verifying payment...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h2>
            <p className="mb-6">Your booking has been confirmed.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        );
      case 'failed':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h2>
            <p className="mb-6">Unfortunately, your payment could not be processed.</p>
            <button 
              onClick={() => navigate('/checkout')}
              className="bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case 'error':
      default:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600 mb-4">Error</h2>
            <p className="mb-6">An error occurred while processing your payment. Please contact support.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4">
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentStatus;