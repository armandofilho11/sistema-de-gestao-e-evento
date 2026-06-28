const API = '/sistema-de-gestao-e-evento/public/index.php';

async function api(ep, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${API}/${ep}`, opts);
    
    if (!res.ok) {
      console.error(`Erro HTTP ${res.status}:`, res.statusText);
      return { sucesso: false, erro: `Erro do servidor (${res.status})` };
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Resposta não é JSON:', contentType);
      return { sucesso: false, erro: 'Resposta inválida do servidor' };
    }
    
    const data = await res.json();
    return data;
  } catch (erro) {
    console.error('Erro na API:', erro);
    return { sucesso: false, erro: 'Erro de conexão com o servidor' };
  }
}

const get  = ep      => api(ep);
const post = (ep, b) => api(ep, 'POST', b);
const put  = (ep, b) => api(ep, 'PUT',  b);
const del  = ep      => api(ep, 'DELETE');

function toast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${tipo}`;
  setTimeout(() => t.className = '', 3000);
}

function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(o =>
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
);

function confirmarExclusao(nome, cb) {
  document.getElementById('confirm-nome').textContent = `"${nome}"?`;
  document.getElementById('btn-confirmar-delete').onclick = () => { closeModal('modal-confirmar'); cb(); };
  openModal('modal-confirmar');
}

function badge(val) {
  const map = {
    encerrado:'bg-g50 text-g700', concluido:'bg-g50 text-g700',
    ativo:'bg-blue-50 text-blue-700', programado:'bg-blue-50 text-blue-700',
    rascunho:'bg-amber-50 text-amber-900', aberto:'bg-amber-50 text-amber-900',
    cancelado:'bg-red-50 text-red-600',
    inativo:'bg-gray-50 text-gray-500',
    manutencao:'bg-amber-50 text-amber-900',
    agendado:'bg-g50 text-g700',
    confirmado:'bg-blue-50 text-blue-700', em_andamento:'bg-blue-50 text-blue-700',
    estudante:'bg-g50 text-g700',
    professor:'bg-blue-50 text-blue-700',
    externo:'bg-amber-50 text-amber-900',
    convidado:'bg-purple-50 text-purple-700',
  };
  const labels = {
    em_andamento:'Em andamento', estudante:'Aluno',
    encerrado:'Encerrado', concluido:'Concluído',
    manutencao:'Manutenção',
  };
  return `<span class="inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-medium ${map[val]||'bg-amber-50 text-amber-900'}">${labels[val]||val}</span>`;
}

function emptyState(msg = 'Nenhum registro encontrado') {
  return `<div class="text-center py-12 px-5 text-gray-500"><i class="bi bi-inbox text-3xl block mb-2.5 opacity-35"></i><p class="text-sm">${msg}</p></div>`;
}

const tableWrap = html => `<div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">${html}</div>`;

const thClass = 'text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[.06em] text-gray-500';
const tdClass = 'px-4 py-[11px] text-sm border-b border-gray-100';

const carregadores = {
  inicio:        carregarDashboard,
  eventos:       carregarEventos,
  participantes: () => carregarParticipantes(''),
  projetos:      carregarProjetos,
  turmas:        carregarTurmas,
  espacos:       carregarEspacos,
  programacao:   carregarProgramacao,
  relatorios:    carregarRelatorios,
};

function goTo(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  carregadores[page]?.();
}

