import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <header className="bg-primary text-white py-3 fixed-top shadow">
        <div className="container d-flex justify-content-between">
          <div className="h1 logo">TicketFlix</div>
        </div>
      </header>

      <main className="flex-grow-1 d-flex justify-content-center align-items-center py-5">
        <div className="card shadow-sm rounded w-100 max-w-md">
          <div className="card-body">
            <h2 className="text-primary mb-4 text-center">Welcome Back</h2>
            <p className="text-muted text-center">Please login to your account</p>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="form-control"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block mt-3">
                Login
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="bg-primary text-white py-3 fixed-bottom shadow">
        <div className="container text-center">
          <p>&copy; 2024 TicketFlix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
