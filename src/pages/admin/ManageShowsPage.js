import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../../firebase";
import { FaTrash, FaPlus, FaChair, FaEdit } from "react-icons/fa";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ManageShowsPage = () => {
  const { movieId } = useParams();
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [shows, setShows] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(movieId || "");
  const [message, setMessage] = useState({ type: "", content: "" });
  const [screenSelections, setScreenSelections] = useState({});
  const [showtimes, setShowtimes] = useState({});
  const [selectedShow, setSelectedShow] = useState(null);
  const [filters, setFilters] = useState({
    theater: "",
    movie: "",
    date: "",
    time: "",
  });
  const [editingShow, setEditingShow] = useState(null);
  const [separateTicketPrices, setSeparateTicketPrices] = useState({});

  const fetchMovies = useCallback(async () => {
    const moviesCollection = collection(firestore, "movies");
    const movieSnapshot = await getDocs(moviesCollection);
    const movieList = movieSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMovies(movieList);
  }, []);

  const fetchTheaters = useCallback(async () => {
    const theatersCollection = collection(firestore, "theatres");
    const theaterSnapshot = await getDocs(theatersCollection);
    const theaterList = theaterSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTheaters(theaterList);
  }, []);

  const fetchShows = useCallback(async () => {
    const showsCollection = collection(firestore, "shows");
    let showQuery = showsCollection;
    if (movieId) {
      showQuery = query(showsCollection, where("movieId", "==", movieId));
    }
    const showSnapshot = await getDocs(showQuery);
    const showList = showSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setShows(showList);
  }, [movieId]);

  useEffect(() => {
    fetchMovies();
    fetchTheaters();
    fetchShows();
  }, [fetchMovies, fetchTheaters, fetchShows]);

  const handleTheaterChange = (e) => {
    const theatreID = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setScreenSelections(prev => ({
        ...prev,
        [theatreID]: {}
      }));
    } else {
      setScreenSelections(prev => {
        const { [theatreID]: _, ...rest } = prev;
        return rest;
      });
      setShowtimes(prev => {
        const { [theatreID]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleScreenChange = (theatreID, screenName) => {
    setScreenSelections(prev => ({
      ...prev,
      [theatreID]: {
        ...prev[theatreID],
        [screenName]: !prev[theatreID]?.[screenName]
      }
    }));

    if (!screenSelections[theatreID]?.[screenName]) {
      setShowtimes(prev => ({
        ...prev,
        [theatreID]: {
          ...prev[theatreID],
          [screenName]: {
            startDate: '',
            endDate: '',
            showtimes: []
          }
        }
      }));
    }
  };

  const handleSeparateTicketPricesChange = (theatreID, screenName) => {
    setSeparateTicketPrices((prev) => ({
      ...prev,
      [theatreID]: {
        ...prev[theatreID],
        [screenName]: !prev[theatreID]?.[screenName],
      },
    }));

    setShowtimes((prev) => {
      const updatedShowtimes = { ...prev };
      if (!updatedShowtimes[theatreID]) {
        updatedShowtimes[theatreID] = {};
      }
      if (!updatedShowtimes[theatreID][screenName]) {
        updatedShowtimes[theatreID][screenName] = {};
      }

      if (!prev[theatreID]?.[screenName]?.separateTicketPrices) {
        // Switching to separate ticket prices
        const startDate = new Date(updatedShowtimes[theatreID][screenName].startDate || new Date());
        const endDate = new Date(updatedShowtimes[theatreID][screenName].endDate || new Date());
        const dailyShowtimes = [];

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          dailyShowtimes.push({
            date: date.toISOString().split('T')[0],
            showtimes: [],
          });
        }

        updatedShowtimes[theatreID][screenName].dailyShowtimes = dailyShowtimes;
      } else {
        // Switching to common ticket prices
        updatedShowtimes[theatreID][screenName].showtimes = [];
      }

      return updatedShowtimes;
    });
  };

  const addShowtime = (theatreID, screenName, dateIndex = null) => {
    console.log('addShowtime triggered for:', theatreID, screenName, dateIndex);
    const theater = theaters.find(t => t.id === theatreID);
    const seatTypes = new Set();
  
    // Gather all seat types from the matrix
    Object.values(theater['seat-matrix-layout'][screenName].matrix).forEach(row => {
      seatTypes.add(row.type);
    });
  
    // Create a new showtime object with default values
    const newShowtime = {
      time: '',
      ticketPrices: Array.from(seatTypes).reduce((acc, type) => ({ ...acc, [type]: '' }), {})
    };
  
    // Update the showtimes state
    setShowtimes(prev => {
      const updatedShowtimes = { ...prev };
      console.log('Before Update:', showtimes);
  
      if (!updatedShowtimes[theatreID]) {
        updatedShowtimes[theatreID] = {};
      }
      if (!updatedShowtimes[theatreID][screenName]) {
        updatedShowtimes[theatreID][screenName] = {};
      }
  
      if (separateTicketPrices[theatreID]?.[screenName]) {
        // Handling for separate ticket prices
        if (!updatedShowtimes[theatreID][screenName].dailyShowtimes) {
          updatedShowtimes[theatreID][screenName].dailyShowtimes = [];
        }
        if (!updatedShowtimes[theatreID][screenName].dailyShowtimes[dateIndex]) {
          updatedShowtimes[theatreID][screenName].dailyShowtimes[dateIndex] = { showtimes: [] };
        }
        updatedShowtimes[theatreID][screenName].dailyShowtimes[dateIndex].showtimes.push(newShowtime);
      } else {
        // Handling for common ticket prices
        if (!updatedShowtimes[theatreID][screenName].showtimes) {
          updatedShowtimes[theatreID][screenName].showtimes = [];
        }
        updatedShowtimes[theatreID][screenName].showtimes.push(newShowtime);
      }
      console.log('After Update:', updatedShowtimes);
      return updatedShowtimes;
    });
    console.log('Add showTime complete')
  };  

  const handleShowtimeChange = (theatreID, screenName, dateIndex, showtimeIndex, field, value) => {
    setShowtimes(prev => {
      const updatedShowtimes = {...prev};
      if (separateTicketPrices[theatreID]?.[screenName]) {
        // If separate ticket prices are enabled
        updatedShowtimes[theatreID][screenName].dailyShowtimes[dateIndex].showtimes[showtimeIndex][field] = value;
      } else {
        // If common ticket prices are used
        updatedShowtimes[theatreID][screenName].showtimes[showtimeIndex][field] = value;
      }
      console.log('handleShowtimeChange completed')
      return updatedShowtimes;
    });
  };

  const handleTicketPriceChange = (theatreID, screenName, dateIndex, showtimeIndex, seatType, price) => {
    setShowtimes(prev => {
      const updatedShowtimes = {...prev};
      if (separateTicketPrices[theatreID]?.[screenName]) {
        // If separate ticket prices are enabled
        updatedShowtimes[theatreID][screenName].dailyShowtimes[dateIndex].showtimes[showtimeIndex].ticketPrices[seatType] = price;
      } else {
        // If common ticket prices are used
        updatedShowtimes[theatreID][screenName].showtimes[showtimeIndex].ticketPrices[seatType] = price;
      }
      return updatedShowtimes;
    });
  };

  const removeShowtime = (theatreID, screenName, dateIndex, showtimeIndex) => {
    setShowtimes(prev => {
      const updatedShowtimes = {...prev};
      if (separateTicketPrices[theatreID]?.[screenName]) {
        // If separate ticket prices are enabled
        updatedShowtimes[theatreID][screenName].dailyShowtimes[dateIndex].showtimes.splice(showtimeIndex, 1);
      } else {
        // If common ticket prices are used
        updatedShowtimes[theatreID][screenName].showtimes.splice(showtimeIndex, 1);
      }
      return updatedShowtimes;
    });
  };

  const handleDateChange = (theatreID, screenName, field, value) => {
    setShowtimes(prev => {
      const updatedShowtimes = {
        ...prev,
        [theatreID]: {
          ...prev[theatreID],
          [screenName]: {
            ...prev[theatreID][screenName],
            [field]: value
          }
        }
      };
  
      // If separate ticket prices are enabled, update the daily showtimes
      if (separateTicketPrices[theatreID]?.[screenName]) {
        const startDate = new Date(field === 'startDate' ? value : updatedShowtimes[theatreID][screenName].startDate);
        const endDate = new Date(field === 'endDate' ? value : updatedShowtimes[theatreID][screenName].endDate);
        const dailyShowtimes = [];
  
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          dailyShowtimes.push({
            date: date.toISOString().split('T')[0],
            showtimes: [],
          });
        }
  
        updatedShowtimes[theatreID][screenName].dailyShowtimes = dailyShowtimes;
      }
  
      return updatedShowtimes;
    });
  };

  const handleAddShow = async (e) => {
    e.preventDefault();
    if (!selectedMovie) {
      setMessage({ type: "error", content: "Please select a movie." });
      return;
    }

    try {
      const showsPromises = Object.entries(screenSelections).flatMap(([theatreID, screens]) => 
        Object.entries(screens).flatMap(([screenName, isSelected]) => {
          if (isSelected && showtimes[theatreID] && showtimes[theatreID][screenName]) {
            const { startDate, endDate } = showtimes[theatreID][screenName];
            if (!startDate || !endDate) {
              throw new Error(`Start date and end date are required for ${screenName}`);
            }
            
            if (separateTicketPrices[theatreID]?.[screenName]) {
              // Handle separate ticket prices case
              return showtimes[theatreID][screenName].dailyShowtimes.flatMap(day => 
                day.showtimes.map(async (showtime) => {
                  const [hours, minutes] = showtime.time.split(':');
                  const showtimeDate = new Date(day.date);
                  showtimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

                  if (isNaN(showtimeDate.getTime())) {
                    throw new Error(`Invalid showtime: ${showtime.time}`);
                  }

                  const showData = {
                    movieId: selectedMovie,
                    theatreID,
                    screenName,
                    datetime: Timestamp.fromDate(showtimeDate),
                    ticketPrices: showtime.ticketPrices,
                    seatMatrix: theaters.find(t => t.id === theatreID)['seat-matrix-layout'][screenName]
                  };
                  return addDoc(collection(firestore, 'shows'), showData);
                })
              );
            } else {
              // Handle common ticket prices case
              return showtimes[theatreID][screenName].showtimes.map(async (showtime) => {
                const [hours, minutes] = showtime.time.split(':');
                const showtimeDate = new Date(startDate);
                showtimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

                if (isNaN(showtimeDate.getTime())) {
                  throw new Error(`Invalid showtime: ${showtime.time}`);
                }

                const showData = {
                  movieId: selectedMovie,
                  theatreID,
                  screenName,
                  datetime: Timestamp.fromDate(showtimeDate),
                  ticketPrices: showtime.ticketPrices,
                  seatMatrix: theaters.find(t => t.id === theatreID)['seat-matrix-layout'][screenName]
                };
                return addDoc(collection(firestore, 'shows'), showData);
              });
            }
          }
          return [];
        })
      );

      await Promise.all(showsPromises);
      
      setMessage({ type: 'success', content: 'Shows added successfully!' });
      setScreenSelections({});
      setShowtimes({});
      fetchShows();
    } catch (error) {
      console.error('Error adding shows: ', error);
      setMessage({ type: 'error', content: `Error adding shows: ${error.message}` });
    }
  };

  const handleManageSeats = (show) => {
    setSelectedShow(show);
  };

  const handleDeleteShow = async (showId) => {
    if (window.confirm("Are you sure you want to delete this show?")) {
      try {
        await deleteDoc(doc(firestore, "shows", showId));
        setMessage({ type: "success", content: "Show deleted successfully!" });
        fetchShows();
      } catch (error) {
        console.error("Error deleting show: ", error);
        setMessage({ type: "error", content: `Error deleting show: ${error.message}` });
      }
    }
  };

  const handleUpdateSeatMatrix = async (showId, newSeatMatrix) => {
    try {
      const showRef = doc(firestore, "shows", showId);
      await updateDoc(showRef, { seatMatrix: newSeatMatrix });
      setMessage({ type: "success", content: "Seat matrix updated successfully!" });
      fetchShows();
    } catch (error) {
      console.error("Error updating seat matrix:", error);
      setMessage({ type: "error", content: `Error updating seat matrix: ${error.message}` });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredShows = shows.filter((show) => {
    const showDate = show.datetime.toDate();
    return (
      (!filters.theater || show.theatreID === filters.theater) &&
      (!filters.movie || show.movieId === filters.movie) &&
      (!filters.date ||
        showDate.toISOString().split("T")[0] === filters.date) &&
      (!filters.time ||
        showDate.toTimeString().slice(0, 5) === filters.time)
    );
  });

  const handleEditShow = (show) => {
    setEditingShow(show);
  };

  const handleUpdateShow = async (e) => {
    e.preventDefault();
    try {
      const showRef = doc(firestore, "shows", editingShow.id);
      await updateDoc(showRef, {
        ticketPrices: editingShow.ticketPrices,
      });
      setMessage({ type: "success", content: "Show updated successfully!" });
      setEditingShow(null);
      fetchShows();
    } catch (error) {
      console.error("Error updating show: ", error);
      setMessage({
        type: "error",
        content: `Error updating show: ${error.message}`,
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Shows</h2>
          {message.content && (
            <div className={`p-4 mb-4 rounded-md ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message.content}
            </div>
          )}
          <form onSubmit={handleAddShow} className="space-y-6">
            <div>
              <label htmlFor="movie" className="block text-sm font-medium text-gray-700">
                Movie:
              </label>
              <select
                id="movie"
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">Select a movie</option>
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theaters and Screens:</label>
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
            </div>
            {Object.entries(screenSelections).map(([theatreID, screens]) => (
              <div key={theatreID} className="mt-6 p-6 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {theaters.find(t => t.id === theatreID)['theatre-name']}
                </h3>
                
                {Object.entries(screens).map(([screenName, isSelected]) => isSelected && (
                  <div key={screenName} className="mb-6 p-4 bg-white rounded-md shadow-sm">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">{screenName}</h4>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date:</label>
                        <input
                          type="date"
                          value={showtimes[theatreID]?.[screenName]?.startDate || ''}
                          onChange={(e) => handleDateChange(theatreID, screenName, 'startDate', e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date:</label>
                        <input
                          type="date"
                          value={showtimes[theatreID]?.[screenName]?.endDate || ''}
                          onChange={(e) => handleDateChange(theatreID, screenName, 'endDate', e.target.value)}
                          min={showtimes[theatreID]?.[screenName]?.startDate || ''}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={separateTicketPrices[theatreID]?.[screenName] || false}
                          onChange={() => handleSeparateTicketPricesChange(theatreID, screenName)}
                          className="form-checkbox h-5 w-5 text-indigo-600"
                        />
                        <span className="ml-2 text-gray-700">Separate ticket prices for each day</span>
                      </label>
                    </div>
                    {separateTicketPrices[theatreID]?.[screenName] ? (
                      <div>
                        {showtimes[theatreID]?.[screenName]?.dailyShowtimes?.map((day, dateIndex) => (
                          <div key={day.date} className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                            <h5 className="text-md font-medium text-gray-800 mb-2">{day.date}</h5>
                            {day.showtimes?.map((showtime, showtimeIndex) => (
                              <div key={`${dateIndex}-${showtimeIndex}`} className="mb-4 p-4 border border-gray-200 rounded-md bg-white">
                                <div className="flex items-center space-x-2 mb-2">
                                  <input
                                    type="time"
                                    value={showtime.time}
                                    onChange={(e) => handleShowtimeChange(theatreID, screenName, dateIndex, showtimeIndex, 'time', e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeShowtime(theatreID, screenName, dateIndex, showtimeIndex)}
                                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                                <div className="mt-2">
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">Ticket Prices:</h6>
                                  {Object.keys(showtime.ticketPrices).map(seatType => (
                                    <div key={seatType} className="flex items-center space-x-2 mb-2">
                                      <label className="w-24 text-sm font-medium text-gray-700">{seatType.charAt(0).toUpperCase() + seatType.slice(1)}:</label>
                                      <input
                                        type="number"
                                        value={showtime.ticketPrices[seatType]}
                                        onChange={(e) => handleTicketPriceChange(theatreID, screenName, dateIndex, showtimeIndex, seatType, e.target.value)}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        placeholder="Price"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addShowtime(theatreID, screenName, dateIndex)}
                              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                            >
                              <FaPlus className="mr-2" /> Add Showtime
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        {showtimes[theatreID]?.[screenName]?.showtimes?.map((showtime, index) => (
                          <div key={`${theatreID}-${screenName}-${index}`} className="mb-4 p-4 border border-gray-200 rounded-md bg-white">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="time"
                                value={showtime.time}
                                onChange={(e) => handleShowtimeChange(theatreID, screenName, null, index, 'time', e.target.value)}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              />
                              <button
                                type="button"
                                onClick={() => removeShowtime(theatreID, screenName, null, index)}
                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                              >
                                <FaTrash />
                              </button>
                            </div>
                            <div className="mt-2">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Ticket Prices:</h5>
                              {Object.keys(showtime.ticketPrices).map(seatType => (
                                <div key={seatType} className="flex items-center space-x-2 mb-2">
                                  <label className="w-24 text-sm font-medium text-gray-700">{seatType.charAt(0).toUpperCase() + seatType.slice(1)}:</label>
                                  <input
                                    type="number"
                                    value={showtime.ticketPrices[seatType]}
                                    onChange={(e) => handleTicketPriceChange(theatreID, screenName, null, index, seatType, e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    placeholder="Price"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addShowtime(theatreID, screenName)}
                          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                        >
                          <FaPlus className="mr-2" /> Add Showtime
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
              >
                Add Shows
              </button>
            </div>
          </form>
        </div>

        {/* Filters for existing shows */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Filter Existing Shows</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="theater-filter" className="block text-sm font-medium text-gray-700">
                Theater
              </label>
              <select
                id="theater-filter"
                name="theater"
                value={filters.theater}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">All Theaters</option>
                {theaters.map((theater) => (
                  <option key={theater.id} value={theater.id}>
                    {theater["theatre-name"]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="movie-filter" className="block text-sm font-medium text-gray-700">
                Movie
              </label>
              <select
                id="movie-filter"
                name="movie"
                value={filters.movie}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">All Movies</option>
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date-filter"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="time-filter" className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <input
                type="time"
                id="time-filter"
                name="time"
                value={filters.time}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Table for existing shows */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Existing Shows</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Movie</th>
                  <th className="px-4 py-2 text-left">Theater</th>
                  <th className="px-4 py-2 text-left">Screen</th>
                  <th className="px-4 py-2 text-left">Date & Time</th>
                  <th className="px-4 py-2 text-left">Ticket Prices</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShows.map((show) => (
                  <tr key={show.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{movies.find((m) => m.id === show.movieId)?.title}</td>
                    <td className="px-4 py-2">{theaters.find((t) => t.id === show.theatreID)?.["theatre-name"]}</td>
                    <td className="px-4 py-2">{show.screenName}</td>
                    <td className="px-4 py-2">{show.datetime.toDate().toLocaleString()}</td>
                    <td className="px-4 py-2">
                      {Object.entries(show.ticketPrices).map(([type, price]) => (
                        <div key={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}: Rs.{parseFloat(price).toFixed(2)}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleManageSeats(show)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        <FaChair />
                      </button>
                      <button
                        onClick={() => handleEditShow(show)}
                        className="text-green-600 hover:text-green-800 mr-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteShow(show.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />

      {/* Manage Seats Modal */}
      {selectedShow && (
        <ManageSeatsModal
          show={selectedShow}
          onClose={() => setSelectedShow(null)}
          onSave={handleUpdateSeatMatrix}
        />
      )}

      {/* Edit Show Modal */}
      {editingShow && (
        <EditShowModal
          show={editingShow}
          onClose={() => setEditingShow(null)}
          onSave={handleUpdateShow}
        />
      )}
    </div>
  );
};

// Manage Seats Modal Component
const ManageSeatsModal = ({ show, onClose, onSave }) => {
  const [seatMatrix, setSeatMatrix] = useState(show.seatMatrix);

  const handleSeatToggle = (row, seatIndex) => {
    setSeatMatrix((prevMatrix) => {
      const newMatrix = JSON.parse(JSON.stringify(prevMatrix)); // Deep copy
      newMatrix.matrix[row].seats[seatIndex] = !newMatrix.matrix[row].seats[seatIndex];
      return newMatrix;
    });
  };

  const handleSave = () => {
    onSave(show.id, seatMatrix);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Seats</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {Object.entries(seatMatrix.matrix).map(([row, { seats, type }]) => (
              <div key={row} className="flex mb-2">
                <span className="w-8 text-center">{row}</span>
                {seats.map((isAvailable, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 m-1 rounded-md flex items-center justify-center ${
                      isAvailable ? "bg-green-500" : "bg-red-500"
                    }`}
                    onClick={() => handleSeatToggle(row, index)}
                  >
                    <FaChair className="text-white" />
                  </button>
                ))}
                <span className="ml-2">{type}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Show Modal Component
const EditShowModal = ({ show, onClose, onSave }) => {
  const [editedShow, setEditedShow] = useState(show);

  const handleTicketPriceChange = (seatType, price) => {
    setEditedShow((prev) => ({
      ...prev,
      ticketPrices: {
        ...prev.ticketPrices,
        [seatType]: price,
      },
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(editedShow);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Show</h3>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">Ticket Prices</h4>
            {Object.entries(editedShow.ticketPrices).map(([type, price]) => (
              <div key={type} className="flex items-center space-x-2 mb-2">
                <label className="w-24 text-sm font-medium text-gray-700">{type.charAt(0).toUpperCase() + type.slice(1)}:</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => handleTicketPriceChange(type, e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="Price"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageShowsPage;