import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import './Dashboard.css';
import Header from '../components/Header';

const Movie = () => {
    const [movies, setMovies] = useState([]);
    const [editingMovie, setEditingMovie] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            const moviesCollection = collection(firestore, 'movies');
            const movieSnapshot = await getDocs(moviesCollection);
            const movieList = movieSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMovies(movieList);
        };

        fetchMovies();
    }, []);

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
        if (name === 'genre') {
            setEditingMovie(prev => ({
                ...prev,
                [name]: value.split(',').map(item => item.trim())
            }));
        } else if (name.startsWith('showtimes.')) {
            const [, key] = name.split('.');
            setEditingMovie(prev => ({
                ...prev,
                showtimes: {
                    ...prev.showtimes,
                    [key]: value
                }
            }));
        } else if (name.startsWith('showEndDate.')) {
            const [, key] = name.split('.');
            setEditingMovie(prev => ({
                ...prev,
                showEndDate: {
                    ...prev.showEndDate,
                    [key]: value
                }
            }));
        } else {
            setEditingMovie(prev => ({
                ...prev,
                [name]: name === 'rating' ? parseFloat(value) : value
            }));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this movie?')) {
            await deleteDoc(doc(firestore, 'movies', id));
            setMovies(movies.filter(movie => movie.id !== id));
        }
    };

    return (
        <div className="movie-page">
            <Header />
            <div className="movie-list-container">
                <h2>Movie List</h2>
                <table className="movie-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Release Date</th>
                            <th>Genre</th>
                            <th>Duration</th>
                            <th>Rating</th>
                            <th>Trailer</th>
                            <th>Poster</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movies.map(movie => (
                            <tr key={movie.id}>
                                <td>{movie.title}</td>
                                <td>{movie.releaseDate.toDate().toLocaleDateString()}</td>
                                <td>{movie.genre.join(', ')}</td>
                                <td>{movie.duration}</td>
                                <td>{movie.rating}</td>
                                <td><a href={movie.trailer} target="_blank" rel="noopener noreferrer">Trailer</a></td>
                                <td><img src={movie.posterUrl} alt={movie.title} style={{width: '50px', height: '75px'}} /></td>
                                <td>
                                    <button onClick={() => handleEdit(movie)} className="icon-button edit">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDelete(movie.id)} className="icon-button delete">
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
                            <input
                                name="releaseDate"
                                type="date"
                                value={editingMovie.releaseDate.toDate().toISOString().split('T')[0]}
                                onChange={handleEditChange}
                            />
                            <input
                                name="genre"
                                value={editingMovie.genre.join(', ')}
                                onChange={handleEditChange}
                                placeholder="Genre (comma-separated)"
                            />
                            <input
                                name="duration"
                                type="number"
                                value={editingMovie.duration}
                                onChange={handleEditChange}
                                placeholder="Duration (minutes)"
                            />
                            <textarea
                                name="description"
                                value={editingMovie.description}
                                onChange={handleEditChange}
                                placeholder="Description"
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
                                name="trailer"
                                type="url"
                                value={editingMovie.trailer}
                                onChange={handleEditChange}
                                placeholder="Trailer URL"
                            />
                            <h4>Showtimes</h4>
                            {Object.entries(editingMovie.showtimes).map(([key, value]) => (
                                <input
                                    key={key}
                                    name={`showtimes.${key}`}
                                    type="datetime-local"
                                    value={value.toDate().toISOString().slice(0, 16)}
                                    onChange={handleEditChange}
                                    placeholder={key}
                                />
                            ))}
                            <h4>Show End Dates</h4>
                            {Object.entries(editingMovie.showEndDate).map(([key, value]) => (
                                <input
                                    key={key}
                                    name={`showEndDate.${key}`}
                                    type="date"
                                    value={value.toDate().toISOString().split('T')[0]}
                                    onChange={handleEditChange}
                                    placeholder={key}
                                />
                            ))}
                            <div className="form-actions">
                                <button type="submit" className="btn-update">Update Movie</button>
                                <button type="button" onClick={() => setEditingMovie(null)} className="btn-cancel">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Movie;