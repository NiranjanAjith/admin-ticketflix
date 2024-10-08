import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "../firebase";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Movie = () => {
  const [movies, setMovies] = useState([]);
  const [editingMovie, setEditingMovie] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      const moviesCollection = collection(firestore, "movies");
      const movieSnapshot = await getDocs(moviesCollection);
      const movieList = movieSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
    if (!editingMovie) return;
    const movieRef = doc(firestore, "movies", editingMovie.id);
    await updateDoc(movieRef, editingMovie);
    setMovies(
      movies.map((movie) =>
        movie.id === editingMovie.id ? editingMovie : movie
      )
    );
    setEditingMovie(null);
  };

  const handleEditChange = (e) => {
    if (!editingMovie) return;
    const { name, value } = e.target;
    if (name === "genre") {
      setEditingMovie((prev) => ({
        ...prev,
        [name]: value.split(",").map((item) => item.trim()),
      }));
    } else if (name.startsWith("showtimes.")) {
      const [, key] = name.split(".");
      setEditingMovie((prev) => ({
        ...prev,
        showtimes: {
          ...(prev.showtimes || {}),
          [key]: value,
        },
      }));
    } else if (name.startsWith("showEndDate.")) {
      const [, key] = name.split(".");
      setEditingMovie((prev) => ({
        ...prev,
        showEndDate: {
          ...(prev.showEndDate || {}),
          [key]: value,
        },
      }));
    } else {
      setEditingMovie((prev) => ({
        ...prev,
        [name]: name === "rating" ? parseFloat(value) : value,
      }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      await deleteDoc(doc(firestore, "movies", id));
      setMovies(movies.filter((movie) => movie.id !== id));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Movie List</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Release Date</th>
                  <th className="px-4 py-2 text-left">Genre</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Rating</th>
                  <th className="px-4 py-2 text-left">Trailer</th>
                  <th className="px-4 py-2 text-left">Poster</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{movie.title}</td>
                    <td className="px-4 py-2">
                      {movie.releaseDate?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{movie.genre?.join(", ")}</td>
                    <td className="px-4 py-2">{movie.duration} min</td>
                    <td className="px-4 py-2">{movie.rating}</td>
                    <td className="px-4 py-2">
                      <a
                        href={movie.trailer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Trailer
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-12 h-18 object-cover"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleEdit(movie)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(movie.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editingMovie && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
            id="my-modal"
          >
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
                    value={
                      editingMovie.releaseDate
                        ?.toDate()
                        .toISOString()
                        .split("T")[0] || ""
                    }
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
                  {/* Add similar safety checks for other fields */}
                  <h4 className="font-medium text-gray-900 mt-4">Showtimes</h4>
                  {editingMovie.showtimes &&
                    Object.entries(editingMovie.showtimes).map(
                      ([key, value]) => (
                        <input
                          key={key}
                          name={`showtimes.${key}`}
                          type="datetime-local"
                          value={
                            value?.toDate().toISOString().slice(0, 16) || ""
                          }
                          onChange={handleEditChange}
                          placeholder={key}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      )
                    )}
                  <h4 className="font-medium text-gray-900 mt-4">
                    Show End Dates
                  </h4>
                  {editingMovie.showEndDate &&
                    Object.entries(editingMovie.showEndDate).map(
                      ([key, value]) => (
                        <input
                          key={key}
                          name={`showEndDate.${key}`}
                          type="date"
                          value={
                            value?.toDate().toISOString().split("T")[0] || ""
                          }
                          onChange={handleEditChange}
                          placeholder={key}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      )
                    )}
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

export default Movie;
