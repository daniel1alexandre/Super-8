/**
 * SUPER BEACH TENNIS - APP PRINCIPAL (com Autenticação)
 */
document.addEventListener("DOMContentLoaded", () => {
  const auth = window.authManager;

  /* ══════════════════════════════════════════════════════
     SISTEMA DE LOGIN
  ══════════════════════════════════════════════════════ */

  const screenLogin     = document.getElementById("screen-login");
  const screenSelection = document.getElementById("screen-selection");
  const screenApp       = document.getElementById("screen-app");

  // ── Bolinhas de Beach Tennis flutuando no Login ───────
  function spawnBeachTennisBalls() {
    const container = document.getElementById("login-particles");
    if (!container) return;
    container.innerHTML = "";

    // Gera o SVG de uma bola oficial de beach tennis (Stage 2 Laranja/Amarelo com costura e iluminação 3D)
    function createBallSvg(variant, idSuffix, initialAngle) {
      const gradId = `btGrad_${idSuffix}`;
      const clipId = `btClip_${idSuffix}`;

      // Amarelo neon feltro e laranja beach tennis de alto contraste e vibração
      const yellowFelt = "#c4f000";
      const orangeBt   = "#ff4400";

      // Variante 1: Divisão horizontal (Topo Laranja, Base Amarela)
      // Variante 0: Divisão vertical (Direita Laranja, Esquerda Amarela)
      const orangePath = variant === 1
        ? `<path d="M 3,50 A 47,47 0 0,1 97,50 L 3,50 Z" fill="${orangeBt}" />`
        : `<path d="M 50,3 A 47,47 0 0,1 50,97 L 50,3 Z" fill="${orangeBt}" />`;

      return `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${initialAngle}deg); transform-origin: 50% 50%; width:100%; height:100%;">
          <defs>
            <radialGradient id="${gradId}" cx="30%" cy="26%" r="72%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32" />
              <stop offset="35%" stop-color="#ffffff" stop-opacity="0.0" />
              <stop offset="76%" stop-color="#000000" stop-opacity="0.22" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0.52" />
            </radialGradient>
            <clipPath id="${clipId}">
              <circle cx="50" cy="50" r="47" />
            </clipPath>
          </defs>
          <g clip-path="url(#${clipId})">
            <!-- Base feltro amarelo -->
            <circle cx="50" cy="50" r="47" fill="${yellowFelt}" />
            <!-- Metade laranja oficial de Beach Tennis -->
            ${orangePath}
            <!-- Costuras brancas curvadas clássicas de tênis -->
            <path d="M 16,22 C 37,35 37,65 16,78" fill="none" stroke="#ffffff" stroke-width="4.8" stroke-linecap="round" opacity="0.96" />
            <path d="M 84,22 C 63,35 63,65 84,78" fill="none" stroke="#ffffff" stroke-width="4.8" stroke-linecap="round" opacity="0.96" />
            <!-- Efeito esférico e relevo 3D sem lavar as cores -->
            <circle cx="50" cy="50" r="47" fill="url(#${gradId})" />
          </g>
          <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.6" />
        </svg>
      `;
    }

    const totalBalls = 20;
    for (let i = 0; i < totalBalls; i++) {
      const ball = document.createElement("div");
      ball.className = "login-particle-ball";

      // Variação de tamanho: 30px até 68px
      const size = Math.floor(Math.random() * 38) + 30;
      const leftPos = Math.floor(Math.random() * 94) + 3; // 3% a 97% da largura
      const duration = (Math.random() * 9 + 8).toFixed(1); // 8s a 17s
      const delay = (-Math.random() * 16).toFixed(1); // Preencher a tela desde o início
      const sway = Math.floor(Math.random() * 32 + 16); // Balanço lateral em px
      const targetOpacity = (Math.random() * 0.32 + 0.60).toFixed(2); // 0.60 a 0.92
      const initialAngle = Math.floor(Math.random() * 360);
      const isSmall = size < 36;

      ball.style.width = `${size}px`;
      ball.style.height = `${size}px`;
      ball.style.left = `${leftPos}%`;
      ball.style.setProperty("--sway", `${sway}px`);
      ball.style.setProperty("--target-opacity", targetOpacity);
      ball.style.animationDuration = `${duration}s`;
      ball.style.animationDelay = `${delay}s`;

      if (isSmall) {
        ball.style.filter = "blur(1.2px) drop-shadow(0 4px 10px rgba(0,0,0,0.3))";
      }

      const variant = i % 2;
      ball.innerHTML = createBallSvg(variant, `${i}_${Date.now()}`, initialAngle);
      container.appendChild(ball);
    }
  }
  spawnBeachTennisBalls();

  // ── Mostrar/ocultar tela de login ───────────────────
  function showLoginScreen() {
    if (screenLogin)     screenLogin.classList.remove("auth-hidden");
    if (screenSelection) screenSelection.classList.add("sel-hidden");
    if (screenApp)       screenApp.classList.add("sel-hidden");
  }

  function hideLoginScreen() {
    if (screenLogin) screenLogin.classList.add("auth-hidden");
  }

  // ── Toggle visibilidade de senha ────────────────────
  const btnTogglePwd = document.getElementById("btn-toggle-pwd");
  const loginPwdInp  = document.getElementById("login-password");
  if (btnTogglePwd && loginPwdInp) {
    btnTogglePwd.addEventListener("click", () => {
      const isText = loginPwdInp.type === "text";
      loginPwdInp.type = isText ? "password" : "text";
      btnTogglePwd.textContent = isText ? "👁️" : "🙈";
    });
  }

  // ── Submissão do formulário de login ────────────────
  const loginForm   = document.getElementById("login-form");
  const loginErrEl  = document.getElementById("login-error");
  const loginErrTxt = document.getElementById("login-error-text");
  const btnLogin    = document.getElementById("btn-do-login");

  function showLoginError(msg) {
    if (loginErrTxt) loginErrTxt.textContent = msg;
    if (loginErrEl) {
      loginErrEl.classList.add("visible");
      setTimeout(() => loginErrEl.classList.remove("visible"), 4000);
    }
    [document.getElementById("login-username"), loginPwdInp].forEach(inp => {
      if (!inp) return;
      inp.classList.add("input-error");
      setTimeout(() => inp.classList.remove("input-error"), 600);
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("login-username").value.trim();
      const password = loginPwdInp ? loginPwdInp.value : "";

      if (!username || !password) {
        showLoginError("Preencha o usuário e a senha.");
        return;
      }

      if (btnLogin) btnLogin.classList.add("loading");

      setTimeout(() => {
        const result = auth.login(username, password);
        if (btnLogin) btnLogin.classList.remove("loading");

        if (!result.success) {
          showLoginError(result.error || "Credenciais inválidas.");
          return;
        }

        hideLoginScreen();
        updateUserBadge(result.user);
        applyPermissions(result.user.role);
        initApp();
      }, 600);
    });
  }

  /* ══════════════════════════════════════════════════════
     BADGE DE USUÁRIO NO HEADER
  ══════════════════════════════════════════════════════ */

  function updateUserBadge(user) {
    if (!user) return;
    const avatar   = document.getElementById("user-badge-avatar");
    const name     = document.getElementById("user-badge-name");
    const role     = document.getElementById("user-badge-role");
    const adminBtn = document.getElementById("btn-admin-users");

    const initials = (user.displayName || user.username || "?")
      .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const roleLabels = { admin: "Admin", operator: "Operador", viewer: "Viewer" };

    if (avatar) { avatar.textContent = initials; avatar.className = "user-badge-avatar role-" + user.role; }
    if (name)   name.textContent = user.displayName || user.username;
    if (role)   { role.textContent = roleLabels[user.role] || user.role; role.className = "user-badge-role role-" + user.role; }
    if (adminBtn) adminBtn.style.display = user.role === "admin" ? "flex" : "none";
  }

  /* ══════════════════════════════════════════════════════
     PERMISSÕES
  ══════════════════════════════════════════════════════ */

  function applyPermissions(role) {
    if (role === "viewer") {
      const hiddenSelectors = [
        "#btn-start-tournament", "#btn-demo-players",
        "#btn-cancel-setup", "#btn-cancel-tournament", "#btn-proceed-setup"
      ];
      hiddenSelectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.style.display = "none";
      });
      document.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-save-match") ||
            e.target.classList.contains("btn-edit-match")) {
          e.stopImmediatePropagation();
          ui.showToast("🔒 Seu perfil não tem permissão para editar resultados.");
        }
      }, true);
    }
  }

  /* ══════════════════════════════════════════════════════
     LOGOUT
  ══════════════════════════════════════════════════════ */

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Deseja realmente sair do sistema?")) {
        auth.logout();
        window.location.reload();
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     APP PRINCIPAL
  ══════════════════════════════════════════════════════ */

  const sm = new TournamentStateManager();
  const ui = new TournamentUI(sm);
  let appInitialized = false;

  function initApp() {
    if (appInitialized) return;
    appInitialized = true;
    ui.init();
    wireAppEvents();
  }

  /* ══════════════════════════════════════════════════════
     VERIFICAR SESSÃO EXISTENTE
  ══════════════════════════════════════════════════════ */

  if (window.location.hash === "#logout" || window.location.search.includes("logout") || window.location.search.includes("screen=login")) {
    auth.logout();
    history.replaceState(null, "", window.location.pathname);
  }

  const currentUser = auth.getCurrentUser();
  if (currentUser) {
    hideLoginScreen();
    updateUserBadge(currentUser);
    applyPermissions(currentUser.role);
    initApp();
  } else {
    showLoginScreen();
  }



  function wireAppEvents() {

    /* ─── CRIAR NOVO TORNEIO ─── */
    document.getElementById("btn-proceed-setup").addEventListener("click", () => {
      if (!ui._selectedCategory || !ui._selectedFormat) return;

      const titleInput = document.getElementById("input-tournament-title");
      const titleVal = titleInput ? titleInput.value.trim() : "";
      if (!titleVal) {
        const err = document.getElementById("title-error-msg");
        if (err) err.style.display = "block";
        if (titleInput) {
          titleInput.classList.add("input-error");
          titleInput.focus();
          titleInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        ui.showToast("⚠️ O título do torneio é obrigatório!");
        return;
      }

      const newTourn = sm.createTournament(ui._selectedCategory, ui._selectedFormat, titleVal, ui._selectedGender);
      if (newTourn) {
        ui.openTournament(newTourn.id);
        ui.showToast("✨ Torneio \"" + newTourn.title + "\" criado com sucesso!");
      }
    });

    /* ─── BOTÃO "+ NOVO TORNEIO" ─── */
    const btnCreateAnother = document.getElementById("btn-create-another-tournament");
    if (btnCreateAnother) {
      btnCreateAnother.addEventListener("click", () => {
        const stepCat = document.getElementById("step-category");
        if (stepCat) stepCat.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    const btnHeaderNew = document.getElementById("btn-header-new-tournament");
    if (btnHeaderNew) {
      btnHeaderNew.addEventListener("click", () => {
        ui.goToSelection();
        const stepCat = document.getElementById("step-category");
        if (stepCat) stepCat.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    /* ─── SELETOR DE TORNEIOS NO HEADER ─── */
    const selectSwitcher = document.getElementById("select-tournament-switcher");
    if (selectSwitcher) {
      selectSwitcher.addEventListener("change", (e) => {
        if (e.target.value) ui.openTournament(e.target.value);
      });
    }

    /* ─── CONTINUAR TORNEIO ─── */
    const btnResume = document.getElementById("btn-resume-tournament");
    if (btnResume) {
      btnResume.addEventListener("click", () => {
        const active = sm.getActiveTournament();
        if (active) ui.openTournament(active.id);
        else ui.goToSelection();
      });
    }

    /* ─── ABAS ─── */
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", e => ui.switchTab(e.currentTarget.dataset.tab));
    });

    /* ─── VOLTAR À SELEÇÃO ─── */
    const btnBackSel = document.getElementById("btn-back-selection");
    if (btnBackSel) {
      btnBackSel.addEventListener("click", (e) => { e.preventDefault(); ui.goToSelection(); });
    }

    /* ─── DEMO PLAYERS ─── */
    document.getElementById("btn-demo-players").addEventListener("click", () => {
      const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
      const cat = CATEGORIES.find(c => c.id === sm.state.category);
      const fmt = TOURNAMENT_FORMATS[sm.state.format];
      if (!cat || !fmt) return;

      if (fmt.isMixed) {
        const demosM = cat.demoNamesM || [];
        const demosF = cat.demoNamesF || [];
        document.querySelectorAll(".player-name-input[data-gender='m']").forEach((inp, i) => {
          inp.value = demosM[i] || ("Homem " + (i + 1));
          const idx = parseInt(inp.dataset.index);
          if (sm.state.players[idx]) sm.state.players[idx].name = inp.value;
        });
        document.querySelectorAll(".player-name-input[data-gender='f']").forEach((inp, i) => {
          inp.value = demosF[i] || ("Mulher " + (i + 1));
          const idx = parseInt(inp.dataset.index);
          if (sm.state.players[idx]) sm.state.players[idx].name = inp.value;
        });
        sm.saveState();
      } else {
        const isFem = sm.state.gender === "feminino";
        const demoPool = (isFem && cat.demoNamesF) ? cat.demoNamesF : (cat.demoNames || []);
        const demos = demoPool.slice(0, fmt.players);
        const fallbackLabel = isFem ? (cat.id === "duplas" ? "Dupla" : "Atleta") : (cat.playerLabel || "Jogador");
        document.querySelectorAll(".player-name-input").forEach((inp, i) => {
          inp.value = demos[i] || (fallbackLabel + " " + (i + 1));
          const idx = parseInt(inp.dataset.index);
          if (sm.state.players[idx]) sm.state.players[idx].name = inp.value;
        });
        sm.saveState();
      }
    });

    /* ─── SALVAR NOMES AO DIGITAR ─── */
    document.getElementById("players-input-grid").addEventListener("input", e => {
      if (e.target.classList.contains("player-name-input")) {
        const idx = parseInt(e.target.dataset.index);
        if (sm.state.players[idx] !== undefined) {
          sm.state.players[idx].name = e.target.value;
          sm.saveState();
        }
      }
    });

    /* ─── INICIAR TORNEIO ─── */
    document.getElementById("btn-start-tournament").addEventListener("click", () => {
      const inputs = document.querySelectorAll(".player-name-input");
      const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
      const cat = CATEGORIES.find(c => c.id === sm.state.category) || {};
      const fmt = TOURNAMENT_FORMATS[sm.state.format] || {};
      const label = cat.playerLabel || "Jogador";

      const playersList = [];
      inputs.forEach((inp) => {
        const idx    = parseInt(inp.dataset.index);
        const id     = inp.dataset.id     || (sm.state.players[idx] && sm.state.players[idx].id) || ("p" + (idx + 1));
        const gender = inp.dataset.gender || (sm.state.players[idx] && sm.state.players[idx].gender) || null;
        const num    = id ? id.replace(/[a-z]/gi, "") : (idx + 1);
        const name   = inp.value.trim() || (gender === "m" ? "Homem " + num : gender === "f" ? "Mulher " + num : label + " " + (idx + 1));
        playersList.push({ id, name, gender });
      });

      sm.setPlayers(playersList);
      sm.startTournament();
      ui.renderRoundsNav();
      ui.renderMatches();
      ui.renderLeaderboard();
      ui.updateHeaderProgress();
      ui.switchTab("matches");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    /* ─── MODO TV ─── */
    document.getElementById("btn-tv-mode").addEventListener("click", () => {
      document.body.classList.toggle("tv-mode");
      const btn = document.getElementById("btn-tv-mode");
      if (document.body.classList.contains("tv-mode")) {
        btn.classList.replace("btn-secondary", "btn-primary");
        btn.innerHTML = '<span class="btn-icon">✖</span> Sair Telão';
        ui.switchTab("leaderboard");
      } else {
        btn.classList.replace("btn-primary", "btn-secondary");
        btn.innerHTML = '<span class="btn-icon">📺</span> Modo TV';
      }
    });

    /* ─── COMPARTILHAR ─── */
    const modalShare = document.getElementById("modal-share");
    document.getElementById("btn-share-results").addEventListener("click", () => {
      document.getElementById("share-text-area").value = ui.generateShareText();
      modalShare.style.display = "flex";
    });
    document.getElementById("btn-close-modal").addEventListener("click", () => { modalShare.style.display = "none"; });
    document.getElementById("btn-copy-share").addEventListener("click", () => {
      const ta = document.getElementById("share-text-area");
      navigator.clipboard.writeText(ta.value).then(() => {
        const btn = document.getElementById("btn-copy-share");
        const orig = btn.innerHTML;
        btn.innerHTML = "✅ Copiado!";
        setTimeout(() => btn.innerHTML = orig, 2000);
      });
    });
    document.getElementById("btn-open-whatsapp").addEventListener("click", () => {
      const text = encodeURIComponent(document.getElementById("share-text-area").value);
      window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
    });

    /* ─── CANCELAR / EXCLUIR TORNEIO ─── */
    const modalDelete        = document.getElementById("modal-confirm-delete");
    const btnCloseDeleteModal = document.getElementById("btn-close-delete-modal");
    const btnAbortDelete     = document.getElementById("btn-abort-delete");
    const btnExecuteDelete   = document.getElementById("btn-execute-delete");
    let tournamentIdToDelete = null;

    function openDeleteModal(id, title) {
      tournamentIdToDelete = id || (sm.data ? sm.data.activeTournamentId : null);
      const active = id ? sm.getTournaments().find(t => t.id === id) : sm.getActiveTournament();
      const modalText = document.querySelector("#modal-confirm-delete .modal-warning-text");
      if (modalText) {
        const tournName = title || (active ? active.title : "este torneio");
        modalText.textContent = `Deseja realmente cancelar e excluir "${tournName}"?`;
      }
      if (modalDelete) modalDelete.style.display = "flex";
    }

    window.handleDeleteTournamentRequest = (id, title) => openDeleteModal(id, title);

    function closeDeleteModal() {
      if (modalDelete) modalDelete.style.display = "none";
      tournamentIdToDelete = null;
    }

    function executeDeleteTournament() {
      const id = tournamentIdToDelete || (sm.data ? sm.data.activeTournamentId : null);
      closeDeleteModal();
      if (id) sm.deleteTournament(id); else sm.resetTournament();

      const remaining = sm.getTournaments();
      const isAppActive = !document.getElementById("screen-app").classList.contains("sel-hidden");
      if (isAppActive) {
        if (remaining.length > 0 && sm.getActiveTournament()) ui.openTournament(sm.data.activeTournamentId);
        else ui.goToSelection();
      } else {
        ui.renderActiveTournamentsList();
        ui.updateActiveTournamentBanner();
      }
      ui.showToast("🗑️ Torneio excluído com sucesso!");
    }

    if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener("click", closeDeleteModal);
    if (btnAbortDelete)      btnAbortDelete.addEventListener("click", closeDeleteModal);
    if (btnExecuteDelete)    btnExecuteDelete.addEventListener("click", executeDeleteTournament);
    if (modalDelete) modalDelete.addEventListener("click", e => { if (e.target === modalDelete) closeDeleteModal(); });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDeleteModal();
        if (modalShare) modalShare.style.display = "none";
        const mAdmin = document.getElementById("modal-admin-users");
        if (mAdmin) mAdmin.style.display = "none";
        const mPwd = document.getElementById("modal-change-pwd");
        if (mPwd) mPwd.style.display = "none";
        ui.closeMatchupModal();
      }
    });

    ["#btn-cancel-tournament","#btn-reset-tournament","#btn-cancel-setup","#btn-delete-banner-tournament"]
      .forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.addEventListener("click", e => { e.preventDefault(); openDeleteModal(); });
      });

  } // fim wireAppEvents

  /* ══════════════════════════════════════════════════════
     PAINEL ADMIN: GERENCIAR USUÁRIOS
  ══════════════════════════════════════════════════════ */

  const modalAdmin    = document.getElementById("modal-admin-users");
  const btnAdminOpen  = document.getElementById("btn-admin-users");
  const btnAdminClose = document.getElementById("btn-close-admin-modal");
  const adminFeedback = document.getElementById("admin-form-feedback");

  function openAdminModal() {
    if (!auth.isAdmin()) return;
    renderUsersList();
    if (modalAdmin) modalAdmin.style.display = "flex";
  }

  function closeAdminModal() {
    if (modalAdmin) modalAdmin.style.display = "none";
    clearAdminForm();
  }

  if (btnAdminOpen)  btnAdminOpen.addEventListener("click", openAdminModal);
  if (btnAdminClose) btnAdminClose.addEventListener("click", closeAdminModal);
  if (modalAdmin) modalAdmin.addEventListener("click", e => { if (e.target === modalAdmin) closeAdminModal(); });

  // ── Renderizar lista de usuários ────────────────────
  function renderUsersList() {
    const listBody = document.getElementById("admin-users-list-body");
    const countEl  = document.getElementById("admin-users-count");
    if (!listBody) return;

    const users = auth.getUsers();
    if (countEl) countEl.textContent = users.length;

    const roleLabels = { admin: "👑 Administrador", operator: "🎯 Operador", viewer: "👁️ Visualizador" };

    listBody.innerHTML = "";
    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "user-card" + (user.active === false ? " inactive" : "");
      const initials  = (user.displayName || user.username).split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
      const isProtected = user.id === "admin-001";

      card.innerHTML =
        `<div class="user-card-avatar role-${user.role}">${initials}</div>` +
        `<div class="user-card-info">
           <div class="user-card-name">${user.displayName || user.username}</div>
           <div class="user-card-username">@${user.username}</div>
         </div>` +
        `<div class="user-card-badges">
           <span class="permission-badge role-${user.role}">${roleLabels[user.role] || user.role}</span>
           ${user.active === false ? '<span class="badge-inactive">Inativo</span>' : ""}
         </div>` +
        `<div class="user-card-actions">
           <button class="btn-user-action btn-change-pwd" data-uid="${user.id}" data-uname="${user.displayName || user.username}" title="Alterar senha">🔑</button>
           ${!isProtected ? `<button class="btn-user-action btn-toggle-active" data-uid="${user.id}" title="${user.active === false ? "Ativar" : "Desativar"} usuário">${user.active === false ? "✅" : "⏸️"}</button>` : ""}
           ${!isProtected ? `<button class="btn-user-action btn-delete-user" data-uid="${user.id}" data-uname="${user.displayName || user.username}" title="Excluir usuário">🗑️</button>` : ""}
         </div>`;

      card.querySelector(".btn-change-pwd").addEventListener("click", e => {
        openChangePwdModal(e.currentTarget.dataset.uid, e.currentTarget.dataset.uname);
      });

      const btnToggle = card.querySelector(".btn-toggle-active");
      if (btnToggle) {
        btnToggle.addEventListener("click", e => {
          const result = auth.toggleUserActive(e.currentTarget.dataset.uid);
          if (result.success) {
            renderUsersList();
            ui.showToast(result.active ? "✅ Usuário ativado." : "⏸️ Usuário desativado.");
          }
        });
      }

      const btnDel = card.querySelector(".btn-delete-user");
      if (btnDel) {
        btnDel.addEventListener("click", e => {
          const uname = e.currentTarget.dataset.uname;
          if (confirm(`Excluir o usuário "${uname}"? Esta ação não pode ser desfeita.`)) {
            const result = auth.deleteUser(e.currentTarget.dataset.uid);
            if (result.success) { renderUsersList(); ui.showToast("🗑️ Usuário excluído."); }
            else ui.showToast("❌ " + result.error);
          }
        });
      }

      listBody.appendChild(card);
    });
  }

  // ── Criar novo usuário ──────────────────────────────
  function showAdminFeedback(msg, type) {
    if (!adminFeedback) return;
    adminFeedback.textContent = msg;
    adminFeedback.className = "admin-form-feedback " + type;
    setTimeout(() => { adminFeedback.className = "admin-form-feedback"; }, 3500);
  }

  function clearAdminForm() {
    ["new-user-username","new-user-displayname","new-user-password"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    const roleEl = document.getElementById("new-user-role");
    if (roleEl) roleEl.value = "operator";
    if (adminFeedback) adminFeedback.className = "admin-form-feedback";
  }

  const btnCreateUser = document.getElementById("btn-create-user");
  if (btnCreateUser) {
    btnCreateUser.addEventListener("click", () => {
      const username    = (document.getElementById("new-user-username")?.value || "").trim();
      const displayName = (document.getElementById("new-user-displayname")?.value || "").trim();
      const password    = (document.getElementById("new-user-password")?.value || "");
      const role        = document.getElementById("new-user-role")?.value || "operator";

      if (!username)           { showAdminFeedback("⚠️ Informe o nome de usuário (login).", "error"); return; }
      if (password.length < 4) { showAdminFeedback("⚠️ A senha deve ter no mínimo 4 caracteres.", "error"); return; }

      const result = auth.createUser({ username, displayName, password, role });
      if (!result.success) { showAdminFeedback("❌ " + result.error, "error"); return; }

      showAdminFeedback("✅ Usuário \"" + (displayName || username) + "\" criado com sucesso!", "success");
      clearAdminForm();
      renderUsersList();
    });
  }

  // ── Modal: Alterar senha ────────────────────────────
  const modalChangePwd     = document.getElementById("modal-change-pwd");
  const btnCloseChangePwd  = document.getElementById("btn-close-change-pwd");
  const btnAbortChangePwd  = document.getElementById("btn-abort-change-pwd");
  const btnConfirmChangePwd = document.getElementById("btn-confirm-change-pwd");
  const changePwdFeedback  = document.getElementById("change-pwd-feedback");
  let changePwdUserId = null;

  function openChangePwdModal(userId, userName) {
    changePwdUserId = userId;
    const nameEl = document.getElementById("change-pwd-username");
    if (nameEl) nameEl.textContent = userName;
    ["change-pwd-new","change-pwd-confirm"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    if (changePwdFeedback) changePwdFeedback.className = "admin-form-feedback";
    if (modalChangePwd) modalChangePwd.style.display = "flex";
  }

  function closeChangePwdModal() {
    if (modalChangePwd) modalChangePwd.style.display = "none";
    changePwdUserId = null;
  }

  if (btnCloseChangePwd)  btnCloseChangePwd.addEventListener("click", closeChangePwdModal);
  if (btnAbortChangePwd)  btnAbortChangePwd.addEventListener("click", closeChangePwdModal);
  if (modalChangePwd) modalChangePwd.addEventListener("click", e => { if (e.target === modalChangePwd) closeChangePwdModal(); });

  if (btnConfirmChangePwd) {
    btnConfirmChangePwd.addEventListener("click", () => {
      const newPwd     = document.getElementById("change-pwd-new")?.value || "";
      const confirmPwd = document.getElementById("change-pwd-confirm")?.value || "";

      if (newPwd.length < 4) {
        if (changePwdFeedback) { changePwdFeedback.textContent = "⚠️ A senha deve ter no mínimo 4 caracteres."; changePwdFeedback.className = "admin-form-feedback error"; }
        return;
      }
      if (newPwd !== confirmPwd) {
        if (changePwdFeedback) { changePwdFeedback.textContent = "⚠️ As senhas não coincidem."; changePwdFeedback.className = "admin-form-feedback error"; }
        return;
      }

      const result = auth.updateUser(changePwdUserId, { password: newPwd });
      if (result.success) {
        closeChangePwdModal();
        ui.showToast("🔑 Senha alterada com sucesso!");
      } else {
        if (changePwdFeedback) { changePwdFeedback.textContent = "❌ " + result.error; changePwdFeedback.className = "admin-form-feedback error"; }
      }
    });
  }

});
