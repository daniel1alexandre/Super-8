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

/**
 * Rodízio de Duplas Rotativas — Individual
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
