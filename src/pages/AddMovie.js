import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { firestore, storage } from './../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AddMovie.css';

const AddMovie = () => {
    const [movie, setMovie] = useState({
        title: '',
        director: '',
        releaseDate: '',
        duration: '',
        genre: '',
        description: '',
        posterUrl: '',
        showtimes: [''],
    });
    const [poster, setPoster] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMovie(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleShowtimeChange = (index, value) => {
        const newShowtimes = [...movie.showtimes];
        newShowtimes[index] = value;
        setMovie(prevState => ({
            ...prevState,
            showtimes: newShowtimes
        }));
    };

    const addShowtime = () => {
        setMovie(prevState => ({
            ...prevState,
            showtimes: [...prevState.showtimes, '']
        }));
    };

    const handlePosterChange = (e) => {
        if (e.target.files[0]) {
            setPoster(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let posterUrl = movie.posterUrl;
            if (poster) {
                const storageRef = ref(storage, `posters/${poster.name}`);
                await uploadBytes(storageRef, poster);
                posterUrl = await getDownloadURL(storageRef);
            }

            await addDoc(collection(firestore, 'movies'), {
                ...movie,
                posterUrl
            });
            alert('Movie added successfully!');
            setMovie({
                title: '',
                director: '',
                releaseDate: '',
                duration: '',
                genre: '',
                description: '',
                posterUrl: '',
                showtimes: [''],
            });
            setPoster(null);
        } catch (error) {
            console.error('Error adding movie: ', error);
            alert('Error adding movie. Please try again.');
        }
    };

    return (
        <div className="add-movie-page">
            <Header />
            <main className="add-movie-main">
                <div className="add-movie-container">
                    <h2>Add New Movie</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="title">Title:</label>
                            <input type="text" id="title" name="title" value={movie.title} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="director">Director:</label>
                            <input type="text" id="director" name="director" value={movie.director} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="releaseDate">Release Date:</label>
                            <input type="date" id="releaseDate" name="releaseDate" value={movie.releaseDate} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="duration">Duration (minutes):</label>
                            <input type="number" id="duration" name="duration" value={movie.duration} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="genre">Genre:</label>
                            <input type="text" id="genre" name="genre" value={movie.genre} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">Description:</label>
                            <textarea id="description" name="description" value={movie.description} onChange={handleChange} required></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="poster">Movie Poster:</label>
                            <input type="file" id="poster" onChange={handlePosterChange} accept="image/*" />
                        </div>
                        <div className="form-group">
                            <label>Showtimes:</label>
                            {movie.showtimes.map((showtime, index) => (
                                <input
                                    key={index}
                                    type="datetime-local"
                                    value={showtime}
                                    onChange={(e) => handleShowtimeChange(index, e.target.value)}
                                    required
                                />
                            ))}
                            <button type="button" onClick={addShowtime} className="add-showtime-button">Add Showtime</button>
                        </div>
                        <button type="submit" className="submit-button">Add Movie</button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AddMovie;