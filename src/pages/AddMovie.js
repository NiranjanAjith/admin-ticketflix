import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore, storage } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Dashboard.css'; // Assuming you have this CSS file

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
            matinee: '',
            lastShow: ''
        },
        showEndDate: '',
        trailer: ''
    });
    const [poster, setPoster] = useState(null);
    const [message, setMessage] = useState({ type: '', content: '' });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });

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
                    matinee: Timestamp.fromDate(new Date(movie.showtimes.matinee)),
                    lastShow: Timestamp.fromDate(new Date(movie.showtimes.lastShow))
                },
                showEndDate: Timestamp.fromDate(new Date(movie.showEndDate))
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
                    matinee: '',
                    lastShow: ''
                },
                showEndDate: '',
                trailer: ''
            });
            setPoster(null);
            document.getElementById('poster').value = '';
        } catch (error) {
            console.error('Error adding movie: ', error);
            setMessage({ type: 'error', content: `Error adding movie: ${error.message}` });
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
                <form onSubmit={handleSubmit} className="add-movie-form">
                    <div className="form-group">
                        <label htmlFor="title">Title:</label>
                        <input type="text" id="title" name="title" value={movie.title} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="releaseDate">Release Date:</label>
                        <input type="date" id="releaseDate" name="releaseDate" value={movie.releaseDate} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="genre">Genre (comma-separated):</label>
                        <input type="text" id="genre" name="genre" value={movie.genre.join(', ')} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="duration">Duration (minutes):</label>
                        <input type="number" id="duration" name="duration" value={movie.duration} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea id="description" name="description" value={movie.description} onChange={handleChange} required></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="rating">Rating:</label>
                        <input type="number" step="0.1" id="rating" name="rating" value={movie.rating} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="trailer">Trailer URL:</label>
                        <input type="url" id="trailer" name="trailer" value={movie.trailer} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <h3>Showtimes</h3>
                        <div>
                            <label htmlFor="firstShow">First Show:</label>
                            <input type="datetime-local" id="firstShow" name="showtimes.firstShow" value={movie.showtimes.firstShow} onChange={handleChange} required />
                        </div>
                        <div>
                            <label htmlFor="matinee">Matinee:</label>
                            <input type="datetime-local" id="matinee" name="showtimes.matinee" value={movie.showtimes.matinee} onChange={handleChange} required />
                        </div>
                        <div>
                            <label htmlFor="lastShow">Last Show:</label>
                            <input type="datetime-local" id="lastShow" name="showtimes.lastShow" value={movie.showtimes.lastShow} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="showEndDate">Show End Date:</label>
                        <input type="date" id="showEndDate" name="showEndDate" value={movie.showEndDate} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="poster">Poster:</label>
                        <input type="file" id="poster" name="poster" accept="image/*" onChange={handlePosterChange} required />
                    </div>
                    <button type="submit" className="btn-submit">Add Movie</button>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default AddMovie;