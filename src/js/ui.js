/**
 * SUPER 8 BEACH TENNIS - MÓDULO DE INTERFACE (UI)
 */

class TournamentUI {
  constructor(stateManager) {
    this.sm = stateManager;
  }

  renderAll() {
    this.renderTabsState();
    this.renderPlayersSetup();
    this.renderRoundsNav();
    this.renderMatches();
    this.renderLeaderboard();
    this.updateHeaderProgress();
  }

  renderTabsState() {
    // Se o torneio já começou, permite navegar normalmente; se não, foca no setup
    if (!this.sm.state.started) {
      this.switchTab('setup');
    }
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    if (tabId === 'leaderboard') {
      this.renderLeaderboard();
    } else if (tabId === 'matches') {
      this.renderMatches();
    }
  }

  renderPlayersSetup() {
    const container = document.getElementById('players-input-grid');
    if (!container) return;

    container.innerHTML = '';
    const players = this.sm.state.players;

    players.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'player-card-input';
      card.innerHTML = `
        <div class="player-number-badge">${idx + 1}</div>
        <div class="player-input-wrapper">
          <label class="player-input-label">Atleta ${idx + 1}</label>
          <input 
            type="text" 
            class="player-name-input" 
            data-index="${idx}" 
            value="${p.name}" 
            placeholder="Nome do Atleta"
            maxlength="28"
          />
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderRoundsNav() {
    const container = document.getElementById('rounds-nav-buttons');
    if (!container) return;

    container.innerHTML = '';
    const currentRound = this.sm.state.currentRound || 1;

    for (let r = 1; r <= 7; r++) {
      const roundData = this.sm.state.rounds ? this.sm.state.rounds.find(x => x.round === r) : null;
      const isCompleted = roundData && roundData.matches.every(m => m.finished);

      const btn = document.createElement('button');
      btn.className = `round-pill-btn ${currentRound === r ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
      btn.innerHTML = `R${r} ${isCompleted ? '✓' : ''}`;
      btn.addEventListener('click', () => {
        this.sm.setCurrentRound(r);
        this.renderRoundsNav();
        this.renderMatches();
      });
      container.appendChild(btn);
    }

    const statusText = document.getElementById('round-status-text');
    if (statusText) {
      statusText.textContent = `Rodada ${currentRound} de 7`;
    }
  }

