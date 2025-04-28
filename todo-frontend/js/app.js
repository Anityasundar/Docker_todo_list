document.addEventListener('DOMContentLoaded', () => {
  // Check authentication status
  if (!localStorage.getItem('token') && !['/login.html', '/register.html'].includes(window.location.pathname)) {
    window.location.href = 'login.html';
    return;
  }

  // Initialize modules
  if (typeof initAuth === 'function') initAuth();
  if (typeof initTasks === 'function') initTasks();
  if (typeof initUI === 'function') initUI();
});
