/**
 * SUPER 8 BEACH TENNIS - GERENCIAMENTO DE ESTADO & CLASSIFICAÇÃO
 */

const STORAGE_KEY = "SUPER8_BEACH_TENNIS_TOURNAMENT_DATA";

class TournamentStateManager {
  constructor() {
    this.state = this.loadState() || this.getInitialState();
  }

  getInitialState() {
    return {
      started: false,
      players: [
        { id: "p1", name: "Jogador 1" },
        { id: "p2", name: "Jogador 2" },
        { id: "p3", name: "Jogador 3" },
        { id: "p4", name: "Jogador 4" },
        { id: "p5", name: "Jogador 5" },
        { id: "p6", name: "Jogador 6" },
        { id: "p7", name: "Jogador 7" },
        { id: "p8", name: "Jogador 8" }
      ],
      currentRound: 1,
      rounds: []
    };
  }

  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Erro ao carregar do LocalStorage", e);
      return null;
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Erro ao salvar no LocalStorage", e);
    }
  }

  resetTournament() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.getInitialState();
  }

  setPlayers(playersList) {
    this.state.players = playersList.map((p, idx) => ({
      id: `p${idx + 1}`,
      name: p.name.trim() || `Jogador ${idx + 1}`
    }));
    this.saveState();
  }

  startTournament() {
    this.state.rounds = window.Super8Algorithm.generateSuper8Matches(this.state.players);
    this.state.started = true;
    this.state.currentRound = 1;
    this.saveState();
  }

  updateMatchScore(roundNumber, matchId, scoreA, scoreB) {
    const roundObj = this.state.rounds.find(r => r.round === roundNumber);
    if (!roundObj) return;

    const match = roundObj.matches.find(m => m.id === matchId);
    if (!match) return;

    match.scoreA = Math.max(0, parseInt(scoreA) || 0);
    match.scoreB = Math.max(0, parseInt(scoreB) || 0);

    // Marca como finalizado se ao menos um dos lados tiver pontuado e forem diferentes
    match.finished = (match.scoreA > 0 || match.scoreB > 0) && (match.scoreA !== match.scoreB);
    this.saveState();
  }

  toggleMatchFinished(roundNumber, matchId) {
    const roundObj = this.state.rounds.find(r => r.round === roundNumber);
    if (!roundObj) return;

    const match = roundObj.matches.find(m => m.id === matchId);
    if (!match) return;

    match.finished = !match.finished;
    this.saveState();
  }

  setCurrentRound(roundNumber) {
    this.state.currentRound = roundNumber;
    this.saveState();
  }

  /**
   * Computa a classificação individual em tempo real com base em todos os jogos finalizados.
   */
  getLeaderboard() {
    const stats = {};

    // Inicializa estatísticas para cada jogador
    this.state.players.forEach(p => {
      stats[p.id] = {
        id: p.id,
        name: p.name,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        gamesWon: 0,
        gamesLost: 0,
        balance: 0,
        winRate: 0
      };
    });

    if (!this.state.rounds || this.state.rounds.length === 0) {
      return Object.values(stats);
    }

    // Processa cada partida
    this.state.rounds.forEach(round => {
      round.matches.forEach(match => {
        // Se a partida tiver pontuação ou estiver marcada como finalizada
        const scoreA = match.scoreA || 0;
        const scoreB = match.scoreB || 0;

        if (scoreA > 0 || scoreB > 0 || match.finished) {
          const isFinished = match.finished || (scoreA !== scoreB);
          
          // Equipe A
          match.teamA.forEach(player => {
            const st = stats[player.id];
            if (st) {
              st.matchesPlayed += 1;
              st.gamesWon += scoreA;
              st.gamesLost += scoreB;
              if (isFinished) {
                if (scoreA > scoreB) st.wins += 1;
                else if (scoreB > scoreA) st.losses += 1;
              }
            }
          });

          // Equipe B
          match.teamB.forEach(player => {
            const st = stats[player.id];
            if (st) {
              st.matchesPlayed += 1;
              st.gamesWon += scoreB;
              st.gamesLost += scoreA;
              if (isFinished) {
                if (scoreB > scoreA) st.wins += 1;
                else if (scoreA > scoreB) st.losses += 1;
              }
            }
          });
        }
      });
    });

    // Calcula saldo e aproveitamento
    const list = Object.values(stats).map(st => {
      st.balance = st.gamesWon - st.gamesLost;
      st.winRate = st.matchesPlayed > 0 ? Math.round((st.wins / st.matchesPlayed) * 100) : 0;
      return st;
    });

    // Ordenação padrão Beach Tennis:
    // 1. Vitórias (desc)
    // 2. Saldo de Games (desc)
    // 3. Games Pró (desc)
    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.balance !== a.balance) return b.balance - a.balance;
      return b.gamesWon - a.gamesWon;
    });

    return list;
  }

  getCompletedMatchesCount() {
    let total = 0;
    let completed = 0;
    if (this.state.rounds) {
      this.state.rounds.forEach(r => {
        r.matches.forEach(m => {
          total += 1;
          if (m.finished) completed += 1;
        });
      });
    }
    return { completed, total: total || 14 };
  }
}

window.TournamentStateManager = TournamentStateManager;
