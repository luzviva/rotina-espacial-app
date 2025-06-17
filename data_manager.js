const STORAGE_KEY = 'rotina_espacial_data';

function getDefaultData() {
    return {
        tasks: [],
        coins: 0
    };
}

export function getAppData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getDefaultData();
    } catch (error) {
        console.error('Error loading data from localStorage:', error);
        return getDefaultData();
    }
}

function saveAppData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    }
}

export function addTask(taskData) {
    const data = getAppData();
    const newTask = {
        id: Date.now().toString(),
        description: taskData.description,
        time: taskData.time,
        endTime: taskData.endTime,
        days: taskData.days,
        reward: taskData.reward,
        enableNotifications: taskData.enableNotifications,
        completed: {}
    };
    data.tasks.push(newTask);
    saveAppData(data);
    return newTask;
}

export function updateTask(taskId, taskData) {
    const data = getAppData();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        data.tasks[taskIndex] = {
            ...data.tasks[taskIndex],
            description: taskData.description,
            time: taskData.time,
            endTime: taskData.endTime,
            days: taskData.days,
            reward: taskData.reward,
            enableNotifications: taskData.enableNotifications
        };
        saveAppData(data);
        return data.tasks[taskIndex];
    }
    return null;
}

export function deleteTask(taskId) {
    const data = getAppData();
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    saveAppData(data);
}

export function completeTask(taskId, dateStr) {
    const data = getAppData();
    const task = data.tasks.find(t => t.id === taskId);
    if (task) {
        if (!task.completed) {
            task.completed = {};
        }
        task.completed[dateStr] = true;
        saveAppData(data);
        return true;
    }
    return false;
}

export function uncompleteTask(taskId, dateStr) {
    const data = getAppData();
    const task = data.tasks.find(t => t.id === taskId);
if (task && task.completed && task.completed[dateStr]) {
        delete task.completed[dateStr];
        saveAppData(data);
        return true;
    }
    return false;
}

export function addCoin() {
    const data = getAppData();
    data.coins += 1;
    saveAppData(data);
    return data.coins;
}

export function removeCoin() {
    const data = getAppData();
    data.coins = Math.max(0, data.coins - 1);
    saveAppData(data);
    return data.coins;
}

export function getCoins() {
    const data = getAppData();
    return data.coins;
}

export function setCoins(amount) {
    const data = getAppData();
    data.coins = Math.max(0, amount);
    saveAppData(data);
    return data.coins;
}
