// Configurações básicas
const APPOSTA_MINIMA = 0.25;
const SALDO_INICIAL = 10.00;

// Lista de países (exemplo inicial). Para todas as bandeiras, carregue de flags.json
// Cada item: { code: "br", name: "Brasil" }
// Se usar lib de bandeiras, você pode aplicar classes como "fi fi-br" (flag-icons).
const PAISES = [
  { code: "br", name: "Brasil" },
  { code: "ar", name: "Argentina" },
  { code: "us", name: "Estados Unidos" },
  { code: "jp", name: "Japão" },
  { code: "fr", name: "França" },
  { code: "de", name: "Alemanha" },
  { code: "it", name: "Itália" },
  { code: "gb", name: "Reino Unido" },
  { code: "es", name: "Espanha" },
  { code: "pt", name: "Portugal" }
];

let saldo = carregarSaldo();
let rodadaBonus = false;

// Elementos
const elSaldo = document.getElementById("saldo");
const elBandeira = document.getElementById("bandeira");
const elAposta = document.getElementById("aposta");
const elMultiplicador = document.getElementById("multiplicador");
const elBtnApostar = document.getElementById("btnApostar");
const elBtnBonus = document.getElementById("btnBonus");
const elResultado = document.getElementById("resultado");
const elRoleta = document.getElementById("roleta");
const elFlagSorteada = document.getElementById("flagSorteada");
const elHistorico = document.getElementById("historico");

inicializar();

function inicializar() {
  // Preenche dropdown de países
  PAISES.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.code;
    opt.textContent = p.name;
    elBandeira.appendChild(opt);
  });

  atualizarSaldoUI();

  elBtnApostar.addEventListener("click", apostar);
  elBtnBonus.addEventListener("click", toggleBonus);

  // Estado inicial flag
  renderFlagView(null);
}

function apostar() {
  const aposta = parseFloat(elAposta.value);
  const escolhaCode = elBandeira.value;
  const multiplicador = parseInt(elMultiplicador.value, 10);

  // Validações
  if (isNaN(aposta) || aposta < APPOSTA_MINIMA) {
    setResultado(`Aposta mínima é R$${APPOSTA_MINIMA.toFixed(2)}.`, "warn");
    return;
  }
  if (aposta > saldo) {
    setResultado("Saldo insuficiente.", "error");
    return;
  }

  // Desconta aposta
  saldo = arredondar2(saldo - aposta);
  salvarSaldo(saldo);
  atualizarSaldoUI();

  // Sorteio justo
  const sorteada = sortearPaisUniforme(PAISES);

  // Animação simples
  elFlagSorteada.classList.add("spin");
  setTimeout(() => elFlagSorteada.classList.remove("spin"), 900);

  // Renderiza bandeira sorteada
  renderFlagView(sorteada);

  const acertou = sorteada.code === escolhaCode;
  let ganho = 0;

  if (acertou) {
    const bonusFactor = rodadaBonus ? 2 : 1;
    ganho = arredondar2(aposta * multiplicador * bonusFactor);
    saldo = arredondar2(saldo + ganho);
    salvarSaldo(saldo);
    atualizarSaldoUI();
    setResultado(
      `Bandeira sorteada: ${sorteada.name}. Você ganhou R$${ganho.toFixed(2)}!`,
      "win"
    );
  } else {
    setResultado(
      `Bandeira sorteada: ${sorteada.name}. Você perdeu R$${aposta.toFixed(2)}.`,
      "loss"
    );
  }

  adicionarHistorico({
    escolha: getPaisByCode(escolhaCode).name,
    sorteada: sorteada.name,
    aposta,
    ganho,
    multiplicador,
    bonus: rodadaBonus,
    venceu: acertou
  });
}

function toggleBonus() {
  rodadaBonus = !rodadaBonus;
  elBtnBonus.textContent = rodadaBonus
    ? "Rodada Bônus ATIVA (x2 no ganho)"
    : "Rodada Bônus (x2 no ganho)";
  elBtnBonus.classList.toggle("primary", rodadaBonus);
  elBtnBonus.classList.toggle("secondary", !rodadaBonus);
}

function sortearPaisUniforme(lista) {
  // RNG simples e uniforme
  const idx = Math.floor(Math.random() * lista.length);
  return lista[idx];
}

function renderFlagView(pais) {
  elFlagSorteada.innerHTML = "";
  if (!pais) {
    elFlagSorteada.innerHTML = `<div class="flag-name">Aguardando sorteio...</div>`;
    return;
  }

  // Se estiver usando uma lib de ícones de bandeiras:
  // const flagEl = document.createElement("span");
  // flagEl.className = `fi fi-${pais.code}`; // Ex.: fi fi-br
  // elFlagSorteada.appendChild(flagEl);

  // Placeholder sem lib: apenas nome do país
  const flagName = document.createElement("div");
  flagName.className = "flag-name";
  flagName.textContent = pais.name;
  elFlagSorteada.appendChild(flagName);
}

function setResultado(msg, type = "info") {
  elResultado.textContent = msg;
  // Pode estilizar por tipo (win/loss/error/warn) se quiser
}

function atualizarSaldoUI() {
  elSaldo.textContent = saldo.toFixed(2);
}

function carregarSaldo() {
  const raw = localStorage.getItem("saldoFlags");
  const num = parseFloat(raw);
  if (!isNaN(num)) return arredondar2(num);
  localStorage.setItem("saldoFlags", SALDO_INICIAL.toFixed(2));
  return SALDO_INICIAL;
}

function salvarSaldo(val) {
  localStorage.setItem("saldoFlags", val.toFixed(2));
}

function arredondar2(n) {
  return Math.round(n * 100) / 100;
}

function getPaisByCode(code) {
  return PAISES.find(p => p.code === code);
}

function adicionarHistorico(entry) {
  const li = document.createElement("li");

  const left = document.createElement("div");
  left.innerHTML = `
    <strong>${entry.escolha}</strong> → <span>${entry.sorteada}</span>
    <br><small>Aposta: R$${entry.aposta.toFixed(2)} | Mult: x${entry.multiplicador}${entry.bonus ? " + bônus x2" : ""}</small>
  `;

  const right = document.createElement("div");
  right.innerHTML = entry.venceu
    ? `<span class="badge-win">+R$${entry.ganho.toFixed(2)}</span>`
    : `<span class="badge-loss">-R$${entry.aposta.toFixed(2)}</span>`;

  li.appendChild(left);
  li.appendChild(right);
  elHistorico.prepend(li);

  // Mantém no máx. 50 entradas
  while (elHistorico.children.length > 50) {
    elHistorico.removeChild(elHistorico.lastChild);
  }
}