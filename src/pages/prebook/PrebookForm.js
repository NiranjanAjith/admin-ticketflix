import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from "../components/Header";
import Footer from '../components/Footer';
import { db } from '../../firebase';
import { collection, getDocs, query, where, addDoc, doc, updateDoc } from 'firebase/firestore';

function PrebookingForm() {
    const location = useLocation();
    const movieName = useMemo(() => location.state || '', [location.state]);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        location: '',
        theatres: [],
        class: '',
        executiveCode: '',
        numberOfSeats: '1'
    });
    const [locations, setLocations] = useState([]);
    const [theatres, setTheatres] = useState([]);
    const [seatTypes, setSeatTypes] = useState([]);
    const [amount, setAmount] = useState(null);
    const [isTheatreListOpen, setIsTheatreListOpen] = useState(false);
    const theatreListRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const theatresCol = collection(db, 'theatres');
                const theatresSnapshot = await getDocs(theatresCol);
                const theatresList = theatresSnapshot.docs.map(doc => doc.data());
                const uniqueLocations = [...new Set(theatresList.map(theatre => theatre.district))];
                setLocations(uniqueLocations);
                setTheatres([]);
                setSeatTypes([]);
            } catch (error) {
                console.error("Error fetching locations: ", error);
            }
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        const fetchTheatres = async () => {
            try {
                if (formData.location) {
                    const theatresCol = collection(db, 'theatres');
                    const theatresQuery = query(theatresCol, where('district', '==', formData.location));
                    const theatresSnapshot = await getDocs(theatresQuery);
                    const owners = theatresSnapshot.docs.map(doc => ({
                        id: doc.id,
                        owner: doc.data().owner,
                        checked: false,
                    }));
                    setTheatres(owners);
                    setFormData(prev => ({ ...prev, theatres: [], class: '' }));
                    setSeatTypes([]);
                }
            } catch (error) {
                console.error("Error fetching theatres:", error);
            }
        };
        fetchTheatres();
    }, [formData.location]);

    useEffect(() => {
        const fetchSeatTypes = async () => {
            try {
                if (formData.theatres.length > 0) {
                    const moviesCol = collection(db, 'movies');
                    const moviesQuery = query(moviesCol, where('title', '==', movieName));
                    const moviesSnapshot = await getDocs(moviesQuery);
                    if (!moviesSnapshot.empty) {
                        const movieData = moviesSnapshot.docs[0].data();
                        const prebookPrice = movieData.prebookPrice;
                        if (prebookPrice) {
                            const seatTypes = Object.keys(prebookPrice);
                            setSeatTypes(seatTypes);
                            fetchAmount(prebookPrice);
                        } else {
                            setSeatTypes([]);
                            setAmount(null);
                        }
                    } else {
                        console.warn("No movie found with the title:", movieName);
                        setSeatTypes([]);
                        setAmount(null);
                    }
                } else {
                    setSeatTypes([]);
                    setAmount(null);
                }
            } catch (error) {
                console.error("Error fetching seat types:", error);
            }
        };

        const fetchAmount = (prebookPrice) => {
            if (formData.class && prebookPrice) {
                const selectedClassPrice = prebookPrice[formData.class];
                if (selectedClassPrice) {
                    setAmount(selectedClassPrice * formData.numberOfSeats);
                } else {
                    setAmount(0);
                }
            } else {
                setAmount(null);
            }
        };

        fetchSeatTypes();
    }, [formData.theatres, formData.class, formData.numberOfSeats, movieName]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (theatreListRef.current && !theatreListRef.current.contains(event.target)) {
                setIsTheatreListOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTheatreChange = (theatreId) => {
        const updatedTheatres = theatres.map(theatre =>
            theatre.id === theatreId ? { ...theatre, checked: !theatre.checked } : theatre
        );
        setTheatres(updatedTheatres);
        const selectedTheatres = updatedTheatres
            .filter(theatre => theatre.checked)
            .map(theatre => theatre.owner);
        setFormData({ ...formData, theatres: selectedTheatres });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Write to 'prebook' collection
            const prebookData = {
                ...formData,
                movieName,
                amount,
                timestamp: new Date()
            };
            const prebookCol = collection(db, 'prebook');
            await addDoc(prebookCol, prebookData);
            console.log("Prebooking data written to Firestore");

            // Update 'movies' collection
            const moviesCol = collection(db, 'movies');
            const movieQuery = query(moviesCol, where('title', '==', movieName));
            const movieSnapshot = await getDocs(movieQuery);

            if (!movieSnapshot.empty) {
                const movieDoc = movieSnapshot.docs[0];
                const movieRef = doc(db, 'movies', movieDoc.id);
                const movieData = movieDoc.data();

                let updatedTheatres = movieData.theatres || {};

                formData.theatres.forEach(theatre => {
                    if (updatedTheatres[theatre]) {
                        updatedTheatres[theatre] += parseInt(formData.numberOfSeats);
                    } else {
                        updatedTheatres[theatre] = parseInt(formData.numberOfSeats);
                    }
                });

                await updateDoc(movieRef, { theatres: updatedTheatres });
                console.log("Movie document updated in Firestore");
            } else {
                console.warn("No movie found with the title:", movieName);
            }

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
                        {['name', 'phone'].map((field) => (
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
                                <label
                                    htmlFor={field}
                                    className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                               peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                               peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                                >
                                    {field.charAt(0).toUpperCase() + field.slice(1)}
                                </label>
                            </div>
                        ))}
                        <div className="relative">
                            <input
                                type="text"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                placeholder=" "
                            />
                            <label
                                htmlFor="email"
                                className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                           peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                            >
                                Email (optional)
                            </label>
                        </div>
                        <div className="relative">
                            <select
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                required
                            >
                                <option value="" disabled>Location</option>
                                {locations.map((loc, index) => (
                                    <option key={index} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <label
                                htmlFor="location"
                                className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                           peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                            ></label>
                        </div>
                        <div className="relative" ref={theatreListRef}>
                            <button
                                type="button"
                                onClick={() => setIsTheatreListOpen(!isTheatreListOpen)}
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                            >
                                Preferred Theatres ({formData.theatres.length} selected)
                            </button>
                            {isTheatreListOpen && (
                                <div className="absolute left-3 z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                    {theatres.map(theatre => (
                                        <div
                                            key={theatre.id}
                                            className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => handleTheatreChange(theatre.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={theatre.checked}
                                                onChange={() => {}}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-3 block text-sm text-gray-900">
                                                {theatre.owner}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                id="class"
                                name="class"
                                value={formData.class}
                                onChange={handleChange}
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                required
                            >
                                <option value="" disabled>Class</option>
                                {seatTypes.map((seatType, index) => (
                                    <option key={index} value={seatType}>{seatType}</option>
                                ))}
                            </select>
                            <label
                                htmlFor="class"
                                className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                           peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                            ></label>
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
                            <label
                                htmlFor="executiveCode"
                                className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                           peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
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
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                required
                            >
                                {[...Array(10)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>
                            <label
                                htmlFor="numberOfSeats"
                                className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                           peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                            ></label>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                        >
                            Proceed to Pay {amount}
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default PrebookingForm;