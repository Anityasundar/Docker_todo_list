const API_BASE_URL = 'https://laughing-couscous-g4549qjvpq57cpg9r-3000.app.github.dev/api';

let currentUser = null;

function initAuth() {
  // Check if we're on auth pages
  if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
  }

  if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', handleRegister);
  }

  if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
  }

  // Display current user if logged in
  const token = localStorage.getItem('token');
  if (token && document.getElementById('username-display')) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUser = payload;
      document.getElementById('username-display').textContent = payload.username;
    } catch (error) {
      console.error('Error parsing token:', error);
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    window.location.href = 'index.html';
  } catch (error) {
    alert(error.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    alert('Registration successful! Please login.');
    window.location.href = 'login.html';
  } catch (error) {
    alert(error.message);
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// Helper function for authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    ...options
  };

  const response = await fetch(url, defaultOptions);

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return;
  }

  return response;
}
