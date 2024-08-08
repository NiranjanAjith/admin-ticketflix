import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

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
                    <li><Link to="/" className='button'>Dashboard</Link></li>
                    <li><Link to="/add-theatre" className='button'>+Theater</Link></li>
                    {/* Add more navigation items as needed */}
                    <li><button onClick={handleLogout} className="button">Logout</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;