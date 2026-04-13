const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const db = new sqlite3.Database('./database.db');

// Создание таблиц
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT UNIQUE,
    password TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId TEXT,
    receiverId TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(senderId) REFERENCES users(id),
    FOREIGN KEY(receiverId) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    userId TEXT,
    friendId TEXT,
    PRIMARY KEY(userId, friendId),
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(friendId) REFERENCES users(id)
  )`);
});

app.use(express.static('public'));
app.use(express.json());

// Генерация случайного ID (6 символов)
function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Регистрация
app.post('/api/register', async (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: 'Nickname and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    db.run('INSERT INTO users (id, nickname, password) VALUES (?, ?, ?)', [userId, nickname, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Nickname already taken' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ userId, nickname });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Вход
app.post('/api/login', (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: 'Nickname and password required' });

  db.get('SELECT * FROM users WHERE nickname = ?', [nickname], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ userId: user.id, nickname: user.nickname });
  });
});

// Получение списка друзей с последними сообщениями
app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  db.all(`
    SELECT u.id, u.nickname, 
      (SELECT content FROM messages WHERE (senderId = ? AND receiverId = u.id) OR (senderId = u.id AND receiverId = ?) ORDER BY timestamp DESC LIMIT 1) as lastMessage
    FROM friends f
    JOIN users u ON (f.friendId = u.id AND f.userId = ?) OR (f.userId = u.id AND f.friendId = ?)
    WHERE f.userId = ? OR f.friendId = ?
  `, [userId, userId, userId, userId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Добавление друга по ID
app.post('/api/friends/add', (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) return res.status(400).json({ error: 'Missing IDs' });
  if (userId === friendId) return res.status(400).json({ error: 'Cannot add yourself' });

  db.get('SELECT id FROM users WHERE id = ?', [friendId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'User not found' });

    db.run('INSERT OR IGNORE INTO friends (userId, friendId) VALUES (?, ?)', [userId, friendId], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    });
  });
});

// Получение истории сообщений с другом
app.get('/api/messages/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  db.all(`
    SELECT * FROM messages 
    WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
    ORDER BY timestamp ASC
  `, [userId, friendId, friendId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// WebSocket
const onlineUsers = new Map(); // userId -> socket.id

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('login', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user-status', { userId, online: true });
  });

  socket.on('send-message', async (data) => {
    const { senderId, receiverId, content } = data;
    if (!senderId || !receiverId || !content) return;

    // Сохраняем в БД
    db.run('INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)', [senderId, receiverId, content]);

    const message = {
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString()
    };

    // Отправка получателю, если онлайн
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-message', message);
    }
    // Отправка обратно отправителю для обновления UI
    socket.emit('new-message', message);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user-status', { userId: socket.userId, online: false });
    }
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});