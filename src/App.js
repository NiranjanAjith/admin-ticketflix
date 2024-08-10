import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './styles.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { auth } from './firebase';
import AddTheatre from './pages/AddTheatre';
import Theatre from './pages/Theatre';
import Movie from './pages/Movie';
import AddMovie from './pages/AddMovie'
import AddExecutive from './pages/AddExecutive';
import Executive from './pages/Executive';

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;