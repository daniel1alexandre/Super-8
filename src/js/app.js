/**
 * SUPER BEACH TENNIS - APP PRINCIPAL
 */
document.addEventListener("DOMContentLoaded", () => {
  const sm = new TournamentStateManager();
  const ui = new TournamentUI(sm);

  ui.init();

  /* ─── TELA DE SELEÇÃO: CRIAR NOVO TORNEIO ─── */

  document.getElementById("btn-proceed-setup").addEventListener("click", () => {
    if (!ui._selectedCategory || !ui._selectedFormat) return;

    const titleInput = document.getElementById("input-tournament-title");
    const titleVal = titleInput ? titleInput.value.trim() : "";
    if (!titleVal) {
      const err = document.getElementById("title-error-msg");
      if (err) err.style.display = "block";
      if (titleInput) {
        titleInput.classList.add("input-error");
        titleInput.focus();
        titleInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      ui.showToast("⚠️ O título do torneio é obrigatório!");
      return;
    }

    const newTourn = sm.createTournament(ui._selectedCategory, ui._selectedFormat, titleVal, ui._selectedGender);
    if (newTourn) {
      ui.openTournament(newTourn.id);
      ui.showToast("✨ Torneio \"" + newTourn.title + "\" criado com sucesso!");
    }
  });

  /* ─── BOTÃO "+ NOVO TORNEIO" ─── */
  const btnCreateAnother = document.getElementById("btn-create-another-tournament");
  if (btnCreateAnother) {
    btnCreateAnother.addEventListener("click", () => {
      const stepCat = document.getElementById("step-category");
      if (stepCat) stepCat.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const btnHeaderNew = document.getElementById("btn-header-new-tournament");
  if (btnHeaderNew) {
    btnHeaderNew.addEventListener("click", () => {
      ui.goToSelection();
      const stepCat = document.getElementById("step-category");
      if (stepCat) stepCat.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ─── SELETOR DE TORNEIOS NO HEADER ─── */
  const selectSwitcher = document.getElementById("select-tournament-switcher");
  if (selectSwitcher) {
    selectSwitcher.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      if (selectedId) {
        ui.openTournament(selectedId);
      }
    });
  }

  /* ─── CONTINUAR TORNEIO (BANNER LEGADO NA SELEÇÃO) ─── */
  const btnResume = document.getElementById("btn-resume-tournament");
  if (btnResume) {
    btnResume.addEventListener("click", () => {
      const active = sm.getActiveTournament();
      if (active) {
        ui.openTournament(active.id);
      } else {
        ui.goToSelection();
      }
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

    if (fmt.isMixed) {
      // Mistas: preencher homens e mulheres separadamente
      const demosM = cat.demoNamesM || [];
      const demosF = cat.demoNamesF || [];
      document.querySelectorAll(".player-name-input[data-gender='m']").forEach((inp, i) => {
        inp.value = demosM[i] || ("Homem " + (i + 1));
        const idx = parseInt(inp.dataset.index);
        if (sm.state.players[idx]) sm.state.players[idx].name = inp.value;
      });
      document.querySelectorAll(".player-name-input[data-gender='f']").forEach((inp, i) => {
        inp.value = demosF[i] || ("Mulher " + (i + 1));
        const idx = parseInt(inp.dataset.index);
        if (sm.state.players[idx]) sm.state.players[idx].name = inp.value;
      });
      sm.saveState();
    } else {
      const isFem = sm.state.gender === 'feminino';
      const demoPool = (isFem && cat.demoNamesF) ? cat.demoNamesF : (cat.demoNames || []);
      const demos = demoPool.slice(0, fmt.players);
      const fallbackLabel = isFem ? (cat.id === 'duplas' ? 'Dupla' : 'Atleta') : (cat.playerLabel || 'Jogador');
      document.querySelectorAll(".player-name-input").forEach((inp, i) => {
        inp.value = demos[i] || (fallbackLabel + " " + (i + 1));
        const idx = parseInt(inp.dataset.index);
        if (sm.state.players[idx]) sm.state.players[idx].name = inp.value;
      });
      sm.saveState();
    }
  });

  /* ─── SALVAR NOMES AO DIGITAR ─── */
  document.getElementById("players-input-grid").addEventListener("input", e => {
    if (e.target.classList.contains("player-name-input")) {
      const idx = parseInt(e.target.dataset.index);
      if (sm.state.players[idx] !== undefined) {
        sm.state.players[idx].name = e.target.value;
        sm.saveState();
      }
    }
  });

  /* ─── INICIAR TORNEIO ─── */
  document.getElementById("btn-start-tournament").addEventListener("click", () => {
    const inputs = document.querySelectorAll(".player-name-input");
    const { CATEGORIES, TOURNAMENT_FORMATS } = window.TournamentConfig;
    const cat = CATEGORIES.find(c => c.id === sm.state.category) || {};
    const fmt = TOURNAMENT_FORMATS[sm.state.format] || {};
    const label = cat.playerLabel || "Jogador";

    // Preservar gênero e id dos jogadores existentes (Mistas)
    const playersList = [];
    inputs.forEach((inp) => {
      const idx    = parseInt(inp.dataset.index);
      const id     = inp.dataset.id     || (sm.state.players[idx] && sm.state.players[idx].id) || ('p' + (idx + 1));
      const gender = inp.dataset.gender || (sm.state.players[idx] && sm.state.players[idx].gender) || null;
      const num    = id ? id.replace(/[a-z]/gi, '') : (idx + 1);
      const name   = inp.value.trim() || (gender === 'm' ? 'Homem ' + num : gender === 'f' ? 'Mulher ' + num : label + ' ' + (idx + 1));
      playersList.push({ id, name, gender });
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

  /* ─── MODAL E AÇÕES: CANCELAR / EXCLUIR TORNEIO ─── */
  const modalDelete = document.getElementById("modal-confirm-delete");
  const btnCloseDeleteModal = document.getElementById("btn-close-delete-modal");
  const btnAbortDelete = document.getElementById("btn-abort-delete");
  const btnExecuteDelete = document.getElementById("btn-execute-delete");
  let tournamentIdToDelete = null;

  function openDeleteModal(id = null, title = '') {
    tournamentIdToDelete = id || (sm.data ? sm.data.activeTournamentId : null);
    const active = id ? sm.getTournaments().find(t => t.id === id) : sm.getActiveTournament();
    const modalText = document.querySelector("#modal-confirm-delete .modal-warning-text");
    if (modalText) {
      const tournName = title || (active ? active.title : "este torneio");
      modalText.textContent = `Deseja realmente cancelar e excluir "${tournName}"?`;
    }

    if (modalDelete) {
      modalDelete.style.display = "flex";
    } else if (confirm("Deseja realmente cancelar e excluir este torneio? Todos os dados serão apagados.")) {
      executeDeleteTournament();
    }
  }

  window.handleDeleteTournamentRequest = (id, title) => {
    openDeleteModal(id, title);
  };

  function closeDeleteModal() {
    if (modalDelete) modalDelete.style.display = "none";
    tournamentIdToDelete = null;
  }

  function executeDeleteTournament() {
    const id = tournamentIdToDelete || (sm.data ? sm.data.activeTournamentId : null);
    closeDeleteModal();

    if (id) {
      sm.deleteTournament(id);
    } else {
      sm.resetTournament();
    }

    const remaining = sm.getTournaments();
    const isAppScreenActive = !document.getElementById("screen-app").classList.contains("sel-hidden");

    if (isAppScreenActive) {
      if (remaining.length > 0 && sm.getActiveTournament()) {
        ui.openTournament(sm.data.activeTournamentId);
      } else {
        ui.goToSelection();
      }
    } else {
      ui.renderActiveTournamentsList();
      ui.updateActiveTournamentBanner();
    }

    ui.showToast("🗑️ Torneio excluído com sucesso!");
  }

  if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener("click", closeDeleteModal);
  if (btnAbortDelete) btnAbortDelete.addEventListener("click", closeDeleteModal);
  if (btnExecuteDelete) btnExecuteDelete.addEventListener("click", executeDeleteTournament);

  if (modalDelete) {
    modalDelete.addEventListener("click", (e) => {
      if (e.target === modalDelete) closeDeleteModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDeleteModal();
      if (modalShare) modalShare.style.display = "none";
    }
  });

  // Vincular em todos os botões de Cancelar / Excluir Torneio:
  const deleteBtnSelectors = [
    "#btn-cancel-tournament",
    "#btn-reset-tournament",
    "#btn-cancel-setup",
    "#btn-delete-banner-tournament"
  ];

  deleteBtnSelectors.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openDeleteModal();
      });
    }
  });
});
