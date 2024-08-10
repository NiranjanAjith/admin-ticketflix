import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { FaHome, FaTheaterMasks, FaFilm, FaUserTie, FaSignOutAlt, FaPlus } from 'react-icons/fa';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const place = location.pathname;

    return (
        <header className="dashboard-header">
            <h1>TicketFlix</h1>
            <nav className="dashboard-nav">
                <ul>
                    <li><Link to="/" className='button'><FaHome /> Dashboard</Link></li>
                    {place === '/theatre' ? (
                        <li><Link to="/add-theatre" className='button'><FaPlus /> Add Theater</Link></li>
                    ) : (
                        <li><Link to="/theatre" className='button'><FaTheaterMasks /> Theaters</Link></li>
                    )}
                    {place === '/movie' ? (
                        <li><Link to="/add-movie" className='button'><FaPlus /> Add Movie</Link></li>
                    ) : (
                        <li><Link to="/movie" className='button'><FaFilm /> Movies</Link></li>
                    )}
                    {place === '/executive' ? (
                        <li><Link to="/add-executive" className='button'><FaPlus /> Add Executive</Link></li>
                    ) : (
                        <li><Link to="/executive" className='button'><FaUserTie /> Executives</Link></li>
                    )}
                    <li><Link to='/coupons' className='button'> Coupons </Link></li>
                    <li><button onClick={handleLogout} className="button"><FaSignOutAlt /> Logout</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;