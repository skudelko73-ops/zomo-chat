const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');

let currentUser = null;
let socket = null;
let selectedFriend = null;
let friends = [];

showRegister.addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'none'; registerForm.style.display = 'block'; });
showLogin.addEventListener('click', (e) => { e.preventDefault(); registerForm.style.display = 'none'; loginForm.style.display = 'block'; });

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = document.getElementById('reg-nickname').value;
  const password = document.getElementById('reg-password').value;
  
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password })
  });
  const data = await res.json();
  if (res.ok) {
    authMessage.textContent = `Аккаунт создан! ID: ${data.userId}`;
    showLogin.click();
  } else {
    authMessage.textContent = data.error;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = document.getElementById('login-nickname').value;
  const password = document.getElementById('login-password').value;
  
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password })
  });
  const data = await res.json();
  if (res.ok) {
    currentUser = data;
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    document.getElementById('current-nickname').textContent = currentUser.nickname;
    document.getElementById('current-id').textContent = `ID: ${currentUser.userId}`;
    initSocket();
    loadFriends();
  } else {
    authMessage.textContent = data.error;
  }
});

function initSocket() {
  socket = io();
  socket.on('connect', () => socket.emit('login', currentUser.userId));
  socket.on('user-status', ({ userId, online }) => {
    if (selectedFriend?.id === userId) {
      document.getElementById('chat-with-status').textContent = online ? '● В сети' : '○ Не в сети';
    }
  });
  socket.on('new-message', (msg) => {
    if (selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id)) {
      appendMessage(msg);
    }
    loadFriends();
  });
}

async function loadFriends() {
  const res = await fetch(`/api/friends/${currentUser.userId}`);
  friends = await res.json();
  renderFriendsList();
}

function renderFriendsList() {
  const container = document.getElementById('friends-list');
  if (!friends.length) {
    container.innerHTML = '<p>Друзей пока нет</p>';
    return;
  }
  container.innerHTML = friends.map(f => `
    <div class="friend-item ${selectedFriend?.id === f.id ? 'active' : ''}" data-id="${f.id}">
      <div><strong>${f.nickname}</strong></div>
      <div style="font-size:12px;opacity:0.7">${f.lastMessage || ''}</div>
    </div>
  `).join('');
  document.querySelectorAll('.friend-item').forEach(el => el.addEventListener('click', () => selectFriend(el.dataset.id)));
}

async function selectFriend(friendId) {
  selectedFriend = friends.find(f => f.id === friendId);
  if (!selectedFriend) return;
  document.getElementById('chat-with-name').textContent = selectedFriend.nickname;
  document.getElementById('message-input').disabled = false;
  document.getElementById('send-btn').disabled = false;
  
  const res = await fetch(`/api/messages/${currentUser.userId}/${friendId}`);
  const messages = await res.json();
  renderMessages(messages);
  renderFriendsList();
}

function renderMessages(messages) {
  const container = document.getElementById('messages-container');
  if (!messages.length) {
    container.innerHTML = '<div class="empty-chat">Нет сообщений</div>';
    return;
  }
  container.innerHTML = messages.map(m => `
    <div class="message ${m.senderId === currentUser.userId ? 'sent' : 'received'}">
      ${escapeHtml(m.content)}
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

function appendMessage(msg) {
  const container = document.getElementById('messages-container');
  const empty = container.querySelector('.empty-chat');
  if (empty) empty.remove();
  container.insertAdjacentHTML('beforeend', `
    <div class="message ${msg.senderId === currentUser.userId ? 'sent' : 'received'}">
      ${escapeHtml(msg.content)}
    </div>
  `);
  container.scrollTop = container.scrollHeight;
}

document.getElementById('message-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const content = document.getElementById('message-input').value.trim();
  if (!content || !selectedFriend) return;
  socket.emit('send-message', { senderId: currentUser.userId, receiverId: selectedFriend.id, content });
  document.getElementById('message-input').value = '';
});

document.getElementById('add-friend-btn').addEventListener('click', async () => {
  const friendId = document.getElementById('friend-id-input').value.trim().toUpperCase();
  if (!friendId) return alert('Введите ID');
  const res = await fetch('/api/friends/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser.userId, friendId })
  });
  const data = await res.json();
  if (res.ok) {
    document.getElementById('friend-id-input').value = '';
    loadFriends();
    alert('✅ Друг добавлен!');
  } else {
    alert('❌ ' + data.error);
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  socket.disconnect();
  location.reload();
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
