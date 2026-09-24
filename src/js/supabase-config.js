/**
 * SUPER BT — CONFIGURAÇÃO DO SUPABASE
 * Sincronização em nuvem em tempo real para múltiplos aparelhos e Vercel.
 */

(function(window) {
  const STORAGE_KEY = 'SUPER_BT_SUPABASE_CONFIG_V1';

  // Configuração padrão inserida no código (fixa para todos os aparelhos)
  const DEFAULT_CONFIG = {
    url: 'https://ayenwgyymcqjzyadtqdv.supabase.co',
    anonKey: ''
  };

  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.url && parsed.anonKey) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CONFIG.url && DEFAULT_CONFIG.anonKey ? DEFAULT_CONFIG : null;
  }

  function saveConfig(url, anonKey) {
    try {
      const cleanUrl = (url || '').trim().replace(/\/$/, '');
      const cleanKey = (anonKey || '').trim();
      const cfg = { url: cleanUrl, anonKey: cleanKey };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      return initClient(cfg);
    } catch (e) {
      console.error('[Supabase] Erro ao salvar configuração:', e);
      return null;
    }
  }

  function initClient(customConfig) {
    const cfg = customConfig || getConfig();
    if (!cfg || !cfg.url || !cfg.anonKey) {
      window.supabaseClient = null;
      return null;
    }

    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        const client = window.supabase.createClient(cfg.url, cfg.anonKey, {
          auth: { persistSession: false }
        });
        window.supabaseClient = client;
        console.log('[Supabase] Conectado com sucesso:', cfg.url);
        return client;
      }
    } catch (err) {
      console.warn('[Supabase] Falha ao inicializar:', err);
    }
    return null;
  }

  window.SupabaseConfig = {
    getConfig: getConfig,
    saveConfig: saveConfig,
    initClient: initClient,
    isReady: function() {
      return !!(window.supabaseClient);
    }
  };

  // Tenta inicializar se as chaves existirem
  initClient();

})(window);
