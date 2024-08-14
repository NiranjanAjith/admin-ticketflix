import React, { useEffect, useState } from "react";
import { Route, Navigate } from "react-router-dom";
import { auth } from "../firebase";

import AdminLogin from "../pages/auth/AdminLogin";
import AdminDashboard from "../pages/AdminDashboard";
import AddTheatre from "../pages/AddTheatrePage";
import ManageTheatresPage from "../pages/ManageTheatresPage";
import ManageMoviesPage from "../pages/ManageMoviesPage";
import AddMoviePaeg from "../pages/AddMoviePage";
import ManageExecutivesPage from "../pages/ManageExecutivesPage";

import ExecutievLogin from "../pages/auth/ExecutiveLogin";
import ExecutiveSignup from "../pages/auth/ExecutiveSignup";
import ExecutiveDashboard from "../pages/executive/ExecutiveDashboard";
import CouponGeneration from "../pages/executive/CouponGenerationPage";
import TransactionForm from "../pages/executive/AddTransactionPage";

import routes from "./constants";
import LandingPage from "../pages/LandingPage";

const AdminRoutes = () => {
  const AdminPrivateRoute = ({ children }) => {
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setIsAuthenticated(!!user);
        setAuthChecked(true);
      });

      return () => unsubscribe();
    }, []);

    if (!authChecked) {
      return <div>Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to={routes.ADMIN_LOGIN} />;
  };

  return [
    <Route path={routes.ADMIN_LOGIN} element={<AdminLogin />} />,
    <Route
      path={routes.ADMIN_DASHBOARD}
      element={
        <AdminPrivateRoute>
          <AdminDashboard />
        </AdminPrivateRoute>
      }
    />,
    <Route
      path={routes.ADD_THEATRE}
      element={
        <AdminPrivateRoute>
          <AddTheatre />
        </AdminPrivateRoute>
      }
    />,
    <Route
      path={routes.MANAGE_THEATRES}
      element={
        <AdminPrivateRoute>
          <ManageTheatresPage />
        </AdminPrivateRoute>
      }
    />,
    <Route
      path={routes.MANAGE_MOVIES}
      element={
        <AdminPrivateRoute>
          <ManageMoviesPage />
        </AdminPrivateRoute>
      }
    />,
    <Route
      path={routes.ADD_MOVIE}
      element={
        <AdminPrivateRoute>
          <AddMoviePaeg />
        </AdminPrivateRoute>
      }
    />,

    <Route
      path={routes.MANAGE_EXECS}
      element={
        <AdminPrivateRoute>
          <ManageExecutivesPage />
        </AdminPrivateRoute>
      }
    />,
  ];
};

const ExecutiveRoutes = () => {
  const ExecutivePrivateRoute = ({ children }) => {
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setIsAuthenticated(!!user);
        setAuthChecked(true);
      });

      return () => unsubscribe();
    }, []);

    if (!authChecked) {
      return <div>Loading...</div>;
    }

    return isAuthenticated ? (
      children
    ) : (
      <Navigate to={routes.EXEC_LOGIN} />
    );
  };

  return [
    <Route path={routes.EXEC_LOGIN} element={<ExecutievLogin />} />,
    <Route path={routes.EXEC_SIGNUP} element={<ExecutiveSignup />} />,
    <Route
      path={routes.EXEC_DASHBOARD}
      element={
        <ExecutivePrivateRoute>
          <ExecutiveDashboard />
        </ExecutivePrivateRoute>
      }
    />,
    <Route
      path={routes.EXEC_ADD_TRANSACTION}
      element={
        <ExecutivePrivateRoute>
          <TransactionForm />
        </ExecutivePrivateRoute>
      }
    />,
    <Route
      path={routes.EXEC_COUPON_GEN}
      element={
        <ExecutivePrivateRoute>
          <CouponGeneration />
        </ExecutivePrivateRoute>
      }
    />,
    <Route path="/" element={<LandingPage></LandingPage>} />,
  ];
};

export { ExecutiveRoutes, AdminRoutes };
