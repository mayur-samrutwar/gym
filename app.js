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
    
    exercises[workout].forEach(exercise => {
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'exercise-item';
        exerciseItem.innerHTML = `
            <span class="exercise-name">${exercise}</span>
            <span class="exercise-last-weight">${getLastWeight(exercise)}</span>
        `;
        
        exerciseItem.addEventListener('click', () => showExerciseDetail(exercise));
        exerciseList.appendChild(exerciseItem);
    });
    
    showPage('exercise');
}

function showExerciseDetail(exercise) {
    currentExercise = exercise;
    document.getElementById('exercise-title').textContent = exercise;
    
    // Clear inputs
    document.getElementById('set1').value = '';
    document.getElementById('set2').value = '';
    document.getElementById('set3').value = '';
    
    // Show last session data
    displayLastSession(exercise);
    
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
        lastWeights.innerHTML = '<p style="text-align: center; color: #999;">No previous data</p>';
        return;
    }
    
    const lastSession = data[data.length - 1];
    const date = new Date(lastSession.date).toLocaleDateString();
    
    lastWeights.innerHTML = `
        <div class="weight-row">
            <span class="weight-label">Set 1:</span>
            <span class="weight-value">${lastSession.set1}kg</span>
        </div>
        <div class="weight-row">
            <span class="weight-label">Set 2:</span>
            <span class="weight-value">${lastSession.set2}kg</span>
        </div>
        <div class="weight-row">
            <span class="weight-label">Set 3:</span>
            <span class="weight-value">${lastSession.set3}kg</span>
        </div>
        <div class="last-date">${date}</div>
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
    
    // Show success and go back
    alert('Session saved!');
    showExercisePage(currentWorkout);
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
    
    // Export exercise data
    Object.values(exercises).flat().forEach(exercise => {
        const data = getExerciseData(exercise);
        if (data.length > 0) {
            allData[`exercise_${exercise}`] = data;
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