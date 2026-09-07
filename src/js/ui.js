/**
 * SUPER BEACH TENNIS - MÓDULO DE INTERFACE (UI)
 */
class TournamentUI {
  constructor(stateManager) {
    this.sm = stateManager;
    this._selectedCategory = null;
    this._selectedFormat = null;
    this._selectedGender = 'masculino';
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
    return team[0].name + ' &amp; ' + team[1].name;
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
}

window.TournamentUI = TournamentUI;
