/**
 * SUPER BEACH TENNIS — MOTOR DE SINCRONIZAÇÃO EM TEMPO REAL (MULTI-APARELHOS)
 * Sincroniza simultaneamente alterações entre celulares, tablets, notebooks e TVs.
 */

class SyncEngine {
  constructor() {
    this.clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    this.ws = null;
    this.status = 'disconnected'; // 'connected' | 'reconnecting' | 'offline'
    this.connectedClients = 1;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 10000;
    this.heartbeatTimer = null;
    this.serverInfo = null;
    this._listeners = {};

    // Inicia conexão assim que o script for carregado
    this.init();
  }

  /* ─── INICIALIZAÇÃO & CONEXÃO ───────────────────────── */

  init() {
    this.fetchServerInfo().then(() => {
      this.connectWebSocket();
    }).catch(() => {
      this.connectWebSocket();
    });

    // Detecta retorno da aba / reconexão do dispositivo
    window.addEventListener('online', () => {
      if (this.status !== 'connected') this.connectWebSocket();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.status !== 'connected') {
        this.connectWebSocket();
      }
    });
  }

  getWsUrl() {
    // Se aberto via HTTP/HTTPS no servidor
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}/ws`;
    }
    // Se aberto como file:// local, tenta porta padrão 3000
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
        } catch (err) {
          console.error('[SyncEngine] Erro ao parsear mensagem:', err);
        }
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
      this.connectWebSocket();
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

  /* ─── STATUS & EVENTOS ──────────────────────────────── */

  updateStatus(newStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.emit('status-change', { status: this.status, clients: this.connectedClients });
      window.dispatchEvent(new CustomEvent('superbt:sync-status', {
        detail: { status: this.status, clients: this.connectedClients }
      }));
    }
  }

  updateClientCount(count) {
    this.connectedClients = Math.max(1, count);
    this.emit('client-count', { clients: this.connectedClients });
    window.dispatchEvent(new CustomEvent('superbt:sync-clients', {
      detail: { count: this.connectedClients }
    }));
  }

  /* ─── TRATAMENTO DE MENSAGENS RECEBIDAS ─────────────── */

  handleIncomingMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    // Ignora eco de mensagens enviadas por este mesmo aparelho
    if (msg.senderId && msg.senderId === this.clientId) {
      return;
    }

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

      case 'pong':
        // Heartbeat mantido
        break;
    }
  }

  /* ─── ENVIO DE ATUALIZAÇÕES ─────────────────────────── */

  sendStateUpdate(state) {
    const payload = {
      type: 'state_update',
      state: state,
      senderId: this.clientId,
      timestamp: Date.now()
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        return;
      } catch (err) {
        console.warn('[SyncEngine] Falha ao enviar via WS, tentando HTTP fallback...', err);
      }
    }

    // Fallback REST POST
    if (window.location.protocol.startsWith('http')) {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.warn('[SyncEngine] Falha no fallback HTTP /api/state:', err);
      });
    }
  }

  sendAuthUpdate(authData) {
    const payload = {
      type: 'auth_update',
      data: authData,
      senderId: this.clientId,
      timestamp: Date.now()
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        return;
      } catch (err) {}
    }

    if (window.location.protocol.startsWith('http')) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  }

  /* ─── INFORMAÇÕES DO SERVIDOR & IP LOCAL ────────────── */

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

  getShareableUrl() {
    if (this.serverInfo && this.serverInfo.primaryUrl) {
      return this.serverInfo.primaryUrl;
    }
    if (window.location.protocol.startsWith('http')) {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  }

  /* ─── SISTEMA SIMPLES DE EMISSÃO DE EVENTOS ─────────── */

  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);
  }

  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => {
      try { cb(data); } catch (e) {}
    });
  }
}

// Instanciação global única
window.syncEngine = new SyncEngine();
