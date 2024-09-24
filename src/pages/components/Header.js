import React from "react";
import { FaTicketAlt } from "react-icons/fa";
import logo from "../../assets/logo.png";

const Header = () => (
  <header className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 py-2 px-4 shadow-md relative overflow-hidden">
    <div className="absolute inset-0 bg-yellow-100 opacity-50 animate-pulse"></div>
    <div className="container mx-auto flex items-center justify-between relative z-10">
      <div className="flex items-center group">
        <div className="bg-white rounded-full p-0.5 shadow-md transition-transform duration-300 group-hover:scale-105">
          <img src={logo} alt="TicketFlix Logo" className="h-12 w-12 rounded-full transition-transform duration-300 group-hover:rotate-12" />
        </div>
        <h1 className="ml-2 text-3xl font-extrabold text-gray-800 font-sans tracking-wide transition-all duration-300 group-hover:text-red-600 group-hover:scale-105">
          Ticket<span className="text-red-600 group-hover:text-gray-800">Flix</span>
        </h1>
      </div>
      <div className="hidden md:flex items-center space-x-2 bg-white bg-opacity-30 backdrop-filter backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm transition-all duration-300 hover:bg-opacity-50 hover:shadow-md">
        <FaTicketAlt className="text-red-600 text-lg animate-bounce" />
        <span className="text-gray-800 font-semibold text-base">
          Book your experience
        </span>
      </div>
    </div>
  </header>
);

export default Header;