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
            {[
              { id: 'cityFilter', label: 'Cities', options: cityOptions },
              { id: 'movieFilter', label: 'Movie', options: movieOptions },
              { id: 'theatreFilter', label: 'Theatre', options: theatreOptions },
            ].map(filter => (
              <div key={filter.id}>
                <label htmlFor={filter.id} className="block text-sm font-medium text-gray-700 mb-1">Filter by {filter.label}</label>
                <select
                  id={filter.id}
                  value={filters[filter.id.split('Filter')[0]]}
                  onChange={(e) => setFilters({...filters, [filter.id.split('Filter')[0]]: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {filter.options.map(option => (
                    <option key={option} value={option}>{option === 'all' ? `All ${filter.label}` : option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesAnalytics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `(${(percent * 100).toFixed(0)}%)`}
                  >
                    {salesAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByMovie} layout="vertical" margin={{ left: 100, right: 20, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Users by Bookings</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topUsersByBooking} layout="vertical" margin={{ left: 100, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Executive Performance</h2>
          <div className="mb-4">
            <label htmlFor="executiveFilter" className="block text-sm font-medium text-gray-700 mb-1">Select Executive</label>
            <select
              id="executiveFilter"
              value={selectedExecutive}
              onChange={(e) => setSelectedExecutive(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Executives</option>
              {executiveOptions.filter(option => option !== 'all').map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {selectedExecutive !== 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Total Coupons Generated</h3>
                <p className="text-2xl font-bold">{selectedExecutiveData.coupon_count || 0}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Sold Coupons</h3>
                <p className="text-2xl font-bold">{selectedExecutiveData.sold_coupons || 0}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Unsold Coupons</h3>
                <p className="text-2xl font-bold">{selectedExecutiveData.unsold_coupons || 0}</p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ticket Sales List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theatre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUserTickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket['ticket-id']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {users.find(u => u.id === ticket['user-id'])?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movies.find(m => m.id === shows.find(s => s.id === ticket['show-id'])?.movieId)?.title || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {theatres.find(t => t.id === ticket['theater-id'])?.['theatre-name'] || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket['amount-paid']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.class}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;