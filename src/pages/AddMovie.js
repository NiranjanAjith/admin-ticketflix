import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore, storage } from '../firebase';
import Header from '../components/Header';
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
        }
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
        if (e.target.files[0]) {
            setPoster(e.target.files[0]);
        }
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
                }
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
                }
            });
            setPoster(null);
            document.getElementById('poster').value = '';
        } catch (error) {
            console.error('Error adding movie: ', error);
            setMessage({ type: 'error', content: 'Error adding movie. Please try again.' });
        }
    };

    return (
        <div>
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
                        <label htmlFor="description">Description:</label>
                        <textarea id="description" name="description" value={movie.description} onChange={handleChange} required></textarea>
                    </div>
                    <div>
                        <label htmlFor="duration">Duration (HH:MM:SS):</label>
                        <input type="text" id="duration" name="duration" value={movie.duration} onChange={handleChange} required pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}" />
                    </div>
                    <div>
                        <label htmlFor="genre">Genre (comma-separated):</label>
                        <input type="text" id="genre" name="genre" value={movie.genre.join(', ')} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="rating">Rating:</label>
                        <input type="number" step="0.1" id="rating" name="rating" value={movie.rating} onChange={handleChange} required min="0" max="5" />
                    </div>
                    <div>
                        <label htmlFor="releaseDate">Release Date:</label>
                        <input type="datetime-local" id="releaseDate" name="releaseDate" value={movie.releaseDate} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="showtimes.firstShow">First Show:</label>
                        <input type="datetime-local" id="showtimes.firstShow" name="showtimes.firstShow" value={movie.showtimes.firstShow} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="showtimes.Matinee">Matinee:</label>
                        <input type="datetime-local" id="showtimes.Matinee" name="showtimes.Matinee" value={movie.showtimes.Matinee} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="poster">Poster:</label>
                        <input type="file" id="poster" name="poster" accept="image/*" onChange={handlePosterChange} required />
                    </div>
                    <button type="submit">Add Movie</button>
                </form>
            </div>
        </div>
    );
};

export default AddMovie;