/**
 * SUPER BEACH TENNIS - GERENCIAMENTO DE ESTADO MULTI-TORNEIOS & CLASSIFICAÇÃO
 * Suporta múltiplos torneios ativos simultaneamente, com chaveamento e estatísticas isoladas.
 */
const STORAGE_KEY = 'SUPER_BEACH_TENNIS_V4';
const V3_STORAGE_KEY = 'SUPER_BEACH_TENNIS_V3';

class TournamentStateManager {
  constructor() {
    this._defaultState = this.getInitialState();
    this.data = this.loadState();
  }

  getInitialState() {
    return {
      id: null,
      title: '',
      phase: 'selection',
      category: null,
      format: null,
      started: false,
      players: [],
      currentRound: 1,
      rounds: []
    };
  }

  loadState() {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d) {
        const parsed = JSON.parse(d);
        if (parsed && Array.isArray(parsed.tournaments)) {
          return parsed;
        }
      }
    } catch(e) {}

    // Migração transparente de versão anterior (V3)
    try {
      const v3 = localStorage.getItem(V3_STORAGE_KEY);
      if (v3) {
        const old = JSON.parse(v3);
        if (old && old.category && old.format) {
          const { TOURNAMENT_FORMATS, CATEGORIES } = window.TournamentConfig || {};
          const fmtName = (TOURNAMENT_FORMATS && TOURNAMENT_FORMATS[old.format]) ? TOURNAMENT_FORMATS[old.format].name : (old.format || 'Torneio');
          const catLabel = (CATEGORIES && CATEGORIES.find(c => c.id === old.category)) ? CATEGORIES.find(c => c.id === old.category).label : (old.category || '');
          const id = 't-' + Date.now();
          const migratedTourn = {
            id,
            title: fmtName + (catLabel ? ' · ' + catLabel : ''),
            createdAt: Date.now(),
            ...old
          };
          const initialData = {
            activeTournamentId: id,
            tournaments: [migratedTourn]
          };
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData)); } catch(err) {}
          return initialData;
        }
      }
    } catch(e) {}

    return {
      activeTournamentId: null,
      tournaments: []
    };
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch(e) {}
  }

  // Acessa o torneio ativo atual
  getActiveTournament() {
    if (!this.data || !this.data.activeTournamentId) return null;
    return this.data.tournaments.find(t => t.id === this.data.activeTournamentId) || null;
  }

  // Getter compatível com toda a UI existente
  get state() {
    const active = this.getActiveTournament();
    if (active) return active;
    if (!this._defaultState) this._defaultState = this.getInitialState();
    return this._defaultState;
  }

  getTournaments() {
    return (this.data && this.data.tournaments) ? this.data.tournaments : [];
  }

  createTournament(category, format, customTitle, gender = 'masculino') {
    const { TOURNAMENT_FORMATS, CATEGORIES } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[format];
    const cat = CATEGORIES.find(c => c.id === category);
    if (!fmt || !cat) return null;

    const id = 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const existingSameFormat = this.data.tournaments.filter(t => t.format === format && t.category === category);
    const title = (customTitle && customTitle.trim()) ? customTitle.trim() : (fmt.name + ' · ' + cat.label + (existingSameFormat.length > 0 ? ' (' + (existingSameFormat.length + 1) + ')' : ''));
    const finalGender = (category === 'mistas') ? 'misto' : (gender || 'masculino');

    let initialPlayers = [];
    if (category === 'mistas' && fmt.isMixed) {
      const pg = fmt.playersPerGender || 8;
      const men   = Array.from({ length: pg }, (_, i) => ({
        id: 'm' + (i + 1),
        name: 'Homem ' + (i + 1),
        gender: 'm'
      }));
      const women = Array.from({ length: pg }, (_, i) => ({
        id: 'f' + (i + 1),
        name: 'Mulher ' + (i + 1),
        gender: 'f'
      }));
      initialPlayers = [...men, ...women];
    } else {
      const pLabel = cat.playerLabel || (finalGender === 'feminino' ? 'Atleta' : 'Jogador');
      initialPlayers = Array.from({ length: fmt.players }, (_, i) => ({
        id: 'p' + (i + 1),
        name: pLabel + ' ' + (i + 1)
      }));
    }

    const newTournament = {
      id,
      title,
      gender: finalGender,
      createdAt: Date.now(),
      category,
      format,
      phase: 'setup',
      started: false,
      players: initialPlayers,
      currentRound: 1,
      rounds: []
    };

    this.data.tournaments.push(newTournament);
    this.data.activeTournamentId = id;
    this.saveState();
    return newTournament;
  }

  setSelection(category, format) {
    return this.createTournament(category, format);
  }

  switchTournament(id) {
    const t = this.data.tournaments.find(tourn => tourn.id === id);
    if (t) {
      this.data.activeTournamentId = id;
      this.saveState();
      return t;
    }
    return null;
  }

  deleteTournament(id) {
    if (!this.data || !this.data.tournaments) return;
    const index = this.data.tournaments.findIndex(t => t.id === id);
    if (index === -1) return;
    this.data.tournaments.splice(index, 1);
    if (this.data.activeTournamentId === id) {
      this.data.activeTournamentId = this.data.tournaments.length > 0 ? this.data.tournaments[this.data.tournaments.length - 1].id : null;
    }
    this.saveState();
  }

  resetTournament() {
    if (this.data && this.data.activeTournamentId) {
      this.deleteTournament(this.data.activeTournamentId);
    }
  }

  setPlayers(playersList) {
    const active = this.getActiveTournament();
    if (!active) return;
    const { CATEGORIES } = window.TournamentConfig;
    const cat = CATEGORIES.find(c => c.id === active.category);
    const label = cat ? cat.playerLabel : 'Jogador';

    active.players = playersList.map((p, i) => ({
      ...p,
      id: p.id || ('p' + (i + 1)),
      name: (p.name || '').trim() || (p.gender === 'm' ? 'Homem ' + (parseInt(p.id.replace('m','')) || i+1) : p.gender === 'f' ? 'Mulher ' + (parseInt(p.id.replace('f','')) || i+1) : label + ' ' + (i + 1))
    }));
    this.saveState();
  }

  startTournament() {
    const active = this.getActiveTournament();
    if (!active) return;
    active.rounds = window.RoundRobinEngine.generateTournamentMatches(
      active.players, active.category
    );
    active.started = true;
    active.phase = 'playing';
    active.currentRound = 1;
    this.saveState();
  }

  updateMatchScore(roundNumber, matchId, scoreA, scoreB) {
    const active = this.getActiveTournament();
    if (!active || !active.rounds) return;
    const ro = active.rounds.find(r => r.round === roundNumber);
    if (!ro) return;
    const m = ro.matches.find(m => m.id === matchId);
    if (!m) return;
    m.scoreA = Math.max(0, parseInt(scoreA) || 0);
    m.scoreB = Math.max(0, parseInt(scoreB) || 0);
    this.saveState();
  }

  saveMatchResult(roundNumber, matchId, scoreA, scoreB) {
    const active = this.getActiveTournament();
    if (!active || !active.rounds) return;
    const ro = active.rounds.find(r => r.round === roundNumber);
    if (!ro) return;
    const m = ro.matches.find(m => m.id === matchId);
    if (!m) return;
    m.scoreA = Math.max(0, parseInt(scoreA) || 0);
    m.scoreB = Math.max(0, parseInt(scoreB) || 0);
    m.finished = true;
    m.isEditing = false;
    this.saveState();
  }

  editMatchResult(roundNumber, matchId) {
    const active = this.getActiveTournament();
    if (!active || !active.rounds) return;
    const ro = active.rounds.find(r => r.round === roundNumber);
    if (!ro) return;
    const m = ro.matches.find(m => m.id === matchId);
    if (!m) return;
    m.isEditing = true;
    this.saveState();
  }

  setCurrentRound(roundNumber) {
    const active = this.getActiveTournament();
    if (!active) return;
    active.currentRound = roundNumber;
    this.saveState();
  }

  /* ── Classificação base (calcula stats de cada jogador) ── */
  _buildStats(playersList) {
    const stats = {};
    playersList.forEach(p => {
      stats[p.id] = {
        id: p.id, name: p.name, gender: p.gender || null,
        matchesPlayed: 0, wins: 0, losses: 0,
        gamesWon: 0, gamesLost: 0, balance: 0, winRate: 0
      };
    });

    const active = this.getActiveTournament();
    if (!active || !active.rounds || !active.rounds.length) return stats;

    active.rounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.isByeMatch) return;
        const sA = match.scoreA || 0, sB = match.scoreB || 0;
        if (sA === 0 && sB === 0 && !match.finished) return;
        const finished = match.finished || (sA !== sB);

        [match.teamA, match.teamB].forEach((team, ti) => {
          team.forEach(player => {
            const st = stats[player.id];
            if (!st) return;
            st.matchesPlayed++;
            const myScore = ti === 0 ? sA : sB;
            const oppScore = ti === 0 ? sB : sA;
            st.gamesWon  += myScore;
            st.gamesLost += oppScore;
            if (finished) {
              if (myScore > oppScore) st.wins++;
              else if (oppScore > myScore) st.losses++;
            }
          });
        });
      });
    });

    return stats;
  }

  _sortStats(statsObj) {
    return Object.values(statsObj).map(st => {
      st.balance = st.gamesWon - st.gamesLost;
      st.winRate = st.matchesPlayed > 0 ? Math.round((st.wins / st.matchesPlayed) * 100) : 0;
      return st;
    }).sort((a, b) =>
      b.wins !== a.wins ? b.wins - a.wins :
      b.balance !== a.balance ? b.balance - a.balance :
      b.gamesWon - a.gamesWon
    );
  }

  /* ── Leaderboard único (Individual / Duplas Fixas) ── */
  getLeaderboard() {
    const active = this.getActiveTournament();
    if (!active || !active.players) return [];
    const stats = this._buildStats(active.players);
    return this._sortStats(stats);
  }

  /* ── Leaderboard duplo (Mistas: Masculino + Feminino) ── */
  getMixedLeaderboards() {
    const active = this.getActiveTournament();
    if (!active || !active.players) return { men: [], women: [] };
    const men   = active.players.filter(p => p.gender === 'm');
    const women = active.players.filter(p => p.gender === 'f');

    const allStats = this._buildStats(active.players);

    const menStats   = {};
    const womenStats = {};
    men.forEach(p   => { menStats[p.id]   = allStats[p.id]; });
    women.forEach(p => { womenStats[p.id] = allStats[p.id]; });

    return {
      men:   this._sortStats(menStats),
      women: this._sortStats(womenStats)
    };
  }

  getCompletedMatchesCount() {
    let total = 0, completed = 0;
    const active = this.getActiveTournament();
    if (active && active.rounds) {
      active.rounds.forEach(r => r.matches.forEach(m => {
        if (!m.isByeMatch) { total++; if (m.finished) completed++; }
      }));
    }
    return { completed, total };
  }

  /* ── Relatório de Confrontos Diretos (Head-to-Head) ── */
  getHeadToHeadReport(filterGender = null) {
    const active = this.getActiveTournament();
    if (!active || !active.players || !active.players.length) {
      return {
        players: [],
        matrix: {},
        summary: { totalPlayers: 0, totalMatches: 0, completedMatches: 0, pendingMatches: 0 },
        perPlayer: []
      };
    }

    let players = [...active.players];
    if (filterGender && (filterGender === 'm' || filterGender === 'f')) {
      players = players.filter(p => p.gender === filterGender);
    }

    // Inicializa matriz N x N
    const matrix = {};
    players.forEach(pA => {
      matrix[pA.id] = {};
      players.forEach(pB => {
        if (pA.id === pB.id) {
          matrix[pA.id][pB.id] = { isSelf: true };
        } else {
          matrix[pA.id][pB.id] = {
            playerA: pA,
            playerB: pB,
            totalScheduled: 0,
            playedCount: 0,
            pendingCount: 0,
            winsA: 0,
            winsB: 0,
            matches: []
          };
        }
      });
    });

    if (active.rounds && active.rounds.length) {
      active.rounds.forEach(round => {
        round.matches.forEach(match => {
          if (match.isByeMatch) return;
          const sA = match.scoreA || 0;
          const sB = match.scoreB || 0;
          const isFinished = !!match.finished;

          const teamA = match.teamA || [];
          const teamB = match.teamB || [];

          teamA.forEach(pA => {
            teamB.forEach(pB => {
              const partnerA = teamA.find(p => p.id !== pA.id) || null;
              const partnerB = teamB.find(p => p.id !== pB.id) || null;

              if (matrix[pA.id] && matrix[pA.id][pB.id]) {
                const cellAB = matrix[pA.id][pB.id];
                cellAB.totalScheduled++;
                if (isFinished) {
                  cellAB.playedCount++;
                  if (sA > sB) cellAB.winsA++;
                  else if (sB > sA) cellAB.winsB++;
                } else {
                  cellAB.pendingCount++;
                }
                cellAB.matches.push({
                  roundNumber: round.round,
                  court: match.court,
                  matchId: match.id,
                  partnerA: partnerA ? partnerA.name : null,
                  partnerB: partnerB ? partnerB.name : null,
                  scoreA: sA,
                  scoreB: sB,
                  finished: isFinished,
                  winner: isFinished ? (sA > sB ? 'A' : sB > sA ? 'B' : 'draw') : null
                });
              }

              if (matrix[pB.id] && matrix[pB.id][pA.id]) {
                const cellBA = matrix[pB.id][pA.id];
                cellBA.totalScheduled++;
                if (isFinished) {
                  cellBA.playedCount++;
                  if (sB > sA) cellBA.winsA++;
                  else if (sA > sB) cellBA.winsB++;
                } else {
                  cellBA.pendingCount++;
                }
                cellBA.matches.push({
                  roundNumber: round.round,
                  court: match.court,
                  matchId: match.id,
                  partnerA: partnerB ? partnerB.name : null,
                  partnerB: partnerA ? partnerA.name : null,
                  scoreA: sB,
                  scoreB: sA,
                  finished: isFinished,
                  winner: isFinished ? (sB > sA ? 'A' : sA > sB ? 'B' : 'draw') : null
                });
              }
            });
          });
        });
      });
    }

    const perPlayer = players.map(p => {
      const opponents = [];
      let totalSched = 0;
      let playedTot = 0;
      let pendingTot = 0;

      players.forEach(opp => {
        if (opp.id === p.id) return;
        const cell = matrix[p.id][opp.id];
        if (!cell) return;
        totalSched += cell.totalScheduled;
        playedTot += cell.playedCount;
        pendingTot += cell.pendingCount;

        opponents.push({
          opponent: opp,
          totalScheduled: cell.totalScheduled,
          playedCount: cell.playedCount,
          pendingCount: cell.pendingCount,
          wins: cell.winsA,
          losses: cell.winsB,
          matches: cell.matches
        });
      });

      return {
        player: p,
        totalScheduled: totalSched,
        playedCount: playedTot,
        pendingCount: pendingTot,
        opponents
      };
    });

    const { total, completed } = this.getCompletedMatchesCount();

    return {
      players,
      matrix,
      summary: {
        totalPlayers: players.length,
        totalMatches: total,
        completedMatches: completed,
        pendingMatches: Math.max(0, total - completed)
      },
      perPlayer
    };
  }
}

window.TournamentStateManager = TournamentStateManager;
