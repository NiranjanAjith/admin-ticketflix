import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore, storage } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddMovie = () => {
    const [movie, setMovie] = useState({
        title: '',
        description: '',
        duration: '',
        genre: [],
        rating: 0,
        releaseDate: '',
        showtimes: {
            firstShow: '',
            Matinee: ''
        },
        showEndDate: {}  // Added state for show end dates
    });
    const [poster, setPoster] = useState(null);
    const [message, setMessage] = useState({ type: '', content: '' });

    // Added state variables for showtimes and show end dates
    const [showTimeKey, setShowTimeKey] = useState('');
    const [showTimeValue, setShowTimeValue] = useState('');
    const [showEndDateKey, setShowEndDateKey] = useState('');
    const [showEndDateValue, setShowEndDateValue] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'genre') {
            setMovie(prevState => ({
                ...prevState,
                [name]: value.split(',').map(item => item.trim())
            }));
        } else if (name.startsWith('showtimes.')) {
            const [, key] = name.split('.');
            setMovie(prevState => ({
                ...prevState,
                showtimes: {
                    ...prevState.showtimes,
                    [key]: value
                }
            }));
        } else if (name.startsWith('showEndDate.')) {
            const [, key] = name.split('.');
            setMovie(prevState => ({
                ...prevState,
                showEndDate: {
                    ...prevState.showEndDate,
                    [key]: value
                }
            }));
        } else {
            setMovie(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handlePosterChange = (e) => {
        setPoster(e.target.files[0]);
    };

    const addShowTime = () => {
        setMovie(prevState => ({
            ...prevState,
            showtimes: {
                ...prevState.showtimes,
                [showTimeKey]: showTimeValue
            }
        }));
        setShowTimeKey('');
        setShowTimeValue('');
    };

    const addShowEndDate = () => {
        setMovie(prevState => ({
            ...prevState,
            showEndDate: {
                ...prevState.showEndDate,
                [showEndDateKey]: showEndDateValue
            }
        }));
        setShowEndDateKey('');
        setShowEndDateValue('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!poster) {
            setMessage({ type: 'error', content: 'Please select a poster image.' });
            return;
        }
        try {
            const storageRef = ref(storage, `posters/${movie.title}_${Date.now()}`);
            await uploadBytes(storageRef, poster);
            const posterUrl = await getDownloadURL(storageRef);

            const movieData = {
                ...movie,
                posterUrl,
                rating: parseFloat(movie.rating),
                releaseDate: Timestamp.fromDate(new Date(movie.releaseDate)),
                showtimes: {
                    firstShow: Timestamp.fromDate(new Date(movie.showtimes.firstShow)),
                    Matinee: Timestamp.fromDate(new Date(movie.showtimes.Matinee))
                },
                showEndDate: Object.fromEntries(
                    Object.entries(movie.showEndDate).map(([key, date]) => [key, Timestamp.fromDate(new Date(date))])
                )
            };

            await addDoc(collection(firestore, 'movies'), movieData);
            
            setMessage({ type: 'success', content: 'Movie added successfully!' });
            setMovie({
                title: '',
                description: '',
                duration: '',
                genre: [],
                rating: 0,
                releaseDate: '',
                showtimes: {
                    firstShow: '',
                    Matinee: ''
                },
                showEndDate: {}
            });
            setPoster(null);
            document.getElementById('poster').value = '';
        } catch (error) {
            console.error('Error adding movie: ', error);
            setMessage({ type: 'error', content: 'Error adding movie. Please try again.' });
        }
    };

    return (
        <div className="add-movie-page">
            <Header />
            <div className="add-movie-container">
                <h2>Add New Movie</h2>
                {message.content && (
                    <div className={`message ${message.type}-message`}>
                        {message.content}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="title">Title:</label>
                        <input type="text" id="title" name="title" value={movie.title} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="releaseDate">Release Date:</label>
                        <input type="date" id="releaseDate" name="releaseDate" value={movie.releaseDate} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="genre">Genre (comma-separated):</label>
                        <input type="text" id="genre" name="genre" value={movie.genre} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="duration">Duration (minutes):</label>
                        <input type="number" id="duration" name="duration" value={movie.duration} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="description">Description:</label>
                        <textarea id="description" name="description" value={movie.description} onChange={handleChange} required></textarea>
                    </div>
                    <div>
                        <label htmlFor="rating">Rating:</label>
                        <input type="number" step="0.1" id="rating" name="rating" value={movie.rating} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="trailer">Trailer URL:</label>
                        <input type="url" id="trailer" name="trailer" value={movie.trailer} onChange={handleChange} required />
                    </div>
                    <div>
                        <h3>Showtimes</h3>
                        {Object.entries(movie.showtimes).map(([key, value]) => (
                            <div key={key}>
                                {key}: {value}
                            </div>
                        ))}
                        <input
                            type="text"
                            placeholder="Show Time Key"
                            value={showTimeKey}
                            onChange={(e) => setShowTimeKey(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Show Time Value"
                            value={showTimeValue}
                            onChange={(e) => setShowTimeValue(e.target.value)}
                        />
                        <button type="button" onClick={addShowTime}>Add Showtime</button>
                    </div>
                    <div>
                        <h3>Show End Dates</h3>
                        {Object.entries(movie.showEndDate).map(([key, value]) => (
                            <div key={key}>
                                {key}: {value}
                            </div>
                        ))}
                        <input
                            type="text"
                            placeholder="Show End Date Key"
                            value={showEndDateKey}
                            onChange={(e) => setShowEndDateKey(e.target.value)}
                        />
                        <input
                            type="date"
                            value={showEndDateValue}
                            onChange={(e) => setShowEndDateValue(e.target.value)}
                        />
                        <button type="button" onClick={addShowEndDate}>Add Show End Date</button>
                    </div>
                    <div>
                        <label htmlFor="poster">Poster:</label>
                        <input type="file" id="poster" name="poster" accept="image/*" onChange={handlePosterChange} required />
                    </div>
                    <button type="submit">Add Movie</button>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default AddMovie;
