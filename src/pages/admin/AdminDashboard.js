import React, { useState, useEffect } from 'react';
import { firestore } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Header from './components/Header';
import Footer from './components/Footer';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // FIXME: No users collection here. Fetch from auth
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Users</h2>
            {users.length > 0 ? (
              <ul className="space-y-2">
                {users.map(user => (
                  <li key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-gray-800">{user.name}</span>
                    <span className="text-gray-600 text-sm">{user.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No users found.</p>
            )}
          </section>
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Data</h2>
            {/* Add your data display logic here */}
            <p className="text-gray-600">Placeholder for data display</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;