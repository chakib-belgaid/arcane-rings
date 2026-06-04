import "./style.css";

type Level = {
  id: string;
  seed: string;
  difficultyName: "easy";
  n: number;
  q: number;
  matrix: number[][];
  initialOffsets: number[];
  solution: number[];
  optimalCost: number;
  showCouplingHints: boolean;
};

type RuntimeState = {
  currentOffsets: number[];
  accumulatedMoves: number[];
  moveHistory: PlayerMove[];
  totalTickMoves: number;
  selectedRing: number | null;
  previewTicks: number;
  hintLayer: number;
  hintCount: number;
  isSolved: boolean;
  inputGate: "none" | "menu" | "coupling" | "win";
};

type PlayerMove = {
  controlRing: number;
  deltaTicks: number;
  affectedDelta: number[];
};

type DragState = {
  controlRing: number;
  startAngle: number;
};

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("Missing app root");
const app: HTMLDivElement = appRoot;

const SEEDED_LEVEL: Level = {
  id: "seeded-acceptance",
  seed: "acceptance-seed",
  difficultyName: "easy",
  n: 4,
  q: 8,
  matrix: [
    [1, 0, 0, 0],
    [1, 1, 0, 0],
    [0, -1, 1, 0],
    [0, 0, 1, 1]
  ],
  initialOffsets: [7, 1, 1, 2],
  solution: [1, -2, -3, 1],
  optimalCost: 7,
  showCouplingHints: true
};

let level: Level = SEEDED_LEVEL;
let state = createRuntimeState(level);
let canvas: HTMLCanvasElement | null = null;
let dragState: DragState | null = null;

renderMenu();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

function createRuntimeState(currentLevel: Level): RuntimeState {
  return {
    currentOffsets: [...currentLevel.initialOffsets],
    accumulatedMoves: Array(currentLevel.n).fill(0),
    moveHistory: [],
    totalTickMoves: 0,
    selectedRing: null,
    previewTicks: 0,
    hintLayer: 0,
    hintCount: 0,
    isSolved: false,
    inputGate: "menu"
  };
}

function renderMenu() {
  app.innerHTML = `
    <main class="menu">
      <section class="menu-panel" aria-label="Main menu">
        <h1>Arcane Rings</h1>
        <button type="button" data-action="open-play">Play</button>
        <button type="button">Daily puzzle</button>
        <button type="button">Difficulty selection</button>
        <button type="button">Image collection</button>
        <button type="button">Settings</button>
      </section>
    </main>
  `;

  app.querySelector<HTMLButtonElement>("[data-action='open-play']")?.addEventListener("click", renderPlayMenu);
}

function renderPlayMenu() {
  app.innerHTML = `
    <main class="menu">
      <section class="menu-panel" aria-label="Play menu">
        <h1>Arcane Rings</h1>
        <button type="button" data-action="start-seeded">Start seeded level</button>
        <label class="seed-form">
          Generator seed
          <input aria-label="Generator seed" value="generated-42" />
        </label>
        <button type="button" data-action="start-generated">Generate level from seed</button>
      </section>
    </main>
  `;

  app.querySelector<HTMLButtonElement>("[data-action='start-seeded']")?.addEventListener("click", () => startLevel("acceptance-seed"));
  app.querySelector<HTMLButtonElement>("[data-action='start-generated']")?.addEventListener("click", () => {
    const seed = app.querySelector<HTMLInputElement>("input[aria-label='Generator seed']")?.value || "generated-42";
    startLevel(seed);
  });
}

function startLevel(seed: string) {
  level = {
    ...SEEDED_LEVEL,
    seed
  };
  state = createRuntimeState(level);
  state.inputGate = "none";
  renderGame();
}

