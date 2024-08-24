import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../firebase";
import { FaTrashAlt, FaEdit, FaPlus, FaFilm } from "react-icons/fa";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ManageMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [poster, setPoster] = useState(null);
  const [message, setMessage] = useState({ type: '', content: '' });

  useEffect(() => {
    fetchMovies();
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
        releaseDate: Timestamp.fromDate(new Date(editingMovie.releaseDate)),
        showEndDate: Timestamp.fromDate(new Date(editingMovie.showEndDate)),
      };

      const movieRef = doc(firestore, "movies", editingMovie.id);
      await updateDoc(movieRef, movieData);

      setMessage({ type: 'success', content: 'Movie updated successfully!' });
      setEditingMovie(null);
      setPoster(null);
      fetchMovies();
    } catch (error) {
      console.error('Error updating movie: ', error);
      setMessage({ type: 'error', content: `Error updating movie: ${error.message}` });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      try {
        await deleteDoc(doc(firestore, "movies", id));
        setMessage({ type: 'success', content: 'Movie deleted successfully!' });
        fetchMovies();
      } catch (error) {
        console.error('Error deleting movie: ', error);
        setMessage({ type: 'error', content: `Error deleting movie: ${error.message}` });
      }
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
        [name]: name === "duration" ? parseFloat(value) : value,
      }));
    }
  };

  const handlePosterChange = (e) => {
    setPoster(e.target.files[0]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Movie List</h2>
            <Link
              to="/campaign-admin/movies/add-movie"
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <FaPlus className="inline mr-2" /> Add Movie
            </Link>
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
                    <td className="px-4 py-2">{movie.director}</td>
                    <td className="px-4 py-2">{movie.language}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleEdit(movie)} className="text-blue-600 hover:text-blue-800 mr-2">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(movie.id)} className="text-red-600 hover:text-red-800 mr-2">
                        <FaTrashAlt />
                      </button>
                      <Link
                        to={`/campaign-admin/manage-shows/${movie.id}`}
                        className="block w-full bg-blue-500 text-white text-center px-2 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <FaFilm className="inline mr-1" /> Manage Shows
                      </Link>
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
                  Edit Movie
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
                      onClick={() => setEditingMovie(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Update Movie
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