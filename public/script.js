// ==================== DOM ЭЛЕМЕНТЫ ====================
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');

// Меню и вкладки
const menuItems = document.querySelectorAll('.menu-item');
const tabs = document.querySelectorAll('.tab-content');
const menuNickname = document.getElementById('menu-nickname');
const menuCoins = document.getElementById('menu-coins');
const menuAvatar = document.getElementById('menu-avatar');

// Чаты
const friendsListEl = document.getElementById('friends-list');
const chatWithNameEl = document.getElementById('chat-with-name');
const chatWithStatusEl = document.getElementById('chat-with-status');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.querySelector('.send-btn');
const addFriendBtn = document.getElementById('add-friend-btn');
const friendIdInput = document.getElementById('friend-id-input');
const streakDisplay = document.getElementById('streak-display');
const streakCount = document.getElementById('streak-count');

// Профиль
const profileNickname = document.getElementById('profile-nickname');
const profileId = document.getElementById('profile-id');
const profileCoins = document.getElementById('profile-coins');
const avatarBase = document.getElementById('avatar-base');
const accessoriesLayer = document.getElementById('accessories-layer');
const equippedList = document.getElementById('equipped-list');

// Магазин
const shopCoinsAmount = document.getElementById('shop-coins-amount');
const shopItemsGrid = document.getElementById('shop-items-grid');

// Игры
const wheelSpinBtn = document.getElementById('wheel-spin-btn');
const wheelTimer = document.getElementById('wheel-timer');
const createDuelBtn = document.getElementById('create-duel-btn');
const duelFriendSelect = document.getElementById('duel-friend-select');
const duelGameSelect = document.getElementById('duel-game-select');
const duelBet = document.getElementById('duel-bet');
const duelsList = document.getElementById('duels-list');

// Настройки
const dailyBonusBtn = document.getElementById('daily-bonus-btn');
const dailyBonusStatus = document.getElementById('daily-bonus-status');
const saveEmojiBtn = document.getElementById('save-emoji-btn');

// Модалки
const duelModal = document.getElementById('duel-modal');
const wheelModal = document.getElementById('wheel-modal');
const closeDuelModal = document.getElementById('close-duel-modal');
const closeWheelModal = document.getElementById('close-wheel-modal');
const spinWheelBtn = document.getElementById('spin-wheel-btn');
const wheelCanvas = document.getElementById('wheel-canvas');
const wheelResult = document.getElementById('wheel-result');

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentUser = null;
let socket = null;
let selectedFriend = null;
let friends = [];
let currentStreak = 0;
let accessories = [];
let equippedAccessories = [];
let shopItems = [];
let activeDuels = [];
let wheelSpunToday = false;
let dailyBonusClaimed = false;

// Смайлики для выбора
const emojiList = [
  '😊', '😎', '🥰', '😇', '🤓', '🧐', '🤩', '😏', '😈', '👻',
  '🐶', '🐱', '🦊', '🐼', '🐸', '🐧', '🦁', '🐮', '🐷', '🐨',
  '🌟', '⭐', '🌙', '☀️', '🌈', '🔥', '💧', '❄️', '⚡', '💎'
];

