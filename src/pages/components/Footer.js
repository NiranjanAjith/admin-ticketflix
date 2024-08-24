import React from 'react';

const Footer = () => (
  <footer className="bg-gray-800 text-white py-8">
    <div className="container mx-auto px-4">
      <div className="text-center">
        <p>&copy; 2024 TicketFlix. All rights reserved.</p>
        <a href='/terms-and-conditions'>Terms and Conditions</a><br />
        <a href='/privacy-policy'>Privacy Policy</a>
      </div>
    </div>
  </footer>
);

export default Footer;