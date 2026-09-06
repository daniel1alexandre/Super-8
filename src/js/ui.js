/**
 * SUPER BEACH TENNIS - MÓDULO DE INTERFACE (UI)
 */
class TournamentUI {
  constructor(stateManager) {
    this.sm = stateManager;
    this._selectedCategory = null;
    this._selectedFormat = null;
  }

  /* ─── TELAS PRINCIPAIS ─────────────────────────────── */

  showScreen(screen) {
    const sel = document.getElementById('screen-selection');
    const app = document.getElementById('screen-app');
    if (screen === 'selection') {
      sel.classList.remove('sel-hidden');
      app.classList.add('sel-hidden');
    } else {
      sel.classList.add('sel-hidden');
      app.classList.remove('sel-hidden');
    }
  }

  init() {
    const { phase } = this.sm.state;
    if (phase === 'selection') {
      this.showScreen('selection');
      this.renderCategoryCards();
    } else {
      this.showScreen('app');
      this._selectedCategory = this.sm.state.category;
      this._selectedFormat = this.sm.state.format;
      this.updateAppHeader();
      this.renderPlayersSetup();
      if (phase === 'playing') {
        this.renderRoundsNav();
        this.renderMatches();
        this.renderLeaderboard();
        this.switchTab('matches');
      } else {
        this.switchTab('setup');
      }
      this.updateHeaderProgress();
    }
  }

  /* ─── TELA DE SELEÇÃO ───────────────────────────────── */

  renderCategoryCards() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;
    const { CATEGORIES } = window.TournamentConfig;
    grid.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'sel-category-card';
      card.style.setProperty('--card-color', cat.color);
      card.style.setProperty('--card-glow', cat.borderColor);

      card.innerHTML =
        '<div class="sel-category-icon-bg" style="background:' + cat.gradient + ';opacity:0.15;">' +
        '<span class="sel-category-icon">' + cat.icon + '</span></div>' +
        '<div class="sel-category-name">' + cat.label + '</div>' +
        '<div class="sel-category-desc">' + cat.description.replace(/\n/g, '<br>') + '</div>';

      const iconBg = card.querySelector('.sel-category-icon-bg');
      iconBg.style.opacity = '1';
      iconBg.style.background = 'none';
      iconBg.querySelector('.sel-category-icon').style = '';

      // Re-render simpler
      card.innerHTML =
        '<div class="sel-cat-icon-wrap" style="font-size:2.6rem;width:68px;height:68px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:' + cat.gradient.replace('linear-gradient','linear-gradient') + ';opacity-on-card:1;margin-bottom:0.25rem;">' + cat.icon + '</div>' +
        '<div class="sel-category-name">' + cat.label + '</div>' +
        '<div class="sel-category-desc">' + cat.description.replace(/\n/g, '<br>') + '</div>';

      card.addEventListener('click', () => {
        document.querySelectorAll('.sel-category-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this._selectedCategory = cat.id;
        this.renderFormatCards(cat);
        const stepFmt = document.getElementById('step-format');
        stepFmt.classList.remove('sel-hidden');
        document.getElementById('sel-cta').classList.add('sel-hidden');
        this._selectedFormat = null;
        stepFmt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      grid.appendChild(card);
    });
  }

