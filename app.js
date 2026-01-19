// ==================== AUTH & USER MANAGEMENT ====================

let currentUser = null;
let selectedAvatar = '👨‍💻';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initApp();
});

// Auth Initialization
function initAuth() {
    // Check for existing session
    const savedUserId = localStorage.getItem('foundersCloud_currentUser');
    if (savedUserId) {
        const users = getUsers();
        currentUser = users.find(u => u.id === savedUserId);
        if (currentUser) {
            showApp();
            return;
        }
    }
    
    // Show auth modal
    document.getElementById('auth-modal').classList.remove('hidden');
    
    // Auth form switches
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        showSignupForm();
    });
    
    document.getElementById('show-signin').addEventListener('click', (e) => {
        e.preventDefault();
        showSigninForm();
    });
    
    // Avatar picker
    document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAvatar = btn.dataset.avatar;
        });
    });
    
    // Sign Up
    document.getElementById('signup-btn').addEventListener('click', handleSignup);
    
    // Sign In
    document.getElementById('signin-btn').addEventListener('click', handleSignin);
    
    // Sign Out
    document.getElementById('sign-out-btn').addEventListener('click', handleSignout);
    
    // Account Switcher
    document.getElementById('switch-account-btn').addEventListener('click', showAccountModal);
    document.getElementById('close-account-modal').addEventListener('click', hideAccountModal);
    document.getElementById('add-account-btn').addEventListener('click', () => {
        hideAccountModal();
        handleSignout();
    });
    
    // Enter key support
    document.getElementById('signin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSignin();
    });
    document.getElementById('signup-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSignup();
    });
}

function showSignupForm() {
    document.getElementById('signin-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
    hideError();
}

function showSigninForm() {
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('signin-form').classList.add('active');
    hideError();
}

function showError(message) {
    const errorEl = document.getElementById('auth-error');
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function hideError() {
    document.getElementById('auth-error').classList.remove('show');
}

function getUsers() {
    return JSON.parse(localStorage.getItem('foundersCloud_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('foundersCloud_users', JSON.stringify(users));
}

function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const startup = document.getElementById('signup-startup').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    
    if (!name || !startup || !email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    const users = getUsers();
    
    if (users.find(u => u.email === email)) {
        showError('An account with this email already exists');
        return;
    }
    
    const newUser = {
        id: 'user_' + Date.now(),
        name,
        startup,
        email,
        password: btoa(password), // Simple encoding (use proper hashing in production)
        avatar: selectedAvatar,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Initialize user's workspace data
    initUserWorkspace(newUser.id);
    
    currentUser = newUser;
    localStorage.setItem('foundersCloud_currentUser', newUser.id);
    
    showApp();
}

function handleSignin() {
    const email = document.getElementById('signin-email').value.trim().toLowerCase();
    const password = document.getElementById('signin-password').value;
    
    if (!email || !password) {
        showError('Please enter email and password');
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.email === email && atob(u.password) === password);
    
    if (!user) {
        showError('Invalid email or password');
        return;
    }
    
    currentUser = user;
    localStorage.setItem('foundersCloud_currentUser', user.id);
    
    showApp();
}

function handleSignout() {
    currentUser = null;
    localStorage.removeItem('foundersCloud_currentUser');
    
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('auth-modal').classList.remove('hidden');
    
    // Clear form fields
    document.getElementById('signin-email').value = '';
    document.getElementById('signin-password').value = '';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-startup').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    
    showSigninForm();
}

function initUserWorkspace(userId) {
    // Initialize empty data for new user
    const workspaceData = {
        todos: [],
        goals: [],
        streak: 1,
        lastVisit: new Date().toISOString(),
        achievements: [],
        highScore: 0
    };
    localStorage.setItem(`foundersCloud_data_${userId}`, JSON.stringify(workspaceData));
}

function getUserData() {
    if (!currentUser) return null;
    const data = localStorage.getItem(`foundersCloud_data_${currentUser.id}`);
    return data ? JSON.parse(data) : initUserWorkspace(currentUser.id);
}

function saveUserData(data) {
    if (!currentUser) return;
    localStorage.setItem(`foundersCloud_data_${currentUser.id}`, JSON.stringify(data));
}

function showApp() {
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app-container').style.display = 'flex';
    
    updateUserUI();
    loadUserData();
}

function updateUserUI() {
    if (!currentUser) return;
    
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-status').textContent = currentUser.email;
    document.getElementById('user-avatar').textContent = currentUser.avatar;
    document.getElementById('workspace-name').textContent = currentUser.startup;
    document.getElementById('greeting-name').textContent = currentUser.name.split(' ')[0];
    document.getElementById('greeting-startup').textContent = currentUser.startup;
}

function showAccountModal() {
    const modal = document.getElementById('account-modal');
    const list = document.getElementById('account-list');
    const users = getUsers();
    
    list.innerHTML = users.map(user => `
        <div class="account-item ${user.id === currentUser.id ? 'active' : ''}" data-user-id="${user.id}">
            <div class="avatar">${user.avatar}</div>
            <div class="account-info">
                <span class="account-name">${user.name}</span>
                <span class="account-startup">${user.startup}</span>
            </div>
            <i class="fas fa-check check-icon"></i>
        </div>
    `).join('');
    
    // Add click handlers
    list.querySelectorAll('.account-item').forEach(item => {
        item.addEventListener('click', () => {
            const userId = item.dataset.userId;
            if (userId !== currentUser.id) {
                switchAccount(userId);
            }
            hideAccountModal();
        });
    });
    
    modal.classList.remove('hidden');
}

function hideAccountModal() {
    document.getElementById('account-modal').classList.add('hidden');
}

function switchAccount(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('foundersCloud_currentUser', user.id);
        updateUserUI();
        loadUserData();
    }
}

// ==================== APP FUNCTIONALITY ====================

function initApp() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Initialize other features when user is logged in
    if (currentUser) {
        loadUserData();
    }
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === page);
    });
}

