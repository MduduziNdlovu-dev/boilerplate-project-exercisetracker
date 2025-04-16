const express = require('express');
const app = express();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');  // To generate unique user IDs
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // To handle JSON data in POST requests

// In-memory database for users and exercises
let users = [];

// Route to serve the index page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST /api/users to create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const user = {
    username,
    _id: uuidv4(), // Generate a unique user ID
  };
  users.push(user);
  res.json(user);
});

// GET /api/users to get a list of all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST /api/users/:_id/exercises to add an exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  // Find the user
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Add the exercise to the user's log
  const exercise = {
    description,
    duration: Number(duration), // Ensure duration is a number
    date: date || new Date().toISOString().split('T')[0], // Use current date if not provided
  };

  if (!user.exercises) {
    user.exercises = [];
  }
  user.exercises.push(exercise);

  // Return the user with the new exercise
  res.json(user);
});

// GET /api/users/:_id/logs to retrieve a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  // Find the user
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Filter exercises by date range (from and to)
  let log = user.exercises || [];

  if (from) {
    log = log.filter(ex => new Date(ex.date) >= new Date(from));
  }
  if (to) {
    log = log.filter(ex => new Date(ex.date) <= new Date(to));
  }

  // Limit the number of logs if limit is provided
  if (limit) {
    log = log.slice(0, Number(limit));
  }

  // Return the user with the log
  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log,
  });
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
