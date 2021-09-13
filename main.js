const splitTemplate = (index, delta) => `
        <div class="split">
          <div class="index">#${index + 1}</div>
          <span class="tile">${delta}</span>
        </div>
      `;
const historyTemplate = (val, delta) => `
        <div class="history" onclick="_handleResume(${val})">
          <span class="tile">${delta}</span>
          <span class="label">continue</span>
        </div>
      `;

const historyKey = "@stopper.recents";

const formatNumber = (val, len = 2) => `00000000${val}`.slice(-len);

// States
let isRunning = false;
let delta = 0; // in µs
let _previous = 0;
let splits = [];
let history = [];

// UIS
const _time = document.querySelector("#time");
const _round = document.querySelector("#round");
const _start = document.querySelector("#start");
const _split = document.querySelector("#split");
const _splits = document.querySelector("#splits");
const _history = document.querySelector("#history");
const _reset = document.querySelector("#reset");

const _handleToggle = () => {
  isRunning = !isRunning;
  if (isRunning) _handleStart();
};

const _handleReset = () => {
  history.unshift(delta);
  _handleSaveHistory();
  _handleHistoryUi();
  delta = 0;
  splits = [];
  isRunning = false;
  _handleSplitUi();
  _handleUiUpdate();
};

const _handleResume = (val) => {
  delta = val;
  isRunning = true;
  _handleStart();
};

const _handleStart = () => {
  _previous = window.performance.now();
  _handlePoll();
  _handleSplitUi();
};

const _handlePoll = () => {
  if (isRunning) {
    requestAnimationFrame(_handlePoll);
    _start.children[0].innerText = isRunning ? "Pause" : "Start";
    _start.className = isRunning ? "start running" : "start regular";
    const now = window.performance.now();
    const _delta = now - _previous;
    delta += _delta;
    _previous = now;
    _handleUiUpdate();
  }
};

const _getTimeFormat = (delta) => {
  const ms = delta;
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  return `${formatNumber(Math.floor(hours))}:${formatNumber(
    Math.floor(minutes % 60)
  )}:${formatNumber(Math.floor(seconds % 60))}:${formatNumber(
    Math.floor(ms % 1000)
  )}`;
};

const _handleAddSplit = () => {
  splits.unshift(delta);
  _handleSplitUi();
  _handleUiUpdate();
};

let _lastUpdate;
const _handleUiUpdate = () => {
  const now = Date.now();
  if (_lastUpdate + 20 > now) return;
  _time.innerText = _getTimeFormat(delta);
  _round.innerText = _getTimeFormat(delta - (splits[0] || 0));
  _lastUpdate = now;
};

const _handleSplitUi = () => {
  const reversedSplits = [...splits];
  _splits.innerHTML = reversedSplits
    .reverse()
    .map((split, index) =>
      splitTemplate(
        index,
        _getTimeFormat(split - (reversedSplits[index - 1] || 0))
      )
    )
    .join("");
};
const _handleHistoryUi = () => {
  if (history.length === 0) {
    _history.innerHTML = `<span class="empty">You have no recent timers</span>`;
    return;
  }
  _history.innerHTML = history
    .slice(0, 10)
    .map((history, index) => historyTemplate(history, _getTimeFormat(history)))
    .join("");
};

const _handleLoadHistory = () => {
  history = JSON.parse(localStorage.getItem(historyKey) || "[]");
};
const _handleSaveHistory = () => {
  localStorage.setItem(historyKey, JSON.stringify(history));
};

_handleLoadHistory();
_handleHistoryUi();

_start.addEventListener("click", _handleToggle);
_reset.addEventListener("click", _handleReset);
_split.addEventListener("click", _handleAddSplit);
