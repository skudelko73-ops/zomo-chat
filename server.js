const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nickname TEXT UNIQUE,
        password TEXT
      )
    `);
    
    try { await pool.query('ALTER TABLE users ADD COLUMN avatar_photo TEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN theme TEXT DEFAULT \'dark\''); } catch (e) {}
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        senderId TEXT,
        receiverId TEXT,
        content TEXT,
        type TEXT DEFAULT 'text',
        file_url TEXT,
        read BOOLEAN DEFAULT false,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friends (
        userId TEXT,
        friendId TEXT,
        PRIMARY KEY(userId, friendId)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        callerId TEXT,
        receiverId TEXT,
        status TEXT DEFAULT 'missed',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database ready');
  } catch (err) {
    console.error('❌ DB error:', err);
  }
}
initDB();

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.json());

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ==================== АВТОРИЗАЦИЯ ====================
app.post('/api/register', async (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: 'Nickname and password required' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();
    await pool.query('INSERT INTO users (id, nickname, password) VALUES ($1, $2, $3)', [userId, nickname, hashedPassword]);
    res.json({ userId, nickname });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Nickname already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { nickname, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE nickname = $1', [nickname]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ userId: user.id, nickname: user.nickname, avatar_photo: user.avatar_photo, theme: user.theme });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ==================== ПРОФИЛЬ ====================
app.get('/api/user/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nickname, avatar_photo, theme FROM users WHERE id = $1', [req.params.userId]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/user/nickname', async (req, res) => {
  const { userId, nickname } = req.body;
  try {
    await pool.query('UPDATE users SET nickname = $1 WHERE id = $2', [nickname, userId]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Nickname taken' });
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
  const { userId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileUrl = '/uploads/' + req.file.filename;
  await pool.query('UPDATE users SET avatar_photo = $1 WHERE id = $2', [fileUrl, userId]);
  res.json({ success: true, avatar_photo: fileUrl });
});

app.post('/api/theme', async (req, res) => {
  await pool.query('UPDATE users SET theme = $1 WHERE id = $2', [req.body.theme, req.body.userId]);
  res.json({ success: true });
});

// ==================== ДРУЗЬЯ ====================
app.get('/api/friends/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('📋 Getting friends for:', userId);
  
  try {
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.nickname, u."avatar_photo",
        (SELECT content FROM messages WHERE ((senderId = $1 AND receiverId = u.id) OR (senderId = u.id AND receiverId = $1)) ORDER BY timestamp DESC LIMIT 1) as lastMessage,
        (SELECT COUNT(*) FROM messages WHERE senderId = u.id AND receiverId = $1 AND read = false) as unread
      FROM friends f
      JOIN users u ON (f."friendId" = u.id AND f."userId" = $1) OR (f."userId" = u.id AND f."friendId" = $1)
      WHERE f."userId" = $1 OR f."friendId" = $1
    `, [userId]);
    
    console.log('✅ Friends found:', result.rows.length);
    res.json(result.rows || []);
  } catch (err) {
    console.error('❌ Friends error:', err);
    res.json([]);
  }
});

app.post('/api/friends/add', async (req, res) => {
  const { userId, friendId } = req.body;
  
  console.log('➕ Add friend request:', userId, '->', friendId);
  
  if (!userId || !friendId) {
    return res.status(400).json({ error: 'Missing IDs' });
  }
  if (userId === friendId) {
    return res.status(400).json({ error: 'Cannot add yourself' });
  }
  
  try {
    // Проверяем, существует ли пользователь
    const check = await pool.query('SELECT id FROM users WHERE id = $1', [friendId]);
    if (check.rows.length === 0) {
      console.log('❌ User not found:', friendId);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем, не друзья ли уже
    const existing = await pool.query(
      'SELECT * FROM friends WHERE ("userId" = $1 AND "friendId" = $2) OR ("userId" = $2 AND "friendId" = $1)',
      [userId, friendId]
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️ Already friends');
      return res.status(400).json({ error: 'Уже в друзьях' });
    }
    
    // Добавляем друга
    await pool.query('INSERT INTO friends ("userId", "friendId") VALUES ($1, $2)', [userId, friendId]);
    
    console.log('✅ Friend added successfully!');
    res.json({ success: true, message: 'Друг добавлен' });
    
  } catch (err) {
    console.error('❌ Add friend error:', err);
    res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
  }
});

// ==================== СООБЩЕНИЯ ====================
app.get('/api/messages/:userId/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  try {
    await pool.query('UPDATE messages SET read = true WHERE senderId = $1 AND receiverId = $2 AND read = false', [friendId, userId]);
    const result = await pool.query(
      'SELECT * FROM messages WHERE (senderId = $1 AND receiverId = $2) OR (senderId = $2 AND receiverId = $1) ORDER BY timestamp ASC',
      [userId, friendId]
    );
    res.json(result.rows || []);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/unread/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM messages WHERE receiverId = $1 AND read = false', [req.params.userId]);
    res.json({ count: parseInt(result.rows[0].count) || 0 });
  } catch (err) {
    res.json({ count: 0 });
  }
});

