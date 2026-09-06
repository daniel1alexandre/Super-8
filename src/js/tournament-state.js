/**
 * SUPER BEACH TENNIS - GERENCIAMENTO DE ESTADO & CLASSIFICAÇÃO
 */
const STORAGE_KEY = 'SUPER_BEACH_TENNIS_V3';

class TournamentStateManager {
  constructor() {
    this.state = this.loadState() || this.getInitialState();
  }

  getInitialState() {
    return {
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
      return d ? JSON.parse(d) : null;
    } catch(e) { return null; }
  }

  saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch(e) {}
  }

  resetTournament() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.getInitialState();
  }

  setSelection(category, format) {
    const { TOURNAMENT_FORMATS, CATEGORIES } = window.TournamentConfig;
    const fmt = TOURNAMENT_FORMATS[format];
    const cat = CATEGORIES.find(c => c.id === category);
    if (!fmt || !cat) return;
    this.state.category = category;
    this.state.format = format;
    this.state.phase = 'setup';
    this.state.started = false;
    this.state.rounds = [];
    this.state.currentRound = 1;
    this.state.players = Array.from({ length: fmt.players }, (_, i) => ({
      id: 'p' + (i + 1),
      name: cat.playerLabel + ' ' + (i + 1)
    }));
    this.saveState();
  }

  setPlayers(playersList) {
    const { CATEGORIES } = window.TournamentConfig;
    const cat = CATEGORIES.find(c => c.id === this.state.category);
    const label = cat ? cat.playerLabel : 'Jogador';
    this.state.players = playersList.map((p, i) => ({
      id: 'p' + (i + 1),
      name: (p.name || '').trim() || label + ' ' + (i + 1)
    }));
    this.saveState();
  }

  startTournament() {
    this.state.rounds = window.RoundRobinEngine.generateTournamentMatches(
      this.state.players, this.state.category
    );
    this.state.started = true;
    this.state.phase = 'playing';
    this.state.currentRound = 1;
    this.saveState();
  }

  updateMatchScore(roundNumber, matchId, scoreA, scoreB) {
    const ro = this.state.rounds.find(r => r.round === roundNumber);
    if (!ro) return;
    const m = ro.matches.find(m => m.id === matchId);
    if (!m) return;
    m.scoreA = Math.max(0, parseInt(scoreA) || 0);
    m.scoreB = Math.max(0, parseInt(scoreB) || 0);
    this.saveState();
  }

  saveMatchResult(roundNumber, matchId, scoreA, scoreB) {
    const ro = this.state.rounds.find(r => r.round === roundNumber);
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
    const ro = this.state.rounds.find(r => r.round === roundNumber);
    if (!ro) return;
    const m = ro.matches.find(m => m.id === matchId);
    if (!m) return;
    m.isEditing = true;
    this.saveState();
  }

  setCurrentRound(roundNumber) {
    this.state.currentRound = roundNumber;
    this.saveState();
  }

  getLeaderboard() {
    const stats = {};
    this.state.players.forEach(p => {
      stats[p.id] = { id: p.id, name: p.name, matchesPlayed: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, balance: 0, winRate: 0 };
    });

    if (!this.state.rounds || !this.state.rounds.length) return Object.values(stats);

    this.state.rounds.forEach(round => {
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
            if (ti === 0) { st.gamesWon += sA; st.gamesLost += sB; if (finished) { if (sA > sB) st.wins++; else if (sB > sA) st.losses++; } }
            else { st.gamesWon += sB; st.gamesLost += sA; if (finished) { if (sB > sA) st.wins++; else if (sA > sB) st.losses++; } }
          });
        });
      });
    });

    return Object.values(stats).map(st => {
      st.balance = st.gamesWon - st.gamesLost;
      st.winRate = st.matchesPlayed > 0 ? Math.round((st.wins / st.matchesPlayed) * 100) : 0;
      return st;
    }).sort((a, b) => b.wins !== a.wins ? b.wins - a.wins : b.balance !== a.balance ? b.balance - a.balance : b.gamesWon - a.gamesWon);
  }

  getCompletedMatchesCount() {
    let total = 0, completed = 0;
    if (this.state.rounds) {
      this.state.rounds.forEach(r => r.matches.forEach(m => {
        if (!m.isByeMatch) { total++; if (m.finished) completed++; }
      }));
    }
    return { completed, total };
  }
}

window.TournamentStateManager = TournamentStateManager;