function loadUserData() {
    const data = getUserData();
    if (!data) return;
    
    // Update dashboard stats
    document.getElementById('completed-count').textContent = data.todos?.filter(t => t.completed).length || 0;
    document.getElementById('goals-count').textContent = data.goals?.filter(g => g.status !== 'completed').length || 0;
    document.getElementById('streak-count').textContent = data.streak || 1;
    document.getElementById('ideas-count').textContent = data.goals?.length || 0;
    
    // Load todos
    loadTodos(data.todos || []);
    
    // Load goals
    loadGoals(data.goals || []);
}

// Placeholder functions - implement based on your existing code
function loadTodos(todos) {
    // Your existing todo loading logic
    const todoList = document.getElementById('todo-list');
    if (!todoList) return;
    
    todoList.innerHTML = todos.map((todo, index) => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-index="${index}">
            <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${index})">
            <span class="todo-text">${todo.text}</span>
            <button class="delete-todo" onclick="deleteTodo(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
    
    updateTodoCount();
}

function loadGoals(goals) {
    // Your existing goals loading logic
    const planningGoals = document.getElementById('planning-goals');
    const inprogressGoals = document.getElementById('inprogress-goals');
    const completedGoals = document.getElementById('completed-goals');
    
    if (!planningGoals) return;
    
    planningGoals.innerHTML = '';
    inprogressGoals.innerHTML = '';
    completedGoals.innerHTML = '';
    
    goals.forEach((goal, index) => {
        const goalEl = createGoalElement(goal, index);
        if (goal.status === 'planning') {
            planningGoals.appendChild(goalEl);
        } else if (goal.status === 'inprogress') {
            inprogressGoals.appendChild(goalEl);
        } else {
            completedGoals.appendChild(goalEl);
        }
    });
}

