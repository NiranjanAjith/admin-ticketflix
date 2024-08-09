import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { FaHome, FaTheaterMasks, FaFilm, FaUserTie, FaSignOutAlt } from 'react-icons/fa';

const Header = () => {
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <header className="dashboard-header">
            <h1>TicketFlix Admin</h1>
            <nav className="dashboard-nav">
                <ul>
                    <li><Link to="/" className='button'><FaHome /> Dashboard</Link></li>
                    <li><Link to="/add-theatre" className='button'><FaTheaterMasks /> Add Theater</Link></li>
                    <li><Link to="/add-movie" className='button'><FaFilm /> Add Movie</Link></li>
                    <li><Link to="/add-executive" className='button'><FaUserTie /> Add Executive</Link></li>
                    <li><button onClick={handleLogout} className="button"><FaSignOutAlt /> Logout</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;