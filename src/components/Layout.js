import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, makeStyles } from '@material-ui/core';
import { auth } from '../firebase';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
  },
  content: {
    padding: theme.spacing(3),
  },
}));

function Layout({ children }) {
  const classes = useStyles();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            Cinema Admin
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/add-theatre">
            Add Theatre
          </Button>
          <Button color="inherit" component={Link} to="/add-movie">
            Add Movie
          </Button>
          <Button component={Link} to="/manage-movies">Manage Movies</Button>
          <Button color="inherit" component={Link} to="/add-executive">
            Add Executive
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>{children}</main>
    </div>
  );
}

export default Layout;