// Аксессуары магазина
const shopAccessories = [
  // Головные уборы
  { id: 'top_hat', name: 'Цилиндр', icon: '🎩', category: 'hats', rarity: 'rare', price: 500 },
  { id: 'cap', name: 'Кепка', icon: '🧢', category: 'hats', rarity: 'common', price: 100 },
  { id: 'crown', name: 'Корона', icon: '👑', category: 'hats', rarity: 'legendary', price: 15000 },
  { id: 'cowboy', name: 'Ковбой', icon: '🤠', category: 'hats', rarity: 'epic', price: 2000 },
  { id: 'wizard', name: 'Волшебник', icon: '🧙', category: 'hats', rarity: 'epic', price: 1800 },
  { id: 'bunny_ears', name: 'Уши кролика', icon: '🐰', category: 'hats', rarity: 'rare', price: 600 },
  { id: 'cat_ears', name: 'Уши кошки', icon: '🐱', category: 'hats', rarity: 'rare', price: 550 },
  // Очки
  { id: 'glasses', name: 'Очки', icon: '👓', category: 'glasses', rarity: 'common', price: 150 },
  { id: 'sunglasses', name: 'Солнцезащитные', icon: '🕶️', category: 'glasses', rarity: 'rare', price: 400 },
  { id: 'nerd_glasses', name: 'Нёрд', icon: '🤓', category: 'glasses', rarity: 'common', price: 120 },
  // Шея
  { id: 'scarf', name: 'Шарф', icon: '🧣', category: 'neck', rarity: 'rare', price: 350 },
  { id: 'tie', name: 'Галстук', icon: '👔', category: 'neck', rarity: 'common', price: 200 },
  { id: 'bow', name: 'Бантик', icon: '🎀', category: 'neck', rarity: 'rare', price: 300 },
  // Эффекты
  { id: 'sparkles', name: 'Блёстки', icon: '✨', category: 'effects', rarity: 'epic', price: 1500 },
  { id: 'fire', name: 'Огонь', icon: '🔥', category: 'effects', rarity: 'epic', price: 2000 },
  { id: 'hearts', name: 'Сердечки', icon: '❤️', category: 'effects', rarity: 'rare', price: 800 },
  // Легендарные
  { id: 'halo', name: 'Нимб', icon: '😇', category: 'legendary', rarity: 'legendary', price: 12000 },
  { id: 'fire_aura', name: 'Аура огня', icon: '🔥', category: 'legendary', rarity: 'legendary', price: 15000 },
  { id: 'dragon_wings', name: 'Крылья дракона', icon: '🐉', category: 'legendary', rarity: 'legendary', price: 20000 },
  { id: 'rainbow_trail', name: 'Радуга', icon: '🌈', category: 'legendary', rarity: 'legendary', price: 10000 }
];

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function init() {
  renderEmojiGrid('emoji-grid', 'selected-emoji');
  renderEmojiGrid('settings-emoji-grid', null);
  setupEventListeners();
  checkWheelTimer();
}

function renderEmojiGrid(containerId, hiddenInputId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  
  grid.innerHTML = emojiList.map(emoji => `
    <div class="emoji-option" data-emoji="${emoji}">${emoji}</div>
  `).join('');
  
  grid.querySelectorAll('.emoji-option').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.emoji-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      if (hiddenInputId) {
        document.getElementById(hiddenInputId).value = el.dataset.emoji;
      }
    });
  });
  
  // Выбрать первый по умолчанию
  const first = grid.querySelector('.emoji-option');
  if (first) {
    first.classList.add('selected');
    if (hiddenInputId) {
      document.getElementById(hiddenInputId).value = first.dataset.emoji;
    }
  }
}

function setupEventListeners() {
  // Авторизация
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    authMessage.textContent = '';
  });
  
  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    authMessage.textContent = '';
  });
  
  registerForm.addEventListener('submit', handleRegister);
  loginForm.addEventListener('submit', handleLogin);
  
  // Меню
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      tabs.forEach(t => t.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');
      
      if (tab === 'profile') loadProfile();
      if (tab === 'shop') renderShop();
      if (tab === 'games') loadGamesData();
      if (tab === 'settings') loadSettings();
    });
  });
  
  // Выход
  document.getElementById('logout-btn-menu').addEventListener('click', logout);
  
  // Чаты
  addFriendBtn.addEventListener('click', addFriend);
  friendIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addFriend();
  });
  messageForm.addEventListener('submit', sendMessage);
  
  // Магазин
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderShop(btn.dataset.category);
    });
  });
  
  // Игры
  wheelSpinBtn.addEventListener('click', () => wheelModal.style.display = 'flex');
  closeWheelModal.addEventListener('click', () => wheelModal.style.display = 'none');
  spinWheelBtn.addEventListener('click', spinWheel);
  createDuelBtn.addEventListener('click', createDuel);
  closeDuelModal.addEventListener('click', () => duelModal.style.display = 'none');
  
  // Настройки
  dailyBonusBtn.addEventListener('click', claimDailyBonus);
  saveEmojiBtn.addEventListener('click', saveAvatarEmoji);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => changeTheme(btn.dataset.theme));
  });
}

