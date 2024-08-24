import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { AuthContext } from "../../context/AuthContext";
import { Film, User, Lock, ChevronRight } from 'lucide-react';
import routes from '../../routes/constants';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) navigate(routes.ADMIN_DASHBOARD);
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user is an admin
      const adminRef = collection(firestore, 'admins');
      const q = query(adminRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid admin credentials');
      }

      // If we get here, the user is an admin
      navigate(routes.ADMIN_DASHBOARD);
    } catch (error) {
      setError(error.message);
      // Sign out the user if they're not an admin
      await auth.signOut();
    }
  };

  const handleToggle = () => {
    navigate(routes.EXEC_LOGIN);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-black text-white">
      <nav className="bg-black bg-opacity-80 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Film className="text-red-600 mr-2" size={32} />
          <a href={routes.HOME} className="text-3xl font-bold text-red-600">TicketFlix</a>
        </div>
      </nav>
  
      <div className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md relative">
          <div className="absolute inset-0 bg-red-600 transform -rotate-6 rounded-3xl shadow-2xl"></div>
          <div className="relative bg-gray-900 p-8 rounded-3xl shadow-xl backdrop-blur-sm border border-gray-800">
            <h2 className="text-4xl font-bold mb-6 text-center text-red-500">Admin Access</h2>
            <p className="text-center mb-8 text-gray-300">Enter the backstage of cinema magic</p>
            
            {/* Toggle Switch */}
            <div className="flex items-center justify-center mb-6">
              <span className="mr-3 text-red-500">Admin</span>
              <div
                className="w-14 h-7 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer"
                onClick={handleToggle}
              >
                <div
                  className="bg-red-500 w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out"
                ></div>
              </div>
              <span className="ml-3 text-gray-400">Executive</span>
            </div>

            {error && <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">Email address</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    id="email"
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-white"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    id="password"
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-white"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                Login to Dashboard
                <ChevronRight className="ml-2" size={18} />
              </button>
            </form>
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

export default AdminLogin;