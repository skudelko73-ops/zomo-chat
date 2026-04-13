// ==================== DOM ЭЛЕМЕНТЫ ====================
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');

const menuItems = document.querySelectorAll('.menu-item');
const tabs = document.querySelectorAll('.tab-content');
const menuNickname = document.getElementById('menu-nickname');
const menuCoins = document.getElementById('menu-coins');
const menuAvatar = document.getElementById('menu-avatar');

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

const profileNickname = document.getElementById('profile-nickname');
const profileId = document.getElementById('profile-id');
const profileCoins = document.getElementById('profile-coins');
const avatarBase = document.getElementById('avatar-base');
const accessoriesLayer = document.getElementById('accessories-layer');
const equippedList = document.getElementById('equipped-list');

const shopCoinsAmount = document.getElementById('shop-coins-amount');
const shopItemsGrid = document.getElementById('shop-items-grid');

const wheelSpinBtn = document.getElementById('wheel-spin-btn');
const wheelTimer = document.getElementById('wheel-timer');
const createDuelBtn = document.getElementById('create-duel-btn');
const duelFriendSelect = document.getElementById('duel-friend-select');
const duelGameSelect = document.getElementById('duel-game-select');
const duelBet = document.getElementById('duel-bet');
const duelsList = document.getElementById('duels-list');

const dailyBonusBtn = document.getElementById('daily-bonus-btn');
const dailyBonusStatus = document.getElementById('daily-bonus-status');
const saveEmojiBtn = document.getElementById('save-emoji-btn');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');

const wheelModal = document.getElementById('wheel-modal');
const guessModal = document.getElementById('guess-modal');
const quizModal = document.getElementById('quiz-modal');
const duelModal = document.getElementById('duel-modal');
const rpsBotModal = document.getElementById('rps-bot-modal');

const closeWheelModal = document.getElementById('close-wheel-modal');
const closeGuessModal = document.getElementById('close-guess-modal');
const closeQuizModal = document.getElementById('close-quiz-modal');
const closeDuelModal = document.getElementById('close-duel-modal');
const closeRpsBotModal = document.getElementById('close-rps-bot-modal');

const spinWheelBtn = document.getElementById('spin-wheel-btn');
const wheelCanvas = document.getElementById('wheel-canvas');
const wheelResult = document.getElementById('wheel-result');

const guessNumberBtn = document.getElementById('guess-number-btn');
const clickerBtn = document.getElementById('clicker-btn');
const clickerCount = document.getElementById('clicker-count');
const quizBtn = document.getElementById('quiz-btn');
const rpsBotBtn = document.getElementById('rps-bot-btn');
const coinBotBtn = document.getElementById('coin-bot-btn');

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentUser = null;
let socket = null;
let selectedFriend = null;
let friends = [];
let currentStreak = 0;
let equippedAccessories = [];
let shopAccessories = [];
let secretNumber = 0;
let guessAttempts = 0;
let currentQuiz = [];
let quizAnswers = [];

const emojiList = ['😊','😎','🥰','😇','🤓','🧐','🤩','😏','😈','👻','🐶','🐱','🦊','🐼','🐸','🐧','🦁','🐮','🐷','🐨','🌟','⭐','🌙','☀️','🌈','🔥','💧','❄️','⚡','💎'];

