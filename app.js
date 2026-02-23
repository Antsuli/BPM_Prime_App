let count = 0, isRunning = false, hasFinished = false, timerId, startTime, lockedElapsed = 0;
const finishSound = new Audio('finish.mp3');

window.onload = () => { loadSettings(); renderHistory(); };

// --- MENU LOGIC ---
function toggleMenu(id) { document.getElementById(id).classList.toggle('active'); }

function toggleDropdown(id) {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(d => { if(d.id !== id) d.classList.remove('show'); });
    document.getElementById(id).classList.toggle('show');
}

function setTheme(t) {
    document.body.className = t;
    localStorage.setItem('theme', t);
    document.getElementById('theme-dropdown').classList.remove('show');
}

function showMode(mode) {
    document.getElementById('view-tapper').style.display = (mode === 'tapper') ? 'flex' : 'none';
    document.getElementById('view-calc').style.display = (mode === 'calc') ? 'flex' : 'none';
    document.getElementById('modes-dropdown').classList.remove('show');
}
function calculateManual() {
    const s = parseFloat(document.getElementById('manual-sec').value);
    const t = parseFloat(document.getElementById('manual-taps').value);
    const res = document.getElementById('manual-res');

    if (s > 0 && t > 0) {
        res.innerText = Math.round((t / s) * 60) + " BPM";
        res.style.color = "var(--accent)"; // Adds that "pro" glow
    } else {
        res.innerText = "INVALID";
        res.style.color = "#ff4444";
    }
}

// --- TAPPER LOGIC ---
const tapBtn = document.getElementById('tap-btn');
tapBtn.onclick = () => {
    if (document.getElementById('finish-popup').style.display === 'flex') return;

    // Haptics
    const hapticOn = document.getElementById('haptic-toggle').checked;
    if (hapticOn && navigator.vibrate) navigator.vibrate(40);

    if (!isRunning && !hasFinished) {
        isRunning = true;
        startTime = Date.now();
        let limit = parseInt(document.getElementById('timer-input').value) || 15;
        timerId = setInterval(() => {
            let remain = limit - (Date.now() - startTime) / 1000;
            if (remain <= 0) finalize();
            else document.getElementById('timer-display').innerText = Math.ceil(remain) + "s";
        }, 100);
    }

    if (!hasFinished) {
        count++;
        document.getElementById('count-display').innerText = count;
        let limit = parseInt(document.getElementById('timer-input').value) || 15;
        document.getElementById('bpm-result').innerText = Math.round((count / limit) * 60) + " BPM";
    }
};

function finalize() {
    clearInterval(timerId);
    isRunning = false;
    hasFinished = true;
    try { finishSound.play(); } catch(e){}

    lockedElapsed = (Date.now() - startTime) / 1000;
    let bpm = Math.round((count / lockedElapsed) * 60);

    document.getElementById('popup-bpm').innerText = bpm;
    document.getElementById('popup-taps').innerText = count;
    document.getElementById('finish-popup').style.display = 'flex';
    document.getElementById('timer-display').innerText = "Finished";
    saveHistory(bpm);
}

function closePopup() {
    document.getElementById('finish-popup').style.display = 'none';
    count = 0; isRunning = false; hasFinished = false;
    document.getElementById('count-display').innerText = "0";
    document.getElementById('bpm-result').innerText = "-- BPM";
    document.getElementById('timer-display').innerText = "Ready";
}

function finishEarly() { if(isRunning) finalize(); }

// --- SETTINGS & HISTORY ---
function saveTimerSetting() { localStorage.setItem('timer-limit', document.getElementById('timer-input').value); }
function saveHapticSetting() { localStorage.setItem('haptics-enabled', document.getElementById('haptic-toggle').checked); }

function saveHistory(bpm) {
    let history = JSON.parse(localStorage.getItem('history') || '[]');
    history.unshift({ bpm, taps: count, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
    localStorage.setItem('history', JSON.stringify(history.slice(0, 10)));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    list.innerHTML = history.map(i => `<div class="history-item"><span>${i.time}</span><strong>${i.bpm} BPM</strong></div>`).join('');
}

function clearHistory() { if(confirm("Clear all?")) { localStorage.removeItem('history'); renderHistory(); } }

function loadSettings() {
    document.body.className = localStorage.getItem('theme') || 'theme-pink';
    document.getElementById('timer-input').value = localStorage.getItem('timer-limit') || '15';
    document.getElementById('haptic-toggle').checked = localStorage.getItem('haptics-enabled') !== 'false';
}

function adjust(n) {
    // 1. Update the internal count
    count = Math.max(0, count + n);

    // 2. Calculate the new BPM based on the locked time from the session
    // We use lockedElapsed so the math stays accurate to the time you actually tapped
    let adjustedBpm = Math.round((count / lockedElapsed) * 60);

    // 3. Update the Popup UI
    document.getElementById('popup-bpm').innerText = adjustedBpm;
    document.getElementById('popup-taps').innerText = count;

    // 4. Update the actual Save in LocalStorage
    let history = JSON.parse(localStorage.getItem('history') || '[]');

    if (history.length > 0) {
        // Update the most recent entry (the one at the top)
        history[0].bpm = adjustedBpm;
        history[0].taps = count;

        // Save it back to the phone
        localStorage.setItem('history', JSON.stringify(history));

        // Refresh the history list in the side panel
        renderHistory();
    }
}