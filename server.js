const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// PostgreSQL подключение
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/zomo_chat',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Создание таблиц
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nickname TEXT UNIQUE,
        password TEXT,
        coins INTEGER DEFAULT 100,
        avatar_emoji TEXT DEFAULT '😊',
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

    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ Database init error:', err);
  }
}

initDB();

app.use(express.static('public'));
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
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Nickname already taken' });
    }
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
      userId: user.id,
      nickname: user.nickname,
      coins: user.coins,
      avatar_emoji: user.avatar_emoji,
      theme: user.theme
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить данные пользователя
app.get('/api/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nickname, coins, avatar_emoji, theme FROM users WHERE id = $1',
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
    if (user.daily_bonus_date === today) {
      return res.json({ success: false, message: 'Уже получено сегодня' });
    }

    const newCoins = user.coins + 25;
    await pool.query('UPDATE users SET coins = $1, daily_bonus_date = $2 WHERE id = $3',
      [newCoins, today, userId]);
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
    if (user.wheel_spin_date === today) {
      return res.json({ success: false, message: 'Уже крутили сегодня' });
    }

    const prizes = [
      { type: 'coins', value: 10, weight: 30 },
      { type: 'coins', value: 25, weight: 25 },
      { type: 'coins', value: 50, weight: 20 },
      { type: 'coins', value: 75, weight: 15 },
      { type: 'coins', value: 100, weight: 9 },
      { type: 'legendary', value: 'crown', weight: 1 }
    ];

    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    let prize = prizes[0];

    for (const p of prizes) {
      random -= p.weight;
      if (random <= 0) { prize = p; break; }
    }

    if (prize.type === 'coins') {
      const newCoins = user.coins + prize.value;
      await pool.query('UPDATE users SET coins = $1, wheel_spin_date = $2 WHERE id = $3',
        [newCoins, today, userId]);
      res.json({ success: true, prize: { type: 'coins', value: prize.value }, coins: newCoins });
    } else {
      await pool.query('INSERT INTO user_accessories (userId, accessory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, prize.value]);
      await pool.query('UPDATE users SET wheel_spin_date = $1 WHERE id = $2', [today, userId]);
      res.json({ success: true, prize: { type: 'legendary', value: prize.value }, coins: user.coins });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Угадай число
app.post('/api/guess-number', async (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query('SELECT guess_number_date, coins FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.guess_number_date === today) {
      return res.json({ success: false, message: 'Уже играли сегодня' });
    }

    const secretNumber = Math.floor(Math.random() * 100) + 1;
    await pool.query('UPDATE users SET guess_number_date = $1 WHERE id = $2', [today, userId]);
    res.json({ success: true, secretNumber });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/guess-number/win', async (req, res) => {
  const { userId, attempts } = req.body;
  const maxPrize = 50;
  const prize = Math.max(10, maxPrize - (attempts - 1) * 10);

  try {
    const result = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    const newCoins = result.rows[0].coins + prize;
    await pool.query('UPDATE users SET coins = $1 WHERE id = $2', [newCoins, userId]);
    res.json({ success: true, prize, coins: newCoins });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Кликер
app.post('/api/clicker', async (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query('SELECT clicker_count, clicker_date, coins FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    if (user.clicker_date !== today) {
      await pool.query('UPDATE users SET clicker_count = 1, clicker_date = $1 WHERE id = $2', [today, userId]);
      const newCoins = user.coins + 1;
      await pool.query('UPDATE users SET coins = $1 WHERE id = $2', [newCoins, userId]);
      return res.json({ success: true, count: 1, coins: newCoins });
    }

    if (user.clicker_count >= 50) {
      return res.json({ success: false, message: 'Достигнут лимит на сегодня (50)' });
    }

    const newCount = user.clicker_count + 1;
    const newCoins = user.coins + 1;
    await pool.query('UPDATE users SET clicker_count = $1, coins = $2 WHERE id = $3', [newCount, newCoins, userId]);
    res.json({ success: true, count: newCount, coins: newCoins });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Викторина
app.get('/api/quiz', (req, res) => {
  const questions = [
    { question: 'Сколько будет 2+2?', options: ['3', '4', '5'], correct: 1 },
    { question: 'Столица Франции?', options: ['Лондон', 'Берлин', 'Париж'], correct: 2 },
    { question: 'Сколько дней в неделе?', options: ['5', '6', '7'], correct: 2 }
  ];
  res.json(questions);
});

app.post('/api/quiz/win', async (req, res) => {
  const { userId, correctAnswers } = req.body;
  const prize = correctAnswers * 15;

  try {
    const result = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    const newCoins = result.rows[0].coins + prize;
    await pool.query('UPDATE users SET coins = $1 WHERE id = $2', [newCoins, userId]);
    res.json({ success: true, prize, coins: newCoins });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить друзей
app.get('/api/friends/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.nickname, u.avatar_emoji, u.coins,
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
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [friendId]);
    if (userCheck.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    await pool.query('INSERT INTO friends (userId, friendId) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, friendId]);
    await pool.query('INSERT INTO streaks (userId, friendId, streak, last_message_date) VALUES ($1, $2, 0, NULL) ON CONFLICT DO NOTHING', [userId, friendId]);
    await pool.query('INSERT INTO streaks (userId, friendId, streak, last_message_date) VALUES ($1, $2, 0, NULL) ON CONFLICT DO NOTHING', [friendId, userId]);
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

// Купить аксессуар
app.post('/api/buy-accessory', async (req, res) => {
  const { userId, accessory_id, price } = req.body;

  try {
    const userResult = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    if (user.coins < price) return res.status(400).json({ error: 'Недостаточно монет' });

    await pool.query('UPDATE users SET coins = coins - $1 WHERE id = $2', [price, userId]);
    await pool.query('INSERT INTO user_accessories (userId, accessory_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, accessory_id]);
    
    const newResult = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    res.json({ success: true, coins: newResult.rows[0].coins });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Обновить аксессуар (позиция + размер)
app.post('/api/accessory-update', async (req, res) => {
  const { userId, accessory_id, x, y, scale } = req.body;
  try {
    await pool.query(
      'UPDATE user_accessories SET x = $1, y = $2, scale = $3 WHERE userId = $4 AND accessory_id = $5',
      [x, y, scale, userId, accessory_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Тема
app.post('/api/theme', async (req, res) => {
  const { userId, theme } = req.body;
  try {
    await pool.query('UPDATE users SET theme = $1 WHERE id = $2', [theme, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Смайлик
app.post('/api/avatar-emoji', async (req, res) => {
  const { userId, avatar_emoji } = req.body;
  try {
    await pool.query('UPDATE users SET avatar_emoji = $1 WHERE id = $2', [avatar_emoji, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Серийчик
app.get('/api/streak/:userId/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  try {
    const result = await pool.query('SELECT streak FROM streaks WHERE userId = $1 AND friendId = $2', [userId, friendId]);
    res.json({ streak: result.rows[0]?.streak || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Дуэли
app.post('/api/duel/create', async (req, res) => {
  const { creatorId, opponentId, game_type, bet } = req.body;
  const duelId = generateId() + generateId();

  try {
    const userResult = await pool.query('SELECT coins FROM users WHERE id = $1', [creatorId]);
    if (userResult.rows[0].coins < bet) return res.status(400).json({ error: 'Недостаточно монет' });

    await pool.query('UPDATE users SET coins = coins - $1 WHERE id = $2', [bet, creatorId]);
    await pool.query(
      'INSERT INTO duels (id, creatorId, opponentId, game_type, bet, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [duelId, creatorId, opponentId, game_type, bet, 'pending']
    );
    res.json({ duelId });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/duel/accept', async (req, res) => {
  const { duelId, userId } = req.body;
  try {
    const duelResult = await pool.query('SELECT * FROM duels WHERE id = $1', [duelId]);
    const duel = duelResult.rows[0];
    if (!duel || duel.status !== 'pending') return res.status(400).json({ error: 'Invalid duel' });

    await pool.query('UPDATE users SET coins = coins - $1 WHERE id = $2', [duel.bet, userId]);
    await pool.query('UPDATE duels SET status = $1 WHERE id = $2', ['active', duelId]);
    res.json({ success: true, game_type: duel.game_type, bet: duel.bet });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/duel/complete', async (req, res) => {
  const { duelId, winnerId } = req.body;
  try {
    const duelResult = await pool.query('SELECT * FROM duels WHERE id = $1', [duelId]);
    const duel = duelResult.rows[0];
    if (!duel || duel.status !== 'active') return res.status(400).json({ error: 'Invalid duel' });

    const prize = Math.floor(duel.bet * 1.8);
    await pool.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [prize, winnerId]);
    await pool.query('UPDATE duels SET status = $1, winnerId = $2 WHERE id = $3', ['completed', winnerId, duelId]);
    res.json({ success: true, prize });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// WebSocket
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ Client connected');

  socket.on('login', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('user-status', { userId, online: true });
  });

  socket.on('send-message', async (data) => {
    const { senderId, receiverId, content } = data;
    if (!senderId || !receiverId || !content) return;

    try {
      await pool.query('INSERT INTO messages (senderId, receiverId, content) VALUES ($1, $2, $3)',
        [senderId, receiverId, content]);
      await pool.query('UPDATE users SET coins = coins + 1 WHERE id = $1', [senderId]);

      const message = { senderId, receiverId, content, timestamp: new Date().toISOString() };
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) io.to(receiverSocketId).emit('new-message', message);
      socket.emit('new-message', message);

      // Серийчик
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const streakResult = await pool.query('SELECT * FROM streaks WHERE userId = $1 AND friendId = $2', [senderId, receiverId]);
      
      if (streakResult.rows.length === 0) {
        await pool.query('INSERT INTO streaks (userId, friendId, streak, last_message_date) VALUES ($1, $2, 1, $3)',
          [senderId, receiverId, today]);
      } else {
        const streak = streakResult.rows[0];
        if (streak.last_message_date !== today) {
          const newStreak = streak.last_message_date === yesterday ? streak.streak + 1 : 1;
          await pool.query('UPDATE streaks SET streak = $1, last_message_date = $2 WHERE userId = $3 AND friendId = $4',
            [newStreak, today, senderId, receiverId]);
        }
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  socket.on('duel-invite', (data) => {
    const { duelId, opponentId } = data;
    const opponentSocketId = onlineUsers.get(opponentId);
    if (opponentSocketId) io.to(opponentSocketId).emit('duel-invite', { duelId });
  });

  socket.on('duel-move', (data) => {
    const { duelId, opponentId, move } = data;
    const opponentSocketId = onlineUsers.get(opponentId);
    if (opponentSocketId) io.to(opponentSocketId).emit('duel-move', { duelId, move });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user-status', { userId: socket.userId, online: false });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