shopAccessories = [
  { id: 'top_hat', name: 'Цилиндр', icon: '🎩', category: 'hats', rarity: 'rare', price: 500 },
  { id: 'cap', name: 'Кепка', icon: '🧢', category: 'hats', rarity: 'common', price: 100 },
  { id: 'crown', name: 'Корона', icon: '👑', category: 'hats', rarity: 'legendary', price: 15000 },
  { id: 'cowboy', name: 'Ковбой', icon: '🤠', category: 'hats', rarity: 'epic', price: 2000 },
  { id: 'wizard', name: 'Волшебник', icon: '🧙', category: 'hats', rarity: 'epic', price: 1800 },
  { id: 'bunny_ears', name: 'Уши кролика', icon: '🐰', category: 'hats', rarity: 'rare', price: 600 },
  { id: 'cat_ears', name: 'Уши кошки', icon: '🐱', category: 'hats', rarity: 'rare', price: 550 },
  { id: 'glasses', name: 'Очки', icon: '👓', category: 'glasses', rarity: 'common', price: 150 },
  { id: 'sunglasses', name: 'Солнцезащитные', icon: '🕶️', category: 'glasses', rarity: 'rare', price: 400 },
  { id: 'nerd_glasses', name: 'Нёрд', icon: '🤓', category: 'glasses', rarity: 'common', price: 120 },
  { id: 'scarf', name: 'Шарф', icon: '🧣', category: 'neck', rarity: 'rare', price: 350 },
  { id: 'tie', name: 'Галстук', icon: '👔', category: 'neck', rarity: 'common', price: 200 },
  { id: 'bow', name: 'Бантик', icon: '🎀', category: 'neck', rarity: 'rare', price: 300 },
  { id: 'sparkles', name: 'Блёстки', icon: '✨', category: 'effects', rarity: 'epic', price: 1500 },
  { id: 'fire', name: 'Огонь', icon: '🔥', category: 'effects', rarity: 'epic', price: 2000 },
  { id: 'hearts', name: 'Сердечки', icon: '❤️', category: 'effects', rarity: 'rare', price: 800 },
  { id: 'halo', name: 'Нимб', icon: '😇', category: 'legendary', rarity: 'legendary', price: 12000 },
  { id: 'fire_aura', name: 'Аура огня', icon: '🔥', category: 'legendary', rarity: 'legendary', price: 15000 },
  { id: 'dragon_wings', name: 'Крылья дракона', icon: '🐉', category: 'legendary', rarity: 'legendary', price: 20000 }
];

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function init() {
  renderEmojiGrid('emoji-grid', 'selected-emoji');
  renderEmojiGrid('settings-emoji-grid', null);
  setupEventListeners();
  checkTimers();
}

function renderEmojiGrid(containerId, hiddenInputId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = emojiList.map(e => `<div class="emoji-option" data-emoji="${e}">${e}</div>`).join('');
  grid.querySelectorAll('.emoji-option').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.emoji-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      if (hiddenInputId) document.getElementById(hiddenInputId).value = el.dataset.emoji;
    });
  });
  const first = grid.querySelector('.emoji-option');
  if (first) { first.classList.add('selected'); if (hiddenInputId) document.getElementById(hiddenInputId).value = first.dataset.emoji; }
}

function setupEventListeners() {
  showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.remove('active'); registerForm.classList.add('active'); });
  showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerForm.classList.remove('active'); loginForm.classList.add('active'); });
  registerForm.addEventListener('submit', handleRegister);
  loginForm.addEventListener('submit', handleLogin);
  
  menuItems.forEach(item => item.addEventListener('click', () => {
    const tab = item.dataset.tab;
    menuItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    tabs.forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    if (tab === 'profile') loadProfile();
    if (tab === 'shop') renderShop();
    if (tab === 'games') loadGamesData();
  }));
  
  document.getElementById('logout-btn-menu').addEventListener('click', logout);
  addFriendBtn.addEventListener('click', addFriend);
  friendIdInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addFriend(); });
  messageForm.addEventListener('submit', sendMessage);
  
  document.querySelectorAll('.category-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShop(btn.dataset.category);
  }));
  
  wheelSpinBtn.addEventListener('click', () => wheelModal.style.display = 'flex');
  closeWheelModal.addEventListener('click', () => wheelModal.style.display = 'none');
  spinWheelBtn.addEventListener('click', spinWheel);
  
  guessNumberBtn.addEventListener('click', startGuessNumber);
  closeGuessModal.addEventListener('click', () => guessModal.style.display = 'none');
  document.getElementById('submit-guess-btn').addEventListener('click', submitGuess);
  
  clickerBtn.addEventListener('click', doClicker);
  quizBtn.addEventListener('click', startQuiz);
  closeQuizModal.addEventListener('click', () => quizModal.style.display = 'none');
  
  rpsBotBtn.addEventListener('click', () => rpsBotModal.style.display = 'flex');
  closeRpsBotModal.addEventListener('click', () => rpsBotModal.style.display = 'none');
  document.querySelectorAll('.rps-btn').forEach(btn => btn.addEventListener('click', playRPSBot));
  
  coinBotBtn.addEventListener('click', playCoinBot);
  createDuelBtn.addEventListener('click', createDuel);
  closeDuelModal.addEventListener('click', () => duelModal.style.display = 'none');
  
  dailyBonusBtn.addEventListener('click', claimDailyBonus);
  saveEmojiBtn.addEventListener('click', saveAvatarEmoji);
  document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => changeTheme(btn.dataset.theme)));
  enableNotificationsBtn.addEventListener('click', enableNotifications);
}

