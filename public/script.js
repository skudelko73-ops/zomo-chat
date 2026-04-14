// ==================== DOM ЭЛЕМЕНТЫ ====================
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');

const tabs = document.querySelectorAll('.tab-content');
const menuItems = document.querySelectorAll('.menu-item');
const chatsBadge = document.getElementById('chats-badge');

const friendsListEl = document.getElementById('friends-list');
const chatView = document.getElementById('chat-view');
const chatWithNameEl = document.getElementById('chat-with-name');
const chatWithStatusEl = document.getElementById('chat-with-status');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const backToFriendsBtn = document.getElementById('back-to-friends');

const friendIdInput = document.getElementById('friend-id-input');
const addFriendBtn = document.getElementById('add-friend-btn');

const profileNickname = document.getElementById('profile-nickname');
const profileId = document.getElementById('profile-id');
const profileAvatar = document.getElementById('profile-avatar');

const themeSelect = document.getElementById('theme-select');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
const logoutBtn = document.getElementById('logout-btn');

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentUser = null;
let socket = null;
let selectedFriend = null;
let friends = [];

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function init() {
  setupEventListeners();
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  if (themeSelect) themeSelect.value = savedTheme;
  
  // Запрашиваем разрешение на уведомления при загрузке
  requestNotificationPermission();
}

function setupEventListeners() {
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    authMessage.textContent = '';
  });
  
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
    authMessage.textContent = '';
  });
  
  registerForm.addEventListener('submit', handleRegister);
  loginForm.addEventListener('submit', handleLogin);
  
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      tabs.forEach(t => t.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');
      
      if (tab === 'profile') updateProfileDisplay();
    });
  });
  
  addFriendBtn.addEventListener('click', addFriend);
  friendIdInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addFriend(); });
  
  backToFriendsBtn.addEventListener('click', () => {
    chatView.classList.remove('active');
    selectedFriend = null;
  });
  
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
  
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => changeTheme(e.target.value));
  }
  enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
  logoutBtn.addEventListener('click', logout);
}

async function requestNotificationPermission() {
  if ('Notification' in window) {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      navigator.serviceWorker?.register('/sw.js');
      enableNotificationsBtn.textContent = '🔔 Включены';
    }
  }
}

function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.png' });
  }
}

// ==================== АВТОРИЗАЦИЯ ====================
async function handleRegister(e) {
  e.preventDefault();
  const nickname = document.getElementById('reg-nickname').value.trim();
  const password = document.getElementById('reg-password').value;
  
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    authMessage.style.color = 'var(--success)';
    authMessage.textContent = `Аккаунт создан! ID: ${data.userId}`;
    setTimeout(() => {
      showLogin.click();
      document.getElementById('login-nickname').value = nickname;
    }, 2000);
  } catch (err) {
    authMessage.style.color = 'var(--danger)';
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
    if (!res.ok) throw new Error(data.error);
    
    currentUser = data;
    authContainer.style.display = 'none';
    mainContainer.style.display = 'flex';
    
    updateProfileDisplay();
    initSocket();
    loadFriends();
  } catch (err) {
    authMessage.style.color = 'var(--danger)';
    authMessage.textContent = err.message;
  }
}

function updateProfileDisplay() {
  if (profileNickname) profileNickname.textContent = currentUser?.nickname || '';
  if (profileId) profileId.textContent = currentUser?.userId || '';
  if (profileAvatar) profileAvatar.textContent = (currentUser?.nickname || 'U')[0].toUpperCase();
}

function logout() {
  if (socket) socket.disconnect();
  currentUser = null;
  authContainer.style.display = 'block';
  mainContainer.style.display = 'none';
  loginForm.reset();
  registerForm.reset();
}

// ==================== SOCKET ====================
function initSocket() {
  socket = io();
  
  socket.on('connect', () => {
    socket.emit('login', currentUser.userId);
  });
  
  socket.on('user-status', ({ userId, online }) => {
    if (selectedFriend?.id === userId) {
      chatWithStatusEl.textContent = online ? '● В сети' : '○ Не в сети';
    }
  });
  
  socket.on('new-message', (message) => {
    if (selectedFriend && (message.senderId === selectedFriend.id || message.receiverId === selectedFriend.id)) {
      appendMessage(message);
    }
    loadFriends();
    
    // Пуш-уведомление
    if (message.senderId !== currentUser.userId) {
      showNotification('Новое сообщение', message.content);
    }
  });
}

// ==================== ДРУЗЬЯ ====================
async function loadFriends() {
  try {
    const res = await fetch(`/api/friends/${currentUser.userId}`);
    const data = await res.json();
    friends = Array.isArray(data) ? data : [];
    renderFriendsList();
  } catch (err) {
    friends = [];
    renderFriendsList();
  }
}

function renderFriendsList() {
  if (!friends.length) {
    friendsListEl.innerHTML = '<p class="empty-chat" style="padding:20px">Друзей пока нет</p>';
    return;
  }
  
  friendsListEl.innerHTML = friends.map(f => `
    <div class="friend-item" data-id="${f.id}">
      <div class="friend-avatar">${f.nickname[0].toUpperCase()}</div>
      <div class="friend-info">
        <div class="friend-name">${f.nickname}</div>
        <div class="friend-last-message">${f.lastMessage || 'Начните общение'}</div>
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
  chatView.classList.add('active');
  
  const res = await fetch(`/api/messages/${currentUser.userId}/${friendId}`);
  const messages = await res.json();
  renderMessages(messages);
}

function renderMessages(messages) {
  if (!messages.length) {
    messagesContainer.innerHTML = '<div class="empty-chat">💬 Нет сообщений</div>';
    return;
  }
  
  messagesContainer.innerHTML = messages.map(m => `
    <div class="message ${m.senderId === currentUser.userId ? 'sent' : 'received'}">
      <div>${escapeHtml(m.content)}</div>
      <div class="message-time">${new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `).join('');
  
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendMessage(msg) {
  const empty = messagesContainer.querySelector('.empty-chat');
  if (empty) empty.remove();
  
  messagesContainer.insertAdjacentHTML('beforeend', `
    <div class="message ${msg.senderId === currentUser.userId ? 'sent' : 'received'}">
      <div>${escapeHtml(msg.content)}</div>
      <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `);
  
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
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
  if (friendId === currentUser.userId) return alert('Нельзя добавить самого себя');
  
  try {
    const res = await fetch('/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, friendId })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error);
    
    friendIdInput.value = '';
    await loadFriends();
    alert('✅ Друг добавлен!');
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

// ==================== ТЕМА ====================
function changeTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== ЗАПУСК ====================
init();
