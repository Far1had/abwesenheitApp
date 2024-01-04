const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const userStatus = {};

wss.on('connection', (ws) => {
  // Verbindungsherstellung mit einem Client

  // Sende aktuelle Statusdaten an den verbundenen Client
  ws.send(JSON.stringify({ type: 'initial', data: userStatus }));

  ws.on('message', (message) => {
    // Nachrichten von Clients verarbeiten
    const data = JSON.parse(message);

    if (data.type === 'statusUpdate') {
      // Aktualisiere den Status und sende es an alle Clients
      const { user, online } = data.payload;
      userStatus[user] = { online, lastChange: new Date() };
      broadcast({ type: 'statusUpdate', data: userStatus });
    }
  });
});

function broadcast(data) {
  // Sende Daten an alle verbundenen Clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(3000, () => {
  console.log('Server gestartet auf http://localhost:3000');
});
