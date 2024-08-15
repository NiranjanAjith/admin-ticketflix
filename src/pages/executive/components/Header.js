import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase";
import {
  FaHome,
  FaTheaterMasks,
  FaFilm,
  FaUserTie,
  FaSignOutAlt,
  FaPlus,
  FaTicketAlt,
} from "react-icons/fa";
import routes from "../../../routes/constants";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExecutive, setIsExecutive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const adminEmails = ["admin@ticketflix.in", "developer@ticketflix.com"];
        setIsAdmin(adminEmails.includes(user.email));
        setIsExecutive(!adminEmails.includes(user.email));
      } else {
        setIsAdmin(false);
        setIsExecutive(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate(isAdmin ? routes.ADMIN_LOGIN : routes.EXEC_LOGIN);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const place = location.pathname;

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
              {isAdmin ? (
                <>
                  <li>
                    <Link to={routes.ADMIN_DASHBOARD} className={navLinkStyle}>
                      <FaHome className="mr-1" /> Dashboard
                    </Link>
                  </li>
                  {place === routes.MANAGE_THEATRES ? (
                    <li>
                      <Link to={routes.ADD_THEATRE} className={navLinkStyle}>
                        <FaPlus className="mr-1" /> Add Theater
                      </Link>
                    </li>
                  ) : (
                    <li>
                      <Link to={routes.MANAGE_THEATRES} className={navLinkStyle}>
                        <FaTheaterMasks className="mr-1" /> Theaters
                      </Link>
                    </li>
                  )}
                  {place === routes.MANAGE_MOVIES ? (
                    <li>
                      <Link to={routes.ADD_MOVIE} className={navLinkStyle}>
                        <FaPlus className="mr-1" /> Add Movie
                      </Link>
                    </li>
                  ) : (
                    <li>
                      <Link to={routes.MANAGE_MOVIES} className={navLinkStyle}>
                        <FaFilm className="mr-1" /> Movies
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link to={routes.MANAGE_EXECS} className={navLinkStyle}>
                      <FaUserTie className="mr-1" /> Executives
                    </Link>
                  </li>
                </>
              ) : isExecutive ? (
                <>
                  <li>
                    <Link to={routes.EXEC_DASHBOARD} className={navLinkStyle}>
                      <FaHome className="mr-1" /> Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to={routes.EXEC_COUPON_GEN} className={navLinkStyle}>
                      <FaTicketAlt className="mr-1" /> Generate Coupons
                    </Link>
                  </li>
                  <li>
                    <Link to={routes.EXEC_ADD_TRANSACTION} className={navLinkStyle}>
                      <FaPlus className="mr-1" /> Add Transaction
                    </Link>
                  </li>
                </>
              ) : null}
              <li>
                <button onClick={handleLogout} className={navLinkStyle}>
                  <FaSignOutAlt className="mr-1" /> Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

const navLinkStyle = "hover:no-underline hover:text-blue-200 transition-all";

export default Header;