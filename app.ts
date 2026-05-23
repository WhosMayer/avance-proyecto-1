// Proyecto 1 — Simulación del péndulo simple no lineal — TypeScript
const g = 9.81;

// ─── Utilidades matemáticas ────────────────────────────────

/** Aproxima sin(x) con n términos de Taylor: sin(x) = x − x³/3! + x⁵/5! − … */
function sinTaylor(x: number, n: number): number {
  let sum = 0, term = x;
  for (let k = 0; k < n; k++) {
    sum += (k % 2 === 0 ? 1 : -1) * term;
    term *= x * x / ((2 * k + 2) * (2 * k + 3));
  }
  return sum;
}

/** Solución analítica: aproximación de ángulo pequeño */
const analitica = (θ0: number, L: number, t: number) => θ0 * Math.cos(Math.sqrt(g / L) * t);

// ─── Métricas de error ─────────────────────────────────────

const errAbs   = (v: number, a: number) => Math.abs(v - a);
const errRelP  = (v: number, a: number) => Math.abs(v) < 1e-15 ? 0 : (Math.abs(v - a) / Math.abs(v)) * 100;
const errAprxP = (act: number, ant: number) => Math.abs(act) < 1e-15 ? 0 : (Math.abs(act - ant) / Math.abs(act)) * 100;
const tolCS    = (c: number) => 0.5 * Math.pow(10, 2 - c);

// ─── Tipos ─────────────────────────────────────────────────

interface PuntoSim {
  t: number; theta: number; omega: number;
  thetaAnal: number; sinAprox: number; sinExacto: number;
  errSin: number; errTheta: number; errRel: number; errAprox: number;
}
interface PuntoRK4    { t: number; theta: number; thetaAnal: number; errAbs: number; }
interface AnalisisPaso { h: number; pasos: number; errMax: number; errFinal: number; }

// ─── Euler explícito ───────────────────────────────────────

function eulerPendulo(θ0: number, ω0: number, L: number, hMuestra: number, tTotal: number, n: number): PuntoSim[] {
  const H = 0.01, datos: PuntoSim[] = [];
  let θ = θ0, ω = ω0, t = 0, θPrev = θ0;

  for (let tM = 0; tM <= tTotal + 1e-9; tM += hMuestra) {
    while (t < tM - 1e-9) { θ += H * ω; ω += H * (-(g / L) * sinTaylor(θ, n)); t += H; }

    const sA = sinTaylor(θ, n), sE = Math.sin(θ), tA = analitica(θ0, L, tM);
    datos.push({
      t: tM, theta: θ, omega: ω, thetaAnal: tA, sinAprox: sA, sinExacto: sE,
      errSin: errAbs(sE, sA), errTheta: errAbs(tA, θ),
      errRel: errRelP(tA, θ), errAprox: datos.length === 0 ? 0 : errAprxP(θ, θPrev),
    });
    θPrev = θ;
  }
  return datos;
}

// ─── Runge-Kutta 4 ─────────────────────────────────────────

function rk4Pendulo(θ0: number, ω0: number, L: number, h: number, tTotal: number): PuntoRK4[] {
  const f = (th: number, om: number): [number, number] => [om, -(g / L) * Math.sin(th)];
  const datos: PuntoRK4[] = [];
  let θ = θ0, ω = ω0;

  for (let i = 0; i <= Math.round(tTotal / h); i++) {
    const t = i * h;
    datos.push({ t, theta: θ, thetaAnal: analitica(θ0, L, t), errAbs: errAbs(analitica(θ0, L, t), θ) });
    const [k1t, k1w] = f(θ,           ω);
    const [k2t, k2w] = f(θ + h/2*k1t, ω + h/2*k1w);
    const [k3t, k3w] = f(θ + h/2*k2t, ω + h/2*k2w);
    const [k4t, k4w] = f(θ + h*k3t,   ω + h*k3w);
    θ += h/6 * (k1t + 2*k2t + 2*k3t + k4t);
    ω += h/6 * (k1w + 2*k2w + 2*k3w + k4w);
  }
  return datos;
}

// ─── Análisis de convergencia ──────────────────────────────

function analisisPasos(θ0: number, ω0: number, L: number, n: number): AnalisisPaso[] {
  return [0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001].map(h => {
    let θ = θ0, ω = ω0;
    const errs = Array.from({ length: Math.round(5 / h) + 1 }, (_, i) => {
      const e = errAbs(analitica(θ0, L, i * h), θ);
      θ += h * ω; ω += h * (-(g / L) * sinTaylor(θ, n));
      return e;
    });
    return { h, pasos: errs.length, errMax: Math.max(...errs), errFinal: errs[errs.length - 1] };
  });
}

// ─── Muestreo ──────────────────────────────────────────────

