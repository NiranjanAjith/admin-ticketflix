import React, { useState, useEffect } from 'react';
import { firestore } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Header from './components/Header';
import Footer from './components/Footer';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdminDashboard = () => {
  const [userTickets, setUserTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: 'all', movie: 'all', theatre: 'all' });
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [selectedTheatre, setSelectedTheatre] = useState('all');
  const [selectedMovie, setSelectedMovie] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [preferenceData, setPreferenceData] = useState({
    firstPreference: [],
    secondPreference: [],
    thirdPreference: []
  });

  const fetchPreferenceData = async () => {
    try {
      const moviesCol = collection(firestore, 'movies');
      const moviesSnapshot = await getDocs(moviesCol);
      const moviesData = moviesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const theatresCol = collection(firestore, 'theatres');
      const theatresSnapshot = await getDocs(theatresCol);
      const theatresData = theatresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const theatreNameMap = theatresData.reduce((acc, theatre) => {
        acc[theatre.id] = theatre['theatre-name'];
        return acc;
      }, {});

      const preferenceData = {
        firstPreference: [],
        secondPreference: [],
        thirdPreference: []
      };

      moviesData.forEach(movie => {
        ['firstPreference', 'secondPreference', 'thirdPreference'].forEach(pref => {
          if (movie[pref]) {
            Object.entries(movie[pref]).forEach(([theatreId, count]) => {
              preferenceData[pref].push({
                theatreName: theatreNameMap[theatreId] || 'Unknown',
                count,
                theatreId,
                movieId: movie.id
              });
            });
          }
        });
      });

      Object.keys(preferenceData).forEach(pref => {
        preferenceData[pref].sort((a, b) => b.count - a.count);
      });

      return preferenceData;
    } catch (error) {
      console.error("Error fetching preference data:", error);
      return {
        firstPreference: [],
        secondPreference: [],
        thirdPreference: []
      };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const collections = ['tickets', 'Users', 'theatres', 'shows', 'movies', 'executives'];
        const [userTicketsData, usersData, theatresData, showsData, moviesData, executivesData] = await Promise.all(
          collections.map(async (collectionName) => {
            const snapshot = await getDocs(collection(firestore, collectionName));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          })
        );

        setUserTickets(userTicketsData);
        setUsers(usersData);
        setTheatres(theatresData);
        setShows(showsData);
        setMovies(moviesData);
        setExecutives(executivesData);

        const data = await fetchPreferenceData();
        setPreferenceData(data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFilterOptions = (data, field) => {
    const options = ['all', ...new Set(data.map(item => item[field]))];
    return options.filter(option => option);
  };

  const cityOptions = getFilterOptions(theatres, 'city');
  const movieOptions = getFilterOptions(movies, 'title');
  const theatreOptions = getFilterOptions(theatres, 'theatre-name');
  const locationOptions = getFilterOptions(theatres, 'city'); // Assuming location is represented by city
  const executiveOptions = getFilterOptions(executives, 'name');

  const filteredUserTickets = userTickets.filter(ticket => 
    (filters.city === 'all' || theatres.find(t => t.id === ticket['theater-id'])?.city === filters.city) &&
    (filters.movie === 'all' || shows.find(s => s.id === ticket['show-id'])?.movieId === movies.find(m => m.title === filters.movie)?.id) &&
    (filters.theatre === 'all' || theatres.find(t => t.id === ticket['theater-id'])?.['theatre-name'] === filters.theatre)
  );

  const salesAnalytics = [
    { name: 'Diamond Class', value: filteredUserTickets.filter(ticket => ticket.class === 'diamond').length },
    { name: 'Gold Class', value: filteredUserTickets.filter(ticket => ticket.class === 'gold').length },
    { name: 'Regular Class', value: filteredUserTickets.filter(ticket => ticket.class === 'regular').length },
  ];

  const salesByMovie = movies.map(movie => ({
    name: movie.title.length > 15 ? movie.title.substring(0, 15) + '...' : movie.title,
    value: filteredUserTickets.filter(ticket => 
      shows.find(s => s.id === ticket['show-id'])?.movieId === movie.id
    ).length
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const topUsersByBooking = users.map(user => ({
    name: user.name,
    value: filteredUserTickets.filter(ticket => ticket['user-id'] === user.id).length
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const selectedExecutiveData = executives.find(exec => exec.name === selectedExecutive) || {};

  const filteredPreferences = {
    firstPreference: preferenceData.firstPreference.filter(item =>
      (selectedMovie === 'all' || item.movieId === movies.find(m => m.title === selectedMovie)?.id) &&
      (selectedTheatre === 'all' || item.theatreId === theatres.find(t => t['theatre-name'] === selectedTheatre)?.id) &&
      (selectedLocation === 'all' || theatres.find(t => t.id === item.theatreId)?.city === selectedLocation)
    ),
    secondPreference: preferenceData.secondPreference.filter(item =>
      (selectedMovie === 'all' || item.movieId === movies.find(m => m.title === selectedMovie)?.id) &&
      (selectedTheatre === 'all' || item.theatreId === theatres.find(t => t['theatre-name'] === selectedTheatre)?.id) &&
      (selectedLocation === 'all' || theatres.find(t => t.id === item.theatreId)?.city === selectedLocation)
    ),
    thirdPreference: preferenceData.thirdPreference.filter(item =>
      (selectedMovie === 'all' || item.movieId === movies.find(m => m.title === selectedMovie)?.id) &&
      (selectedTheatre === 'all' || item.theatreId === theatres.find(t => t['theatre-name'] === selectedTheatre)?.id) &&
      (selectedLocation === 'all' || theatres.find(t => t.id === item.theatreId)?.city === selectedLocation)
    )
  };

  filteredPreferences.firstPreference.sort((a, b) => b.count - a.count);
  filteredPreferences.secondPreference.sort((a, b) => b.count - a.count);
  filteredPreferences.thirdPreference.sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
        
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sales Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="cityFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by City</label>
              <select
                id="cityFilter"
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {cityOptions.map(option => (
                  <option key={option} value={option}>{option === 'all' ? 'All Cities' : option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="movieFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Movie</label>
              <select
                id="movieFilter"
                value={filters.movie}
                onChange={(e) => setFilters({...filters, movie: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {movieOptions.map(option => (
                  <option key={option} value={option}>{option === 'all' ? 'All Movies' : option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="theatreFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Theatre</label>
              <select
                id="theatreFilter"
                value={filters.theatre}
                onChange={(e) => setFilters({...filters, theatre: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {theatreOptions.map(option => (
                  <option key={option} value={option}>{option === 'all' ? 'All Theatres' : option}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesAnalytics}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {salesAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByMovie} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="category" dataKey="name" />
                  <YAxis type="number" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Users by Booking</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topUsersByBooking} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Movie Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="moviePreferenceFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Movie</label>
              <select
                id="moviePreferenceFilter"
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {movieOptions.map(option => (
                  <option key={option} value={option}>{option === 'all' ? 'All Movies' : option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="theatrePreferenceFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Theatre</label>
              <select
                id="theatrePreferenceFilter"
                value={selectedTheatre}
                onChange={(e) => setSelectedTheatre(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {theatreOptions.map(option => (
                  <option key={option} value={option}>{option === 'all' ? 'All Theatres' : option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="locationPreferenceFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Location</label>
              <select
                id="locationPreferenceFilter"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {locationOptions.map(option => (
                  <option key={option} value={option}>{option === 'all' ? 'All Locations' : option}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">First Preference</h3>
              <ul>
                {filteredPreferences.firstPreference.map((item, index) => (
                  <li key={index} className="flex justify-between py-1">
                    <span>{item.theatreName}</span>
                    <span>{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Second Preference</h3>
              <ul>
                {filteredPreferences.secondPreference.map((item, index) => (
                  <li key={index} className="flex justify-between py-1">
                    <span>{item.theatreName}</span>
                    <span>{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Third Preference</h3>
              <ul>
                {filteredPreferences.thirdPreference.map((item, index) => (
                  <li key={index} className="flex justify-between py-1">
                    <span>{item.theatreName}</span>
                    <span>{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Executive Details</h2>
          {selectedExecutive && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Selected Executive: {selectedExecutive}</h3>
              <p><strong>ID:</strong> {selectedExecutiveData.id || 'N/A'}</p>
              <p><strong>Name:</strong> {selectedExecutiveData.name || 'N/A'}</p>
              <p><strong>Assigned Theatre:</strong> {selectedExecutiveData['assigned-theatre'] || 'N/A'}</p>
              <p><strong>Contact:</strong> {selectedExecutiveData.contact || 'N/A'}</p>
            </div>
          )}
          <div className="mt-4">
            <label htmlFor="executiveFilter" className="block text-sm font-medium text-gray-700 mb-1">Select Executive</label>
            <select
              id="executiveFilter"
              value={selectedExecutive}
              onChange={(e) => setSelectedExecutive(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {executiveOptions.map(option => (
                <option key={option} value={option}>{option === 'all' ? 'All Executives' : option}</option>
              ))}
            </select>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
