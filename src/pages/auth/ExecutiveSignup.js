import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { Film, User, Lock, Mail, Phone, ChevronRight } from 'lucide-react';
import routes from '../../routes/constants';

const generateExecutiveCode = (name, phoneNumber) => {
  const nameParts = name.split(' ');
  const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('');
  const phonePart = phoneNumber.slice(-4);
  return `${initials}${phonePart}`;
};

const ExecutiveSignup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const executiveCode = generateExecutiveCode(name, phoneNumber);
      await setDoc(doc(firestore, 'executives', email), {
        name,
        email,
        phoneNumber,
        executiveCode,
        allow_executive_access: false
      });
      navigate('/executive');
    } catch (error) {
      setError(error.message);
    }
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
            <h2 className="text-4xl font-bold mb-6 text-center text-red-500">Signup for Executives</h2>
            <p className="text-center mb-8 text-gray-300">Join our team as an executive</p>
            {error && <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    id="name"
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-white"
                    placeholder="Type your fullname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    id="email"
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-white"
                    placeholder="Type your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-300">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    id="phoneNumber"
                    className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 text-white"
                    placeholder="Type your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
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
                    placeholder="Type your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                Register as Executive
                <ChevronRight className="ml-2" size={18} />
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to={routes.EXEC_LOGIN} className="text-sm text-red-400 hover:text-red-300 transition-colors duration-300">
                Already have an account? Login here
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

export default ExecutiveSignup;