import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { auth } from './firebase';

import './styles.css';
import './index.css';

import { AdminRoutes, ExecutiveRoutes } from "./routes/routesList";

function App() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return <div>Loading...</div>; // Or any loading indicator
  }
  return (
    <>
      <Router>
        <Routes>
          {AdminRoutes()}
          {ExecutiveRoutes()}
        </Routes>
      </Router>
    </>
  );
}

export default App;