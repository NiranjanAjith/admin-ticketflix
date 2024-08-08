import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { Typography, Grid, Paper, makeStyles } from '@material-ui/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  chart: {
    marginTop: theme.spacing(3),
  },
}));

function Dashboard() {
  const classes = useStyles();
  const [stats, setStats] = useState({
    totalTickets: 0,
    preBookedTickets: 0,
    totalRevenue: 0,
  });
  const [movieData, setMovieData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [genreData, setGenreData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overall stats
        const statsDoc = await firestore.collection('stats').doc('overall').get();
        if (statsDoc.exists) {
          setStats(statsDoc.data());
        }

        // Fetch movie data
        const moviesSnapshot = await firestore.collection('movies').get();
        const moviesData = moviesSnapshot.docs.map(doc => ({
          name: doc.data().title,
          sold: doc.data().ticketsSold || 0,
          prebooked: doc.data().preBookedTickets || 0,
        }));
        setMovieData(moviesData);

        // Fetch revenue data (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const revenueSnapshot = await firestore
          .collection('dailyRevenue')
          .where('date', '>=', sevenDaysAgo)
          .orderBy('date')
          .get();
        const revenueData = revenueSnapshot.docs.map(doc => ({
          date: doc.data().date.toDate().toLocaleDateString(),
          revenue: doc.data().amount,
        }));
        setRevenueData(revenueData);

        // Fetch genre distribution
        const genres = {};
        moviesSnapshot.docs.forEach(doc => {
          const genre = doc.data().genre;
          genres[genre] = (genres[genre] || 0) + 1;
        });
        const genreData = Object.entries(genres).map(([name, value]) => ({ name, value }));
        setGenreData(genreData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Paper className={classes.paper}>
            <Typography variant="h6">Total Tickets Sold</Typography>
            <Typography variant="h4">{stats.totalTickets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper className={classes.paper}>
            <Typography variant="h6">Pre-booked Tickets</Typography>
            <Typography variant="h4">{stats.preBookedTickets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper className={classes.paper}>
            <Typography variant="h6">Total Revenue</Typography>
            <Typography variant="h4">${stats.totalRevenue.toFixed(2)}</Typography>
          </Paper>
        </Grid>
      </Grid>
      <div className={classes.chart}>
        <Typography variant="h5" gutterBottom>
          Ticket Sales by Movie
        </Typography>
        <BarChart width={600} height={300} data={movieData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sold" fill="#8884d8" />
          <Bar dataKey="prebooked" fill="#82ca9d" />
        </BarChart>
      </div>
      <div className={classes.chart}>
        <Typography variant="h5" gutterBottom>
          Revenue Last 7 Days
        </Typography>
        <LineChart width={600} height={300} data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
        </LineChart>
      </div>
      <div className={classes.chart}>
        <Typography variant="h5" gutterBottom>
          Genre Distribution
        </Typography>
        <PieChart width={400} height={400}>
          <Pie
            data={genreData}
            cx={200}
            cy={200}
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {genreData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
}

export default Dashboard;