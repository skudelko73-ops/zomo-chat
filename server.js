const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const db = new sqlite3.Database('./database.db');

// Создание таблиц
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT UNIQUE,
    password TEXT,
    coins INTEGER DEFAULT 100,
    avatar_emoji TEXT DEFAULT '😊',
    theme TEXT DEFAULT 'dark',
    daily_bonus_date TEXT,
    wheel_spin_date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId TEXT,
    receiverId TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS friends (
    userId TEXT,
    friendId TEXT,
    PRIMARY KEY(userId, friendId)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS streaks (
    userId TEXT,
    friendId TEXT,
    streak INTEGER DEFAULT 0,
    last_message_date TEXT,
    PRIMARY KEY(userId, friendId)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_accessories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    accessory_id TEXT,
    x INTEGER DEFAULT 80,
    y INTEGER DEFAULT 80,
    equipped INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS duels (
    id TEXT PRIMARY KEY,
    creatorId TEXT,
    opponentId TEXT,
    game_type TEXT,
    bet INTEGER,
    status TEXT DEFAULT 'pending',
    winnerId TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

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

    db.run('INSERT INTO users (id, nickname, password, avatar_emoji) VALUES (?, ?, ?, ?)',
      [userId, nickname, hashedPassword, avatar_emoji || '😊'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Nickname already taken' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ userId, nickname, avatar_emoji: avatar_emoji || '😊' });
      });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Вход
app.post('/api/login', (req, res) => {
  const { nickname, password } = req.body;
  db.get('SELECT * FROM users WHERE nickname = ?', [nickname], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
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
  });
});

// Получить данные пользователя
app.get('/api/user/:userId', (req, res) => {
  db.get('SELECT id, nickname, coins, avatar_emoji, theme FROM users WHERE id = ?',
    [req.params.userId], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    });
});

// Ежедневный бонус
app.post('/api/daily-bonus', (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT daily_bonus_date, coins FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.daily_bonus_date === today) {
      return res.json({ success: false, message: 'Уже получено сегодня' });
    }

    const newCoins = user.coins + 25;
    db.run('UPDATE users SET coins = ?, daily_bonus_date = ? WHERE id = ?',
      [newCoins, today, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, coins: newCoins, bonus: 25 });
      });
  });
});

// Колесо фортуны
app.post('/api/wheel-spin', (req, res) => {
  const { userId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT wheel_spin_date, coins FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
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
      if (random <= 0) {
        prize = p;
        break;
      }
    }

    if (prize.type === 'coins') {
      const newCoins = user.coins + prize.value;
      db.run('UPDATE users SET coins = ?, wheel_spin_date = ? WHERE id = ?',
        [newCoins, today, userId], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          res.json({ success: true, prize: { type: 'coins', value: prize.value }, coins: newCoins });
        });
    } else {
      db.run('INSERT OR IGNORE INTO user_accessories (userId, accessory_id) VALUES (?, ?)',
        [userId, prize.value], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          db.run('UPDATE users SET wheel_spin_date = ? WHERE id = ?', [today, userId], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true, prize: { type: 'legendary', value: prize.value }, coins: user.coins });
          });
        });
    }
  });
});

// Получить друзей
app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  db.all(`
    SELECT DISTINCT u.id, u.nickname, u.avatar_emoji, u.coins,
      (SELECT content FROM messages WHERE (senderId = ? AND receiverId = u.id) OR (senderId = u.id AND receiverId = ?) ORDER BY timestamp DESC LIMIT 1) as lastMessage
    FROM friends f
    JOIN users u ON (f.friendId = u.id AND f.userId = ?) OR (f.userId = u.id AND f.friendId = ?)
    WHERE f.userId = ? OR f.friendId = ?
  `, [userId, userId, userId, userId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows || []);
  });
});

// Добавить друга
app.post('/api/friends/add', (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) return res.status(400).json({ error: 'Missing IDs' });
  if (userId === friendId) return res.status(400).json({ error: 'Cannot add yourself' });

  db.get('SELECT id FROM users WHERE id = ?', [friendId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'User not found' });

    db.run('INSERT OR IGNORE INTO friends (userId, friendId) VALUES (?, ?)', [userId, friendId], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.run('INSERT OR IGNORE INTO streaks (userId, friendId, streak, last_message_date) VALUES (?, ?, 0, NULL)', [userId, friendId]);
      db.run('INSERT OR IGNORE INTO streaks (userId, friendId, streak, last_message_date) VALUES (?, ?, 0, NULL)', [friendId, userId]);
      res.json({ success: true });
    });
  });
});

