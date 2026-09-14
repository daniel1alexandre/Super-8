const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'tournaments.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

// Garante que a pasta de persistência existe
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// ── Funções de Persistência em Disco ──────────────────
function readJsonFile(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) return JSON.parse(content);
    }
  } catch (err) {
    console.error(`[Persistência] Erro lendo ${path.basename(filePath)}:`, err.message);
  }
  return defaultValue;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[Persistência] Erro gravando ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

// ── Detecção de IPs da Rede Local (Wi-Fi / Ethernet) ──
function getLocalIpAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

// ── Gerenciamento de Conexões WebSocket ───────────────
const wsClients = new Set();

function broadcast(messageObj, originSocket = null) {
  const payload = JSON.stringify(messageObj);
  const frame = encodeWsTextFrame(payload);

  for (const client of wsClients) {
    if (client !== originSocket && client.writable) {
      try {
        client.write(frame);
      } catch (err) {
        wsClients.delete(client);
      }
    }
  }
}

function broadcastClientCount() {
  const count = wsClients.size;
  const frame = encodeWsTextFrame(JSON.stringify({
    type: 'client_count',
    count: count
  }));
  for (const client of wsClients) {
    if (client.writable) {
      try { client.write(frame); } catch (e) { wsClients.delete(client); }
    }
  }
}

// ── Codificação de Frames WebSocket (Servidor -> Cliente) ──
function encodeWsTextFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const length = payload.length;

  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + Text
    header[1] = length;
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

// ── Servidor HTTP Principal ───────────────────────────
const server = http.createServer((req, res) => {
  // CORS Headers para compatibilidade ampla
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = req.url.split('?')[0];

  // ── Endpoints da API ─────────────────────────────────
  if (reqUrl === '/api/info' && req.method === 'GET') {
    const localIps = getLocalIpAddresses();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      serverTime: Date.now(),
      port: PORT,
      localIps: localIps,
      primaryUrl: localIps.length > 0 ? `http://${localIps[0]}:${PORT}` : `http://localhost:${PORT}`,
      connectedClients: wsClients.size
    }));
    return;
  }

  if (reqUrl === '/api/state') {
    if (req.method === 'GET') {
      const state = readJsonFile(STATE_FILE, null);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, state }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.state) {
            writeJsonFile(STATE_FILE, parsed.state);
            broadcast({
              type: 'state_update',
              state: parsed.state,
              senderId: parsed.senderId || null,
              timestamp: Date.now()
            });
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true }));
            return;
          }
        } catch (e) {}
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
      });
      return;
    }
  }

  if (reqUrl === '/api/auth') {
    if (req.method === 'GET') {
      const authData = readJsonFile(AUTH_FILE, null);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, data: authData }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.data) {
            writeJsonFile(AUTH_FILE, parsed.data);
            broadcast({
              type: 'auth_update',
              data: parsed.data,
              senderId: parsed.senderId || null,
              timestamp: Date.now()
            });
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true }));
            return;
          }
        } catch (e) {}
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
      });
      return;
    }
  }

  // ── Servir Arquivos Estáticos ─────────────────────────
  let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Não Encontrado');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Erro no servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// ── Upgrade para WebSocket RFC 6455 ───────────────────
server.on('upgrade', (req, socket, head) => {
  const upgradeHeader = req.headers['upgrade'] || '';
  if (upgradeHeader.toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }

  const secWsKey = req.headers['sec-websocket-key'];
  if (!secWsKey) {
    socket.destroy();
    return;
  }

  const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
  const acceptKey = crypto
    .createHash('sha1')
    .update(secWsKey + GUID)
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.join('\r\n') + '\r\n\r\n');
  wsClients.add(socket);

  // Notifica todos da nova contagem
  broadcastClientCount();

  // Envia estado atual inicial logo após conexão
  const currentState = readJsonFile(STATE_FILE, null);
  const currentAuth = readJsonFile(AUTH_FILE, null);
  socket.write(encodeWsTextFrame(JSON.stringify({
    type: 'init_sync',
    state: currentState,
    authData: currentAuth,
    clientCount: wsClients.size,
    timestamp: Date.now()
  })));

  // Parser de mensagens recebidas via WebSocket
  let buffer = Buffer.alloc(0);

  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 2) {
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      const opcode = firstByte & 0x0f;
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLen = secondByte & 0x7f;

      let offset = 2;
      if (payloadLen === 126) {
        if (buffer.length < offset + 2) break;
        payloadLen = buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLen === 127) {
        if (buffer.length < offset + 8) break;
        payloadLen = Number(buffer.readBigUInt64BE(offset));
        offset += 8;
      }

      let maskKey = null;
      if (isMasked) {
        if (buffer.length < offset + 4) break;
        maskKey = buffer.slice(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + payloadLen) break;

      const payload = buffer.slice(offset, offset + payloadLen);
      buffer = buffer.slice(offset + payloadLen);

      // Tratamento de Close
      if (opcode === 0x08) {
        socket.end();
        wsClients.delete(socket);
        broadcastClientCount();
        return;
      }

      // Tratamento de Ping
      if (opcode === 0x09) {
        const pong = Buffer.alloc(2);
        pong[0] = 0x8a;
        pong[1] = 0x00;
        socket.write(pong);
        continue;
      }

      // Tratamento de Mensagem de Texto
      if (opcode === 0x01) {
        if (maskKey) {
          for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskKey[i % 4];
          }
        }
        const textMessage = payload.toString('utf8');
        try {
          const msg = JSON.parse(textMessage);

          if (msg.type === 'state_update' && msg.state) {
            writeJsonFile(STATE_FILE, msg.state);
            broadcast({
              type: 'state_update',
              state: msg.state,
              senderId: msg.senderId || null,
              timestamp: Date.now()
            }, socket);
          } else if (msg.type === 'auth_update' && msg.data) {
            writeJsonFile(AUTH_FILE, msg.data);
            broadcast({
              type: 'auth_update',
              data: msg.data,
              senderId: msg.senderId || null,
              timestamp: Date.now()
            }, socket);
          } else if (msg.type === 'ping') {
            socket.write(encodeWsTextFrame(JSON.stringify({ type: 'pong', timestamp: Date.now() })));
          }
        } catch (err) {
          console.error('[WebSocket] Erro ao processar mensagem JSON:', err.message);
        }
      }
    }
  });

  socket.on('error', () => {
    wsClients.delete(socket);
    broadcastClientCount();
  });

  socket.on('close', () => {
    wsClients.delete(socket);
    broadcastClientCount();
  });
});

// ── Inicialização do Servidor ─────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log('\n╔═════════════════════════════════════════════════════════════════════════╗');
  console.log('║       🎾  SUPER BEACH TENNIS — SERVIDOR MULTI-APARELHOS ATIVO  🎾       ║');
  console.log('╠═════════════════════════════════════════════════════════════════════════╣');
  console.log(`║ 💻 Neste Computador:        http://localhost:${PORT}                      ║`);
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      const url = `http://${ip}:${PORT}`;
      console.log(`║ 📱 Celulares / Tablets:     ${url.padEnd(44)}║`);
    });
  } else {
    console.log(`║ 📱 Celulares / Tablets:     Conecte ao Wi-Fi para ver o IP local       ║`);
  }
  console.log('╠═════════════════════════════════════════════════════════════════════════╣');
  console.log('║ ⚡ Sincronização simultânea em tempo real ativa (WebSocket + REST)      ║');
  console.log('║ 💾 Persistência em disco: pasta /data/ (torneios e usuários salvos)      ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════╝\n');
});