  renderMatches() {
    const container = document.getElementById('matches-grid');
    if (!container) return;

    if (!this.sm.state.started || !this.sm.state.rounds || this.sm.state.rounds.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
          <h3>Nenhum jogo em andamento</h3>
          <p style="margin-top: 0.5rem;">Cadastre os 8 jogadores na aba 'Participantes' e clique em <strong>Iniciar Torneio</strong>.</p>
        </div>
      `;
      return;
    }

    const currentRound = this.sm.state.currentRound || 1;
    const roundData = this.sm.state.rounds.find(r => r.round === currentRound);

    if (!roundData) return;

    container.innerHTML = '';

    roundData.matches.forEach(match => {
      const isTeamAWinner = match.finished && match.scoreA > match.scoreB;
      const isTeamBWinner = match.finished && match.scoreB > match.scoreA;

      const card = document.createElement('div');
      card.className = `match-card ${match.finished ? 'finished' : ''}`;

      card.innerHTML = `
        <div class="match-court-header">
          <span class="court-badge">${match.court}</span>
          <span class="match-status-badge ${match.finished ? 'concluida' : 'pendente'}">
            ${match.finished ? 'Finalizada' : 'Em andamento'}
          </span>
        </div>

        <div class="match-body">
          <!-- Dupla A -->
          <div class="team-row ${isTeamAWinner ? 'winner' : ''}">
            <div class="team-players">
              <span class="team-name-label">Dupla 1</span>
              <div class="team-members">
                <span>${match.teamA[0].name}</span>
                <span class="player-dot">&</span>
                <span>${match.teamA[1].name}</span>
              </div>
            </div>
            <div class="score-controller">
              <button class="btn-score-adjust" data-action="dec" data-match="${match.id}" data-team="A">-</button>
              <span class="score-display">${match.scoreA}</span>
              <button class="btn-score-adjust" data-action="inc" data-match="${match.id}" data-team="A">+</button>
            </div>
          </div>

          <!-- Dupla B -->
          <div class="team-row ${isTeamBWinner ? 'winner' : ''}">
            <div class="team-players">
              <span class="team-name-label">Dupla 2</span>
              <div class="team-members">
                <span>${match.teamB[0].name}</span>
                <span class="player-dot">&</span>
                <span>${match.teamB[1].name}</span>
              </div>
            </div>
            <div class="score-controller">
              <button class="btn-score-adjust" data-action="dec" data-match="${match.id}" data-team="B">-</button>
              <span class="score-display">${match.scoreB}</span>
              <button class="btn-score-adjust" data-action="inc" data-match="${match.id}" data-team="B">+</button>
            </div>
          </div>
        </div>

        <div class="match-footer">
          <button class="btn btn-secondary btn-finish-match" data-match="${match.id}">
            ${match.finished ? '↩ Reabrir Partida' : '✓ Finalizar Partida'}
          </button>
        </div>
      `;

      // Eventos de pontuação
      card.querySelectorAll('.btn-score-adjust').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.getAttribute('data-action');
          const mId = e.currentTarget.getAttribute('data-match');
          const team = e.currentTarget.getAttribute('data-team');

          let newScoreA = match.scoreA;
          let newScoreB = match.scoreB;

          if (team === 'A') {
            newScoreA = action === 'inc' ? newScoreA + 1 : Math.max(0, newScoreA - 1);
          } else {
            newScoreB = action === 'inc' ? newScoreB + 1 : Math.max(0, newScoreB - 1);
          }

          this.sm.updateMatchScore(currentRound, mId, newScoreA, newScoreB);
          this.renderMatches();
          this.renderLeaderboard();
          this.renderRoundsNav();
          this.updateHeaderProgress();
        });
      });

      // Botão finalizar
      const finishBtn = card.querySelector('.btn-finish-match');
      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          this.sm.toggleMatchFinished(currentRound, match.id);
          this.renderMatches();
          this.renderLeaderboard();
          this.renderRoundsNav();
          this.updateHeaderProgress();
        });
      }

      container.appendChild(card);
    });
  }

  renderLeaderboard() {
    const list = this.sm.getLeaderboard();

    // Render Pódio Top 3
    const podiumContainer = document.getElementById('podium-container');
    if (podiumContainer) {
      if (list.length >= 3) {
        const top1 = list[0];
        const top2 = list[1];
        const top3 = list[2];

        podiumContainer.innerHTML = `
          <!-- 2º Lugar -->
          <div class="podium-card rank-2">
            <div class="podium-medal">🥈</div>
            <h3 class="podium-name">${top2.name}</h3>
            <div class="podium-stats">
              <span class="podium-highlight">${top2.wins}V</span> | Saldo: ${top2.balance > 0 ? '+' + top2.balance : top2.balance}
            </div>
          </div>

          <!-- 1º Lugar -->
          <div class="podium-card rank-1">
            <div class="podium-medal">🥇</div>
            <h3 class="podium-name">${top1.name}</h3>
            <div class="podium-stats">
              <span class="podium-highlight">${top1.wins}V</span> | Saldo: ${top1.balance > 0 ? '+' + top1.balance : top1.balance}
            </div>
          </div>

          <!-- 3º Lugar -->
          <div class="podium-card rank-3">
            <div class="podium-medal">🥉</div>
            <h3 class="podium-name">${top3.name}</h3>
            <div class="podium-stats">
              <span class="podium-highlight">${top3.wins}V</span> | Saldo: ${top3.balance > 0 ? '+' + top3.balance : top3.balance}
            </div>
          </div>
        `;
      } else {
        podiumContainer.innerHTML = '';
      }
    }

    // Render Tabela Completa
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    list.forEach((st, index) => {
      const pos = index + 1;
      let badgeClass = '';
      if (pos === 1) badgeClass = 'top-1';
      else if (pos === 2) badgeClass = 'top-2';
      else if (pos === 3) badgeClass = 'top-3';

      const diffClass = st.balance > 0 ? 'stat-diff-positive' : (st.balance < 0 ? 'stat-diff-negative' : 'stat-diff-zero');
      const diffSign = st.balance > 0 ? '+' : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center">
          <span class="rank-badge ${badgeClass}">${pos}</span>
        </td>
        <td>
          <span class="player-cell-name">${st.name}</span>
        </td>
        <td class="text-center">${st.matchesPlayed}</td>
        <td class="text-center" style="font-weight: 700; color: var(--accent-orange);">${st.wins}</td>
        <td class="text-center">${st.losses}</td>
        <td class="text-center">${st.gamesWon}</td>
        <td class="text-center">${st.gamesLost}</td>
        <td class="text-center ${diffClass}">${diffSign}${st.balance}</td>
        <td class="text-center">${st.winRate}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  updateHeaderProgress() {
    const badge = document.getElementById('badge-completed-matches');
    if (badge) {
      const { completed, total } = this.sm.getCompletedMatchesCount();
      badge.textContent = `${completed}/${total}`;
    }
  }

  generateShareText() {
    const list = this.sm.getLeaderboard();
    const { completed, total } = this.sm.getCompletedMatchesCount();

    let text = `🎾 *SUPER 8 BEACH TENNIS - RESULTADOS* 🎾\n`;
    text += `Progresso: ${completed}/${total} partidas realizadas\n\n`;
    text += `🏆 *CLASSIFICAÇÃO GERAL:*\n`;

    list.forEach((st, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}º`;
      const diff = st.balance > 0 ? `+${st.balance}` : `${st.balance}`;
      text += `${medal} *${st.name}* - ${st.wins}V | ${st.gamesWon} GP | Saldo: ${diff}\n`;
    });

    text += `\n⚡ Gerado pelo Super 8 Tournament App`;
    return text;
  }
}

window.TournamentUI = TournamentUI;
