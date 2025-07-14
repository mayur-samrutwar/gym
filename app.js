// Exercise Database
const exercises = {
    push: [
        'Bench Press',
        'Incline Bench Press',
        'Decline Bench Press',
        'Dumbbell Press',
        'Overhead Press',
        'Lateral Raises',
        'Front Raises',
        'Tricep Dips',
        'Tricep Pushdowns',
        'Close-Grip Bench Press'
    ],
    pull: [
        'Pull-ups',
        'Chin-ups',
        'Lat Pulldowns',
        'Barbell Rows',
        'Dumbbell Rows',
        'Cable Rows',
        'Face Pulls',
        'Bicep Curls',
        'Hammer Curls',
        'Preacher Curls'
    ],
    legs: [
        'Squats',
        'Deadlifts',
        'Romanian Deadlifts',
        'Leg Press',
        'Bulgarian Split Squats',
        'Lunges',
        'Leg Curls',
        'Leg Extensions',
        'Calf Raises',
        'Hip Thrusts'
    ]
};

// State Management
let currentWorkout = '';
let currentExercise = '';

// DOM Elements
const pages = {
    landing: document.getElementById('landing-page'),
    exercise: document.getElementById('exercise-page'),
    detail: document.getElementById('detail-page'),
    calendar: document.getElementById('calendar-page'),
    settings: document.getElementById('settings-page')
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeCalendar();
    registerServiceWorker();
    handleURLParams();
});

// Handle URL parameters for shortcuts
function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    
    if (view === 'calendar') {
        showPage('calendar');
    }
}

// Register Service Worker for PWA functionality
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    }
}

// Event Listeners
function initializeEventListeners() {
    // Workout cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            const workout = this.dataset.workout;
            showExercisePage(workout);
        });
    });

    // Navigation buttons
    document.getElementById('calendar-btn').addEventListener('click', () => showPage('calendar'));
    document.getElementById('settings-btn').addEventListener('click', () => showPage('settings'));
    document.getElementById('back-btn').addEventListener('click', () => showPage('landing'));
    document.getElementById('detail-back-btn').addEventListener('click', () => showExercisePage(currentWorkout));
    document.getElementById('calendar-back-btn').addEventListener('click', () => showPage('landing'));
    document.getElementById('settings-back-btn').addEventListener('click', () => showPage('landing'));

    // Save weights button
    document.getElementById('save-weights').addEventListener('click', saveWeights);
    
    // Settings buttons
    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('import-data').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', importData);
    document.getElementById('clear-data').addEventListener('click', clearAllData);
    
    // Add exercise buttons
    document.getElementById('add-exercise-btn').addEventListener('click', showAddExerciseForm);
    document.getElementById('save-exercise').addEventListener('click', saveNewExercise);
    document.getElementById('cancel-exercise').addEventListener('click', hideAddExerciseForm);
    document.getElementById('new-exercise-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveNewExercise();
        }
    });
    
    // History and graph buttons
    document.getElementById('toggle-history').addEventListener('click', toggleHistory);
    
    // Tab buttons using event delegation
    document.getElementById('history-section').addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-btn')) {
            switchTab(e);
        }
    });
    
    // Exercise item clicks using event delegation
    document.getElementById('exercise-list').addEventListener('click', function(e) {
        const exerciseItem = e.target.closest('.exercise-item');
        if (exerciseItem && exerciseItem.dataset.exercise) {
            showExerciseDetail(exerciseItem.dataset.exercise);
        }
    });
}

// Navigation Functions
function showPage(pageName) {
    Object.values(pages).forEach(page => page.classList.remove('active'));
    pages[pageName].classList.add('active');
}

function showExercisePage(workout) {
    currentWorkout = workout;
    document.getElementById('workout-title').textContent = workout.charAt(0).toUpperCase() + workout.slice(1);
    
    const exerciseList = document.getElementById('exercise-list');
    exerciseList.innerHTML = '';
    
    // Get all exercises (default + custom)
    const allExercises = getAllExercises(workout);
    
    allExercises.forEach(exercise => {
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'exercise-item';
        exerciseItem.dataset.exercise = exercise; // Add data attribute for event delegation
        exerciseItem.innerHTML = `
            <span class="exercise-name">${exercise}</span>
            <span class="exercise-last-weight">${getLastWeight(exercise)}</span>
        `;
        
        exerciseList.appendChild(exerciseItem);
    });
    
    // Hide add exercise form
    hideAddExerciseForm();
    
    showPage('exercise');
}

