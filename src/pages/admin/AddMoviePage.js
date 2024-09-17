import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { firestore, storage } from '../../firebase';
import Header from './components/Header';
import Footer from './components/Footer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddMoviePage = () => {
    const [movie, setMovie] = useState({
        title: '',
        description: '',
        duration: '',
        genre: [],
        releaseDate: '',
        showEndDate: '',
        trailer: '',
        cast: [],
        director: '',
        language: '',
        ageRating: '',
        prebook: false,
        prebookPrice: {
            regular: '',
            gold: '',
            diamond: ''
        },
        theatreIds: [],
    });
    const [poster, setPoster] = useState(null);
    const [additionalImages, setAdditionalImages] = useState([]);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [theatres, setTheatres] = useState([]);
    const [selectedTheatres, setSelectedTheatres] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');

    useEffect(() => {
        fetchTheatres();
    }, []);

    const fetchTheatres = async () => {
        try {
            const theatresCollection = collection(firestore, 'theatres');
            const theatreSnapshot = await getDocs(theatresCollection);
            const theatreList = theatreSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTheatres(theatreList);

            // Extract unique cities
            const uniqueCities = [...new Set(theatreList.map(theatre => theatre.city))];
            setCities(uniqueCities);
        } catch (error) {
            console.error('Error fetching theatres: ', error);
            setMessage({ type: 'error', content: `Error fetching theatres: ${error.message}` });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'genre' || name === 'cast') {
            setMovie(prevState => ({
                ...prevState,
                [name]: value.split(',').map(item => item.trim())
            }));
        } else if (type === 'checkbox') {
            setMovie(prevState => ({
                ...prevState,
                [name]: checked
            }));
        } else {
            const [priceCategory, fieldName] = name.split('.');
            if (fieldName) {
                setMovie(prevState => ({
                    ...prevState,
                    [priceCategory]: {
                        ...prevState[priceCategory],
                        [fieldName]: parseFloat(value)
                    }
                }));
            } else {
                setMovie(prevState => ({
                    ...prevState,
                    [name]: name === 'duration' ? parseFloat(value) : value
                }));
            }
        }
    };

    const handleTheatreChange = (e) => {
        const theatreId = e.target.value;
        setSelectedTheatres(prevSelected => {
            if (prevSelected.includes(theatreId)) {
                return prevSelected.filter(id => id !== theatreId);
            } else {
                return [...prevSelected, theatreId];
            }
        });
    };

    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
    };

    const handlePosterChange = (e) => {
        setPoster(e.target.files[0]);
    };

    const handleAdditionalImagesChange = (e) => {
        setAdditionalImages([...e.target.files]);
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

            const additionalImageUrls = await Promise.all(
                additionalImages.map(async (image, index) => {
                    const imageRef = ref(storage, `movie_images/${movie.title}_${Date.now()}_${index}`);
                    await uploadBytes(imageRef, image);
                    return getDownloadURL(imageRef);
                })
            );

            const movieData = {
                ...movie,
                posterUrl,
                additionalImageUrls,
                releaseDate: Timestamp.fromDate(releaseDate),
                showEndDate: Timestamp.fromDate(showEndDate),
                theatreIds: selectedTheatres,
            };

            await addDoc(collection(firestore, 'movies'), movieData);

            setMessage({ type: 'success', content: 'Movie added successfully!' });
            // Reset form fields
            setMovie({
                title: '',
                description: '',
                duration: '',
                genre: [],
                releaseDate: '',
                showEndDate: '',
                trailer: '',
                cast: [],
                director: '',
                language: '',
                ageRating: '',
                prebook: false,
                prebookPrice: {
                    regular: '',
                    gold: '',
                    diamond: ''
                },
                theatreIds: [],
            });
            setPoster(null);
            setAdditionalImages([]);
            setSelectedTheatres([]);
            setSelectedCity('');
            document.getElementById('poster').value = '';
            document.getElementById('additionalImages').value = '';
        } catch (error) {
            console.error('Error adding movie: ', error);
            setMessage({ type: 'error', content: `Error adding movie: ${error.message}` });
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
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
                            <textarea id="description" name="description" value={movie.description} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"></textarea>
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes):</label>
                            <input type="number" id="duration" name="duration" value={movie.duration} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="genre" className="block text-sm font-medium text-gray-700">Genre (comma-separated):</label>
                            <input type="text" id="genre" name="genre" value={movie.genre.join(', ')} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
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
                            <label htmlFor="trailer" className="block text-sm font-medium text-gray-700">Trailer URL:</label>
                            <input type="url" id="trailer" name="trailer" value={movie.trailer} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="cast" className="block text-sm font-medium text-gray-700">Cast (comma-separated):</label>
                            <input type="text" id="cast" name="cast" value={movie.cast.join(', ')} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="director" className="block text-sm font-medium text-gray-700">Director:</label>
                            <input type="text" id="director" name="director" value={movie.director} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700">Language:</label>
                            <input type="text" id="language" name="language" value={movie.language} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="ageRating" className="block text-sm font-medium text-gray-700">Age Rating:</label>
                            <input type="text" id="ageRating" name="ageRating" value={movie.ageRating} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="prebook"
                                name="prebook"
                                checked={movie.prebook}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="prebook" className="ml-2 block text-sm text-gray-900">
                                Enable Prebook
                            </label>
                        </div>
                        {movie.prebook && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Prebook Price:</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="prebookPrice.regular" className="block text-sm font-medium text-gray-700">Regular:</label>
                                        <input type="number" id="prebookPrice.regular" name="prebookPrice.regular" value={movie.prebookPrice.regular} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                    </div>
                                    <div>
                                        <label htmlFor="prebookPrice.gold" className="block text-sm font-medium text-gray-700">Gold:</label>
                                        <input type="number" id="prebookPrice.gold" name="prebookPrice.gold" value={movie.prebookPrice.gold} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                    </div>
                                    <div>
                                        <label htmlFor="prebookPrice.diamond" className="block text-sm font-medium text-gray-700">Diamond:</label>
                                        <input type="number" id="prebookPrice.diamond" name="prebookPrice.diamond" value={movie.prebookPrice.diamond} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Theatres:</label>
                            <div className="mt-2 mb-4">
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700">Filter by City:</label>
                                <select
                                    id="city"
                                    name="city"
                                    value={selectedCity}
                                    onChange={handleCityChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">All Cities</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                {theatres
                                    .filter(theatre => !selectedCity || theatre.city === selectedCity)
                                    .map(theatre => (
                                        <div key={theatre.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`theatre-${theatre.id}`}
                                                value={theatre.id}
                                                checked={selectedTheatres.includes(theatre.id)}
                                                onChange={handleTheatreChange}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`theatre-${theatre.id}`} className="ml-2 block text-sm text-gray-900">
                                                {theatre['theatre-name']} ({theatre.city})
                                            </label>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                        <div>
                            <label htmlFor="poster" className="block text-sm font-medium text-gray-700">Poster:</label>
                            <input 
                                type="file" 
                                id="poster" 
                                onChange={handlePosterChange} 
                                accept="image/*"
                                required 
                                className="mt-1 block w-full text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-300 cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                        </div>
                        <div>
                            <label htmlFor="additionalImages" className="block text-sm font-medium text-gray-700">Additional Images:</label>
                            <input 
                                type="file" 
                                id="additionalImages" 
                                onChange={handleAdditionalImagesChange} 
                                multiple 
                                accept="image/*"
                                className="mt-1 block w-full text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-300 cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                            />
                        </div>
                        <div>
                            <button 
                                type="submit" 
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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