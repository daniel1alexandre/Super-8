/**
 * SUPER BT — CONFIGURAÇÃO DO FIREBASE (FIRESTORE)
 * Sincronização em nuvem em tempo real para múltiplos aparelhos e Vercel.
 */

(function(window) {
  const STORAGE_KEY = 'SUPER_BT_FIREBASE_CONFIG_V1';

  // Configuração padrão opcional (pode ser preenchida diretamente aqui ou salva via interface do app)
  const DEFAULT_CONFIG = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  /**
   * Extrai parâmetros de configuração mesmo que o usuário cole o snippet completo do console do Firebase:
   * const firebaseConfig = { apiKey: "...", projectId: "..." };
   */
  function parseConfigInput(input) {
    if (!input) return null;
    if (typeof input === 'object') {
      const cfg = {
        apiKey: (input.apiKey || '').trim(),
        authDomain: (input.authDomain || '').trim(),
        projectId: (input.projectId || '').trim(),
        storageBucket: (input.storageBucket || '').trim(),
        messagingSenderId: (input.messagingSenderId || '').trim(),
        appId: (input.appId || '').trim()
      };
      return (cfg.apiKey && cfg.projectId) ? cfg : null;
    }

    if (typeof input === 'string') {
      const clean = input.trim();
      // Tenta parse direto de JSON
      try {
        const parsed = JSON.parse(clean);
        return parseConfigInput(parsed);
      } catch (e) {
        // Tenta regex nos campos padrão do Firebase
        const keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
        const extracted = {};
        keys.forEach(k => {
          const regex = new RegExp(`["']?${k}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
          const m = clean.match(regex);
          if (m && m[1]) {
            extracted[k] = m[1].trim();
          }
        });
        if (extracted.apiKey && extracted.projectId) {
          return extracted;
        }
      }
    }
    return null;
  }

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.apiKey && parsed.projectId) return parsed;
      }
    } catch (e) {}
    return (DEFAULT_CONFIG.apiKey && DEFAULT_CONFIG.projectId) ? DEFAULT_CONFIG : null;
  }

  function saveConfig(configInput) {
    try {
      const cfg = parseConfigInput(configInput);
      if (!cfg || !cfg.apiKey || !cfg.projectId) {
        console.warn('[Firebase] Configuração inválida. apiKey e projectId são obrigatórios.');
        return null;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      return initClient(cfg);
    } catch (e) {
      console.error('[Firebase] Erro ao salvar configuração:', e);
      return null;
    }
  }

  function clearConfig() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.firebaseApp = null;
      window.firebaseDb = null;
    } catch (e) {}
  }

  const readyCallbacks = [];

  function onReady(cb) {
    if (window.firebaseDb) {
      try { cb(window.firebaseDb); } catch(e) { console.warn(e); }
    } else {
      readyCallbacks.push(cb);
    }
  }

  function _triggerReady(db) {
    while (readyCallbacks.length > 0) {
      const cb = readyCallbacks.shift();
      try { cb(db); } catch(e) { console.warn(e); }
    }
  }

  function initClient(customConfig) {
    const cfg = customConfig || getConfig();
    if (!cfg || !cfg.apiKey || !cfg.projectId) {
      window.firebaseApp = null;
      window.firebaseDb = null;
      return null;
    }

    if (typeof window.firebase === 'undefined') {
      // No celular a rede móvel pode demorar um pouco para carregar o script CDN do Firebase
      return null;
    }

    try {
      let app;
      const appName = 'SUPER_BT_FIREBASE';
      if (window.firebase.apps && window.firebase.apps.length) {
        const existing = window.firebase.apps.find(a => a.name === appName || a.name === '[DEFAULT]');
        if (existing) {
          app = existing;
        }
      }

      if (!app) {
        app = window.firebase.initializeApp(cfg, appName);
      }

      window.firebaseApp = app;
      window.firebaseDb = app.firestore();
      console.log('[Firebase] Conectado com sucesso ao Firestore (Projeto:', cfg.projectId + ')');
      _triggerReady(window.firebaseDb);
      return { app: window.firebaseApp, db: window.firebaseDb };
    } catch (err) {
      console.warn('[Firebase] Falha ao inicializar:', err);
    }
    return null;
  }

  async function testConnection() {
    if (!window.firebaseDb) {
      return { success: false, error: 'Firebase Firestore não inicializado.' };
    }
    try {
      await window.firebaseDb.collection('superbt_users').limit(1).get();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Erro ao conectar ao Firestore.' };
    }
  }

  window.FirebaseConfig = {
    getConfig,
    saveConfig,
    clearConfig,
    initClient,
    onReady,
    isReady: function() {
      return !!(window.firebaseDb);
    },
    getDb: function() {
      return window.firebaseDb || null;
    },
    testConnection,
    parseConfigInput
  };

  // Tenta inicializar com retentativas automáticas (essencial para redes móveis e celulares)
  let initAttempts = 0;
  function scheduleInit() {
    if (initClient()) return;
    if (initAttempts < 25) {
      initAttempts++;
      setTimeout(scheduleInit, 400);
    }
  }
  scheduleInit();

})(window);

