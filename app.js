const g = 9.81;
function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function sinTaylor(x, n) { let sum = 0; for (let k = 0; k < n; k++) { const sign = k % 2 === 0 ? 1 : -1; sum += sign * Math.pow(x, 2 * k + 1) / factorial(2 * k + 1); } return sum; }
function simular() {
    const theta0 = Number(document.getElementById('theta0').value);
    const omega0 = Number(document.getElementById('omega0').value);
    const L = Number(document.getElementById('L').value);
    const hMuestra = Number(document.getElementById('h').value); // intervalo de muestra
    const tTotal = Number(document.getElementById('tTotal').value);
    const nTaylor = Number(document.getElementById('nTaylor').value);
    const hInterno = 0.01; // paso interno pequeño para estabilidad numérica
    let theta = theta0; let omega = omega0; let t = 0;
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    const datos = [];
    let tSiguienteMuestra = 0;

    // Registrar estado inicial
    while (tSiguienteMuestra <= tTotal + 1e-12) {
        // Integrar con paso interno hasta llegar al siguiente punto de muestra
        while (t < tSiguienteMuestra - 1e-12) {
            const sinAprox = sinTaylor(theta, nTaylor);
            const dTheta = omega;
            const dOmega = -(g / L) * sinAprox;
            theta += hInterno * dTheta;
            omega += hInterno * dOmega;
            t += hInterno;
        }
        // Registrar el punto de muestra
        const sinAprox = sinTaylor(theta, nTaylor);
        datos.push({ t: tSiguienteMuestra, theta, omega, sinAprox });
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${tSiguienteMuestra.toFixed(2)}</td><td>${theta.toFixed(6)}</td><td>${omega.toFixed(6)}</td><td>${sinAprox.toFixed(6)}</td>`;
        tbody.appendChild(tr);
        tSiguienteMuestra += hMuestra;
    }
    document.getElementById('output').textContent = `Simulación de t=0 a t=${tTotal}. Iteraciones: ${datos.length}. θ final: ${theta.toFixed(6)}.`;

    // Comparación automática de Taylor vs Math.sin()
    const valores = [0.1, 0.5, 1].map(x => {
        const aprox = sinTaylor(x, nTaylor);
        const real = Math.sin(x);
        return `x=${x}: Taylor=${aprox.toFixed(8)} | Math.sin=${real.toFixed(8)} | error=${Math.abs(aprox - real).toExponential(3)}`;
    });
    document.getElementById('testOutput').innerHTML = `<strong>Validación de sinTaylor (${nTaylor} términos)</strong><br>${valores.join('<br>')}`;
}
document.getElementById('runBtn').addEventListener('click', simular);
simular();