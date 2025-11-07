const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// === FILE PATHS ===
const DATA_FILE = path.join(__dirname, 'patchNotes.json');
const FORM_FILE = path.join(__dirname, 'form_submissions.json');
const GANG_FILE = path.join(__dirname, 'gang_applications.json');
const FACTION_FILE = path.join(__dirname, 'faction_applications.json');

// === MIDDLEWARE ===
app.use(express.json());
app.use(express.static('public'));

// === HELPERS ===
function readJSON(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// === USERS ===
app.get('/api/users', (req, res) => {
  const data = readJSON(DATA_FILE, { users: [] });
  res.json(data.users);
});

app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, msg: 'Fields required.' });

  const data = readJSON(DATA_FILE, { users: [] });
  const exists = data.users.find(u => u.username === username);
  if (exists) return res.status(409).json({ success: false, msg: 'Username already taken.' });

  const nextId = data.users.length ? Math.max(...data.users.map(u => u.id || 0)) + 1 : 1;

  data.users.push({
    id: nextId,
    username,
    password,
    roles: ['user'],
    date: new Date().toLocaleString()
  });

  writeJSON(DATA_FILE, data);
  res.json({ success: true, msg: 'User created successfully!' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, msg: 'All fields required' });

  const data = readJSON(DATA_FILE, { users: [] });

  const user = data.users.find(u =>
    (u.username?.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === username.toLowerCase()) &&
    u.password === password
  );

  if (!user) return res.status(401).json({ success: false, msg: 'Invalid credentials' });

  res.json({
    success: true,
    user: {
      username: user.username || user.email,
      roles: user.roles || [],
      id: user.id
    }
  });
});

app.post('/api/delete-user', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, msg: 'Username required' });

  const data = readJSON(DATA_FILE, { users: [] });
  const originalLength = data.users.length;
  data.users = data.users.filter(u =>
    u.username !== username && u.email !== username
  );

  if (data.users.length === originalLength) {
    return res.status(404).json({ success: false, msg: 'User not found' });
  }

  writeJSON(DATA_FILE, data);
  res.json({ success: true });
});

app.post('/api/promote', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, msg: 'Username required' });

  const data = readJSON(DATA_FILE, { users: [] });
  const user = data.users.find(u => u.username === username || u.email === username);
  if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

  if (!user.roles.includes('admin')) {
    user.roles.push('admin');
  }

  writeJSON(DATA_FILE, data);
  res.json({ success: true });
});

app.post('/api/update-ranks', (req, res) => {
  const { username, ranks } = req.body;
  const data = readJSON(DATA_FILE, { users: [] });
  const user = data.users.find(u => u.username === username || u.email === username);

  if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

  user.roles = ranks;
  writeJSON(DATA_FILE, data);
  res.json({ success: true, msg: 'Ranks updated successfully' });
});

// === ACCESS CHECK ROUTES ===
app.post('/admin/whitelist-check', (req, res) => {
  const { username } = req.body;
  const data = readJSON(DATA_FILE, { users: [] });
  const user = data.users.find(u => u.username === username || u.email === username);
  if (!user) return res.status(404).json({ access: false });

  res.json({ access: user.roles.includes('whitelist manager') });
});

app.post('/admin/gang-check', (req, res) => {
  const { username } = req.body;
  const data = readJSON(DATA_FILE, { users: [] });
  const user = data.users.find(u => u.username === username || u.email === username);
  if (!user) return res.status(404).json({ access: false });

  res.json({ access: user.roles.includes('gang mode') });
});

app.post('/admin/faction-check', (req, res) => {
  const { username } = req.body;
  const data = readJSON(DATA_FILE, { users: [] });
  const user = data.users.find(u => u.username === username || u.email === username);
  if (!user) return res.status(404).json({ access: false });

  res.json({ access: user.roles.includes('faction mode') });
});

// === PATCH NOTES ===
app.get('/api/patches', (req, res) => {
  const data = readJSON(DATA_FILE, { patchNotes: [] });
  res.json(data.patchNotes);
});

app.post('/api/patches', (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ success: false });

  const data = readJSON(DATA_FILE, { patchNotes: [] });
  data.patchNotes.unshift({ title, description, date: new Date().toLocaleString() });
  writeJSON(DATA_FILE, data);
  res.json({ success: true });
});

// === ANNOUNCEMENTS ===
app.get('/api/announcements', (req, res) => {
  const data = readJSON(DATA_FILE, { announcements: [] });
  res.json(data.announcements);
});

app.post('/api/announcements', (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ success: false });

  const data = readJSON(DATA_FILE, { announcements: [] });
  data.announcements.unshift({ title, description, date: new Date().toLocaleString() });
  writeJSON(DATA_FILE, data);
  res.json({ success: true });
});

// === WHITELIST ===
app.post('/api/whitelist', (req, res) => {
  const submission = req.body;
  if (!submission || typeof submission !== 'object') {
    return res.status(400).json({ success: false, msg: 'Invalid data' });
  }

  const data = readJSON(FORM_FILE);
  submission.date = new Date().toLocaleString();
  data.push(submission);
  writeJSON(FORM_FILE, data);

  res.json({ success: true, msg: 'Form submitted successfully!' });
});

app.get('/api/whitelist', (req, res) => {
  const data = readJSON(FORM_FILE);
  res.json(data);
});

// === GANG APPLICATION ===
app.post('/submit-gang', (req, res) => {
  const { discord, gangName, members, experience, motivation } = req.body;

  if (!discord || !gangName || !members || !experience || !motivation) {
    return res.status(400).json({ success: false, msg: 'All fields are required.' });
  }

  const data = readJSON(GANG_FILE);
  data.push({
    discord,
    gangName,
    members,
    experience,
    motivation,
    date: new Date().toLocaleString()
  });

  writeJSON(GANG_FILE, data);
  res.json({ success: true, msg: 'Gang application submitted!' });
});

app.get('/view-gangs', (req, res) => {
  const data = readJSON(GANG_FILE);
  res.json(data);
});

// === FACTION APPLICATION ===
app.post('/submit-faction', (req, res) => {
  const { discord, factionName, previousExperience, whyJoin } = req.body;

  if (!discord || !factionName || !previousExperience || !whyJoin) {
    return res.status(400).json({ success: false, msg: 'All fields are required.' });
  }

  const data = readJSON(FACTION_FILE);
  data.push({
    discord,
    factionName,
    previousExperience,
    whyJoin,
    date: new Date().toLocaleString()
  });

  writeJSON(FACTION_FILE, data);
  res.json({ success: true, msg: 'Faction application submitted!' });
});

app.get('/view-factions', (req, res) => {
  const data = readJSON(FACTION_FILE);
  res.json(data);
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});