function showExerciseDetail(exercise) {
    currentExercise = exercise;
    document.getElementById('exercise-title').textContent = exercise;
    
    // Clear inputs
    document.getElementById('set1').value = '';
    document.getElementById('set2').value = '';
    document.getElementById('set3').value = '';
    
    // Show last session data and history
    displayLastSession(exercise);
    displayPreviousSessions(exercise);
    drawProgressChart(exercise);
    
    // Reset history state
    const historySection = document.getElementById('history-section');
    const toggleBtn = document.getElementById('toggle-history');
    historySection.classList.add('collapsed');
    toggleBtn.textContent = 'View All';
    
    showPage('detail');
}

// Weight Management
function getLastWeight(exercise) {
    const data = getExerciseData(exercise);
    if (data.length === 0) return 'No data';
    
    const lastSession = data[data.length - 1];
    const avgWeight = (lastSession.set1 + lastSession.set2 + lastSession.set3) / 3;
    return `${avgWeight.toFixed(1)}kg`;
}

function displayLastSession(exercise) {
    const data = getExerciseData(exercise);
    const lastWeights = document.getElementById('last-weights');
    
    if (data.length === 0) {
        lastWeights.innerHTML = `
            <div class="no-data-card">
                <div class="no-data-icon">📊</div>
                <div class="no-data-text">No previous data</div>
            </div>
        `;
        return;
    }
    
    const lastSession = data[data.length - 1];
    const date = new Date(lastSession.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
    
    lastWeights.innerHTML = `
        <div class="weight-cards">
            <div class="weight-card">
                <div class="set-number">1</div>
                <div class="set-weight">${lastSession.set1}<span class="unit">kg</span></div>
            </div>
            <div class="weight-card">
                <div class="set-number">2</div>
                <div class="set-weight">${lastSession.set2}<span class="unit">kg</span></div>
            </div>
            <div class="weight-card">
                <div class="set-number">3</div>
                <div class="set-weight">${lastSession.set3}<span class="unit">kg</span></div>
            </div>
        </div>
        <div class="session-date">${date}</div>
    `;
}

function saveWeights() {
    const set1 = parseFloat(document.getElementById('set1').value);
    const set2 = parseFloat(document.getElementById('set2').value);
    const set3 = parseFloat(document.getElementById('set3').value);
    
    if (!set1 || !set2 || !set3) {
        alert('Please enter weights for all 3 sets');
        return;
    }
    
    const sessionData = {
        date: new Date().toISOString(),
        set1: set1,
        set2: set2,
        set3: set3
    };
    
    const data = getExerciseData(currentExercise);
    data.push(sessionData);
    localStorage.setItem(`exercise_${currentExercise}`, JSON.stringify(data));
    
    // Mark today as worked out
    markTodayAsWorkedOut();
    
    // Show success and go back with a small delay to ensure data is saved
    alert('Session saved!');
    
    // Use setTimeout to ensure localStorage write completes
    setTimeout(() => {
        showExercisePage(currentWorkout);
    }, 50);
}

// localStorage Management
function getExerciseData(exercise) {
    const data = localStorage.getItem(`exercise_${exercise}`);
    return data ? JSON.parse(data) : [];
}

// Calendar Functions
function initializeCalendar() {
    renderCalendar();
    setupCalendarEvents();
}

function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Set month header
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    // Get calendar data
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });
    
    // Calendar days
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = current.getDate();
        dayElement.dataset.date = current.toISOString().split('T')[0];
        
        // Add classes
        if (current.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        if (isToday(current)) {
            dayElement.classList.add('today');
        }
        
        if (isWorkedOut(current)) {
            dayElement.classList.add('worked-out');
        }
        
        calendarGrid.appendChild(dayElement);
        current.setDate(current.getDate() + 1);
    }
}

