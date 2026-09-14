/**
 * SUPER BT — SISTEMA DE AUTENTICAÇÃO E GERENCIAMENTO DE USUÁRIOS
 * Armazenamento em localStorage com senhas em Base64 (uso local/intranet).
 */

const AUTH_STORAGE_KEY = 'SUPER_BT_AUTH_V1';
const AUTH_SESSION_KEY = 'SUPER_BT_SESSION_V1';

class AuthManager {
  constructor() {
    this._initDefaultAdmin();
  }

  /* ─── INICIALIZAÇÃO ─────────────────────────────────── */

  _initDefaultAdmin() {
    const data = this._loadData();
    const adminExists = data.users.some(u => u.username === 'Baumann');
    if (!adminExists) {
      data.users.push({
        id: 'admin-001',
        username: 'Baumann',
        displayName: 'Daniel Baumann',
        password: this._encode('Daniel0306'),
        role: 'admin',
        createdAt: Date.now(),
        active: true
      });
      this._saveData(data);
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

  /* ─── SESSÃO ────────────────────────────────────────── */

  login(username, password) {
    const data = this._loadData();
    const user = data.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() &&
           u.active !== false
    );
    if (!user) return { success: false, error: 'Usuário não encontrado ou inativo.' };
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
      if (raw) return JSON.parse(raw);
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

  createUser({ username, displayName, password, role }) {
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
      active: true
    };
    data.users.push(newUser);
    this._saveData(data);
    return { success: true, user: newUser };
  }

  updateUser(userId, changes) {
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
    return { success: true };
  }

  deleteUser(userId) {
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
    return { success: true };
  }

  toggleUserActive(userId) {
    if (userId === 'admin-001') {
      return { success: false, error: 'O administrador principal não pode ser desativado.' };
    }
    const data = this._loadData();
    const user = data.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'Usuário não encontrado.' };
    user.active = !user.active;
    this._saveData(data);
    return { success: true, active: user.active };
  }
}

// Instância global
window.authManager = new AuthManager();
