import React from "react";
import { FaTicketAlt } from "react-icons/fa";
import logo from "../../assets/logo.png";

const Header = () => (
  <header className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 py-3 px-4 shadow-lg">
    <div className="container mx-auto flex items-center justify-between">
      <div className="flex items-center">
        <div className="bg-white rounded-full p-1 shadow-md">
          <img src={logo} alt="TicketFlix Logo" className="h-16 rounded-full" />
        </div>
        <h1 className="ml-3 text-3xl font-extrabold text-gray-800 font-sans tracking-wide">
          Ticket<span className="text-red-600">Flix</span>
        </h1>
      </div>
      <div className="hidden md:flex items-center space-x-3">
        <FaTicketAlt className="text-red-600 text-xl" />
        <span className="text-gray-800 font-semibold text-base">
          Book your experience
        </span>
      </div>
    </div>
  </header>
);

export default Header;
