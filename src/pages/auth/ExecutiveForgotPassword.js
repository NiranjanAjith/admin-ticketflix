import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Film, Mail, ChevronLeft } from 'lucide-react';
import routes from '../../routes/constants';

const ExecutiveForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      // Check if the email exists in the executives collection
      const executiveRef = collection(firestore, 'executives');
      const q = query(executiveRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No executive account found with this email address.');
        return;
      }

      // If the email exists, send the password reset email
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Please check your inbox.');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-black text-white">
      <nav className="bg-black bg-opacity-80 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Film className="text-yellow-600 mr-2" size={32} />
          <a href={routes.HOME} className="text-3xl font-bold text-yellow-600">TicketFlix</a>
        </div>
      </nav>
      <div className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md relative">
          <div className="absolute inset-0 bg-yellow-600 transform -rotate-6 rounded-3xl shadow-2xl"></div>
          <div className="relative bg-gray-900 p-8 rounded-3xl shadow-xl backdrop-blur-sm border border-gray-800">
            <h2 className="text-4xl font-bold mb-6 text-center text-yellow-500">Executive Password Reset</h2>
            <p className="text-center mb-8 text-gray-300">Enter your executive email to reset your password</p>
            {message && <div className="bg-green-500 text-white p-3 rounded mb-4 text-sm">{message}</div>}
            {error && <div className="bg-yellow-500 text-white p-3 rounded mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">Executive Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    id="email"
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 text-white"
                    placeholder="Enter your executive email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105"
              >
                Send Reset Link
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to={routes.EXEC_LOGIN} className="text-yellow-400 hover:text-yellow-500 transition-colors duration-300 flex items-center justify-center">
                <ChevronLeft size={18} className="mr-1" />
                Back to Executive Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-black bg-opacity-80 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 TicketFlix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default ExecutiveForgotPassword;