function setupCalendarEvents() {
    document.getElementById('calendar-grid').addEventListener('click', function(e) {
        if (e.target.classList.contains('calendar-day') && 
            !e.target.classList.contains('header') && 
            !e.target.classList.contains('other-month')) {
            
            const date = e.target.dataset.date;
            toggleWorkoutDay(date);
            e.target.classList.toggle('worked-out');
        }
    });
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isWorkedOut(date) {
    const workoutDays = getWorkoutDays();
    const dateString = date.toISOString().split('T')[0];
    return workoutDays.includes(dateString);
}

function getWorkoutDays() {
    const data = localStorage.getItem('workout_days');
    return data ? JSON.parse(data) : [];
}

function toggleWorkoutDay(date) {
    const workoutDays = getWorkoutDays();
    const index = workoutDays.indexOf(date);
    
    if (index > -1) {
        workoutDays.splice(index, 1);
    } else {
        workoutDays.push(date);
    }
    
    localStorage.setItem('workout_days', JSON.stringify(workoutDays));
}

function markTodayAsWorkedOut() {
    const today = new Date().toISOString().split('T')[0];
    const workoutDays = getWorkoutDays();
    
    if (!workoutDays.includes(today)) {
        workoutDays.push(today);
        localStorage.setItem('workout_days', JSON.stringify(workoutDays));
    }
}

// Data Management Functions
function exportData() {
    const allData = {};
    
    // Export exercise data (default exercises)
    Object.values(exercises).flat().forEach(exercise => {
        const data = getExerciseData(exercise);
        if (data.length > 0) {
            allData[`exercise_${exercise}`] = data;
        }
    });
    
    // Export custom exercise data
    Object.keys(exercises).forEach(workout => {
        const customExercises = getCustomExercises(workout);
        customExercises.forEach(exercise => {
            const data = getExerciseData(exercise);
            if (data.length > 0) {
                allData[`exercise_${exercise}`] = data;
            }
        });
        
        // Export custom exercise lists
        if (customExercises.length > 0) {
            allData[`custom_exercises_${workout}`] = customExercises;
        }
    });
    
    // Export workout days
    const workoutDays = getWorkoutDays();
    if (workoutDays.length > 0) {
        allData['workout_days'] = workoutDays;
    }
    
    // Create and download file
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `gym-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Confirm import
            if (!confirm('This will overwrite your existing data. Are you sure?')) {
                return;
            }
            
            // Import all data
            Object.keys(importedData).forEach(key => {
                localStorage.setItem(key, JSON.stringify(importedData[key]));
            });
            
            // Refresh calendar
            renderCalendar();
            
            alert('Data imported successfully!');
        } catch (error) {
            alert('Error importing data. Please check the file format.');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function clearAllData() {
    if (!confirm('This will permanently delete all your workout data. Are you sure?')) {
        return;
    }
    
    if (!confirm('This action cannot be undone. Really delete everything?')) {
        return;
    }
    
    // Clear all exercise data
    Object.values(exercises).flat().forEach(exercise => {
        localStorage.removeItem(`exercise_${exercise}`);
    });
    
    // Clear workout days
    localStorage.removeItem('workout_days');
    
    // Refresh calendar
    renderCalendar();
    
    alert('All data cleared successfully!');
}

// Custom Exercise Management
function getAllExercises(workout) {
    const defaultExercises = exercises[workout] || [];
    const customExercises = getCustomExercises(workout);
    return [...defaultExercises, ...customExercises];
}

function getCustomExercises(workout) {
    const data = localStorage.getItem(`custom_exercises_${workout}`);
    return data ? JSON.parse(data) : [];
}

function addCustomExercise(workout, exerciseName) {
    const customExercises = getCustomExercises(workout);
    if (!customExercises.includes(exerciseName)) {
        customExercises.push(exerciseName);
        localStorage.setItem(`custom_exercises_${workout}`, JSON.stringify(customExercises));
    }
}

function showAddExerciseForm() {
    const form = document.getElementById('add-exercise-form');
    const btn = document.getElementById('add-exercise-btn');
    
    form.classList.remove('hidden');
    btn.style.display = 'none';
    
    // Focus on input
    const input = document.getElementById('new-exercise-name');
    input.focus();
    input.value = '';
}

function hideAddExerciseForm() {
    const form = document.getElementById('add-exercise-form');
    const btn = document.getElementById('add-exercise-btn');
    
    form.classList.add('hidden');
    btn.style.display = 'flex';
    
    // Clear input
    document.getElementById('new-exercise-name').value = '';
}

function saveNewExercise() {
    const input = document.getElementById('new-exercise-name');
    const exerciseName = input.value.trim();
    
    if (!exerciseName) {
        alert('Please enter an exercise name');
        return;
    }
    
    // Check if exercise already exists
    const allExercises = getAllExercises(currentWorkout);
    if (allExercises.includes(exerciseName)) {
        alert('This exercise already exists');
        return;
    }
    
    // Add to custom exercises
    addCustomExercise(currentWorkout, exerciseName);
    
    // Show success message and refresh with delay
    alert('Exercise added successfully!');
    
    // Use setTimeout to ensure localStorage write completes
    setTimeout(() => {
        showExercisePage(currentWorkout);
    }, 50);
}

// Session History Management
function toggleHistory() {
    const historySection = document.getElementById('history-section');
    const toggleBtn = document.getElementById('toggle-history');
    
    if (historySection.classList.contains('collapsed')) {
        historySection.classList.remove('collapsed');
        toggleBtn.textContent = 'Hide';
    } else {
        historySection.classList.add('collapsed');
        toggleBtn.textContent = 'View All';
    }
}

function switchTab(e) {
    const targetTab = e.target.dataset.tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${targetTab}-tab`).classList.remove('hidden');
    
    // Redraw chart if switching to graph tab
    if (targetTab === 'graph') {
        drawProgressChart(currentExercise);
    }
}

