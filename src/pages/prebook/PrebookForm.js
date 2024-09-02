import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../components/Header";
import Footer from '../components/Footer';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

function PrebookingForm() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        location: '',
        theatre: '',
        class: '',
        executiveCode: '',
        numberOfSeats: '1'
    });
    const [locations, setLocations] = useState([]);
    const [theatres, setTheatres] = useState([]);
    const [seatTypes, setSeatTypes] = useState([]);
    const [amount, setAmount] = useState(null);
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
                    }));

                    setTheatres(owners);
                    setFormData(prev => ({ ...prev, theatre: '', class: '' }));
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
                if (formData.theatre) {
                    const selectedTheatre = theatres.find(t => t.owner === formData.theatre);
                    if (selectedTheatre) {
                        const theatreDoc = doc(db, 'theatres', selectedTheatre.id);
                        const theatreSnapshot = await getDoc(theatreDoc);
    
                        if (theatreSnapshot.exists()) {
                            const theatreData = theatreSnapshot.data();
                            const seatMatrixLayout = theatreData['seat-matrix-layout'];
    
                            if (seatMatrixLayout) {
                                const screenData = seatMatrixLayout['screen-1'];
                                const seatMatrix = screenData.matrix;
    
                                const seatTypes = Object.values(seatMatrix)
                                    .flatMap(row => Object.values(row.seats)
                                    .map(seat => row.type))
                                    .filter(Boolean);
    
                                const uniqueSeatTypes = [...new Set(seatTypes)];
    
                                setSeatTypes(uniqueSeatTypes);
                                fetchAmount(selectedTheatre.id, uniqueSeatTypes);
                            } else {
                                setSeatTypes([]);
                                setAmount(null);
                            }
                        } else {
                            setSeatTypes([]);
                            setAmount(null);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching seat types: ", error);
            }
        };

        const fetchAmount = async (theatreId) => {
            try {
                if (formData.class) {
                    const showsCol = collection(db, 'shows');
                    const showsQuery = query(showsCol, where('theaterId', '==', theatreId));
                    const showsSnapshot = await getDocs(showsQuery);

                    if (!showsSnapshot.empty) {
                        const showData = showsSnapshot.docs[0].data();
                        const ticketPrices = showData.ticketPrices;
                        const selectedClassPrice = ticketPrices[formData.class];

                        if (selectedClassPrice) {
                            setAmount(selectedClassPrice * formData.numberOfSeats);
                        } else {
                            setAmount(0);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching amount:", error);
            }
        };

        fetchSeatTypes();
    }, [formData.theatre, formData.class, formData.numberOfSeats, theatres]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/payment');
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
                        <div className="relative">
                            <select
                                id="theatre"
                                name="theatre"
                                value={formData.theatre}
                                onChange={handleChange}
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                required
                            >
                                <option value="" disabled>Theatre</option>
                                {theatres.map(theatre => (
                                    <option key={theatre.id} value={theatre.owner}>{theatre.owner}</option>
                                ))}
                            </select>
                            <label
                                htmlFor="theatre"
                                className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                           peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                            ></label>
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
                                {seatTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
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
                                id="numberOfSeats"
                                name="numberOfSeats"
                                value={formData.numberOfSeats}
                                onChange={handleChange}
                                className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                placeholder=" "
                                required
                            />
                            <label
                                htmlFor="numberOfSeats"
                                className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                           peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                           peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                            >
                                Seats
                            </label>
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
                                Executive Code
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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