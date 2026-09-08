/**
 * SUPER BEACH TENNIS - MOTOR DE RODÍZIO GENÉRICO
 * Algoritmo Berger (Método Circular) para N jogadores.
 * Suporta Individual/Mistas (duplas rotativas), Duplas Fixas e Mistas Individual.
 */

/**
 * Gera as posições do rodízio Berger para N participantes.
 * Retorna array de rodadas; cada rodada é array de pares [posA, posB].
 */
function generateBergerPositions(n) {
  const isOdd = n % 2 !== 0;
  const m = isOdd ? n + 1 : n;
  const arr = Array.from({ length: m }, (_, i) => i);
  const numRounds = m - 1;
  const rounds = [];

  for (let r = 0; r < numRounds; r++) {
    const pairs = [];
    for (let i = 0; i < m / 2; i++) {
      pairs.push([arr[i], arr[m - 1 - i]]);
    }
    const last = arr[m - 1];
    for (let i = m - 1; i > 1; i--) arr[i] = arr[i - 1];
    arr[1] = last;
    // Filtra pares que envolvam o "ghost" (posição >= n) para retornar somente reais
    rounds.push(pairs.filter(p => p[0] < n && p[1] < n));
  }
  return rounds;
}

/* ─── TABELAS DE CONFRONTOS ÓTIMOS (DISTRIBUIÇÃO MÍNIMA, ZERO ZEROS) ─── */
const OPTIMAL_SCHEDULE_6 = [
  { matches: [[[3,2],[4,5]]], byes: [0,1] },
  { matches: [[[0,1],[5,4]]], byes: [2,3] },
  { matches: [[[1,0],[2,3]]], byes: [4,5] },
  { matches: [[[2,4],[3,5]]], byes: [0,1] },
  { matches: [[[1,4],[0,5]]], byes: [2,3] }
];

const OPTIMAL_SCHEDULE_7 = [
  { matches: [[[4,3],[5,6]]], byes: [0,1,2] },
  { matches: [[[2,1],[0,6]]], byes: [3,4,5] },
  { matches: [[[2,3],[4,5]]], byes: [6,0,1] },
  { matches: [[[0,1],[5,6]]], byes: [2,3,4] },
  { matches: [[[1,2],[3,4]]], byes: [5,6,0] },
  { matches: [[[0,6],[5,4]]], byes: [1,2,3] },
  { matches: [[[0,1],[2,3]]], byes: [4,5,6] }
];

const OPTIMAL_SCHEDULE_9 = [
  { matches: [[[3,1],[4,7]],[[8,6],[2,5]]], byes: [0] },
  { matches: [[[2,6],[3,7]],[[0,8],[5,4]]], byes: [1] },
  { matches: [[[6,0],[1,4]],[[5,8],[3,7]]], byes: [2] },
  { matches: [[[1,0],[8,7]],[[5,6],[4,2]]], byes: [3] },
  { matches: [[[7,5],[6,3]],[[8,1],[2,0]]], byes: [4] },
  { matches: [[[7,2],[4,0]],[[3,8],[1,6]]], byes: [5] },
  { matches: [[[8,5],[4,7]],[[2,3],[1,0]]], byes: [6] },
  { matches: [[[2,1],[4,5]],[[8,0],[3,6]]], byes: [7] },
  { matches: [[[7,3],[4,2]],[[6,5],[0,1]]], byes: [8] }
];

const OPTIMAL_SCHEDULE_10 = [
  { matches: [[[9,3],[8,7]],[[2,4],[5,6]]], byes: [0,1] },
  { matches: [[[6,4],[7,0]],[[1,5],[8,9]]], byes: [2,3] },
  { matches: [[[3,1],[0,6]],[[7,2],[9,8]]], byes: [4,5] },
  { matches: [[[0,1],[8,5]],[[4,9],[2,3]]], byes: [6,7] },
  { matches: [[[2,4],[1,0]],[[5,3],[6,7]]], byes: [8,9] },
  { matches: [[[3,9],[5,4]],[[6,2],[8,7]]], byes: [0,1] },
  { matches: [[[6,5],[4,1]],[[9,7],[8,0]]], byes: [2,3] },
  { matches: [[[1,2],[3,7]],[[0,6],[9,8]]], byes: [4,5] },
  { matches: [[[5,1],[2,0]],[[8,9],[3,4]]], byes: [6,7] }
];

