import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, getDocs, runTransaction, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthContext } from '../../context/AuthContext';

const AddTransactionPage = () => {
  const [formData, setFormData] = useState({
    'coupon-code': '',
    'executive-id': '',
    'name': '',
    'phone': '',
    'transaction-id': ''
  });
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [allowExecutiveAccess, setAllowExecutiveAccess] = useState(false);
  const [unsoldCoupons, setUnsoldCoupons] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchExecutiveData = async () => {
      if (user) {
        const executivesRef = collection(db, 'executives');
        const q = query(executivesRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const executiveData = querySnapshot.docs[0].data();
          setFormData(prevState => ({
            ...prevState,
            'executive-id': executiveData.executiveCode
          }));
          setAllowExecutiveAccess(executiveData.allow_executive_access);
          await fetchUnsoldCoupons(executiveData.executiveCode);
        }
      }
      setLoading(false);
    };

    fetchExecutiveData();
  }, [user]);

  const fetchUnsoldCoupons = async (executiveCode) => {
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, 
      where('executiveCode', '==', executiveCode),
      where('is_sold', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const coupons = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUnsoldCoupons(coupons);
  };

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
  
    if (formData['transaction-id'].length !== 5 || !/^\d+$/.test(formData['transaction-id'])) {
      setMessage({ type: 'error', content: 'Transaction ID must be exactly 5 digits.' });
      return;
    }
  
    try {
      await runTransaction(db, async (transaction) => {
        // Find the coupon document based on the selected coupon code
        const selectedCoupon = unsoldCoupons.find(coupon => coupon.coupon_code === formData['coupon-code']);
        if (!selectedCoupon) {
          throw new Error('Selected coupon not found.');
        }
  
        const couponRef = doc(db, 'coupons', selectedCoupon.id);
        const couponDoc = await transaction.get(couponRef);
        
        if (!couponDoc.exists()) {
          throw new Error('Coupon not found.');
        }
        
        const couponData = couponDoc.data();
        if (couponData.is_sold) {
          throw new Error('This coupon has already been sold.');
        }
        
        // Convert validity timestamp to Date object and compare
        const validityDate = couponData.validity.toDate();
        if (new Date() > validityDate) {
          throw new Error('This coupon has expired.');
        }
  
        // Update coupon as sold
        transaction.update(couponRef, { 
          is_sold: true, 
          sale_date: new Date() 
        });
  
        // Add transaction
        const transactionRef = doc(collection(db, 'coupons-transaction'));
        transaction.set(transactionRef, {
          ...formData,
          'coupon-id': selectedCoupon.id,
          saleDate: new Date(),
          couponAmount: couponData['amount-paid']
        });
  
        // Update executive's counts
        const executivesRef = collection(db, 'executives');
        const executiveQuery = query(executivesRef, where('executiveCode', '==', formData['executive-id']));
        const executiveSnapshot = await getDocs(executiveQuery);
        if (!executiveSnapshot.empty) {
          const executiveDoc = executiveSnapshot.docs[0];
          const currentSoldCount = executiveDoc.data().sold_coupons || 0;
          const currentUnsoldCount = executiveDoc.data().unsold_coupons || 0;
          transaction.update(executiveDoc.ref, { 
            sold_coupons: currentSoldCount + 1,
            unsold_coupons: currentUnsoldCount - 1
          });
        }
      });
  
      setMessage({ type: 'success', content: 'Transaction submitted successfully!' });
      setFormData(prevState => ({
        ...prevState,
        'coupon-code': '',
        'name': '',
        'phone': '',
        'transaction-id': ''
      }));
      // Refresh the list of unsold coupons
      await fetchUnsoldCoupons(formData['executive-id']);
    } catch (error) {
      setMessage({ type: 'error', content: `Error submitting transaction: ${error.message}` });
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <p className="text-center">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coupon Transaction Form</h2>
            {!allowExecutiveAccess ? (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <p className="font-bold">Access Denied</p>
                <p>You do not have permission to add transactions. Please contact your administrator for assistance.</p>
              </div>
            ) : (
              <>
                {message.content && (
                  <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.content}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="coupon-code" className="block text-sm font-medium text-gray-700">Coupon Code</label>
                    <select
                      name="coupon-code"
                      id="coupon-code"
                      value={formData['coupon-code']}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Select a coupon</option>
                      {unsoldCoupons.map(coupon => (
                        <option key={coupon.id} value={coupon.coupon_code}>
                          {coupon.coupon_code} - Rs. {coupon['amount-paid']}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="executive-id" className="block text-sm font-medium text-gray-700">Executive ID</label>
                    <input
                      type="text"
                      name="executive-id"
                      id="executive-id"
                      value={formData['executive-id']}
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
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
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddTransactionPage;