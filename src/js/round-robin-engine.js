/**
 * SUPER BEACH TENNIS - MOTOR DE RODÍZIO GENÉRICO
 * Algoritmo Berger (Método Circular) para N jogadores.
 * Suporta Individual/Mistas (duplas rotativas) e Duplas Fixas.
 */

/**
 * Rodízio de Duplas Rotativas — Individual / Mistas
 * Cada jogador faz dupla exatamente 1x com cada outro jogador.
 */
function generateRotatingDoublesRoundRobin(players) {
  const n = players.length;
  const isOdd = n % 2 !== 0;
  const ghost = isOdd ? { id: 'ghost', name: '— Folga —', isBye: true } : null;
  const list = isOdd ? [...players, ghost] : [...players];
  const m = list.length;
  const numRounds = m - 1;

  const arr = Array.from({ length: m }, (_, i) => i);
  const rounds = [];

  for (let r = 0; r < numRounds; r++) {
    const rawPairs = [];
    for (let i = 0; i < m / 2; i++) {
      rawPairs.push([list[arr[i]], list[arr[m - 1 - i]]]);
    }

    // Rotaciona arr[1..m-1] uma posição à direita
    const last = arr[m - 1];
    for (let i = m - 1; i > 1; i--) arr[i] = arr[i - 1];
    arr[1] = last;

    const ghostByePlayers = [];
    const activePairs = [];
    for (const pair of rawPairs) {
      if (pair.some(p => p.isBye)) {
        pair.filter(p => !p.isBye).forEach(p => ghostByePlayers.push(p));
      } else {
        activePairs.push(pair);
      }
    }

    const matches = [];
    const pairByePlayers = [];
    let courtNum = 1;

    for (let i = 0; i < activePairs.length; i += 2) {
      if (activePairs[i + 1]) {
        matches.push({
          id: 'R' + (r + 1) + '-M' + courtNum,
          court: 'Quadra ' + courtNum,
          teamA: activePairs[i],
          teamB: activePairs[i + 1],
          scoreA: 0, scoreB: 0,
          finished: false, isEditing: false, isByeMatch: false
        });
        courtNum++;
      } else {
        activePairs[i].forEach(p => pairByePlayers.push(p));
      }
    }

    const byePlayers = [...ghostByePlayers, ...pairByePlayers];
    rounds.push({ round: r + 1, matches, byePlayers });
  }

  return rounds;
}

/**
 * Rodízio Simples entre Equipes Fixas — Duplas Fixas
 */
function generateDuplasFixasRoundRobin(teams) {
  const n = teams.length;
  const isOdd = n % 2 !== 0;
  const ghost = isOdd ? { id: 'ghost', name: '— Folga —', isBye: true } : null;
  const list = isOdd ? [...teams, ghost] : [...teams];
  const m = list.length;
  const numRounds = m - 1;

  const arr = Array.from({ length: m }, (_, i) => i);
  const rounds = [];

  for (let r = 0; r < numRounds; r++) {
    const matches = [];
    const byePlayers = [];
    let courtNum = 1;

    for (let i = 0; i < m / 2; i++) {
      const tA = list[arr[i]];
      const tB = list[arr[m - 1 - i]];

      if (tA.isBye || tB.isBye) {
        const real = tA.isBye ? tB : tA;
        byePlayers.push(real);
      } else {
        matches.push({
          id: 'R' + (r + 1) + '-M' + courtNum,
          court: 'Quadra ' + courtNum,
          teamA: [tA],
          teamB: [tB],
          scoreA: 0, scoreB: 0,
          finished: false, isEditing: false, isByeMatch: false
        });
        courtNum++;
      }
    }

    const last = arr[m - 1];
    for (let i = m - 1; i > 1; i--) arr[i] = arr[i - 1];
    arr[1] = last;

    rounds.push({ round: r + 1, matches, byePlayers });
  }

  return rounds;
}

function generateTournamentMatches(players, category) {
  if (category === 'duplas') {
    return generateDuplasFixasRoundRobin(players);
  }
  return generateRotatingDoublesRoundRobin(players);
}

window.RoundRobinEngine = {
  generateTournamentMatches,
  generateRotatingDoublesRoundRobin,
  generateDuplasFixasRoundRobin
};
