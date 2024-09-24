import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-900 text-white py-8">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Information */}
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold mb-2 text-yellow-400">TicketFlix</h2>
          <p className="text-sm text-gray-300">Your premier destination for movie tickets and entertainment.</p>
        </div>

        {/* Quick Links */}
        <div className="text-center md:text-left">
          <h3 className="text-xl font-semibold mb-4 text-yellow-400">Quick Links</h3>
          <ul className="space-y-1">
            <li><Link to="/terms-and-conditions" className="text-sm hover:text-yellow-400 transition-colors duration-300">Terms and Conditions</Link></li>
            <li><Link to="/privacy-policy" className="text-sm hover:text-yellow-400 transition-colors duration-300">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Social Media Links */}
        <div className="text-center bg-gray-900 p-6">
          <h3 className="text-xl font-semibold mb-4 text-yellow-400">Connect With Us</h3>
          <div className="flex justify-center space-x-6">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors duration-300">
              <Facebook size={28} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors duration-300">
              <Twitter size={28} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors duration-300">
              <Instagram size={28} />
            </a>
            <a href="mailto:info@ticketflix.com" className="text-white hover:text-yellow-400 transition-colors duration-300">
              <Mail size={28} />
            </a>
          </div>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-center">
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} TicketFlix. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;