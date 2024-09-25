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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Helper functions for validations
  const validateEmail = (email) => {
    // Refined email regex to prevent numbers in domain and ensure proper email format
    const emailRegex = /^[^\s@]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phoneNumber) => {
    // Validate that phone number contains only digits and is 10 characters long
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phoneNumber);
  };

  const validatePassword = (password) => {
    // Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateName = (name) => {
    // Ensure name contains only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate all fields
    if (!validateName(name)) {
      setError("Please enter a valid name (letters and spaces only)");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address (e.g., example@domain.com)");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid phone number (10 digits)");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
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
          <Film className="text-yellow-600 mr-2" size={32} />
          <a href={routes.HOME} className="text-3xl font-bold text-yellow-600">
            TicketFlix
          </a>
        </div>
      </nav>

      <div className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-4xl relative">
          <div className="absolute inset-0 bg-yellow-600 transform -rotate-6 rounded-3xl shadow-2xl"></div>
          <div className="relative bg-gray-900 p-8 rounded-3xl shadow-xl backdrop-blur-sm border border-gray-800">
            <h2 className="text-4xl font-bold mb-7 pb-3 text-center text-yellow-500">
              Signup for Executives
            </h2>
            <p className="text-center mb-8 text-yellow-200 text-opacity-80">
              Join our team as an executive
            </p>
            {error && (
              <div className="bg-yellow-500 text-white p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-wrap -mx-3 pb-3">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <div className="mb-6">
                    <label
                      htmlFor="name"
                      className="block mb-2 text-sm font-medium text-gray-300"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        id="name"
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 text-white"
                        placeholder="Type your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label
                      htmlFor="email"
                      className="block mb-2 text-sm font-medium text-gray-300"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="email"
                        id="email"
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 text-white"
                        placeholder="Type your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block mb-2 text-sm font-medium text-gray-300"
                    >
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="tel"
                        id="phoneNumber"
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 text-white"
                        placeholder="Type your phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <div className="mb-6">
                    <label
                      htmlFor="password"
                      className="block mb-2 text-sm font-medium text-gray-300"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="password"
                        id="password"
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 text-white"
                        placeholder="Type your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block mb-2 text-sm font-medium text-gray-300"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="password"
                        id="confirmPassword"
                        className="w-full pl-10 pr-3 py-3 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 text-white"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-x-[1.01] hover:scale-y-[1.05] flex items-center justify-center"
              >
                Register as Executive
                <ChevronRight className="ml-2" size={18} />
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link
                to={routes.EXEC_LOGIN}
                className="text-sm text-yellow-500 hover:text-yellow-600 hover:no-underline transition-colors duration-300"
              >
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
