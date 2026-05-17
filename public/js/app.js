const API = '/sistema-de-gestao-e-evento/public/index.php';

async function api(ep, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${API}/${ep}`, opts);
    return await res.json();
  } catch {
    return { sucesso: false, erro: 'Erro de conexão' };
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
  const d = res.dados;

  document.getElementById('card-eventos').textContent       = d.totais.eventos;
  document.getElementById('card-participantes').textContent = d.totais.participantes;
  document.getElementById('card-projetos').textContent      = d.totais.projetos;
  document.getElementById('card-espacos').textContent       = d.totais.espacos;

  const lista = document.getElementById('proximos-lista');
  if (!d.proximos_eventos?.length) {
    lista.innerHTML = emptyState('Nenhum evento cadastrado');
  } else {
    lista.innerHTML = d.proximos_eventos.map(e => `
      <div class="flex items-center gap-2.5 py-[9px] border-b border-gray-100 last:border-0">
        <div class="w-1.5 h-1.5 rounded-full bg-g500 shrink-0"></div>
        <div class="text-sm font-medium flex-1">${e.nome}</div>
        <div class="text-[11px] text-gray-500 mr-1.5">${fmt(e.data)}</div>
        ${badge(e.status)}
      </div>`).join('');
  }

  renderCal(d.dias_com_eventos || []);

  const ps = d.por_status || {};
  document.getElementById('rel-encerrado').textContent = ps.encerrado || 0;
  document.getElementById('rel-ativo').textContent     = ps.ativo     || 0;
  document.getElementById('rel-rascunho').textContent  = ps.rascunho  || 0;
  document.getElementById('rel-cancelado').textContent = ps.cancelado || 0;
}

async function carregarRelatorios() { await carregarDashboard(); }

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

async function openModalEvento() {
  document.getElementById('titulo-modal-evento').textContent = 'Criar Evento';
  document.getElementById('evento-id').value     = '';
  document.getElementById('evento-nome').value   = '';
  document.getElementById('evento-data').value   = '';
  document.getElementById('evento-status').value = 'rascunho';
  await popularSelect('evento-usuario', 'usuarios', 'id_usuario', 'nome');
  openModal('modal-evento');
}

async function editarEvento(id) {
  const res = await get(`eventos/${id}`);
  if (!res.sucesso) { toast('Erro ao carregar evento', 'err'); return; }
  const e = res.dados;
  document.getElementById('titulo-modal-evento').textContent = 'Editar Evento';
  document.getElementById('evento-id').value     = e.id_evento;
  document.getElementById('evento-nome').value   = e.nome;
  document.getElementById('evento-data').value   = e.data;
  document.getElementById('evento-status').value = e.status;
  await popularSelect('evento-usuario', 'usuarios', 'id_usuario', 'nome', e.id_usuario_criado);
  openModal('modal-evento');
}

async function salvarEvento() {
  const id    = document.getElementById('evento-id').value;
  const dados = {
    nome:              document.getElementById('evento-nome').value.trim(),
    data:              document.getElementById('evento-data').value,
    status:            document.getElementById('evento-status').value,
    id_usuario_criado: document.getElementById('evento-usuario').value,
  };
  if (!dados.nome || !dados.data || !dados.id_usuario_criado) {
    toast('Preencha todos os campos obrigatórios', 'err'); return;
  }
  const res = id
    ? await put(`eventos/${id}`, dados)
    : await post('eventos', dados);
  if (res.sucesso) {
    closeModal('modal-evento');
    toast(id ? 'Evento atualizado!' : 'Evento criado!');
    carregarEventos();
    carregarDashboard();
  } else {
    toast(res.erro || 'Erro ao salvar', 'err');
  }
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

function openModalProjeto() {
  document.getElementById('titulo-modal-projeto').textContent = 'Cadastrar Projeto';
  document.getElementById('projeto-id').value = '';
  document.getElementById('proj-nome').value  = '';
  document.getElementById('proj-desc').value  = '';
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
  if (res.sucesso) {
    closeModal('modal-projeto');
    toast(id ? 'Projeto atualizado!' : 'Projeto criado!');
    carregarProjetos();
    carregarDashboard();
  } else {
    toast(res.erro || 'Erro', 'err');
  }
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

renderCal([]);
carregarDashboard();