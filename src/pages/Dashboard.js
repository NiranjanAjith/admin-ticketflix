import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Header from '../components/Header';
import './Dashboard.css';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <Header />
      <main className="dashboard-main">
        <section className="users-section">
          <h2>Users</h2>
          <ul>
            {users.map(user => (
              <li key={user.id}>{user.name} - {user.email}</li>
            ))}
          </ul>
        </section>
        <section className="data-section">
          <h2>Data</h2>
          {/* Add your data display logic here */}
          <p>Placeholder for data display</p>
        </section>
      </main>
      <footer className="footer">
        <p>&copy; 2024 TicketFlix Admin. All rights reserved.<br />
          Powered by Your Company Name</p>
      </footer>
    </div>
  );
};

export default Dashboard;