// ==================== АВТОРИЗАЦИЯ ====================
async function handleRegister(e) {
  e.preventDefault();
  const nickname = document.getElementById('reg-nickname').value.trim();
  const password = document.getElementById('reg-password').value;
  const avatar_emoji = document.getElementById('selected-emoji').value;
  try {
    const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname, password, avatar_emoji }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    authMessage.style.color = 'var(--accent-success)';
    authMessage.textContent = `Аккаунт создан! ID: ${data.userId}`;
    setTimeout(() => { showLoginLink.click(); document.getElementById('login-nickname').value = nickname; }, 2000);
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
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname, password }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    currentUser = data;
    authContainer.style.display = 'none';
    mainContainer.style.display = 'flex';
    updateUserDisplay();
    initSocket();
    loadFriends();
    applyTheme(currentUser.theme || 'dark');
    checkDailyBonusOnLogin();
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
  loginForm.reset(); registerForm.reset();
}

// ==================== SOCKET ====================
function initSocket() {
  socket = io();
  socket.on('connect', () => socket.emit('login', currentUser.userId));
  socket.on('user-status', ({ userId, online }) => {
    if (selectedFriend?.id === userId) {
      chatWithStatusEl.textContent = online ? '● В сети' : '○ Не в сети';
      chatWithStatusEl.style.color = online ? 'var(--accent-success)' : 'var(--text-muted)';
    }
  });
  socket.on('new-message', (message) => {
    if (selectedFriend && (message.senderId === selectedFriend.id || message.receiverId === selectedFriend.id)) appendMessage(message);
    loadFriends();
    refreshUserData();
  });
  socket.on('duel-invite', ({ duelId }) => loadActiveDuels());
  socket.on('duel-move', ({ duelId, move }) => handleDuelMove(duelId, move));
}

async function refreshUserData() {
  if (!currentUser) return;
  const res = await fetch(`/api/user/${currentUser.userId}`);
  const data = await res.json();
  currentUser.coins = data.coins;
  updateUserDisplay();
}

// ==================== ЧАТЫ ====================
async function loadFriends() {
  const res = await fetch(`/api/friends/${currentUser.userId}`);
  friends = await res.json();
  renderFriendsList();
}

function renderFriendsList() {
  if (friends.length === 0) { friendsListEl.innerHTML = '<p class="empty-text">Друзей пока нет</p>'; return; }
  friendsListEl.innerHTML = friends.map(f => `
    <div class="friend-item ${selectedFriend?.id === f.id ? 'active' : ''}" data-id="${f.id}">
      <div class="friend-avatar">${f.avatar_emoji || '😊'}</div>
      <div class="friend-info"><div class="friend-name">${f.nickname}</div><div class="friend-last-message">${f.lastmessage || 'Начните общение'}</div></div>
    </div>
  `).join('');
  document.querySelectorAll('.friend-item').forEach(el => el.addEventListener('click', () => selectFriend(el.dataset.id)));
}

async function selectFriend(friendId) {
  selectedFriend = friends.find(f => f.id === friendId);
  if (!selectedFriend) return;
  chatWithNameEl.textContent = selectedFriend.nickname;
  messageInput.disabled = false; sendBtn.disabled = false;
  const streakRes = await fetch(`/api/streak/${currentUser.userId}/${friendId}`);
  const streakData = await streakRes.json();
  currentStreak = streakData.streak || 0;
  streakDisplay.style.display = currentStreak > 0 ? 'flex' : 'none';
  streakCount.textContent = currentStreak;
  const msgRes = await fetch(`/api/messages/${currentUser.userId}/${friendId}`);
  renderMessages(await msgRes.json());
  renderFriendsList();
}

function renderMessages(messages) {
  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="empty-chat-message"><div class="empty-icon">💬</div><h4>Нет сообщений</h4></div>';
    return;
  }
  messagesContainer.innerHTML = messages.map(m => {
    const isSent = m.senderId === currentUser.userId;
    const time = new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `<div class="message ${isSent ? 'sent' : 'received'}"><div class="message-content">${escapeHtml(m.content)}</div><div class="message-time">${time}</div></div>`;
  }).join('');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendMessage(msg) {
  const empty = messagesContainer.querySelector('.empty-chat-message');
  if (empty) empty.remove();
  const isSent = msg.senderId === currentUser.userId;
  const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  messagesContainer.insertAdjacentHTML('beforeend', `<div class="message ${isSent ? 'sent' : 'received'}"><div class="message-content">${escapeHtml(msg.content)}</div><div class="message-time">${time}</div></div>`);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage(e) {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!content || !selectedFriend) return;
  socket.emit('send-message', { senderId: currentUser.userId, receiverId: selectedFriend.id, content });
  messageInput.value = '';
}

