/**
 * SUPER BT — SISTEMA DE AUTENTICAÇÃO E GERENCIAMENTO DE USUÁRIOS
 * Armazenamento em localStorage com senhas em Base64 (uso local/intranet).
 */

const AUTH_STORAGE_KEY = 'SUPER_BT_AUTH_V1';
const AUTH_SESSION_KEY = 'SUPER_BT_SESSION_V1';

class AuthManager {
  constructor() {
    this._initDefaultUsers();
    this._initSupabaseSync();
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

    // Garantir que todos os usuários cadastrados estejam sempre habilitados se active não estiver false
    data.users.forEach(u => {
      if (u.active === undefined || u.active === null) {
        u.active = true;
        changed = true;
      }
    });

    if (changed) {
      this._saveData(data);
    }
  }

  _initSupabaseSync() {
    // Sincroniza logo ao iniciar
    setTimeout(() => { this.syncFromSupabase(); }, 200);

    // Configura escuta em tempo real
    if (window.supabaseClient) {
      this._setupRealtime();
    } else {
      window.addEventListener('load', () => {
        if (window.supabaseClient) {
          this._setupRealtime();
          this.syncFromSupabase();
        }
      });
    }
  }

  _setupRealtime() {
    try {
      if (!window.supabaseClient) return;
      window.supabaseClient
        .channel('superbt_users_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'superbt_users' }, (payload) => {
          console.log('[Supabase Realtime] Mudança detectada na nuvem:', payload);
          this.syncFromSupabase().then(() => {
            if (typeof window.onUsersSynced === 'function') {
              window.onUsersSynced();
            }
          });
        })
        .subscribe();
    } catch (e) {
      console.warn('[Supabase Realtime] Falha ao assinar canal:', e);
    }
  }

  async syncFromSupabase() {
    if (!window.supabaseClient) return { success: false, error: 'Supabase não inicializado' };
    try {
      const { data: remoteUsers, error } = await window.supabaseClient
        .from('superbt_users')
        .select('*');

      if (error) {
        console.warn('[Supabase Sync] Erro na consulta:', error.message || error);
        return { success: false, error };
      }

      if (Array.isArray(remoteUsers)) {
        const local = this._loadData();
        const adminUser = local.users.find(u => u.id === 'admin-001') || {
          id: 'admin-001',
          username: 'Baumann',
          displayName: 'Daniel Baumann',
          password: this._encode('Daniel0306'),
          role: 'admin',
          createdAt: 1725800000000,
          active: true
        };

        const mergedMap = new Map();
        mergedMap.set('admin-001', adminUser);

        remoteUsers.forEach(ru => {
          if (ru.id === 'admin-001') return;
          mergedMap.set(ru.id, {
            id: ru.id,
            username: ru.username,
            displayName: ru.display_name || ru.username,
            password: ru.password,
            role: ru.role || 'operator',
            active: ru.active !== false,
            createdAt: ru.created_at || Date.now()
          });
        });

        local.users = Array.from(mergedMap.values());
        this._saveData(local);
        console.log('[Supabase Sync] Usuários sincronizados da nuvem:', local.users.length);
        return { success: true, count: local.users.length };
      }
    } catch (err) {
      console.warn('[Supabase Sync] Exceção ao sincronizar:', err);
    }
    return { success: false };
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

  /* ─── SESSÃO ────────────────────────────────────────── */

  async login(username, password) {
    const cleanUsername = (username || '').trim();
    let data = this._loadData();
    let user = data.users.find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    // Se o usuário não estiver no cache local ou se houver Supabase configurado, busca na nuvem imediatamente
    if (!user && window.supabaseClient) {
      try {
        const { data: remoteUser, error } = await window.supabaseClient
          .from('superbt_users')
          .select('*')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (remoteUser && !error) {
          user = {
            id: remoteUser.id,
            username: remoteUser.username,
            displayName: remoteUser.display_name || remoteUser.username,
            password: remoteUser.password,
            role: remoteUser.role || 'operator',
            active: remoteUser.active !== false,
            createdAt: remoteUser.created_at || Date.now()
          };
          data.users.push(user);
          this._saveData(data);
        }
      } catch (e) {
        console.warn('[Supabase] Erro ao buscar usuário no login:', e);
      }
    }

    if (!user) return { success: false, error: 'Usuário não encontrado.' };
    if (user.active === false) {
      return { success: false, error: 'Acesso negado: este usuário foi desativado pelo administrador.' };
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

  async createUser({ username, displayName, password, role, active = true }) {
    if (!username || !password || !role) {
      return { success: false, error: 'Campos obrigatórios ausentes.' };
    }
    const data = this._loadData();
    const exists = data.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) return { success: false, error: 'Usuário já existe.' };

    const newUser = {
      id: 'u-' + Date.now(),
      username: username.trim(),
      displayName: (displayName || username).trim(),
      password: this._encode(password),
      role: role,
      createdAt: Date.now(),
      active: active !== false
    };
    data.users.push(newUser);
    this._saveData(data);

    // Sincronizar instantaneamente no Supabase na nuvem
    if (window.supabaseClient) {
      try {
        await window.supabaseClient.from('superbt_users').upsert({
          id: newUser.id,
          username: newUser.username,
          display_name: newUser.displayName,
          password: newUser.password,
          role: newUser.role,
          active: newUser.active,
          created_at: newUser.createdAt
        });
        console.log('[Supabase Sync] Novo usuário salvo na nuvem:', newUser.username);
      } catch (err) {
        console.warn('[Supabase Sync] Falha ao enviar para Supabase:', err);
      }
    }

    return { success: true, user: newUser };
  }

  async updateUser(userId, changes) {
    const data = this._loadData();
    const idx = data.users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, error: 'Usuário não encontrado.' };

    // Não permitir editar o admin padrão (username)
    if (data.users[idx].id === 'admin-001') {
      delete changes.username;
      delete changes.role; // admin não pode ser rebaixado
    }

    if (changes.password) {
      changes.password = this._encode(changes.password);
    }
    data.users[idx] = { ...data.users[idx], ...changes };
    this._saveData(data);

    if (window.supabaseClient && userId !== 'admin-001') {
      try {
        const u = data.users[idx];
        await window.supabaseClient.from('superbt_users').update({
          display_name: u.displayName,
          password: u.password,
          role: u.role,
          active: u.active
        }).eq('id', userId);
      } catch (err) {
        console.warn('[Supabase Sync] Falha ao atualizar na nuvem:', err);
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

    if (window.supabaseClient) {
      try {
        await window.supabaseClient.from('superbt_users').delete().eq('id', userId);
      } catch (err) {
        console.warn('[Supabase Sync] Falha ao excluir na nuvem:', err);
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

    if (window.supabaseClient) {
      try {
        await window.supabaseClient.from('superbt_users').update({
          active: user.active
        }).eq('id', userId);
      } catch (err) {
        console.warn('[Supabase Sync] Falha ao atualizar status na nuvem:', err);
      }
    }

    return { success: true, active: user.active };
  }
}

// Instância global
window.authManager = new AuthManager();
