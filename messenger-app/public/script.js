// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');

const currentNicknameEl = document.getElementById('current-nickname');
const currentIdEl = document.getElementById('current-id');
const userAvatarEl = document.getElementById('user-avatar');
const logoutBtn = document.getElementById('logout-btn');
const friendsListEl = document.getElementById('friends-list');
const addFriendBtn = document.getElementById('add-friend-btn');
const friendIdInput = document.getElementById('friend-id-input');
const chatWithNameEl = document.getElementById('chat-with-name');
const chatWithStatusEl = document.getElementById('chat-with-status');
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.querySelector('.send-btn');

// State
let currentUser = null;
let socket = null;
let selectedFriend = null;
let friends = [];

// Initialize Socket
function initSocket() {
  socket = io();
  socket.on('connect', () => {
    console.log('Socket connected');
    if (currentUser) {
      socket.emit('login', currentUser.userId);
    }
  });

  socket.on('user-status', ({ userId, online }) => {
    if (selectedFriend && selectedFriend.id === userId) {
      updateChatHeaderStatus(online);
    }
  });

  socket.on('new-message', (message) => {
    if (selectedFriend && (message.senderId === selectedFriend.id || message.receiverId === selectedFriend.id)) {
      appendMessage(message);
    }
    loadFriends();
  });
}

// Auth Toggle
if (showRegisterLink) {
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    authMessage.textContent = '';
  });
}

if (showLoginLink) {
  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    authMessage.textContent = '';
  });
}

// Register
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
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
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
      
      authMessage.style.color = 'var(--success)';
      authMessage.textContent = `Аккаунт создан! Ваш ID: ${data.userId}`;
      setTimeout(() => {
        showLoginLink.click();
        document.getElementById('login-nickname').value = nickname;
      }, 2500);
    } catch (err) {
      authMessage.style.color = 'var(--danger)';
      authMessage.textContent = err.message;
    }
  });
}

// Login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
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
      chatContainer.style.display = 'flex';
      
      currentNicknameEl.textContent = currentUser.nickname || 'Ошибка';
      currentIdEl.textContent = `ID: ${currentUser.userId || 'НЕ ПОЛУЧЕН'}`;
      userAvatarEl.textContent = (currentUser.nickname || 'Z').charAt(0).toUpperCase();
      
      initSocket();
      loadFriends();
    } catch (err) {
      authMessage.style.color = 'var(--danger)';
      authMessage.textContent = err.message;
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (socket) socket.disconnect();
    currentUser = null;
    selectedFriend = null;
    authContainer.style.display = 'block';
    chatContainer.style.display = 'none';
    loginForm.reset();
    registerForm.reset();
  });
}

// Load Friends
async function loadFriends() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/friends/${currentUser.userId}`);
    const data = await res.json();
    friends = data;
    renderFriendsList();
  } catch (err) {
    console.error('Failed to load friends', err);
  }
}

function renderFriendsList() {
  if (friends.length === 0) {
    friendsListEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Друзей пока нет.<br>Добавьте по ID выше.</p>';
    return;
  }
  friendsListEl.innerHTML = friends.map(friend => `
    <div class="friend-item ${selectedFriend && selectedFriend.id === friend.id ? 'active' : ''}" data-id="${friend.id}">
      <div class="friend-avatar">${friend.nickname.charAt(0).toUpperCase()}</div>
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
  const friend = friends.find(f => f.id === friendId);
  if (!friend) return;
  selectedFriend = friend;
  chatWithNameEl.textContent = friend.nickname;
  updateChatHeaderStatus(false);
  messageInput.disabled = false;
  sendBtn.disabled = false;
  messageInput.focus();

  try {
    const res = await fetch(`/api/messages/${currentUser.userId}/${friendId}`);
    const messages = await res.json();
    renderMessages(messages);
  } catch (err) {
    console.error('Failed to load messages', err);
  }

  renderFriendsList();
}

function updateChatHeaderStatus(online) {
  chatWithStatusEl.textContent = online ? '● В сети' : '○ Не в сети';
  chatWithStatusEl.style.color = online ? 'var(--success)' : 'var(--text-muted)';
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
  messagesContainer.innerHTML = messages.map(msg => createMessageElement(msg)).join('');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createMessageElement(msg) {
  const isSent = msg.senderId === currentUser.userId;
  const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `
    <div class="message ${isSent ? 'sent' : 'received'}">
      <div class="message-content">${escapeHtml(msg.content)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;
}

function appendMessage(msg) {
  // Проверка на дубликат
  const existingMessages = messagesContainer.querySelectorAll('.message');
  for (let el of existingMessages) {
    const contentEl = el.querySelector('.message-content');
    if (contentEl && contentEl.textContent === msg.content) {
      const timeEl = el.querySelector('.message-time');
      if (timeEl) {
        const msgTime = new Date(msg.timestamp).getTime();
        const existingTime = timeEl.textContent;
        // Если сообщение с таким же текстом уже есть, не добавляем
        return;
      }
    }
  }
  
  const existingEmpty = messagesContainer.querySelector('.empty-chat-message');
  if (existingEmpty) existingEmpty.remove();
  
  messagesContainer.insertAdjacentHTML('beforeend', createMessageElement(msg));
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add Friend
if (addFriendBtn) {
  addFriendBtn.addEventListener('click', async () => {
    const friendId = friendIdInput.value.trim().toUpperCase();
    
    if (!friendId) {
      alert('Введите ID друга');
      return;
    }
    if (friendId === currentUser.userId) {
      alert('Нельзя добавить самого себя');
      return;
    }
    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId, friendId })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось добавить друга');
      }
      
      friendIdInput.value = '';
      await loadFriends();
      alert('✅ Друг добавлен!');
    } catch (err) {
      alert('❌ ' + err.message);
    }
  });
}

// Enter в поле ввода ID
if (friendIdInput) {
  friendIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFriendBtn.click();
    }
  });
}

// Send Message
if (messageForm) {
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (!content || !selectedFriend) return;

    const message = {
      senderId: currentUser.userId,
      receiverId: selectedFriend.id,
      content,
      timestamp: new Date().toISOString()
    };
    
    socket.emit('send-message', message);
    messageInput.value = '';
  });
}