import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import "./styles/Dashboard.css";

const AddShowtimes = () => {
    const { movieId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [theaters, setTheaters] = useState([]);
    const [showtimes, setShowtimes] = useState({});
    const [message, setMessage] = useState({ type: '', content: '' });

    useEffect(() => {
        if (location.state && location.state.newlyAdded) {
            setMessage({ type: 'success', content: 'Movie added successfully! Now let\'s add showtimes.' });
        }

        const fetchMovieAndTheaters = async () => {
            try {
                const movieDoc = await getDoc(doc(firestore, 'movies', movieId));
                if (movieDoc.exists()) {
                    setMovie(movieDoc.data());
                    
                    const theaterPromises = movieDoc.data().theaterIds.map(theaterId => 
                        getDoc(doc(firestore, 'theatres', theaterId))
                    );
                    const theaterDocs = await Promise.all(theaterPromises);
                    const theaterData = theaterDocs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTheaters(theaterData);

                    const initialShowtimes = {};
                    theaterData.forEach(theater => {
                        initialShowtimes[theater.id] = {};
                        ['screen1', 'screen2'].forEach(screen => {
                            initialShowtimes[theater.id][screen] = {
                                availableSeatCapacity: 100,
                                seatMatrix: {
                                    rows: [0, 0, 1, 0],
                                    columns: [0, 1, 0, 1]
                                },
                                ticketRates: {
                                    Standard: 170,
                                    Premium: 220,
                                    Elite: 200,
                                    Legendary: 400
                                },
                                timings: ['', '', '', '']
                            };
                        });
                    });
                    setShowtimes(initialShowtimes);
                } else {
                    setMessage({ type: 'error', content: 'Movie not found' });
                }
            } catch (error) {
                console.error('Error fetching movie and theaters:', error);
                setMessage({ type: 'error', content: 'Error fetching movie and theaters' });
            }
        };

        fetchMovieAndTheaters();
    }, [movieId, location]);

    const handleShowtimeChange = (theaterId, screen, field, value, index = null) => {
        setShowtimes(prevShowtimes => ({
            ...prevShowtimes,
            [theaterId]: {
                ...prevShowtimes[theaterId],
                [screen]: {
                    ...prevShowtimes[theaterId][screen],
                    [field]: index !== null
                        ? prevShowtimes[theaterId][screen][field].map((item, i) => i === index ? value : item)
                        : value
                }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });

        try {
            const showsData = Object.entries(showtimes).map(([theaterId, theaterShowtimes]) => ({
                movie_id: movieId,
                theatre_id: theaterId,
                'show-info': Object.entries(theaterShowtimes).reduce((acc, [screen, screenData]) => {
                    acc[screen] = {
                        'available-seat-capacity': screenData.availableSeatCapacity,
                        'seat-matrix': screenData.seatMatrix,
                        'ticket-rates': screenData.ticketRates,
                        'timings': screenData.timings.map(time => time ? Timestamp.fromDate(new Date(time)) : null).filter(Boolean)
                    };
                    return acc;
                }, {})
            }));

            const showsCollection = collection(firestore, 'shows');
            for (const showData of showsData) {
                await setDoc(doc(showsCollection), showData);
            }

            setMessage({ type: 'success', content: 'Showtimes added successfully!' });
            
            setTimeout(() => {
                navigate('/movies'); // Adjust this path as needed
            }, 2000);
        } catch (error) {
            console.error('Error adding showtimes:', error);
            setMessage({ type: 'error', content: 'Error adding showtimes' });
        }
    };

    if (!movie) return <div>Loading...</div>;

    return (
        <div className="add-showtimes-page">
            <Header />
            <div className="add-showtimes-container">
                <h2>Add Showtimes for {movie.title}</h2>
                {message.content && (
                    <div className={`message ${message.type}-message`}>
                        {message.content}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="add-showtimes-form">
                    {theaters.map(theater => (
                        <div key={theater.id} className="theater-section">
                            <h3>{theater['theatre-name']}</h3>
                            {['screen1', 'screen2'].map(screen => (
                                <div key={screen} className="screen-section">
                                    <h4>{screen.charAt(0).toUpperCase() + screen.slice(1)}</h4>
                                    <div className="form-group">
                                        <label>Available Seat Capacity:</label>
                                        <input
                                            type="number"
                                            value={showtimes[theater.id]?.[screen]?.availableSeatCapacity || ''}
                                            onChange={(e) => handleShowtimeChange(theater.id, screen, 'availableSeatCapacity', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Timings:</label>
                                        {[0, 1, 2, 3].map(index => (
                                            <input
                                                key={index}
                                                type="datetime-local"
                                                value={showtimes[theater.id]?.[screen]?.timings[index] || ''}
                                                onChange={(e) => handleShowtimeChange(theater.id, screen, 'timings', e.target.value, index)}
                                            />
                                        ))}
                                    </div>
                                    <div className="form-group">
                                        <label>Ticket Rates:</label>
                                        {Object.entries(showtimes[theater.id]?.[screen]?.ticketRates || {}).map(([type, rate]) => (
                                            <div key={type}>
                                                <label>{type}:</label>
                                                <input
                                                    type="number"
                                                    value={rate}
                                                    onChange={(e) => handleShowtimeChange(
                                                        theater.id,
                                                        screen,
                                                        'ticketRates',
                                                        { ...showtimes[theater.id][screen].ticketRates, [type]: parseInt(e.target.value) }
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    <button type="submit" className="btn-submit">Add Showtimes</button>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default AddShowtimes;