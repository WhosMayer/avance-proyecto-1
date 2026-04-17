const g = 9.81;

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function sinTaylor(x: number, n: number): number {
  let sum = 0;
  for (let k = 0; k < n; k++) {
    const sign = k % 2 === 0 ? 1 : -1;
    sum += sign * Math.pow(x, 2 * k + 1) / factorial(2 * k + 1);
  }
  return sum;
}

function simular(): void {
  const theta0 = Number((document.getElementById('theta0') as HTMLInputElement).value);
  const omega0 = Number((document.getElementById('omega0') as HTMLInputElement).value);
  const L = Number((document.getElementById('L') as HTMLInputElement).value);
  const h = Number((document.getElementById('h') as HTMLInputElement).value);
  const tTotal = Number((document.getElementById('tTotal') as HTMLInputElement).value);
  const nTaylor = Number((document.getElementById('nTaylor') as HTMLInputElement).value);

  let theta = theta0;
  let omega = omega0;
  let t = 0;

  const tbody = document.getElementById('tbody') as HTMLTableSectionElement;
  tbody.innerHTML = '';

  const datos: { t: number; theta: number; omega: number; sinAprox: number; }[] = [];

  while (t <= tTotal + 1e-12) {
    const sinAprox = sinTaylor(theta, nTaylor);
    datos.push({ t, theta, omega, sinAprox });

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.toFixed(2)}</td><td>${theta.toFixed(6)}</td><td>${omega.toFixed(6)}</td><td>${sinAprox.toFixed(6)}</td>`;
    tbody.appendChild(tr);

    const dTheta = omega;
    const dOmega = -(g / L) * sinAprox;
    theta += h * dTheta;
    omega += h * dOmega;
    t += h;
  }

  const output = document.getElementById('output') as HTMLDivElement;
  output.textContent = `Simulación lista. Iteraciones: ${datos.length}. θ final: ${theta.toFixed(6)}.`;
}

function probarTaylor(): void {
  const nTaylor = Number((document.getElementById('nTaylor') as HTMLInputElement).value);
  const valores = [0.1, 0.5, 1].map(x => {
    const aprox = sinTaylor(x, nTaylor);
    const real = Math.sin(x);
    return `x=${x}: Taylor=${aprox.toFixed(8)} | Math.sin=${real.toFixed(8)} | error=${Math.abs(aprox - real).toExponential(3)}`;
  });
  const test = document.getElementById('testOutput') as HTMLDivElement;
  test.innerHTML = `<strong>Prueba de sinTaylor</strong><br>${valores.join('<br>')}`;
}

(document.getElementById('runBtn') as HTMLButtonElement).addEventListener('click', simular);
(document.getElementById('testBtn') as HTMLButtonElement).addEventListener('click', probarTaylor);

simular();