function renderGame() {
  app.innerHTML = `
    <main class="game" data-testid="puzzle-screen">
      <section class="playfield" aria-label="Puzzle playfield">
        <canvas
          class="ring-canvas"
          data-testid="ring-canvas"
          data-ring-count="${level.n}"
          data-ticks="${level.q}"
          aria-label="Circular ring puzzle"
        ></canvas>
      </section>
      <nav class="hud" data-testid="hud" aria-label="Puzzle status">
        <button type="button" data-action="undo" aria-label="Undo">Undo</button>
        <button type="button" data-action="menu" aria-label="Menu">Menu</button>
      </nav>
      <aside class="side-actions" data-testid="side-actions" aria-label="Puzzle actions">
        <button type="button" data-action="hint" aria-label="Hint">Hint</button>
        <button type="button" data-action="coupling" aria-label="Coupling map">Map</button>
      </aside>
      <section class="status-strip" aria-label="Debug acceptance state">
        <span>Seed <b data-testid="level-seed">${level.seed}</b></span>
        <span>Difficulty <b data-testid="difficulty-badge">${level.difficultyName}</b></span>
        <span>Selected <b data-testid="selected-ring">${selectedRingText()}</b></span>
        <span>Preview <b data-testid="preview-ticks">${state.previewTicks}</b></span>
        <span>Affected <b data-testid="affected-rings">${affectedRingText()}</b></span>
        <span>Offsets <b data-testid="offsets">${state.currentOffsets.join(",")}</b></span>
      </section>
      ${hintMarkup()}
      ${state.inputGate === "coupling" ? couplingMapMarkup() : ""}
      ${state.inputGate === "win" ? winMarkup() : ""}
    </main>
  `;

  canvas = app.querySelector<HTMLCanvasElement>("[data-testid='ring-canvas']");
  canvas?.addEventListener("pointerdown", onPointerDown);
  canvas?.addEventListener("pointermove", onPointerMove);
  canvas?.addEventListener("pointerup", onPointerUp);
  canvas?.addEventListener("pointercancel", clearPreview);
  window.addEventListener("blur", clearPreview, { once: true });

  app.querySelector<HTMLButtonElement>("[data-action='undo']")?.addEventListener("click", undoLastMove);
  app.querySelector<HTMLButtonElement>("[data-action='menu']")?.addEventListener("click", renderMenu);
  app.querySelector<HTMLButtonElement>("[data-action='hint']")?.addEventListener("click", advanceHint);
  app.querySelector<HTMLButtonElement>("[data-action='coupling']")?.addEventListener("click", openCouplingMap);
  app.querySelector<HTMLButtonElement>("[data-action='close-coupling']")?.addEventListener("click", closeCouplingMap);
  app.querySelector<HTMLButtonElement>("[data-action='next-level']")?.addEventListener("click", () => startLevel("generated-next"));

  resizeAndDraw();
}

function hintMarkup() {
  if (state.hintLayer === 0) return "";
  return `<aside class="hint-panel" data-testid="hint-panel">${hintText()}</aside>`;
}

function couplingMapMarkup() {
  return `
    <div class="drawer-backdrop">
      <section class="drawer" role="dialog" aria-modal="true" aria-label="Coupling map">
        <h2>Coupling map</h2>
        <ul>
          <li>Ring 1 -> Ring 2 x1</li>
          <li>Ring 2 -> Ring 3 x-1</li>
          <li>Ring 3 -> Ring 4 x1</li>
        </ul>
        <button type="button" data-action="close-coupling" aria-label="Close coupling map">Close</button>
      </section>
    </div>
  `;
}

function winMarkup() {
  return `
    <div class="win-backdrop">
      <section class="win" role="dialog" aria-modal="true" aria-label="Level complete">
        <h2>Level complete</h2>
        <dl>
          <div><dt>Stars</dt><dd data-testid="win-stars">3 stars</dd></div>
          <div><dt>Player tick cost</dt><dd data-testid="win-move-count">${state.totalTickMoves} player ticks</dd></div>
          <div><dt>Optimal tick cost</dt><dd data-testid="win-optimal-cost">${level.optimalCost} optimal ticks</dd></div>
          <div><dt>Hints</dt><dd data-testid="win-hints">${state.hintCount} hints used</dd></div>
          <div><dt>Difficulty</dt><dd>F 3 / T ${level.optimalCost}</dd></div>
        </dl>
        <button type="button" data-action="next-level" aria-label="Next level">Next level</button>
        <button type="button" data-action="menu" aria-label="Menu">Menu</button>
      </section>
    </div>
  `;
}

function resizeAndDraw() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  drawCanvas();
}

