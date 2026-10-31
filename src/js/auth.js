/**
 * SUPER BT — SISTEMA DE AUTENTICAÇÃO E GERENCIAMENTO DE USUÁRIOS
 * Armazenamento local com sincronização em nuvem via Firebase Firestore.
 * Suporta contagem regressiva de 30 dias por usuário e gestão de senhas pelo Administrador.
 */

const AUTH_STORAGE_KEY = 'SUPER_BT_AUTH_V1';
const AUTH_SESSION_KEY = 'SUPER_BT_SESSION_V1';

class AuthManager {
  constructor() {
    this._realtimeUnsubscribe = null;
    this._initDefaultUsers();
    this._initFirebaseSync();
  }

  /* ─── INICIALIZAÇÃO ─────────────────────────────────── */

  _initDefaultUsers() {
    const data = this._loadData();
    let changed = false;

    // Apenas o cadastro do administrador principal permanece por padrão
    const presetUsers = [
      {
        id: 'admin-001',
        username: 'Baumann',
        displayName: 'Daniel Baumann',
        password: this._encode('Daniel0306'),
        role: 'admin',
        createdAt: 1725800000000,
        expiresAt: null, // Administrador mestre tem acesso permanente
        daysValid: null,
        active: true
      }
    ];

    // Remover usuários de teste automáticos caso ainda existam no cache local
    const beforeCount = data.users.length;
    data.users = data.users.filter(u => u.username.toLowerCase() !== 'operador' && u.username.toLowerCase() !== 'visualizador');
    if (data.users.length !== beforeCount) changed = true;

    presetUsers.forEach(preset => {
      const existing = data.users.find(u => u.username.toLowerCase() === preset.username.toLowerCase());
      if (!existing) {
        data.users.push(preset);
        changed = true;
      }
    });

    // Garantir que todos os usuários tenham createdAt, expiresAt e active definidos
    data.users.forEach(u => {
      if (u.active === undefined || u.active === null) {
        u.active = true;
        changed = true;
      }
      if (!u.createdAt) {
        u.createdAt = Date.now();
        changed = true;
      }
      // Se não for admin e não tiver expiresAt, inicializa com 30 dias a partir do createdAt
      if (u.id !== 'admin-001' && u.role !== 'admin' && !u.expiresAt) {
        u.daysValid = u.daysValid || 30;
        u.expiresAt = u.createdAt + (30 * 24 * 60 * 60 * 1000);
        changed = true;
      }
    });

    if (changed) {
      this._saveData(data);
    }
  }

