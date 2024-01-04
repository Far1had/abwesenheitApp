let users = [];
let userStatus = {}; // Hier wird der Online-/Offline-Status mit Zeit festgehalten

function addUser() {
    const nameInput = document.getElementById('nameInput');
    const userName = nameInput.value.trim();

    if (userName !== '' && !users.includes(userName)) {
        users.push(userName);
        userStatus[userName] = { online: false, lastChange: new Date() };
        updateList();
        updateStats();
        nameInput.value = '';
    }
}

function updateList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    
    users.forEach(user => {
        const li = document.createElement('li');
        const status = userStatus[user].online ? 'Online' : 'Nicht Online';
        li.textContent = `${user} (${status} seit ${userStatus[user].lastChange.toLocaleTimeString()})`;
        userList.appendChild(li);
    });
}

function updateStats() {
    const onlineCount = document.getElementById('onlineCount');
    const offlineCount = document.getElementById('offlineCount');

    onlineCount.textContent = users.filter(user => userStatus[user].online).length;
    offlineCount.textContent = users.filter(user => !userStatus[user].online).length;
}

function markOnline() {
    const selectedUser = prompt('Welcher Teilnehmer ist online?');
    if (selectedUser && users.includes(selectedUser)) {
        userStatus[selectedUser] = { online: true, lastChange: new Date() };
        updateList();
        updateStats();
    }
}

function markOffline() {
    const selectedUser = prompt('Welcher Teilnehmer ist nicht online?');
    if (selectedUser && users.includes(selectedUser)) {
        userStatus[selectedUser] = { online: false, lastChange: new Date() };
        updateList();
        updateStats();
    }
}

function saveToFile() {
    const dataToSave = users.map(user => `${user}: ${userStatus[user].online ? 'Online' : 'Nicht Online'} seit ${userStatus[user].lastChange.toLocaleTimeString()}`).join('\n');
    const blob = new Blob([dataToSave], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'anwesenheit.txt';
    a.click();
}
