let calcHidden = true;
const calcContainer = document.getElementById("calcContainer");
const btnCalcShow = document.getElementById("btnCalcShow");

function showHideCalc(){
  calcHidden = !calcHidden;
  if(calcHidden){
    btnCalcShow.innerHTML = "Show";
    calcContainer.classList.add("d-none");
  } else {
    btnCalcShow.innerHTML = "Hide";
    calcContainer.classList.remove("d-none");
  }
}

const catchCalculatorState = {
  captureRate: null,
  pokemonTypes: [],
};

const CATCH_STATUS_OPTIONS = [
  { value: "none", label: "Normal", bonus: 1 },
  { value: "sleep", label: "Sleep", bonus: 2.5 },
  { value: "freeze", label: "Freeze", bonus: 2.5 },
  { value: "paralysis", label: "Paralysis", bonus: 1.5 },
  { value: "burn", label: "Burn", bonus: 1.5 },
  { value: "poison", label: "Poison", bonus: 1.5 },
];

const CATCH_BALL_OPTIONS = [
  { value: "pokeball", label: "Poké Ball" },
  { value: "greatball", label: "Great Ball" },
  { value: "ultraball", label: "Ultra Ball" },
  { value: "masterball", label: "Master Ball" },
  { value: "netball", label: "Net Ball" },
  { value: "diveball", label: "Dive Ball" },
  { value: "nestball", label: "Nest Ball" },
  { value: "repeatball", label: "Repeat Ball" },
  { value: "timerball", label: "Timer Ball" },
  { value: "duskball", label: "Dusk Ball" },
  { value: "quickball", label: "Quick Ball" },
];

function populateCatchCalculatorSelects() {
  const statusSelect = document.getElementById("calcStatus");
  const ballSelect = document.getElementById("calcBall");

  if (!statusSelect || !ballSelect) return;

  statusSelect.innerHTML = `
    <option value="none">Normal</option>
    ${CATCH_STATUS_OPTIONS
      .filter((option) => option.value !== "none")
      .map((option) => `<option value="${option.value}">${option.label}</option>`)
      .join("")}
  `;

  ballSelect.innerHTML = `
    <option value="pokeball">Poké Ball</option>
    ${CATCH_BALL_OPTIONS
      .filter((option) => option.value !== "pokeball")
      .map((option) => `<option value="${option.value}">${option.label}</option>`)
      .join("")}
  `;
}

function getStatusBonus(status) {
  return CATCH_STATUS_OPTIONS.find((item) => item.value === status)?.bonus ?? 1;
}

function getBallBonus(ball, context) {
  const level = Number(context.level) || 1;
  const turns = Number(context.turns) || 1;
  const owned = Boolean(context.owned);
  const environment = context.environment || "normal";
  const pokemonTypes = context.pokemonTypes || [];

  switch (ball) {
    case "pokeball":
      return 1;

    case "greatball":
      return 1.5;

    case "ultraball":
      return 2;

    case "masterball":
      return Infinity;

    case "netball":
      return pokemonTypes.includes("water") || pokemonTypes.includes("bug") ? 3.5 : 1;

    case "diveball":
      return environment === "water" ? 3.5 : 1;

    case "nestball":
      if (level >= 30) return 1;
      return Math.max(1, (41 - level) / 10);

    case "repeatball":
      return owned ? 3.5 : 1;

    case "timerball":
      return Math.min(4, 1 + (turns - 1) * 0.3);

    case "duskball":
      return environment === "cave" || environment === "night" ? 3 : 1;

    case "quickball":
      return turns <= 1 ? 5 : 1;

    default:
      return 1;
  }
}

function calculateCatchChance({
  currentHp,
  maxHp,
  captureRate,
  ballBonus,
  statusBonus,
}) {
  if (!currentHp || !maxHp || !captureRate) return null;
  if (currentHp < 1 || maxHp < 1 || currentHp > maxHp) return null;

  if (ballBonus === Infinity) {
    return 100;
  }

  // Gen III+ style catch formula
  let a = (((3 * maxHp - 2 * currentHp) * captureRate * ballBonus) / (3 * maxHp)) * statusBonus;
  a = Math.floor(a);

  if (a >= 255) {
    return 100;
  }

  const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a));
  const shakeChance = b / 65535;
  const catchChance = Math.pow(shakeChance, 4) * 100;

  return Math.max(0, Math.min(100, catchChance));
}

function formatCatchChance(value) {
  if (value === null || Number.isNaN(value)) return "-%";
  if (value >= 100) return "100%";
  return `${value.toFixed(2)}%`;
}

function updateCatchRateCalculator() {
  const resultEl = document.getElementById("catchRateResult");
  const hpEl = document.getElementById("calcHP");
  const maxHpEl = document.getElementById("calcMaxHP");
  const levelEl = document.getElementById("calcLevel");
  const turnsEl = document.getElementById("calcTurns");
  const statusEl = document.getElementById("calcStatus");
  const ballEl = document.getElementById("calcBall");
  const environmentEl = document.getElementById("calcEnvironment");
  const ownedEl = document.getElementById("calcOwned");

  if (
    !resultEl ||
    !hpEl ||
    !maxHpEl ||
    !levelEl ||
    !turnsEl ||
    !statusEl ||
    !ballEl ||
    !environmentEl ||
    !ownedEl
  ) {
    return;
  }

  if (!catchCalculatorState.captureRate) {
    resultEl.textContent = "-%";
    return;
  }

  const currentHp = Number(hpEl.value);
  const maxHp = Number(maxHpEl.value);
  const level = Number(levelEl.value);
  const turns = Number(turnsEl.value) || 1;
  const status = statusEl.value || "none";
  const ball = ballEl.value || "pokeball";
  const environment = environmentEl.value || "normal";
  const owned = ownedEl.checked;

  if (!currentHp || !maxHp) {
    resultEl.textContent = "-%";
    return;
  }

  const ballBonus = getBallBonus(ball, {
    level,
    turns,
    owned,
    environment,
    pokemonTypes: catchCalculatorState.pokemonTypes,
  });

  const statusBonus = getStatusBonus(status);

  const catchChance = calculateCatchChance({
    currentHp,
    maxHp,
    captureRate: catchCalculatorState.captureRate,
    ballBonus,
    statusBonus,
  });

  resultEl.textContent = formatCatchChance(catchChance);
}

function bindCatchRateCalculatorEvents() {
  [
    "calcHP",
    "calcMaxHP",
    "calcLevel",
    "calcTurns",
    "calcStatus",
    "calcBall",
    "calcEnvironment",
    "calcOwned",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const eventName = el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input";
    el.addEventListener(eventName, updateCatchRateCalculator);
  });
}

function initCatchRateCalculator() {
  populateCatchCalculatorSelects();
  bindCatchRateCalculatorEvents();
  updateCatchRateCalculator();
}

function setCatchCalculatorPokemonData({ species, pokemon }) {
  catchCalculatorState.captureRate = species?.capture_rate ?? null;
  catchCalculatorState.pokemonTypes = pokemon?.types?.map((item) => item.type.name) ?? [];
  updateCatchRateCalculator();
}

document.addEventListener("DOMContentLoaded", initCatchRateCalculator);
