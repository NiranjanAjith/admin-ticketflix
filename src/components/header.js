import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { FaHome, FaTheaterMasks, FaFilm, FaUserTie, FaSignOutAlt, FaPlus, FaTicketAlt } from 'react-icons/fa';

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
        <header className="bg-gray-900 text-white shadow-lg w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between py-3">
                    <h1 className="text-3xl font-bold text-red-600 flex items-center mb-4 md:mb-0">
                        <FaTicketAlt className="mr-2" />
                        TicketFlix
                    </h1>
                    <nav className="w-full md:w-auto">
                        <ul className="flex flex-wrap justify-center md:justify-end space-x-2 md:space-x-4">
                            <li><Link to="/" className="btn-nav"><FaHome className="mr-1" /> Dashboard</Link></li>
                            {place === '/theatre' ? (
                                <li><Link to="/add-theatre" className="btn-nav"><FaPlus className="mr-1" /> Add Theater</Link></li>
                            ) : (
                                <li><Link to="/theatre" className="btn-nav"><FaTheaterMasks className="mr-1" /> Theaters</Link></li>
                            )}
                            {place === '/movie' ? (
                                <li><Link to="/add-movie" className="btn-nav"><FaPlus className="mr-1" /> Add Movie</Link></li>
                            ) : (
                                <li><Link to="/movie" className="btn-nav"><FaFilm className="mr-1" /> Movies</Link></li>
                            )}
                            {place === '/executive' ? (
                                <li><Link to="/add-executive" className="btn-nav"><FaPlus className="mr-1" /> Add Executive</Link></li>
                            ) : (
                                <li><Link to="/executive" className="btn-nav"><FaUserTie className="mr-1" /> Executives</Link></li>
                            )}
                            <li><Link to='/coupons' className="btn-nav"><FaTicketAlt className="mr-1" /> Coupons</Link></li>
                            <li><button onClick={handleLogout} className="btn-nav"><FaSignOutAlt className="mr-1" /> Logout</button></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;