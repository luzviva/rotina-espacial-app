import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVgHZ4lhNGmfePT5HHpRGNAdlI5Y_OdBM",
  authDomain: "rotina-espacial-app.firebaseapp.com",
  projectId: "rotina-espacial-app",
  storageBucket: "rotina-espacial-app.firebasestorage.app",
  messagingSenderId: "484210967340",
  appId: "1:484210967340:web:6b12db360af17939886289"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tasksCol = collection(db, "tasks");
const appStateDocRef = doc(db, "appState", "coins_state");

export async function addTask(taskData) {
    try {
        const docRef = await addDoc(tasksCol, {
            description: taskData.description,
            time: taskData.time,
            endTime: taskData.endTime || null,
            days: taskData.days,
            reward: taskData.reward,
            enableNotifications: taskData.enableNotifications,
            completed: {}
        });
        return { id: docRef.id, ...taskData, completed: {} };
    } catch (e) {
        console.error("Error adding task: ", e);
        throw e;
    }
}

export async function getTasks() {
    try {
        const taskSnapshot = await getDocs(tasksCol);
        return taskSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        console.error("Error loading tasks: ", e);
        throw e;
    }
}

export async function updateTask(taskId, taskData) {
    try {
        const taskDocRef = doc(db, "tasks", taskId);
        await updateDoc(taskDocRef, {
            description: taskData.description,
            time: taskData.time,
            endTime: taskData.endTime || null,
            days: taskData.days,
            reward: taskData.reward,
            enableNotifications: taskData.enableNotifications
        });
    } catch (e) {
        console.error("Error updating task: ", e);
        throw e;
    }
}

export async function deleteTask(taskId) {
    try {
        const taskDocRef = doc(db, "tasks", taskId);
        await deleteDoc(taskDocRef);
    } catch (e) {
        console.error("Error deleting task: ", e);
        throw e;
    }
}

export async function completeTask(taskId, dateStr) {
    try {
        const taskDocRef = doc(db, "tasks", taskId);
        await setDoc(taskDocRef, { 
            completed: { [dateStr]: true }
        }, { merge: true });
    } catch (e) {
        console.error(`Error completing task ${taskId}: `, e);
        throw e;
    }
}

export async function uncompleteTask(taskId, dateStr) {
     try {
        const taskDocRef = doc(db, "tasks", taskId);
        const taskSnap = await getDoc(taskDocRef);
        if (!taskSnap.exists()) {
            console.warn(`Task ${taskId} not found.`);
            return;
        }
        const taskData = taskSnap.data();
        if (taskData.completed && taskData.completed[dateStr]) {
            delete taskData.completed[dateStr];
            await updateDoc(taskDocRef, { 
                completed: taskData.completed
            });
        }
    } catch (e) {
        console.error(`Error uncompleting task ${taskId}: `, e);
        throw e;
    }
}

export async function getCoins() {
    try {
        const docSnap = await getDoc(appStateDocRef);
        if (docSnap.exists()) {
            return docSnap.data().coins || 0;
        } else {
            await setCoins(0);
            return 0;
        }
    } catch (e) {
        console.error("Error getting coins: ", e);
        throw e;
    }
}

export async function addCoin() {
    try {
        await setDoc(appStateDocRef, {
            coins: increment(1)
        }, { merge: true });
    } catch (e) {
        console.error("Error adding coin: ", e);
        throw e;
    }
}

export async function removeCoin() {
     try {
        const docSnap = await getDoc(appStateDocRef);
        if (docSnap.exists()) {
            const currentCoins = docSnap.data().coins || 0;
            if (currentCoins > 0) {
                 await updateDoc(appStateDocRef, {
                    coins: increment(-1)
                });
            }
        }
    } catch (e) {
        console.error("Error removing coin: ", e);
        throw e;
    }
}

export async function setCoins(amount) {
     try {
         const safeAmount = Math.max(0, amount);
        await setDoc(appStateDocRef, {
            coins: safeAmount
        }, { merge: true });
    } catch (e) {
        console.error("Error setting coins: ", e);
        throw e;
    }
}

export function listenForTasks(callback) {
    return onSnapshot(tasksCol, (snapshot) => {
        const tasksList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(tasksList);
    }, (error) => {
        console.error("Error in tasks listener:", error);
    });
}

export function listenForCoins(callback) {
     return onSnapshot(appStateDocRef, (docSnap) => {
        const currentCoins = docSnap.exists() ? docSnap.data().coins || 0 : 0;
        callback(currentCoins);
    }, (error) => {
        console.error("Error in coins listener:", error);
     });
}