async function addFriend() {
  const friendId = friendIdInput.value.trim().toUpperCase();
  if (!friendId) return alert('Введите ID');
  if (friendId === currentUser.userId) return alert('Нельзя добавить себя');
  try {
    const res = await fetch('/api/friends/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, friendId }) });
    if (!res.ok) throw new Error((await res.json()).error);
    friendIdInput.value = '';
    loadFriends();
  } catch (err) { alert('❌ ' + err.message); }
}

function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

// ==================== ПРОФИЛЬ ====================
async function loadProfile() {
  profileNickname.textContent = currentUser.nickname;
  profileId.textContent = currentUser.userId;
  profileCoins.textContent = currentUser.coins;
  avatarBase.textContent = currentUser.avatar_emoji;
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
    el.dataset.scale = acc.scale || 1.0;
    el.style.left = (acc.x || 80) + 'px';
    el.style.top = (acc.y || 80) + 'px';
    el.style.transform = `translate(-50%, -50%) scale(${el.dataset.scale})`;
    makeDraggable(el);
    accessoriesLayer.appendChild(el);
    equippedList.innerHTML += `<span class="equipped-badge">${accData.icon} ${accData.name}</span>`;
  });
}

function makeDraggable(el) {
  let isDragging = false, startX, startY, startLeft, startTop;
  const container = document.getElementById('avatar-canvas-container');
  
  function getBounds() { const r = container.getBoundingClientRect(); return { minX: 0, maxX: r.width, minY: 0, maxY: r.height }; }
  
  function startDrag(cX, cY) {
    isDragging = true;
    startX = cX; startY = cY;
    startLeft = parseInt(el.style.left) || 80;
    startTop = parseInt(el.style.top) || 80;
    el.style.cursor = 'grabbing';
  }
  
  function onDrag(cX, cY) {
    if (!isDragging) return;
    const dx = cX - startX, dy = cY - startY;
    const bounds = getBounds();
    let newLeft = Math.max(bounds.minX, Math.min(startLeft + dx, bounds.maxX - 30));
    let newTop = Math.max(bounds.minY, Math.min(startTop + dy, bounds.maxY - 30));
    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';
  }
  
  async function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    el.style.cursor = 'grab';
    await fetch('/api/accessory-update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, accessory_id: el.dataset.id, x: parseInt(el.style.left), y: parseInt(el.style.top), scale: parseFloat(el.dataset.scale) || 1.0 })
    });
  }
  
  el.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
  document.addEventListener('mousemove', e => onDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', endDrag);
  el.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; startDrag(t.clientX, t.clientY); });
  document.addEventListener('touchmove', e => { if (!isDragging) return; const t = e.touches[0]; onDrag(t.clientX, t.clientY); });
  document.addEventListener('touchend', endDrag);
}

// ==================== МАГАЗИН ====================
function renderShop(cat = 'all') {
  shopCoinsAmount.textContent = currentUser.coins || 0;
  const filtered = cat === 'all' ? shopAccessories : shopAccessories.filter(a => a.category === cat);
  const owned = equippedAccessories.map(a => a.accessory_id);
  shopItemsGrid.innerHTML = filtered.map(item => `
    <div class="shop-item rarity-${item.rarity} ${owned.includes(item.id) ? 'owned' : ''}" data-id="${item.id}" data-price="${item.price}">
      <div class="shop-item-icon">${item.icon}</div><div class="shop-item-name">${item.name}</div><div class="shop-item-price">${item.price} 🪙</div>
    </div>
  `).join('');
  document.querySelectorAll('.shop-item:not(.owned)').forEach(el => el.addEventListener('click', () => buyAccessory(el.dataset.id, parseInt(el.dataset.price))));
}

