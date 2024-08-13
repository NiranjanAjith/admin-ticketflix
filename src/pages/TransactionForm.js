import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust this import based on your Firebase setup
import Header from '../components/Header';
import Footer from '../components/Footer';

const CouponTransactionForm = () => {
  const [formData, setFormData] = useState({
    'coupon-id': '',
    'executive-id': '',
    'name': '',
    'phone': '',
    'transaction-id': ''
  });
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    // Basic validation
    if (formData['transaction-id'].length !== 5 || !/^\d+$/.test(formData['transaction-id'])) {
      setMessage({ type: 'error', content: 'Transaction ID must be exactly 5 digits.' });
      return;
    }

    try {
      await addDoc(collection(db, 'coupon_transaction'), formData);
      setMessage({ type: 'success', content: 'Transaction submitted successfully!' });
      setFormData({
        'coupon-id': '',
        'executive-id': '',
        'name': '',
        'phone': '',
        'transaction-id': ''
      });
    } catch (error) {
      setMessage({ type: 'error', content: `Error submitting transaction: ${error.message}` });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coupon Transaction Form</h2>
            {message.content && (
              <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.content}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="coupon-id" className="block text-sm font-medium text-gray-700">Coupon ID</label>
                <input
                  type="text"
                  name="coupon-id"
                  id="coupon-id"
                  value={formData['coupon-id']}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="executive-id" className="block text-sm font-medium text-gray-700">Executive ID</label>
                <input
                  type="text"
                  name="executive-id"
                  id="executive-id"
                  value={formData['executive-id']}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name (as per payer)</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="transaction-id" className="block text-sm font-medium text-gray-700">Transaction ID (last 5 digits only)</label>
                <input
                  type="text"
                  name="transaction-id"
                  id="transaction-id"
                  value={formData['transaction-id']}
                  onChange={handleChange}
                  required
                  maxLength="5"
                  pattern="\d{5}"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CouponTransactionForm;