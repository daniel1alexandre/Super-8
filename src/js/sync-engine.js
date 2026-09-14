/**
 * SUPER BEACH TENNIS — MOTOR DE SINCRONIZAÇÃO EM TEMPO REAL (FIREBASE + LOCAL)
 * Sincroniza simultaneamente entre aparelhos na Vercel (via Firebase) ou em rede local (via WebSocket).
 */

class SyncEngine {
  constructor() {
    this.clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    this.mode = 'idle'; // 'firebase' | 'local'
    this.ws = null;
    this.status = 'disconnected'; // 'connected' | 'reconnecting' | 'offline'
    this.connectedClients = 1;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 10000;
    this.heartbeatTimer = null;
    this.serverInfo = null;
    this._hasInitialSync = false;
    this._listeners = {};

    this.init();
  }

  /* ─── INICIALIZAÇÃO ─────────────────────────────────── */

  init() {
    // 1. Tenta inicializar via Firebase Realtime Database (ideal para Vercel e Nuvem)
    if (window.FirebaseConfig && window.FirebaseConfig.isReady()) {
      this.initFirebase();
      return;
    }

    // 2. Se não houver Firebase configurado e estiver rodando em servidor HTTP local
    if (window.location.protocol.startsWith('http')) {
      this.initLocalServer();
    } else {
      this.updateStatus('offline');
    }

    // Detecta retorno de aba ou conexão
    window.addEventListener('online', () => {
      if (this.status !== 'connected') this.reconnect();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.status !== 'connected') {
        this.reconnect();
      }
    });
  }

  reconnect() {
    if (this.mode === 'firebase') {
      if (window.firebaseDb) this.updateStatus('connected');
    } else if (this.mode === 'local') {
      this.connectWebSocket();
    }
  }

  /* ─── MODO NUVEM: FIREBASE REALTIME DATABASE ───────── */

  initFirebase() {
    this.mode = 'firebase';
    const db = window.firebaseDb;
    if (!db) return;

    this.updateStatus('connected');

    // ── Rastreamento de Presença (Contador de aparelhos conectados) ──
    const presenceRef = db.ref('superbt/presence/' + this.clientId);
    const connectedRef = db.ref('.info/connected');

    connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        presenceRef.onDisconnect().remove();
        presenceRef.set({
          clientId: this.clientId,
          onlineAt: Date.now()
        });
        this.updateStatus('connected');
      } else {
        this.updateStatus('reconnecting');
      }
    });

    const allPresenceRef = db.ref('superbt/presence');
    allPresenceRef.on('value', (snap) => {
      const val = snap.val();
      const count = val ? Object.keys(val).length : 1;
      this.updateClientCount(count);
    });

    // ── Escuta de Torneios em Tempo Real ───────────────
    const tournRef = db.ref('superbt/tournaments');
    tournRef.on('value', (snapshot) => {
      const payload = snapshot.val();
      if (payload && payload.state) {
        // Ignora eco enviado por este próprio aparelho
        if (payload.senderId === this.clientId) return;

        window.dispatchEvent(new CustomEvent('superbt:remote-sync', {
          detail: {
            state: payload.state,
            timestamp: payload.timestamp,
            senderId: payload.senderId,
            isInitial: !this._hasInitialSync
          }
        }));
        this._hasInitialSync = true;
      }
    });

    // ── Escuta de Usuários em Tempo Real ────────────────
    const authRef = db.ref('superbt/auth');
    authRef.on('value', (snapshot) => {
      const payload = snapshot.val();
      if (payload && payload.authData) {
        if (payload.senderId === this.clientId) return;

        window.dispatchEvent(new CustomEvent('superbt:auth-sync', {
          detail: {
            authData: payload.authData,
            timestamp: payload.timestamp,
            senderId: payload.senderId,
            isInitial: true
          }
        }));
      }
    });
  }

  /* ─── MODO LOCAL: WEBSOCKET & REST NO SERVER.JS ────── */

  initLocalServer() {
    this.mode = 'local';
    this.fetchServerInfo().then(() => {
      this.connectWebSocket();
    }).catch(() => {
      this.connectWebSocket();
    });
  }

  getWsUrl() {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}/ws`;
    }
    return 'ws://localhost:3000/ws';
  }

  connectWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.getWsUrl();
    this.updateStatus('reconnecting');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleIncomingMessage(msg);
        } catch (err) {}
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.updateStatus('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        try { this.ws.close(); } catch (e) {}
      };
    } catch (err) {
      this.updateStatus('offline');
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    setTimeout(() => {
      if (this.mode === 'local') this.connectWebSocket();
    }, delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', senderId: this.clientId }));
      }
    }, 20000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  handleIncomingMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.senderId && msg.senderId === this.clientId) return;

    switch (msg.type) {
      case 'init_sync':
        if (msg.clientCount) this.updateClientCount(msg.clientCount);
        if (msg.state) {
          window.dispatchEvent(new CustomEvent('superbt:remote-sync', {
            detail: { state: msg.state, isInitial: true, timestamp: msg.timestamp }
          }));
        }
        if (msg.authData) {
          window.dispatchEvent(new CustomEvent('superbt:auth-sync', {
            detail: { authData: msg.authData, isInitial: true }
          }));
        }
        break;

      case 'state_update':
        if (msg.state) {
          window.dispatchEvent(new CustomEvent('superbt:remote-sync', {
            detail: { state: msg.state, timestamp: msg.timestamp, senderId: msg.senderId }
          }));
        }
        break;

      case 'auth_update':
        if (msg.data) {
          window.dispatchEvent(new CustomEvent('superbt:auth-sync', {
            detail: { authData: msg.data, timestamp: msg.timestamp, senderId: msg.senderId }
          }));
        }
        break;

      case 'client_count':
        if (typeof msg.count === 'number') {
          this.updateClientCount(msg.count);
        }
        break;
    }
  }

  /* ─── ENVIO DE DADOS (TRANSPARENTE PARA OS DOIS MODOS) ─ */

  sendStateUpdate(state) {
    const payload = {
      state: state,
      senderId: this.clientId,
      timestamp: Date.now()
    };

    // 1. Envia para o Firebase se estiver ativo
    if (this.mode === 'firebase' && window.firebaseDb) {
      try {
        window.firebaseDb.ref('superbt/tournaments').set(payload);
        return;
      } catch (e) {
        console.warn('[SyncEngine] Erro ao gravar no Firebase:', e);
      }
    }

    // 2. Envia para o WebSocket local
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'state_update', ...payload }));
        return;
      } catch (err) {}
    }

    // 3. Fallback REST POST
    if (window.location.protocol.startsWith('http')) {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  }

  sendAuthUpdate(authData) {
    const payload = {
      authData: authData,
      senderId: this.clientId,
      timestamp: Date.now()
    };

    if (this.mode === 'firebase' && window.firebaseDb) {
      try {
        window.firebaseDb.ref('superbt/auth').set(payload);
        return;
      } catch (e) {}
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'auth_update', data: authData, senderId: this.clientId }));
        return;
      } catch (err) {}
    }

    if (window.location.protocol.startsWith('http')) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: authData, senderId: this.clientId })
      }).catch(() => {});
    }
  }

  /* ─── STATUS & AUXILIARES ───────────────────────────── */

  updateStatus(newStatus) {
    this.status = newStatus;
    window.dispatchEvent(new CustomEvent('superbt:sync-status', {
      detail: { status: this.status, clients: this.connectedClients, mode: this.mode }
    }));
  }

  updateClientCount(count) {
    this.connectedClients = Math.max(1, count);
    window.dispatchEvent(new CustomEvent('superbt:sync-clients', {
      detail: { count: this.connectedClients, mode: this.mode }
    }));
  }

  async fetchServerInfo() {
    if (!window.location.protocol.startsWith('http')) return null;
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const info = await res.json();
        this.serverInfo = info;
        if (info.connectedClients) this.updateClientCount(info.connectedClients);
        return info;
      }
    } catch (e) {}
    return null;
  }
}

// Instância global única
window.syncEngine = new SyncEngine();
