import React from 'react';
import { Link } from 'react-router-dom';
import Header from "../components/Header";
import Footer from '../components/Footer';

function FailurePage() {
  return (
    <div className="App min-h-screen flex flex-col bg-yellow-50">
      <Header />
      <main className="flex-grow flex items-center pl-48">
        <div className="w-full max-w-lg">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h2>
          <p className="text-xl mb-6">We're sorry, but there was an issue processing your payment.</p>
          <Link to="/pre-book" className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300">
            Try Again
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default FailurePage;