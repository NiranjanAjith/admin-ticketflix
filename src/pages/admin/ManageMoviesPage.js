import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../firebase";
import { FaTrashAlt, FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ManageMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null);
  const [addingShows, setAddingShows] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [poster, setPoster] = useState(null);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [theaters, setTheaters] = useState([]);
  const [screenSelections, setScreenSelections] = useState({});
  const [showtimes, setShowtimes] = useState({});

  useEffect(() => {
    fetchMovies();
    fetchTheaters();
  }, []);

  const fetchMovies = async () => {
    const moviesCollection = collection(firestore, "movies");
    const movieSnapshot = await getDocs(moviesCollection);
    const movieList = movieSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMovies(movieList);
  };

  const fetchTheaters = async () => {
    const theatersCollection = collection(firestore, "theatres");
    const theaterSnapshot = await getDocs(theatersCollection);
    const theaterList = theaterSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setTheaters(theaterList);
  };

  const formatDate = (date) => {
    if (date && typeof date.toDate === "function") {
      return date.toDate().toISOString().split("T")[0];
    }
    if (date && date.seconds) {
      return new Date(date.seconds * 1000).toISOString().split("T")[0];
    }
    return date || "";
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setIsAdding(false);
    setAddingShows(null);
  };

  const handleAdd = () => {
    setEditingMovie({
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
      language: '',
      ageRating: '',
    });
    setIsAdding(true);
    setAddingShows(null);
  };

  const handleAddShows = (movie) => {
    setAddingShows(movie);
    setEditingMovie(null);
    setIsAdding(false);
    setScreenSelections({});
    setShowtimes({});
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMovie) return;

    try {
      let posterUrl = editingMovie.posterUrl;
      if (poster) {
        const storageRef = ref(storage, `posters/${editingMovie.title}_${Date.now()}`);
        await uploadBytes(storageRef, poster);
        posterUrl = await getDownloadURL(storageRef);
      }

      const movieData = {
        ...editingMovie,
        posterUrl,
        rating: parseFloat(editingMovie.rating),
        releaseDate: Timestamp.fromDate(new Date(editingMovie.releaseDate)),
        showEndDate: Timestamp.fromDate(new Date(editingMovie.showEndDate)),
      };

      if (isAdding) {
        await addDoc(collection(firestore, 'movies'), movieData);
      } else {
        const movieRef = doc(firestore, "movies", editingMovie.id);
        await updateDoc(movieRef, movieData);
      }

      setMessage({ type: 'success', content: `Movie ${isAdding ? 'added' : 'updated'} successfully!` });
      setEditingMovie(null);
      setIsAdding(false);
      setPoster(null);
      fetchMovies();
    } catch (error) {
      console.error('Error updating movie: ', error);
      setMessage({ type: 'error', content: `Error ${isAdding ? 'adding' : 'updating'} movie: ${error.message}` });
    }
  };

  const handleAddShowsSubmit = async (e) => {
    e.preventDefault();
    if (!addingShows) return;

    try {
      const showsPromises = Object.entries(screenSelections).flatMap(([theaterId, screens]) => 
        Object.entries(screens).flatMap(([screenName, isSelected]) => {
          if (isSelected) {
            return showtimes[theaterId][screenName].map(async (showtime) => {
              const showtimeDate = new Date(`${showtime.date}T${showtime.time}`);
              if (isNaN(showtimeDate.getTime())) {
                throw new Error(`Invalid showtime: ${showtime.date} ${showtime.time}`);
              }
              const showData = {
                movieId: addingShows.id,
                theaterId,
                screenName,
                datetime: Timestamp.fromDate(showtimeDate),
                ticketPrices: showtime.ticketPrices,
                seatMatrix: theaters.find(t => t.id === theaterId)['seat-matrix-layout'][screenName]
              };
              return addDoc(collection(firestore, 'shows'), showData);
            });
          }
          return [];
        })
      );

      await Promise.all(showsPromises);

      setMessage({ type: 'success', content: 'Shows added successfully!' });
      setAddingShows(null);
      setScreenSelections({});
      setShowtimes({});
    } catch (error) {
      console.error('Error adding shows: ', error);
      setMessage({ type: 'error', content: `Error adding shows: ${error.message}` });
    }
  };

  const handleEditChange = (e) => {
    if (!editingMovie) return;
    const { name, value } = e.target;
    if (name === "genre" || name === "cast") {
      setEditingMovie((prev) => ({
        ...prev,
        [name]: value.split(",").map((item) => item.trim()),
      }));
    } else {
      setEditingMovie((prev) => ({
        ...prev,
        [name]:
          name === "rating" || name === "duration" ? parseFloat(value) : value,
      }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      await deleteDoc(doc(firestore, "movies", id));
      setMovies(movies.filter((movie) => movie.id !== id));
    }
  };

  const handlePosterChange = (e) => {
    setPoster(e.target.files[0]);
  };

  const handleTheaterChange = (e) => {
    const theaterId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setScreenSelections(prev => ({
        ...prev,
        [theaterId]: {}
      }));
    } else {
      setScreenSelections(prev => {
        const { [theaterId]: _, ...rest } = prev;
        return rest;
      });
      setShowtimes(prev => {
        const { [theaterId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleScreenChange = (theaterId, screenName) => {
    setScreenSelections(prev => ({
      ...prev,
      [theaterId]: {
        ...prev[theaterId],
        [screenName]: !prev[theaterId]?.[screenName]
      }
    }));

    if (screenSelections[theaterId]?.[screenName]) {
      setShowtimes(prev => ({
        ...prev,
        [theaterId]: {
          ...prev[theaterId],
          [screenName]: []
        }
      }));
    }
  };

  const addShowtime = (theaterId, screenName) => {
    const theater = theaters.find(t => t.id === theaterId);
    const seatTypes = new Set();
    Object.values(theater['seat-matrix-layout'][screenName].matrix).forEach(row => {
      seatTypes.add(row.type);
    });

    setShowtimes(prev => ({
      ...prev,
      [theaterId]: {
        ...prev[theaterId],
        [screenName]: [
          ...(prev[theaterId]?.[screenName] || []),
          { 
            date: '',
            time: '',
            ticketPrices: Array.from(seatTypes).reduce((acc, type) => ({...acc, [type]: ''}), {})
          }
        ]
      }
    }));
  };

  const removeShowtime = (theaterId, screenName, index) => {
    setShowtimes(prev => ({
      ...prev,
      [theaterId]: {
        ...prev[theaterId],
        [screenName]: prev[theaterId][screenName].filter((_, i) => i !== index)
      }
    }));
  };

  const handleShowtimeChange = (theaterId, screenName, index, field, value) => {
    setShowtimes(prev => ({
      ...prev,
      [theaterId]: {
        ...prev[theaterId],
        [screenName]: prev[theaterId][screenName].map((showtime, i) => 
          i === index ? { ...showtime, [field]: value } : showtime
        )
      }
    }));
  };

  const handleTicketPriceChange = (theaterId, screenName, showtimeIndex, seatType, price) => {
    setShowtimes(prev => ({
      ...prev,
      [theaterId]: {
        ...prev[theaterId],
        [screenName]: prev[theaterId][screenName].map((showtime, i) => 
          i === showtimeIndex ? {
            ...showtime,
            ticketPrices: {
              ...showtime.ticketPrices,
              [seatType]: price
            }
          } : showtime
        )
      }
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Movie List</h2>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <FaPlus className="inline mr-2" /> Add Movie
            </button>
          </div>
          {message.content && (
            <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.content}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Release Date</th>
                  <th className="px-4 py-2 text-left">Genre</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Rating</th>
                  <th className="px-4 py-2 text-left">Director</th>
                  <th className="px-4 py-2 text-left">Language</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{movie.title}</td>
                    <td className="px-4 py-2">{formatDate(movie.releaseDate)}</td>
                    <td className="px-4 py-2">{movie.genre?.join(", ")}</td>
                    <td className="px-4 py-2">{movie.duration} min</td>
                    <td className="px-4 py-2">{movie.rating}</td>
                    <td className="px-4 py-2">{movie.director}</td>
                    <td className="px-4 py-2">{movie.language}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleEdit(movie)} className="text-blue-600 hover:text-blue-800 mr-2">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(movie.id)} className="text-red-600 hover:text-red-800 mr-2">
                        <FaTrashAlt />
                      </button>
                      <button onClick={() => handleAddShows(movie)} className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                        Add Shows
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editingMovie && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isAdding ? 'Add Movie' : 'Edit Movie'}
                </h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <input
                    name="title"
                    value={editingMovie.title || ""}
                    onChange={handleEditChange}
                    placeholder="Title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="releaseDate"
                    type="date"
                    value={formatDate(editingMovie.releaseDate)}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="showEndDate"
                    type="date"
                    value={formatDate(editingMovie.showEndDate)}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="genre"
                    value={editingMovie.genre?.join(", ") || ""}
                    onChange={handleEditChange}
                    placeholder="Genre (comma-separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="duration"
                    type="number"
                    value={editingMovie.duration || ""}
                    onChange={handleEditChange}
                    placeholder="Duration (minutes)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <textarea
                    name="description"
                    value={editingMovie.description || ""}
                    onChange={handleEditChange}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="rating"
                    type="number"
                    step="0.1"
                    value={editingMovie.rating || ""}
                    onChange={handleEditChange}
                    placeholder="Rating"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="trailer"
                    type="url"
                    value={editingMovie.trailer || ""}
                    onChange={handleEditChange}
                    placeholder="Trailer URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="director"
                    value={editingMovie.director || ""}
                    onChange={handleEditChange}
                    placeholder="Director"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="cast"
                    value={editingMovie.cast?.join(", ") || ""}
                    onChange={handleEditChange}
                    placeholder="Cast (comma-separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="language"
                    value={editingMovie.language || ""}
                    onChange={handleEditChange}
                    placeholder="Language"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    name="ageRating"
                    value={editingMovie.ageRating || ""}
                    onChange={handleEditChange}
                    placeholder="Age Rating"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div>
                    <label htmlFor="poster" className="block text-sm font-medium text-gray-700 mb-2">Poster:</label>
                    <input
                      type="file"
                      id="poster"
                      name="poster"
                      onChange={handlePosterChange}
                      className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMovie(null);
                        setIsAdding(false);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {isAdding ? 'Add Movie' : 'Update Movie'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {addingShows && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="add-shows-modal">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Shows for {addingShows.title}
                </h3>
                <form onSubmit={handleAddShowsSubmit} className="space-y-4">
                  {theaters.map(theater => (
                    <div key={theater.id} className="mb-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value={theater.id}
                          checked={!!screenSelections[theater.id]}
                          onChange={handleTheaterChange}
                          className="form-checkbox h-5 w-5 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">{theater['theatre-name']}</span>
                      </label>
                      {screenSelections[theater.id] && (
                        <div className="ml-6 mt-2 space-y-2">
                          {Object.keys(theater['seat-matrix-layout']).map(screenName => (
                            <label key={screenName} className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={screenSelections[theater.id][screenName] || false}
                                onChange={() => handleScreenChange(theater.id, screenName)}
                                className="form-checkbox h-5 w-5 text-indigo-600"
                              />
                              <span className="ml-2 text-gray-700">{screenName}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {Object.entries(screenSelections).map(([theaterId, screens]) => (
                    <div key={theaterId} className="mt-6 p-4 border border-gray-200 rounded-md">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {theaters.find(t => t.id === theaterId)['theatre-name']}
                      </h3>
                      
                      {Object.entries(screens).map(([screenName, isSelected]) => isSelected && (
                        <div key={screenName} className="mb-4">
                          <h4 className="text-md font-medium text-gray-800 mb-2">{screenName}</h4>
                          {showtimes[theaterId]?.[screenName]?.map((showtime, index) => (
                            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                              <div className="flex items-center space-x-2 mb-2">
                                <input
                                  type="date"
                                  value={showtime.date}
                                  onChange={(e) => handleShowtimeChange(theaterId, screenName, index, 'date', e.target.value)}
                                  className="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <input
                                  type="time"
                                  value={showtime.time}
                                  onChange={(e) => handleShowtimeChange(theaterId, screenName, index, 'time', e.target.value)}
                                  className="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeShowtime(theaterId, screenName, index)}
                                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                              <div className="mt-2">
                                <h5 className="text-sm font-medium text-gray-700 mb-1">Ticket Prices:</h5>
                                {Object.entries(showtime.ticketPrices).map(([seatType, price]) => (
                                  <div key={seatType} className="flex items-center space-x-2 mb-2">
                                    <label className="w-24 text-sm font-medium text-gray-700">{seatType}:</label>
                                    <input
                                      type="number"
                                      value={price}
                                      onChange={(e) => handleTicketPriceChange(theaterId, screenName, index, seatType, e.target.value)}
                                      className="form-input rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                      placeholder="Price"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addShowtime(theaterId, screenName)}
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                          >
                            <FaPlus className="mr-2" /> Add Showtime
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingShows(null);
                        setScreenSelections({});
                        setShowtimes({});
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Add Shows
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ManageMoviesPage;