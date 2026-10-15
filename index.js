// Exercise Tracker - freeCodeCamp Back End Development and APIs
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false })); // read form posts
app.use(express.json());

// in-memory storage
const users = [];     // { _id, username }
const exercises = []; // { userId, description, duration, date (Date) }

const newId = () => crypto.randomBytes(12).toString('hex');

app.get('/', (req, res) => {
  res.send('<h1>Exercise Tracker</h1>' +
    '<form action="/api/users" method="POST"><h3>Create a user</h3>' +
    '<input name="username" placeholder="username" required> <button>Submit</button></form>' +
    '<form id="ex" method="POST"><h3>Add exercise</h3>' +
    '<input id="uid" placeholder=":_id" required> ' +
    '<input name="description" placeholder="description" required> ' +
    '<input name="duration" placeholder="duration (mins)" required> ' +
    '<input name="date" placeholder="date (yyyy-mm-dd)"> <button>Submit</button></form>' +
    '<script>document.getElementById("ex").onsubmit=function(){' +
    'this.action="/api/users/"+document.getElementById("uid").value+"/exercises"};</script>');
});

// POST /api/users -> { username, _id }
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) return res.json({ error: 'username is required' });
  const user = { username, _id: newId() };
  users.push(user);
  res.json(user);
});

// GET /api/users -> [{ username, _id }, ...]
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST /api/users/:_id/exercises -> user object with the exercise added
app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find(u => u._id === req.params._id);
  if (!user) return res.json({ error: 'user not found' });

  const { description, duration, date } = req.body;
  if (!description || !duration || isNaN(Number(duration))) {
    return res.json({ error: 'description and numeric duration are required' });
  }

  let d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) d = new Date(); // fall back to today

  const exercise = { userId: user._id, description, duration: Number(duration), date: d };
  exercises.push(exercise);

  res.json({
    _id: user._id,
    username: user.username,
    date: d.toDateString(),
    duration: exercise.duration,
    description: exercise.description
  });
});

// GET /api/users/:_id/logs?[from][&to][&limit]
app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(u => u._id === req.params._id);
  if (!user) return res.json({ error: 'user not found' });

  const { from, to, limit } = req.query;
  let log = exercises.filter(e => e.userId === user._id);

  if (from) {
    const f = new Date(from);
    if (!isNaN(f.getTime())) log = log.filter(e => e.date >= f);
  }
  if (to) {
    const t = new Date(to);
    if (!isNaN(t.getTime())) log = log.filter(e => e.date <= t);
  }
  if (limit && !isNaN(Number(limit))) {
    log = log.slice(0, Number(limit));
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }))
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
