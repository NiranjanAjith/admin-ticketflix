import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { firestore, storage } from '../../firebase';
import Header from './components/Header';
import Footer from './components/Footer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaPlus, FaTrash } from 'react-icons/fa';

const AddMoviePage = () => {
    const [movie, setMovie] = useState({
        title: '',
        description: '',
        duration: '',
        genre: [],
        rating: 0,
        releaseDate: '',
        showEndDate: '',
        trailer: '',
        cast: [],
        director: '',
    });
    const [poster, setPoster] = useState(null);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [theaters, setTheaters] = useState([]);
    const [screenSelections, setScreenSelections] = useState({});
    const [showtimes, setShowtimes] = useState({});

    useEffect(() => {
        const fetchTheaters = async () => {
            const theatersCollection = collection(firestore, 'theatres');
            const theaterSnapshot = await getDocs(theatersCollection);
            const theaterList = theaterSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTheaters(theaterList);
        };
        fetchTheaters();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'genre' || name === 'cast') {
            setMovie(prevState => ({
                ...prevState,
                [name]: value.split(',').map(item => item.trim())
            }));
        } else {
            setMovie(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handleTheaterChange = (e) => {
        const theaterId = e.target.value;
        const isChecked = e.target.checked;
        
        if (isChecked) {
            setScreenSelections(prev => ({
                ...prev,
                [theaterId]: {}
            }));
        } else {
            setScreenSelections(prev => {
                const { [theaterId]: _, ...rest } = prev;
                return rest;
            });
            setShowtimes(prev => {
                const { [theaterId]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleScreenChange = (theaterId, screenName) => {
        setScreenSelections(prev => ({
            ...prev,
            [theaterId]: {
                ...prev[theaterId],
                [screenName]: !prev[theaterId]?.[screenName]
            }
        }));

        if (screenSelections[theaterId]?.[screenName]) {
            setShowtimes(prev => ({
                ...prev,
                [theaterId]: {
                    ...prev[theaterId],
                    [screenName]: []
                }
            }));
        }
    };

    const addShowtime = (theaterId, screenName) => {
        const theater = theaters.find(t => t.id === theaterId);
        const seatTypes = new Set();
        Object.values(theater['seat-matrix-layout'][screenName].matrix).forEach(row => {
            seatTypes.add(row.type);
        });

        setShowtimes(prev => ({
            ...prev,
            [theaterId]: {
                ...prev[theaterId],
                [screenName]: [
                    ...(prev[theaterId]?.[screenName] || []),
                    { 
                        date: '',
                        time: '',
                        ticketPrices: Array.from(seatTypes).reduce((acc, type) => ({...acc, [type]: ''}), {})
                    }
                ]
            }
        }));
    };

    const removeShowtime = (theaterId, screenName, index) => {
        setShowtimes(prev => ({
            ...prev,
            [theaterId]: {
                ...prev[theaterId],
                [screenName]: prev[theaterId][screenName].filter((_, i) => i !== index)
            }
        }));
    };

    const handleShowtimeChange = (theaterId, screenName, index, field, value) => {
        setShowtimes(prev => ({
            ...prev,
            [theaterId]: {
                ...prev[theaterId],
                [screenName]: prev[theaterId][screenName].map((showtime, i) => 
                    i === index ? { ...showtime, [field]: value } : showtime
                )
            }
        }));
    };

    const handleTicketPriceChange = (theaterId, screenName, showtimeIndex, seatType, price) => {
        setShowtimes(prev => ({
            ...prev,
            [theaterId]: {
                ...prev[theaterId],
                [screenName]: prev[theaterId][screenName].map((showtime, i) => 
                    i === showtimeIndex ? {
                        ...showtime,
                        ticketPrices: {
                            ...showtime.ticketPrices,
                            [seatType]: price
                        }
                    } : showtime
                )
            }
        }));
    };

    const handlePosterChange = (e) => {
        setPoster(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });

        if (!movie.title || !movie.releaseDate || !movie.showEndDate) {
            setMessage({ type: 'error', content: 'Please fill in all required fields.' });
            return;
        }

        if (!poster) {
            setMessage({ type: 'error', content: 'Please select a poster image.' });
            return;
        }

        const releaseDate = new Date(movie.releaseDate);
        const showEndDate = new Date(movie.showEndDate);

        if (isNaN(releaseDate.getTime()) || isNaN(showEndDate.getTime())) {
            setMessage({ type: 'error', content: 'Invalid date format. Please use YYYY-MM-DD.' });
            return;
        }

        if (releaseDate > showEndDate) {
            setMessage({ type: 'error', content: 'Release date must be before or equal to show end date.' });
            return;
        }

        try {
            const storageRef = ref(storage, `posters/${movie.title}_${Date.now()}`);
            await uploadBytes(storageRef, poster);
            const posterUrl = await getDownloadURL(storageRef);

            // Add movie to 'movies' collection
            const movieData = {
                ...movie,
                posterUrl,
                rating: parseFloat(movie.rating),
                releaseDate: Timestamp.fromDate(releaseDate),
                showEndDate: Timestamp.fromDate(showEndDate),
            };

            const movieDocRef = await addDoc(collection(firestore, 'movies'), movieData);

            // Add shows to 'shows' collection
            const showsPromises = Object.entries(screenSelections).flatMap(([theaterId, screens]) => 
                Object.entries(screens).flatMap(([screenName, isSelected]) => {
                    if (isSelected) {
                        return showtimes[theaterId][screenName].map(async (showtime) => {
                            const showtimeDate = new Date(`${showtime.date}T${showtime.time}`);
                            if (isNaN(showtimeDate.getTime())) {
                                throw new Error(`Invalid showtime: ${showtime.date} ${showtime.time}`);
                            }
                            const showData = {
                                movieId: movieDocRef.id,
                                theaterId,
                                screenName,
                                datetime: Timestamp.fromDate(showtimeDate),
                                ticketPrices: showtime.ticketPrices,
                                seatMatrix: theaters.find(t => t.id === theaterId)['seat-matrix-layout'][screenName]
                            };
                            return addDoc(collection(firestore, 'shows'), showData);
                        });
                    }
                    return [];
                })
            );

            await Promise.all(showsPromises);
            
            setMessage({ type: 'success', content: 'Movie and shows added successfully!' });
            // Reset form fields
            setMovie({
                title: '',
                description: '',
                duration: '',
                genre: [],
                rating: 0,
                releaseDate: '',
                showEndDate: '',
                trailer: '',
                cast: [],
                director: '',
            });
            setPoster(null);
            setScreenSelections({});
            setShowtimes({});
            document.getElementById('poster').value = '';
        } catch (error) {
            console.error('Error adding movie and shows: ', error);
            setMessage({ type: 'error', content: `Error adding movie and shows: ${error.message}` });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Movie</h2>
                    {message.content && (
                        <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.content}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title:</label>
                            <input type="text" id="title" name="title" value={movie.title} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700">Release Date:</label>
                            <input type="date" id="releaseDate" name="releaseDate" value={movie.releaseDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="showEndDate" className="block text-sm font-medium text-gray-700">Show End Date:</label>
                            <input type="date" id="showEndDate" name="showEndDate" value={movie.showEndDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="genre" className="block text-sm font-medium text-gray-700">Genre (comma-separated):</label>
                            <input type="text" id="genre" name="genre" value={movie.genre.join(', ')} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes):</label>
                            <input type="number" id="duration" name="duration" value={movie.duration} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
                            <textarea id="description" name="description" value={movie.description} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"></textarea>
                        </div>
                        <div>
                            <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Rating:</label>
                            <input type="number" step="0.1" id="rating" name="rating" value={movie.rating} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="trailer" className="block text-sm font-medium text-gray-700">Trailer URL:</label>
                            <input type="url" id="trailer" name="trailer" value={movie.trailer} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="director" className="block text-sm font-medium text-gray-700">Director:</label>
                            <input type="text" id="director" name="director" value={movie.director} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="cast" className="block text-sm font-medium text-gray-700">Cast (comma-separated):</label>
                            <input type="text" id="cast" name="cast" value={movie.cast.join(', ')} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Theaters and Screens:</label>
                            {theaters.map(theater => (
                                <div key={theater.id} className="mb-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            value={theater.id}
                                            checked={!!screenSelections[theater.id]}
                                            onChange={handleTheaterChange}
                                            className="form-checkbox h-5 w-5 text-indigo-600"
                                        />
                                        <span className="ml-2 text-gray-700">{theater['theatre-name']}</span>
                                    </label>
                                    {screenSelections[theater.id] && (
                                        <div className="ml-6 mt-2 space-y-2">
                                            {Object.keys(theater['seat-matrix-layout']).map(screenName => (
                                                <label key={screenName} className="inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={screenSelections[theater.id][screenName] || false}
                                                        onChange={() => handleScreenChange(theater.id, screenName)}
                                                        className="form-checkbox h-5 w-5 text-indigo-600"
                                                    />
                                                    <span className="ml-2 text-gray-700">{screenName}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {Object.entries(screenSelections).map(([theaterId, screens]) => (
                            <div key={theaterId} className="mt-6 p-4 border border-gray-200 rounded-md">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {theaters.find(t => t.id === theaterId)['theatre-name']}
                                </h3>
                                
                                {Object.entries(screens).map(([screenName, isSelected]) => isSelected && (
                                    <div key={screenName} className="mb-4">
                                        <h4 className="text-md font-medium text-gray-800 mb-2">{screenName}</h4>
                                        {showtimes[theaterId]?.[screenName]?.map((showtime, index) => (
                                            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <input
                                                        type="date"
                                                        value={showtime.date}
                                                        onChange={(e) => handleShowtimeChange(theaterId, screenName, index, 'date', e.target.value)}
                                                        className="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                    />
                                                    <input
                                                        type="time"
                                                        value={showtime.time}
                                                        onChange={(e) => handleShowtimeChange(theaterId, screenName, index, 'time', e.target.value)}
                                                        className="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeShowtime(theaterId, screenName, index)}
                                                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                                <div className="mt-2">
                                                    <h5 className="text-sm font-medium text-gray-700 mb-1">Ticket Prices:</h5>
                                                    {Object.entries(showtime.ticketPrices).map(([seatType, price]) => (
                                                        <div key={seatType} className="flex items-center space-x-2 mb-2">
                                                            <label className="w-24 text-sm font-medium text-gray-700">{seatType}:</label>
                                                            <input
                                                                type="number"
                                                                value={price}
                                                                onChange={(e) => handleTicketPriceChange(theaterId, screenName, index, seatType, e.target.value)}
                                                                className="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                                placeholder="Price"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addShowtime(theaterId, screenName)}
                                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                                        >
                                            <FaPlus className="mr-2" /> Add Showtime
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div className="mt-6">
                            <label htmlFor="poster" className="block text-sm font-medium text-gray-700 mb-2">Poster:</label>
                            <input
                                type="file"
                                id="poster"
                                name="poster"
                                onChange={handlePosterChange}
                                required
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-indigo-50 file:text-indigo-700
                                    hover:file:bg-indigo-100"
                            />
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                            >
                                Add Movie
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AddMoviePage;