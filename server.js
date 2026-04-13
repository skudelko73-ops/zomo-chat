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
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/zomo_chat',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Инициализация БД
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nickname TEXT UNIQUE,
        password TEXT,
        coins INTEGER DEFAULT 100,
        avatar_emoji TEXT DEFAULT '😊',
        avatar_photo TEXT,
        theme TEXT DEFAULT 'dark',
        daily_bonus_date TEXT,
        wheel_spin_date TEXT,
        guess_number_date TEXT,
        clicker_count INTEGER DEFAULT 0,
        clicker_date TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        senderId TEXT,
        receiverId TEXT,
        content TEXT,
        type TEXT DEFAULT 'text',
        file_url TEXT,
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
      CREATE TABLE IF NOT EXISTS streaks (
        userId TEXT,
        friendId TEXT,
        streak INTEGER DEFAULT 0,
        last_message_date TEXT,
        PRIMARY KEY(userId, friendId)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_accessories (
        id SERIAL PRIMARY KEY,
        userId TEXT,
        accessory_id TEXT,
        x INTEGER DEFAULT 80,
        y INTEGER DEFAULT 80,
        scale REAL DEFAULT 1.0,
        equipped INTEGER DEFAULT 1
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS duels (
        id TEXT PRIMARY KEY,
        creatorId TEXT,
        opponentId TEXT,
        game_type TEXT,
        bet INTEGER,
        status TEXT DEFAULT 'pending',
        winnerId TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stickers (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        category TEXT DEFAULT 'default'
      )
    `);

    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ Database error:', err);
  }
}

initDB();

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.json());

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Регистрация
app.post('/api/register', async (req, res) => {
  const { nickname, password, avatar_emoji } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: 'Nickname and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    await pool.query(
      'INSERT INTO users (id, nickname, password, avatar_emoji) VALUES ($1, $2, $3, $4)',
      [userId, nickname, hashedPassword, avatar_emoji || '😊']
    );
    res.json({ userId, nickname, avatar_emoji: avatar_emoji || '😊' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Nickname already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  const { nickname, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE nickname = $1', [nickname]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({
      userId: user.id, nickname: user.nickname, coins: user.coins,
      avatar_emoji: user.avatar_emoji, avatar_photo: user.avatar_photo, theme: user.theme
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Загрузка аватара
app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
  const { userId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = '/uploads/' + req.file.filename;
  try {
    await pool.query('UPDATE users SET avatar_photo = $1, avatar_emoji = NULL WHERE id = $2', [fileUrl, userId]);
    res.json({ success: true, avatar_photo: fileUrl });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Загрузка изображения в чат
app.post('/api/upload-chat-image', upload.single('image'), async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = '/uploads/' + req.file.filename;
  try {
    await pool.query(
      'INSERT INTO messages (senderId, receiverId, content, type, file_url) VALUES ($1, $2, $3, $4, $5)',
      [senderId, receiverId, 'Изображение', 'image', fileUrl]
    );
    res.json({ success: true, fileUrl });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Загрузка голосового сообщения
app.post('/api/upload-voice', upload.single('audio'), async (req, res) => {
  const { senderId, receiverId, duration } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = '/uploads/' + req.file.filename;
  try {
    await pool.query(
      'INSERT INTO messages (senderId, receiverId, content, type, file_url) VALUES ($1, $2, $3, $4, $5)',
      [senderId, receiverId, `🎤 Голосовое (${duration}с)`, 'voice', fileUrl]
    );
    res.json({ success: true, fileUrl });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить данные пользователя
app.get('/api/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nickname, coins, avatar_emoji, avatar_photo, theme FROM users WHERE id = $1',
      [req.params.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Ежедневный бонус
app.post('/api/daily-bonus', async (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query('SELECT daily_bonus_date, coins FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.daily_bonus_date === today) return res.json({ success: false, message: 'Уже получено' });

    const newCoins = user.coins + 25;
    await pool.query('UPDATE users SET coins = $1, daily_bonus_date = $2 WHERE id = $3', [newCoins, today, userId]);
    res.json({ success: true, coins: newCoins, bonus: 25 });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Колесо фортуны
app.post('/api/wheel-spin', async (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query('SELECT wheel_spin_date, coins FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.wheel_spin_date === today) return res.json({ success: false, message: 'Уже крутили' });

    const prizes = [
      { type: 'coins', value: 10, weight: 30 }, { type: 'coins', value: 25, weight: 25 },
      { type: 'coins', value: 50, weight: 20 }, { type: 'coins', value: 75, weight: 15 },
      { type: 'coins', value: 100, weight: 9 }, { type: 'legendary', value: 'crown', weight: 1 }
    ];

    const total = prizes.reduce((s, p) => s + p.weight, 0);
    let rand = Math.random() * total;
    let prize = prizes[0];
    for (const p of prizes) { rand -= p.weight; if (rand <= 0) { prize = p; break; } }

    if (prize.type === 'coins') {
      const newCoins = user.coins + prize.value;
      await pool.query('UPDATE users SET coins = $1, wheel_spin_date = $2 WHERE id = $3', [newCoins, today, userId]);
      res.json({ success: true, prize: { type: 'coins', value: prize.value }, coins: newCoins });
    } else {
      await pool.query('INSERT INTO user_accessories (userId, accessory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, prize.value]);
      await pool.query('UPDATE users SET wheel_spin_date = $1 WHERE id = $2', [today, userId]);
      res.json({ success: true, prize: { type: 'legendary', value: prize.value }, coins: user.coins });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить друзей
app.get('/api/friends/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.nickname, u.avatar_emoji, u.avatar_photo, u.coins,
        (SELECT content FROM messages WHERE (senderId = $1 AND receiverId = u.id) OR (senderId = u.id AND receiverId = $1) ORDER BY timestamp DESC LIMIT 1) as lastMessage
      FROM friends f
      JOIN users u ON (f.friendId = u.id AND f.userId = $1) OR (f.userId = u.id AND f.friendId = $1)
      WHERE f.userId = $1 OR f.friendId = $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Добавить друга
app.post('/api/friends/add', async (req, res) => {
  const { userId, friendId } = req.body;
  if (userId === friendId) return res.status(400).json({ error: 'Cannot add yourself' });

  try {
    const check = await pool.query('SELECT id FROM users WHERE id = $1', [friendId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    await pool.query('INSERT INTO friends (userId, friendId) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, friendId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Сообщения
app.get('/api/messages/:userId/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM messages 
      WHERE (senderId = $1 AND receiverId = $2) OR (senderId = $2 AND receiverId = $1)
      ORDER BY timestamp ASC
    `, [userId, friendId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Аксессуары
app.get('/api/accessories/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_accessories WHERE userId = $1 AND equipped = 1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Переключить видимость аксессуара
app.post('/api/accessory-toggle', async (req, res) => {
  const { userId, accessory_id, equipped } = req.body;
  try {
    await pool.query('UPDATE user_accessories SET equipped = $1 WHERE userId = $2 AND accessory_id = $3', [equipped, userId, accessory_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Купить аксессуар
app.post('/api/buy-accessory', async (req, res) => {
  const { userId, accessory_id, price } = req.body;
  try {
    const user = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    if (user.rows[0].coins < price) return res.status(400).json({ error: 'Недостаточно монет' });

    await pool.query('UPDATE users SET coins = coins - $1 WHERE id = $2', [price, userId]);
    await pool.query('INSERT INTO user_accessories (userId, accessory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, accessory_id]);
    const newCoins = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    res.json({ success: true, coins: newCoins.rows[0].coins });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Обновить аксессуар
app.post('/api/accessory-update', async (req, res) => {
  const { userId, accessory_id, x, y, scale } = req.body;
  try {
    await pool.query('UPDATE user_accessories SET x = $1, y = $2, scale = $3 WHERE userId = $4 AND accessory_id = $5',
      [x, y, scale, userId, accessory_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Тема и смайлик
app.post('/api/theme', async (req, res) => {
  await pool.query('UPDATE users SET theme = $1 WHERE id = $2', [req.body.theme, req.body.userId]);
  res.json({ success: true });
});

app.post('/api/avatar-emoji', async (req, res) => {
  await pool.query('UPDATE users SET avatar_emoji = $1, avatar_photo = NULL WHERE id = $2', [req.body.avatar_emoji, req.body.userId]);
  res.json({ success: true });
});

// Стикеры
app.get('/api/stickers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stickers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/stickers', upload.single('sticker'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = '/uploads/' + req.file.filename;
  await pool.query('INSERT INTO stickers (url) VALUES ($1)', [url]);
  res.json({ success: true, url });
});

// WebSocket
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ Connected');

  socket.on('login', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user-status', { userId, online: true });
  });

  socket.on('send-message', async (data) => {
    const { senderId, receiverId, content, type, fileUrl } = data;
    if (!senderId || !receiverId) return;

    try {
      await pool.query(
        'INSERT INTO messages (senderId, receiverId, content, type, file_url) VALUES ($1, $2, $3, $4, $5)',
        [senderId, receiverId, content, type || 'text', fileUrl]
      );
      await pool.query('UPDATE users SET coins = coins + 1 WHERE id = $1', [senderId]);

      const message = { senderId, receiverId, content, type, fileUrl, timestamp: new Date().toISOString() };
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) io.to(receiverSocket).emit('new-message', message);
      socket.emit('new-message', message);

      // Пуш-уведомление
      if (receiverSocket) {
        io.to(receiverSocket).emit('push-notification', {
          title: 'Новое сообщение',
          body: content?.substring(0, 50) || '📷 Изображение',
          icon: '/favicon.ico'
        });
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user-status', { userId: socket.userId, online: false });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
