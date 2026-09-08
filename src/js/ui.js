/**
 * SUPER BEACH TENNIS - MÓDULO DE INTERFACE (UI)
 */
class TournamentUI {
  constructor(stateManager) {
    this.sm = stateManager;
    this._selectedCategory = null;
    this._selectedFormat = null;
    this._selectedGender = 'masculino';
    this._roundsViewMode = 'single';
    this._matchupsViewMode = 'matrix';
    this._matchupsGenderFilter = 'all';
    this._matchupsSearchQuery = '';
  }

  /* ─── TELAS PRINCIPAIS ─────────────────────────────── */

  showScreen(screen) {
    const sel = document.getElementById('screen-selection');
    const app = document.getElementById('screen-app');
    if (!sel || !app) return;
    if (screen === 'selection') {
      sel.classList.remove('sel-hidden');
      app.classList.add('sel-hidden');
    } else {
      sel.classList.add('sel-hidden');
      app.classList.remove('sel-hidden');
    }
  }

  goToSelection() {
    this._selectedCategory = null;
    this._selectedFormat = null;
    this._selectedGender = 'masculino';
    this.showScreen('selection');
    this.renderActiveTournamentsList();
    this.renderCategoryCards();
    const stepFmt = document.getElementById('step-format');
    if (stepFmt) stepFmt.classList.add('sel-hidden');
    const stepCfg = document.getElementById('step-config');
    if (stepCfg) stepCfg.classList.add('sel-hidden');
    const cta = document.getElementById('sel-cta');
    if (cta) cta.classList.add('sel-hidden');

    const titleInput = document.getElementById('input-tournament-title');
    if (titleInput) {
      titleInput.value = '';
      titleInput.classList.remove('input-error');
    }
    const titleErr = document.getElementById('title-error-msg');
    if (titleErr) titleErr.style.display = 'none';

    this.updateActiveTournamentBanner();
    this.initGenderSelector();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderActiveTournamentsList() {
    const section = document.getElementById('sel-active-tournaments-section');
    const grid = document.getElementById('active-tournaments-grid');
    if (!section || !grid) return;

    const tournaments = this.sm.getTournaments();
    if (!tournaments || tournaments.length === 0) {
      section.classList.add('sel-hidden');
      return;
    }

    section.classList.remove('sel-hidden');
    grid.innerHTML = '';

    const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
    const activeId = this.sm.data ? this.sm.data.activeTournamentId : null;

    tournaments.forEach(tourn => {
      const cat = CATEGORIES.find(c => c.id === tourn.category) || {};
      const fmt = TOURNAMENT_FORMATS[tourn.format] || {};
      const isCurrent = tourn.id === activeId;

      let completed = 0, total = 0;
      if (tourn.rounds) {
        tourn.rounds.forEach(r => r.matches.forEach(m => {
          if (!m.isByeMatch) { total++; if (m.finished) completed++; }
        }));
      }

      const card = document.createElement('div');
      card.className = 'active-tournament-card' + (isCurrent ? ' current' : '');
      card.innerHTML =
        '<div class="active-tourn-header">' +
          '<div class="active-tourn-icon" style="background:' + (cat.gradient || 'var(--accent-orange)') + ';">' + (cat.icon || '🎾') + '</div>' +
          '<div class="active-tourn-details">' +
            '<h3 class="active-tourn-title">' + (tourn.title || (fmt.name + ' · ' + cat.label)) + '</h3>' +
            '<div class="active-tourn-meta">' +
              '<span class="active-tourn-status ' + (tourn.started ? 'playing' : 'setup') + '">' +
                (tourn.started ? '⚔️ Em andamento (' + completed + '/' + total + ')' : '👥 Inscrição') +
              '</span>' +
              '<span>&middot;</span>' +
              '<span>' + (tourn.players ? tourn.players.length : 0) + ' ' + (cat.playerLabel || 'atletas') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="active-tourn-footer">' +
          '<button type="button" class="btn btn-secondary btn-sm btn-open-tourn">' +
            'Abrir Torneio &rarr;' +
          '</button>' +
          '<button type="button" class="btn btn-danger-outline btn-sm btn-delete-tourn" title="Excluir este torneio">' +
            '🗑️' +
          '</button>' +
        '</div>';

      card.querySelector('.btn-open-tourn').addEventListener('click', () => {
        this.openTournament(tourn.id);
      });

      card.querySelector('.btn-delete-tourn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.handleDeleteTournamentRequest) {
          window.handleDeleteTournamentRequest(tourn.id, tourn.title);
        }
      });

      grid.appendChild(card);
    });
  }

  renderTournamentSwitcher() {
    const select = document.getElementById('select-tournament-switcher');
    const wrap = document.getElementById('tournament-switcher-wrap');
    if (!select || !wrap) return;

    const tournaments = this.sm.getTournaments();
    if (!tournaments || tournaments.length === 0) {
      wrap.style.display = 'none';
      return;
    }

    wrap.style.display = 'flex';
    select.innerHTML = '';
    const activeId = this.sm.data ? this.sm.data.activeTournamentId : null;

    tournaments.forEach(tourn => {
      const opt = document.createElement('option');
      opt.value = tourn.id;
      const statusIcon = tourn.started ? '⚔️ ' : '👥 ';
      opt.textContent = statusIcon + (tourn.title || 'Torneio');
      if (tourn.id === activeId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  openTournament(tournamentId) {
    const tourn = this.sm.switchTournament(tournamentId);
    if (!tourn) return;
    this._selectedCategory = tourn.category;
    this._selectedFormat = tourn.format;
    this.showScreen('app');
    this.updateAppHeader();
    this.renderPlayersSetup();
    if (tourn.started) {
      this.renderRoundsNav();
      this.renderMatches();
      this.renderLeaderboard();
      this.switchTab('matches');
    } else {
      this.switchTab('setup');
    }
    this.updateHeaderProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateActiveTournamentBanner() {
    const banner = document.getElementById('sel-active-banner');
    const textEl = document.getElementById('sel-active-text');
    if (!banner || !textEl) return;

    const { category, format, started, players } = this.sm.state;
    if (category && format && (started || (players && players.length > 0))) {
      const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
      const cat = CATEGORIES.find(c => c.id === category);
      const fmt = TOURNAMENT_FORMATS[format];
      if (cat && fmt) {
        textEl.innerHTML = '<strong>' + fmt.name + '</strong> &middot; ' + cat.label + ' ' +
          (started ? '<span style="color:var(--accent-orange)">(Em andamento)</span>' : '<span style="color:var(--text-secondary)">(Configurado)</span>');
        banner.classList.remove('sel-hidden');
        return;
      }
    }
    banner.classList.add('sel-hidden');
  }

  showToast(message, duration = 3200) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  init() {
    this.initRoundsModeToggle();
    this.initMatchupsEvents();
    const active = this.sm.getActiveTournament();
    if (!active || active.phase === 'selection') {
      this.goToSelection();
    } else {
      this.openTournament(active.id);
    }
  }

  /* ─── TELA DE SELEÇÃO ───────────────────────────────── */

  setupGenderOptionsForCategory(categoryId) {
    const grid = document.getElementById('gender-selector-grid');
    if (!grid) return;
    const btns = grid.querySelectorAll('.gender-btn-option');

    if (categoryId === 'mistas') {
      this._selectedGender = 'misto';
      btns.forEach(b => {
        const isMisto = b.dataset.gender === 'misto';
        b.classList.toggle('active', isMisto);
        b.style.display = isMisto ? 'flex' : 'none';
      });
    } else {
      if (this._selectedGender === 'misto') this._selectedGender = 'masculino';
      btns.forEach(b => {
        b.style.display = 'flex';
        b.classList.toggle('active', b.dataset.gender === this._selectedGender);
      });
    }
  }

  initGenderSelector() {
    const grid = document.getElementById('gender-selector-grid');
    if (!grid || this._genderInitDone) return;
    this._genderInitDone = true;

    grid.querySelectorAll('.gender-btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.gender-btn-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._selectedGender = btn.dataset.gender;
        if (this._selectedCategory && this._selectedFormat) {
          const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
          const cat = CATEGORIES.find(c => c.id === this._selectedCategory);
          const fmt = TOURNAMENT_FORMATS[this._selectedFormat];
          if (cat && fmt) this.renderSelectionSummary(cat, fmt);
        }
      });
    });

    const titleInput = document.getElementById('input-tournament-title');
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        titleInput.classList.remove('input-error');
        const err = document.getElementById('title-error-msg');
        if (err) err.style.display = 'none';
        if (this._selectedCategory && this._selectedFormat) {
          const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
          const cat = CATEGORIES.find(c => c.id === this._selectedCategory);
          const fmt = TOURNAMENT_FORMATS[this._selectedFormat];
          if (cat && fmt) this.renderSelectionSummary(cat, fmt);
        }
      });
    }
  }

  renderCategoryCards() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;
    const { CATEGORIES } = window.TournamentConfig;
    grid.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'sel-category-card' + (this._selectedCategory === cat.id ? ' selected' : '');
      card.style.setProperty('--card-color', cat.color);
      card.style.setProperty('--card-glow', cat.borderColor);

      card.innerHTML =
        '<div class="sel-cat-icon-wrap" style="font-size:2.6rem;width:68px;height:68px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:' + cat.gradient + ';margin-bottom:0.25rem;">' + cat.icon + '</div>' +
        '<div class="sel-category-name">' + cat.label + '</div>' +
        '<div class="sel-category-desc">' + cat.description.replace(/\n/g, '<br>') + '</div>';

      card.addEventListener('click', () => {
        document.querySelectorAll('.sel-category-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this._selectedCategory = cat.id;

        // Mistas: formato único — pular direto para o Passo 3
        if (cat.singleFormat) {
          this._selectedFormat = cat.singleFormat;
          this.setupGenderOptionsForCategory(cat.id);
          const { TOURNAMENT_FORMATS } = window.TournamentConfig;
          const fmt = TOURNAMENT_FORMATS[cat.singleFormat];
          document.getElementById('step-format').classList.add('sel-hidden');
          const stepCfg = document.getElementById('step-config');
          if (stepCfg) stepCfg.classList.remove('sel-hidden');
          this.renderSelectionSummary(cat, fmt);
          const cta = document.getElementById('sel-cta');
          cta.classList.remove('sel-hidden');
          stepCfg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          this._selectedFormat = null;
          this.setupGenderOptionsForCategory(cat.id);
          this.renderFormatCards(cat);
          const stepFmt = document.getElementById('step-format');
          stepFmt.classList.remove('sel-hidden');
          const stepCfg = document.getElementById('step-config');
          if (stepCfg) stepCfg.classList.add('sel-hidden');
          document.getElementById('sel-cta').classList.add('sel-hidden');
          stepFmt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      grid.appendChild(card);
    });
  }

  renderFormatCards(cat) {
    const grid = document.getElementById('format-grid');
    if (!grid) return;
    const { TOURNAMENT_FORMATS, CATEGORY_FORMATS } = window.TournamentConfig;
    grid.innerHTML = '';

    const allowedIds = CATEGORY_FORMATS[cat.id] || Object.keys(TOURNAMENT_FORMATS);

    allowedIds.forEach(fmtId => {
      const fmt = TOURNAMENT_FORMATS[fmtId];
      if (!fmt) return;

      const card = document.createElement('div');
      card.className = 'sel-format-card' + (fmt.featured ? ' featured' : '') +
        (this._selectedFormat === fmtId ? ' selected' : '');
      card.style.setProperty('--active-color', cat.color);
      card.innerHTML =
        '<div class="sel-format-numeral" style="color:' + cat.color + ';">' + fmt.numeral + '</div>' +
        '<div class="sel-format-name">' + fmt.name + '</div>' +
        '<div class="sel-format-desc">' + fmt.description + '</div>';

      card.addEventListener('click', () => {
        document.querySelectorAll('.sel-format-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this._selectedFormat = fmt.id;
        const stepCfg = document.getElementById('step-config');
        if (stepCfg) stepCfg.classList.remove('sel-hidden');
        this.renderSelectionSummary(cat, fmt);
        const cta = document.getElementById('sel-cta');
        cta.classList.remove('sel-hidden');
        stepCfg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      grid.appendChild(card);
    });
  }

  renderSelectionSummary(cat, fmt) {
    const box = document.getElementById('sel-summary-card');
    if (!box) return;

    const titleInput = document.getElementById('input-tournament-title');
    const enteredTitle = titleInput ? titleInput.value.trim() : '';

    const genderLabel = this._selectedGender === 'feminino' ? '👩 Feminino' : this._selectedGender === 'misto' ? '🔀 Misto' : '👨 Masculino';

    const pLabel = (cat.id === 'duplas') ? 'Dupla' : (this._selectedGender === 'feminino' ? 'Atleta' : cat.playerLabel);
    const playersLabel = fmt.isMixed
      ? (fmt.playersPerGender || 8) + ' Homens + ' + (fmt.playersPerGender || 8) + ' Mulheres'
      : fmt.players + ' ' + pLabel + (fmt.players > 1 ? 's' : '');

    box.innerHTML =
      '<div class="summary-item"><span class="summary-label">Título</span><span class="summary-value" style="color:var(--text-primary);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (enteredTitle || '<em>(Definir título...)</em>') + '</span></div>' +
      '<div class="summary-divider"></div>' +
      '<div class="summary-item"><span class="summary-label">Gênero</span><span class="summary-value">' + genderLabel + '</span></div>' +
      '<div class="summary-divider"></div>' +
      '<div class="summary-item"><span class="summary-label">Categoria</span><span class="summary-value">' + cat.icon + ' ' + cat.label + '</span></div>' +
      '<div class="summary-divider"></div>' +
      '<div class="summary-item"><span class="summary-label">Formato</span><span class="summary-value" style="color:' + cat.color + '">' + fmt.name + '</span></div>' +
      '<div class="summary-divider"></div>' +
      '<div class="summary-item"><span class="summary-label">Participantes</span><span class="summary-value">' + playersLabel + '</span></div>';
  }

  /* ─── NAVEGAÇÃO / ABAS ──────────────────────────────── */

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn =>
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId));
    document.querySelectorAll('.tab-pane').forEach(pane =>
      pane.classList.toggle('active', pane.id === 'tab-' + tabId));
    if (tabId === 'leaderboard') this.renderLeaderboard();
    if (tabId === 'matches') this.renderMatches();
    if (tabId === 'matchups') this.renderMatchups();
  }

  updateAppHeader() {
    this.renderTournamentSwitcher();
    const active = this.sm.getActiveTournament();
    if (!active) return;
    const { TOURNAMENT_FORMATS, CATEGORIES } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[active.format];
    const cat = CATEGORIES.find(c => c.id === active.category);
    if (!fmt || !cat) return;

    const g = active.gender || 'masculino';
    const genderLabel = g === 'feminino' ? '👩 Feminino' : g === 'misto' ? '🔀 Misto' : '👨 Masculino';
    const isMixed = !!fmt.isMixed;

    const titleEl       = document.getElementById('app-title-dyn');
    const subtitleEl    = document.getElementById('app-subtitle-dyn');
    const leaderTitle   = document.getElementById('leaderboard-title');
    const leaderCol     = document.getElementById('leaderboard-col-player');
    const setupTitle    = document.getElementById('setup-title');
    const setupDesc     = document.getElementById('setup-desc');
    const setupInfo     = document.getElementById('setup-info-text');

    if (titleEl) {
      titleEl.innerHTML = active.title || ('SUPER <span>BT</span>');
    }
    if (subtitleEl) {
      subtitleEl.textContent = 'DB Eventos · ' + fmt.name + ' · ' + cat.label + ' · ' + genderLabel;
    }
    if (leaderTitle) {
      leaderTitle.textContent = isMixed
        ? 'Classificação Mistas · Super 8 Individual'
        : 'Classificação Geral · ' + (active.title || cat.label);
    }
    if (leaderCol) {
      leaderCol.textContent = (cat.id === 'duplas') ? 'Dupla' : (g === 'feminino' ? 'Atleta' : 'Atleta');
    }

    if (setupTitle) {
      setupTitle.textContent = isMixed
        ? 'Inscrição dos Atletas — Super 8 Mistas Individual'
        : 'Inscrição: ' + (active.title || (fmt.players + ' Participantes'));
    }
    if (setupDesc) {
      setupDesc.textContent = isMixed
        ? 'Insira os nomes dos 8 Homens e 8 Mulheres que disputarão o torneio.'
        : 'Insira os nomes dos participantes de ' + (active.title || fmt.name) + ' (' + genderLabel + ').';
    }
    if (setupInfo) {
      if (isMixed) {
        setupInfo.innerHTML = '<strong>Super 8 Mistas Individual:</strong> 8 Homens + 8 Mulheres · 7 rodadas · 4 quadras por rodada · Duplas mistas rotativas.';
      } else if (active.category === 'duplas') {
        const nr = fmt.players % 2 === 0 ? fmt.players - 1 : fmt.players;
        setupInfo.innerHTML = '<strong>' + (active.title || fmt.name) + ':</strong> ' + fmt.players + ' duplas · ' + nr + ' rodadas · ' + genderLabel;
      } else {
        const nr = fmt.players % 2 === 0 ? fmt.players - 1 : fmt.players;
        setupInfo.innerHTML = '<strong>' + (active.title || fmt.name) + ':</strong> ' + fmt.players + ' atletas · ' + nr + ' rodadas · Duplas rotativas · ' + genderLabel;
      }
    }
  }

  /* ─── SETUP DE JOGADORES ────────────────────────────── */

  renderPlayersSetup() {
    const container = document.getElementById('players-input-grid');
    if (!container) return;
    container.innerHTML = '';

    const active = this.sm.getActiveTournament();
    if (!active) return;
    const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
    const cat = CATEGORIES.find(c => c.id === active.category) || {};
    const fmt = TOURNAMENT_FORMATS[active.format] || {};
    const players = active.players || [];
    const isMixed = !!fmt.isMixed;
    const g = active.gender || 'masculino';

    if (isMixed) {
      // ── Seção Homens ──────────────────────────────────
      const menSection = document.createElement('div');
      menSection.className = 'gender-section gender-men';
      menSection.innerHTML =
        '<div class="gender-section-header">' +
          '<span class="gender-badge men">👨 Homens</span>' +
          '<span class="gender-count">8 atletas</span>' +
        '</div>' +
        '<div class="gender-players-grid" id="men-players-grid"></div>';
      container.appendChild(menSection);

      const menGrid = menSection.querySelector('#men-players-grid');
      players.filter(p => p.gender === 'm').forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'player-card-input';
        card.innerHTML =
          '<div class="player-number-badge men-badge">' + (idx + 1) + '</div>' +
          '<div class="player-input-wrapper">' +
            '<label class="player-input-label">Homem ' + (idx + 1) + '</label>' +
            '<input type="text" class="player-name-input" data-index="' + players.indexOf(p) + '" data-id="' + p.id + '" data-gender="m" value="' + p.name + '" placeholder="Nome do Atleta" maxlength="30" />' +
          '</div>';
        menGrid.appendChild(card);
      });

      // ── Seção Mulheres ────────────────────────────────
      const womenSection = document.createElement('div');
      womenSection.className = 'gender-section gender-women';
      womenSection.innerHTML =
        '<div class="gender-section-header">' +
          '<span class="gender-badge women">👩 Mulheres</span>' +
          '<span class="gender-count">8 atletas</span>' +
        '</div>' +
        '<div class="gender-players-grid" id="women-players-grid"></div>';
      container.appendChild(womenSection);

      const womenGrid = womenSection.querySelector('#women-players-grid');
      players.filter(p => p.gender === 'f').forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'player-card-input';
        card.innerHTML =
          '<div class="player-number-badge women-badge">' + (idx + 1) + '</div>' +
          '<div class="player-input-wrapper">' +
            '<label class="player-input-label">Mulher ' + (idx + 1) + '</label>' +
            '<input type="text" class="player-name-input" data-index="' + players.indexOf(p) + '" data-id="' + p.id + '" data-gender="f" value="' + p.name + '" placeholder="Nome da Atleta" maxlength="30" />' +
          '</div>';
        womenGrid.appendChild(card);
      });

    } else {
      // ── Individual / Duplas Fixas (modo padrão) ───────
      const playerLabelText = (active.category === 'duplas') ? 'Dupla' : (g === 'feminino' ? 'Atleta' : 'Atleta');
      const placeholderText = (active.category === 'duplas') ? 'Ex: Carlos & Bruna' : (g === 'feminino' ? 'Nome da Atleta' : 'Nome do Atleta');

      players.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'player-card-input';
        card.innerHTML =
          '<div class="player-number-badge">' + (idx + 1) + '</div>' +
          '<div class="player-input-wrapper">' +
            '<label class="player-input-label">' + playerLabelText + ' ' + (idx + 1) + '</label>' +
            '<input type="text" class="player-name-input" data-index="' + idx + '" value="' + p.name + '" placeholder="' + placeholderText + '" maxlength="30" />' +
          '</div>';
        container.appendChild(card);
      });
    }

    this.updateAppHeader();
  }

  /* ─── MODO DE VISUALIZAÇÃO DAS RODADAS ─────────────── */

  initRoundsModeToggle() {
    if (this._modeToggleInitDone) return;
    this._modeToggleInitDone = true;

    const btnSingle = document.getElementById('btn-mode-single-round');
    const btnAll    = document.getElementById('btn-mode-all-rounds');
    const btnQuick  = document.getElementById('btn-quick-view-all');

    if (btnSingle) {
      btnSingle.addEventListener('click', () => this.setRoundsViewMode('single'));
    }
    if (btnAll) {
      btnAll.addEventListener('click', () => this.setRoundsViewMode('all'));
    }
    if (btnQuick) {
      btnQuick.addEventListener('click', () => {
        this.setRoundsViewMode('all');
        const viewAll = document.getElementById('view-all-rounds');
        if (viewAll) viewAll.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  setRoundsViewMode(mode) {
    this._roundsViewMode = mode;
    const btnSingle  = document.getElementById('btn-mode-single-round');
    const btnAll     = document.getElementById('btn-mode-all-rounds');
    const viewSingle = document.getElementById('view-single-round');
    const viewAll    = document.getElementById('view-all-rounds');

    if (mode === 'all') {
      if (btnSingle) btnSingle.classList.remove('active');
      if (btnAll) btnAll.classList.add('active');
      if (viewSingle) viewSingle.classList.add('sel-hidden');
      if (viewAll) viewAll.classList.remove('sel-hidden');
      this.renderAllRoundsOverview();
    } else {
      if (btnSingle) btnSingle.classList.add('active');
      if (btnAll) btnAll.classList.remove('active');
      if (viewSingle) viewSingle.classList.remove('sel-hidden');
      if (viewAll) viewAll.classList.add('sel-hidden');
      this.renderRoundsNav();
      this.renderMatches();
    }
  }

  renderAllRoundsOverview() {
    const grid = document.getElementById('all-rounds-grid');
    const badge = document.getElementById('all-rounds-count-badge');
    if (!grid) return;

    const rounds = this.sm.state.rounds || [];
    if (badge) badge.textContent = rounds.length + ' Rodadas';

    if (!this.sm.state.started || !rounds.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-secondary);"><h3>Nenhum jogo em andamento</h3><p style="margin-top:.5rem">Cadastre os participantes e clique em <strong>Iniciar Torneio</strong>.</p></div>';
      return;
    }

    const { TOURNAMENT_FORMATS } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[this.sm.state.format] || {};
    const category = this.sm.state.category;
    const currentRound = this.sm.state.currentRound || 1;

    let html = '';
    rounds.forEach(rd => {
      const isCurrent = rd.round === currentRound;
      const isCompleted = rd.matches.length > 0 && rd.matches.every(m => m.finished || m.isByeMatch);
      const hasAnyFinished = rd.matches.some(m => m.finished);
      const statusText = isCompleted ? '✓ Concluída' : (hasAnyFinished ? '⚡ Em andamento' : '⏳ A disputar');
      const statusClass = isCompleted ? 'concluida' : (hasAnyFinished ? 'em-andamento' : 'pendente');

      let matchesHtml = '';
      rd.matches.forEach(m => {
        const teamALabel = this._teamLabel(m.teamA, category, fmt);
        const teamBLabel = this._teamLabel(m.teamB, category, fmt);
        const isFin = !!m.finished;
        const winnerA = isFin && m.scoreA > m.scoreB;
        const winnerB = isFin && m.scoreB > m.scoreA;

        matchesHtml +=
          '<div class="overview-match-item ' + (isFin ? 'finished' : '') + '">' +
            '<div class="overview-match-court-line">' +
              '<span class="overview-court-pill">' + m.court + '</span>' +
              (fmt.isMixed ? '<span class="mixed-badge">🔀 Mistas</span>' : '') +
              '<span class="overview-status-text ' + (isFin ? 'concluida' : 'pendente') + '">' +
                (isFin ? '✓ Finalizada' : 'A disputar') +
              '</span>' +
            '</div>' +
            '<div class="overview-teams-row">' +
              '<div class="overview-team-side team-a ' + (winnerA ? 'winner' : '') + '">' +
                '<span class="overview-team-names">' + teamALabel + '</span>' +
              '</div>' +
              '<div class="overview-vs-block">' +
                '<span class="overview-score-display ' + (isFin ? 'finished' : 'pending') + '">' +
                  (isFin ? (m.scoreA + ' &times; ' + m.scoreB) : '— &times; —') +
                '</span>' +
              '</div>' +
              '<div class="overview-team-side team-b ' + (winnerB ? 'winner' : '') + '">' +
                '<span class="overview-team-names">' + teamBLabel + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      });

      let byeHtml = '';
      if (rd.byePlayers && rd.byePlayers.length > 0) {
        byeHtml =
          '<div class="overview-bye-box">' +
            '<span class="bye-label">💤 Folga:</span> ' +
            rd.byePlayers.map(p => '<span class="bye-player-chip">' + p.name + '</span>').join(' ') +
          '</div>';
      }

      html +=
        '<div class="round-overview-card ' + (isCurrent ? 'active-round' : '') + ' ' + (isCompleted ? 'completed-round' : '') + '">' +
          '<div class="round-overview-header">' +
            '<div class="round-overview-title">' +
              '<span class="round-overview-badge">Rodada ' + rd.round + '</span>' +
              '<span class="round-overview-status ' + statusClass + '">' + statusText + '</span>' +
            '</div>' +
            '<button type="button" class="btn btn-sm btn-secondary btn-jump-round" data-round="' + rd.round + '" title="Abrir a Rodada ' + rd.round + '">' +
              '🎯 Pontuar Rodada &rarr;' +
            '</button>' +
          '</div>' +
          '<div class="overview-matches-list">' +
            matchesHtml +
          '</div>' +
          byeHtml +
        '</div>';
    });

    grid.innerHTML = html;

    grid.querySelectorAll('.btn-jump-round').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roundNum = parseInt(e.currentTarget.dataset.round);
        if (roundNum) {
          this.sm.setCurrentRound(roundNum);
          this.setRoundsViewMode('single');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  /* ─── RODADAS ──────────────────────────────────────── */

  renderRoundsNav() {
    const container = document.getElementById('rounds-nav-buttons');
    if (!container || !this.sm.state.rounds) return;
    container.innerHTML = '';
    const currentRound = this.sm.state.currentRound || 1;

    this.sm.state.rounds.forEach(rd => {
      const isCompleted = rd.matches.length > 0 && rd.matches.every(m => m.finished || m.isByeMatch);
      const btn = document.createElement('button');
      btn.className = 'round-pill-btn' + (currentRound === rd.round ? ' active' : '') + (isCompleted ? ' completed' : '');
      btn.innerHTML = 'R' + rd.round + (isCompleted ? ' ✓' : '');
      btn.addEventListener('click', () => {
        this.sm.setCurrentRound(rd.round);
        this.renderRoundsNav();
        this.renderMatches();
      });
      container.appendChild(btn);
    });

    const statusEl = document.getElementById('round-status-text');
    if (statusEl) statusEl.textContent = 'Rodada ' + currentRound + ' de ' + this.sm.state.rounds.length;
  }

  /* ─── PARTIDAS ─────────────────────────────────────── */

  _teamLabel(team, category, fmt) {
    if (!team || !team.length) return '—';
    if (category === 'duplas') return team[0].name;
    if (fmt && fmt.isMixed) {
      // Mistas: (Homem & Mulher)
      const man   = team.find(p => p.gender === 'm');
      const woman = team.find(p => p.gender === 'f');
      const manName   = man   ? '<span class="gender-tag men-tag">👨</span> ' + man.name   : '';
      const womanName = woman ? '<span class="gender-tag women-tag">👩</span> ' + woman.name : '';
      return manName + (manName && womanName ? ' &amp; ' : '') + womanName;
    }
    if (team.length === 1) return team[0].name;
    return team[0].name + (team[1] ? ' &amp; ' + team[1].name : '');
  }

  renderMatches() {
    const container = document.getElementById('matches-grid');
    if (!container) return;

    if (!this.sm.state.started || !this.sm.state.rounds || !this.sm.state.rounds.length) {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-secondary);"><h3>Nenhum jogo em andamento</h3><p style="margin-top:.5rem">Cadastre os participantes e clique em <strong>Iniciar Torneio</strong>.</p></div>';
      return;
    }

    const currentRound = this.sm.state.currentRound || 1;
    const roundData = this.sm.state.rounds.find(r => r.round === currentRound);
    if (!roundData) return;

    const { TOURNAMENT_FORMATS } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[this.sm.state.format] || {};
    const category = this.sm.state.category;

    container.innerHTML = '';

    roundData.matches.forEach(match => {
      const isFinished = !!match.finished;
      const isEditing  = !!match.isEditing;
      const isLocked   = isFinished && !isEditing;
      const isTeamAWinner = isFinished && match.scoreA > match.scoreB;
      const isTeamBWinner = isFinished && match.scoreB > match.scoreA;

      const teamALabel = this._teamLabel(match.teamA, category, fmt);
      const teamBLabel = this._teamLabel(match.teamB, category, fmt);

      const card = document.createElement('div');
      card.className = 'match-card' + (isFinished ? ' finished' : '') + (isEditing ? ' editing-active' : '') + (fmt.isMixed ? ' mixed-match' : '');

      card.innerHTML =
        '<div class="match-court-header">' +
          '<span class="court-badge">' + match.court + '</span>' +
          (fmt.isMixed ? '<span class="mixed-badge">🔀 Mistas</span>' : '') +
          '<span class="match-status-badge ' + (isFinished ? 'concluida' : 'pendente') + '">' +
            (isFinished ? (isEditing ? '✏️ Editando...' : '✓ Finalizada / Salva') : 'Aguardando Resultado') +
          '</span>' +
        '</div>' +
        '<div class="match-body">' +
          '<div class="team-row ' + (isTeamAWinner ? 'winner' : '') + '">' +
            '<div class="team-players"><span class="team-name-label">Dupla 1</span>' +
              '<div class="team-members">' + teamALabel + '</div></div>' +
            '<div class="score-controller">' +
              (!isLocked ? '<button class="btn-score-adjust" data-action="dec" data-match="' + match.id + '" data-team="A">-</button>' : '') +
              '<input type="number" min="0" max="99" class="score-input ' + (isLocked ? 'score-locked' : '') + '" id="inp-a-' + match.id + '" data-match="' + match.id + '" data-team="A" value="' + match.scoreA + '" ' + (isLocked ? 'readonly' : '') + ' />' +
              (!isLocked ? '<button class="btn-score-adjust" data-action="inc" data-match="' + match.id + '" data-team="A">+</button>' : '') +
            '</div>' +
          '</div>' +
          '<div class="team-row ' + (isTeamBWinner ? 'winner' : '') + '">' +
            '<div class="team-players"><span class="team-name-label">Dupla 2</span>' +
              '<div class="team-members">' + teamBLabel + '</div></div>' +
            '<div class="score-controller">' +
              (!isLocked ? '<button class="btn-score-adjust" data-action="dec" data-match="' + match.id + '" data-team="B">-</button>' : '') +
              '<input type="number" min="0" max="99" class="score-input ' + (isLocked ? 'score-locked' : '') + '" id="inp-b-' + match.id + '" data-match="' + match.id + '" data-team="B" value="' + match.scoreB + '" ' + (isLocked ? 'readonly' : '') + ' />' +
              (!isLocked ? '<button class="btn-score-adjust" data-action="inc" data-match="' + match.id + '" data-team="B">+</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="match-footer">' +
          (isLocked
            ? '<button class="btn btn-secondary btn-edit-match" data-match="' + match.id + '">✏️ Editar Resultado</button>'
            : '<button class="btn btn-primary btn-save-match" data-match="' + match.id + '">💾 Salvar Resultado</button>') +
        '</div>';

      card.querySelectorAll('.btn-score-adjust').forEach(btn => {
        btn.addEventListener('click', e => {
          const action = e.currentTarget.dataset.action;
          const mId    = e.currentTarget.dataset.match;
          const team   = e.currentTarget.dataset.team;
          const inpA = card.querySelector('#inp-a-' + mId);
          const inpB = card.querySelector('#inp-b-' + mId);
          let vA = parseInt(inpA.value) || 0;
          let vB = parseInt(inpB.value) || 0;
          if (team === 'A') { vA = action === 'inc' ? vA + 1 : Math.max(0, vA - 1); inpA.value = vA; }
          else              { vB = action === 'inc' ? vB + 1 : Math.max(0, vB - 1); inpB.value = vB; }
          this.sm.updateMatchScore(currentRound, mId, vA, vB);
        });
      });

      card.querySelectorAll('.score-input').forEach(inp => {
        inp.addEventListener('change', e => {
          const mId = e.currentTarget.dataset.match;
          const inpA = card.querySelector('#inp-a-' + mId);
          const inpB = card.querySelector('#inp-b-' + mId);
          inpA.value = Math.max(0, parseInt(inpA.value) || 0);
          inpB.value = Math.max(0, parseInt(inpB.value) || 0);
          this.sm.updateMatchScore(currentRound, mId, parseInt(inpA.value), parseInt(inpB.value));
        });
      });

      const saveBtn = card.querySelector('.btn-save-match');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const inpA = card.querySelector('#inp-a-' + match.id);
          const inpB = card.querySelector('#inp-b-' + match.id);
          this.sm.saveMatchResult(currentRound, match.id, parseInt(inpA.value) || 0, parseInt(inpB.value) || 0);
          this.renderMatches(); this.renderLeaderboard(); this.renderRoundsNav(); this.updateHeaderProgress();
          this._refreshMatchupsIfActive();
        });
      }

      const editBtn = card.querySelector('.btn-edit-match');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.sm.editMatchResult(currentRound, match.id);
          this.renderMatches();
        });
      }

      container.appendChild(card);
    });

    // Folga
    const byeBox = document.getElementById('bye-players-box');
    if (byeBox) {
      if (roundData.byePlayers && roundData.byePlayers.length > 0) {
        byeBox.classList.remove('sel-hidden');
        byeBox.innerHTML = '<span class="bye-label">Folga nesta rodada:</span>' +
          roundData.byePlayers.map(p => '<span class="bye-player-chip">💤 ' + p.name + '</span>').join('');
      } else {
        byeBox.classList.add('sel-hidden');
      }
    }

    const quickAllBtn = document.getElementById('btn-quick-view-all');
    if (quickAllBtn) {
      const totalRds = this.sm.state.rounds ? this.sm.state.rounds.length : 0;
      quickAllBtn.textContent = '📋 Ver Esboço Completo de Todas as Rodadas (' + totalRds + ' rodadas)';
    }

    // Sincroniza o esboço com todas as rodadas
    this.renderAllRoundsOverview();
  }

  /* ─── LEADERBOARD ──────────────────────────────────── */

  _renderPodium(containerId, list) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!list || list.length === 0) {
      el.innerHTML = '';
      return;
    }

    const count = Math.min(list.length, 3);
    const topList = list.slice(0, count);

    const config = [
      { rank: 1, medal: '🥇', icon: '👑', label: '1º LUGAR', class: 'rank-1' },
      { rank: 2, medal: '🥈', icon: '🥈', label: '2º LUGAR', class: 'rank-2' },
      { rank: 3, medal: '🥉', icon: '🥉', label: '3º LUGAR', class: 'rank-3' }
    ];

    let html = '';
    topList.forEach((player, i) => {
      const c = config[i];
      const balStr = (player.balance > 0 ? '+' : '') + player.balance;
      const balClass = player.balance > 0 ? 'pos' : player.balance < 0 ? 'neg' : 'zero';
      html +=
        '<div class="podium-card ' + c.class + '">' +
          '<div class="podium-shine"></div>' +
          '<div class="podium-badge">' +
            '<span class="podium-badge-icon">' + c.icon + '</span> ' +
            '<span class="podium-badge-text">' + c.label + '</span>' +
          '</div>' +
          '<div class="podium-medal-circle">' + c.medal + '</div>' +
          '<h3 class="podium-name" title="' + player.name + '">' + player.name + '</h3>' +
          '<div class="podium-stats-grid">' +
            '<div class="podium-stat-box wins">' +
              '<span class="podium-stat-val">' + player.wins + 'V</span>' +
              '<span class="podium-stat-lbl">' + player.losses + 'D</span>' +
            '</div>' +
            '<div class="podium-stat-box balance">' +
              '<span class="podium-stat-val ' + balClass + '">' + balStr + '</span>' +
              '<span class="podium-stat-lbl">Saldo</span>' +
            '</div>' +
            '<div class="podium-stat-box rate">' +
              '<span class="podium-stat-val">' + player.winRate + '%</span>' +
              '<span class="podium-stat-lbl">Aprov.</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    el.innerHTML = html;
  }

  _renderTable(tbodyId, list) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    list.forEach((st, idx) => {
      const pos = idx + 1;
      const badgeClass = pos === 1 ? 'top-1' : pos === 2 ? 'top-2' : pos === 3 ? 'top-3' : '';
      const rowClass   = pos === 1 ? 'rank-row-1' : pos === 2 ? 'rank-row-2' : pos === 3 ? 'rank-row-3' : '';
      const diffClass  = st.balance > 0 ? 'stat-diff-positive' : st.balance < 0 ? 'stat-diff-negative' : 'stat-diff-zero';
      const tr = document.createElement('tr');
      if (rowClass) tr.className = rowClass;
      tr.innerHTML =
        '<td class="text-center"><span class="rank-badge ' + badgeClass + '">' + pos + '</span></td>' +
        '<td><span class="player-cell-name">' + st.name + '</span></td>' +
        '<td class="text-center">' + st.matchesPlayed + '</td>' +
        '<td class="text-center" style="font-weight:700;color:var(--accent-orange);">' + st.wins + '</td>' +
        '<td class="text-center">' + st.losses + '</td>' +
        '<td class="text-center">' + st.gamesWon + '</td>' +
        '<td class="text-center">' + st.gamesLost + '</td>' +
        '<td class="text-center ' + diffClass + '">' + (st.balance > 0 ? '+' : '') + st.balance + '</td>' +
        '<td class="text-center">' + st.winRate + '%</td>';
      tbody.appendChild(tr);
    });
  }

  renderLeaderboard() {
    const { TOURNAMENT_FORMATS } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[this.sm.state.format] || {};
    const isMixed = !!fmt.isMixed;

    const singleSection = document.getElementById('leaderboard-single');
    const dualSection   = document.getElementById('leaderboard-dual');

    if (isMixed) {
      // ── Modo Mistas: duas tabelas ──────────────────────
      if (singleSection) singleSection.style.display = 'none';
      if (dualSection)   dualSection.style.display   = 'block';

      const { men, women } = this.sm.getMixedLeaderboards();

      this._renderPodium('podium-men', men);
      this._renderPodium('podium-women', women);
      this._renderTable('leaderboard-body-men', men);
      this._renderTable('leaderboard-body-women', women);

    } else {
      // ── Modo normal ────────────────────────────────────
      if (singleSection) singleSection.style.display = 'block';
      if (dualSection)   dualSection.style.display   = 'none';

      const list = this.sm.getLeaderboard();
      this._renderPodium('podium-container', list);
      this._renderTable('leaderboard-body', list);
    }
  }

  updateHeaderProgress() {
    const badge = document.getElementById('badge-completed-matches');
    if (badge) {
      const { completed, total } = this.sm.getCompletedMatchesCount();
      badge.textContent = completed + '/' + total;
    }
  }

  generateShareText() {
    const active = this.sm.getActiveTournament();
    if (!active) return '';
    const { TOURNAMENT_FORMATS, CATEGORIES } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[active.format] || {};
    const cat = CATEGORIES.find(c => c.id === active.category) || {};
    const { completed, total } = this.sm.getCompletedMatchesCount();
    const isMixed = !!fmt.isMixed;
    const g = active.gender || 'masculino';
    const genderLabel = g === 'feminino' ? '👩 Feminino' : g === 'misto' ? '🔀 Misto' : '👨 Masculino';

    let text = '🎾 *' + (active.title || fmt.name) + '* (' + fmt.name + ' · ' + cat.label + ' · ' + genderLabel + ') 🎾\n';
    text += 'Progresso: ' + completed + '/' + total + ' partidas realizadas\n\n';

    if (isMixed) {
      const { men, women } = this.sm.getMixedLeaderboards();
      text += '👨 *CLASSIFICAÇÃO MASCULINA:*\n';
      men.forEach((st, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + 'º';
        text += medal + ' *' + st.name + '* - ' + st.wins + 'V | Saldo: ' + (st.balance > 0 ? '+' : '') + st.balance + '\n';
      });
      text += '\n👩 *CLASSIFICAÇÃO FEMININA:*\n';
      women.forEach((st, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + 'º';
        text += medal + ' *' + st.name + '* - ' + st.wins + 'V | Saldo: ' + (st.balance > 0 ? '+' : '') + st.balance + '\n';
      });
    } else {
      const list = this.sm.getLeaderboard();
      text += '🏆 *CLASSIFICAÇÃO GERAL:*\n';
      list.forEach((st, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + 'º';
        text += medal + ' *' + st.name + '* - ' + st.wins + 'V | ' + st.gamesWon + ' GP | Saldo: ' + (st.balance > 0 ? '+' : '') + st.balance + '\n';
      });
    }

    text += '\n⚡ Gerado pelo Super Beach Tennis Tournament App';
    return text;
  }

  _refreshMatchupsIfActive() {
    const pane = document.getElementById('tab-matchups');
    if (pane && pane.classList.contains('active')) {
      this.renderMatchups();
    }
  }

  /* ─── ABA CONFRONTOS (HEAD-TO-HEAD) ────────────────── */

  initMatchupsEvents() {
    if (this._matchupsEventsDone) return;
    this._matchupsEventsDone = true;

    // Alternador de Visualização (Matriz vs Por Atleta)
    document.querySelectorAll('.btn-matchups-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-matchups-view').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this._matchupsViewMode = e.currentTarget.dataset.view;
        this.renderMatchups();
      });
    });

    // Filtro de Gênero (em torneios Mistas)
    document.querySelectorAll('.btn-matchups-gender').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-matchups-gender').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this._matchupsGenderFilter = e.currentTarget.dataset.gender;
        this.renderMatchups();
      });
    });

    // Busca Rápida por Atleta
    const searchInp = document.getElementById('input-search-matchups');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        this._matchupsSearchQuery = e.target.value.trim().toLowerCase();
        this.renderMatchups();
      });
    }

    // Modal de Detalhes do Confronto
    const modal = document.getElementById('modal-matchup-details');
    const btnClose = document.getElementById('btn-close-matchup-modal');
    const btnDismiss = document.getElementById('btn-dismiss-matchup-modal');
    if (btnClose) btnClose.addEventListener('click', () => this.closeMatchupModal());
    if (btnDismiss) btnDismiss.addEventListener('click', () => this.closeMatchupModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeMatchupModal();
      });
    }
  }

  renderMatchups() {
    const active = this.sm.getActiveTournament();
    const notStartedMsg = document.getElementById('matchups-not-started-msg');
    const matrixView    = document.getElementById('matchups-matrix-view');
    const playerView    = document.getElementById('matchups-player-view');
    const genderFilter  = document.getElementById('matchups-gender-filter');

    if (!active || !active.started || !active.rounds || !active.rounds.length) {
      if (notStartedMsg) notStartedMsg.classList.remove('sel-hidden');
      if (matrixView) matrixView.classList.add('sel-hidden');
      if (playerView) playerView.classList.add('sel-hidden');
      if (genderFilter) genderFilter.classList.add('sel-hidden');
      this._updateMatchupMetrics({
        totalPlayers: (active && active.players) ? active.players.length : 0,
        totalMatches: 0,
        completedMatches: 0,
        pendingMatches: 0
      });
      return;
    }

    if (notStartedMsg) notStartedMsg.classList.add('sel-hidden');

    const isMixed = active.category === 'mistas';
    if (genderFilter) {
      genderFilter.classList.toggle('sel-hidden', !isMixed);
    }

    // Filtro de gênero se aplicável
    const filterGen = isMixed && (this._matchupsGenderFilter === 'm' || this._matchupsGenderFilter === 'f')
      ? this._matchupsGenderFilter
      : null;
    const report = this.sm.getHeadToHeadReport(filterGen);

    this._updateMatchupMetrics(report.summary);

    if (this._matchupsViewMode === 'matrix') {
      if (matrixView) matrixView.classList.remove('sel-hidden');
      if (playerView) playerView.classList.add('sel-hidden');
      this._renderMatchupsMatrix(report, active);
    } else {
      if (matrixView) matrixView.classList.add('sel-hidden');
      if (playerView) playerView.classList.remove('sel-hidden');
      this._renderMatchupsPerPlayer(report, active);
    }
  }

  _updateMatchupMetrics(summary) {
    const elPlayers   = document.getElementById('m-metric-players');
    const elTotal     = document.getElementById('m-metric-total');
    const elCompleted = document.getElementById('m-metric-completed');
    const elPending   = document.getElementById('m-metric-pending');

    if (elPlayers)   elPlayers.textContent   = summary.totalPlayers || 0;
    if (elTotal)     elTotal.textContent     = summary.totalMatches || 0;
    if (elCompleted) elCompleted.textContent = summary.completedMatches || 0;
    if (elPending)   elPending.textContent   = summary.pendingMatches || 0;
  }

  _renderMatchupsMatrix(report, active) {
    const wrap = document.getElementById('matchups-matrix-table-wrap');
    if (!wrap) return;

    const players = report.players;
    const q = this._matchupsSearchQuery;

    let html = '<table class="matchups-matrix-table" id="matrix-table">';
    html += '<thead><tr>';
    html += '<th class="matrix-corner-cell"><div class="corner-label"><span>Atleta</span><span class="vs-text">&times;</span><span>Adversário</span></div></th>';

    players.forEach(p => {
      const gIcon = p.gender === 'm' ? '👨 ' : p.gender === 'f' ? '👩 ' : '';
      const isHighlighted = q && p.name.toLowerCase().includes(q);
      html += '<th class="matrix-col-header' + (isHighlighted ? ' search-highlight' : '') + '" title="' + p.name + '" data-player-id="' + p.id + '">' +
                '<div class="matrix-header-chip">' + gIcon + p.name + '</div>' +
              '</th>';
    });
    html += '</tr></thead>';

    html += '<tbody>';
    players.forEach(pRow => {
      const gIcon = pRow.gender === 'm' ? '👨 ' : pRow.gender === 'f' ? '👩 ' : '';
      const isRowHighlighted = q && pRow.name.toLowerCase().includes(q);

      html += '<tr class="matrix-row' + (isRowHighlighted ? ' search-highlight-row' : '') + '" data-player-id="' + pRow.id + '">';
      html += '<th class="matrix-row-header' + (isRowHighlighted ? ' search-highlight' : '') + '" title="' + pRow.name + '" data-player-id="' + pRow.id + '">' +
                '<div class="matrix-header-chip">' + gIcon + pRow.name + '</div>' +
              '</th>';

      players.forEach(pCol => {
        if (pRow.id === pCol.id) {
          html += '<td class="matrix-cell cell-self" title="Mesmo atleta"><span class="cell-dash">&mdash;</span></td>';
        } else {
          const cell = (report.matrix[pRow.id] && report.matrix[pRow.id][pCol.id]) ? report.matrix[pRow.id][pCol.id] : null;
          if (!cell || cell.totalScheduled === 0) {
            html += '<td class="matrix-cell cell-none" title="Não se enfrentam neste torneio"><span class="cell-zero">0x</span></td>';
          } else {
            let statusClass = 'status-pending';
            let statusLabel = cell.totalScheduled + ' a disputar';
            let icon = '⏳';

            if (cell.playedCount === cell.totalScheduled && cell.totalScheduled > 0) {
              statusClass = 'status-completed';
              statusLabel = cell.playedCount + ' jogados';
              icon = '✓';
            } else if (cell.playedCount > 0) {
              statusClass = 'status-partial';
              statusLabel = cell.playedCount + '/' + cell.totalScheduled + ' jogados';
              icon = '⚡';
            }

            const winStr = cell.playedCount > 0 ? (cell.winsA + 'V - ' + cell.winsB + 'D') : '';

            html += '<td class="matrix-cell ' + statusClass + '" data-player-a="' + pRow.id + '" data-player-b="' + pCol.id + '" title="Clique para ver o histórico detalhado">';
            html += '<div class="cell-content-box">';
            html +=   '<div class="cell-top-line">';
            html +=     '<span class="cell-score-count">' + cell.playedCount + ' / ' + cell.totalScheduled + '</span>';
            html +=     '<span class="cell-status-icon">' + icon + '</span>';
            html +=   '</div>';
            html +=   '<span class="cell-status-sub">' + statusLabel + '</span>';
            if (winStr) {
              html += '<span class="cell-win-sub">' + winStr + '</span>';
            }
            html += '</div>';
            html += '</td>';
          }
        }
      });
      html += '</tr>';
    });
    html += '</tbody></table>';

    wrap.innerHTML = html;

    // Eventos de clique nas células para abrir o modal de detalhes
    wrap.querySelectorAll('.matrix-cell[data-player-a]').forEach(td => {
      td.addEventListener('click', (e) => {
        const pAId = e.currentTarget.dataset.playerA;
        const pBId = e.currentTarget.dataset.playerB;
        const pA = report.players.find(p => p.id === pAId);
        const pB = report.players.find(p => p.id === pBId);
        const cellData = report.matrix[pAId][pBId];
        if (pA && pB && cellData) {
          this.openMatchupModal(pA, pB, cellData);
        }
      });
    });
  }

  _renderMatchupsPerPlayer(report, active) {
    const grid = document.getElementById('matchups-player-grid');
    if (!grid) return;

    let list = report.perPlayer;
    const q = this._matchupsSearchQuery;
    if (q) {
      list = list.filter(item => item.player.name.toLowerCase().includes(q) ||
        item.opponents.some(opp => opp.opponent.name.toLowerCase().includes(q)));
    }

    if (!list || list.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-secondary);">' +
        '<h3>Nenhum atleta encontrado</h3><p>Tente ajustar o termo da busca.</p></div>';
      return;
    }

    let html = '';
    list.forEach(item => {
      const p = item.player;
      const gIcon = p.gender === 'm' ? '👨' : p.gender === 'f' ? '👩' : '🎾';
      const gBadgeClass = p.gender === 'm' ? 'gender-badge men' : p.gender === 'f' ? 'gender-badge women' : 'badge-accent';

      html += '<div class="matchup-player-card">';
      html +=   '<div class="matchup-p-card-header">';
      html +=     '<div class="matchup-p-avatar">' + gIcon + '</div>';
      html +=     '<div class="matchup-p-info">';
      html +=       '<h3 class="matchup-p-name">' + p.name + '</h3>';
      html +=       '<div class="matchup-p-meta">';
      html +=         '<span class="' + gBadgeClass + '">' + (p.gender === 'm' ? 'Masculino' : p.gender === 'f' ? 'Feminino' : 'Atleta') + '</span>';
      html +=         '<span class="matchup-p-stat-chip">⚔️ ' + item.totalScheduled + ' confrontos programados</span>';
      html +=         '<span class="matchup-p-stat-chip done">✅ ' + item.playedCount + ' jogados</span>';
      html +=         '<span class="matchup-p-stat-chip pend">⏳ ' + item.pendingCount + ' a disputar</span>';
      html +=       '</div>';
      html +=     '</div>';
      html +=   '</div>';

      html +=   '<div class="matchup-opponents-list">';
      html +=     '<h4 class="opponents-list-title">Adversários no Torneio:</h4>';

      item.opponents.forEach(opp => {
        const oppP = opp.opponent;
        const oppGIcon = oppP.gender === 'm' ? '👨 ' : oppP.gender === 'f' ? '👩 ' : '';

        let badgeClass = 'badge-pending';
        let badgeText = '⏳ ' + opp.pendingCount + ' a disputar';
        if (opp.playedCount === opp.totalScheduled && opp.totalScheduled > 0) {
          badgeClass = 'badge-completed';
          badgeText = '✓ ' + opp.playedCount + '/' + opp.totalScheduled + ' jogados';
        } else if (opp.playedCount > 0) {
          badgeClass = 'badge-partial';
          badgeText = '⚡ ' + opp.playedCount + '/' + opp.totalScheduled + ' jogados (' + opp.pendingCount + ' faltam)';
        }

        html += '<div class="matchup-opp-row">';
        html +=   '<div class="opp-main-col">';
        html +=     '<span class="opp-name">' + oppGIcon + oppP.name + '</span>';
        html +=     '<span class="opp-status-pill ' + badgeClass + '">' + badgeText + '</span>';
        html +=     '<span class="opp-total-pill">' + opp.totalScheduled + 'x no total</span>';
        html +=   '</div>';

        html +=   '<div class="opp-matches-pills">';
        if (opp.matches && opp.matches.length) {
          opp.matches.forEach(m => {
            if (m.finished) {
              const won = m.winner === 'A';
              const pClass = won ? 'pill-win' : (m.winner === 'B' ? 'pill-loss' : 'pill-draw');
              const resText = won ? 'Vitória' : (m.winner === 'B' ? 'Derrota' : 'Empate');
              html += '<span class="match-mini-pill ' + pClass + '" title="' + (m.court + ' · ' + (m.partnerA ? 'Parceiro: ' + m.partnerA : '') + ' vs ' + (m.partnerB ? oppP.name + ' + ' + m.partnerB : oppP.name)) + '">' +
                        'R' + m.roundNumber + ': ' + m.scoreA + 'x' + m.scoreB + ' (' + resText + ')' +
                      '</span>';
            } else {
              html += '<span class="match-mini-pill pill-wait" title="' + m.court + '">' +
                        'R' + m.roundNumber + ': A disputar (' + m.court + ')' +
                      '</span>';
            }
          });
        }
        html +=   '</div>';

        html +=   '<button type="button" class="btn btn-sm btn-accent-sm btn-open-matchup-detail" data-player-a="' + p.id + '" data-player-b="' + oppP.id + '" title="Ver detalhes completos das partidas">';
        html +=     '🔍 Detalhes';
        html +=   '</button>';

        html += '</div>';
      });

      html +=   '</div>';
      html += '</div>';
    });

    grid.innerHTML = html;

    // Vincular botões de detalhes
    grid.querySelectorAll('.btn-open-matchup-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pAId = e.currentTarget.dataset.playerA;
        const pBId = e.currentTarget.dataset.playerB;
        const pA = report.players.find(p => p.id === pAId);
        const pB = report.players.find(p => p.id === pBId);
        const cellData = report.matrix[pAId][pBId];
        if (pA && pB && cellData) {
          this.openMatchupModal(pA, pB, cellData);
        }
      });
    });
  }

  openMatchupModal(playerA, playerB, cellData) {
    const modal = document.getElementById('modal-matchup-details');
    const title = document.getElementById('matchup-modal-title');
    const body  = document.getElementById('matchup-modal-body');
    if (!modal || !body) return;

    const gIconA = playerA.gender === 'm' ? '👨 ' : playerA.gender === 'f' ? '👩 ' : '';
    const gIconB = playerB.gender === 'm' ? '👨 ' : playerB.gender === 'f' ? '👩 ' : '';

    if (title) {
      title.innerHTML = '⚔️ ' + gIconA + playerA.name + ' <span class="vs-text">&times;</span> ' + gIconB + playerB.name;
    }

    let bHtml = '';
    bHtml += '<div class="matchup-modal-hero">';
    bHtml +=   '<div class="matchup-hero-player player-left">';
    bHtml +=     '<div class="hero-avatar">' + (playerA.gender === 'm' ? '👨' : playerA.gender === 'f' ? '👩' : '🎾') + '</div>';
    bHtml +=     '<h4 class="hero-name">' + playerA.name + '</h4>';
    bHtml +=     '<span class="hero-wins-badge">' + cellData.winsA + ' Vitórias</span>';
    bHtml +=   '</div>';

    bHtml +=   '<div class="matchup-hero-vs">';
    bHtml +=     '<div class="hero-total-count">' + cellData.totalScheduled + 'x</div>';
    bHtml +=     '<div class="hero-sublabel">Confrontos no Torneio</div>';
    bHtml +=     '<div class="hero-status-pill">' + cellData.playedCount + ' Realizados &bull; ' + cellData.pendingCount + ' A Disputar</div>';
    bHtml +=   '</div>';

    bHtml +=   '<div class="matchup-hero-player player-right">';
    bHtml +=     '<div class="hero-avatar">' + (playerB.gender === 'm' ? '👨' : playerB.gender === 'f' ? '👩' : '🎾') + '</div>';
    bHtml +=     '<h4 class="hero-name">' + playerB.name + '</h4>';
    bHtml +=     '<span class="hero-wins-badge">' + cellData.winsB + ' Vitórias</span>';
    bHtml +=   '</div>';
    bHtml += '</div>';

    bHtml += '<div class="matchup-modal-matches-list">';
    bHtml +=   '<h5 class="modal-matches-title">Histórico e Programação das Partidas:</h5>';

    if (!cellData.matches || cellData.matches.length === 0) {
      bHtml += '<p class="text-secondary text-center">Nenhuma partida registrada.</p>';
    } else {
      cellData.matches.forEach(m => {
        const isFin = !!m.finished;
        const wonA = isFin && m.winner === 'A';
        const wonB = isFin && m.winner === 'B';
        const statusText = isFin ? '✓ Finalizada' : '⏳ Aguardando Realização';
        const statusClass = isFin ? 'concluida' : 'pendente';

        const teamAName = playerA.name + (m.partnerA ? ' + ' + m.partnerA : '');
        const teamBName = playerB.name + (m.partnerB ? ' + ' + m.partnerB : '');

        bHtml += '<div class="modal-match-item ' + (isFin ? 'finished' : '') + '">';
        bHtml +=   '<div class="modal-match-header">';
        bHtml +=     '<span class="m-round-badge">Rodada ' + m.roundNumber + ' &bull; ' + m.court + '</span>';
        bHtml +=     '<span class="m-status-badge ' + statusClass + '">' + statusText + '</span>';
        bHtml +=   '</div>';

        bHtml +=   '<div class="modal-match-teams-grid">';
        bHtml +=     '<div class="m-team-side side-a ' + (wonA ? 'winner' : '') + '">';
        bHtml +=       '<span class="m-team-name">' + teamAName + '</span>';
        if (wonA) bHtml += '<span class="m-winner-crown">👑 Vencedor</span>';
        bHtml +=     '</div>';

        bHtml +=     '<div class="m-score-box ' + (isFin ? 'score-done' : 'score-waiting') + '">';
        bHtml +=       '<span class="m-score-val">' + (isFin ? (m.scoreA + ' &times; ' + m.scoreB) : '— &times; —') + '</span>';
        bHtml +=     '</div>';

        bHtml +=     '<div class="m-team-side side-b ' + (wonB ? 'winner' : '') + '">';
        bHtml +=       '<span class="m-team-name">' + teamBName + '</span>';
        if (wonB) bHtml += '<span class="m-winner-crown">👑 Vencedor</span>';
        bHtml +=     '</div>';
        bHtml +=   '</div>';
        bHtml += '</div>';
      });
    }

    bHtml += '</div>';

    body.innerHTML = bHtml;
    modal.style.display = 'flex';
  }

  closeMatchupModal() {
    const modal = document.getElementById('modal-matchup-details');
    if (modal) modal.style.display = 'none';
  }
}

window.TournamentUI = TournamentUI;
