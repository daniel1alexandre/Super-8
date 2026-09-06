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
    sm.setSelection(ui._selectedCategory, ui._selectedFormat);
    ui.showScreen("app");
    ui.updateAppHeader();
    ui.renderPlayersSetup();
    ui.updateHeaderProgress();
    ui.switchTab("setup");
  });

  /* ─── ABAS ─── */
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", e => ui.switchTab(e.currentTarget.dataset.tab));
  });

  /* ─── VOLTAR À SELEÇÃO ─── */
  document.getElementById("btn-back-selection").addEventListener("click", () => {
    if (sm.state.started) {
      if (!confirm("Ao voltar, o torneio atual será mantido em rascunho. Deseja continuar?")) return;
    }
    sm.state.phase = "selection";
    sm.saveState();
    ui.showScreen("selection");
    ui.renderCategoryCards();
    const stepFmt = document.getElementById("step-format");
    stepFmt.classList.add("sel-hidden");
    document.getElementById("sel-cta").classList.add("sel-hidden");
    document.querySelectorAll(".sel-category-card").forEach(c => c.classList.remove("selected"));
    document.querySelectorAll(".sel-format-card").forEach(c => c.classList.remove("selected"));
  });

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
      ui.showScreen("selection");
      ui.renderCategoryCards();
      document.getElementById("step-format").classList.add("sel-hidden");
      document.getElementById("sel-cta").classList.add("sel-hidden");
    }
  });
});
