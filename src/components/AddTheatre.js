import React, { useState } from 'react';
import { firestore } from '../firebase';
import { TextField, Button, Typography, Container, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function AddTheatre() {
  const classes = useStyles();
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [seatingRows, setSeatingRows] = useState('');
  const [seatingCols, setSeatingCols] = useState('');
  const [pricing, setPricing] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await firestore.collection('theatres').add({
        name,
        owner,
        contact,
        location,
        seatingArrangement: {
          rows: parseInt(seatingRows),
          cols: parseInt(seatingCols),
        },
        pricing: parseFloat(pricing),
      });
      alert('Theatre added successfully!');
      // Reset form
      setName('');
      setOwner('');
      setContact('');
      setLocation('');
      setSeatingRows('');
      setSeatingCols('');
      setPricing('');
    } catch (error) {
      alert('Error adding theatre: ' + error.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <div className={classes.paper}>
        <Typography component="h1" variant="h5">
          Add Theatre
        </Typography>
        <form className={classes.form} onSubmit={handleSubmit}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="name"
            label="Theatre Name"
            name="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="owner"
            label="Owner"
            name="owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="contact"
            label="Contact Information"
            name="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="location"
            label="Location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="seatingRows"
            label="Seating Rows"
            name="seatingRows"
            type="number"
            value={seatingRows}
            onChange={(e) => setSeatingRows(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="seatingCols"
            label="Seating Columns"
            name="seatingCols"
            type="number"
            value={seatingCols}
            onChange={(e) => setSeatingCols(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="pricing"
            label="Pricing"
            name="pricing"
            type="number"
            value={pricing}
            onChange={(e) => setPricing(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Add Theatre
          </Button>
        </form>
      </div>
    </Container>
  );
}

export default AddTheatre;