import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
// import { db } from '../firebase';
import { firestore } from '../firebase';
import Header from '../components/header';

const AddMovie = () => {
    const [movie, setMovie] = useState({
        title: '',
        director: '',
        releaseDate: '',
        duration: '',
        genre: '',
        description: '',
        posterUrl: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMovie(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(firestore, 'movies'), movie); // Update this line
            alert('Movie added successfully!');
            setMovie({
                title: '',
                director: '',
                releaseDate: '',
                duration: '',
                genre: '',
                description: '',
                posterUrl: '',
            });
        } catch (error) {
            console.error('Error adding movie: ', error);
            alert('Error adding movie. Please try again.');
        }
    };

    return (
        <div>
            <Header />
            <div className="add-movie-container">
                <h2>Add New Movie</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="title">Title:</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={movie.title}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="director">Director:</label>
                        <input
                            type="text"
                            id="director"
                            name="director"
                            value={movie.director}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="releaseDate">Release Date:</label>
                        <input
                            type="date"
                            id="releaseDate"
                            name="releaseDate"
                            value={movie.releaseDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="duration">Duration (minutes):</label>
                        <input
                            type="number"
                            id="duration"
                            name="duration"
                            value={movie.duration}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="genre">Genre:</label>
                        <input
                            type="text"
                            id="genre"
                            name="genre"
                            value={movie.genre}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={movie.description}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="posterUrl">Poster URL:</label>
                        <input
                            type="url"
                            id="posterUrl"
                            name="posterUrl"
                            value={movie.posterUrl}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit">Add Movie</button>
                </form>
            </div>
        </div>
    );
};

export default AddMovie;