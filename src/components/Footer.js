import React from 'react';
import { FaTicketAlt } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white w-full py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <FaTicketAlt className="text-red-600 mr-2" size={24} />
                        <span className="text-xl font-bold text-red-600">TicketFlix</span>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-sm text-gray-400">&copy; 2024 TicketFlix Admin. All rights reserved.</p>
                        <p className="text-sm text-gray-400 mt-1">Powered by Your Company Name</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;