function displayPreviousSessions(exercise) {
    const data = getExerciseData(exercise);
    const container = document.getElementById('previous-sessions');
    
    if (data.length <= 1) {
        container.innerHTML = `
            <div class="no-data-card">
                <div class="no-data-icon">📈</div>
                <div class="no-data-text">No previous sessions</div>
            </div>
        `;
        return;
    }
    
    // Show all sessions except the last one (which is displayed above)
    const previousSessions = data.slice(0, -1).reverse(); // Most recent first
    
    container.innerHTML = previousSessions.map(session => {
        const date = new Date(session.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: new Date(session.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
        const avg = ((session.set1 + session.set2 + session.set3) / 3).toFixed(1);
        
        return `
            <div class="session-item">
                <div class="session-header">
                    <span class="session-date">${date}</span>
                    <span class="session-avg">Avg: ${avg}kg</span>
                </div>
                <div class="session-weights">
                    <div class="session-weight-mini">${session.set1}kg</div>
                    <div class="session-weight-mini">${session.set2}kg</div>
                    <div class="session-weight-mini">${session.set3}kg</div>
                </div>
            </div>
        `;
    }).join('');
}

function drawProgressChart(exercise) {
    const canvas = document.getElementById('progress-chart');
    const ctx = canvas.getContext('2d');
    const data = getExerciseData(exercise);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length < 2) {
        // Show empty state
        const container = canvas.parentElement;
        container.innerHTML = `
            <div class="graph-empty">
                <div class="graph-empty-icon">📈</div>
                <div>Need at least 2 sessions to show progress</div>
            </div>
        `;
        return;
    }
    
    // Prepare data points (average weight per session)
    const points = data.map(session => {
        return (session.set1 + session.set2 + session.set3) / 3;
    });
    
    // Chart dimensions
    const padding = 30;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    
    // Find min/max for scaling
    const minWeight = Math.min(...points) * 0.9; // Add some padding
    const maxWeight = Math.max(...points) * 1.1;
    const weightRange = maxWeight - minWeight;
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }
    
    // Draw line chart
    if (points.length > 1) {
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        points.forEach((weight, index) => {
            const x = padding + (chartWidth / (points.length - 1)) * index;
            const y = padding + chartHeight - ((weight - minWeight) / weightRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#0a0a0a';
        points.forEach((weight, index) => {
            const x = padding + (chartWidth / (points.length - 1)) * index;
            const y = padding + chartHeight - ((weight - minWeight) / weightRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Draw weight labels on points
        ctx.fillStyle = '#666';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        points.forEach((weight, index) => {
            const x = padding + (chartWidth / (points.length - 1)) * index;
            const y = padding + chartHeight - ((weight - minWeight) / weightRange) * chartHeight;
            
            ctx.fillText(`${weight.toFixed(1)}`, x, y - 10);
        });
    }
    
    // Draw axis labels
    ctx.fillStyle = '#999';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${minWeight.toFixed(1)}kg`, 5, canvas.height - padding + 15);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxWeight.toFixed(1)}kg`, canvas.width - 5, padding - 5);
} 