function drawCanvas() {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const width = canvas.width;
  const height = canvas.height;
  const radius = Math.min(width, height) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const offsets = state.previewTicks === 0 || state.selectedRing === null
    ? state.currentOffsets
    : computePreviewOffsets(state.currentOffsets, level.matrix, state.selectedRing, state.previewTicks, level.q);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#10131d";
  context.fillRect(0, 0, width, height);

  for (let i = level.n - 1; i >= 0; i -= 1) {
    const outer = radius * ((i + 1) / level.n);
    const inner = radius * (i / level.n);
    context.save();
    context.beginPath();
    context.arc(cx, cy, outer, 0, Math.PI * 2);
    context.arc(cx, cy, inner, 0, Math.PI * 2, true);
    context.clip("evenodd");

    context.translate(cx, cy);
    context.rotate((offsets[i] * Math.PI * 2) / level.q);
    const gradient = context.createLinearGradient(-radius, -radius, radius, radius);
    gradient.addColorStop(0, "#293b56");
    gradient.addColorStop(0.45, i % 2 === 0 ? "#7b6ea3" : "#486d8e");
    gradient.addColorStop(1, "#e2b76b");
    context.fillStyle = gradient;
    context.fillRect(-radius, -radius, radius * 2, radius * 2);

    context.strokeStyle = "rgba(255, 239, 187, 0.34)";
    context.lineWidth = Math.max(2, width * 0.004);
    context.beginPath();
    context.moveTo(-radius, 0);
    context.lineTo(radius, 0);
    context.moveTo(0, -radius);
    context.lineTo(0, radius);
    context.stroke();
    context.restore();

    context.strokeStyle = ringStrokeFor(i);
    context.lineWidth = Math.max(2, width * 0.006);
    context.beginPath();
    context.arc(cx, cy, outer, 0, Math.PI * 2);
    context.stroke();
  }
}

function ringStrokeFor(index: number) {
  if (state.selectedRing === index) return "#ffe2a6";
  if (state.selectedRing !== null && level.matrix[index][state.selectedRing] !== 0) return "rgba(140, 190, 255, 0.88)";
  return "rgba(226, 236, 255, 0.28)";
}

function onPointerDown(event: PointerEvent) {
  if (!canvas || state.inputGate !== "none") return;
  const ring = findRingFromPoint(event);
  if (ring === null) return;

  canvas.setPointerCapture(event.pointerId);
  dragState = {
    controlRing: ring,
    startAngle: angleOfPointer(event)
  };
  state.selectedRing = ring;
  state.previewTicks = 0;
  refreshRuntimeDom();
}

function onPointerMove(event: PointerEvent) {
  if (!dragState || state.inputGate !== "none") return;
  const delta = unwrapAngleDelta(dragState.startAngle, angleOfPointer(event));
  state.previewTicks = angleDeltaToTicks(delta, level.q);
  refreshRuntimeDom();
}

function onPointerUp() {
  if (!dragState || state.inputGate !== "none") return;
  if (state.previewTicks !== 0) {
    applyPlayerMove(dragState.controlRing, state.previewTicks);
  }
  dragState = null;
  state.selectedRing = null;
  state.previewTicks = 0;
  if (state.isSolved) state.inputGate = "win";
  renderGame();
}

function clearPreview() {
  if (!dragState) return;
  dragState = null;
  state.selectedRing = null;
  state.previewTicks = 0;
  refreshRuntimeDom();
}

function refreshRuntimeDom() {
  const selected = app.querySelector<HTMLElement>("[data-testid='selected-ring']");
  const preview = app.querySelector<HTMLElement>("[data-testid='preview-ticks']");
  const affected = app.querySelector<HTMLElement>("[data-testid='affected-rings']");
  const offsets = app.querySelector<HTMLElement>("[data-testid='offsets']");

  if (selected) selected.textContent = selectedRingText();
  if (preview) preview.textContent = String(state.previewTicks);
  if (affected) affected.textContent = affectedRingText();
  if (offsets) offsets.textContent = state.currentOffsets.join(",");
  drawCanvas();
}

