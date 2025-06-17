import * as framerMotion from 'https://esm.run/framer-motion';

const daysMap = {
    dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb'
};
const dayKeysInOrder = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export function createTaskCard(task, dateStr) {
    const isCompleted = task.completed && task.completed[dateStr];
    
    const card = document.createElement('div');
    card.className = `task-card ${isCompleted ? 'completed' : ''}`;
    card.dataset.taskId = task.id;

    let rewardIcon = '';
    if (task.reward) {
        rewardIcon = `<img src="https://r2.flowith.net/files/o/1749768887371-star_coin_icon_for_children's_space-themed_rewards_system_index_1@1024x1024.png" alt="Recompensa" class="reward-star inline-block ml-2">`;
    }

    const actionButtonHTML = isCompleted 
        ? `<button class="undo-btn bg-yellow-600 hover:bg-yellow-500 rounded-full p-3 sm:p-4 flex items-center justify-center transition-all duration-300 hover:shadow-yellow-500/40">
             <i data-lucide="rotate-ccw" class="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white"></i>
           </button>`
        : `<button class="complete-btn bg-green-600 hover:bg-green-500 rounded-full p-3 sm:p-4 flex items-center justify-center transition-all duration-300 hover:shadow-green-500/40">
             <i data-lucide="check" class="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10"></i>
           </button>`;

    const timeString = task.endTime ? `${task.time} - ${task.endTime}` : task.time;
    card.innerHTML = `
        <div class="flex-grow space-y-2">
            <p class="task-time">${timeString}</p>
            <p class="task-description">${task.description} ${rewardIcon}</p>
        </div>
        <div class="task-actions">
            ${actionButtonHTML}
        </div>
    `;

    return card;
}

function createAdminTaskRow(task, onEdit, onDelete) {
    const row = document.createElement('div');
    row.className = 'bg-black bg-opacity-40 p-3 sm:p-4 rounded-lg flex items-center justify-between transition-all duration-300 hover:bg-opacity-60';
    row.dataset.taskId = task.id;

    const daysString = task.days.map(d => daysMap[d] || d).join(', ');
    const timeString = task.endTime ? `${task.time} - ${task.endTime}` : task.time;

    row.innerHTML = `
        <div class="flex-grow">
            <p class="font-bold text-base sm:text-lg">${timeString} - ${task.description}</p>
            <p class="text-xs sm:text-sm text-cyan-200">${daysString}</p>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
            ${task.reward ? '<i data-lucide="star" class="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5"></i>' : ''}
            ${task.enableNotifications ? '<i data-lucide="bell" class="text-purple-400 w-4 h-4 sm:w-5 sm:h-5"></i>' : ''}
            <button data-task-id="${task.id}" class="edit-btn p-2 text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:scale-110"><i data-lucide="pencil" class="pointer-events-none w-4 h-4 sm:w-5 sm:h-5"></i></button>
            <button data-task-id="${task.id}" class="delete-btn p-2 text-red-500 hover:text-red-400 transition-colors duration-200 hover:scale-110"><i data-lucide="trash-2" class="pointer-events-none w-4 h-4 sm:w-5 sm:h-5"></i></button>
        </div>
    `;
    
    row.querySelector('.edit-btn').addEventListener('click', onEdit);
    row.querySelector('.delete-btn').addEventListener('click', onDelete);
    return row;
}

export function renderAdminView(tasks, onEdit, onDelete) {
    const adminTaskList = document.getElementById('admin-task-list');
    adminTaskList.innerHTML = '';
    
    if (tasks.length === 0) {
        adminTaskList.innerHTML = `<div class="text-center text-gray-400 p-8">Nenhuma tarefa para este dia.</div>`;
    } else {
        tasks.forEach((task, index) => {
            const row = createAdminTaskRow(task, onEdit, onDelete);
            row.style.animationDelay = `${index * 0.05}s`;
            row.style.animation = 'task-card-entrance 0.4s ease-out forwards';
            adminTaskList.appendChild(row);
        });
    }
    lucide.createIcons();
}

export function switchView(viewName) {
    const childView = document.getElementById('child-view');
    const adminView = document.getElementById('admin-view');
    
    if (viewName === 'admin') {
        if (!childView.classList.contains('hidden')) {
            childView.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                childView.classList.add('hidden');
                adminView.classList.remove('hidden');
                adminView.classList.add('flex');
                adminView.style.animation = 'fadeIn 0.3s ease-out forwards';
            }, 300);
        }
    } else {
        if (!adminView.classList.contains('hidden')) {
            adminView.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                adminView.classList.add('hidden');
                adminView.classList.remove('flex');
                childView.classList.remove('hidden');
                childView.classList.add('flex');
                childView.style.animation = 'fadeIn 0.3s ease-out forwards';
            }, 300);
        }
    }
}