function setTab(btn) {
  btn.closest('.flex').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

function selectCat(btn) {
  btn.closest('.flex').querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function popularSelect(selectId, ep, valKey, labelKey, selecionado = null, comVazio = false) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">Carregando...</option>';
  const res = await get(ep);
  if (!res.sucesso) { sel.innerHTML = '<option value="">Erro ao carregar</option>'; return; }
  let opts = comVazio ? '<option value="">— Nenhum —</option>' : '';
  res.dados.forEach(item => {
    const s = selecionado && String(item[valKey]) === String(selecionado) ? 'selected' : '';
    opts += `<option value="${item[valKey]}" ${s}>${item[labelKey]}</option>`;
  });
  sel.innerHTML = opts;
}

let calState = { ano: new Date().getFullYear(), mes: new Date().getMonth() };
let calDias  = [];

function calMes(d) {
  calState.mes += d;
  if (calState.mes > 11) { calState.mes = 0; calState.ano++; }
  if (calState.mes < 0)  { calState.mes = 11; calState.ano--; }
  renderCal(calDias);
}

function renderCal(dias) {
  calDias = dias;
  const { ano, mes } = calState;
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('cal-label').textContent = `${meses[mes]} ${ano}`;

  const offset = ((new Date(ano, mes, 1).getDay() + 6) % 7);
  const total  = new Date(ano, mes + 1, 0).getDate();
  const hoje   = new Date();

  let html = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(n =>
    `<div class="text-[10px] text-gray-500 font-semibold py-[3px]">${n}</div>`
  ).join('');

  for (let i = 0; i < offset; i++) html += '<div class="cal-d text-xs py-[5px] rounded"></div>';

  for (let d = 1; d <= total; d++) {
    const str    = `${ano}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isHoje = d === hoje.getDate() && ano === hoje.getFullYear() && mes === hoje.getMonth();
    const cls    = isHoje ? 'today' : dias.includes(str) ? 'ev' : '';
    html += `<div class="cal-d text-xs py-[5px] px-0.5 rounded cursor-pointer ${cls}">${d}</div>`;
  }
  document.getElementById('cal-grid').innerHTML = html;
}

function fmt(data) {
  if (!data) return '—';
  const [y, m, d] = data.split('-');
  return `${d}/${m}/${y}`;
}

async function carregarDashboard() {
  const res = await get('dashboard');
  if (!res.sucesso) return;
  const d  = res.dados;
  const ps = d.por_status || {};

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('card-ativos',     ps.ativo     || 0);
  set('card-encerrados', ps.encerrado || 0);
  set('card-cancelados', ps.cancelado || 0);
  set('card-espacos',    d.totais?.espacos || 0);
  set('rel-ativo',       ps.ativo     || 0);
  set('rel-encerrado',   ps.encerrado || 0);
  set('rel-cancelado',   ps.cancelado || 0);
  set('rel-ambientes',   d.totais?.espacos || 0);

  const lista = document.getElementById('proximos-lista');
  if (lista) {
    if (!d.proximos_eventos?.length) {
      lista.innerHTML = emptyState('Nenhum evento cadastrado');
    } else {
      lista.innerHTML = d.proximos_eventos.map(e =>
        '<div class="flex items-center gap-2.5 py-[9px] border-b border-gray-100 last:border-0">'
        + '<div class="w-1.5 h-1.5 rounded-full bg-g500 shrink-0"></div>'
        + '<div class="text-sm font-medium flex-1">' + e.nome + '</div>'
        + '<div class="text-[11px] text-gray-500 mr-1.5">' + fmt(e.data) + '</div>'
        + badge(e.status)
        + '</div>'
      ).join('');
    }
  }

  renderCal(d.dias_com_eventos || []);
}

async function carregarRelatorios() {
  await carregarDashboard();
  await popularSelect('rel-espaco', 'espacos', 'id_espaco', 'nome', null, false);
  await popularSelect('rel-turma',  'turmas',  'id_turma',  'nome', null, false);
  await filtrarRelatorioEventos();
  await filtrarRelatorioProjetos();
}

async function carregarEventos() {
  const busca = document.getElementById('busca-eventos')?.value || '';
  const res   = await get(`eventos?busca=${encodeURIComponent(busca)}`);
  const el    = document.getElementById('tabela-eventos');
  if (!res.sucesso || !res.dados.length) {
    el.innerHTML = tableWrap(emptyState('Nenhum evento encontrado')); return;
  }
  el.innerHTML = tableWrap(`<table class="w-full border-collapse">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="${thClass}">Nome</th>
        <th class="${thClass}">Data</th>
        <th class="${thClass}">Criado por</th>
        <th class="${thClass}">Status</th>
        <th class="${thClass}">Ações</th>
      </tr>
    </thead>
    <tbody>${res.dados.map(e => `
      <tr>
        <td class="${tdClass}"><strong>${e.nome}</strong></td>
        <td class="${tdClass}">${fmt(e.data)}</td>
        <td class="${tdClass}">${e.criado_por || '—'}</td>
        <td class="${tdClass}">${badge(e.status)}</td>
        <td class="${tdClass}"><div class="flex gap-1">
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-g50" onclick="editarEvento(${e.id_evento})"><i class="bi bi-pencil"></i></button>
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-red-100" onclick="excluirEvento(${e.id_evento},'${e.nome.replace(/'/g,"\\'")}')"><i class="bi bi-trash3"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table>`);
}

// ===================== MODAL DE EVENTO (5 etapas, criação inline) =====================

const RESP_TIPO_LABELS   = { estudante: 'Aluno', professor: 'Professor', coordenador: 'Coordenador', externo: 'Externo' };
const ESPACO_TIPO_LABELS = { sala: 'Sala', auditorio: 'Auditório', quadra: 'Quadra', laboratorio: 'Laboratório', outro: 'Outro' };

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let eventoState = {
  step: 1,
  espacos:      [], // {existing, id, nome, tipo, capacidade_max}
  projetos:     [], // {existing, id, nome, descricao}
  turmas:       [], // {existing, id, nome, curso, ano}
  responsaveis: [], // {existing, id, nome, email, categoria}
};

function eventoResetState() {
  eventoState = { step: 1, espacos: [], projetos: [], turmas: [], responsaveis: [] };
}

function eventoGoToStep(n) {
  eventoState.step = n;
  for (let i = 1; i <= 5; i++) {
    document.getElementById('evento-step-' + i).classList.toggle('hidden', i !== n);
    const dot = document.getElementById('step-dot-' + i);
    dot.classList.toggle('bg-g500', i <= n);
    dot.classList.toggle('bg-gray-200', i > n);
  }
  const labels = {
    1: 'Etapa 1 de 5 — Informações',
    2: 'Etapa 2 de 5 — Espaços',
    3: 'Etapa 3 de 5 — Projetos',
    4: 'Etapa 4 de 5 — Turmas',
    5: 'Etapa 5 de 5 — Responsáveis',
  };
  document.getElementById('evento-step-label').textContent = labels[n];

  document.getElementById('evento-btn-anterior').classList.toggle('hidden', n === 1);
  document.getElementById('evento-btn-proximo').classList.toggle('hidden', n === 5);
  document.getElementById('evento-btn-salvar').classList.toggle('hidden', n !== 5);
}

function eventoValidarStep1() {
  const nome    = document.getElementById('evento-nome').value.trim();
  const dIni    = document.getElementById('evento-data-inicio').value;
  const dFim    = document.getElementById('evento-data-fim').value;
  const hIni    = document.getElementById('evento-hora-inicio').value || '00:00';
  const hFim    = document.getElementById('evento-hora-fim').value    || '23:59';
  const usuario = document.getElementById('evento-usuario').value;
  const erroEl  = document.getElementById('evento-data-erro');

  if (!nome)    { toast('Informe o nome do evento', 'err'); return false; }
  if (!dIni)    { toast('Informe a data de início', 'err'); return false; }
  if (!dFim)    { toast('Informe a data de término', 'err'); return false; }
  if (!usuario) { toast('Selecione quem está criando o evento', 'err'); return false; }

  const inicio = new Date(dIni + 'T' + hIni);
  const fim    = new Date(dFim + 'T' + hFim);

  if (fim < inicio) {
    erroEl.classList.remove('hidden');
    toast('A data/horário de término não pode ser anterior ao início', 'err');
    return false;
  }
  erroEl.classList.add('hidden');
  return true;
}

function eventoStepProximo() {
  if (eventoState.step === 1 && !eventoValidarStep1()) return;
  if (eventoState.step < 5) eventoGoToStep(eventoState.step + 1);
}

function eventoStepAnterior() {
  if (eventoState.step > 1) eventoGoToStep(eventoState.step - 1);
}

function atualizarItemEvento(grupo, idx, campo, valor) {
  eventoState[grupo][idx][campo] = valor;
}

// ---- Step 2: Espaços (criação inline) ----

function adicionarEspacoEvento() {
  eventoState.espacos.push({ existing: false, id: null, nome: '', capacidade_max: '', tipo: 'sala' });
  renderEspacosEvento();
}

function removerEspacoEvento(idx) {
  eventoState.espacos.splice(idx, 1);
  renderEspacosEvento();
}

function renderEspacosEvento() {
  const container = document.getElementById('evento-espacos-lista');
  if (!eventoState.espacos.length) {
    container.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">Nenhum espaço adicionado ainda.</p>';
    return;
  }
  container.innerHTML = eventoState.espacos.map(function(esp, idx) {
    if (esp.existing) {
      return '<div class="flex items-center gap-2 bg-g50 border border-g100 rounded-lg p-2.5">'
        + '<i class="bi bi-geo-alt text-g700"></i>'
        + '<div class="flex-1">'
        +   '<span class="text-sm font-medium text-gray-900">' + esc(esp.nome) + '</span>'
        +   '<span class="text-xs text-gray-400 ml-2">' + (ESPACO_TIPO_LABELS[esp.tipo] || esp.tipo) + ' · cap. ' + (esp.capacidade_max ?? '—') + '</span>'
        + '</div>'
        + '<span class="text-[10px] text-g700 bg-white border border-g100 px-1.5 py-0.5 rounded shrink-0">vinculado</span>'
        + '<button type="button" onclick="removerEspacoEvento(' + idx + ')" class="text-red-500 hover:text-red-700 px-1"><i class="bi bi-x-lg"></i></button>'
        + '</div>';
    }
    const opts = ['sala','auditorio','quadra','laboratorio','outro'].map(function(t) {
      return '<option value="' + t + '" ' + (esp.tipo === t ? 'selected' : '') + '>' + ESPACO_TIPO_LABELS[t] + '</option>';
    }).join('');
    return '<div class="border border-gray-200 rounded-lg p-2.5 bg-white">'
      + '<div class="flex items-start gap-2">'
      +   '<div class="flex-1 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-2">'
      +     '<input type="text" placeholder="Nome do espaço" value="' + esc(esp.nome) + '" oninput="atualizarItemEvento(\'espacos\',' + idx + ',\'nome\',this.value)" class="form-input px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">'
      +     '<input type="number" min="1" placeholder="Capacidade" value="' + esc(esp.capacidade_max) + '" oninput="atualizarItemEvento(\'espacos\',' + idx + ',\'capacidade_max\',this.value)" class="form-input px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">'
      +     '<select onchange="atualizarItemEvento(\'espacos\',' + idx + ',\'tipo\',this.value)" class="form-select px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">' + opts + '</select>'
      +   '</div>'
      +   '<button type="button" onclick="removerEspacoEvento(' + idx + ')" class="text-red-500 hover:text-red-700 px-1 mt-1.5"><i class="bi bi-trash3"></i></button>'
      + '</div></div>';
  }).join('');
}

// ---- Step 3: Projetos (criação inline) ----

function adicionarProjetoEvento() {
  eventoState.projetos.push({ existing: false, id: null, nome: '', descricao: '' });
  renderProjetosEvento();
}

function removerProjetoEvento(idx) {
  eventoState.projetos.splice(idx, 1);
  renderProjetosEvento();
}

function renderProjetosEvento() {
  const container = document.getElementById('evento-projetos-lista');
  if (!eventoState.projetos.length) {
    container.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">Nenhum projeto adicionado ainda.</p>';
    return;
  }
  container.innerHTML = eventoState.projetos.map(function(p, idx) {
    if (p.existing) {
      return '<div class="flex items-center gap-2 bg-g50 border border-g100 rounded-lg p-2.5">'
        + '<i class="bi bi-folder2-open text-g700"></i>'
        + '<span class="flex-1 text-sm font-medium text-gray-900">' + esc(p.nome) + '</span>'
        + '<span class="text-[10px] text-g700 bg-white border border-g100 px-1.5 py-0.5 rounded shrink-0">vinculado</span>'
        + '<button type="button" onclick="removerProjetoEvento(' + idx + ')" class="text-red-500 hover:text-red-700 px-1"><i class="bi bi-x-lg"></i></button>'
        + '</div>';
    }
    return '<div class="border border-gray-200 rounded-lg p-2.5 bg-white">'
      + '<div class="flex items-start gap-2 mb-2">'
      +   '<input type="text" placeholder="Nome do projeto" value="' + esc(p.nome) + '" oninput="atualizarItemEvento(\'projetos\',' + idx + ',\'nome\',this.value)" class="form-input flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">'
      +   '<button type="button" onclick="removerProjetoEvento(' + idx + ')" class="text-red-500 hover:text-red-700 px-1"><i class="bi bi-trash3"></i></button>'
      + '</div>'
      + '<textarea placeholder="Descrição (opcional)" oninput="atualizarItemEvento(\'projetos\',' + idx + ',\'descricao\',this.value)" class="form-textarea w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white resize-y min-h-[50px]">' + esc(p.descricao) + '</textarea>'
      + '</div>';
  }).join('');
}

// ---- Step 4: Turmas (criação inline, ano = ano do evento) ----

function adicionarTurmaEvento() {
  eventoState.turmas.push({ existing: false, id: null, nome: '', curso: '' });
  renderTurmasEvento();
}

function removerTurmaEvento(idx) {
  eventoState.turmas.splice(idx, 1);
  renderTurmasEvento();
}

function renderTurmasEvento() {
  const container = document.getElementById('evento-turmas-lista');
  if (!eventoState.turmas.length) {
    container.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">Nenhuma turma adicionada ainda.</p>';
    return;
  }
  container.innerHTML = eventoState.turmas.map(function(t, idx) {
    if (t.existing) {
      return '<div class="flex items-center gap-2 bg-g50 border border-g100 rounded-lg p-2.5">'
        + '<i class="bi bi-mortarboard text-g700"></i>'
        + '<div class="flex-1">'
        +   '<span class="text-sm font-medium text-gray-900">' + esc(t.nome) + '</span>'
        +   '<span class="text-xs text-gray-400 ml-2">' + esc(t.curso || '') + (t.ano ? ' · ' + t.ano : '') + '</span>'
        + '</div>'
        + '<span class="text-[10px] text-g700 bg-white border border-g100 px-1.5 py-0.5 rounded shrink-0">vinculado</span>'
        + '<button type="button" onclick="removerTurmaEvento(' + idx + ')" class="text-red-500 hover:text-red-700 px-1"><i class="bi bi-x-lg"></i></button>'
        + '</div>';
    }
    return '<div class="border border-gray-200 rounded-lg p-2.5 bg-white">'
      + '<div class="flex items-start gap-2">'
      +   '<div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">'
      +     '<input type="text" placeholder="Nome da turma" value="' + esc(t.nome) + '" oninput="atualizarItemEvento(\'turmas\',' + idx + ',\'nome\',this.value)" class="form-input px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">'
      +     '<input type="text" placeholder="Curso" value="' + esc(t.curso) + '" oninput="atualizarItemEvento(\'turmas\',' + idx + ',\'curso\',this.value)" class="form-input px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">'
      +   '</div>'
      +   '<button type="button" onclick="removerTurmaEvento(' + idx + ')" class="text-red-500 hover:text-red-700 px-1 mt-1.5"><i class="bi bi-trash3"></i></button>'
      + '</div></div>';
  }).join('');
}

// ---- Step 5: Responsáveis (criação inline) ----

function adicionarResponsavelEvento() {
  eventoState.responsaveis.push({ existing: false, id: null, nome: '', email: '', categoria: 'estudante' });
  renderResponsaveisEvento();
}

function removerResponsavelEvento(idx) {
  eventoState.responsaveis.splice(idx, 1);
  renderResponsaveisEvento();
}

function renderResponsaveisEvento() {
  const container = document.getElementById('evento-responsaveis-lista');
  if (!eventoState.responsaveis.length) {
    container.innerHTML = '<p class="text-xs text-gray-400 text-center py-3">Nenhum responsável adicionado ainda.</p>';
    return;
  }
  container.innerHTML = eventoState.responsaveis.map(function(r, idx) {
    if (r.existing) {
      return '<div class="flex items-center gap-2 bg-g50 border border-g100 rounded-lg p-2.5">'
        + '<i class="bi bi-person-circle text-g700"></i>'
        + '<div class="flex-1">'
        +   '<span class="text-sm font-medium text-gray-900">' + esc(r.nome) + '</span>'
        +   '<span class="text-xs text-gray-400 ml-2">' + (RESP_TIPO_LABELS[r.categoria] || r.categoria) + '</span>'
        + '</div>'
        + '<span class="text-[10px] text-g700 bg-white border border-g100 px-1.5 py-0.5 rounded shrink-0">vinculado</span>'
        + '<button type="button" onclick="removerResponsavelEvento(' + idx + ')" class="text-red-500 hover:text-red-700 px-1"><i class="bi bi-x-lg"></i></button>'
        + '</div>';
    }
    const opts = ['estudante','professor','coordenador','externo'].map(function(cat) {
      return '<option value="' + cat + '" ' + (r.categoria === cat ? 'selected' : '') + '>' + RESP_TIPO_LABELS[cat] + '</option>';
    }).join('');
    return '<div class="border border-gray-200 rounded-lg p-2.5 bg-white">'
      + '<div class="flex items-start gap-2">'
      +   '<div class="flex-1 grid grid-cols-1 sm:grid-cols-[1.2fr_1.4fr_1fr] gap-2">'
      +     '<input type="text" placeholder="Nome" value="' + esc(r.nome) + '" oninput="atualizarItemEvento(\'responsaveis\',' + idx + ',\'nome\',this.value)" class="form-input px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">'
      +     '<input type="email" placeholder="Email" value="' + esc(r.email) + '" oninput="atualizarItemEvento(\'responsaveis\',' + idx + ',\'email\',this.value)" class="form-input px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">'
      +     '<select onchange="atualizarItemEvento(\'responsaveis\',' + idx + ',\'categoria\',this.value)" class="form-select px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">' + opts + '</select>'
      +   '</div>'
      +   '<button type="button" onclick="removerResponsavelEvento(' + idx + ')" class="text-red-500 hover:text-red-700 px-1 mt-1.5"><i class="bi bi-trash3"></i></button>'
      + '</div></div>';
  }).join('');
}

// ---- Abrir / Editar / Salvar evento ----

async function openModalEvento() {
  document.getElementById('titulo-modal-evento').textContent = 'Criar Evento';
  document.getElementById('evento-id').value          = '';
  document.getElementById('evento-nome').value        = '';
  document.getElementById('evento-descricao').value   = '';
  document.getElementById('evento-data-inicio').value = '';
  document.getElementById('evento-hora-inicio').value = '';
  document.getElementById('evento-data-fim').value    = '';
  document.getElementById('evento-hora-fim').value    = '';
  document.getElementById('evento-status').value      = 'agendado';
  document.getElementById('evento-data-erro').classList.add('hidden');

  eventoResetState();
  await popularSelect('evento-usuario', 'usuarios', 'id_usuario', 'nome');

  renderEspacosEvento();
  renderProjetosEvento();
  renderTurmasEvento();
  renderResponsaveisEvento();

  eventoGoToStep(1);
  openModal('modal-evento');
}

async function editarEvento(id) {
  const res = await get('eventos/' + id);
  if (!res.sucesso) { toast('Erro ao carregar evento', 'err'); return; }
  const e = res.dados;

  document.getElementById('titulo-modal-evento').textContent = 'Editar Evento';
  document.getElementById('evento-id').value          = e.id_evento;
  document.getElementById('evento-nome').value        = e.nome;
  document.getElementById('evento-descricao').value   = e.descricao || '';
  document.getElementById('evento-data-inicio').value = e.data     ? e.data.substring(0,10)     : '';
  document.getElementById('evento-hora-inicio').value = e.hora_inicio ? e.hora_inicio.substring(0,5) : '';
  document.getElementById('evento-data-fim').value    = e.data_fim ? e.data_fim.substring(0,10) : (e.data ? e.data.substring(0,10) : '');
  document.getElementById('evento-hora-fim').value    = e.hora_fim    ? e.hora_fim.substring(0,5)    : '';
  document.getElementById('evento-status').value      = e.status;
  document.getElementById('evento-data-erro').classList.add('hidden');

  eventoResetState();
  eventoState.espacos = (e.espacos || []).map(function(s) {
    return { existing: true, id: s.id_espaco, nome: s.nome, tipo: s.tipo, capacidade_max: (s.capacidade_max ?? s.capaciade) };
  });
  eventoState.projetos = (e.projetos || []).map(function(p) {
    return { existing: true, id: p.id_projeto, nome: p.nome, descricao: p.descricao };
  });
  eventoState.turmas = (e.turmas || []).map(function(t) {
    return { existing: true, id: t.id_turma, nome: t.nome, curso: t.curso, ano: t.ano };
  });
  eventoState.responsaveis = (e.responsaveis || []).map(function(r) {
    return { existing: true, id: r.id_participacao, nome: r.nome, email: r.email, categoria: r.categoria };
  });

  await popularSelect('evento-usuario', 'usuarios', 'id_usuario', 'nome', e.id_usuario_criado);

  renderEspacosEvento();
  renderProjetosEvento();
  renderTurmasEvento();
  renderResponsaveisEvento();

  eventoGoToStep(1);
  openModal('modal-evento');
}

async function salvarEvento() {
  if (!eventoValidarStep1()) { eventoGoToStep(1); return; }

  const id         = document.getElementById('evento-id').value;
  const dataInicio = document.getElementById('evento-data-inicio').value;
  const anoEvento  = new Date(dataInicio + 'T00:00').getFullYear();

  const dados = {
    nome:              document.getElementById('evento-nome').value.trim(),
    descricao:         document.getElementById('evento-descricao').value.trim(),
    data:              dataInicio,
    hora_inicio:       document.getElementById('evento-hora-inicio').value || null,
    data_fim:          document.getElementById('evento-data-fim').value,
    hora_fim:          document.getElementById('evento-hora-fim').value || null,
    status:            document.getElementById('evento-status').value,
    id_usuario_criado: document.getElementById('evento-usuario').value,
  };

  const res = id
    ? await put('eventos/' + id, dados)
    : await post('eventos', dados);

  if (!res.sucesso) { toast(res.erro || 'Erro ao salvar', 'err'); return; }

  const idEvento = parseInt(id || res.dados?.id_evento);

  // ---- Espaços: cria os novos e sincroniza o vínculo (com capacidade) ----
  const espacosFinal = [];
  for (const esp of eventoState.espacos) {
    if (esp.existing) {
      espacosFinal.push({ id_espaco: esp.id, capacidade_max: esp.capacidade_max ? parseInt(esp.capacidade_max) : null });
    } else if ((esp.nome || '').trim()) {
      const r = await post('espacos', {
        nome:      esp.nome.trim(),
        tipo:      esp.tipo || 'sala',
        capaciade: esp.capacidade_max ? parseInt(esp.capacidade_max) : 0,
        status:    'ativo',
      });
      if (r.sucesso) {
        espacosFinal.push({ id_espaco: r.dados.id_espaco, capacidade_max: esp.capacidade_max ? parseInt(esp.capacidade_max) : null });
      }
    }
  }
  await post('relacoes', { tabela: 'utiliza', id_evento: idEvento, espacos: espacosFinal });

  // ---- Projetos: cria os novos e sincroniza o vínculo ----
  const projetosFinal = [];
  for (const p of eventoState.projetos) {
    if (p.existing) {
      projetosFinal.push(parseInt(p.id));
    } else if ((p.nome || '').trim()) {
      const r = await post('projetos', { nome: p.nome.trim(), descricao: (p.descricao || '').trim() });
      if (r.sucesso) projetosFinal.push(parseInt(r.dados.id_projeto));
    }
  }
  await post('relacoes', { tabela: 'evento_projeto', id_evento: idEvento, projetos: projetosFinal });

  // ---- Turmas: cria as novas (ano = ano do evento) e sincroniza o vínculo ----
  const turmasFinal = [];
  for (const t of eventoState.turmas) {
    if (t.existing) {
      turmasFinal.push(parseInt(t.id));
    } else if ((t.nome || '').trim()) {
      const r = await post('turmas', { nome: t.nome.trim(), curso: (t.curso || '').trim(), ano: anoEvento });
      if (r.sucesso) turmasFinal.push(parseInt(r.dados.id_turma));
    }
  }
  await post('relacoes', { tabela: 'evento_turma', id_evento: idEvento, turmas: turmasFinal });

  // ---- Responsáveis: cria os novos e sincroniza o vínculo ----
  const responsaveisFinal = [];
  for (const r0 of eventoState.responsaveis) {
    if (r0.existing) {
      responsaveisFinal.push(parseInt(r0.id));
    } else if ((r0.nome || '').trim() && (r0.email || '').trim()) {
      const r = await post('participantes', {
        nome:      r0.nome.trim(),
        email:     r0.email.trim(),
        categoria: r0.categoria || 'estudante',
        id_evento: idEvento,
      });
      if (r.sucesso) responsaveisFinal.push(parseInt(r.dados.id_participacao));
    }
  }
  await post('relacoes', { tabela: 'evento_responsavel', id_evento: idEvento, participantes: responsaveisFinal });

  closeModal('modal-evento');
  toast(id ? 'Evento atualizado!' : 'Evento criado!');

  carregarEventos();
  carregarDashboard();
  if (document.getElementById('page-espacos')?.classList.contains('active'))       carregarEspacos();
  if (document.getElementById('page-projetos')?.classList.contains('active'))      carregarProjetos();
  if (document.getElementById('page-turmas')?.classList.contains('active'))        carregarTurmas();
  if (document.getElementById('page-participantes')?.classList.contains('active')) carregarParticipantes();
}

function excluirEvento(id, nome) {
  confirmarExclusao(nome, async () => {
    const res = await del(`eventos/${id}`);
    res.sucesso
      ? (toast('Evento excluído!'), carregarEventos(), carregarDashboard())
      : toast(res.erro || 'Erro ao excluir', 'err');
  });
}

let catFiltro = '';

async function carregarParticipantes(cat) {
  if (cat !== undefined) catFiltro = cat;
  const busca = document.getElementById('busca-participantes')?.value || '';
  const res   = await get(`participantes?busca=${encodeURIComponent(busca)}&categoria=${catFiltro}`);
  const el    = document.getElementById('tabela-participantes');
  if (!res.sucesso || !res.dados.length) {
    el.innerHTML = tableWrap(emptyState('Nenhum participante encontrado')); return;
  }
  el.innerHTML = tableWrap(`<table class="w-full border-collapse">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="${thClass}">Nome</th>
        <th class="${thClass}">Email</th>
        <th class="${thClass}">Categoria</th>
        <th class="${thClass}">Turma</th>
        <th class="${thClass}">Projeto</th>
        <th class="${thClass}">Evento</th>
        <th class="${thClass}">Ações</th>
      </tr>
    </thead>
    <tbody>${res.dados.map(p => `
      <tr>
        <td class="${tdClass}"><strong>${p.nome}</strong></td>
        <td class="${tdClass}">${p.email}</td>
        <td class="${tdClass}">${badge(p.categoria)}</td>
        <td class="${tdClass}">${p.turma   || '—'}</td>
        <td class="${tdClass}">${p.projeto || '—'}</td>
        <td class="${tdClass}">${p.evento  || '—'}</td>
        <td class="${tdClass}"><div class="flex gap-1">
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-g50" onclick="editarParticipante(${p.id_participacao})"><i class="bi bi-pencil"></i></button>
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-red-100" onclick="excluirParticipante(${p.id_participacao},'${p.nome.replace(/'/g,"\\'")}')"><i class="bi bi-trash3"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table>`);
}

async function abrirModalParticipante() {
  document.getElementById('titulo-modal-participante').textContent = 'Cadastrar Participante';
  document.getElementById('participante-id').value = '';
  document.getElementById('part-nome').value  = '';
  document.getElementById('part-email').value = '';
  document.querySelectorAll('#modal-participante .cat-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  await popularSelect('part-evento', 'eventos',  'id_evento',  'nome');
  await popularSelect('part-turma',  'turmas',   'id_turma',   'nome', null, true);
  await popularSelect('part-projeto','projetos', 'id_projeto', 'nome', null, true);
  openModal('modal-participante');
}

async function editarParticipante(id) {
  const res = await get(`participantes/${id}`);
  if (!res.sucesso) return;
  const p = res.dados;
  document.getElementById('titulo-modal-participante').textContent = 'Editar Participante';
  document.getElementById('participante-id').value = p.id_participacao;
  document.getElementById('part-nome').value  = p.nome;
  document.getElementById('part-email').value = p.email;
  document.querySelectorAll('#modal-participante .cat-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.val === p.categoria)
  );
  await popularSelect('part-evento', 'eventos',  'id_evento',  'nome', p.id_evento);
  await popularSelect('part-turma',  'turmas',   'id_turma',   'nome', p.id_turma,   true);
  await popularSelect('part-projeto','projetos', 'id_projeto', 'nome', p.id_projeto, true);
  openModal('modal-participante');
}

async function salvarParticipante() {
  const id  = document.getElementById('participante-id').value;
  const cat = document.querySelector('#modal-participante .cat-btn.active')?.dataset.val;
  const dados = {
    nome:       document.getElementById('part-nome').value.trim(),
    email:      document.getElementById('part-email').value.trim(),
    categoria:  cat,
    id_evento:  document.getElementById('part-evento').value,
    id_turma:   document.getElementById('part-turma').value   || null,
    id_projeto: document.getElementById('part-projeto').value || null,
  };
  if (!dados.nome || !dados.email || !dados.id_evento) {
    toast('Preencha os campos obrigatórios', 'err'); return;
  }
  const res = id
    ? await put(`participantes/${id}`, dados)
    : await post('participantes', dados);
  if (res.sucesso) {
    closeModal('modal-participante');
    toast(id ? 'Participante atualizado!' : 'Participante cadastrado!');
    carregarParticipantes();
    carregarDashboard();
  } else {
    toast(res.erro || 'Erro ao salvar', 'err');
  }
}

function excluirParticipante(id, nome) {
  confirmarExclusao(nome, async () => {
    const res = await del(`participantes/${id}`);
    res.sucesso
      ? (toast('Participante excluído!'), carregarParticipantes(), carregarDashboard())
      : toast(res.erro || 'Erro', 'err');
  });
}

async function carregarProjetos() {
  const busca = document.getElementById('busca-projetos')?.value || '';
  const res   = await get(`projetos?busca=${encodeURIComponent(busca)}`);
  const el    = document.getElementById('tabela-projetos');
  if (!res.sucesso || !res.dados.length) {
    el.innerHTML = tableWrap(emptyState('Nenhum projeto encontrado')); return;
  }
  el.innerHTML = tableWrap(`<table class="w-full border-collapse">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="${thClass}">Nome</th>
        <th class="${thClass}">Descrição</th>
        <th class="${thClass}">Turmas</th>
        <th class="${thClass}">Ações</th>
      </tr>
    </thead>
    <tbody>${res.dados.map(p => `
      <tr>
        <td class="${tdClass}"><strong>${p.nome}</strong></td>
        <td class="${tdClass}">${p.descricao || '—'}</td>
        <td class="${tdClass}">${p.turmas    || '—'}</td>
        <td class="${tdClass}"><div class="flex gap-1">
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-g50" onclick="editarProjeto(${p.id_projeto})"><i class="bi bi-pencil"></i></button>
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-red-100" onclick="excluirProjeto(${p.id_projeto},'${p.nome.replace(/'/g,"\\'")}')"><i class="bi bi-trash3"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table>`);
}

async function openModalProjeto() {
  document.getElementById('titulo-modal-projeto').textContent = 'Cadastrar Projeto';
  document.getElementById('projeto-id').value = '';
  document.getElementById('proj-nome').value  = '';
  document.getElementById('proj-desc').value  = '';
  await carregarTurmasModal([]);
  openModal('modal-projeto');
}

async function editarProjeto(id) {
  const res = await get(`projetos/${id}`);
  if (!res.sucesso) return;
  const p = res.dados;
  document.getElementById('titulo-modal-projeto').textContent = 'Editar Projeto';
  document.getElementById('projeto-id').value = p.id_projeto;
  document.getElementById('proj-nome').value  = p.nome;
  document.getElementById('proj-desc').value  = p.descricao || '';
  const ids = (p.turmas_ids || []).map(t => t.id_turma || t);
  await carregarTurmasModal(ids);
  openModal('modal-projeto');
}

async function salvarProjeto() {
  const id    = document.getElementById('projeto-id').value;
  const dados = {
    nome:      document.getElementById('proj-nome').value.trim(),
    descricao: document.getElementById('proj-desc').value.trim(),
  };
  if (!dados.nome) { toast('Nome é obrigatório', 'err'); return; }
  const res = id
    ? await put(`projetos/${id}`, dados)
    : await post('projetos', dados);
  if (!res.sucesso) { toast(res.erro || 'Erro', 'err'); return; }

  const idProjeto = id || res.dados?.id_projeto;
  const checks = document.querySelectorAll('#proj-turmas-lista input[type="checkbox"]:checked');
  const turmas  = Array.from(checks).map(cb => parseInt(cb.value));

  if (idProjeto) {
    await post('relacoes', {
      tabela:     'apresenta',
      id_projeto: parseInt(idProjeto),
      turmas:     turmas,
    });
  }

  closeModal('modal-projeto');
  toast(id ? 'Projeto atualizado!' : 'Projeto criado!');
  carregarProjetos();
  carregarDashboard();
}

async function carregarTurmasModal(selecionadas = []) {
  const container = document.getElementById('proj-turmas-lista');
  if (!container) return;
  container.innerHTML = '<p class="text-xs text-gray-400">Carregando...</p>';
  const res = await get('turmas');
  if (!res.sucesso || !res.dados.length) {
    container.innerHTML = '<p class="text-xs text-gray-400">Nenhuma turma cadastrada.</p>';
    return;
  }
  container.innerHTML = res.dados.map(t =>
    '<label class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer">'
    + '<input type="checkbox" value="' + t.id_turma + '" '
    + (selecionadas.includes(t.id_turma) ? 'checked' : '')
    + ' class="w-4 h-4 accent-g700">'
    + '<div>'
    + '<span class="text-sm font-medium text-gray-900">' + t.nome + '</span>'
    + '<span class="text-xs text-gray-400 ml-2">' + t.curso + ' — ' + t.ano + '</span>'
    + '</div>'
    + '</label>'
  ).join('');
}

function excluirProjeto(id, nome) {
  confirmarExclusao(nome, async () => {
    const res = await del(`projetos/${id}`);
    res.sucesso
      ? (toast('Projeto excluído!'), carregarProjetos(), carregarDashboard())
      : toast(res.erro || 'Erro', 'err');
  });
}

async function carregarTurmas() {
  const busca = document.getElementById('busca-turmas')?.value || '';
  const res   = await get(`turmas?busca=${encodeURIComponent(busca)}`);
  const el    = document.getElementById('tabela-turmas');
  if (!res.sucesso || !res.dados.length) {
    el.innerHTML = tableWrap(emptyState('Nenhuma turma encontrada')); return;
  }
  el.innerHTML = tableWrap(`<table class="w-full border-collapse">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="${thClass}">Nome</th>
        <th class="${thClass}">Curso</th>
        <th class="${thClass}">Ano</th>
        <th class="${thClass}">Participantes</th>
        <th class="${thClass}">Projetos</th>
        <th class="${thClass}">Ações</th>
      </tr>
    </thead>
    <tbody>${res.dados.map(t => `
      <tr>
        <td class="${tdClass}"><strong>${t.nome}</strong></td>
        <td class="${tdClass}">${t.curso}</td>
        <td class="${tdClass}">${t.ano}</td>
        <td class="${tdClass}">${t.total_participantes || 0}</td>
        <td class="${tdClass}">${t.projetos || '—'}</td>
        <td class="${tdClass}"><div class="flex gap-1">
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-g50" onclick="editarTurma(${t.id_turma})"><i class="bi bi-pencil"></i></button>
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-red-100" onclick="excluirTurma(${t.id_turma},'${t.nome.replace(/'/g,"\\'")}')"><i class="bi bi-trash3"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table>`);
}

function openModalTurma() {
  document.getElementById('titulo-modal-turma').textContent = 'Cadastrar Turma';
  ['turma-id','turma-nome','turma-curso','turma-ano'].forEach(id => document.getElementById(id).value = '');
  openModal('modal-turma');
}

async function editarTurma(id) {
  const res = await get(`turmas/${id}`);
  if (!res.sucesso) return;
  const t = res.dados;
  document.getElementById('titulo-modal-turma').textContent = 'Editar Turma';
  document.getElementById('turma-id').value    = t.id_turma;
  document.getElementById('turma-nome').value  = t.nome;
  document.getElementById('turma-curso').value = t.curso;
  document.getElementById('turma-ano').value   = t.ano;
  openModal('modal-turma');
}

async function salvarTurma() {
  const id    = document.getElementById('turma-id').value;
  const dados = {
    nome:  document.getElementById('turma-nome').value.trim(),
    curso: document.getElementById('turma-curso').value.trim(),
    ano:   document.getElementById('turma-ano').value,
  };
  if (!dados.nome || !dados.curso || !dados.ano) {
    toast('Preencha todos os campos', 'err'); return;
  }
  const res = id
    ? await put(`turmas/${id}`, dados)
    : await post('turmas', dados);
  if (res.sucesso) {
    closeModal('modal-turma');
    toast(id ? 'Turma atualizada!' : 'Turma criada!');
    carregarTurmas();
  } else {
    toast(res.erro || 'Erro', 'err');
  }
}

function excluirTurma(id, nome) {
  confirmarExclusao(nome, async () => {
    const res = await del(`turmas/${id}`);
    res.sucesso
      ? (toast('Turma excluída!'), carregarTurmas())
      : toast(res.erro || 'Erro', 'err');
  });
}

async function carregarEspacos() {
  const busca = document.getElementById('busca-espacos')?.value || '';
  const res   = await get(`espacos?busca=${encodeURIComponent(busca)}`);
  const el    = document.getElementById('tabela-espacos');
  if (!res.sucesso || !res.dados.length) {
    el.innerHTML = tableWrap(emptyState('Nenhum espaço encontrado')); return;
  }
  el.innerHTML = tableWrap(`<table class="w-full border-collapse">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="${thClass}">Nome</th>
        <th class="${thClass}">Tipo</th>
        <th class="${thClass}">Capacidade</th>
        <th class="${thClass}">Status</th>
        <th class="${thClass}">Ações</th>
      </tr>
    </thead>
    <tbody>${res.dados.map(e => `
      <tr>
        <td class="${tdClass}"><strong>${e.nome}</strong></td>
        <td class="${tdClass}">${e.tipo}</td>
        <td class="${tdClass}">${e.capaciade}</td>
        <td class="${tdClass}">${badge(e.status)}</td>
        <td class="${tdClass}"><div class="flex gap-1">
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-g50" onclick="editarEspaco(${e.id_espaco})"><i class="bi bi-pencil"></i></button>
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-red-100" onclick="excluirEspaco(${e.id_espaco},'${e.nome.replace(/'/g,"\\'")}')"><i class="bi bi-trash3"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table>`);
}

function openModalEspaco() {
  document.getElementById('titulo-modal-espaco').textContent = 'Cadastrar Espaço';
  ['espaco-id','esp-nome','esp-cap'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('esp-tipo').value   = 'sala';
  document.getElementById('esp-status').value = 'ativo';
  openModal('modal-espaco');
}

async function editarEspaco(id) {
  const res = await get(`espacos/${id}`);
  if (!res.sucesso) return;
  const e = res.dados;
  document.getElementById('titulo-modal-espaco').textContent = 'Editar Espaço';
  document.getElementById('espaco-id').value  = e.id_espaco;
  document.getElementById('esp-nome').value   = e.nome;
  document.getElementById('esp-tipo').value   = e.tipo;
  document.getElementById('esp-cap').value    = e.capaciade;
  document.getElementById('esp-status').value = e.status;
  openModal('modal-espaco');
}

async function salvarEspaco() {
  const id    = document.getElementById('espaco-id').value;
  const dados = {
    nome:      document.getElementById('esp-nome').value.trim(),
    tipo:      document.getElementById('esp-tipo').value,
    capaciade: document.getElementById('esp-cap').value,
    status:    document.getElementById('esp-status').value,
  };
  if (!dados.nome || !dados.capaciade) {
    toast('Preencha nome e capacidade', 'err'); return;
  }
  const res = id
    ? await put(`espacos/${id}`, dados)
    : await post('espacos', dados);
  if (res.sucesso) {
    closeModal('modal-espaco');
    toast(id ? 'Espaço atualizado!' : 'Espaço criado!');
    carregarEspacos();
    carregarDashboard();
  } else {
    toast(res.erro || 'Erro', 'err');
  }
}

function excluirEspaco(id, nome) {
  confirmarExclusao(nome, async () => {
    const res = await del(`espacos/${id}`);
    res.sucesso
      ? (toast('Espaço excluído!'), carregarEspacos(), carregarDashboard())
      : toast(res.erro || 'Erro', 'err');
  });
}

async function carregarProgramacao() {
  const busca = document.getElementById('busca-prog')?.value || '';
  const res   = await get(`progamacao?busca=${encodeURIComponent(busca)}`);
  const el    = document.getElementById('tabela-programacao');
  if (!res.sucesso || !res.dados.length) {
    el.innerHTML = tableWrap(emptyState('Nenhuma atividade encontrada')); return;
  }
  el.innerHTML = tableWrap(`<table class="w-full border-collapse">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="${thClass}">Horário</th>
        <th class="${thClass}">Atividade</th>
        <th class="${thClass}">Espaço</th>
        <th class="${thClass}">Evento</th>
        <th class="${thClass}">Status</th>
        <th class="${thClass}">Ações</th>
      </tr>
    </thead>
    <tbody>${res.dados.map(p => `
      <tr>
        <td class="${tdClass}">${p.horario}</td>
        <td class="${tdClass}"><strong>${p.atividade}</strong></td>
        <td class="${tdClass}">${p.espaco || '—'}</td>
        <td class="${tdClass}">${p.evento || '—'}</td>
        <td class="${tdClass}">${badge(p.status)}</td>
        <td class="${tdClass}"><div class="flex gap-1">
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-gray-900 border border-gray-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-g50" onclick="editarProgamacao(${p.id_progamacao})"><i class="bi bi-pencil"></i></button>
          <button class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-red-100" onclick="excluirProgamacao(${p.id_progamacao},'${p.atividade.replace(/'/g,"\\'")}')"><i class="bi bi-trash3"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table>`);
}

async function abrirModalProgamacao() {
  document.getElementById('titulo-modal-prog').textContent = 'Adicionar Atividade';
  ['prog-id','prog-horario','prog-atividade'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('prog-status').value = 'agendado';
  await popularSelect('prog-evento', 'eventos', 'id_evento', 'nome');
  await popularSelect('prog-espaco', 'espacos', 'id_espaco', 'nome');
  openModal('modal-progamacao');
}

async function editarProgamacao(id) {
  const res = await get(`progamacao/${id}`);
  if (!res.sucesso) return;
  const p = res.dados;
  document.getElementById('titulo-modal-prog').textContent = 'Editar Atividade';
  document.getElementById('prog-id').value        = p.id_progamacao;
  document.getElementById('prog-horario').value   = p.horario;
  document.getElementById('prog-atividade').value = p.atividade;
  document.getElementById('prog-status').value    = p.status;
  await popularSelect('prog-evento', 'eventos', 'id_evento', 'nome', p.id_evento);
  await popularSelect('prog-espaco', 'espacos', 'id_espaco', 'nome', p.id_espaco);
  openModal('modal-progamacao');
}

async function salvarProgamacao() {
  const id    = document.getElementById('prog-id').value;
  const dados = {
    horario:   document.getElementById('prog-horario').value,
    atividade: document.getElementById('prog-atividade').value.trim(),
    status:    document.getElementById('prog-status').value,
    id_evento: document.getElementById('prog-evento').value,
    id_espaco: document.getElementById('prog-espaco').value,
  };
  if (!dados.horario || !dados.atividade || !dados.id_evento || !dados.id_espaco) {
    toast('Preencha todos os campos obrigatórios', 'err'); return;
  }
  const res = id
    ? await put(`progamacao/${id}`, dados)
    : await post('progamacao', dados);
  if (res.sucesso) {
    closeModal('modal-progamacao');
    toast(id ? 'Atividade atualizada!' : 'Atividade criada!');
    carregarProgramacao();
  } else {
    toast(res.erro || 'Erro', 'err');
  }
}

function excluirProgamacao(id, nome) {
  confirmarExclusao(nome, async () => {
    const res = await del(`progamacao/${id}`);
    res.sucesso
      ? (toast('Atividade excluída!'), carregarProgramacao())
      : toast(res.erro || 'Erro', 'err');
  });
}

async function filtrarRelatorioEventos() {
  const inicio = document.getElementById('rel-data-inicio')?.value || '';
  const fim    = document.getElementById('rel-data-fim')?.value    || '';
  const status = document.getElementById('rel-status')?.value      || '';
  const espaco = document.getElementById('rel-espaco')?.value      || '';

  let ep = 'eventos?';
  if (inicio) ep += 'data_inicio=' + inicio + '&';
  if (fim)    ep += 'data_fim='    + fim    + '&';
  if (status) ep += 'status='      + encodeURIComponent(status) + '&';
  if (espaco) ep += 'id_espaco='   + espaco + '&';

  const res = await get(ep);
  const el  = document.getElementById('tabela-rel-eventos');
  if (!el) return;

  if (!res.sucesso || !res.dados.length) {
    el.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Nenhum evento encontrado.</p>';
    return;
  }

  el.innerHTML = '<div class="overflow-x-auto mt-3">'
    + '<table class="w-full border-collapse text-xs">'
    + '<thead class="bg-g50"><tr>'
    + '<th class="text-left px-3 py-2 font-semibold text-g700 border-b">Nome</th>'
    + '<th class="text-left px-3 py-2 font-semibold text-g700 border-b">Data</th>'
    + '<th class="text-left px-3 py-2 font-semibold text-g700 border-b">Status</th>'
    + '<th class="text-left px-3 py-2 font-semibold text-g700 border-b">Criado por</th>'
    + '</tr></thead><tbody>'
    + res.dados.map(function(e) {
        return '<tr class="border-b border-gray-100 hover:bg-gray-50">'
          + '<td class="px-3 py-2 font-medium">' + e.nome + '</td>'
          + '<td class="px-3 py-2">' + fmt(e.data) + '</td>'
          + '<td class="px-3 py-2">' + badge(e.status) + '</td>'
          + '<td class="px-3 py-2">' + (e.criado_por || '—') + '</td>'
          + '</tr>';
      }).join('')
    + '</tbody></table>'
    + '<p class="text-[10px] text-gray-400 text-right mt-1">Total: ' + res.dados.length + ' evento(s)</p>'
    + '</div>';
}

async function filtrarRelatorioProjetos() {
  const idSelecionado = document.getElementById('rel-projeto-id')?.value || '';
  const busca         = idSelecionado ? '' : (document.getElementById('rel-busca-projeto')?.value || '');
  const turma         = document.getElementById('rel-turma')?.value || '';

  let ep = 'projetos?busca=' + encodeURIComponent(busca);
  if (turma) ep += '&id_turma=' + turma;

  const res = await get(ep);
  const el  = document.getElementById('tabela-rel-projetos');
  if (!el) return;

  var dados = res.dados || [];
  if (idSelecionado) {
    dados = dados.filter(function(p) { return String(p.id_projeto) === String(idSelecionado); });
  }

  if (!res.sucesso || !dados.length) {
    el.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Nenhum projeto encontrado.</p>';
    return;
  }

  el.innerHTML = '<div class="overflow-x-auto mt-3">'
    + '<table class="w-full border-collapse text-xs">'
    + '<thead class="bg-g50"><tr>'
    + '<th class="text-left px-3 py-2 font-semibold text-g700 border-b">Nome</th>'
    + '<th class="text-left px-3 py-2 font-semibold text-g700 border-b">Descrição</th>'
    + '<th class="text-left px-3 py-2 font-semibold text-g700 border-b">Turmas</th>'
    + '</tr></thead><tbody>'
    + dados.map(function(p) {
        return '<tr class="border-b border-gray-100 hover:bg-gray-50">'
          + '<td class="px-3 py-2 font-medium">' + p.nome + '</td>'
          + '<td class="px-3 py-2">' + (p.descricao || '—') + '</td>'
          + '<td class="px-3 py-2">' + (p.turmas || '—') + '</td>'
          + '</tr>';
      }).join('')
    + '</tbody></table>'
    + '<p class="text-[10px] text-gray-400 text-right mt-1">Total: ' + dados.length + ' projeto(s)</p>'
    + '</div>';
}

function gerarPdfEventos() {
  var inicio = document.getElementById('rel-data-inicio')?.value || '';
  var fim    = document.getElementById('rel-data-fim')?.value    || '';
  var status = document.getElementById('rel-status')?.value      || '';
  var espaco = document.getElementById('rel-espaco')?.value      || '';
  window.open(API + '/relatorio/eventos-pdf?data_inicio=' + inicio + '&data_fim=' + fim + '&status=' + encodeURIComponent(status) + '&id_espaco=' + espaco, '_blank');
}

function gerarPdfProjetos() {
  var busca = document.getElementById('rel-busca-projeto')?.value || '';
  var turma = document.getElementById('rel-turma')?.value         || '';
  window.open(API + '/relatorio/projetos-pdf?busca=' + encodeURIComponent(busca) + '&id_turma=' + turma, '_blank');
}

function gerarPdfDashboard() {
  window.open(API + '/relatorio/dashboard-pdf', '_blank');
}

renderCal([]);
carregarDashboard();