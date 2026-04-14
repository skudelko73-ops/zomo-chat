// ==================== DOM ЭЛЕМЕНТЫ ====================
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');

const tabs = document.querySelectorAll('.tab-content');
const menuItems = document.querySelectorAll('.menu-item');
const chatsBadge = document.getElementById('chats-badge');

const friendsListEl = document.getElementById('friends-list');
const chatView = document.getElementById('chat-view');
const chatWithNameEl = document.getElementById('chat-with-name');
const chatWithStatusEl = document.getElementById('chat-with-status');
const chatAvatar = document.getElementById('chat-avatar');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const backToFriendsBtn = document.getElementById('back-to-friends');
const callBtn = document.getElementById('call-btn');

const friendIdInput = document.getElementById('friend-id-input');
const addFriendBtn = document.getElementById('add-friend-btn');
const attachImageBtn = document.getElementById('attach-image-btn');
const voiceRecordBtn = document.getElementById('voice-record-btn');
const imageInput = document.getElementById('image-input');

const profileAvatar = document.getElementById('profile-avatar');
const profileNickname = document.getElementById('profile-nickname');
const profileId = document.getElementById('profile-id');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const avatarInput = document.getElementById('avatar-input');
const saveNicknameBtn = document.getElementById('save-nickname-btn');

const themeSelect = document.getElementById('theme-select');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
const logoutBtn = document.getElementById('logout-btn');

const callsList = document.getElementById('calls-list');

const callModal = document.getElementById('call-modal');
const callerNameEl = document.getElementById('caller-name');
const acceptCallBtn = document.getElementById('accept-call-btn');
const rejectCallBtn = document.getElementById('reject-call-btn');

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentUser = null;
let socket = null;
let selectedFriend = null;
let friends = [];
let mediaRecorder = null;
let audioChunks = [];

// WebRTC
let localStream = null;
let peerConnection = null;
let pendingOffer = null;

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function init() {
  setupEventListeners();
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  themeSelect.value = savedTheme;
}

function setupEventListeners() {
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
  
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      tabs.forEach(t => t.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');
      if (tab === 'calls') loadCallsHistory();
    });
  });
  
  addFriendBtn.addEventListener('click', addFriend);
  friendIdInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addFriend(); });
  
  backToFriendsBtn.addEventListener('click', () => {
    chatView.classList.remove('active');
    selectedFriend = null;
  });
  
  attachImageBtn.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', uploadImage);
  voiceRecordBtn.addEventListener('click', toggleVoiceRecord);
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
  
  callBtn.addEventListener('click', startCall);
  acceptCallBtn.addEventListener('click', acceptCall);
  rejectCallBtn.addEventListener('click', rejectCall);
  
  changeAvatarBtn.addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', uploadAvatar);
  saveNicknameBtn.addEventListener('click', saveNickname);
  
  themeSelect.addEventListener('change', (e) => changeTheme(e.target.value));
  enableNotificationsBtn.addEventListener('click', enableNotifications);
  logoutBtn.addEventListener('click', logout);
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
      showLoginLink.click();
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
    loadUnreadCount();
    applyTheme(currentUser.theme || 'dark');
  } catch (err) {
    authMessage.style.color = 'var(--danger)';
    authMessage.textContent = err.message;
  }
}

function updateProfileDisplay() {
  profileNickname.value = currentUser.nickname || '';
  profileId.textContent = currentUser.userId;
  if (currentUser.avatar_photo) {
    profileAvatar.src = currentUser.avatar_photo;
  }
}

function logout() {
  if (socket) socket.disconnect();
  if (localStream) localStream.getTracks().forEach(t => t.stop());
  if (peerConnection) peerConnection.close();
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
  
  socket.on('user-online', (userId) => {
    if (selectedFriend?.id === userId) {
      chatWithStatusEl.textContent = '● В сети';
      chatWithStatusEl.style.color = 'var(--success)';
    }
    updateFriendOnlineStatus(userId, true);
  });
  
  socket.on('user-offline', (userId) => {
    if (selectedFriend?.id === userId) {
      chatWithStatusEl.textContent = '○ Не в сети';
      chatWithStatusEl.style.color = 'var(--text-muted)';
    }
    updateFriendOnlineStatus(userId, false);
  });
  
  socket.on('new-message', (message) => {
    if (selectedFriend && (message.senderId === selectedFriend.id || message.receiverId === selectedFriend.id)) {
      appendMessage(message);
    }
    loadFriends();
    loadUnreadCount();
    
    if (message.senderId !== currentUser.userId) {
      showNotification('Новое сообщение', message.content?.substring(0, 50) || '📷 Фото');
    }
  });
  
  socket.on('incoming-call', async ({ from, offer }) => {
    pendingOffer = { from, offer };
    const friend = friends.find(f => f.id === from);
    callerNameEl.textContent = friend?.nickname || 'Неизвестный';
    callModal.style.display = 'flex';
  });
  
  socket.on('call-accepted', async ({ answer }) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
    callModal.style.display = 'none';
  });
  
  socket.on('ice-candidate', async ({ candidate }) => {
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  });
  
  socket.on('call-rejected', () => {
    callModal.style.display = 'none';
    cleanupCall();
    alert('Звонок отклонён');
  });
  
  socket.on('call-ended', () => {
    cleanupCall();
    alert('Звонок завершён');
  });
  
  socket.on('user-offline-call', (targetId) => {
    alert('Пользователь не в сети. Звонок невозможен.');
  });
}

