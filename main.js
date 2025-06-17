import * as FirebaseManager from './firebase_manager.js';
import * as UIManager from './ui_manager.js';

const state = {
    currentView: 'child',
    editingTaskId: null,
    selectedWeek: null,
    selectedDayKey: null,
    displayedDateStr: null,
    year: new Date().getFullYear(),
    allTasks: [],
    currentCoins: 0,
    isInitialLoad: true,
};

const dayKeyMap = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const dayKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function getDateInfo(week, dayKey, year) {
    const dayIndex = dayKeyMap[dayKey];
    const date = new Date(year, 0, 1);
    const firstDayOfWeek = date.getDay();
    const weekStartOffset = (week - 1) * 7;
    date.setDate(1 - firstDayOfWeek + weekStartOffset + dayIndex);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    
    return { date, dateStr: `${y}-${m}-${d}` };
}

function updateSelectedDate(week, dayKey) {
    week = parseInt(week, 10);
    if (isNaN(week) || week < 1 || week > 53) {
        week = getWeekNumber(new Date());
    }

    state.selectedWeek = week;
    state.selectedDayKey = dayKey;

    const { date, dateStr } = getDateInfo(week, dayKey, state.year);
    state.displayedDateStr = dateStr;

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = date.toLocaleDateString('pt-BR', dateOptions);
    
    syncNavControls();
    refreshCurrentView();
}

function syncNavControls() {
    document.getElementById('week-selector-child').value = state.selectedWeek;
    UIManager.updateDaySelector('day-selector-buttons-child', state.selectedDayKey);
    
    document.getElementById('week-selector-admin').value = state.selectedWeek;
    UIManager.updateDaySelector('day-selector-buttons-admin', state.selectedDayKey);
}

function handleDayChange(event) {
    const newDayKey = event.target.dataset.day;
    if (newDayKey && newDayKey !== state.selectedDayKey) {
        updateSelectedDate(state.selectedWeek, newDayKey);
    }
}

function handleWeekChange(event) {
    const newWeek = event.target.value;
    if (newWeek && parseInt(newWeek, 10) !== state.selectedWeek) {
        updateSelectedDate(newWeek, state.selectedDayKey);
    }
}

function refreshCurrentView() {
    if (state.currentView === 'child') {
        refreshChildView();
    } else {
        refreshAdminView();
    }
}

function updateCoinDisplays(coinTotal) {
    document.getElementById('admin-coin-total').textContent = coinTotal;
    UIManager.animateCoinUpdate(coinTotal);
}

async function handleAddCoinManual() {
    try {
        await FirebaseManager.addCoin();
    } catch (error) {
        console.error("Error adding coin:", error);
        alert("Failed to add coin.");
    }
}

async function handleRemoveCoinManual() {
    try {
        await FirebaseManager.removeCoin();
    } catch (error) {
        console.error("Error removing coin:", error);
        alert("Failed to remove coin.");
    }
}

async function handleAddTask(event) {
    event.preventDefault();
    const description = document.getElementById('task-description').value;
    const time = document.getElementById('task-time').value;
    const endTime = document.getElementById('endTime').value;
    const reward = document.getElementById('task-reward').checked;
    let enableNotifications = document.getElementById('enableNotifications').checked;
    
    const selectedDays = [];
    document.querySelectorAll('#task-days .day-btn.selected').forEach(btn => {
        selectedDays.push(btn.dataset.day);
    });

    if (!description || !time || selectedDays.length === 0) {
        alert('Por favor, preencha a descrição, horário de início e dias da semana.');
        return;
    }
    
    if (enableNotifications && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
            try {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('Permissão para notificações negada. O recurso não será ativado para esta tarefa.');
                    enableNotifications = false;
                }
            } catch (error) {
                console.error("Erro ao solicitar permissão de notificação:", error);
                enableNotifications = false;
            }
        }
    } else if (enableNotifications) {
        alert('Este navegador não suporta notificações.');
        enableNotifications = false;
    }

    const taskData = { description, time, endTime, days: selectedDays, reward, enableNotifications };

    try {
        if (state.editingTaskId) {
            await FirebaseManager.updateTask(state.editingTaskId, taskData);
        } else {
            await FirebaseManager.addTask(taskData);
        }
        resetAdminForm();
    } catch (error) {
        console.error("Error saving task:", error);
        alert("Failed to save task.");
    }
}

function handleEditTaskClick(event) {
    const taskId = event.currentTarget.dataset.taskId;
    const taskToEdit = state.allTasks.find(t => t.id === taskId);
    
    if (taskToEdit) {
        state.editingTaskId = taskId;
        UIManager.populateEditForm(taskToEdit);
    }
}

async function handleDeleteTask(event) {
    const taskId = event.currentTarget.dataset.taskId;
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        try {
            await FirebaseManager.deleteTask(taskId);
        } catch(error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task.");
        }
    }
}

function handleCancelEdit() {
    resetAdminForm();
}

function resetAdminForm() {
    state.editingTaskId = null;
    document.getElementById('task-form').reset();
    document.querySelectorAll('#task-days .day-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
    });
    UIManager.resetFormUI();
}

function switchView(view) {
    state.currentView = view;
    UIManager.switchView(view);
    refreshCurrentView();
}

