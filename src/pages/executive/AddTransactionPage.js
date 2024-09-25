import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, getDocs, runTransaction, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthContext } from '../../context/AuthContext';
import { CheckCircle } from 'lucide-react';

const AddTransactionPage = () => {
  const [formData, setFormData] = useState({
    'coupon-code': '',
    'executive-id': '',
    'name': '',
    'phone': '',
    'transaction-id': ''
  });
  const [loading, setLoading] = useState(true);
  const [allowExecutiveAccess, setAllowExecutiveAccess] = useState(false);
  const [unsoldCoupons, setUnsoldCoupons] = useState([]);
  const { user } = useContext(AuthContext);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.email) {
        console.log("No user logged in");
        setLoading(false);
        return;
      }

      try {
        const executiveDocRef = doc(db, "executives", user.email);
        const executiveDocSnap = await getDoc(executiveDocRef);
        if (!executiveDocSnap.exists()) {
          console.log("No executive document found for user:", user.email);
          setLoading(false);
          return;
        }

        const executiveData = executiveDocSnap.data();
        console.log("Executive data:", executiveData);

        setFormData(prevState => ({
          ...prevState,
          'executive-id': executiveData.executiveCode
        }));
        setAllowExecutiveAccess(executiveData.allow_executive_access);

        await fetchUnsoldCoupons(executiveData.executiveCode);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const fetchUnsoldCoupons = async (executiveCode) => {
    console.log('Fetching unsold coupons for executive code:', executiveCode);
    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, 
        where('executiveCode', '==', executiveCode),
        where('sale_date', '==', null)
      );
      const querySnapshot = await getDocs(q);
      const coupons = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        generated_date: doc.data().generated_date ? doc.data().generated_date.toDate() : null,
        validity: doc.data().validity ? doc.data().validity.toDate() : null
      }));
      console.log('Fetched unsold coupons:', coupons);
      setUnsoldCoupons(coupons);
    } catch (error) {
      console.error('Error fetching unsold coupons:', error);
    }
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
  
    // Validate phone number and name
    if (!/^\d{10}$/.test(formData.phone)) {
      console.error('Phone number must be exactly 10 digits.');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      console.error('Name must only contain letters.');
      return;
    }

    if (formData['transaction-id'].length !== 5 || !/^\d+$/.test(formData['transaction-id'])) {
      console.error('Transaction ID must be exactly 5 digits.');
      return;
    }
  
    try {
      await runTransaction(db, async (transaction) => {
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
        if (couponData.sale_date !== null) {
          throw new Error('This coupon has already been sold.');
        }
        
        const validityDate = couponData.validity.toDate();
        if (new Date() > validityDate) {
          throw new Error('This coupon has expired.');
        }

        const executiveDocRef = doc(db, 'executives', user.email);
        const executiveDocSnap = await transaction.get(executiveDocRef);
        if (!executiveDocSnap.exists()) {
          throw new Error('Executive data not found.');
        }
        const executiveData = executiveDocSnap.data();
  
        const saleDate = new Date();
        transaction.update(couponRef, { sale_date: saleDate });
  
        const transactionRef = doc(collection(db, 'coupons-transaction'));
        transaction.set(transactionRef, {
          ...formData,
          'coupon-id': selectedCoupon.id,
          saleDate: saleDate,
          couponAmount: couponData['amount-paid']
        });
  
        const currentSoldCount = executiveData.sold_coupons || 0;
        const currentUnsoldCount = executiveData.unsold_coupons || 0;
        transaction.update(executiveDocRef, { 
          sold_coupons: currentSoldCount + 1,
          unsold_coupons: currentUnsoldCount - 1
        });
      });
  
      console.log('Transaction submitted successfully!');
      setFormData(prevState => ({
        ...prevState,
        'coupon-code': '',
        'name': '',
        'phone': '',
        'transaction-id': ''
      }));
      await fetchUnsoldCoupons(formData['executive-id']);
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (error) {
      console.error('Error submitting transaction:', error);
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
            {showSuccessMessage && (
              <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 flex items-center animate-fade-in-down">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Transaction submitted successfully!</span>
              </div>
            )}
            {!allowExecutiveAccess ? (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Access Denied</p>
                <p>You do not have permission to add transactions. Please contact your administrator for assistance.</p>
              </div>
            ) : (
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name (as per payee)</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    pattern="[a-zA-Z\s]+"
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
                    pattern="\d{10}"
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
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddTransactionPage;