// Сообщения
app.get('/api/messages/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  db.all(`
    SELECT * FROM messages 
    WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
    ORDER BY timestamp ASC
  `, [userId, friendId, friendId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows || []);
  });
});

// Аксессуары
app.get('/api/accessories/:userId', (req, res) => {
  db.all('SELECT * FROM user_accessories WHERE userId = ? AND equipped = 1',
    [req.params.userId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows || []);
    });
});

// Купить аксессуар
app.post('/api/buy-accessory', (req, res) => {
  const { userId, accessory_id, price } = req.body;

  db.get('SELECT coins FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.coins < price) return res.status(400).json({ error: 'Недостаточно монет' });

    db.run('UPDATE users SET coins = coins - ? WHERE id = ?', [price, userId], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.run('INSERT OR IGNORE INTO user_accessories (userId, accessory_id) VALUES (?, ?)',
        [userId, accessory_id], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          db.get('SELECT coins FROM users WHERE id = ?', [userId], (err, row) => {
            res.json({ success: true, coins: row.coins });
          });
        });
    });
  });
});

// Позиция аксессуара
app.post('/api/accessory-position', (req, res) => {
  const { userId, accessory_id, x, y } = req.body;
  db.run('UPDATE user_accessories SET x = ?, y = ? WHERE userId = ? AND accessory_id = ?',
    [x, y, userId, accessory_id], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    });
});

// Тема
app.post('/api/theme', (req, res) => {
  const { userId, theme } = req.body;
  db.run('UPDATE users SET theme = ? WHERE id = ?', [theme, userId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// Смайлик
app.post('/api/avatar-emoji', (req, res) => {
  const { userId, avatar_emoji } = req.body;
  db.run('UPDATE users SET avatar_emoji = ? WHERE id = ?', [avatar_emoji, userId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// Серийчик
app.get('/api/streak/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  db.get('SELECT streak FROM streaks WHERE userId = ? AND friendId = ?',
    [userId, friendId], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ streak: row?.streak || 0 });
    });
});

app.post('/api/streak/update', (req, res) => {
  const { userId, friendId } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  db.get('SELECT * FROM streaks WHERE userId = ? AND friendId = ?', [userId, friendId], (err, streak) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (!streak) {
      db.run('INSERT INTO streaks (userId, friendId, streak, last_message_date) VALUES (?, ?, 1, ?)',
        [userId, friendId, today]);
      return res.json({ streak: 1 });
    }

    if (streak.last_message_date === today) {
      return res.json({ streak: streak.streak });
    }

    if (streak.last_message_date === yesterday) {
      db.run('UPDATE streaks SET streak = streak + 1, last_message_date = ? WHERE userId = ? AND friendId = ?',
        [today, userId, friendId]);
      res.json({ streak: streak.streak + 1 });
    } else {
      db.run('UPDATE streaks SET streak = 1, last_message_date = ? WHERE userId = ? AND friendId = ?',
        [today, userId, friendId]);
      res.json({ streak: 1 });
    }
  });
});

// Дуэли
app.post('/api/duel/create', (req, res) => {
  const { creatorId, opponentId, game_type, bet } = req.body;
  const duelId = generateId() + generateId();

  db.get('SELECT coins FROM users WHERE id = ?', [creatorId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.coins < bet) return res.status(400).json({ error: 'Недостаточно монет' });

    db.run('UPDATE users SET coins = coins - ? WHERE id = ?', [bet, creatorId], (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.run(`INSERT INTO duels (id, creatorId, opponentId, game_type, bet, status)
              VALUES (?, ?, ?, ?, ?, 'pending')`,
        [duelId, creatorId, opponentId, game_type, bet], (err) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          res.json({ duelId });
        });
    });
  });
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

    db.run('INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content]);

    db.run('UPDATE users SET coins = coins + 1 WHERE id = ?', [senderId]);

    const message = {
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString()
    };

    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-message', message);
    }
    socket.emit('new-message', message);

    // Обновление серийчика
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    db.get('SELECT * FROM streaks WHERE userId = ? AND friendId = ?', [senderId, receiverId], (err, streak) => {
      if (err) return;
      if (!streak) {
        db.run('INSERT INTO streaks (userId, friendId, streak, last_message_date) VALUES (?, ?, 1, ?)',
          [senderId, receiverId, today]);
      } else if (streak.last_message_date !== today) {
        if (streak.last_message_date === yesterday) {
          db.run('UPDATE streaks SET streak = streak + 1, last_message_date = ? WHERE userId = ? AND friendId = ?',
            [today, senderId, receiverId]);
        } else {
          db.run('UPDATE streaks SET streak = 1, last_message_date = ? WHERE userId = ? AND friendId = ?',
            [today, senderId, receiverId]);
        }
      }
    });
  });

  socket.on('duel-invite', (data) => {
    const { duelId, opponentId } = data;
    const opponentSocketId = onlineUsers.get(opponentId);
    if (opponentSocketId) {
      io.to(opponentSocketId).emit('duel-invite', { duelId });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user-status', { userId: socket.userId, online: false });
    }
    console.log('❌ Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
