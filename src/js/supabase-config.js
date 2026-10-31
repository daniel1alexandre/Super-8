/**
 * SUPER BT — MIGRADO PARA FIREBASE FIRESTORE
 * Este arquivo foi substituído por firebase-config.js.
 * Mantido como shim de compatibilidade para instalações legadas.
 */
(function(window) {
  window.SupabaseConfig = {
    getConfig: function() { return window.FirebaseConfig ? window.FirebaseConfig.getConfig() : null; },
    saveConfig: function() { return null; },
    initClient: function() { return null; },
    isReady: function() { return window.FirebaseConfig ? window.FirebaseConfig.isReady() : false; }
  };
})(window);
