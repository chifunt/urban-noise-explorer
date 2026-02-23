let tooltipEl = null;

function ensureTooltip() {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement("div");
  tooltipEl.id = "chartHoverTooltip";
  tooltipEl.className = "chart-hover-tooltip";
  tooltipEl.style.display = "none";
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export function showHoverTooltip(event, lines) {
  const el = ensureTooltip();
  el.innerHTML = "";
  for (const [idx, line] of lines.entries()) {
    const row = document.createElement("div");
    row.textContent = line;
    if (idx === 0) row.className = "title";
    el.appendChild(row);
  }
  el.style.display = "block";

  const pad = 12;
  const x = event.clientX + 14;
  const y = event.clientY + 14;
  const { innerWidth, innerHeight } = window;
  const { offsetWidth, offsetHeight } = el;
  const left = clamp(x, pad, innerWidth - offsetWidth - pad);
  const top = clamp(y, pad, innerHeight - offsetHeight - pad);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

export function hideHoverTooltip() {
  const el = ensureTooltip();
  el.style.display = "none";
}