export function setupAdminFormDays() {
    const container = document.getElementById('task-days');
    container.innerHTML = '';
    Object.entries(daysMap).forEach(([key, value]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'day-btn';
        button.dataset.day = key;
        button.textContent = value;
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            if (button.classList.contains('selected')) {
                button.style.animation = 'bounce 0.4s ease-out';
            }
        });
        container.appendChild(button);
    });
}

export function createDaySelector(containerId, dayClickHandler, cssClass) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    dayKeysInOrder.forEach(key => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = cssClass;
        button.dataset.day = key;
        button.textContent = daysMap[key];
        button.addEventListener('click', dayClickHandler);
        container.appendChild(button);
    });
}

export function updateDaySelector(containerId, selectedDayKey) {
    const buttons = document.querySelectorAll(`#${containerId} > button`);
    buttons.forEach(btn => {
        if (btn.dataset.day === selectedDayKey) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}


export function populateEditForm(task) {
    document.getElementById('form-title').textContent = "Editar Tarefa";
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-time').value = task.time;
    document.getElementById('endTime').value = task.endTime || '';
    document.getElementById('task-reward').checked = task.reward;
    document.getElementById('enableNotifications').checked = task.enableNotifications || false;

    document.querySelectorAll('#task-days .day-btn').forEach(btn => {
        if (task.days.includes(btn.dataset.day)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    const submitBtn = document.getElementById('form-submit-btn');
    submitBtn.innerHTML = `<i data-lucide="save" class="mr-2"></i> Salvar Alterações`;
    submitBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
    submitBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');

    document.getElementById('form-cancel-btn').classList.remove('hidden');
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function resetFormUI() {
    document.getElementById('form-title').textContent = "Adicionar Nova Tarefa";
    document.getElementById('task-id').value = '';
    const submitBtn = document.getElementById('form-submit-btn');
    submitBtn.innerHTML = `<i data-lucide="plus-circle" class="mr-2"></i> Adicionar Tarefa`;
    submitBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
    submitBtn.classList.add('bg-green-600', 'hover:bg-green-500');

    document.getElementById('form-cancel-btn').classList.add('hidden');
    lucide.createIcons();
}

export function showRewardAnimation(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const coinCounter = document.getElementById('coin-counter').getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const endX = coinCounter.left + coinCounter.width / 2;
    const endY = coinCounter.top + coinCounter.height / 2;

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'reward-particle';
        document.body.appendChild(particle);

        const randomX = (Math.random() - 0.5) * 100;
        const randomY = (Math.random() - 0.5) * 100;

        particle.style.left = `${startX + randomX}px`;
        particle.style.top = `${startY + randomY}px`;

        const keyframes = [
            { 
                transform: 'translate(0, 0) scale(1) rotate(0deg)', 
                opacity: 1,
                filter: 'brightness(1)'
            },
            { 
                transform: `translate(${(endX - startX - randomX) * 0.5}px, ${(endY - startY - randomY) * 0.5}px) scale(1.3) rotate(180deg)`, 
                opacity: 0.9,
                filter: 'brightness(1.5)',
                offset: 0.5
            },
            { 
                transform: `translate(${endX - startX - randomX}px, ${endY - startY - randomY}px) scale(0.3) rotate(360deg)`, 
                opacity: 0,
                filter: 'brightness(2)'
            }
        ];
        
        const options = {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            delay: i * 80
        };

        particle.animate(keyframes, options).onfinish = () => {
            particle.remove();
        };
    }

    const coinCounterElement = document.getElementById('coin-counter');
    coinCounterElement.style.animation = 'none';
    setTimeout(() => {
        coinCounterElement.style.animation = 'star-pulse 0.6s ease-out';
    }, 10);
}

export function animateCoinUpdate(newCoinCount) {
    const coinTotalElement = document.getElementById('coin-total');
    const currentCount = parseInt(coinTotalElement.textContent) || 0;
    
    if (newCoinCount !== currentCount) {
        const duration = 500;
        const steps = Math.abs(newCoinCount - currentCount);
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        const interval = setInterval(() => {
            const progress = currentStep / steps;
            const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            const displayValue = Math.round(currentCount + (newCoinCount - currentCount) * easeProgress);
            
            coinTotalElement.textContent = displayValue;
            coinTotalElement.style.transform = `scale(${1 + Math.sin(progress * Math.PI) * 0.2})`;
            
            currentStep++;
            if (currentStep >= steps) {
                clearInterval(interval);
                coinTotalElement.textContent = newCoinCount;
                coinTotalElement.style.transform = 'scale(1)';
            }
        }, stepDuration);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
    
    @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
        40%, 43% { transform: translate3d(0,-8px,0); }
        70% { transform: translate3d(0,-4px,0); }
        90% { transform: translate3d(0,-2px,0); }
    }
`;
document.head.appendChild(style);
