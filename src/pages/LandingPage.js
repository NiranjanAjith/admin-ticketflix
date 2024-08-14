import React, { useState, useEffect } from 'react';
import logo from '../logo.png';
import { FaPhone, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram, FaTicketAlt } from 'react-icons/fa';
import '../index.css';

// Import the images
import poster1 from '../poster1.jpg';
import poster2 from '../poster2.jpg';

const moviePosters = [
  poster1,
  poster2,
];

const Header = () => (
  <header className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 py-3 px-4 shadow-lg">
    <div className="container mx-auto flex items-center justify-between">
      <div className="flex items-center">
        <div className="bg-white rounded-full p-1 shadow-md">
          <img
            src={logo}
            alt="TicketFlix Logo"
            className="h-16 rounded-full" 
          />
        </div>
        <h1 className="ml-3 text-3xl font-extrabold text-gray-800 font-sans tracking-wide"> 
          Ticket<span className="text-red-600">Flix</span>
        </h1>
      </div>
      <div className="hidden md:flex items-center space-x-3"> 
        <FaTicketAlt className="text-red-600 text-xl" /> 
        <span className="text-gray-800 font-semibold text-base">Book your experience</span>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-gray-800 text-white py-8">
    <div className="container mx-auto px-4">
      <div className="text-center">
        <p>&copy; 2024 TicketFlix. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

function LandingPage() {
  const [currentPoster, setCurrentPoster] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPoster((prev) => (prev + 1) % moviePosters.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-yellow-50">
      <section className="py-12 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-center">
        <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8 flex flex-col items-center md:items-start"> {/* Added flex and alignment */}
          <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center md:text-left">Turkish Tharkkam</h2>
          <p className="text-xl text-gray-600 mb-6 text-center md:text-left">
            Reserve your tickets for the most anticipated Malayalam movie "Turkish Tharkkam" this Onam and win exciting giveaways. Avail the benefits of pre-booking campaign run by Ticketflix.in exclusively for "Turkish Tharkkam" this festival season.
          </p>
          <div className="flex justify-center w-full md:justify-start"> {/* Center button container */}
            <button className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition duration-300">
              Pre-book
            </button>
          </div>
        </div>
        <div className="md:w-1/2">
          <img
            src={moviePosters[currentPoster]}
            alt="Movie Poster"
            className="w-full h-auto rounded-lg shadow-lg transition-opacity duration-500"
          />
        </div>
      </div>
    </div>
  </section>
      

        
        <section className="py-12 px-4 bg-gray-100">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Win Amazing Prizes</h3>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md p-6 text-center">
                <img src="https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-card-40-iphone15prohero-202309_FMT_WHH?wid=508&hei=472&fmt=p-jpg&qlt=95&.v=1693086369818" alt="iPhone" className="w-32 h-32 mx-auto mb-4 object-cover rounded-full" />
                <h4 className="text-xl font-semibold mb-2">Win iPhones</h4>
                <p className="text-gray-600">Get a chance to win the latest iPhone models!</p>
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md p-6 text-center">
                <img src="data:image/jpeg;base64,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" alt="Electric Scooter" className="w-32 h-32 mx-auto mb-4 object-cover rounded-full" />
                <h4 className="text-xl font-semibold mb-2">Electric Scooters</h4>
                <p className="text-gray-600">Ride in style with our electric scooter giveaway!</p>
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow-md p-6 text-center">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_9EoZHJJyNIOsyvTN8yRTguhWQxz3RSzt7g&s" alt="Electric Car" className="w-32 h-32 mx-auto mb-4 object-cover rounded-full" />
                <h4 className="text-xl font-semibold mb-2">Electric Car</h4>
                <p className="text-gray-600">The grand prize: A brand new electric car!</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;