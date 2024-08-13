import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './styles.css';
import './index.css';


import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import { auth } from './firebase';
import AddTheatre from './pages/AddTheatre';
import Theatre from './pages/Theatre';
import Movie from './pages/Movie';
import AddShowTimes from './pages/AddShowTimes';
import AddMovie from './pages/AddMovie'
import AddExecutive from './pages/AddExecutive';
import Executive from './pages/executive/Executive';
import QRCodeGenerator from "./pages/executive/QRCodeGenerator";

const PrivateRoute = ({ children }) => {
  return auth.currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <>
    <Router>
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
            path='/theatre'
            element={
              <PrivateRoute>
                <Theatre />
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
            path='/executive'
            element={
              <PrivateRoute>
                <Executive />
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
            path='/add-showtimes/:movieId'
            element={
              <PrivateRoute>
                <AddShowTimes />
              </PrivateRoute>
            }
          />

          <Route
            path='/coupons'
            element={
              <PrivateRoute>
                <QRCodeGenerator />
              </PrivateRoute>
            }
          />
        </Routes>
    </Router>
    </>
  );
}

export default App;