// ==================== АВТОРИЗАЦИЯ ====================
async function handleRegister(e) {
  e.preventDefault();
  const nickname = document.getElementById('reg-nickname').value.trim();
  const password = document.getElementById('reg-password').value;
  const avatar_emoji = document.getElementById('selected-emoji').value;
  
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password, avatar_emoji })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
    
    authMessage.style.color = 'var(--accent-success)';
    authMessage.textContent = `Аккаунт создан! Ваш ID: ${data.userId}`;
    setTimeout(() => {
      showLoginLink.click();
      document.getElementById('login-nickname').value = nickname;
    }, 2500);
  } catch (err) {
    authMessage.style.color = 'var(--accent-danger)';
    authMessage.textContent = err.message;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const nickname = document.getElementById('login-nickname').value.trim();
  const password = document.getElementById('login-password').value;
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка входа');
    
    currentUser = data;
    authContainer.style.display = 'none';
    mainContainer.style.display = 'flex';
    
    updateUserDisplay();
    initSocket();
    loadFriends();
    applyTheme(currentUser.theme || 'dark');
  } catch (err) {
    authMessage.style.color = 'var(--accent-danger)';
    authMessage.textContent = err.message;
  }
}

function updateUserDisplay() {
  menuNickname.textContent = currentUser.nickname;
  menuCoins.textContent = `🪙 ${currentUser.coins || 0}`;
  menuAvatar.textContent = currentUser.avatar_emoji || '😊';
}

function logout() {
  if (socket) socket.disconnect();
  currentUser = null;
  selectedFriend = null;
  authContainer.style.display = 'block';
  mainContainer.style.display = 'none';
  loginForm.reset();
  registerForm.reset();
}

// ==================== SOCKET.IO ====================
function initSocket() {
  socket = io();
  socket.on('connect', () => {
    socket.emit('login', currentUser.userId);
  });
  
  socket.on('user-status', ({ userId, online }) => {
    if (selectedFriend && selectedFriend.id === userId) {
      chatWithStatusEl.textContent = online ? '● В сети' : '○ Не в сети';
      chatWithStatusEl.style.color = online ? 'var(--accent-success)' : 'var(--text-muted)';
    }
  });
  
  socket.on('new-message', (message) => {
    if (selectedFriend && (message.senderId === selectedFriend.id || message.receiverId === selectedFriend.id)) {
      appendMessage(message);
    }
    loadFriends();
    refreshUserData();
  });
  
  socket.on('duel-invite', ({ duelId }) => {
    loadActiveDuels();
  });
  
  socket.on('duel-move', ({ duelId, move }) => {
    handleDuelMove(duelId, move);
  });
}

async function refreshUserData() {
  if (!currentUser) return;
  const res = await fetch(`/api/user/${currentUser.userId}`);
  const data = await res.json();
  currentUser.coins = data.coins;
  currentUser.avatar_emoji = data.avatar_emoji;
  updateUserDisplay();
}

// ==================== ЧАТЫ ====================
async function loadFriends() {
  if (!currentUser) return;
  const res = await fetch(`/api/friends/${currentUser.userId}`);
  friends = await res.json();
  renderFriendsList();
}