  renderFormatCards(cat) {
    const grid = document.getElementById('format-grid');
    if (!grid) return;
    const { TOURNAMENT_FORMATS } = window.TournamentConfig;
    grid.innerHTML = '';

    Object.values(TOURNAMENT_FORMATS).forEach(fmt => {
      const card = document.createElement('div');
      card.className = 'sel-format-card' + (fmt.featured ? ' featured' : '');
      card.style.setProperty('--active-color', cat.color);
      card.innerHTML =
        '<div class="sel-format-numeral" style="color:' + cat.color + ';">' + fmt.numeral + '</div>' +
        '<div class="sel-format-name">Super ' + fmt.numeral + '</div>' +
        '<div class="sel-format-desc">' + fmt.description + '</div>';

      card.addEventListener('click', () => {
        document.querySelectorAll('.sel-format-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this._selectedFormat = fmt.id;
        this.renderSelectionSummary(cat, fmt);
        const cta = document.getElementById('sel-cta');
        cta.classList.remove('sel-hidden');
        cta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      grid.appendChild(card);
    });
  }

  renderSelectionSummary(cat, fmt) {
    const box = document.getElementById('sel-summary-card');
    if (!box) return;
    box.innerHTML =
      '<div class="summary-item"><span class="summary-label">Categoria</span><span class="summary-value">' + cat.icon + ' ' + cat.label + '</span></div>' +
      '<div class="summary-divider"></div>' +
      '<div class="summary-item"><span class="summary-label">Formato</span><span class="summary-value" style="color:' + cat.color + '">Super ' + fmt.numeral + '</span></div>' +
      '<div class="summary-divider"></div>' +
      '<div class="summary-item"><span class="summary-label">Participantes</span><span class="summary-value">' + fmt.players + ' ' + cat.playerLabel + 's</span></div>' +
      '<div class="summary-divider"></div>' +
      '<div class="summary-item"><span class="summary-label">Rodadas</span><span class="summary-value">' + fmt.rounds + '</span></div>';
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
    const { TOURNAMENT_FORMATS, CATEGORIES } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[this.sm.state.format];
    const cat = CATEGORIES.find(c => c.id === this.sm.state.category);
    if (!fmt || !cat) return;
    const titleEl = document.getElementById('app-title-dyn');
    const subtitleEl = document.getElementById('app-subtitle-dyn');
    const leaderTitle = document.getElementById('leaderboard-title');
    const leaderCol = document.getElementById('leaderboard-col-player');
    const setupTitle = document.getElementById('setup-title');
    const setupDesc = document.getElementById('setup-desc');
    const setupInfo = document.getElementById('setup-info-text');
    if (titleEl) titleEl.innerHTML = 'SUPER <span style="color:' + cat.color + '">' + fmt.numeral + '</span>';
    if (subtitleEl) subtitleEl.textContent = cat.label + ' · Beach Tennis Tournament Manager';
    if (leaderTitle) leaderTitle.textContent = 'Classificação Geral · ' + cat.label;
    if (leaderCol) leaderCol.textContent = cat.playerLabel;
    if (setupTitle) setupTitle.textContent = 'Inscrição dos ' + fmt.players + ' ' + cat.playerLabel + 's';
    if (setupDesc) setupDesc.textContent = 'Insira os nomes dos participantes do torneio ' + fmt.name + ' · ' + cat.label + '.';
    const numRounds = fmt.players % 2 === 0 ? fmt.players - 1 : fmt.players;
    if (setupInfo) {
      const isDuplas = this.sm.state.category === 'duplas';
      if (isDuplas) {
        setupInfo.innerHTML = '<strong>' + fmt.name + ' Duplas Fixas:</strong> ' + fmt.players + ' equipes · ' + numRounds + ' rodadas. Cada dupla enfrenta todas as outras!';
      } else {
        setupInfo.innerHTML = '<strong>' + fmt.name + ' ' + cat.label + ':</strong> ' + fmt.players + ' atletas · ' + numRounds + ' rodadas · Duplas rotativas. Cada atleta joga exatamente 1x com cada parceiro!';
      }
    }
  }

  /* ─── SETUP DE JOGADORES ────────────────────────────── */

  renderPlayersSetup() {
    const container = document.getElementById('players-input-grid');
    if (!container) return;
    container.innerHTML = '';
    const { CATEGORIES } = window.TournamentConfig;
    const cat = CATEGORIES.find(c => c.id === this.sm.state.category) || {};
    const players = this.sm.state.players;

    players.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'player-card-input';
      card.innerHTML =
        '<div class="player-number-badge">' + (idx + 1) + '</div>' +
        '<div class="player-input-wrapper">' +
          '<label class="player-input-label">' + (cat.playerLabel || 'Jogador') + ' ' + (idx + 1) + '</label>' +
          '<input type="text" class="player-name-input" data-index="' + idx + '" value="' + p.name + '" placeholder="' + (cat.playerPlaceholder || 'Nome') + '" maxlength="30" />' +
        '</div>';
      container.appendChild(card);
    });
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

    container.innerHTML = '';

    roundData.matches.forEach(match => {
      const isFinished = !!match.finished;
      const isEditing = !!match.isEditing;
      const isLocked = isFinished && !isEditing;
      const isTeamAWinner = isFinished && match.scoreA > match.scoreB;
      const isTeamBWinner = isFinished && match.scoreB > match.scoreA;

      const isDuplas = this.sm.state.category === 'duplas';

      const teamALabel = isDuplas ? match.teamA[0].name : (match.teamA[0].name + ' &amp; ' + match.teamA[1].name);
      const teamBLabel = isDuplas ? match.teamB[0].name : (match.teamB[0].name + ' &amp; ' + match.teamB[1].name);

      const card = document.createElement('div');
      card.className = 'match-card' + (isFinished ? ' finished' : '') + (isEditing ? ' editing-active' : '');

      card.innerHTML =
        '<div class="match-court-header">' +
          '<span class="court-badge">' + match.court + '</span>' +
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
          const mId = e.currentTarget.dataset.match;
          const team = e.currentTarget.dataset.team;
          const inpA = card.querySelector('#inp-a-' + mId);
          const inpB = card.querySelector('#inp-b-' + mId);
          let vA = parseInt(inpA.value) || 0;
          let vB = parseInt(inpB.value) || 0;
          if (team === 'A') { vA = action === 'inc' ? vA + 1 : Math.max(0, vA - 1); inpA.value = vA; }
          else { vB = action === 'inc' ? vB + 1 : Math.max(0, vB - 1); inpB.value = vB; }
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

    // Bye players
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

  renderLeaderboard() {
    const list = this.sm.getLeaderboard();
    const isDuplas = this.sm.state.category === 'duplas';

    const podiumContainer = document.getElementById('podium-container');
    if (podiumContainer) {
      if (list.length >= 3) {
        const [top1, top2, top3] = list;
        podiumContainer.innerHTML =
          '<div class="podium-card rank-2">' +
            '<div class="podium-medal">🥈</div>' +
            '<h3 class="podium-name">' + top2.name + '</h3>' +
            '<div class="podium-stats"><span class="podium-highlight">' + top2.wins + 'V</span> | Saldo: ' + (top2.balance > 0 ? '+' : '') + top2.balance + '</div>' +
          '</div>' +
          '<div class="podium-card rank-1">' +
            '<div class="podium-medal">🥇</div>' +
            '<h3 class="podium-name">' + top1.name + '</h3>' +
            '<div class="podium-stats"><span class="podium-highlight">' + top1.wins + 'V</span> | Saldo: ' + (top1.balance > 0 ? '+' : '') + top1.balance + '</div>' +
          '</div>' +
          '<div class="podium-card rank-3">' +
            '<div class="podium-medal">🥉</div>' +
            '<h3 class="podium-name">' + top3.name + '</h3>' +
            '<div class="podium-stats"><span class="podium-highlight">' + top3.wins + 'V</span> | Saldo: ' + (top3.balance > 0 ? '+' : '') + top3.balance + '</div>' +
          '</div>';
      } else {
        podiumContainer.innerHTML = '';
      }
    }

    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    list.forEach((st, idx) => {
      const pos = idx + 1;
      const badgeClass = pos === 1 ? 'top-1' : pos === 2 ? 'top-2' : pos === 3 ? 'top-3' : '';
      const diffClass = st.balance > 0 ? 'stat-diff-positive' : st.balance < 0 ? 'stat-diff-negative' : 'stat-diff-zero';
      const tr = document.createElement('tr');
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

  updateHeaderProgress() {
    const badge = document.getElementById('badge-completed-matches');
    if (badge) {
      const { completed, total } = this.sm.getCompletedMatchesCount();
      badge.textContent = completed + '/' + total;
    }
  }

  generateShareText() {
    const list = this.sm.getLeaderboard();
    const { completed, total } = this.sm.getCompletedMatchesCount();
    const { TOURNAMENT_FORMATS, CATEGORIES } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[this.sm.state.format] || {};
    const cat = CATEGORIES.find(c => c.id === this.sm.state.category) || {};
    let text = '🎾 *' + (fmt.name || 'SUPER BEACH TENNIS') + ' · ' + (cat.label || '') + ' - RESULTADOS* 🎾\n';
    text += 'Progresso: ' + completed + '/' + total + ' partidas realizadas\n\n🏆 *CLASSIFICAÇÃO GERAL:*\n';
    list.forEach((st, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + 'º';
      const diff = st.balance > 0 ? '+' + st.balance : '' + st.balance;
      text += medal + ' *' + st.name + '* - ' + st.wins + 'V | ' + st.gamesWon + ' GP | Saldo: ' + diff + '\n';
    });
    text += '\n⚡ Gerado pelo Super Beach Tennis Tournament App';
    return text;
  }
}

window.TournamentUI = TournamentUI;