function muestrear<T>(arr: T[], max = 300): T[] {
  if (arr.length <= max) return arr;
  const step = Math.floor(arr.length / max);
  return arr.filter((_, i) => i % step === 0);
}

// ─── Gráficas (Chart.js) ──────────────────────────────────

declare const Chart: any;
const charts: Record<string, any> = {};

const ds = (data: number[], color: string, extra: object = {}) =>
  ({ data, borderColor: color, borderWidth: 1.8, tension: 0.2, ...extra });

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  elements: { point: { radius: 0 } },
  scales: {
    x: { grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280', font: { size: 10 }, maxTicksLimit: 10 } },
    y: { grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280', font: { size: 10 } } },
  },
};

function plot(id: string, labels: (string | number)[], datasets: object[], opts: object = {}): void {
  if (charts[id]) charts[id].destroy();
  const cv = document.getElementById(id) as HTMLCanvasElement;
  if (!cv) return;
  charts[id] = new Chart(cv, { type: 'line', data: { labels, datasets }, options: { ...CHART_OPTS, ...opts } });
}

const fillRed = { fill: true, backgroundColor: 'rgba(220,38,38,.07)' };
const dotStyle = (c: string) => ({ borderWidth: 2, pointRadius: 5, pointBackgroundColor: c, tension: 0 });

function renderGraficas(e: PuntoSim[], r: PuntoRK4[]): void {
  const em = muestrear(e), rm = muestrear(r), L = em.map(p => p.t.toFixed(2));

  plot('gTheta', L, [
    ds(em.map(p => +p.theta.toFixed(6)), '#0f766e'),
    ds(em.map(p => +p.thetaAnal.toFixed(6)), '#d97706', { borderWidth: 1.5, borderDash: [5, 3] }),
  ]);
  plot('gOmega', L, [ds(em.map(p => +p.omega.toFixed(6)), '#7c3aed')]);
  plot('gError', L, [ds(em.map(p => +p.errTheta.toFixed(10)), '#dc2626', { borderWidth: 1.5, ...fillRed })]);
  plot('gCompar', L, [
    ds(em.map(p => +p.theta.toFixed(6)), '#0f766e'),
    ds(rm.map(p => +p.theta.toFixed(6)), '#2563eb'),
    ds(em.map(p => +p.thetaAnal.toFixed(6)), '#d97706', { borderWidth: 1.5, borderDash: [5, 3] }),
  ]);
  plot('gErrComp', L, [
    ds(em.map(p => +p.errTheta.toFixed(10)), '#dc2626', { borderWidth: 1.5 }),
    ds(rm.map(p => +p.errAbs.toFixed(10)), '#2563eb', { borderWidth: 1.5 }),
  ]);
}

function renderPasoGrafica(d: AnalisisPaso[]): void {
  plot('gPasoErr', d.map(x => x.h.toString()), [
    { data: d.map(x => x.errMax),   borderColor: '#dc2626', ...dotStyle('#dc2626') },
    { data: d.map(x => x.errFinal), borderColor: '#d97706', ...dotStyle('#d97706') },
  ]);
}

function renderTaylorGrafica(): void {
  const xV = parseFloat((document.getElementById('taylorX') as HTMLInputElement)?.value || '1.2');
  const exact = Math.sin(xV);
  const filas = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1, aprox = sinTaylor(xV, n);
    return { n, aprox, error: errAbs(exact, aprox) };
  });

  plot('gTaylor', filas.map(r => r.n), [{
    data: filas.map(r => r.error), borderColor: '#dc2626', ...dotStyle('#dc2626'), ...fillRed,
  }]);

  const tb = document.getElementById('tbodyTaylor') as HTMLTableSectionElement;
  if (tb) tb.innerHTML = filas.map(({ n, aprox, error }) => {
    const cls = error < 1e-8 ? 'ok' : error < 0.001 ? 'warn' : 'err';
    return `<tr><td>${n}</td><td class="mono">${aprox.toFixed(10)}</td>
      <td class="mono">${exact.toFixed(10)}</td><td class="mono ${cls}">${error.toExponential(4)}</td></tr>`;
  }).join('');
}

// ─── Demo redondeo ─────────────────────────────────────────