function renderFriendsList() {
  if (friends.length === 0) {
    friendsListEl.innerHTML = '<p class="empty-text">Друзей пока нет</p>';
    return;
  }
  
  friendsListEl.innerHTML = friends.map(friend => `
    <div class="friend-item ${selectedFriend?.id === friend.id ? 'active' : ''}" data-id="${friend.id}">
      <div class="friend-avatar">${friend.avatar_emoji || '😊'}</div>
      <div class="friend-info">
        <div class="friend-name">${friend.nickname}</div>
        <div class="friend-last-message">${friend.lastMessage || 'Начните общение'}</div>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('.friend-item').forEach(el => {
    el.addEventListener('click', () => selectFriend(el.dataset.id));
  });
}

async function selectFriend(friendId) {
  selectedFriend = friends.find(f => f.id === friendId);
  if (!selectedFriend) return;
  
  chatWithNameEl.textContent = selectedFriend.nickname;
  messageInput.disabled = false;
  sendBtn.disabled = false;
  messageInput.focus();
  
  // Загружаем серийчик
  const streakRes = await fetch(`/api/streak/${currentUser.userId}/${friendId}`);
  const streakData = await streakRes.json();
  currentStreak = streakData.streak || 0;
  if (currentStreak > 0) {
    streakDisplay.style.display = 'flex';
    streakCount.textContent = currentStreak;
  } else {
    streakDisplay.style.display = 'none';
  }
  
  // Загружаем сообщения
  const msgRes = await fetch(`/api/messages/${currentUser.userId}/${friendId}`);
  const messages = await msgRes.json();
  renderMessages(messages);
  
  renderFriendsList();
}

function renderMessages(messages) {
  if (messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="empty-chat-message">
        <div class="empty-icon">💬</div>
        <h4>Нет сообщений</h4>
        <p>Начните общение</p>
      </div>
    `;
    return;
  }
  
  messagesContainer.innerHTML = messages.map(msg => {
    const isSent = msg.senderId === currentUser.userId;
    const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="message ${isSent ? 'sent' : 'received'}">
        <div class="message-content">${escapeHtml(msg.content)}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
  }).join('');
  
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendMessage(msg) {
  const existingEmpty = messagesContainer.querySelector('.empty-chat-message');
  if (existingEmpty) existingEmpty.remove();
  
  const isSent = msg.senderId === currentUser.userId;
  const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  messagesContainer.insertAdjacentHTML('beforeend', `
    <div class="message ${isSent ? 'sent' : 'received'}">
      <div class="message-content">${escapeHtml(msg.content)}</div>
      <div class="message-time">${time}</div>
    </div>
  `);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage(e) {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!content || !selectedFriend) return;
  
  socket.emit('send-message', {
    senderId: currentUser.userId,
    receiverId: selectedFriend.id,
    content
  });
  
  messageInput.value = '';
}

async function addFriend() {
  const friendId = friendIdInput.value.trim().toUpperCase();
  if (!friendId) return alert('Введите ID друга');
  if (friendId === currentUser.userId) return alert('Нельзя добавить себя');
  
  try {
    const res = await fetch('/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, friendId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    friendIdInput.value = '';
    loadFriends();
    alert('✅ Друг добавлен!');
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== ПРОФИЛЬ ====================
async function loadProfile() {
  profileNickname.textContent = currentUser.nickname;
  profileId.textContent = currentUser.userId;
  profileCoins.textContent = currentUser.coins || 0;
  avatarBase.textContent = currentUser.avatar_emoji || '😊';
  
  const res = await fetch(`/api/accessories/${currentUser.userId}`);
  equippedAccessories = await res.json();
  renderAccessories();
}

function renderAccessories() {
  accessoriesLayer.innerHTML = '';
  equippedList.innerHTML = '';
  
  equippedAccessories.forEach(acc => {
    const accData = shopAccessories.find(a => a.id === acc.accessory_id);
    if (!accData) return;
    
    const el = document.createElement('div');
    el.className = 'accessory-item';
    el.textContent = accData.icon;
    el.dataset.id = acc.accessory_id;
    el.style.left = (acc.x || 50) + 'px';
    el.style.top = (acc.y || 50) + 'px';
    el.style.transform = 'translate(-50%, -50%)';
    
    makeDraggable(el);
    accessoriesLayer.appendChild(el);
    
    const badge = document.createElement('span');
    badge.className = 'equipped-badge';
    badge.textContent = accData.icon + ' ' + accData.name;
    equippedList.appendChild(badge);
  });
}

function makeDraggable(el) {
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  
  el.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(el.style.left) || 0;
    startTop = parseInt(el.style.top) || 0;
    el.style.cursor = 'grabbing';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = (startLeft + dx) + 'px';
    el.style.top = (startTop + dy) + 'px';
  });
  
  document.addEventListener('mouseup', async () => {
    if (isDragging) {
      isDragging = false;
      el.style.cursor = 'grab';
      
      await fetch('/api/accessory-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          accessory_id: el.dataset.id,
          x: parseInt(el.style.left),
          y: parseInt(el.style.top)
        })
      });
    }
  });
}