function findRingFromPoint(event: PointerEvent) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = event.clientX - cx;
  const dy = event.clientY - cy;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = Math.min(rect.width, rect.height) / 2;
  if (radius > maxRadius) return null;
  return Math.min(level.n - 1, Math.floor((radius / maxRadius) * level.n));
}

function angleOfPointer(event: PointerEvent) {
  if (!canvas) return 0;
  const rect = canvas.getBoundingClientRect();
  return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
}

function unwrapAngleDelta(startAngle: number, currentAngle: number) {
  let delta = currentAngle - startAngle;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  return delta;
}

function angleDeltaToTicks(deltaAngle: number, q: number) {
  const tickAngle = (2 * Math.PI) / q;
  return Math.round(deltaAngle / tickAngle);
}

function computePreviewOffsets(currentOffsets: number[], matrix: number[][], controlRing: number, previewTicks: number, q: number) {
  return currentOffsets.map((offset, i) => modNorm(offset + matrix[i][controlRing] * previewTicks, q));
}

function applyPlayerMove(controlRing: number, deltaTicks: number) {
  const affectedDelta = level.matrix.map((row) => modNorm(row[controlRing] * deltaTicks, level.q));
  state.currentOffsets = computePreviewOffsets(state.currentOffsets, level.matrix, controlRing, deltaTicks, level.q);
  state.accumulatedMoves[controlRing] = modNorm(state.accumulatedMoves[controlRing] + deltaTicks, level.q);
  state.moveHistory.push({ controlRing, deltaTicks, affectedDelta });
  state.totalTickMoves += Math.abs(deltaTicks);
  state.isSolved = state.currentOffsets.every((offset) => modNorm(offset, level.q) === 0);
}

function undoLastMove() {
  const move = state.moveHistory.pop();
  if (!move) return;
  state.currentOffsets = computePreviewOffsets(state.currentOffsets, level.matrix, move.controlRing, -move.deltaTicks, level.q);
  state.accumulatedMoves[move.controlRing] = modNorm(state.accumulatedMoves[move.controlRing] - move.deltaTicks, level.q);
  state.totalTickMoves -= Math.abs(move.deltaTicks);
  state.isSolved = false;
  renderGame();
}

function advanceHint() {
  state.hintLayer = Math.min(3, state.hintLayer + 1);
  state.hintCount += 1;
  renderGame();
}

function openCouplingMap() {
  clearPreview();
  state.inputGate = "coupling";
  renderGame();
}

function closeCouplingMap() {
  state.inputGate = "none";
  renderGame();
}

function hintText() {
  const ring = strongestRemainingRing();
  if (state.hintLayer === 1) return `Focus Ring ${ring + 1}`;
  if (state.hintLayer === 2) return `Ring ${ring + 1} still needs adjustment`;
  return `Ring ${ring + 1} ${signedMoveText(remainingForRing(ring))}`;
}

function strongestRemainingRing() {
  let bestRing = 0;
  let bestDistance = -1;
  for (let i = 0; i < level.n; i += 1) {
    const distance = cyclicDistance(remainingForRing(i), level.q);
    if (distance > bestDistance) {
      bestRing = i;
      bestDistance = distance;
    }
  }
  return bestRing;
}

function remainingForRing(index: number) {
  return modNorm(level.solution[index] - state.accumulatedMoves[index], level.q);
}

function signedMoveText(value: number) {
  const clockwise = modNorm(value, level.q);
  const counterclockwise = clockwise - level.q;
  if (clockwise <= Math.abs(counterclockwise)) return `clockwise ${clockwise} ticks`;
  return `counterclockwise ${Math.abs(counterclockwise)} ticks`;
}

function selectedRingText() {
  return state.selectedRing === null ? "None" : `Ring ${state.selectedRing + 1}`;
}

function affectedRingText() {
  if (state.selectedRing === null) return "None";
  return level.matrix
    .map((row, index) => (row[state.selectedRing ?? 0] === 0 ? null : `R${index + 1}`))
    .filter(Boolean)
    .join(", ");
}

function modNorm(value: number, q: number) {
  return ((value % q) + q) % q;
}

function cyclicDistance(value: number, q: number) {
  const normalized = modNorm(value, q);
  return Math.min(normalized, q - normalized);
}

window.addEventListener("resize", resizeAndDraw);
