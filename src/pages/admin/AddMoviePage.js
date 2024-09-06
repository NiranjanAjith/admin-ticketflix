import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
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
        prebookPrice: {
            regular: '',
            gold: '',
            diamond: ''
        },
        theatreList: {},
    });
    const [poster, setPoster] = useState(null);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [theatreInput, setTheatreInput] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'genre' || name === 'cast') {
            setMovie(prevState => ({
                ...prevState,
                [name]: value.split(',').map(item => item.trim())
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
        setTheatreInput(e.target.value);
    };

    const handleTheatreSubmit = (e) => {
        e.preventDefault();
        const theatres = theatreInput.split(',').map(theatre => theatre.trim());
        const theatreList = {};
        theatres.forEach(theatre => {
            theatreList[theatre] = 0;
        });
        setMovie(prevState => ({
            ...prevState,
            theatreList: {
                ...prevState.theatreList,
                ...theatreList
            }
        }));
        setTheatreInput('');
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

            const movieData = {
                ...movie,
                posterUrl,
                releaseDate: Timestamp.fromDate(releaseDate),
                showEndDate: Timestamp.fromDate(showEndDate),
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
                prebookPrice: {
                    regular: '',
                    gold: '',
                    diamond: ''
                },
                theatreList: {},
            });
            setPoster(null);
            document.getElementById('poster').value = '';
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
                        <div>
                            <label htmlFor="theatres" className="block text-sm font-medium text-gray-700">Theatres:</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    id="theatres"
                                    value={theatreInput}
                                    onChange={handleTheatreChange}
                                    placeholder="comma separated, 'theatre_name location' format"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={handleTheatreSubmit}
                                    className="ml-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Add Theatres
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-700">Added Theatres:</h3>
                            <ul className="mt-1 list-disc list-inside">
                                {Object.keys(movie.theatreList).map((theatre, index) => (
                                    <li key={index}>{theatre}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <label htmlFor="poster" className="block text-sm font-medium text-gray-700">Poster:</label>
                            <input type="file" id="poster" onChange={handlePosterChange} required className="mt-1 block w-full text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-300 cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
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