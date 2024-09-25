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
  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = "Name should only contain letters and spaces";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number should be 10 digits";
    }

    // Email validation
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const specialCharRegex = /(\.\.|__)/; // To check for consecutive dots or underscores
      const domainRegex = /\.[a-zA-Z]{2,}$/; // To ensure there's at least one dot and domain extension
      const endsWithDot = /\.$/; // To check if email ends with a dot

      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Invalid email format";
      } else if (specialCharRegex.test(formData.email.trim())) {
        newErrors.email = "Email contains invalid consecutive dots or underscores";
      } else if (!domainRegex.test(formData.email.trim())) {
        newErrors.email = "Invalid domain in email";
      } else if (endsWithDot.test(formData.email.trim())) {
        newErrors.email = "Email cannot end with a dot";
      }
    }


    // Class validation
    if (!formData.class) {
      newErrors.class = "Class is required";
    }

    // Number of seats validation
    if (formData.numberOfSeats < 1 || formData.numberOfSeats > 10) {
      newErrors.numberOfSeats = "Number of seats should be between 1 and 10";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setAgreedToTerms(checked);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: '' }));
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
    if (validateForm()) {
      try {
        const prebookData = {
          ...formData,
          movieId,
          amount,
          timestamp: new Date()
        };

        const prebookCol = collection(db, 'prebook');
        const docRef = await addDoc(prebookCol, prebookData);
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

          navigate('/checkout', {
            state: {
              prebookingId: docRef.id,
              movieName: movieData.title,
              ...prebookData
            }
          });
        } else {
          console.error("Movie document not found");
        }
      } catch (error) {
        console.error("Error writing data to Firestore: ", error);
      }
    } else {
      console.log("Form has errors. Please correct them.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 to-yellow-300">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4 space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Prebook Your Tickets</h2>

            {/* Name, Phone, and Email Fields */}
            {['name', 'phone', 'email'].map((field) => (
              <div key={field} className="relative">
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className={`peer w-full px-3 py-2 border-b-2 ${errors[field] ? 'border-red-500' : 'border-gray-300'} bg-transparent focus:outline-none focus:border-blue-500 transition-colors`}
                  placeholder=" "
                  required={field !== 'email'}
                />
                <label
                  htmlFor={field}
                  className={`absolute left-3 -top-3.5 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-sm ${errors[field] ? 'text-red-500' : 'text-gray-400'
                    }`}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}{field !== 'email' && '*'}
                </label>
                {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
              </div>
            ))}

            {/* Location Selection */}
            <div className="relative">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location (optional)</label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`mt-1 block w-full border ${errors.location ? 'border-red-500' : 'border-gray-300'} bg-white py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>


            {/* Theatre Preference List */}
            <h3 className="text-lg font-semibold">Theatre List</h3>

            {/* First Preference */}
            <div className="relative">
              <label htmlFor="firstPreference" className="block text-sm font-medium text-gray-700">First Preference</label>
              <select
                id="firstPreference"
                name="firstPreference"
                value={formData.firstPreference}
                onChange={handleChange}
                className={`mt-1 block w-full border ${errors.firstPreference ? 'border-red-500' : 'border-gray-300'} bg-white py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select First Preference</option>
                {getAvailableTheatres('firstPreference').map(theatre => (
                  <option key={theatre.id} value={theatre.id}>{theatre['theatre-name']}</option>
                ))}
              </select>
              {errors.firstPreference && <p className="text-red-500 text-xs mt-1">{errors.firstPreference}</p>}
            </div>

            {/* Second Preference */}
            <div className="relative">
              <label htmlFor="secondPreference" className="block text-sm font-medium text-gray-700">Second Preference</label>
              <select
                id="secondPreference"
                name="secondPreference"
                value={formData.secondPreference}
                onChange={handleChange}
                className={`mt-1 block w-full border ${errors.secondPreference ? 'border-red-500' : 'border-gray-300'} bg-white py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select Second Preference</option>
                {getAvailableTheatres('secondPreference').map(theatre => (
                  <option key={theatre.id} value={theatre.id}>{theatre['theatre-name']}</option>
                ))}
              </select>
              {errors.secondPreference && <p className="text-red-500 text-xs mt-1">{errors.secondPreference}</p>}
            </div>

            {/* Third Preference */}
            <div className="relative">
              <label htmlFor="thirdPreference" className="block text-sm font-medium text-gray-700">Third Preference</label>
              <select
                id="thirdPreference"
                name="thirdPreference"
                value={formData.thirdPreference}
                onChange={handleChange}
                className={`mt-1 block w-full border ${errors.thirdPreference ? 'border-red-500' : 'border-gray-300'} bg-white py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select Third Preference</option>
                {getAvailableTheatres('thirdPreference').map(theatre => (
                  <option key={theatre.id} value={theatre.id}>{theatre['theatre-name']}</option>
                ))}
              </select>
              {errors.thirdPreference && <p className="text-red-500 text-xs mt-1">{errors.thirdPreference}</p>}
            </div>

            {/* Class Selection */}
            <div className="relative">
              <label htmlFor="class" className="block text-sm font-medium text-gray-700">Ticket Class*</label>
              <select
                id="class"
                name="class"
                value={formData.class}
                onChange={handleChange}
                className={`mt-1 block w-full border ${errors.class ? 'border-red-500' : 'border-gray-300'} bg-white py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                required
              >
                <option value="">Select Class</option>
                {seatTypes.map(type => (
                  <option key={type} value={type}>
                    {type} ({movieData?.prebookPrice?.[type]} per seat)
                  </option>
                ))}
              </select>
              {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
            </div>

            {/* Number of Seats */}
            <div className="relative">
              <label htmlFor="numberOfSeats" className="block text-sm font-medium text-gray-700">Number of Seats*</label>
              <input
                type="number"
                id="numberOfSeats"
                name="numberOfSeats"
                value={formData.numberOfSeats}
                onChange={handleChange}
                className={`mt-1 block w-full border ${errors.numberOfSeats ? 'border-red-500' : 'border-gray-300'} py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                min="1"
                max="10"
                required
              />
              {errors.numberOfSeats && <p className="text-red-500 text-xs mt-1">{errors.numberOfSeats}</p>}
            </div>

            {/* Executive Code */}
            <div className="relative">
              <label htmlFor="executiveCode" className="block text-sm font-medium text-gray-700">Executive Code</label>
              <input
                type="text"
                id="executiveCode"
                name="executiveCode"
                value={formData.executiveCode}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreedToTerms"
                  name="agreedToTerms"
                  type="checkbox"
                  onChange={handleChange}
                  checked={agreedToTerms}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreedToTerms" className="font-medium text-gray-700">I agree to the <Link to="/terms" className="text-blue-600 hover:text-blue-500">Terms and Conditions</Link>*</label>
              </div>
            </div>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="text-red-500 text-xs mt-2">
                Please correct the errors before submitting the form.
              </div>
            )}

            {/* Submit Button */}
            <div className="relative">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors"
              >
                Prebook Now
              </button>
            </div>

            {/* Amount Display */}
            {amount !== null && (
              <div className="text-center mt-4 text-lg font-semibold">
                Total Amount: ₹{amount}
              </div>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrebookingForm;
