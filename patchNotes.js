const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public')); // في حالة تحط front

const FILE = 'patchNotes.json';

// API: إرجاع كل الباتشات
app.get('/api/patches', (req, res) => {
  const data = fs.readFileSync(FILE, 'utf-8');
  res.json(JSON.parse(data));
});

// API: إضافة باتش جديد
app.post('/api/patches', (req, res) => {
  const { title, description } = req.body;
  const newPatch = {
    title,
    description,
    date: new Date().toLocaleString()
  };

  const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  data.unshift(newPatch);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
