import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { firestore, storage } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Dashboard.css';

const AddMovie = () => {
    const [movie, setMovie] = useState({
        title: '',
        description: '',
        duration: '',
        genre: [],
        rating: 0,
        releaseDate: '',
        showEndDate: '',
        trailer: '',
        cast: [],
        director: '',
        theaterIds: []
    });
    const [poster, setPoster] = useState(null);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [theaters, setTheaters] = useState([]);
    const [showtimes, setShowtimes] = useState({});
    const [ticketRates, setTicketRates] = useState({});
    const [seatMatrix, setSeatMatrix] = useState({});

    useEffect(() => {
        const fetchTheaters = async () => {
            const theatersCollection = collection(firestore, 'theatres');
            const theaterSnapshot = await getDocs(theatersCollection);
            const theaterList = theaterSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTheaters(theaterList);
        };
        fetchTheaters();
    }, []);

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
                [name]: value
            }));
        }
    };

    const handleTheaterChange = (e) => {
        const theaterId = e.target.value;
        const isChecked = e.target.checked;
        
        setMovie(prevState => ({
            ...prevState,
            theaterIds: isChecked
                ? [...prevState.theaterIds, theaterId]
                : prevState.theaterIds.filter(id => id !== theaterId)
        }));
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
                showEndDate: Timestamp.fromDate(new Date(movie.showEndDate)),
                showInfo: movie.theaterIds.reduce((acc, theaterId) => {
                    acc[theaterId] = {
                        timings: showtimes[theaterId],
                        ticketRates: {
                            Elite: ticketRates[theaterId][0],
                            Premium: ticketRates[theaterId][1],
                            Standard: ticketRates[theaterId][2]
                        },
                        seatMatrix: {
                            rows: seatMatrix[theaterId].rows,
                            columns: seatMatrix[theaterId].columns
                        },
                        availableSeatCapacity: seatMatrix[theaterId].rows.length * seatMatrix[theaterId].columns.length
                    };
                    return acc;
                }, {})
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
                showEndDate: '',
                trailer: '',
                cast: [],
                director: '',
                theaterIds: []
            });
            setPoster(null);
            setShowtimes({});
            setTicketRates({});
            setSeatMatrix({});
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
                        <label htmlFor="director">Director:</label>
                        <input type="text" id="director" name="director" value={movie.director} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="cast">Cast (comma-separated):</label>
                        <input type="text" id="cast" name="cast" value={movie.cast.join(', ')} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Theaters:</label>
                        <div className="checkbox-group">
                            {theaters.map(theater => (
                                <label key={theater.id} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        value={theater.id}
                                        checked={movie.theaterIds.includes(theater.id)}
                                        onChange={handleTheaterChange}
                                    />
                                    {theater['theatre-name']}
                                </label>
                            ))}
                        </div>
                    </div>
                    {movie.theaterIds.map(theaterId => (
                        <div key={theaterId} className="theater-details">
                            <h3>Details for Theater: {theaters.find(theater => theater.id === theaterId)['theatre-name']}</h3>
                            
                            <div className="form-group">
                                <label>Showtimes (comma-separated Timestamps):</label>
                                <input 
                                    type="text" 
                                    value={showtimes[theaterId]?.join(', ')} 
                                    onChange={e => setShowtimes(prev => ({
                                        ...prev,
                                        [theaterId]: e.target.value.split(',').map(time => Timestamp.fromDate(new Date(time.trim())))
                                    }))} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Ticket Rates (comma-separated Elite,Premium,Standard):</label>
                                <input 
                                    type="text" 
                                    value={ticketRates[theaterId]?.join(', ')} 
                                    onChange={e => setTicketRates(prev => ({
                                        ...prev,
                                        [theaterId]: e.target.value.split(',').map(rate => parseFloat(rate.trim()))
                                    }))} 
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Seat Matrix (comma-separated Rows and Columns):</label>
                                <input 
                                    type="text" 
                                    value={seatMatrix[theaterId]?.rows?.join(', ') || ''} 
                                    onChange={e => setSeatMatrix(prev => ({
                                        ...prev,
                                        [theaterId]: {
                                            rows: e.target.value.split(',').map(num => parseInt(num.trim())),
                                            columns: prev[theaterId]?.columns || []
                                        }
                                    }))} 
                                    required 
                                />
                                <input 
                                    type="text" 
                                    value={seatMatrix[theaterId]?.columns?.join(', ') || ''} 
                                    onChange={e => setSeatMatrix(prev => ({
                                        ...prev,
                                        [theaterId]: {
                                            columns: e.target.value.split(',').map(num => parseInt(num.trim())),
                                            rows: prev[theaterId]?.rows || []
                                        }
                                    }))} 
                                    required 
                                />
                            </div>
                        </div>
                    ))}
                    <div className="form-group">
                        <label htmlFor="poster">Poster:</label>
                        <input type="file" id="poster" name="poster" onChange={handlePosterChange} required />
                    </div>
                    <button type="submit">Add Movie</button>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default AddMovie;
