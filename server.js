const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

// Serve frontend
app.use(express.static('public'));

// Fake in-memory user store (replace with DB later)
const users = {};

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (users[email]) return res.status(400).send('User already exists');
  const hashed = await bcrypt.hash(password, 10);
  users[email] = { password: hashed, goals: [] };
  res.send('Registered successfully');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) return res.status(400).send('User not found');
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send('Invalid password');
  req.session.user = email;
  res.send('Logged in successfully');
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logged out');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