  _initFirebaseSync() {
    const startSync = () => {
      this._setupRealtime();
      this.syncFromFirebase();
    };

    if (window.FirebaseConfig && window.FirebaseConfig.isReady()) {
      startSync();
    } else if (window.FirebaseConfig && typeof window.FirebaseConfig.onReady === 'function') {
      window.FirebaseConfig.onReady(() => {
        startSync();
      });
    }

    // Retentativas para conexões móveis
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.FirebaseConfig && window.FirebaseConfig.isReady()) {
        if (!this._realtimeUnsubscribe) {
          startSync();
        }
        clearInterval(interval);
      } else if (attempts >= 20) {
        clearInterval(interval);
      }
    }, 500);
  }

  _setupRealtime() {
    try {
      const db = window.FirebaseConfig && window.FirebaseConfig.getDb();
      if (!db) return;

      if (this._realtimeUnsubscribe) {
        try { this._realtimeUnsubscribe(); } catch(e) {}
      }

      this._realtimeUnsubscribe = db.collection('superbt_users')
        .onSnapshot((snapshot) => {
          const remoteUsers = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            remoteUsers.push({ id: doc.id, ...d });
          });

          if (remoteUsers.length > 0) {
            this._applyRemoteUsers(remoteUsers);
            if (typeof window.onUsersSynced === 'function') {
              window.onUsersSynced();
            }
          }
        }, (err) => {
          console.warn('[Firebase Realtime] Erro no listener:', err);
        });
      console.log('[Firebase Realtime] Escuta em tempo real ativada para superbt_users');
    } catch (e) {
      console.warn('[Firebase Realtime] Falha ao assinar snapshot:', e);
    }
  }

  _applyRemoteUsers(remoteUsers) {
    if (!Array.isArray(remoteUsers)) return;
    const local = this._loadData();
    const adminUser = local.users.find(u => u.id === 'admin-001') || {
      id: 'admin-001',
      username: 'Baumann',
      displayName: 'Daniel Baumann',
      password: this._encode('Daniel0306'),
      role: 'admin',
      createdAt: 1725800000000,
      expiresAt: null,
      active: true
    };

    const mergedMap = new Map();
    mergedMap.set('admin-001', adminUser);

    remoteUsers.forEach(ru => {
      if (ru.id === 'admin-001') return;
      const createdAt = ru.createdAt || ru.created_at || Date.now();
      const expiresAt = ru.expiresAt || ru.expires_at || (createdAt + (30 * 24 * 60 * 60 * 1000));
      mergedMap.set(ru.id, {
        id: ru.id,
        username: ru.username,
        displayName: ru.displayName || ru.display_name || ru.username,
        password: ru.password,
        role: ru.role || 'operator',
        active: ru.active !== false,
        createdAt: createdAt,
        expiresAt: expiresAt,
        daysValid: ru.daysValid || 30
      });
    });

    local.users = Array.from(mergedMap.values());
    this._saveData(local);
    console.log('[Firebase Sync] Usuários sincronizados da nuvem:', local.users.length);
  }

  async syncFromFirebase() {
    const db = window.FirebaseConfig && window.FirebaseConfig.getDb();
    if (!db) return { success: false, error: 'Firebase não inicializado' };

    try {
      const snapshot = await db.collection('superbt_users').get();
      const remoteUsers = [];
      snapshot.forEach(doc => {
        remoteUsers.push({ id: doc.id, ...doc.data() });
      });

      if (remoteUsers.length > 0) {
        this._applyRemoteUsers(remoteUsers);
        return { success: true, count: remoteUsers.length };
      } else {
        // Se a coleção na nuvem estiver vazia, sobe os usuários locais para inicializar
        await this.syncAllToFirebase();
        return { success: true, count: this._loadData().users.length };
      }
    } catch (err) {
      console.warn('[Firebase Sync] Exceção ao sincronizar:', err);
      return { success: false, error: err.message || err };
    }
  }

  async syncAllToFirebase() {
    const db = window.FirebaseConfig && window.FirebaseConfig.getDb();
    if (!db) return { success: false, error: 'Firebase não conectado' };

    try {
      const local = this._loadData();
      for (const u of local.users) {
        await db.collection('superbt_users').doc(u.id).set({
          id: u.id,
          username: u.username,
          displayName: u.displayName || u.username,
          password: u.password,
          role: u.role || 'operator',
          active: u.active !== false,
          createdAt: u.createdAt || Date.now(),
          expiresAt: u.expiresAt || (u.id === 'admin-001' ? null : (u.createdAt || Date.now()) + 30 * 86400000),
          daysValid: u.daysValid || 30
        }, { merge: true });
      }
      return { success: true };
    } catch (e) {
      console.warn('[Firebase Sync] Falha ao enviar usuários locais para Firebase:', e);
      return { success: false, error: e.message };
    }
  }

  _loadData() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) return parsed;
      }
    } catch (e) {}
    return { users: [] };
  }

  _saveData(data) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  _encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  _decode(str) {
    try { return decodeURIComponent(escape(atob(str))); } catch (e) { return ''; }
  }

  /* ─── GESTÃO DE SENHAS PELO ADMINISTRADOR ───────────── */

  /**
   * Retorna a senha descriptografada para que o administrador possa visualizar e informar ao usuário
   */
  getUserPassword(userId) {
    const user = this.getUsers().find(u => u.id === userId);
    if (!user || !user.password) return '';
    return this._decode(user.password);
  }

  decodePassword(encoded) {
    return this._decode(encoded);
  }

  /* ─── CONTROLE DE VENCIMENTO / 30 DIAS ────────────────── */

  /**
   * Calcula o status detalhado da contagem de 30 dias para um usuário
   */
  getUserExpiration(user) {
    if (!user) {
      return { isPermanent: false, isExpired: true, daysLeft: 0, label: 'Inválido', badgeClass: 'badge-days-expired', percent: 0 };
    }

    // Administrador principal não expira
    if (user.id === 'admin-001' || user.role === 'admin') {
      return {
        isPermanent: true,
        isExpired: false,
        daysLeft: Infinity,
        label: '👑 Permanente (Admin)',
        badgeClass: 'badge-days-admin',
        percent: 100,
        createdDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A',
        expireDate: 'Vitalício'
      };
    }

    const now = Date.now();
    const createdAt = user.createdAt || now;
    // Se o usuário não possuir expiresAt explícito, padrão de 30 dias a partir da criação
    const expiresAt = user.expiresAt || (createdAt + (30 * 24 * 60 * 60 * 1000));
    const totalDuration = Math.max(expiresAt - createdAt, 30 * 24 * 60 * 60 * 1000);
    const diffMs = expiresAt - now;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffMs <= 0;

    const createdDate = new Date(createdAt).toLocaleDateString('pt-BR');
    const expireDate  = new Date(expiresAt).toLocaleDateString('pt-BR');

    // Porcentagem restante do tempo (0 a 100)
    const percent = isExpired ? 0 : Math.max(0, Math.min(100, Math.round((diffMs / totalDuration) * 100)));

    if (isExpired) {
      const daysAgo = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return {
        isPermanent: false,
        isExpired: true,
        daysLeft: 0,
        daysAgo,
        createdDate,
        expireDate,
        label: `🔴 Expirado ${daysAgo === 0 ? 'hoje' : 'há ' + daysAgo + ' dia(s)'}`,
        badgeClass: 'badge-days-expired',
        percent: 0
      };
    } else if (daysLeft <= 5) {
      return {
        isPermanent: false,
        isExpired: false,
        daysLeft,
        createdDate,
        expireDate,
        label: `⚠️ Expira em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`,
        badgeClass: 'badge-days-warning',
        percent
      };
    } else {
      return {
        isPermanent: false,
        isExpired: false,
        daysLeft,
        createdDate,
        expireDate,
        label: `⏳ ${daysLeft} dias restantes`,
        badgeClass: 'badge-days-ok',
        percent
      };
    }
  }

  /**
   * Libera novo acesso para o usuário (renovação de +30 dias)
   */
  async renewAccess(userId, days = 30) {
    const data = this._loadData();
    const idx = data.users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, error: 'Usuário não encontrado.' };

    const user = data.users[idx];
    const now = Date.now();
    const currentExpires = user.expiresAt || ((user.createdAt || now) + (30 * 24 * 60 * 60 * 1000));

    // Se já estiver expirado ou a data for anterior a agora, renova contando 30 dias a partir de HOJE.
    // Se o usuário ainda tem dias restantes, adiciona +30 dias ao saldo existente.
    const baseDate = currentExpires > now ? currentExpires : now;
    const newExpiresAt = baseDate + (days * 24 * 60 * 60 * 1000);

    user.expiresAt = newExpiresAt;
    user.active = true; // Garante reativação da conta
    user.daysValid = days;

    this._saveData(data);

    // Sincronizar instantaneamente no Firebase
    const db = window.FirebaseConfig && window.FirebaseConfig.getDb();
    if (db) {
      try {
        await db.collection('superbt_users').doc(userId).set({
          expiresAt: newExpiresAt,
          active: true,
          daysValid: days
        }, { merge: true });
        console.log('[Firebase Sync] Novo acesso liberado para:', user.username, 'até', new Date(newExpiresAt).toLocaleDateString('pt-BR'));
      } catch (err) {
        console.warn('[Firebase Sync] Falha ao atualizar expiração no Firebase:', err);
      }
    }

    return {
      success: true,
      user,
      expiresAt: newExpiresAt,
      days,
      formattedDate: new Date(newExpiresAt).toLocaleDateString('pt-BR')
    };
  }

  /* ─── SESSÃO ────────────────────────────────────────── */

  async login(username, password) {
    const cleanUsername = (username || '').trim();
    let data = this._loadData();
    let user = data.users.find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    // Se o usuário não estiver no cache local ou se houver Firebase configurado, busca na nuvem imediatamente
    if (!user && window.FirebaseConfig && window.FirebaseConfig.isReady()) {
      try {
        const db = window.FirebaseConfig.getDb();
        const snapshot = await db.collection('superbt_users')
          .where('username', '==', cleanUsername)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const remoteUser = doc.data();
          const createdAt = remoteUser.createdAt || remoteUser.created_at || Date.now();
          user = {
            id: doc.id,
            username: remoteUser.username,
            displayName: remoteUser.displayName || remoteUser.display_name || remoteUser.username,
            password: remoteUser.password,
            role: remoteUser.role || 'operator',
            active: remoteUser.active !== false,
            createdAt: createdAt,
            expiresAt: remoteUser.expiresAt || remoteUser.expires_at || (createdAt + (30 * 24 * 60 * 60 * 1000)),
            daysValid: remoteUser.daysValid || 30
          };
          data.users.push(user);
          this._saveData(data);
        }
      } catch (e) {
        console.warn('[Firebase] Erro ao buscar usuário no login:', e);
      }
    }

    if (!user) return { success: false, error: 'Usuário não encontrado.' };
    if (user.active === false) {
      return { success: false, error: 'Acesso negado: este usuário foi desativado pelo administrador.' };
    }

    // Validação de expiração de 30 dias (administrador mestre não expira)
    if (user.role !== 'admin' && user.id !== 'admin-001') {
      const exp = this.getUserExpiration(user);
      if (exp.isExpired) {
        return {
          success: false,
          error: `⛔ Período de 30 dias expirado em ${exp.expireDate}. Solicite a liberação de novo acesso ao administrador.`
        };
      }
    }

    if (this._decode(user.password) !== password) {
      return { success: false, error: 'Senha incorreta.' };
    }

    const session = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      loginAt: Date.now()
    };
    try { localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session)); } catch (e) {}
    return { success: true, user: session };
  }

  logout() {
    try { localStorage.removeItem(AUTH_SESSION_KEY); } catch (e) {}
  }

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.userId) {
          const data = this._loadData();
          const user = data.users.find(u => u.id === session.userId);
          // Se o usuário foi desativado ou excluído, revogar o acesso imediatamente
          if (!user || user.active === false) {
            this.logout();
            return null;
          }
          // Se o usuário não for admin e o prazo de 30 dias tiver expirado, encerra a sessão
          if (user.role !== 'admin' && user.id !== 'admin-001') {
            const exp = this.getUserExpiration(user);
            if (exp.isExpired) {
              this.logout();
              return null;
            }
          }
          // Manter dados atualizados da conta
          session.displayName = user.displayName;
          session.username = user.username;
          session.role = user.role;
          return session;
        }
      }
    } catch (e) {}
    return null;
  }

  isLoggedIn() {
    return !!this.getCurrentUser();
  }

  /* ─── PERMISSÕES ────────────────────────────────────── */

  // Hierarquia: admin > operator > viewer
  hasPermission(requiredRole) {
    const user = this.getCurrentUser();
    if (!user) return false;
    const hierarchy = { admin: 3, operator: 2, viewer: 1 };
    return (hierarchy[user.role] || 0) >= (hierarchy[requiredRole] || 0);
  }

  isAdmin() { return this.hasPermission('admin'); }
  canEdit()  { return this.hasPermission('operator'); }

  /* ─── CRUD DE USUÁRIOS ──────────────────────────────── */

  getUsers() {
    return this._loadData().users;
  }

  async createUser({ username, displayName, password, role, active = true, daysValid = 30 }) {
    if (!username || !password || !role) {
      return { success: false, error: 'Campos obrigatórios ausentes.' };
    }
    const data = this._loadData();
    const exists = data.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) return { success: false, error: 'Usuário já existe.' };

    const now = Date.now();
    const validDays = Number(daysValid) || 30;
    // O contador de 30 dias começa a contar a partir do dia em que foi criado
    const expiresAt = role === 'admin' ? null : (now + (validDays * 24 * 60 * 60 * 1000));

    const newUser = {
      id: 'u-' + now,
      username: username.trim(),
      displayName: (displayName || username).trim(),
      password: this._encode(password), // Senha preservada e legível para o administrador
      role: role,
      createdAt: now,
      expiresAt: expiresAt,
      daysValid: validDays,
      active: active !== false
    };
    data.users.push(newUser);
    this._saveData(data);

    // Sincronizar instantaneamente no Firebase Firestore
    const db = window.FirebaseConfig && window.FirebaseConfig.getDb();
    if (db) {
      try {
        await db.collection('superbt_users').doc(newUser.id).set({
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          password: newUser.password,
          role: newUser.role,
          active: newUser.active,
          createdAt: newUser.createdAt,
          expiresAt: newUser.expiresAt,
          daysValid: newUser.daysValid
        });
        console.log('[Firebase Sync] Novo usuário salvo no Firestore:', newUser.username);
      } catch (err) {
        console.warn('[Firebase Sync] Falha ao enviar para o Firebase:', err);
      }
    }

    return { success: true, user: newUser };
  }

  async updateUser(userId, changes) {
    const data = this._loadData();
    const idx = data.users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, error: 'Usuário não encontrado.' };

    // Não permitir editar o admin padrão (username/role)
    if (data.users[idx].id === 'admin-001') {
      delete changes.username;
      delete changes.role;
    }

    if (changes.password) {
      changes.password = this._encode(changes.password);
    }
    data.users[idx] = { ...data.users[idx], ...changes };
    this._saveData(data);

    const db = window.FirebaseConfig && window.FirebaseConfig.getDb();
    if (db && userId !== 'admin-001') {
      try {
        const u = data.users[idx];
        const updatePayload = {
          displayName: u.displayName,
          password: u.password,
          role: u.role,
          active: u.active
        };
        if (u.expiresAt !== undefined) updatePayload.expiresAt = u.expiresAt;
        if (u.daysValid !== undefined) updatePayload.daysValid = u.daysValid;

        await db.collection('superbt_users').doc(userId).set(updatePayload, { merge: true });
        console.log('[Firebase Sync] Usuário atualizado no Firestore:', u.username);
      } catch (err) {
        console.warn('[Firebase Sync] Falha ao atualizar no Firebase:', err);
      }
    }

    return { success: true };
  }

  async deleteUser(userId) {
    if (userId === 'admin-001') {
      return { success: false, error: 'O administrador principal não pode ser excluído.' };
    }
    const current = this.getCurrentUser();
    if (current && current.userId === userId) {
      return { success: false, error: 'Você não pode excluir o próprio usuário.' };
    }
    const data = this._loadData();
    data.users = data.users.filter(u => u.id !== userId);
    this._saveData(data);

    const db = window.FirebaseConfig && window.FirebaseConfig.getDb();
    if (db) {
      try {
        await db.collection('superbt_users').doc(userId).delete();
        console.log('[Firebase Sync] Usuário excluído no Firestore:', userId);
      } catch (err) {
        console.warn('[Firebase Sync] Falha ao excluir no Firebase:', err);
      }
    }

    return { success: true };
  }

  async toggleUserActive(userId) {
    if (userId === 'admin-001') {
      return { success: false, error: 'O administrador principal não pode ser desativado.' };
    }
    const data = this._loadData();
    const user = data.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'Usuário não encontrado.' };
    user.active = !user.active;
    this._saveData(data);

    // Se o usuário desativado for o atualmente com sessão aberta, revogar imediatamente
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.userId === userId && !user.active) {
          this.logout();
        }
      }
    } catch (e) {}

    const db = window.FirebaseConfig && window.FirebaseConfig.getDb();
    if (db) {
      try {
        await db.collection('superbt_users').doc(userId).set({
          active: user.active
        }, { merge: true });
        console.log('[Firebase Sync] Status de usuário atualizado no Firestore:', user.username, user.active);
      } catch (err) {
        console.warn('[Firebase Sync] Falha ao atualizar status no Firebase:', err);
      }
    }

    return { success: true, active: user.active };
  }
}

// Instância global
window.authManager = new AuthManager();
