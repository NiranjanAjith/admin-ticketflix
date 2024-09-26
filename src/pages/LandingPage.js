import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import LandingPageHeader from "./components/LandingPageHeader";
import LandingPageFooter from './components/LandingPageFooter';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from "./../firebase";

const images = {
  iPhone:
    "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-card-40-iphone15prohero-202309_FMT_WHH?wid=508&hei=472&fmt=p-jpg&qlt=95&.v=1693086369818",
  electricCar:
    "https://blog.statiq.in/wp-content/uploads/2023/04/image-12-1280x600.png",
  electricScooter:
    "https://odysse.in/wp-content/uploads/2022/05/pista-colour-2-600x428.png",
};


function LandingPage() {
  const [movies, setMovies] = useState([]);
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const q = query(collection(firestore, "movies"), where("prebook", "==", true));
        const querySnapshot = await getDocs(q);
        const moviesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMovies(moviesData);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    };

    fetchMovies();
  }, []);

  useEffect(() => {
    if (movies.length > 0) {
      const posterInterval = setInterval(() => {
        setCurrentPosterIndex(prev => (prev + 1) % movies.length);
        setCurrentImageIndex(0);
      }, 10000);

      const imageInterval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % 2);
      }, 5000);

      return () => {
        clearInterval(posterInterval);
        clearInterval(imageInterval);
      };
    }
  }, [movies]);

  const handlePrebookClick = (movieId) => {
    navigate('/pre-book', { state: { movieId } });
  };

  const renderMovieSection = () => {
    if (movies.length === 0) {
      return (
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">No Pre-booking Available</h2>
          <p className="text-xl text-gray-600">Check back later for exciting new movie pre-bookings!</p>
        </div>
      );
    }

    const currentMovie = movies[currentPosterIndex];
    const currentImage = currentImageIndex === 0 || !currentMovie.additionalImageUrls || currentMovie.additionalImageUrls.length === 0
      ? currentMovie.posterUrl 
      : currentMovie.additionalImageUrls[0];

    return (
      <div className="flex flex-col lg:flex-row items-center justify-center">
        <div className="w-full lg:w-1/2 mb-8 lg:mb-0 lg:pr-8 flex flex-col items-center lg:items-start">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4 text-center lg:text-left">
            {currentMovie.title}
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 mb-6 sm:text-center text-left pr-4 lg:px-0">
            {currentMovie.description}
          </p>
          <div className="flex justify-center w-full lg:justify-start">
            <button
              onClick={() => handlePrebookClick(currentMovie.id)}
              className="bg-red-800 text-white font-bold py-2 px-6 rounded-full hover:bg-yellow-700 transition duration-300"
            >
              Pre-book
            </button>
          </div>
        </div>
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-[80vh] flex justify-center items-center">
          <img
            src={currentImage}
            alt={`${currentMovie.title} ${
              currentImageIndex === 0 ? "Poster" : "Additional Image"
            }`}
            className="h-full aspect-[10/15] object-fit shadow-lg shadow-[#00000033] rounded-[21px] transition-opacity duration-500"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="App min-h-screen flex flex-col">
      <LandingPageHeader />
      <main className="flex-grow bg-yellow-50">
        <section className="py-8 lg:py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {renderMovieSection()}
          </div>
        </section>

        <section className="py-8 lg:py-12 px-4 bg-gray-100">
          <div className="container mx-auto">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-8 text-center">
              Win Amazing Prizes
            </h3>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="w-full sm:w-1/2 lg:w-1/3 bg-white rounded-[16px] shadow-md p-6 text-center">
                <img src={images.iPhone} alt="iPhone" className="h-24 lg:h-32 mx-auto mb-4 object-cover rounded-[21px]" />
                <h4 className="text-lg lg:text-xl font-semibold mb-2">Win iPhones</h4>
                <p className="text-sm lg:text-base text-gray-600">Get a chance to win the latest iPhone models!</p>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/3 bg-white rounded-[16px] shadow-md p-6 text-center">
                <img src={images.electricScooter} alt="Electric Scooter" className="h-24 lg:h-32 mx-auto mb-4 object-cover rounded-[21px]" />
                <h4 className="text-lg lg:text-xl font-semibold mb-2">Electric Scooters</h4>
                <p className="text-sm lg:text-base text-gray-600">Ride in style with our electric scooter giveaway!</p>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/3 bg-white rounded-[16px] shadow-md p-6 text-center">
                <img src={images.electricCar} alt="Electric Car" className="h-24 lg:h-32 mx-auto mb-4 object-cover rounded-[21px]" />
                <h4 className="text-lg lg:text-xl font-semibold mb-2">Electric Car</h4>
                <p className="text-sm lg:text-base text-gray-600">The grand prize: A brand new electric car!</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingPageFooter />
    </div>
  );
}

export default LandingPage;