app.post('/api/upload-chat-image', upload.single('image'), async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileUrl = '/uploads/' + req.file.filename;
  await pool.query('INSERT INTO messages (senderId, receiverId, content, type, file_url) VALUES ($1, $2, $3, $4, $5)',
    [senderId, receiverId, '📷 Фото', 'image', fileUrl]);
  res.json({ success: true, fileUrl });
});

app.post('/api/upload-voice', upload.single('audio'), async (req, res) => {
  const { senderId, receiverId, duration } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileUrl = '/uploads/' + req.file.filename;
  await pool.query('INSERT INTO messages (senderId, receiverId, content, type, file_url) VALUES ($1, $2, $3, $4, $5)',
    [senderId, receiverId, `🎤 Голосовое (${duration}с)`, 'voice', fileUrl]);
  res.json({ success: true, fileUrl });
});

// ==================== ЗВОНКИ ====================
app.get('/api/calls/:userId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u1.nickname as caller_name, u2.nickname as receiver_name
      FROM calls c
      JOIN users u1 ON c.callerId = u1.id
      JOIN users u2 ON c.receiverId = u2.id
      WHERE c.callerId = $1 OR c.receiverId = $1
      ORDER BY c.timestamp DESC LIMIT 50
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/calls', async (req, res) => {
  const { callerId, receiverId, status } = req.body;
  try {
    await pool.query('INSERT INTO calls (callerId, receiverId, status) VALUES ($1, $2, $3)', [callerId, receiverId, status || 'missed']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ==================== WEBSOCKET ====================
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ Connected:', socket.id);
  
  socket.on('login', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user-online', userId);
  });
  
  socket.on('send-message', async (data) => {
    const { senderId, receiverId, content, type, fileUrl } = data;
    if (!senderId || !receiverId) return;
    try {
      await pool.query('INSERT INTO messages (senderId, receiverId, content, type, file_url) VALUES ($1, $2, $3, $4, $5)',
        [senderId, receiverId, content, type || 'text', fileUrl]);
      const message = { senderId, receiverId, content, type, fileUrl, timestamp: new Date().toISOString() };
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) io.to(receiverSocket).emit('new-message', message);
      socket.emit('new-message', message);
    } catch (err) {
      console.error('Message error:', err);
    }
  });
  
  socket.on('call-user', (data) => {
    const targetSocket = onlineUsers.get(data.targetId);
    if (targetSocket) io.to(targetSocket).emit('incoming-call', { from: socket.userId, offer: data.offer });
  });
  
  socket.on('call-accept', (data) => {
    const targetSocket = onlineUsers.get(data.targetId);
    if (targetSocket) io.to(targetSocket).emit('call-accepted', { from: socket.userId, answer: data.answer });
  });
  
  socket.on('ice-candidate', (data) => {
    const targetSocket = onlineUsers.get(data.targetId);
    if (targetSocket) io.to(targetSocket).emit('ice-candidate', { from: socket.userId, candidate: data.candidate });
  });
  
  socket.on('call-reject', (data) => {
    const targetSocket = onlineUsers.get(data.targetId);
    if (targetSocket) io.to(targetSocket).emit('call-rejected');
  });
  
  socket.on('call-end', (data) => {
    const targetSocket = onlineUsers.get(data.targetId);
    if (targetSocket) io.to(targetSocket).emit('call-ended');
  });
  
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user-offline', socket.userId);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
