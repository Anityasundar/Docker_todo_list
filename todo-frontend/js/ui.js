function initUI() {
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('task-modal');
    if (e.target === modal) {
      hideTaskModal();
    }
  });

  // Add any other UI-specific initialization here
}
