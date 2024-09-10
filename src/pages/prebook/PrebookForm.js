import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from "../components/Header";
import Footer from '../components/Footer';
import { db } from '../../firebase';
import { collection, getDocs, query, where, addDoc, doc, getDoc } from 'firebase/firestore';

function PrebookingForm() {
    const location = useLocation();
    const movieId = location.state?.movieId || '';
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        location: '',
        firstPreference: '',
        secondPreference: '',
        thirdPreference: '',
        class: '',
        executiveCode: '',
        numberOfSeats: '1'
    });

    const [movieData, setMovieData] = useState(null);
    const [theatres, setTheatres] = useState([]);
    const [filteredTheatres, setFilteredTheatres] = useState([]);
    const [locations, setLocations] = useState([]);
    const [seatTypes, setSeatTypes] = useState([]);
    const [amount, setAmount] = useState(null);
    const [firstPreferenceCount, setFirstPreferenceCount] = useState({});
    const [secondPreferenceCount, setSecondPreferenceCount] = useState({});
    const [thirdPreferenceCount, setThirdPreferenceCount] = useState({});

    useEffect(() => {
        const fetchMovieAndTheatres = async () => {
            try {
                // Fetch movie data
                const movieRef = doc(db, 'movies', movieId);
                const movieSnap = await getDoc(movieRef);
                if (movieSnap.exists()) {
                    const movie = movieSnap.data();
                    setMovieData(movie);
                    setSeatTypes(Object.keys(movie.prebookPrice || {}));

                    // Fetch theatres
                    const theatrePromises = movie.theatreIds.map(id => getDoc(doc(db, 'theatres', id)));
                    const theatreSnapshots = await Promise.all(theatrePromises);
                    const theatreData = theatreSnapshots.map(snap => ({
                        id: snap.id,
                        ...snap.data()
                    }));
                    setTheatres(theatreData);

                    // Extract unique locations
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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        const numberOfSeats = parseInt(formData.numberOfSeats, 10);

        if (name === 'firstPreference') {
            setFirstPreferenceCount(prev => ({
                ...prev,
                [value]: (prev[value] || 0) + numberOfSeats
            }));
        } else if (name === 'secondPreference') {
            setSecondPreferenceCount(prev => ({
                ...prev,
                [value]: (prev[value] || 0) + numberOfSeats
            }));
        } else if (name === 'thirdPreference') {
            setThirdPreferenceCount(prev => ({
                ...prev,
                [value]: (prev[value] || 0) + numberOfSeats
            }));
        }
    };

    const getAvailableTheatres = (preference) => {
        return filteredTheatres.filter(theatre => {
            if (preference === 'firstPreference') return true;
            if (preference === 'secondPreference') return theatre.id !== formData.firstPreference;
            if (preference === 'thirdPreference') return theatre.id !== formData.firstPreference && theatre.id !== formData.secondPreference;
        });
    };

    const handleSubmit = async (e) => {
        const numberOfSeats = parseInt(formData.numberOfSeats, 10);
        e.preventDefault();
        try {
            const prebookData = {
                ...formData,
                movieId,
                amount,
                preferenceCount: {
                    first: numberOfSeats,
                    second: numberOfSeats,
                    third: numberOfSeats
                },
                timestamp: new Date()
            };
            const prebookCol = collection(db, 'prebook');
            await addDoc(prebookCol, prebookData);
            console.log("Prebooking data written to Firestore");
            navigate('/payment');
        } catch (error) {
            console.error("Error writing data to Firestore: ", error);
        }
    };

    return (
        <div className="App min-h-screen flex flex-col bg-yellow-50">
            <Header />
            <main className="flex-grow flex items-center pl-48">
                <div className="w-full max-w-2xl mt-10 mb-12">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {['name', 'phone', 'email'].map((field) => (
                            <div key={field} className="relative">
                                <input
                                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                                    id={field}
                                    name={field}
                                    value={formData[field]}
                                    onChange={handleChange}
                                    className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                    placeholder=" "
                                    required={field !== 'email'}
                                />
                                <label htmlFor={field} className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
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
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                required
                            >
                                <option value="">Select Location</option>
                                {locations.map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <label htmlFor="location" className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
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
                                    className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
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
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
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
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                placeholder=" "
                            />
                            <label htmlFor="executiveCode" className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                                Executive Code (optional)
                            </label>
                        </div>

                        <div className="relative">
                            <select
                                id="numberOfSeats"
                                name="numberOfSeats"
                                value={formData.numberOfSeats}
                                onChange={handleChange}
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                required
                            >
                                {[...Array(10)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>
                            <label htmlFor="numberOfSeats" className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                                Number of Seats
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                        >
                            Proceed to Pay {amount ? `₹${amount}` : ''}
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default PrebookingForm;
