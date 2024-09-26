import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // useNavigate, (FIXME: Unused)
import axios from 'axios';
import { detect } from 'detect-browser';
import { v4 as uuidv4 } from 'uuid';
import { sha256 } from 'js-sha256';
import LandingPageHeader from '../components/LandingPageHeader';
import LandingPageFooter from '../components/LandingPageFooter';

function PaymentGateway() {
  // const navigate = useNavigate(); (FIXME: Unused)
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const browser = detect();
  const deviceOS = browser
    ? browser.os === "iOS"
      ? "IOS"
      : "ANDROID"
    : "ANDROID";

  useEffect(() => {
    if (location.state) {
      setPaymentData(location.state);
      setIsLoading(false);
    } else {
      setError("No payment data found");
      setIsLoading(false);
    }
  }, [location.state]);

  const makePayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const transactionid = "Tr-" + uuidv4().toString(36).slice(-6);

    const getRedirectUrl = () => {
      const baseUrl = process.env.REACT_APP_BASE_URL || "http://localhost:3000";
      if (deviceOS === "IOS") {
        return `${baseUrl}/api/status/${transactionid}-ios`;
      } else if (deviceOS === "ANDROID") {
        return `${baseUrl}/api/status/${transactionid}-android`;
      } else {
        return `${baseUrl}/api/status/${transactionid}-web`;
      }
    };

    const payload = {
      merchantId: process.env.REACT_APP_PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionid,
      merchantUserId: "MUID-" + uuidv4().toString(36).slice(-6),
      amount: paymentData.amount * 100, // Convert to paise
      redirectUrl: getRedirectUrl(),
      redirectMode: "POST",
      callbackUrl: getRedirectUrl(),
      mobileNumber: paymentData.mobileNumber,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      deviceContext: {
        deviceOS: deviceOS,
      },
      email: paymentData.email,
    };

    const dataPayload = JSON.stringify(payload);
    const dataBase64 = btoa(dataPayload);
    const fullURL =
      dataBase64 + "/pg/v1/pay" + process.env.REACT_APP_PHONEPE_SALT_KEY;
    const dataSha256 = sha256(fullURL);
    const checksum =
      dataSha256 + "###" + process.env.REACT_APP_PHONEPE_SALT_INDEX;

    try {
      const response = await axios.post(
        process.env.REACT_APP_PHONEPE_API_URL,
        {
          request: dataBase64,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          },
        }
      );

      const redirect = response.data.data.instrumentResponse.redirectInfo.url;
      window.location.href = redirect;
    } catch (error) {
      console.error(error);
      setError(
        "An error occurred while initiating the payment. Please try again."
      );
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
        <LandingPageHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
        </main>
        <LandingPageFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
        <LandingPageHeader />
        <main className="flex-grow flex items-center justify-center px-4">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
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
          <div className="space-y-4 mb-6">
            <p>
              <strong>Amount:</strong> ₹{paymentData.amount}
            </p>
            <p>
              <strong>Mobile:</strong> {paymentData.mobileNumber}
            </p>
            <p>
              <strong>Email:</strong> {paymentData.email}
            </p>
          </div>
          <button
            onClick={makePayment}
            className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-colors"
          >
            Pay Now
          </button>
        </div>
      </main>
      <LandingPageFooter />
    </div>
  );
}

export default PaymentGateway;