/**
 * SUPER 8 BEACH TENNIS - APP PRINCIPAL
 */

document.addEventListener('DOMContentLoaded', () => {
  const stateManager = new TournamentStateManager();
  const ui = new TournamentUI(stateManager);

  // Inicializa a UI
  ui.renderAll();

  // Alternância de Abas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.currentTarget.getAttribute('data-tab');
      ui.switchTab(tabId);
    });
  });

  // Botão Preencher Exemplo
  const btnDemo = document.getElementById('btn-demo-players');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      const demoNames = [
        "Lucas Silva",
        "Gabriel Ramos",
        "Matheus Costa",
        "Felipe Santos",
        "Rodrigo Lima",
        "Thiago Rocha",
        "Bruno Martins",
        "Rafael Souza"
      ];

      const inputs = document.querySelectorAll('.player-name-input');
      inputs.forEach((inp, idx) => {
        inp.value = demoNames[idx] || `Jogador ${idx + 1}`;
      });
    });
  }

  // Iniciar Torneio
  const btnStart = document.getElementById('btn-start-tournament');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      const inputs = document.querySelectorAll('.player-name-input');
      const playersList = [];

      inputs.forEach((inp, idx) => {
        const val = inp.value.trim() || `Jogador ${idx + 1}`;
        playersList.push({ name: val });
      });

      if (playersList.length < 8) {
        alert("O formato Super 8 requer exatamente 8 atletas!");
        return;
      }

      stateManager.setPlayers(playersList);
      stateManager.startTournament();
      ui.renderRoundsNav();
      ui.renderMatches();
      ui.renderLeaderboard();
      ui.updateHeaderProgress();
      ui.switchTab('matches');
    });
  }

  // Salvar nomes ao digitar
  const playerGrid = document.getElementById('players-input-grid');
  if (playerGrid) {
    playerGrid.addEventListener('input', (e) => {
      if (e.target.classList.contains('player-name-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const val = e.target.value;
        if (stateManager.state.players[idx]) {
          stateManager.state.players[idx].name = val;
          stateManager.saveState();
        }
      }
    });
  }

  // Modo TV
  const btnTv = document.getElementById('btn-tv-mode');
  if (btnTv) {
    btnTv.addEventListener('click', () => {
      document.body.classList.toggle('tv-mode');
      if (document.body.classList.contains('tv-mode')) {
        btnTv.classList.add('btn-primary');
        btnTv.classList.remove('btn-secondary');
        btnTv.innerHTML = '<span class="btn-icon">✖</span> Sair Telão';
        ui.switchTab('leaderboard');
      } else {
        btnTv.classList.remove('btn-primary');
        btnTv.classList.add('btn-secondary');
        btnTv.innerHTML = '<span class="btn-icon">📺</span> Modo TV';
      }
    });
  }

  // Modal Compartilhar
  const modalShare = document.getElementById('modal-share');
  const btnShare = document.getElementById('btn-share-results');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const shareTextArea = document.getElementById('share-text-area');
  const btnCopyShare = document.getElementById('btn-copy-share');
  const btnOpenWhatsapp = document.getElementById('btn-open-whatsapp');

  if (btnShare && modalShare && shareTextArea) {
    btnShare.addEventListener('click', () => {
      shareTextArea.value = ui.generateShareText();
      modalShare.style.display = 'flex';
    });
  }

  if (btnCloseModal && modalShare) {
    btnCloseModal.addEventListener('click', () => {
      modalShare.style.display = 'none';
    });
  }

  if (btnCopyShare && shareTextArea) {
    btnCopyShare.addEventListener('click', () => {
      shareTextArea.select();
      navigator.clipboard.writeText(shareTextArea.value).then(() => {
        const originalText = btnCopyShare.innerHTML;
        btnCopyShare.innerHTML = '✅ Copiado!';
        setTimeout(() => {
          btnCopyShare.innerHTML = originalText;
        }, 2000);
      });
    });
  }

  if (btnOpenWhatsapp && shareTextArea) {
    btnOpenWhatsapp.addEventListener('click', () => {
      const text = encodeURIComponent(shareTextArea.value);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    });
  }

  // Reiniciar Torneio
  const btnReset = document.getElementById('btn-reset-tournament');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm("Tem certeza que deseja reiniciar todo o torneio? Todos os placares e pontuações serão zerados.")) {
        stateManager.resetTournament();
        ui.renderAll();
        ui.switchTab('setup');
      }
    });
  }
});
