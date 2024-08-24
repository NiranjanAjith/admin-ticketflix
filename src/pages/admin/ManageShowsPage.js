import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { FaTrash, FaPlus, FaChair } from "react-icons/fa";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ManageShowsPage = () => {
  const { movieId } = useParams();
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [shows, setShows] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(movieId || "");
  const [selectedTheater, setSelectedTheater] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [showStartDate, setShowStartDate] = useState("");
  const [showEndDate, setShowEndDate] = useState("");
  const [showTimes, setShowTimes] = useState([{ hours: "12", minutes: "00" }]);
  const [message, setMessage] = useState({ type: "", content: "" });
  const [selectedShow, setSelectedShow] = useState(null);
  const [isManageSeatsModalOpen, setIsManageSeatsModalOpen] = useState(false);

  // Filters
  const [filterTheater, setFilterTheater] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");

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

  const handleAddShow = async (e) => {
    e.preventDefault();
    if (!selectedMovie || !selectedTheater || !selectedScreen || !showStartDate || !showEndDate || showTimes.length === 0) {
      setMessage({ type: "error", content: "Please fill in all fields and add at least one show time." });
      return;
    }

    try {
      const startDate = new Date(showStartDate);
      const endDate = new Date(showEndDate);
      const theater = theaters.find((t) => t.id === selectedTheater);
      const seatMatrix = theater["seat-matrix-layout"][selectedScreen];

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        for (const time of showTimes) {
          const showDateTime = new Date(date);
          showDateTime.setHours(parseInt(time.hours, 10), parseInt(time.minutes, 10));

          const showData = {
            movieId: selectedMovie,
            theaterId: selectedTheater,
            screenName: selectedScreen,
            datetime: Timestamp.fromDate(showDateTime),
            seatMatrix: seatMatrix,
          };

          await addDoc(collection(firestore, "shows"), showData);
        }
      }

      setMessage({ type: "success", content: "Shows added successfully!" });
      fetchShows();
      // Reset form fields except for the selected movie
      setSelectedTheater("");
      setSelectedScreen("");
      setShowStartDate("");
      setShowEndDate("");
      setShowTimes([{ hours: "12", minutes: "00" }]);
    } catch (error) {
      console.error("Error adding shows: ", error);
      setMessage({ type: "error", content: `Error adding shows: ${error.message}` });
    }
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

  const handleAddShowTime = () => {
    setShowTimes([...showTimes, { hours: "12", minutes: "00" }]);
  };

  const handleShowTimeChange = (index, field, value) => {
    const updatedShowTimes = [...showTimes];
    updatedShowTimes[index][field] = value;
    setShowTimes(updatedShowTimes);
  };

  const handleRemoveShowTime = (index) => {
    const updatedShowTimes = showTimes.filter((_, i) => i !== index);
    setShowTimes(updatedShowTimes);
  };

  const getMinDate = useCallback(() => {
    const selectedMovieData = movies.find(m => m.id === selectedMovie);
    return selectedMovieData ? selectedMovieData.releaseDate.toDate().toISOString().split('T')[0] : '';
  }, [movies, selectedMovie]);

  const handleManageSeats = (show) => {
    setSelectedShow(show);
    setIsManageSeatsModalOpen(true);
  };

  const filteredShows = useMemo(() => {
    return shows.filter((show) => {
      const showDate = show.datetime.toDate();
      return (
        (!filterTheater || show.theaterId === filterTheater) &&
        (!filterDate || showDate.toDateString() === new Date(filterDate).toDateString()) &&
        (!filterTime || 
          (showDate.getHours() === parseInt(filterTime.split(':')[0], 10) &&
           showDate.getMinutes() === parseInt(filterTime.split(':')[1], 10)))
      );
    });
  }, [shows, filterTheater, filterDate, filterTime]);

  const ManageSeatsModal = ({ show, onClose }) => {
    const [seatMatrix, setSeatMatrix] = useState(show.seatMatrix);
  
    const handleSeatToggle = (row, seatIndex) => {
      setSeatMatrix((prevMatrix) => {
        const newMatrix = JSON.parse(JSON.stringify(prevMatrix)); // Deep copy
        newMatrix.matrix[row].seats[seatIndex] = !newMatrix.matrix[row].seats[seatIndex];
        return newMatrix;
      });
    };
  
    const handleSave = async () => {
      try {
        const showRef = doc(firestore, "shows", show.id);
        await updateDoc(showRef, { seatMatrix });
        setMessage({ type: "success", content: "Seat matrix updated successfully!" });
        fetchShows();
        onClose();
      } catch (error) {
        console.error("Error updating seat matrix:", error);
        setMessage({ type: "error", content: `Error updating seat matrix: ${error.message}` });
      }
    };
  
    // Sort the rows alphabetically
    const sortedRows = useMemo(() => {
      return Object.entries(seatMatrix.matrix).sort((a, b) => a[0].localeCompare(b[0]));
    }, [seatMatrix]);
  
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Seats</h3>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {sortedRows.map(([row, { seats, type }]) => (
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
          <form onSubmit={handleAddShow} className="space-y-4">
            <div>
              <label htmlFor="movie" className="block text-sm font-medium text-gray-700">
                Movie:
              </label>
              <select
                id="movie"
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                disabled={!!movieId}
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
              <label htmlFor="theater" className="block text-sm font-medium text-gray-700">
                Theater:
              </label>
              <select
                id="theater"
                value={selectedTheater}
                onChange={(e) => setSelectedTheater(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">Select a theater</option>
                {theaters.map((theater) => (
                  <option key={theater.id} value={theater.id}>
                    {theater["theatre-name"]}
                  </option>
                ))}
              </select>
            </div>
            {selectedTheater && (
              <div>
                <label htmlFor="screen" className="block text-sm font-medium text-gray-700">
                  Screen:
                </label>
                <select
                  id="screen"
                  value={selectedScreen}
                  onChange={(e) => setSelectedScreen(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  <option value="">Select a screen</option>
                  {theaters
                    .find((t) => t.id === selectedTheater)
                    ?.["seat-matrix-layout"] &&
                    Object.keys(
                      theaters.find((t) => t.id === selectedTheater)["seat-matrix-layout"]
                    ).map((screenName) => (
                      <option key={screenName} value={screenName}>
                        {screenName}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Show Start Date:
              </label>
              <input
                type="date"
                id="startDate"
                value={showStartDate}
                onChange={(e) => setShowStartDate(e.target.value)}
                min={getMinDate()}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Show End Date:
              </label>
              <input
                type="date"
                id="endDate"
                value={showEndDate}
                onChange={(e) => setShowEndDate(e.target.value)}
                min={showStartDate || getMinDate()}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Show Times:</label>
              {showTimes.map((time, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <select
                    value={time.hours}
                    onChange={(e) => handleShowTimeChange(index, 'hours', e.target.value)}
                    className="mt-1 block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {[...Array(24)].map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <span>:</span>
                  <select
                    value={time.minutes}
                    onChange={(e) => handleShowTimeChange(index, 'minutes', e.target.value)}
                    className="mt-1 block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={(i * 5).toString().padStart(2, '0')}>
                        {(i * 5).toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveShowTime(index)}
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddShowTime}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
              >
                <FaPlus className="mr-2" /> Add Show Time
              </button>
            </div>
            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Add Shows
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Existing Shows</h3>
          <div className="mb-4 flex space-x-4">
            <select
              value={filterTheater}
              onChange={(e) => setFilterTheater(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Theaters</option>
              {theaters.map((theater) => (
                <option key={theater.id} value={theater.id}>
                  {theater["theatre-name"]}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <input
              type="time"
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Movie</th>
                  <th className="px-4 py-2 text-left">Theater</th>
                  <th className="px-4 py-2 text-left">Screen</th>
                  <th className="px-4 py-2 text-left">Date & Time</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShows.map((show) => (
                  <tr key={show.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{movies.find((m) => m.id === show.movieId)?.title}</td>
                    <td className="px-4 py-2">{theaters.find((t) => t.id === show.theaterId)?.["theatre-name"]}</td>
                    <td className="px-4 py-2">{show.screenName}</td>
                    <td className="px-4 py-2">{show.datetime.toDate().toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleManageSeats(show)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        <FaChair />
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
      {isManageSeatsModalOpen && (
        <ManageSeatsModal
          show={selectedShow}
          onClose={() => setIsManageSeatsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ManageShowsPage;