const OPTIMAL_SCHEDULE_11 = [
  { matches: [[[4,5],[8,9]],[[7,3],[10,6]]], byes: [0,1,2] },
  { matches: [[[6,9],[10,1]],[[8,2],[0,7]]], byes: [3,4,5] },
  { matches: [[[1,2],[4,3]],[[10,0],[5,9]]], byes: [6,7,8] },
  { matches: [[[6,1],[4,8]],[[2,3],[7,5]]], byes: [9,10,0] },
  { matches: [[[9,10],[7,5]],[[0,8],[6,4]]], byes: [1,2,3] },
  { matches: [[[1,0],[7,10]],[[3,2],[8,9]]], byes: [4,5,6] },
  { matches: [[[3,5],[4,0]],[[1,6],[2,10]]], byes: [7,8,9] },
  { matches: [[[8,5],[2,3]],[[7,9],[6,4]]], byes: [10,0,1] },
  { matches: [[[1,5],[7,6]],[[9,10],[8,0]]], byes: [2,3,4] },
  { matches: [[[4,2],[3,10]],[[9,0],[8,1]]], byes: [5,6,7] },
  { matches: [[[2,5],[1,4]],[[6,7],[0,3]]], byes: [8,9,10] }
];

function _buildFromPrecomputed(players, rawSchedule) {
  return rawSchedule.map((rd, rIdx) => {
    const matches = rd.matches.map((m, mIdx) => ({
      id: 'R' + (rIdx + 1) + '-M' + (mIdx + 1),
      court: 'Quadra ' + (mIdx + 1),
      teamA: [players[m[0][0]], players[m[0][1]]],
      teamB: [players[m[1][0]], players[m[1][1]]],
      scoreA: 0, scoreB: 0,
      finished: false, isEditing: false, isByeMatch: false
    }));
    const byePlayers = (rd.byes || []).map(idx => players[idx]).filter(Boolean);
    return { round: rIdx + 1, matches, byePlayers };
  });
}

function _buildWhist5(players) {
  const rounds = [];
  for (let r = 0; r < 5; r++) {
    const matches = [{
      id: 'R' + (r + 1) + '-M1',
      court: 'Quadra 1',
      teamA: [players[(r + 1) % 5], players[(r + 4) % 5]],
      teamB: [players[(r + 2) % 5], players[(r + 3) % 5]],
      scoreA: 0, scoreB: 0,
      finished: false, isEditing: false, isByeMatch: false
    }];
    const byePlayers = [players[r]];
    rounds.push({ round: r + 1, matches, byePlayers });
  }
  return rounds;
}

function _buildWhist8(players) {
  const rounds = [];
  for (let r = 0; r < 7; r++) {
    const matches = [
      {
        id: 'R' + (r + 1) + '-M1',
        court: 'Quadra 1',
        teamA: [players[7], players[(3 + r) % 7]],
        teamB: [players[(4 + r) % 7], players[(6 + r) % 7]],
        scoreA: 0, scoreB: 0,
        finished: false, isEditing: false, isByeMatch: false
      },
      {
        id: 'R' + (r + 1) + '-M2',
        court: 'Quadra 2',
        teamA: [players[(0 + r) % 7], players[(1 + r) % 7]],
        teamB: [players[(2 + r) % 7], players[(5 + r) % 7]],
        scoreA: 0, scoreB: 0,
        finished: false, isEditing: false, isByeMatch: false
      }
    ];
    rounds.push({ round: r + 1, matches, byePlayers: [] });
  }
  return rounds;
}

function _buildWhist12(players) {
  const rounds = [];
  const baseTables = [
    [[11, 6], [2, 1]],
    [[10, 3], [8, 0]],
    [[5, 7], [4, 9]]
  ];

  for (let r = 0; r < 11; r++) {
    const matches = baseTables.map((t, idx) => {
      const idxA1 = t[0][0] === 11 ? 11 : (t[0][0] + r) % 11;
      const idxA2 = t[0][1] === 11 ? 11 : (t[0][1] + r) % 11;
      const idxB1 = t[1][0] === 11 ? 11 : (t[1][0] + r) % 11;
      const idxB2 = t[1][1] === 11 ? 11 : (t[1][1] + r) % 11;

      return {
        id: 'R' + (r + 1) + '-M' + (idx + 1),
        court: 'Quadra ' + (idx + 1),
        teamA: [players[idxA1], players[idxA2]],
        teamB: [players[idxB1], players[idxB2]],
        scoreA: 0, scoreB: 0,
        finished: false, isEditing: false, isByeMatch: false
      };
    });
    rounds.push({ round: r + 1, matches, byePlayers: [] });
  }
  return rounds;
}