async function buyAccessory(id, price) {
  if (currentUser.coins < price) return alert('Недостаточно монет');
  try {
    const res = await fetch('/api/buy-accessory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, accessory_id: id, price }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    currentUser.coins = data.coins;
    updateUserDisplay();
    equippedAccessories.push({ accessory_id: id, x: 80, y: 80, scale: 1.0 });
    renderShop(document.querySelector('.category-btn.active').dataset.category);
  } catch (err) { alert('❌ ' + err.message); }
}

// ==================== ИГРЫ ====================
function checkTimers() {
  const today = new Date().toISOString().split('T')[0];
  const lastWheel = localStorage.getItem(`wheel_${currentUser?.userId}`);
  if (lastWheel === today && wheelSpinBtn) wheelSpinBtn.disabled = true;
}

async function spinWheel() {
  spinWheelBtn.disabled = true;
  const ctx = wheelCanvas.getContext('2d');
  const prizes = [10, 25, 50, 75, 100, '🎁'];
  const colors = ['#6c5ce7','#a463f5','#00d68f','#ffaa00','#ff3d71','#ffd700'];
  let rotation = 0;
  const target = 15 * 360 + Math.random() * 360;
  
  const animate = () => {
    rotation += 20;
    drawWheel(ctx, prizes, colors, rotation);
    if (rotation < target) requestAnimationFrame(animate);
    else {
      fetch('/api/wheel-spin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId }) })
        .then(r => r.json()).then(d => {
          if (d.success) {
            currentUser.coins = d.coins;
            updateUserDisplay();
            wheelResult.textContent = d.prize.type === 'coins' ? `+${d.prize.value} 🪙` : `🎁 ${d.prize.value}`;
            localStorage.setItem(`wheel_${currentUser.userId}`, new Date().toISOString().split('T')[0]);
          }
          spinWheelBtn.disabled = false;
        });
    }
  };
  requestAnimationFrame(animate);
}

function drawWheel(ctx, prizes, colors, rot) {
  const cx = 150, cy = 150, r = 140, slice = (Math.PI*2)/prizes.length;
  ctx.clearRect(0,0,300,300);
  prizes.forEach((p,i) => {
    const sa = i*slice + rot*Math.PI/180, ea = sa+slice;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,sa,ea); ctx.closePath();
    ctx.fillStyle = colors[i%colors.length]; ctx.fill(); ctx.strokeStyle='#fff'; ctx.stroke();
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(sa+slice/2); ctx.fillStyle='#fff'; ctx.font='bold 16px Inter'; ctx.fillText(p, r*0.7, 0); ctx.restore();
  });
}

async function startGuessNumber() {
  const res = await fetch('/api/guess-number', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId }) });
  const data = await res.json();
  if (!data.success) return alert(data.message);
  secretNumber = data.secretNumber;
  guessAttempts = 3;
  document.getElementById('guess-attempts').textContent = `Попыток: ${guessAttempts}`;
  document.getElementById('guess-hint').textContent = '';
  guessModal.style.display = 'flex';
}

async function submitGuess() {
  const guess = parseInt(document.getElementById('guess-input').value);
  if (!guess) return;
  guessAttempts--;
  const hint = document.getElementById('guess-hint');
  if (guess === secretNumber) {
    const prize = Math.max(10, 50 - (2 - guessAttempts) * 10);
    const res = await fetch('/api/guess-number/win', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, attempts: 3 - guessAttempts }) });
    const data = await res.json();
    currentUser.coins = data.coins;
    updateUserDisplay();
    hint.textContent = `🎉 Правильно! +${prize} 🪙`;
    setTimeout(() => guessModal.style.display = 'none', 2000);
  } else {
    hint.textContent = guess < secretNumber ? '⬆️ Больше!' : '⬇️ Меньше!';
    document.getElementById('guess-attempts').textContent = `Попыток: ${guessAttempts}`;
    if (guessAttempts === 0) { hint.textContent = `😢 Не угадали. Число: ${secretNumber}`; setTimeout(() => guessModal.style.display = 'none', 2000); }
  }
}

async function doClicker() {
  const res = await fetch('/api/clicker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId }) });
  const data = await res.json();
  if (data.success) {
    currentUser.coins = data.coins;
    updateUserDisplay();
    clickerCount.textContent = `${data.count}/50`;
  } else alert(data.message);
}

async function startQuiz() {
  const res = await fetch('/api/quiz');
  currentQuiz = await res.json();
  quizAnswers = [];
  renderQuizQuestion(0);
  quizModal.style.display = 'flex';
}

function renderQuizQuestion(idx) {
  if (idx >= currentQuiz.length) return finishQuiz();
  const q = currentQuiz[idx];
  const content = document.getElementById('quiz-content');
  content.innerHTML = `<h3>${q.question}</h3>`;
  q.options.forEach((opt, i) => {
    content.innerHTML += `<button class="quiz-option" data-idx="${idx}" data-opt="${i}">${opt}</button>`;
  });
  document.querySelectorAll('.quiz-option').forEach(btn => btn.addEventListener('click', e => {
    quizAnswers.push({ idx: parseInt(btn.dataset.idx), answer: parseInt(btn.dataset.opt) });
    renderQuizQuestion(idx + 1);
  }));
}

async function finishQuiz() {
  const correct = currentQuiz.filter((q, i) => quizAnswers[i]?.answer === q.correct).length;
  const res = await fetch('/api/quiz/win', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, correctAnswers: correct }) });
  const data = await res.json();
  currentUser.coins = data.coins;
  updateUserDisplay();
  document.getElementById('quiz-content').innerHTML = `<h3>🎉 Правильно: ${correct}/3</h3><p>+${data.prize} 🪙</p>`;
  setTimeout(() => quizModal.style.display = 'none', 2000);
}