// ==================== МАГАЗИН ====================
function renderShop(category = 'all') {
  shopCoinsAmount.textContent = currentUser.coins || 0;
  
  const filtered = category === 'all' 
    ? shopAccessories 
    : shopAccessories.filter(a => a.category === category);
  
  const ownedIds = equippedAccessories.map(a => a.accessory_id);
  
  shopItemsGrid.innerHTML = filtered.map(item => `
    <div class="shop-item rarity-${item.rarity} ${ownedIds.includes(item.id) ? 'owned' : ''}" data-id="${item.id}" data-price="${item.price}">
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-price">${item.price} 🪙</div>
      <div class="shop-item-rarity">${item.rarity}</div>
    </div>
  `).join('');
  
  document.querySelectorAll('.shop-item').forEach(el => {
    el.addEventListener('click', () => buyAccessory(el.dataset.id, parseInt(el.dataset.price)));
  });
}

async function buyAccessory(id, price) {
  if (equippedAccessories.some(a => a.accessory_id === id)) {
    alert('У вас уже есть этот предмет!');
    return;
  }
  
  if (currentUser.coins < price) {
    alert('Недостаточно монет!');
    return;
  }
  
  try {
    const res = await fetch('/api/buy-accessory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, accessory_id: id, price })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    currentUser.coins = data.coins;
    updateUserDisplay();
    
    const acc = shopAccessories.find(a => a.id === id);
    equippedAccessories.push({ accessory_id: id, x: 80, y: 80, icon: acc.icon });
    
    renderShop(document.querySelector('.category-btn.active').dataset.category);
    alert('✅ Предмет куплен!');
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

// ==================== ИГРЫ ====================
function checkWheelTimer() {
  const today = new Date().toISOString().split('T')[0];
  const lastSpin = localStorage.getItem(`wheel_${currentUser?.userId}`);
  wheelSpunToday = (lastSpin === today);
  
  if (wheelSpunToday) {
    wheelSpinBtn.disabled = true;
    wheelTimer.textContent = 'Уже крутили сегодня';
  } else {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    const diff = next - new Date();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    wheelTimer.textContent = `Доступно через ${hours}ч ${mins}м`;
  }
}

async function spinWheel() {
  if (wheelSpunToday) {
    alert('Вы уже крутили колесо сегодня!');
    return;
  }
  
  spinWheelBtn.disabled = true;
  
  // Анимация вращения
  const ctx = wheelCanvas.getContext('2d');
  const prizes = [10, 25, 50, 75, 100, '🎁'];
  const colors = ['#6c5ce7', '#a463f5', '#00d68f', '#ffaa00', '#ff3d71', '#ffd700'];
  
  let rotation = 0;
  const spins = 10 + Math.floor(Math.random() * 10);
  const targetRotation = spins * 360 + Math.random() * 360;
  
  const animate = () => {
    rotation += 20;
    drawWheel(ctx, prizes, colors, rotation);
    
    if (rotation < targetRotation) {
      requestAnimationFrame(animate);
    } else {
      // Отправляем запрос на сервер
      fetch('/api/wheel-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          currentUser.coins = data.coins;
          updateUserDisplay();
          wheelResult.textContent = data.prize.type === 'coins' 
            ? `Вы выиграли ${data.prize.value} 🪙!`
            : `Легендарный предмет: ${data.prize.value}!`;
          
          localStorage.setItem(`wheel_${currentUser.userId}`, new Date().toISOString().split('T')[0]);
          wheelSpunToday = true;
          checkWheelTimer();
        }
        spinWheelBtn.disabled = false;
      });
    }
  };
  
  requestAnimationFrame(animate);
}

function drawWheel(ctx, prizes, colors, rotation = 0) {
  const centerX = 150, centerY = 150, radius = 140;
  const sliceAngle = (Math.PI * 2) / prizes.length;
  
  ctx.clearRect(0, 0, 300, 300);
  
  prizes.forEach((prize, i) => {
    const startAngle = i * sliceAngle + rotation * Math.PI / 180;
    const endAngle = startAngle + sliceAngle;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Inter';
    ctx.fillText(prize, radius * 0.7, 0);
    ctx.restore();
  });
}

async function loadGamesData() {
  // Заполняем список друзей для дуэлей
  duelFriendSelect.innerHTML = '<option value="">Выберите друга</option>' +
    friends.map(f => `<option value="${f.id}">${f.nickname}</option>`).join('');
  
  loadActiveDuels();
}

async function createDuel() {
  const opponentId = duelFriendSelect.value;
  const gameType = duelGameSelect.value;
  const bet = parseInt(duelBet.value);
  
  if (!opponentId) return alert('Выберите друга');
  if (bet < 50 || bet > 5000) return alert('Ставка от 50 до 5000');
  if (currentUser.coins < bet) return alert('Недостаточно монет');
  
  try {
    const res = await fetch('/api/duel/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorId: currentUser.userId, opponentId, game_type: gameType, bet })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    socket.emit('duel-invite', { duelId: data.duelId, opponentId });
    alert('Вызов отправлен!');
    loadActiveDuels();
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

async function loadActiveDuels() {
  // Заглушка - в реальности нужен эндпоинт на сервере
  duelsList.innerHTML = '<p class="empty-text">Нет активных дуэлей</p>';
}

function handleDuelMove(duelId, move) {
  // Обработка хода в дуэли
  console.log('Duel move:', duelId, move);
}

// ==================== НАСТРОЙКИ ====================
function loadSettings() {
  dailyBonusStatus.textContent = '';
}

async function claimDailyBonus() {
  try {
    const res = await fetch('/api/daily-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId })
    });
    const data = await res.json();
    
    if (data.success) {
      currentUser.coins = data.coins;
      updateUserDisplay();
      dailyBonusStatus.textContent = `✅ Получено ${data.bonus} 🪙!`;
      dailyBonusStatus.style.color = 'var(--accent-success)';
    } else {
      dailyBonusStatus.textContent = '❌ ' + data.message;
      dailyBonusStatus.style.color = 'var(--accent-danger)';
    }
  } catch (err) {
    dailyBonusStatus.textContent = '❌ Ошибка';
  }
}

async function saveAvatarEmoji() {
  const selected = document.querySelector('#settings-emoji-grid .emoji-option.selected');
  if (!selected) return;
  
  const emoji = selected.dataset.emoji;
  await fetch('/api/avatar-emoji', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser.userId, avatar_emoji: emoji })
  });
  
  currentUser.avatar_emoji = emoji;
  menuAvatar.textContent = emoji;
  avatarBase.textContent = emoji;
  alert('✅ Смайлик сохранён!');
}

