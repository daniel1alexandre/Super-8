/**
 * SUPER BEACH TENNIS — CONFIGURAÇÃO DO FIREBASE REALTIME DATABASE
 * Sincronização em nuvem mundial 24h para Vercel e múltiplos aparelhos.
 */

(function(window) {
  const FIREBASE_STORAGE_KEY = 'SUPER_BT_FIREBASE_CONFIG_V1';

  // Chave padrão opcional inserida no código (se desejar fixar no repositório)
  const DEFAULT_CONFIG = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };

  function getStoredConfig() {
    try {
      const raw = localStorage.getItem(FIREBASE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.apiKey) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CONFIG.apiKey ? DEFAULT_CONFIG : null;
  }

  function saveConfig(config) {
    try {
      localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(config));
      return true;
    } catch (e) {
      return false;
    }
  }

  function initFirebase() {
    const config = getStoredConfig();
    if (!config || !config.apiKey || !config.databaseURL) {
      return null;
    }

    try {
      if (typeof firebase !== 'undefined') {
        // Inicializa ou reaproveita o app existente
        let app;
        if (!firebase.apps || firebase.apps.length === 0) {
          app = firebase.initializeApp(config);
        } else {
          app = firebase.app();
        }
        const db = firebase.database();
        window.firebaseDb = db;
        return db;
      }
    } catch (err) {
      console.warn('[Firebase] Erro ao inicializar:', err);
    }
    return null;
  }

  window.FirebaseConfig = {
    getConfig: getStoredConfig,
    saveConfig: saveConfig,
    init: initFirebase,
    isReady: function() {
      return !!(window.firebaseDb);
    }
  };

  // Inicializa automaticamente se as credenciais existirem
  initFirebase();

})(window);
