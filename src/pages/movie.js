import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import './movie.css';
import Header from '../components/Header';

const MovieList = () => {
    const [movies, setMovies] = useState([]);
    const [editingMovie, setEditingMovie] = useState(null);

    // Step 1: Fetch the list of movies from the database
    useEffect(() => {
        const fetchMovies = async () => {
            const moviesCollection = collection(firestore, 'Movies');
            const movieSnapshot = await getDocs(moviesCollection);
            const movieList = movieSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMovies(movieList);
        };

        fetchMovies();
    }, []);

    // Step 4: Implement the edit functionality
    const handleEdit = (movie) => {
        setEditingMovie(movie);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const movieRef = doc(firestore, 'movies', editingMovie.id);
        await updateDoc(movieRef, editingMovie);
        setMovies(movies.map(movie =>
            movie.id === editingMovie.id ? editingMovie : movie
        ));
        setEditingMovie(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingMovie(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Step 5: Implement the delete functionality
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this movie?')) {
            await deleteDoc(doc(firestore, 'movies', id));
            setMovies(movies.filter(movie => movie.id !== id));
        }
    };

    // Step 2: Display the movies in a list or grid format

    return (
        <div>
            <Header />
            <div className="movie-list-container">
                <h2>Movie List</h2>
                <table className="movie-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Duration</th>
                            <th>Genre</th>
                            <th>Rating</th>
                            <th>Release Date</th>
                            <th>First Show</th>
                            <th>Matinee</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movies.map(movie => (
                            <tr key={movie.id}>
                                <td>{movie.title}</td>
                                <td>{movie.description}</td>
                                <td>{movie.duration}</td>
                                <td>{movie.genre.join(', ')}</td>
                                <td>{movie.rating}</td>
                                <td>{movie.releaseDate.toDate().toLocaleDateString()}</td>
                                <td>{movie.showtimes.firstShow.toDate().toLocaleString()}</td>
                                <td>{movie.showtimes.Matinee.toDate().toLocaleString()}</td>
                                <td>
                                    <button onClick={() => handleEdit(movie)} className="icon-button">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDelete(movie.id)} className="icon-button">
                                        <FaTrashAlt />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {editingMovie && (
                    <div className="edit-form-overlay">
                        <form onSubmit={handleUpdate} className="edit-form">
                            <h3>Edit Movie</h3>
                            <input
                                name="title"
                                value={editingMovie.title}
                                onChange={handleEditChange}
                                placeholder="Title"
                            />
                            <textarea
                                name="description"
                                value={editingMovie.description}
                                onChange={handleEditChange}
                                placeholder="Description"
                            />
                            <input
                                name="duration"
                                value={editingMovie.duration}
                                onChange={handleEditChange}
                                placeholder="Duration"
                            />
                            <input
                                name="genre"
                                value={editingMovie.genre.join(', ')}
                                onChange={handleEditChange}
                                placeholder="Genre (comma-separated)"
                            />
                            <input
                                name="rating"
                                type="number"
                                step="0.1"
                                value={editingMovie.rating}
                                onChange={handleEditChange}
                                placeholder="Rating"
                            />
                            <input
                                name="releaseDate"
                                type="datetime-local"
                                value={editingMovie.releaseDate.toDate().toISOString().slice(0, 16)}
                                onChange={handleEditChange}
                            />
                            <input
                                name="firstShow"
                                type="datetime-local"
                                value={editingMovie.showtimes.firstShow.toDate().toISOString().slice(0, 16)}
                                onChange={handleEditChange}
                            />
                            <input
                                name="matinee"
                                type="datetime-local"
                                value={editingMovie.showtimes.Matinee.toDate().toISOString().slice(0, 16)}
                                onChange={handleEditChange}
                            />
                            <div className="form-actions">
                                <button type="submit">Update Movie</button>
                                <button type="button" onClick={() => setEditingMovie(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MovieList;