async function changeTheme(theme) {
  await fetch('/api/theme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser.userId, theme })
  });
  
  applyTheme(theme);
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// ==================== ЗАПУСК ====================
init();
// ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ====================

// Загрузка аксессуаров при старте
async function loadUserAccessories() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/accessories/${currentUser.userId}`);
    equippedAccessories = await res.json();
  } catch (err) {
    console.error('Failed to load accessories:', err);
  }
}

// Обновление монет в интерфейсе
function updateCoinsDisplay() {
  menuCoins.textContent = `🪙 ${currentUser.coins || 0}`;
  if (profileCoins) profileCoins.textContent = currentUser.coins || 0;
  if (shopCoinsAmount) shopCoinsAmount.textContent = currentUser.coins || 0;
}

// Проверка ежедневного бонуса при входе
async function checkDailyBonusOnLogin() {
  const today = new Date().toISOString().split('T')[0];
  const lastBonus = localStorage.getItem(`daily_${currentUser.userId}`);
  
  if (lastBonus !== today) {
    // Показываем уведомление о доступном бонусе
    setTimeout(() => {
      if (confirm('🎁 Доступен ежедневный бонус! Получить 25 🪙?')) {
        claimDailyBonus();
      }
    }, 1000);
  }
}

// Обновление таймера колеса фортуны каждую минуту
setInterval(() => {
  if (currentUser && !wheelSpunToday) {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    const diff = next - new Date();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (wheelTimer) wheelTimer.textContent = `Доступно через ${hours}ч ${mins}м`;
  }
}, 60000);

// ==================== ОБРАБОТЧИКИ ДУЭЛЕЙ ====================

// Принять дуэль
async function acceptDuel(duelId) {
  try {
    const res = await fetch('/api/duel/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duelId, userId: currentUser.userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    // Открываем модалку с игрой
    duelModal.style.display = 'flex';
    startDuelGame(duelId, data.game_type);
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

// Отклонить дуэль
async function declineDuel(duelId) {
  try {
    await fetch('/api/duel/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duelId })
    });
    loadActiveDuels();
  } catch (err) {
    console.error('Failed to decline duel:', err);
  }
}

// Начать игру дуэли
function startDuelGame(duelId, gameType) {
  const gameArea = document.getElementById('duel-game-area');
  
  if (gameType === 'rps') {
    gameArea.innerHTML = `
      <h3>Камень-Ножницы-Бумага</h3>
      <p>Выберите ваш ход:</p>
      <div class="rps-buttons">
        <button class="rps-btn" data-move="rock">🪨 Камень</button>
        <button class="rps-btn" data-move="scissors">✂️ Ножницы</button>
        <button class="rps-btn" data-move="paper">📄 Бумага</button>
      </div>
      <p id="duel-status">Ожидание хода соперника...</p>
    `;
    
    document.querySelectorAll('.rps-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const move = btn.dataset.move;
        socket.emit('duel-move', { duelId, opponentId: selectedFriend?.id, move });
        btn.disabled = true;
        document.getElementById('duel-status').textContent = 'Ход сделан, ждём соперника...';
      });
    });
  } else if (gameType === 'coin') {
    gameArea.innerHTML = `
      <h3>Монетка</h3>
      <p>Угадайте сторону:</p>
      <div class="coin-buttons">
        <button class="coin-btn" data-move="heads">🪙 Орёл</button>
        <button class="coin-btn" data-move="tails">💰 Решка</button>
      </div>
      <p id="duel-status">Выберите сторону...</p>
    `;
    
    document.querySelectorAll('.coin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const move = btn.dataset.move;
        socket.emit('duel-move', { duelId, opponentId: selectedFriend?.id, move });
        document.querySelectorAll('.coin-btn').forEach(b => b.disabled = true);
        document.getElementById('duel-status').textContent = 'Ставка сделана, ждём результат...';
        
        // Симулируем подбрасывание
        setTimeout(() => {
          const result = Math.random() > 0.5 ? 'heads' : 'tails';
          const won = move === result;
          completeDuel(duelId, won);
        }, 2000);
      });
    });
  }
}

// Завершить дуэль
async function completeDuel(duelId, won) {
  const statusEl = document.getElementById('duel-status');
  
  if (won) {
    statusEl.textContent = '🎉 Вы выиграли!';
    try {
      await fetch('/api/duel/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duelId, winnerId: currentUser.userId })
      });
      refreshUserData();
    } catch (err) {
      console.error('Failed to complete duel:', err);
    }
  } else {
    statusEl.textContent = '😢 Вы проиграли...';
  }
  
  setTimeout(() => {
    duelModal.style.display = 'none';
    loadActiveDuels();
  }, 3000);
}

// ==================== СЕРИЙЧИКИ ====================

// Обновление серийчика после отправки сообщения
async function updateStreak(friendId) {
  try {
    const res = await fetch('/api/streak/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, friendId })
    });
    const data = await res.json();
    
    currentStreak = data.streak;
    if (currentStreak > 0) {
      streakDisplay.style.display = 'flex';
      streakCount.textContent = currentStreak;
      
      // Анимация огонька
      streakDisplay.style.animation = 'none';
      setTimeout(() => {
        streakDisplay.style.animation = 'pulse 0.5s ease';
      }, 10);
    }
    
    // Бонус за серию 7+ дней
    if (currentStreak === 7) {
      alert('🔥 Серия 7 дней! Вы получаете 100 🪙!');
      refreshUserData();
    }
  } catch (err) {
    console.error('Failed to update streak:', err);
  }
}

// Добавляем анимацию для огонька
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

// ==================== ПЕРЕТАСКИВАНИЕ АКСЕССУАРОВ (дополнение) ====================

// Для сенсорных устройств
function makeDraggableTouch(el) {
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  
  el.addEventListener('touchstart', (e) => {
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startLeft = parseInt(el.style.left) || 0;
    startTop = parseInt(el.style.top) || 0;
    e.preventDefault();
  });
  
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    el.style.left = (startLeft + dx) + 'px';
    el.style.top = (startTop + dy) + 'px';
    e.preventDefault();
  });
  
  document.addEventListener('touchend', async () => {
    if (isDragging) {
      isDragging = false;
      
      await fetch('/api/accessory-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          accessory_id: el.dataset.id,
          x: parseInt(el.style.left),
          y: parseInt(el.style.top)
        })
      });
    }
  });
}

// ==================== УВЕДОМЛЕНИЯ ====================

// Простое всплывающее уведомление
function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <strong>${title}</strong>
    <p>${message}</p>
  `;
  
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 16px 20px;
    max-width: 300px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    box-shadow: var(--shadow-lg);
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Анимации для уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100px); }
  }
  .notification-success { border-left: 4px solid var(--accent-success); }
  .notification-error { border-left: 4px solid var(--accent-danger); }
  .notification-info { border-left: 4px solid var(--accent-primary); }
`;
document.head.appendChild(notificationStyles);

// ==================== ЗАГРУЗКА ТЕМЫ ПРИ СТАРТЕ ====================

const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

// ==================== ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ДЛЯ КНОПОК РЕДКОСТЕЙ ====================

const rarityStyles = document.createElement('style');
rarityStyles.textContent = `
  .rarity-common { border-bottom: 3px solid #888; }
  .rarity-rare { border-bottom: 3px solid #4a9eff; }
  .rarity-epic { border-bottom: 3px solid #c44eff; }
  .rarity-legendary { 
    border-bottom: 3px solid #ffd700;
    animation: legendaryGlow 2s infinite;
  }
  
  @keyframes legendaryGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
    50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
  }
  
  .rps-buttons, .coin-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin: 20px 0;
  }
  
  .rps-btn, .coin-btn {
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
  }
  
  .rps-btn:hover, .coin-btn:hover {
    background: var(--accent-primary);
    transform: scale(1.05);
  }
  
  .rps-btn:disabled, .coin-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
document.head.appendChild(rarityStyles);

// ==================== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ДОСТУПА ====================
window.acceptDuel = acceptDuel;
window.declineDuel = declineDuel;

console.log('✅ ZOMO CHAT загружен! Добро пожаловать!');