function updateFriendOnlineStatus(userId, online) {
  const friendItems = document.querySelectorAll('.friend-item');
  friendItems.forEach(item => {
    if (item.dataset.id === userId) {
      const statusEl = item.querySelector('.friend-status');
      if (statusEl) {
        statusEl.textContent = online ? '●' : '○';
        statusEl.style.color = online ? 'var(--success)' : 'var(--text-muted)';
      }
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
    console.error('Load friends error:', err);
    friends = [];
    renderFriendsList();
  }
}

function renderFriendsList() {
  if (!friends.length) {
    friendsListEl.innerHTML = '<p class="empty-chat" style="padding: 20px;">Друзей пока нет</p>';
    return;
  }
  
  friendsListEl.innerHTML = friends.map(f => `
    <div class="friend-item" data-id="${f.id}">
      <img class="friend-avatar" src="${f.avatar_photo || ''}" alt="${f.nickname}">
      <div class="friend-info">
        <div class="friend-name">${f.nickname}</div>
        <div class="friend-last-message">${f.lastmessage || 'Начните общение'}</div>
      </div>
      ${f.unread > 0 ? `<span class="unread-badge">${f.unread}</span>` : ''}
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
  chatAvatar.src = selectedFriend.avatar_photo || '';
  chatWithStatusEl.textContent = 'Загрузка...';
  
  messageInput.disabled = false;
  sendBtn.disabled = false;
  callBtn.style.display = 'block';
  
  chatView.classList.add('active');
  
  const res = await fetch(`/api/messages/${currentUser.userId}/${friendId}`);
  const messages = await res.json();
  renderMessages(messages);
  
  loadFriends();
}

function renderMessages(messages) {
  if (!messages.length) {
    messagesContainer.innerHTML = '<div class="empty-chat">💬 Нет сообщений</div>';
    return;
  }
  
  messagesContainer.innerHTML = messages.map(m => {
    const isSent = m.senderId === currentUser.userId;
    const time = new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    if (m.type === 'image') {
      return `<div class="message ${isSent ? 'sent' : 'received'}">
        <img src="${m.file_url}" class="message-image" onclick="window.open('${m.file_url}')">
        <div class="message-time">${time}</div>
      </div>`;
    } else if (m.type === 'voice') {
      return `<div class="message ${isSent ? 'sent' : 'received'}">
        <div class="message-voice"><button onclick="playAudio('${m.file_url}')">▶️</button> ${m.content}</div>
        <div class="message-time">${time}</div>
      </div>`;
    } else {
      return `<div class="message ${isSent ? 'sent' : 'received'}">
        <div>${escapeHtml(m.content)}</div>
        <div class="message-time">${time}</div>
      </div>`;
    }
  }).join('');
  
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendMessage(msg) {
  const empty = messagesContainer.querySelector('.empty-chat');
  if (empty) empty.remove();
  
  const isSent = msg.senderId === currentUser.userId;
  const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  
  let html = '';
  if (msg.type === 'image') {
    html = `<div class="message ${isSent ? 'sent' : 'received'}">
      <img src="${msg.file_url}" class="message-image" onclick="window.open('${msg.file_url}')">
      <div class="message-time">${time}</div>
    </div>`;
  } else if (msg.type === 'voice') {
    html = `<div class="message ${isSent ? 'sent' : 'received'}">
      <div class="message-voice"><button onclick="playAudio('${msg.file_url}')">▶️</button> ${msg.content}</div>
      <div class="message-time">${time}</div>
    </div>`;
  } else {
    html = `<div class="message ${isSent ? 'sent' : 'received'}">
      <div>${escapeHtml(msg.content)}</div>
      <div class="message-time">${time}</div>
    </div>`;
  }
  
  messagesContainer.insertAdjacentHTML('beforeend', html);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || !selectedFriend) return;
  
  socket.emit('send-message', {
    senderId: currentUser.userId,
    receiverId: selectedFriend.id,
    content,
    type: 'text'
  });
  
  messageInput.value = '';
}

async function uploadImage() {
  const file = imageInput.files[0];
  if (!file || !selectedFriend) return;
  
  const formData = new FormData();
  formData.append('image', file);
  formData.append('senderId', currentUser.userId);
  formData.append('receiverId', selectedFriend.id);
  
  const res = await fetch('/api/upload-chat-image', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.success) {
    socket.emit('send-message', {
      senderId: currentUser.userId,
      receiverId: selectedFriend.id,
      content: '📷 Фото',
      type: 'image',
      fileUrl: data.fileUrl
    });
  }
  imageInput.value = '';
}

async function toggleVoiceRecord() {
  if (!mediaRecorder) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('senderId', currentUser.userId);
      formData.append('receiverId', selectedFriend.id);
      formData.append('duration', Math.round(audioChunks.length * 0.1));
      
      const res = await fetch('/api/upload-voice', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        socket.emit('send-message', {
          senderId: currentUser.userId,
          receiverId: selectedFriend.id,
          content: `🎤 Голосовое`,
          type: 'voice',
          fileUrl: data.fileUrl
        });
      }
    };
    
    mediaRecorder.start();
    voiceRecordBtn.textContent = '⏹️';
  } else {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
    mediaRecorder = null;
    voiceRecordBtn.textContent = '🎤';
  }
}

async function addFriend() {
  const friendId = friendIdInput.value.trim().toUpperCase();
  if (!friendId) return alert('Введите ID');
  if (friendId === currentUser.userId) return alert('Нельзя добавить себя');
  
  try {
    const res = await fetch('/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, friendId })
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Ошибка');
    
    friendIdInput.value = '';
    await loadFriends();
    alert('✅ Друг добавлен!');
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

// ==================== ЗВОНКИ ====================
async function startCall() {
  if (!selectedFriend) return;
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(rtcConfig);
    
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    
    peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { targetId: selectedFriend.id, candidate: e.candidate });
      }
    };
    
    peerConnection.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.play();
    };
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    socket.emit('call-user', { targetId: selectedFriend.id, offer });
    alert('📞 Вызов...');
    
    await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callerId: currentUser.userId, receiverId: selectedFriend.id, status: 'outgoing' })
    });
  } catch (err) {
    alert('Ошибка доступа к микрофону');
  }
}

async function acceptCall() {
  if (!pendingOffer) return;
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(rtcConfig);
    
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    
    peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { targetId: pendingOffer.from, candidate: e.candidate });
      }
    };
    
    peerConnection.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.play();
    };
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(pendingOffer.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('call-accept', { targetId: pendingOffer.from, answer });
    callModal.style.display = 'none';
    
    await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callerId: pendingOffer.from, receiverId: currentUser.userId, status: 'accepted' })
    });
  } catch (err) {
    console.error('Accept call error:', err);
  }
}

function rejectCall() {
  if (pendingOffer) {
    socket.emit('call-reject', { targetId: pendingOffer.from });
  }
  callModal.style.display = 'none';
  pendingOffer = null;
}

function cleanupCall() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
}

// ==================== ПРОФИЛЬ ====================
async function uploadAvatar() {
  const file = avatarInput.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('avatar', file);
  formData.append('userId', currentUser.userId);
  
  const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.success) {
    currentUser.avatar_photo = data.avatar_photo;
    profileAvatar.src = data.avatar_photo;
  }
  avatarInput.value = '';
}

async function saveNickname() {
  const newNickname = profileNickname.value.trim();
  if (!newNickname || newNickname === currentUser.nickname) return;
  
  try {
    const res = await fetch('/api/user/nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, nickname: newNickname })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    currentUser.nickname = newNickname;
    alert('✅ Никнейм изменён!');
  } catch (err) {
    alert('❌ ' + err.message);
  }
}

// ==================== НАСТРОЙКИ ====================
function changeTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  fetch('/api/theme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser.userId, theme })
  });
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  themeSelect.value = theme;
}

async function enableNotifications() {
  if ('Notification' in window) {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      navigator.serviceWorker?.register('/sw.js');
      alert('✅ Уведомления включены!');
    }
  }
}

function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

// ==================== ИСТОРИЯ ЗВОНКОВ ====================
async function loadCallsHistory() {
  try {
    const res = await fetch(`/api/calls/${currentUser.userId}`);
    const calls = await res.json();
    
    if (!calls.length) {
      callsList.innerHTML = '<p class="empty-chat">Нет истории звонков</p>';
      return;
    }
    
    callsList.innerHTML = calls.map(c => {
      const isIncoming = c.receiverId === currentUser.userId;
      const otherName = isIncoming ? c.caller_name : c.receiver_name;
      const icon = isIncoming ? '📞 Входящий' : '📤 Исходящий';
      const time = new Date(c.timestamp).toLocaleString('ru-RU');
      const status = c.status === 'missed' ? '❌ Пропущен' : '✅ Принят';
      
      return `<div class="call-item">
        <div class="call-icon">${isIncoming ? '📞' : '📤'}</div>
        <div class="call-info">
          <div class="call-name">${otherName}</div>
          <div class="call-time">${time}</div>
        </div>
        <div class="call-status">${status}</div>
      </div>`;
    }).join('');
  } catch (err) {
    console.error('Load calls error:', err);
  }
}

// ==================== НЕПРОЧИТАННЫЕ ====================
async function loadUnreadCount() {
  try {
    const res = await fetch(`/api/unread/${currentUser.userId}`);
    const data = await res.json();
    const count = data.count || 0;
    
    if (count > 0) {
      chatsBadge.textContent = count > 99 ? '99+' : count;
      chatsBadge.style.display = 'flex';
    } else {
      chatsBadge.style.display = 'none';
    }
  } catch (err) {
    console.error('Unread count error:', err);
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.playAudio = function(url) {
  new Audio(url).play();
};

// ==================== ЗАПУСК ====================
init();
console.log('✅ ZOMO CHAT готов!');
