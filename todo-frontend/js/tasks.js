let tasks = [];
let categories = [];

function initTasks() {
  if (!document.getElementById('tasks-container')) return;

  // Load tasks and categories
  loadTasks();
  loadCategories();

  // Set up event listeners
  document.getElementById('add-task-btn').addEventListener('click', showTaskModal);
  document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
  document.getElementById('cancel-task').addEventListener('click', hideTaskModal);
  document.querySelector('.close-modal').addEventListener('click', hideTaskModal);
  document.getElementById('task-search').addEventListener('input', filterTasks);
  document.querySelectorAll('.filter').forEach(filter => {
    filter.addEventListener('change', filterTasks);
  });
  document.getElementById('sort-by').addEventListener('change', sortTasks);
}

async function loadTasks() {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/tasks`);
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
    alert('Failed to load tasks');
  }
}

async function loadCategories() {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/categories`);
    categories = await response.json();
    renderCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function renderTasks(filteredTasks = tasks) {
  const container = document.getElementById('tasks-container');
  container.innerHTML = '';

  if (filteredTasks.length === 0) {
    container.innerHTML = '<p>No tasks found</p>';
    return;
  }

  filteredTasks.forEach(task => {
    const taskElement = document.createElement('li');
    taskElement.className = `task-item ${task.isCompleted ? 'completed' : ''}`;
    
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
    
    taskElement.innerHTML = `
      <div>
        <span class="task-title">${task.title}</span>
        <span class="task-priority priority-${task.priority}">${task.priority}</span>
        <div class="task-due-date">${dueDate}</div>
      </div>
      <div class="task-actions">
        <button class="btn ${task.isCompleted ? 'btn-secondary' : 'btn-success'} complete-btn" data-id="${task.id}">
          ${task.isCompleted ? 'Undo' : 'Complete'}
        </button>
        <button class="btn btn-primary edit-btn" data-id="${task.id}">Edit</button>
        <button class="btn btn-danger delete-btn" data-id="${task.id}">Delete</button>
      </div>
    `;

    container.appendChild(taskElement);
  });

  // Add event listeners to action buttons
  document.querySelectorAll('.complete-btn').forEach(btn => {
    btn.addEventListener('click', handleCompleteTask);
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', handleEditTask);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteTask);
  });
}

function renderCategories() {
  const container = document.getElementById('categories-list');
  const categorySelect = document.getElementById('task-category');
  
  container.innerHTML = '';
  categorySelect.innerHTML = '<option value="">No Category</option>';
  
  categories.forEach(category => {
    // Add to sidebar
    const li = document.createElement('li');
    li.textContent = category.name;
    li.dataset.id = category.id;
    container.appendChild(li);
    
    // Add to select in modal
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

function showTaskModal(task = null) {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  
  if (task) {
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-due-date').value = task.dueDate ? task.dueDate.slice(0, 16) : '';
    document.getElementById('task-priority').value = task.priority || 'medium';
    document.getElementById('task-category').value = task.categoryId || '';
  } else {
    document.getElementById('modal-title').textContent = 'Add New Task';
    form.reset();
  }
  
  modal.style.display = 'block';
}

function hideTaskModal() {
  document.getElementById('task-modal').style.display = 'none';
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  
  const taskId = document.getElementById('task-id').value;
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;
  const dueDate = document.getElementById('task-due-date').value;
  const priority = document.getElementById('task-priority').value;
  const categoryId = document.getElementById('task-category').value || null;
  
  const taskData = {
    title,
    description,
    dueDate: dueDate || null,
    priority,
    categoryId
  };
  
  try {
    let response;
    
    if (taskId) {
      // Update existing task
      response = await makeAuthenticatedRequest(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskData)
      });
    } else {
      // Create new task
      response = await makeAuthenticatedRequest(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
    }
    
    if (!response.ok) {
      throw new Error('Failed to save task');
    }
    
    hideTaskModal();
    loadTasks();
  } catch (error) {
    console.error('Error saving task:', error);
    alert(error.message);
  }
}

async function handleCompleteTask(e) {
  const taskId = e.target.dataset.id;
  const task = tasks.find(t => t.id == taskId);
  
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ isCompleted: !task.isCompleted })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    
    loadTasks();
  } catch (error) {
    console.error('Error completing task:', error);
    alert(error.message);
  }
}

async function handleEditTask(e) {
  const taskId = e.target.dataset.id;
  const task = tasks.find(t => t.id == taskId);
  showTaskModal(task);
}

async function handleDeleteTask(e) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  const taskId = e.target.dataset.id;
  
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
    
    loadTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
    alert(error.message);
  }
}

function filterTasks() {
  const searchTerm = document.getElementById('task-search').value.toLowerCase();
  const filters = Array.from(document.querySelectorAll('.filter:checked')).map(f => f.value);
  
  let filtered = tasks;
  
  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(searchTerm) || 
      (task.description && task.description.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply checkbox filters
  if (filters.length > 0) {
    filtered = filtered.filter(task => {
      if (filters.includes('completed') && !task.isCompleted) return false;
      if (filters.includes('high') && task.priority !== 'high') return false;
      if (filters.includes('medium') && task.priority !== 'medium') return false;
      if (filters.includes('low') && task.priority !== 'low') return false;
      return true;
    });
  }
  
  renderTasks(filtered);
}

function sortTasks() {
  const sortBy = document.getElementById('sort-by').value;
  
  const sorted = [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'dueDate') {
      return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
    } else {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
  
  renderTasks(sorted);
}
