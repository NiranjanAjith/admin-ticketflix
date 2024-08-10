import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './styles.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { auth } from './firebase';
import AddTheatre from './pages/AddTheatre';
import Movie from './pages/movie';
import AddMovie from './pages/AddMovie'
import AddExecutive from './pages/AddExecutive';
import QRCodeGenerator from './pages/genQR'

const PrivateRoute = ({ children }) => {
  return auth.currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path='/add-theatre'
            element={
              <PrivateRoute>
                <AddTheatre />
              </PrivateRoute>
            }
          />

          <Route
            path='/movie'
            element={
              <PrivateRoute>
                <Movie />
              </PrivateRoute>
            }
          />
          <Route
            path='/add-movie'
            element={
              <PrivateRoute>
                <AddMovie />
              </PrivateRoute>
            }
          />

          <Route
            path='/add-executive'
            element={
              <PrivateRoute>
                <AddExecutive />
              </PrivateRoute>
            }
          />

          <Route
            path='/coupon'
            element={
              <PrivateRoute>
                <QRCodeGenerator />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;