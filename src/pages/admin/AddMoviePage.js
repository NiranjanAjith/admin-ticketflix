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
    });
    const [poster, setPoster] = useState(null);
    const [message, setMessage] = useState({ type: '', content: '' });

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
                [name]: name === 'duration' ? parseFloat(value) : value
            }));
        }
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
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700">Language:</label>
                            <input type="text" id="language" name="language" value={movie.language} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div>
                            <label htmlFor="ageRating" className="block text-sm font-medium text-gray-700">Age Rating:</label>
                            <input type="text" id="ageRating" name="ageRating" value={movie.ageRating} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
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