function demoRedondeo(): void {
  const ejemplos = [
    { expr: '0.1 + 0.2', res: 0.1 + 0.2, esp: 0.3 },
    { expr: '0.1 × 10',  res: 0.1 * 10,  esp: 1.0 },
    { expr: '1/3 × 3',   res: (1/3) * 3,  esp: 1.0 },
    { expr: '√2 × √2',   res: Math.sqrt(2) ** 2, esp: 2.0 },
    { expr: '0.7 + 0.1', res: 0.7 + 0.1, esp: 0.8 },
  ];

  const tb = document.getElementById('tbodyRedondeo') as HTMLTableSectionElement;
  if (tb) tb.innerHTML = ejemplos.map(({ expr, res, esp }) => {
    const err = errAbs(esp, res);
    return `<tr><td>${expr}</td><td class="mono">${res.toPrecision(16)}</td>
      <td class="mono">${esp}</td><td class="mono ${err > 0 ? 'err' : ''}">${err > 0 ? err.toExponential(4) : '0 (exacto)'}</td></tr>`;
  }).join('');

  let s = 0;
  const acum = Array.from({ length: 100 }, (_, i) => { s += 0.1; return { iter: i + 1, error: errAbs((i + 1) * 0.1, s) }; });

  const inf = document.getElementById('acumInfo');
  if (inf) {
    const u = acum[99];
    inf.innerHTML = `Resultado computado: <code>${(u.iter * 0.1 + u.error).toPrecision(16)}</code> &nbsp;|&nbsp; Esperado: <code>10.0</code> &nbsp;|&nbsp; Error: <code class="err">${u.error.toExponential(4)}</code>`;
  }

  plot('gRedondeo', acum.map(x => x.iter), [ds(acum.map(x => x.error), '#dc2626', { borderWidth: 1.5, ...fillRed })]);
}

// ─── Tablas ────────────────────────────────────────────────

function llenarTabla(d: PuntoSim[]): void {
  const tb = document.getElementById('tbody') as HTMLTableSectionElement;
  if (!tb) return;
  tb.innerHTML = muestrear(d, 80).map(p => {
    const cls = p.errTheta > 0.1 ? 'err' : p.errTheta > 0.01 ? 'warn' : '';
    return `<tr><td>${p.t.toFixed(3)}</td><td class="mono">${p.theta.toFixed(6)}</td>
      <td class="mono">${p.omega.toFixed(6)}</td><td class="mono">${p.thetaAnal.toFixed(6)}</td>
      <td class="mono ${cls}">${p.errTheta.toExponential(4)}</td><td class="mono">${p.errRel.toFixed(4)}</td>
      <td class="mono">${p.errAprox.toFixed(4)}</td></tr>`;
  }).join('');
}

function llenarTablaPasos(d: AnalisisPaso[]): void {
  const tb = document.getElementById('tbodyPasos') as HTMLTableSectionElement;
  if (!tb) return;
  tb.innerHTML = d.map(r =>
    `<tr><td>${r.h}</td><td>${r.pasos}</td><td class="mono">${r.errMax.toExponential(4)}</td>
      <td class="mono">${r.errFinal.toExponential(4)}</td></tr>`
  ).join('');
}

// ─── Stats resumen ─────────────────────────────────────────

function mostrarStats(d: PuntoSim[], p: { theta0: number; L: number; h: number; n: number }): void {
  const box = document.getElementById('statsBox');
  if (!box) return;
  const errs = d.map(x => x.errTheta), T = 2 * Math.PI * Math.sqrt(p.L / g);
  const items: [string, string | number][] = [
    ['Iteraciones', d.length], ['Error máximo', Math.max(...errs).toExponential(3)],
    ['Error final', errs[errs.length - 1].toExponential(3)], ['Período ≈', T.toFixed(4) + ' s'],
    ['Tolerancia (4 c.s.)', tolCS(4).toFixed(4) + ' %'], ['Términos Taylor n', p.n],
  ];
  box.innerHTML = items.map(([l, v]) => `<div class="si"><span class="sl">${l}</span><span class="sv">${v}</span></div>`).join('');
}

// ─── Pestañas ──────────────────────────────────────────────

function initTabs(): void {
  document.querySelectorAll<HTMLElement>('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tab!;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(t)?.classList.add('active');
    });
  });
}

// ─── Main ──────────────────────────────────────────────────

function simular(): void {
  const get = (id: string) => Number((document.getElementById(id) as HTMLInputElement).value);
  const [θ0, ω0, L, h, tT, n] = ['theta0', 'omega0', 'L', 'h', 'tTotal', 'nTaylor'].map(get);

  if (h <= 0 || h > 1) { alert('Usa un paso h entre 0.001 y 1.'); return; }

  const ed = eulerPendulo(θ0, ω0, L, h, tT, n);
  const rd = rk4Pendulo(θ0, ω0, L, h, tT);
  const pd = analisisPasos(θ0, ω0, L, n);

  mostrarStats(ed, { theta0: θ0, L, h, n });
  llenarTabla(ed);
  llenarTablaPasos(pd);
  renderGraficas(ed, rd);
  renderPasoGrafica(pd);
  demoRedondeo();
  renderTaylorGrafica();

  const out = document.getElementById('output');
  if (out) out.textContent = `✔ Simulación ejecutada — ${ed.length} pasos, h=${h}, n_Taylor=${n}`;
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  document.getElementById('runBtn')!.addEventListener('click', simular);
  document.getElementById('taylorX')?.addEventListener('input', renderTaylorGrafica);
  simular();
});