async function handleTaskClick(event) {
    const completeButton = event.target.closest('.complete-btn');
    const undoButton = event.target.closest('.undo-btn');

    const taskCard = event.target.closest('.task-card');
    if (!taskCard) return;

    const taskId = taskCard.dataset.taskId;
    const dateStr = state.displayedDateStr;
    const task = state.allTasks.find(t => t.id === taskId);

    if (!task) {
        console.error('Task not found for id:', taskId);
        return;
    }

    try {
        if (completeButton) {
            if (task.completed && task.completed[dateStr]) return;
            
            completeButton.style.transform = 'scale(0.8)';
            
            setTimeout(async () => {
                await FirebaseManager.completeTask(taskId, dateStr);
                if (task.reward) {
                    await FirebaseManager.addCoin();
                    UIManager.showRewardAnimation(completeButton);
                }
            }, 150);
        }

        if (undoButton) {
            if (!task.completed || !task.completed[dateStr]) return;

            if (task.reward) {
                await FirebaseManager.removeCoin();
            }
            await FirebaseManager.uncompleteTask(taskId, dateStr);
        }
    } catch (error) {
        console.error("Error during task operation:", error);
        alert("An error occurred. Please try again.");
    }
}

function refreshChildView() {
    const dayKey = state.selectedDayKey;
    const dateStr = state.displayedDateStr;

    const tasksForDay = state.allTasks.filter(task => task.days && task.days.includes(dayKey));
    
    const timeToMinutes = (timeStr) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const scheduleGrid = document.getElementById('schedule-grid');
    scheduleGrid.innerHTML = '';
    scheduleGrid.className = 'time-grid flex-grow';

    const startTime = 7 * 60;
    const endTime = 23 * 60;
    const interval = 30;

    let animationDelay = 0;

    for (let slotStartMinutes = startTime; slotStartMinutes < endTime; slotStartMinutes += interval) {
        const slotEndMinutes = slotStartMinutes + interval;

        const hours = Math.floor(slotStartMinutes / 60);
        const minutes = slotStartMinutes % 60;
        const timeLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        const tasksInSlot = tasksForDay.filter(task => {
            const taskStartMinutes = timeToMinutes(task.time);
            const taskEndMinutes = timeToMinutes(task.endTime) || (taskStartMinutes + 1);
            return taskStartMinutes < slotEndMinutes && taskEndMinutes > slotStartMinutes;
        });
        
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'slot-content';

        if (tasksInSlot.length > 0) {
            tasksInSlot
                .sort((a, b) => a.time.localeCompare(b.time))
                .forEach(task => {
                    const taskCard = UIManager.createTaskCard(task, dateStr);
                    contentElement.appendChild(taskCard);
                });
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.className = 'empty-slot';
            emptySlot.textContent = 'nada pra fazer aqui, vamos planejar algo?';
            contentElement.appendChild(emptySlot);
        }
        
        const labelElement = document.createElement('div');
        labelElement.className = 'time-label';
        labelElement.textContent = timeLabel;

        slotElement.appendChild(labelElement);
        slotElement.appendChild(contentElement);
        
        slotElement.style.animation = `task-card-entrance 0.5s ease-out forwards`;
        slotElement.style.animationDelay = `${animationDelay}s`;
        scheduleGrid.appendChild(slotElement);
        animationDelay += 0.04;
    }

    lucide.createIcons();
}

function refreshAdminView() {
    const dayKey = state.selectedDayKey;
    const tasksForDay = state.allTasks
        .filter(task => task.days && task.days.includes(dayKey))
        .sort((a, b) => a.time.localeCompare(b.time));
    
    UIManager.renderAdminView(tasksForDay, handleEditTaskClick, handleDeleteTask);
    
    const listTitle = document.getElementById('admin-list-title');
    const { date } = getDateInfo(state.selectedWeek, state.selectedDayKey, state.year);
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    listTitle.textContent = `Tarefas para ${date.toLocaleDateString('pt-BR', dateOptions)}`;
}

function init() {
    lucide.createIcons();

    document.getElementById('switch-to-admin').addEventListener('click', () => switchView('admin'));
    document.getElementById('switch-to-child').addEventListener('click', () => switchView('child'));
    document.getElementById('task-form').addEventListener('submit', handleAddTask);
    document.getElementById('form-cancel-btn').addEventListener('click', handleCancelEdit);

    document.getElementById('add-coin-btn').addEventListener('click', handleAddCoinManual);
    document.getElementById('remove-coin-btn').addEventListener('click', handleRemoveCoinManual);

    UIManager.setupAdminFormDays();

    UIManager.createDaySelector('day-selector-buttons-child', handleDayChange, 'view-day-btn');
    UIManager.createDaySelector('day-selector-buttons-admin', handleDayChange, 'view-day-btn');
    document.getElementById('week-selector-child').addEventListener('change', handleWeekChange);
    document.getElementById('week-selector-admin').addEventListener('change', handleWeekChange);

    document.getElementById('schedule-grid').addEventListener('click', handleTaskClick);

    const today = new Date();
    const initialWeek = getWeekNumber(today);
    const initialDayKey = dayKeys[today.getDay()];
    
    state.currentView = 'child'; 
    UIManager.switchView('child');
    updateSelectedDate(initialWeek, initialDayKey);

    FirebaseManager.listenForTasks((tasks) => {
        state.allTasks = tasks;
        if (state.isInitialLoad) {
            state.isInitialLoad = false;
            const loader = document.getElementById('loading-overlay');
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
        refreshCurrentView();
    });

    FirebaseManager.listenForCoins((coins) => {
        state.currentCoins = coins;
        updateCoinDisplays(coins);
    });
}

document.addEventListener('DOMContentLoaded', init);