function createGoalElement(goal, index) {
    const div = document.createElement('div');
    div.className = `goal-card priority-${goal.priority}`;
    div.innerHTML = `
        <div class="goal-header">
            <span class="goal-priority">${goal.priority === 'high' ? '🔴' : goal.priority === 'medium' ? '🟡' : '🟢'}</span>
            <span class="goal-deadline">${goal.deadline || 'No deadline'}</span>
        </div>
        <p class="goal-text">${goal.text}</p>
        <div class="goal-actions">
            <button onclick="moveGoal(${index}, 'back')"><i class="fas fa-arrow-left"></i></button>
            <button onclick="moveGoal(${index}, 'forward')"><i class="fas fa-arrow-right"></i></button>
            <button onclick="deleteGoal(${index})"><i class="fas fa-trash"></i></button>
        </div>
    `;
    return div;
}

// Todo functions
function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;
    
    const data = getUserData();
    data.todos = data.todos || [];
    data.todos.push({ text, completed: false, createdAt: new Date().toISOString() });
    saveUserData(data);
    
    input.value = '';
    loadTodos(data.todos);
    updateDashboardStats();
}

function toggleTodo(index) {
    const data = getUserData();
    data.todos[index].completed = !data.todos[index].completed;
    saveUserData(data);
    loadTodos(data.todos);
    updateDashboardStats();
}

function deleteTodo(index) {
    const data = getUserData();
    data.todos.splice(index, 1);
    saveUserData(data);
    loadTodos(data.todos);
    updateDashboardStats();
}

function updateTodoCount() {
    const data = getUserData();
    const remaining = data.todos?.filter(t => !t.completed).length || 0;
    document.getElementById('todo-count').textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
}

// Goal functions
function addGoal() {
    const input = document.getElementById('goal-input');
    const priority = document.getElementById('goal-priority').value;
    const deadline = document.getElementById('goal-deadline').value;
    const text = input.value.trim();
    
    if (!text) return;
    
    const data = getUserData();
    data.goals = data.goals || [];
    data.goals.push({ text, priority, deadline, status: 'planning', createdAt: new Date().toISOString() });
    saveUserData(data);
    
    input.value = '';
    loadGoals(data.goals);
    updateDashboardStats();
}

function moveGoal(index, direction) {
    const data = getUserData();
    const statuses = ['planning', 'inprogress', 'completed'];
    const currentIndex = statuses.indexOf(data.goals[index].status);
    
    if (direction === 'forward' && currentIndex < 2) {
        data.goals[index].status = statuses[currentIndex + 1];
    } else if (direction === 'back' && currentIndex > 0) {
        data.goals[index].status = statuses[currentIndex - 1];
    }
    
    saveUserData(data);
    loadGoals(data.goals);
    updateDashboardStats();
}

function deleteGoal(index) {
    const data = getUserData();
    data.goals.splice(index, 1);
    saveUserData(data);
    loadGoals(data.goals);
    updateDashboardStats();
}

function updateDashboardStats() {
    const data = getUserData();
    document.getElementById('completed-count').textContent = data.todos?.filter(t => t.completed).length || 0;
    document.getElementById('goals-count').textContent = data.goals?.filter(g => g.status !== 'completed').length || 0;
    document.getElementById('ideas-count').textContent = data.goals?.length || 0;
}

// Event listeners for todo and goal forms
document.addEventListener('DOMContentLoaded', function() {
    const addTodoBtn = document.getElementById('add-todo-btn');
    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', addTodo);
    }
    
    const todoInput = document.getElementById('todo-input');
    if (todoInput) {
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo();
        });
    }
    
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', addGoal);
    }
    
    const clearCompleted = document.getElementById('clear-completed');
    if (clearCompleted) {
        clearCompleted.addEventListener('click', () => {
            const data = getUserData();
            data.todos = data.todos?.filter(t => !t.completed) || [];
            saveUserData(data);
            loadTodos(data.todos);
            updateDashboardStats();
        });
    }
});