function playRPSBot(e) {
  const playerMove = e.target.dataset.move;
  const moves = ['rock', 'scissors', 'paper'];
  const botMove = moves[Math.floor(Math.random() * 3)];
  const result = document.getElementById('rps-bot-result');
  let win = false;
  if (playerMove === botMove) result.textContent = `Ничья! Бот выбрал ${botMove}`;
  else if ((playerMove === 'rock' && botMove === 'scissors') || (playerMove === 'scissors' && botMove === 'paper') || (playerMove === 'paper' && botMove === 'rock')) {
    result.textContent = `🎉 Победа! Бот выбрал ${botMove}`; win = true;
  } else result.textContent = `😢 Поражение. Бот выбрал ${botMove}`;
  if (win) {
    const bet = parseInt(document.getElementById('rps-bot-bet').value) || 20;
    fetch('/api/clicker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, bet }) })
      .then(r => r.json()).then(d => { currentUser.coins = d.coins; updateUserDisplay(); });
  }
  setTimeout(() => rpsBotModal.style.display = 'none', 2000);
}

function playCoinBot() {
  const bet = parseInt(document.getElementById('coin-bot-bet').value) || 20;
  const playerChoice = confirm('Орёл (OK) или Решка (Отмена)?') ? 'heads' : 'tails';
  const result = Math.random() > 0.5 ? 'heads' : 'tails';
  if (playerChoice === result) {
    alert(`🎉 Выиграли! +${bet} 🪙`);
    fetch('/api/clicker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, bet }) })
      .then(r => r.json()).then(d => { currentUser.coins = d.coins; updateUserDisplay(); });
  } else alert(`😢 Проиграли. Выпало: ${result === 'heads' ? 'Орёл' : 'Решка'}`);
}

async function loadGamesData() {
  duelFriendSelect.innerHTML = '<option value="">Выберите друга</option>' + friends.map(f => `<option value="${f.id}">${f.nickname}</option>`).join('');
}

async function createDuel() {
  const opponent = duelFriendSelect.value, game = duelGameSelect.value, bet = parseInt(duelBet.value);
  if (!opponent) return alert('Выберите друга');
  if (bet < 50 || bet > 5000) return alert('Ставка 50-5000');
  const res = await fetch('/api/duel/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creatorId: currentUser.userId, opponentId: opponent, game_type: game, bet }) });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  socket.emit('duel-invite', { duelId: data.duelId, opponentId: opponent });
  alert('Вызов отправлен!');
}

async function loadActiveDuels() { duelsList.innerHTML = '<p class="empty-text">Нет активных дуэлей</p>'; }
function handleDuelMove(duelId, move) { console.log('Duel move:', duelId, move); }

// ==================== НАСТРОЙКИ ====================
async function claimDailyBonus() {
  const res = await fetch('/api/daily-bonus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId }) });
  const data = await res.json();
  dailyBonusStatus.textContent = data.success ? `✅ +${data.bonus} 🪙` : `❌ ${data.message}`;
  if (data.success) { currentUser.coins = data.coins; updateUserDisplay(); }
}

async function saveAvatarEmoji() {
  const selected = document.querySelector('#settings-emoji-grid .emoji-option.selected');
  if (!selected) return;
  await fetch('/api/avatar-emoji', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, avatar_emoji: selected.dataset.emoji }) });
  currentUser.avatar_emoji = selected.dataset.emoji;
  menuAvatar.textContent = selected.dataset.emoji;
  avatarBase.textContent = selected.dataset.emoji;
}

async function changeTheme(theme) {
  await fetch('/api/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, theme }) });
  applyTheme(theme);
}

function applyTheme(theme) { document.body.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); }

function checkDailyBonusOnLogin() {
  const last = localStorage.getItem(`daily_${currentUser.userId}`);
  const today = new Date().toISOString().split('T')[0];
  if (last !== today) setTimeout(() => { if (confirm('🎁 Ежедневный бонус 25 🪙!')) claimDailyBonus(); }, 1000);
}

async function enableNotifications() {
  if ('Notification' in window) {
    const perm = await Notification.requestPermission();
    document.getElementById('notifications-status').textContent = perm === 'granted' ? '✅ Уведомления включены' : '❌ Отклонено';
    if (perm === 'granted') navigator.serviceWorker?.register('/sw.js');
  }
}

// ==================== ЗАПУСК ====================
init();
// ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ====================

// Обновление монет везде
function updateAllCoinsDisplays() {
  menuCoins.textContent = `🪙 ${currentUser.coins || 0}`;
  if (profileCoins) profileCoins.textContent = currentUser.coins || 0;
  if (shopCoinsAmount) shopCoinsAmount.textContent = currentUser.coins || 0;
}

// Таймеры для игр
setInterval(() => {
  if (!currentUser) return;
  
  // Таймер колеса
  const today = new Date().toISOString().split('T')[0];
  const lastWheel = localStorage.getItem(`wheel_${currentUser.userId}`);
  if (lastWheel !== today && wheelTimer) {
    const next = new Date(); next.setDate(next.getDate() + 1); next.setHours(0,0,0,0);
    const diff = next - new Date();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    wheelTimer.textContent = `Доступно через ${hours}ч ${mins}м`;
  } else if (wheelTimer) {
    wheelTimer.textContent = 'Доступно!';
  }
}, 60000);

// Уведомления
function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

// Обработка дуэлей (продолжение)
async function acceptDuel(duelId) {
  try {
    const res = await fetch('/api/duel/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duelId, userId: currentUser.userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    duelModal.style.display = 'flex';
    startDuelGame(duelId, data.game_type, data.bet);
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

function startDuelGame(duelId, gameType, bet) {
  const area = document.getElementById('duel-game-area');
  
  if (gameType === 'rps') {
    area.innerHTML = `
      <h3>КНБ (ставка ${bet} 🪙)</h3>
      <div class="rps-buttons">
        <button class="rps-btn" data-move="rock">🪨</button>
        <button class="rps-btn" data-move="scissors">✂️</button>
        <button class="rps-btn" data-move="paper">📄</button>
      </div>
      <p id="duel-status">Выберите ход...</p>
    `;
    document.querySelectorAll('.rps-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const move = btn.dataset.move;
        socket.emit('duel-move', { duelId, opponentId: selectedFriend?.id, move });
        btn.disabled = true;
        document.getElementById('duel-status').textContent = 'Ожидание соперника...';
      });
    });
  } else if (gameType === 'coin') {
    area.innerHTML = `
      <h3>Монетка (ставка ${bet} 🪙)</h3>
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
        document.getElementById('duel-status').textContent = 'Ожидание результата...';
        
        setTimeout(() => {
          const result = Math.random() > 0.5 ? 'heads' : 'tails';
          const won = move === result;
          completeDuel(duelId, won);
        }, 2000);
      });
    });
  } else if (gameType === 'reaction') {
    area.innerHTML = `
      <h3>Реакция (ставка ${bet} 🪙)</h3>
      <p>Нажмите на кнопку, как только она станет зелёной!</p>
      <button id="reaction-btn" class="btn-primary" style="background: red; width: 100%; padding: 40px;">Ждите...</button>
      <p id="duel-status"></p>
    `;
    
    const btn = document.getElementById('reaction-btn');
    let canClick = false;
    let startTime;
    
    setTimeout(() => {
      btn.style.background = '#00d68f';
      btn.textContent = 'ЖМИ!';
      canClick = true;
      startTime = Date.now();
      
      setTimeout(() => {
        if (canClick) {
          canClick = false;
          completeDuel(duelId, false);
        }
      }, 5000);
    }, 2000 + Math.random() * 3000);
    
    btn.addEventListener('click', () => {
      if (!canClick) {
        if (btn.textContent === 'Ждите...') {
          document.getElementById('duel-status').textContent = 'Рано! Вы проиграли.';
          completeDuel(duelId, false);
        }
        return;
      }
      const reactionTime = Date.now() - startTime;
      document.getElementById('duel-status').textContent = `Ваше время: ${reactionTime}мс`;
      socket.emit('duel-move', { duelId, opponentId: selectedFriend?.id, move: reactionTime });
      btn.disabled = true;
    });
  }
}

async function completeDuel(duelId, won) {
  const status = document.getElementById('duel-status');
  if (status) {
    status.textContent = won ? '🎉 Вы выиграли!' : '😢 Вы проиграли...';
  }
  
  if (won) {
    try {
      const res = await fetch('/api/duel/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duelId, winnerId: currentUser.userId })
      });
      const data = await res.json();
      currentUser.coins += data.prize;
      updateUserDisplay();
    } catch (err) {
      console.error('Failed to complete duel:', err);
    }
  }
  
  setTimeout(() => {
    duelModal.style.display = 'none';
  }, 3000);
}

// Управление размером аксессуара (добавить в профиль)
function addScaleControls(el) {
  const controls = document.createElement('div');
  controls.className = 'accessory-controls';
  controls.innerHTML = `
    <button class="accessory-scale-btn" data-action="minus">−</button>
    <span class="accessory-scale-value">${el.dataset.scale || 1.0}x</span>
    <button class="accessory-scale-btn" data-action="plus">+</button>
  `;
  
  el.appendChild(controls);
  controls.style.display = 'none';
  
  el.addEventListener('click', () => {
    document.querySelectorAll('.accessory-controls').forEach(c => c.style.display = 'none');
    controls.style.display = 'flex';
  });
  
  controls.querySelector('[data-action="minus"]').addEventListener('click', async (e) => {
    e.stopPropagation();
    let scale = parseFloat(el.dataset.scale) || 1.0;
    scale = Math.max(0.5, scale - 0.1);
    el.dataset.scale = scale;
    el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    controls.querySelector('.accessory-scale-value').textContent = scale.toFixed(1) + 'x';
    
    await fetch('/api/accessory-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, accessory_id: el.dataset.id, x: parseInt(el.style.left), y: parseInt(el.style.top), scale })
    });
  });
  
  controls.querySelector('[data-action="plus"]').addEventListener('click', async (e) => {
    e.stopPropagation();
    let scale = parseFloat(el.dataset.scale) || 1.0;
    scale = Math.min(2.0, scale + 0.1);
    el.dataset.scale = scale;
    el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    controls.querySelector('.accessory-scale-value').textContent = scale.toFixed(1) + 'x';
    
    await fetch('/api/accessory-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, accessory_id: el.dataset.id, x: parseInt(el.style.left), y: parseInt(el.style.top), scale })
    });
  });
}

// Переопределяем renderAccessories с контролами размера
const originalRenderAccessories = renderAccessories;
renderAccessories = function() {
  accessoriesLayer.innerHTML = '';
  equippedList.innerHTML = '';
  equippedAccessories.forEach(acc => {
    const accData = shopAccessories.find(a => a.id === acc.accessory_id);
    if (!accData) return;
    const el = document.createElement('div');
    el.className = 'accessory-item';
    el.textContent = accData.icon;
    el.dataset.id = acc.accessory_id;
    el.dataset.scale = acc.scale || 1.0;
    el.style.left = (acc.x || 80) + 'px';
    el.style.top = (acc.y || 80) + 'px';
    el.style.transform = `translate(-50%, -50%) scale(${el.dataset.scale})`;
    makeDraggable(el);
    addScaleControls(el);
    accessoriesLayer.appendChild(el);
    equippedList.innerHTML += `<span class="equipped-badge">${accData.icon} ${accData.name}</span>`;
  });
};

// Стили для кнопок размера (добавляем динамически)
const scaleStyles = document.createElement('style');
scaleStyles.textContent = `
  .accessory-item { position: absolute; cursor: grab; user-select: none; text-shadow: 0 2px 10px rgba(0,0,0,0.5); transform: translate(-50%, -50%); }
  .accessory-controls { position: absolute; bottom: -35px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; background: var(--glass-bg); padding: 4px 8px; border-radius: 20px; backdrop-filter: blur(10px); border: 1px solid var(--glass-border); z-index: 100; }
  .accessory-scale-btn { width: 24px; height: 24px; border-radius: 50%; background: var(--accent-primary); border: none; color: white; font-weight: bold; cursor: pointer; font-size: 16px; }
  .accessory-scale-value { color: var(--text-primary); font-size: 12px; font-weight: 600; min-width: 35px; text-align: center; }
  .quiz-option { display: block; width: 100%; padding: 12px; margin: 8px 0; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 12px; color: var(--text-primary); cursor: pointer; }
  .quiz-option:hover { background: var(--accent-primary); }
  .coin-buttons { display: flex; gap: 12px; justify-content: center; margin: 20px 0; }
  .coin-btn { padding: 16px 24px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 16px; color: var(--text-primary); font-size: 1.1rem; cursor: pointer; }
  .duel-create { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin: 20px 0; }
  #clicker-count { font-weight: 700; margin-top: 8px; }
  .game-card .bet-input { margin: 12px 0; }
  .game-card .bet-input input { width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 12px; color: var(--text-primary); }
`;
document.head.appendChild(scaleStyles);

// Скрываем контролы при клике вне
document.addEventListener('click', (e) => {
  if (!e.target.closest('.accessory-item')) {
    document.querySelectorAll('.accessory-controls').forEach(c => c.style.display = 'none');
  }
});

// Экспорт для глобального доступа
window.acceptDuel = acceptDuel;
window.declineDuel = async (duelId) => {
  await fetch('/api/duel/decline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duelId }) });
  loadActiveDuels();
};

console.log('✅ ZOMO CHAT v2.0 загружен!');
