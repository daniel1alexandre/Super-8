/**
 * SUPER BEACH TENNIS - CONFIGURAÇÃO DE CATEGORIAS E FORMATOS
 */

const TOURNAMENT_FORMATS = {
  'super5':  { id: 'super5',  name: 'Super 5',  numeral: '5',  players: 5,  rounds: 5,  courts: 1, description: '5 atletas · 5 rodadas · 1 quadra' },
  'super6':  { id: 'super6',  name: 'Super 6',  numeral: '6',  players: 6,  rounds: 5,  courts: 1, description: '6 atletas · 5 rodadas · 1 quadra' },
  'super7':  { id: 'super7',  name: 'Super 7',  numeral: '7',  players: 7,  rounds: 7,  courts: 1, description: '7 atletas · 7 rodadas · 1 quadra' },
  'super8':  { id: 'super8',  name: 'Super 8',  numeral: '8',  players: 8,  rounds: 7,  courts: 2, description: '8 atletas · 7 rodadas · 2 quadras', featured: true },
  'super9':  { id: 'super9',  name: 'Super 9',  numeral: '9',  players: 9,  rounds: 9,  courts: 2, description: '9 atletas · 9 rodadas · 2 quadras' },
  'super10': { id: 'super10', name: 'Super 10', numeral: '10', players: 10, rounds: 9,  courts: 2, description: '10 atletas · 9 rodadas · 2 quadras' },
  'super11': { id: 'super11', name: 'Super 11', numeral: '11', players: 11, rounds: 11, courts: 2, description: '11 atletas · 11 rodadas · 2 quadras' },
  'super12': { id: 'super12', name: 'Super 12', numeral: '12', players: 12, rounds: 11, courts: 3, description: '12 atletas · 11 rodadas · 3 quadras' },
};

const CATEGORIES = [
  {
    id: 'individual',
    label: 'Individual',
    description: 'Duplas rotativas\nCada atleta joga com todos',
    icon: '👤',
    gradient: 'linear-gradient(135deg, #ff9f1c 0%, #ff5400 100%)',
    borderColor: 'rgba(255, 159, 28, 0.5)',
    color: '#ff9f1c',
    playerLabel: 'Atleta',
    playerPlaceholder: 'Nome do Atleta',
    demoNames: ['Lucas Silva','Gabriel Ramos','Matheus Costa','Felipe Santos','Rodrigo Lima','Thiago Rocha','Bruno Martins','Rafael Souza','André Lima','Caio Ferreira','Diego Alves','Enzo Carvalho']
  },
  {
    id: 'duplas',
    label: 'Duplas Fixas',
    description: 'Pares fixos disputam\ntodas as rodadas juntos',
    icon: '👥',
    gradient: 'linear-gradient(135deg, #2ec4b6 0%, #0077b6 100%)',
    borderColor: 'rgba(46, 196, 182, 0.5)',
    color: '#2ec4b6',
    playerLabel: 'Dupla',
    playerPlaceholder: 'Ex: João & Ana',
    demoNames: ['Carlos & Bruna','Pedro & Camila','Lucas & Júlia','Rafael & Larissa','André & Fernanda','Felipe & Beatriz','Thiago & Marcela','Diego & Isabela','Bruno & Letícia','Caio & Natália','Enzo & Vitória','Rodrigo & Rebeca']
  },
  {
    id: 'mistas',
    label: 'Mistas',
    description: 'Formato misto masculino\ne feminino em rodízio',
    icon: '🔀',
    gradient: 'linear-gradient(135deg, #ff3366 0%, #9b2dca 100%)',
    borderColor: 'rgba(255, 51, 102, 0.5)',
    color: '#ff3366',
    playerLabel: 'Atleta',
    playerPlaceholder: 'Nome do Atleta',
    demoNames: ['João Silva','Ana Lima','Pedro Costa','Carla Souza','Lucas Ramos','Mariana Rocha','Felipe Martins','Beatriz Alves','Rafael Santos','Júlia Ferreira','Bruno Carvalho','Vitória Cruz']
  }
];

window.TournamentConfig = { TOURNAMENT_FORMATS, CATEGORIES };
