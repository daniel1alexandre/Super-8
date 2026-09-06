/**
 * SUPER BEACH TENNIS - APP PRINCIPAL
 */
document.addEventListener("DOMContentLoaded", () => {
  const sm = new TournamentStateManager();
  const ui = new TournamentUI(sm);

  ui.init();

  /* ─── TELA DE SELEÇÃO ─── */

  document.getElementById("btn-proceed-setup").addEventListener("click", () => {
    if (!ui._selectedCategory || !ui._selectedFormat) return;
    if (sm.state.started && sm.state.rounds && sm.state.rounds.some(r => r.matches && r.matches.some(m => m.finished))) {
      if (!confirm("Já existem partidas finalizadas no torneio anterior. Deseja iniciar este novo torneio e substituir os dados?")) {
        return;
      }
    }
    sm.setSelection(ui._selectedCategory, ui._selectedFormat);
    ui.showScreen("app");
    ui.updateAppHeader();
    ui.renderPlayersSetup();
    ui.updateHeaderProgress();
    ui.switchTab("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ─── CONTINUAR TORNEIO (BANNER NA SELEÇÃO) ─── */
  const btnResume = document.getElementById("btn-resume-tournament");
  if (btnResume) {
    btnResume.addEventListener("click", () => {
      ui.showScreen("app");
      ui.updateAppHeader();
      if (sm.state.started) {
        ui.switchTab("matches");
      } else {
        ui.switchTab("setup");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ─── ABAS ─── */
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", e => ui.switchTab(e.currentTarget.dataset.tab));
  });

  /* ─── VOLTAR À SELEÇÃO DE CATEGORIAS / TORNEIOS ─── */
  const btnBackSel = document.getElementById("btn-back-selection");
  if (btnBackSel) {
    btnBackSel.addEventListener("click", (e) => {
      e.preventDefault();
      ui.goToSelection();
    });
  }

  /* ─── DEMO PLAYERS ─── */
  document.getElementById("btn-demo-players").addEventListener("click", () => {
    const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
    const cat = CATEGORIES.find(c => c.id === sm.state.category);
    const fmt = TOURNAMENT_FORMATS[sm.state.format];
    if (!cat || !fmt) return;
    const demos = (cat.demoNames || []).slice(0, fmt.players);
    document.querySelectorAll(".player-name-input").forEach((inp, i) => {
      inp.value = demos[i] || (cat.playerLabel + " " + (i + 1));
    });
  });

  /* ─── SALVAR NOMES AO DIGITAR ─── */
  document.getElementById("players-input-grid").addEventListener("input", e => {
    if (e.target.classList.contains("player-name-input")) {
      const idx = parseInt(e.target.dataset.index);
      if (sm.state.players[idx]) {
        sm.state.players[idx].name = e.target.value;
        sm.saveState();
      }
    }
  });

  /* ─── INICIAR TORNEIO ─── */
  document.getElementById("btn-start-tournament").addEventListener("click", () => {
    const inputs = document.querySelectorAll(".player-name-input");
    const { CATEGORIES } = window.TournamentConfig;
    const cat = CATEGORIES.find(c => c.id === sm.state.category) || {};
    const label = cat.playerLabel || "Jogador";

    const playersList = [];
    inputs.forEach((inp, i) => {
      playersList.push({ name: inp.value.trim() || label + " " + (i + 1) });
    });

    sm.setPlayers(playersList);
    sm.startTournament();
    ui.renderRoundsNav();
    ui.renderMatches();
    ui.renderLeaderboard();
    ui.updateHeaderProgress();
    ui.switchTab("matches");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ─── MODO TV ─── */
  document.getElementById("btn-tv-mode").addEventListener("click", () => {
    document.body.classList.toggle("tv-mode");
    const btn = document.getElementById("btn-tv-mode");
    if (document.body.classList.contains("tv-mode")) {
      btn.classList.replace("btn-secondary", "btn-primary");
      btn.innerHTML = '<span class="btn-icon">✖</span> Sair Telão';
      ui.switchTab("leaderboard");
    } else {
      btn.classList.replace("btn-primary", "btn-secondary");
      btn.innerHTML = '<span class="btn-icon">📺</span> Modo TV';
    }
  });

  /* ─── COMPARTILHAR ─── */
  const modalShare = document.getElementById("modal-share");
  document.getElementById("btn-share-results").addEventListener("click", () => {
    document.getElementById("share-text-area").value = ui.generateShareText();
    modalShare.style.display = "flex";
  });
  document.getElementById("btn-close-modal").addEventListener("click", () => { modalShare.style.display = "none"; });
  document.getElementById("btn-copy-share").addEventListener("click", () => {
    const ta = document.getElementById("share-text-area");
    navigator.clipboard.writeText(ta.value).then(() => {
      const btn = document.getElementById("btn-copy-share");
      const orig = btn.innerHTML;
      btn.innerHTML = "✅ Copiado!";
      setTimeout(() => btn.innerHTML = orig, 2000);
    });
  });
  document.getElementById("btn-open-whatsapp").addEventListener("click", () => {
    const text = encodeURIComponent(document.getElementById("share-text-area").value);
    window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
  });

  /* ─── REINICIAR ─── */
  document.getElementById("btn-reset-tournament").addEventListener("click", () => {
    if (confirm("Tem certeza? Todo o progresso do torneio atual será perdido.")) {
      sm.resetTournament();
      ui.goToSelection();
    }
  });
});
