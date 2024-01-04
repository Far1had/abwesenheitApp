let users = [];
let userStatus = {};
let rtcPeerConnections = {};

function addUser() {
    const nameInput = document.getElementById('nameInput');
    const userName = nameInput.value.trim();

    if (userName !== '' && !users.includes(userName)) {
        users.push(userName);
        userStatus[userName] = { online: false, lastChange: new Date() };
        updateList();
        updateStats();
        nameInput.value = '';

        // Initiiere WebRTC-Verbindung mit anderen Teilnehmern
        initiatePeerConnections(userName);
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

function initiatePeerConnections(userName) {
    users.forEach(otherUser => {
        if (otherUser !== userName && !rtcPeerConnections[otherUser]) {
            const peerConnection = new RTCPeerConnection();

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    // Sende das ICE-Kandidatenobjekt an den anderen Peer
                    sendIceCandidate(userName, otherUser, event.candidate);
                }
            };

            peerConnection.ondatachannel = event => {
                const dataChannel = event.channel;

                dataChannel.onmessage = event => {
                    const data = JSON.parse(event.data);

                    if (data.type === 'statusUpdate') {
                        // Aktualisiere den Status und sende es an alle Clients
                        const { user, online } = data.payload;
                        userStatus[user] = { online, lastChange: new Date() };
                        broadcastStatusUpdate();
                        updateList();
                        updateStats();
                    }
                };
            };

            rtcPeerConnections[otherUser] = peerConnection;

            // Erzeuge einen Data Channel für die Kommunikation
            const dataChannel = peerConnection.createDataChannel('statusChannel');
            rtcPeerConnections[otherUser].dataChannel = dataChannel;

            // Handshake für den Data Channel
            sendOffer(userName, otherUser);
        }
    });
}

function sendOffer(sender, receiver) {
    const peerConnection = rtcPeerConnections[receiver];
    
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            // Sende das Angebot an den anderen Peer
            sendOfferData(sender, receiver, peerConnection.localDescription);
        })
        .catch(error => console.error('Error creating offer:', error));
}

function sendOfferData(sender, receiver, offer) {
    const dataChannel = rtcPeerConnections[receiver].dataChannel;

    dataChannel.send(JSON.stringify({
        type: 'offer',
        payload: { sender, offer }
    }));
}

function sendIceCandidate(sender, receiver, candidate) {
    const dataChannel = rtcPeerConnections[receiver].dataChannel;

    dataChannel.send(JSON.stringify({
        type: 'iceCandidate',
        payload: { sender, candidate }
    }));
}

function markOnline() {
    const selectedUser = prompt('Welcher Teilnehmer ist online?');
    if (selectedUser && users.includes(selectedUser) && !userStatus[selectedUser].online) {
        userStatus[selectedUser] = { online: true, lastChange: new Date() };
        broadcastStatusUpdate();
        updateList();
        updateStats();
    }
}

function markOffline() {
    const selectedUser = prompt('Welcher Teilnehmer ist nicht online?');
    if (selectedUser && users.includes(selectedUser) && userStatus[selectedUser].online) {
        userStatus[selectedUser] = { online: false, lastChange: new Date() };
        broadcastStatusUpdate();
        updateList();
        updateStats();
    }
}

function broadcastStatusUpdate() {
    users.forEach(user => {
        const dataChannel = rtcPeerConnections[user]?.dataChannel;

        if (dataChannel) {
            dataChannel.send(JSON.stringify({
                type: 'statusUpdate',
                payload: { user, online: userStatus[user].online }
            }));
        }
    });
}

