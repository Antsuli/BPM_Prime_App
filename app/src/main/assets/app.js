let count = 0;
let isRunning = false;
let hasFinished = false;
let startTime, timerId;
let lockedElapsed = 0;
const finishSound = new Audio('finish.mp3');

window.onload = () => {
    loadSettings();
    renderHistory();
};

function loadSettings() {
    // Load Theme
    const savedTheme = localStorage.getItem('theme') || 'theme-pink';
    document.body.className = savedTheme;

    // Load Timer
    const savedTimer = localStorage.getItem('timer-limit') || '15';
    document.getElementById('timer-input').value = savedTimer;
    document.getElementById('timer-display').innerText = "Ready";

    // Load Haptics
    const savedHaptics = localStorage.getItem('haptics-enabled');
    // Default to true if never set
    document.getElementById('haptic-toggle').checked = (savedHaptics !== 'false');
}


function saveTimerSetting() {
    const val = document.getElementById('timer-input').value;
    localStorage.setItem('timer-limit', val);
}

function saveHapticSetting() {
    const val = document.getElementById('haptic-toggle').checked;
    localStorage.setItem('haptics-enabled', val);
}
function toggleMenu(id) { document.getElementById(id).classList.toggle('active'); }
function toggleThemeMenu() { document.getElementById('theme-dropdown').classList.toggle('show'); }
function setTheme(t) {
    document.body.className = t;
    localStorage.setItem('theme', t);
    document.getElementById('theme-dropdown').classList.remove('show');
}

function adjust(n) {
    count += n;
    if (count < 0) count = 0;

    if (!lockedElapsed || lockedElapsed === 0) {
        lockedElapsed = parseInt(document.getElementById('timer-input').value) || 15;
    }

    let adjustedBpm = Math.round((count / lockedElapsed) * 60);

    document.getElementById('count-display').innerText = count;
    document.getElementById('popup-bpm').innerText = adjustedBpm;
    document.getElementById('popup-taps').innerText = count;

    // --- FIXED KEY NAME HERE ---
    let history = JSON.parse(localStorage.getItem('history')) || [];

    if (history.length > 0) {
        // Update the most recent entry
        history[0].bpm = adjustedBpm;

        // Also update the 'taps' if you want to store them,
        // though your renderHistory doesn't currently show them.
        history[0].taps = count;

        localStorage.setItem('history', JSON.stringify(history));
        renderHistory();
    }
}

function updateLastHistoryEntry(newBpm, newTaps) {
    let history = JSON.parse(localStorage.getItem('bpm-history')) || [];
    if (history.length > 0) {
        // Update the very last item in the array
        history[0].bpm = newBpm;
        history[0].taps = newTaps;
        localStorage.setItem('bpm-history', JSON.stringify(history));
        renderHistory(); // Refresh the list on the screen
    }
}

function closePopup() {
    document.getElementById('finish-popup').style.display = 'none';
    count = 0;
    isRunning = false;
    hasFinished = false; // Add this line to unlock the button for the next round!
    document.getElementById('count-display').innerText = "0";
    document.getElementById('bpm-result').innerText = "-- BPM";
    document.getElementById('timer-display').innerText = "Ready";
}

const tapBtn = document.getElementById('tap-btn');

tapBtn.onclick = () => {
    if (document.getElementById('finish-popup').style.display === 'flex') return;

    // 1. Haptics
    try {
        const toggle = document.getElementById('haptic-toggle');
        if (toggle && toggle.checked && navigator.vibrate) navigator.vibrate(40);
    } catch (e) {}

    // 2. Start Logic
    if (!isRunning && !hasFinished) {
        isRunning = true;
        startTime = Date.now();
        let timeLimit = parseInt(document.getElementById('timer-input').value) || 15;

        timerId = setInterval(() => {
            let elapsed = (Date.now() - startTime) / 1000;
            let remaining = timeLimit - elapsed;

            if (remaining <= 0) {
                document.getElementById('timer-display').innerText = "0s";
                finalize();
            } else {
                document.getElementById('timer-display').innerText = Math.ceil(remaining) + "s";
            }
        }, 100);
    }

    // 3. Increment Count
    if (!hasFinished) {
        count++;
        document.getElementById('count-display').innerText = count;

        let timeLimit = parseInt(document.getElementById('timer-input').value) || 15;
        let projectedBpm = Math.round((count / timeLimit) * 60);
        document.getElementById('bpm-result').innerText = projectedBpm + " BPM";
    }
};

function finalize() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    isRunning = false;
    hasFinished = true;

    try { finishSound.play(); } catch(e) {}

    lockedElapsed = (Date.now() - startTime) / 1000;
    if (lockedElapsed < 0.5) lockedElapsed = 0.5;

    let finalBpm = Math.round((count / lockedElapsed) * 60);

    document.getElementById('popup-bpm').innerText = finalBpm;
    document.getElementById('popup-taps').innerText = count;

    // Safety Delay for the Save button
    const popup = document.getElementById('finish-popup');
    const saveBtn = popup.querySelector('.close-btn');
    popup.style.display = 'flex';

    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.4';
    saveBtn.innerText = 'WAIT...';

    setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
        saveBtn.innerText = 'SAVE & DONE';
    }, 1500);

    document.getElementById('timer-display').innerText = "Finished";
    saveHistory(finalBpm);
}

function finishEarly() { if (isRunning) finalize(); }

function saveHistory(bpm) {
    let history = JSON.parse(localStorage.getItem('history') || '[]');
    // Added 'taps: count' here
    history.unshift({
        bpm,
        taps: count,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    history = history.slice(0, 10);
    localStorage.setItem('history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    list.innerHTML = history.map(i => `
        <div class="history-item">
            <span>${i.time}</span>
            <strong>${i.bpm} BPM</strong>
        </div>`).join('');
}

function clearHistory() {
    if (confirm("Are you sure?")) {
        localStorage.removeItem('history');
        renderHistory();
    }
}

renderHistory();