import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';
const PrebookingForm = () => {
  const location = useLocation();
  const movieId = location.state?.movieId || '';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    firstPreference: "",
    secondPreference: "",
    thirdPreference: "",
    class: '',
    executiveCode: '',
    numberOfSeats: 1
  });

  const [movieData, setMovieData] = useState(null);
  const [theatres, setTheatres] = useState([]);
  const [filteredTheatres, setFilteredTheatres] = useState([]);
  const [locations, setLocations] = useState([]);
  const [seatTypes, setSeatTypes] = useState([]);
  const [amount, setAmount] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const fetchMovieAndTheatres = async () => {
      try {
        const movieRef = doc(db, 'movies', movieId);
        const movieSnap = await getDoc(movieRef);
        if (movieSnap.exists()) {
          const movie = movieSnap.data();
          setMovieData(movie);
          setSeatTypes(Object.keys(movie.prebookPrice || {}));

          const theatrePromises = movie.theatreIds.map(id => getDoc(doc(db, 'theatres', id)));
          const theatreSnapshots = await Promise.all(theatrePromises);
          const theatreData = theatreSnapshots.map(snap => ({
            id: snap.id,
            ...snap.data()
          }));
          setTheatres(theatreData);

          const uniqueLocations = [...new Set(theatreData.map(theatre => theatre.district))];
          setLocations(uniqueLocations);
        } else {
          console.error("Movie not found");
        }
      } catch (error) {
        console.error("Error fetching movie and theatres: ", error);
      }
    };

    if (movieId) {
      fetchMovieAndTheatres();
    }
  }, [movieId]);

  useEffect(() => {
    if (formData.class && movieData?.prebookPrice) {
      const selectedClassPrice = movieData.prebookPrice[formData.class];
      if (selectedClassPrice) {
        setAmount(selectedClassPrice * formData.numberOfSeats);
      } else {
        setAmount(0);
      }
    } else {
      setAmount(null);
    }
  }, [formData.class, formData.numberOfSeats, movieData]);

  useEffect(() => {
    if (formData.location) {
      const filtered = theatres.filter(theatre => theatre.district === formData.location);
      setFilteredTheatres(filtered);
      setFormData(prev => ({
        ...prev,
        firstPreference: '',
        secondPreference: '',
        thirdPreference: ''
      }));
    }
  }, [formData.location, theatres]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setAgreedToTerms(checked);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getAvailableTheatres = (preference) => {
    return filteredTheatres.filter(theatre => {
      if (preference === 'firstPreference') return true;
      if (preference === 'secondPreference') return theatre.id !== formData.firstPreference;
      if (preference === 'thirdPreference') return theatre.id !== formData.firstPreference && theatre.id !== formData.secondPreference;
      return false;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const prebookData = {
        ...formData,
        movieId,
        amount,
        timestamp: new Date()
      };
      
      const prebookCol = collection(db, 'prebook');
      await addDoc(prebookCol, prebookData);
      console.log("Prebooking data written to Firestore");
  
      const movieRef = doc(db, 'movies', movieId);
      const movieSnap = await getDoc(movieRef);
      if (movieSnap.exists()) {
        const movieData = movieSnap.data();
        const updatedPreferences = {};
  
        const updatePreferenceMap = (preferenceField, theatreId) => {
          const currentMap = movieData[preferenceField] || {};
          const newCount = (currentMap[theatreId] || 0) + formData.numberOfSeats;
          return { ...currentMap, [theatreId]: newCount };
        };
  
        if (formData.firstPreference) {
          updatedPreferences.firstPreference = updatePreferenceMap('firstPreference', formData.firstPreference);
        }
        if (formData.secondPreference) {
          updatedPreferences.secondPreference = updatePreferenceMap('secondPreference', formData.secondPreference);
        }
        if (formData.thirdPreference) {
          updatedPreferences.thirdPreference = updatePreferenceMap('thirdPreference', formData.thirdPreference);
        }
  
        await updateDoc(movieRef, {
          ...updatedPreferences
        });
  
        console.log("Movie document updated with new seat counts");
  
        navigate('/payment');
      } else {
        console.error("Movie document not found");
      }
    } catch (error) {
      console.error("Error writing data to Firestore: ", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
        <Header/>
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4 space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Prebook Your Tickets</h2>
            {['name', 'phone', 'email'].map((field) => (
              <div key={field} className="relative">
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder=" "
                  required={field !== 'email'}
                />
                <label
                  htmlFor={field}
                  className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)} {field === 'email' ? '(optional)' : ''}
                </label>
              </div>
            ))}

            <div className="relative">
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <label htmlFor="location" className="absolute left-3 -top-3.5 text-gray-600 text-sm">
                Location
              </label>
            </div>

            {['firstPreference', 'secondPreference', 'thirdPreference'].map((preference, index) => (
              <div key={preference} className="relative">
                <select
                  id={preference}
                  name={preference}
                  value={formData[preference]}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
                  required={index === 0}
                  disabled={!formData.location}
                >
                  <option value="">{`${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} Preference`}</option>
                  {getAvailableTheatres(preference).map((theatre) => (
                    <option key={theatre.id} value={theatre.id}>
                      {theatre.owner}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="relative">
              <select
                id="class"
                name="class"
                value={formData.class}
                onChange={handleChange}
                className="w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Class</option>
                {seatTypes.map((seatType, index) => (
                  <option key={index} value={seatType}>{seatType}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <input
                type="text"
                id="executiveCode"
                name="executiveCode"
                value={formData.executiveCode}
                onChange={handleChange}
                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
                placeholder=" "
              />
              <label
                htmlFor="executiveCode"
                className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
              >
                Executive Code (optional)
              </label>
            </div>

            <div className="relative">
              <select
                id="numberOfSeats"
                name="numberOfSeats"
                value={formData.numberOfSeats}
                onChange={handleChange}
                className="w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <label htmlFor="numberOfSeats" className="absolute left-3 -top-3.5 text-gray-600 text-sm">
                Number of Seats
              </label>
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={agreedToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
                By paying you agree to TicketFlix's{' '}
                <Link to="/terms-and-conditions" className="text-blue-600 hover:underline">
                  terms and conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                  privacy policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors ${
                agreedToTerms
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-gray-700 cursor-not-allowed'
              }`}
              disabled={!agreedToTerms}
            >
              {agreedToTerms ? `Proceed to Pay ${amount ? `₹${amount}` : ''}` : 'Please agree to terms to proceed'}
            </button>
          </form>
        </div>
      </main>
      <Footer/>
    </div>
  );
};

export default PrebookingForm;