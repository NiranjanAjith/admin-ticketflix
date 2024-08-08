import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ManageMovies from './components/ManageMovies';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AddTheatre from './components/AddTheatre';
import AddMovie from './components/AddMovie';
import AddExecutive from './components/AddExecutive';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Switch>
          <Route exact path="/login" component={Login} />
          <Layout>
            <PrivateRoute exact path="/" component={Dashboard} />
            <PrivateRoute path="/add-theatre" component={AddTheatre} />
            <PrivateRoute path="/add-movie" component={AddMovie} />
            <PrivateRoute path="/add-executive" component={AddExecutive} />
            <Route path="/manage-movies" component={ManageMovies} />
          </Layout>
        </Switch>
      </Router>
    </ThemeProvider>
  );
}

export default App;