/**
 * Rodízio de Duplas Rotativas — Individual
 * Garante que a distribuição de confrontos entre adversários seja a mínima possível
 * e que TODOS os atletas se enfrentem ao longo do torneio (zero zeros).
 */
function generateRotatingDoublesRoundRobin(players) {
  const n = players.length;
  if (n === 5) return _buildWhist5(players);
  if (n === 6) return _buildFromPrecomputed(players, OPTIMAL_SCHEDULE_6);
  if (n === 7) return _buildFromPrecomputed(players, OPTIMAL_SCHEDULE_7);
  if (n === 8) return _buildWhist8(players);
  if (n === 9) return _buildFromPrecomputed(players, OPTIMAL_SCHEDULE_9);
  if (n === 10) return _buildFromPrecomputed(players, OPTIMAL_SCHEDULE_10);
  if (n === 11) return _buildFromPrecomputed(players, OPTIMAL_SCHEDULE_11);
  if (n === 12) return _buildWhist12(players);

  // Fallback para qualquer outro número arbitrário
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

/**
 * Super 8 Mistas Individual
 * 8 homens + 8 mulheres → 7 rodadas, 4 quadras por rodada.
 *
 * Algoritmo: aplica Berger separadamente para homens e para mulheres.
 * Em cada rodada r, quadra k:
 *   Dupla A = (homem da posA_men, mulher da posA_women)
 *   Dupla B = (homem da posB_men, mulher da posB_women)
 *
 * Isso garante que cada homem joga contra todos os outros homens ao longo
 * do torneio, cada mulher joga contra todas as outras mulheres, e as
 * duplas mistas rotacionam a cada rodada.
 */
function generateMixedIndividualMatches(men, women) {
  const menPositions = generateBergerPositions(men.length);
  const womenPositions = generateBergerPositions(women.length);
  const numRounds = menPositions.length;
  const rounds = [];

  // Ordem balanceada de rodadas e inversões para garantir que cada homem enfrente
  // cada outro homem 1x, cada mulher enfrente cada outra mulher 1x, e parceiros 100% únicos
  const womenRoundOrder = [0, 2, 4, 6, 1, 3, 5];
  const roundFlips = [0, 1, 1, 1, 1, 1, 1];

  for (let r = 0; r < numRounds; r++) {
    const mPairs = menPositions[r];
    const wPairs = womenPositions[womenRoundOrder[r]];
    const flipMask = roundFlips[r];
    const matches = [];

    for (let k = 0; k < mPairs.length; k++) {
      const idxManA = mPairs[k][0];
      const idxManB = mPairs[k][1];
      const flip = (flipMask >> k) & 1;
      const idxWomanA = flip ? wPairs[k][1] : wPairs[k][0];
      const idxWomanB = flip ? wPairs[k][0] : wPairs[k][1];

      matches.push({
        id: 'R' + (r + 1) + '-M' + (k + 1),
        court: 'Quadra ' + (k + 1),
        teamA: [men[idxManA], women[idxWomanA]],
        teamB: [men[idxManB], women[idxWomanB]],
        scoreA: 0, scoreB: 0,
        finished: false, isEditing: false, isByeMatch: false,
        isMixed: true
      });
    }

    rounds.push({ round: r + 1, matches, byePlayers: [] });
  }

  return rounds;
}

function generateTournamentMatches(players, category) {
  if (category === 'duplas') {
    return generateDuplasFixasRoundRobin(players);
  }
  if (category === 'mistas') {
    const men   = players.filter(p => p.gender === 'm');
    const women = players.filter(p => p.gender === 'f');
    return generateMixedIndividualMatches(men, women);
  }
  return generateRotatingDoublesRoundRobin(players);
}

window.RoundRobinEngine = {
  generateTournamentMatches,
  generateRotatingDoublesRoundRobin,
  generateDuplasFixasRoundRobin,
  generateMixedIndividualMatches,
  generateBergerPositions
};
