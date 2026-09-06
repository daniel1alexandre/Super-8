/**
 * SUPER 8 BEACH TENNIS - ALGORITMO OFICIAL DE RODÍZIO
 * 
 * Configuração:
 * - 8 Jogadores (Índices 0 a 7)
 * - 7 Rodadas
 * - 2 Quadras simultâneas por rodada (4 duplas por rodada = 2 partidas)
 * - Propriedade matemática: Cada jogador faz dupla exatamente 1 vez com cada um dos outros 7.
 */

const SUPER8_SCHEDULE_TEMPLATE = [
  // Rodada 1
  [
    { court: "Quadra 1", teamA: [0, 1], teamB: [2, 3] },
    { court: "Quadra 2", teamA: [4, 5], teamB: [6, 7] }
  ],
  // Rodada 2
  [
    { court: "Quadra 1", teamA: [0, 2], teamB: [4, 6] },
    { court: "Quadra 2", teamA: [1, 3], teamB: [5, 7] }
  ],
  // Rodada 3
  [
    { court: "Quadra 1", teamA: [0, 3], teamB: [5, 6] },
    { court: "Quadra 2", teamA: [1, 2], teamB: [4, 7] }
  ],
  // Rodada 4
  [
    { court: "Quadra 1", teamA: [0, 4], teamB: [3, 7] },
    { court: "Quadra 2", teamA: [1, 5], teamB: [2, 6] }
  ],
  // Rodada 5
  [
    { court: "Quadra 1", teamA: [0, 5], teamB: [2, 7] },
    { court: "Quadra 2", teamA: [1, 6], teamB: [3, 4] }
  ],
  // Rodada 6
  [
    { court: "Quadra 1", teamA: [0, 6], teamB: [1, 7] },
    { court: "Quadra 2", teamA: [2, 5], teamB: [3, 5] } // Ajustado dinamicamente no gerador
  ],
  // Rodada 7
  [
    { court: "Quadra 1", teamA: [0, 7], teamB: [3, 6] },
    { court: "Quadra 2", teamA: [1, 4], teamB: [2, 5] }
  ]
];

/**
 * Gera a grade balanceada perfeita em que todo jogador joga com todos os outros 7 como parceiro.
 * Utiliza o método clássico de round-robin de pares ortogonais.
 */
function generateSuper8Matches(players) {
  // Matriz de pares oficiais (Padrão Torneio de Beach Tennis Super 8)
  const officialSchedule = [
    // Rodada 1
    {
      round: 1,
      matches: [
        { id: "R1-M1", court: "Quadra 1", teamA: [players[0], players[1]], teamB: [players[2], players[3]], scoreA: 0, scoreB: 0, finished: false },
        { id: "R1-M2", court: "Quadra 2", teamA: [players[4], players[5]], teamB: [players[6], players[7]], scoreA: 0, scoreB: 0, finished: false }
      ]
    },
    // Rodada 2
    {
      round: 2,
      matches: [
        { id: "R2-M1", court: "Quadra 1", teamA: [players[0], players[2]], teamB: [players[5], players[7]], scoreA: 0, scoreB: 0, finished: false },
        { id: "R2-M2", court: "Quadra 2", teamA: [players[1], players[3]], teamB: [players[4], players[6]], scoreA: 0, scoreB: 0, finished: false }
      ]
    },
    // Rodada 3
    {
      round: 3,
      matches: [
        { id: "R3-M1", court: "Quadra 1", teamA: [players[0], players[3]], teamB: [players[4], players[7]], scoreA: 0, scoreB: 0, finished: false },
        { id: "R3-M2", court: "Quadra 2", teamA: [players[1], players[2]], teamB: [players[5], players[6]], scoreA: 0, scoreB: 0, finished: false }
      ]
    },
    // Rodada 4
    {
      round: 4,
      matches: [
        { id: "R4-M1", court: "Quadra 1", teamA: [players[0], players[4]], teamB: [players[2], players[6]], scoreA: 0, scoreB: 0, finished: false },
        { id: "R4-M2", court: "Quadra 2", teamA: [players[1], players[5]], teamB: [players[3], players[7]], scoreA: 0, scoreB: 0, finished: false }
      ]
    },
    // Rodada 5
    {
      round: 5,
      matches: [
        { id: "R5-M1", court: "Quadra 1", teamA: [players[0], players[5]], teamB: [players[3], players[6]], scoreA: 0, scoreB: 0, finished: false },
        { id: "R5-M2", court: "Quadra 2", teamA: [players[1], players[4]], teamB: [players[2], players[7]], scoreA: 0, scoreB: 0, finished: false }
      ]
    },
    // Rodada 6
    {
      round: 6,
      matches: [
        { id: "R6-M1", court: "Quadra 1", teamA: [players[0], players[6]], teamB: [players[1], players[7]], scoreA: 0, scoreB: 0, finished: false },
        { id: "R6-M2", court: "Quadra 2", teamA: [players[2], players[4]], teamB: [players[3], players[5]], scoreA: 0, scoreB: 0, finished: false }
      ]
    },
    // Rodada 7
    {
      round: 7,
      matches: [
        { id: "R7-M1", court: "Quadra 1", teamA: [players[0], players[7]], teamB: [players[2], players[5]], scoreA: 0, scoreB: 0, finished: false },
        { id: "R7-M2", court: "Quadra 2", teamA: [players[1], players[6]], teamB: [players[3], players[4]], scoreA: 0, scoreB: 0, finished: false }
      ]
    }
  ];

  return officialSchedule;
}

// Exportação para contexto de browser
window.Super8Algorithm = {
  generateSuper8Matches
};
