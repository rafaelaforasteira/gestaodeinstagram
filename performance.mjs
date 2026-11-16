// Tela Desempenho: métricas que a API de Insights do Instagram (Meta) disponibiliza.
// Na demonstração, os números saem da mesma base da Visão Geral (samples, demoPeriodInsights,
// demoFollowerSnapshot), para que os totais coincidam. Sem fonte conectada, a tela mostra estados vazios.
import { demo, samples, posts, demoPeriodInsights, demoFollowerSnapshot, offsetDay } from "./demo-data.mjs";
import { completeTotal, percentChange } from "./analytics.mjs";
import { renderWidgetHelp } from "./widget-help.mjs";

const number = new Intl.NumberFormat("pt-BR");
const decimal = new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1});
const compactFormat = new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1});
const shortDay = new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",timeZone:"UTC"});
const longDay = new Intl.DateTimeFormat("pt-BR",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"});
const value = v => Number.isFinite(v) ? number.format(v) : "—";
const compact = v => !Number.isFinite(v) ? "—" : Math.abs(v) >= 10000 ? compactFormat.format(v) : number.format(v);
const percent = v => Number.isFinite(v) ? decimal.format(v) + "%" : "—";
const dateOf = day => new Date(day + "T12:00:00Z");

// Tipos de conteúdo como a API agrupa (media_product_type): Reels, Posts (feed + carrossel) e Stories.
const TYPES = [["reels","Reels"],["posts","Posts"],["stories","Stories"]];
const typeOf = format => format === "Reel" ? "reels" : format === "Story" ? "stories" : "posts";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---------- Dados de demonstração ----------
function dailyRows(accountIds, start, end) {
  const rows = new Map();
  for (const sample of samples) {
    if (!accountIds.has(sample.account) || sample.date < start || sample.date > end) continue;
    const row = rows.get(sample.date) ?? {date:sample.date,views:0,reach:0,interactions:0,saves:0,follows:0,unfollows:0,linkTaps:0};
    const age = Math.round((Date.parse(demo.today) - Date.parse(sample.date)) / 86400000);
    const net = sample.account === "casa" ? 4 : 7; // mesmo ritmo de demoFollowerSnapshot
    const lost = 2 + age % 3;
    row.views += sample.views;
    row.reach += sample.reach;
    row.interactions += sample.interactions;
    row.saves += sample.saves;
    row.follows += net + lost;
    row.unfollows += lost;
    row.linkTaps += Math.round(sample.reach * .004);
    rows.set(sample.date,row);
  }
  return [...rows.values()].sort((a,b) => a.date.localeCompare(b.date));
}
const sum = (rows, key) => rows.reduce((total,row) => total + row[key],0);

function periodSummary(accounts, start, end) {
  const ids = new Set(accounts.map(account => account.id));
  const rows = dailyRows(ids,start,end);
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const complete = rows.length === days;
  const insights = key => completeTotal(accounts, account => demoPeriodInsights(account,start,end)[key]);
  const interactions = complete ? sum(rows,"interactions") : null;
  const saves = complete ? sum(rows,"saves") : 0;
  const parts = interactions === null ? null : {
    comments:Math.round(interactions * .06), shares:Math.round(interactions * .09),
    reposts:Math.round(interactions * .02), replies:Math.round(interactions * .03), saves,
  };
  if (parts) parts.likes = interactions - parts.comments - parts.shares - parts.reposts - parts.replies - parts.saves;
  return {
    rows, complete,
    views: complete ? sum(rows,"views") : null,
    reach: insights("reach"),
    engaged: insights("accountsEngaged"),
    interactions, parts,
    follows: complete ? sum(rows,"follows") : null,
    unfollows: complete ? sum(rows,"unfollows") : null,
    linkTaps: complete ? sum(rows,"linkTaps") : null,
    followers: completeTotal(accounts, account => demoFollowerSnapshot(account,end)),
  };
}

const AGES = ["13-17","18-24","25-34","35-44","45-54","55-64","65+"];
const AUDIENCE = {
  aurora:{ages:[2,18,36,24,12,6,2],female:68,cities:[["São Paulo",22],["Rio de Janeiro",11],["Belo Horizonte",7],["Curitiba",5],["Porto Alegre",4]],countries:[["Brasil",91],["Portugal",4],["Estados Unidos",2]]},
  casa:{ages:[1,12,33,29,15,7,3],female:61,cities:[["São Paulo",18],["Campinas",9],["Rio de Janeiro",8],["Florianópolis",6],["Brasília",5]],countries:[["Brasil",94],["Portugal",3],["Argentina",1]]},
  forma:{ages:[3,24,38,20,9,4,2],female:54,cities:[["São Paulo",15],["Belo Horizonte",12],["Recife",7],["Salvador",6],["Goiânia",4]],countries:[["Brasil",89],["Portugal",5],["Angola",2]]},
  "forma-editorial":{ages:[2,27,37,19,9,4,2],female:57,cities:[["Belo Horizonte",14],["São Paulo",13],["Rio de Janeiro",9],["Vitória",5],["Uberlândia",4]],countries:[["Brasil",92],["Portugal",4],["Espanha",1]]},
};
// Seguidores, alcançados e engajados têm perfis parecidos, com leve deslocamento para faixas mais jovens.
function audienceFor(accountId, mode) {
  const base = AUDIENCE[accountId];
  if (!base) return null;
  const shift = {followers:0,reached:1,engaged:2}[mode];
  const ages = base.ages.map((share,index) => Math.max(0,share + (index === 1 ? shift * 2 : index >= 4 ? -shift * .5 : 0)));
  const total = ages.reduce((a,b) => a + b,0);
  return {...base, female:base.female + shift, ages:ages.map(share => share / total * 100)};
}
const onlineHours = Array.from({length:24},(_,hour) =>
  Math.round(8 + 44 * Math.exp(-((hour - 12.5) ** 2) / 10) + 62 * Math.exp(-((hour - 20.5) ** 2) / 6)));

const STORIES = [
  {id:"story-perf-1",account:"aurora",title:"Bastidores do ensaio",format:"Story",offset:0,reach:1840,views:2310,replies:14,exits:212,forward:640,back:88,shares:9,profileVisits:31},
  {id:"story-perf-2",account:"casa",title:"Enquete de texturas",format:"Story",offset:-1,reach:1260,views:1580,replies:22,exits:148,forward:402,back:61,shares:6,profileVisits:18},
  {id:"story-perf-3",account:"forma",title:"Processo no ateliê",format:"Story",offset:-2,reach:540,views:690,replies:5,exits:71,forward:188,back:20,shares:2,profileVisits:7},
];
function mediaRows(accountIds, start, end) {
  const published = posts.filter(post => post.status === "Publicado" && accountIds.has(post.account) &&
    post.date >= start && post.date <= end).map(post => ({...post,
      type:typeOf(post.format), follows:Math.round(post.reach * .003), profileVisits:Math.round(post.reach * .012),
      avgWatch:post.format === "Reel" ? 6 + post.id % 5 * 1.7 : null}));
  const stories = STORIES.map(story => ({...story,date:offsetDay(demo.today,story.offset),type:"stories",
    likes:null,comments:null,saves:null,interactions:story.replies + story.shares}))
    .filter(story => accountIds.has(story.account) && story.date >= start && story.date <= end);
  return [...published,...stories];
}

// ---------- Componentes ----------
function kpi(label, current, previous, {hint, validate, net, icon = "eye", secondary = false} = {}) {
  const card = el("article",secondary ? "perf-kpi perf-kpi-secondary" : "card metric perf-kpi");
  const head = el("div","perf-kpi-head");
  head.setAttribute("data-help-header","");
  const title = el("h3","perf-kpi-label",label);
  title.id = "perf-kpi-" + icon;
  const symbol = el("span","perf-kpi-icon");
  symbol.innerHTML = '<svg aria-hidden="true"><use href="#icon-'+icon+'"/></svg>';
  head.append(symbol,title);
  card.append(head,el("strong","perf-kpi-value",value(current)));
  const change = net ? null : percentChange(current,previous);
  const foot = el("p","perf-kpi-foot");
  if (net) foot.textContent = hint;
  else if (change === null) foot.textContent = "Sem comparação disponível";
  else {
    const chip = el("span","perf-trend",(change > 0 ? "+" : change < 0 ? "−" : "") + decimal.format(Math.abs(change)) + "%");
    chip.dataset.trend = change > 0 ? "up" : change < 0 ? "down" : "flat";
    foot.append(chip,document.createTextNode(" vs. período anterior"));
  }
  card.append(foot);
  if (validate) foot.append(document.createTextNode(" · "),el("span","perf-flag","A validar"));
  return card;
}

function barList(items, {max, format = value, kind} = {}) {
  const top = Math.max(1,max ?? Math.max(1,...items.map(item => item.value ?? 0)));
  const list = el("ul","perf-bars");
  for (const item of items) {
    const row = el("li","perf-bar-row");
    row.append(el("span","perf-bar-label",item.label));
    const track = el("span","perf-bar-track");
    track.setAttribute("aria-hidden","true");
    const fill = el("i","perf-bar-fill");
    fill.style.width = (Math.max(0,item.value ?? 0) / top * 100) + "%";
    if (item.type || kind) fill.dataset.type = item.type ?? kind;
    track.append(fill);
    row.append(track,el("span","perf-bar-value",format(item.value) + (item.share !== undefined ? " · " + percent(item.share) : "")));
    list.append(row);
  }
  return list;
}

function legend(items) {
  const node = el("p","perf-legend");
  for (const [label,type] of items) {
    const item = el("span","");
    const swatch = el("i","perf-swatch");
    swatch.dataset.type = type;
    item.append(swatch,document.createTextNode(label));
    node.append(item);
  }
  return node;
}

function niceMax(v) {
  if (v <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / step) * step;
}

// Série diária com crosshair e tooltip; os mesmos dados ficam numa tabela.
function lineChart(rows, key, label, width, unit = "") {
  const wrap = el("div","perf-chart");
  wrap.tabIndex = 0;
  wrap.setAttribute("role","group");
  wrap.setAttribute("aria-label",label + " por dia. Use as setas para explorar os valores ou abra a tabela abaixo.");
  const W = width, H = 210, L = 46, R = 14, T = 14, B = 28;
  const max = niceMax(Math.max(...rows.map(row => row[key])));
  const x = index => L + (rows.length === 1 ? (W - L - R) / 2 : index / (rows.length - 1) * (W - L - R));
  const y = v => T + (1 - v / max) * (H - T - B);
  const points = rows.map((row,index) => [x(index),y(row[key])]);
  const line = points.map(([px,py],index) => (index ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1)).join("");
  const area = line + "L" + points.at(-1)[0].toFixed(1) + " " + y(0) + "L" + points[0][0].toFixed(1) + " " + y(0) + "Z";
  const grid = [0,.25,.5,.75,1].map(f => '<line class="perf-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(max*f)+'" y2="'+y(max*f)+'"/>' +
    '<text class="perf-axis" x="'+(L-8)+'" y="'+(y(max*f)+4)+'" text-anchor="end">'+compact(max*f)+'</text>').join("");
  const ticks = [...new Set([0,Math.floor((rows.length-1)/2),rows.length-1])].map(index =>
    '<text class="perf-axis" x="'+x(index)+'" y="'+(H-8)+'" text-anchor="'+(index===0?"start":index===rows.length-1?"end":"middle")+'">'+shortDay.format(dateOf(rows[index].date))+'</text>').join("");
  wrap.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+label+' por dia"><g>'+grid+'</g>'+
    '<path class="perf-area" d="'+area+'"/><path class="perf-line" d="'+line+'"/>'+ticks+
    (rows.length === 1 ? '<circle class="perf-dot" r="5" cx="'+points[0][0]+'" cy="'+points[0][1]+'"/>' : '')+
    '<line class="perf-cross" y1="'+T+'" y2="'+(H-B)+'" visibility="hidden"/><circle class="perf-dot perf-active-dot" r="5" visibility="hidden"/>'+
    '<rect class="perf-hit" x="'+L+'" y="'+T+'" width="'+(W-L-R)+'" height="'+(H-T-B)+'"/></svg>';
  const tip = el("div","perf-tip");
  tip.hidden = true;
  wrap.append(tip);
  const svg = wrap.querySelector("svg"), cross = svg.querySelector(".perf-cross"), dot = svg.querySelector(".perf-active-dot");
  let activeIndex = rows.length - 1;
  function show(index) {
    activeIndex = index;
    const [px,py] = points[index];
    cross.setAttribute("x1",px); cross.setAttribute("x2",px); cross.setAttribute("visibility","visible");
    dot.setAttribute("cx",px); dot.setAttribute("cy",py); dot.setAttribute("visibility","visible");
    tip.replaceChildren(el("span","",longDay.format(dateOf(rows[index].date))),el("strong","",value(rows[index][key]) + unit + " " + label.toLowerCase()));
    tip.hidden = false;
    const box = svg.getBoundingClientRect();
    tip.style.left = Math.min(box.width - tip.offsetWidth, Math.max(0,px / W * box.width - tip.offsetWidth / 2)) + "px";
    tip.style.top = Math.max(0,py / H * box.height - tip.offsetHeight - 12) + "px";
  }
  function hide() { tip.hidden = true; cross.setAttribute("visibility","hidden"); dot.setAttribute("visibility","hidden"); }
  wrap.addEventListener("focus",() => show(activeIndex));
  wrap.addEventListener("blur",hide);
  wrap.addEventListener("keydown",event => {
    if (event.target !== wrap) return;
    if (event.key === "Escape") { hide(); return; }
    const index = {ArrowLeft:Math.max(0,activeIndex-1),ArrowRight:Math.min(rows.length-1,activeIndex+1),Home:0,End:rows.length-1}[event.key];
    if (index !== undefined) { event.preventDefault(); show(index); }
  });
  svg.querySelector(".perf-hit").addEventListener("pointermove",event => {
    const box = svg.getBoundingClientRect();
    const vx = (event.clientX - box.left) / box.width * W;
    const index = Math.round((vx - L) / (W - L - R) * (rows.length - 1));
    show(Math.max(0,Math.min(rows.length - 1,index)));
  });
  svg.querySelector(".perf-hit").addEventListener("pointerleave",hide);
  wrap.append(dataTable(rows,[["Dia",row => shortDay.format(dateOf(row.date))],[label,row => value(row[key])]]));
  return wrap;
}

function dataTable(rows, columns, summary = "Ver dados em tabela") {
  const details = el("details","perf-table-details");
  details.append(el("summary","",summary));
  const scroller = el("div","perf-table-scroll scroll-region");
  const table = el("table","perf-table");
  const head = el("tr");
  for (const [title] of columns) head.append(el("th","",title));
  const thead = el("thead"); thead.append(head);
  const tbody = el("tbody");
  for (const row of rows) {
    const tr = el("tr");
    for (const [,read] of columns) tr.append(el("td","",read(row)));
    tbody.append(tr);
  }
  table.append(thead,tbody);
  scroller.append(table);
  details.append(scroller);
  return details;
}

function followersChart(rows, width) {
  const wrap = el("div","perf-chart");
  const W = width, H = 170, L = 46, R = 14, T = 12, B = 26;
  const max = niceMax(Math.max(...rows.map(row => row.follows - row.unfollows),1));
  const band = (W - L - R) / rows.length;
  const bars = rows.map((row,index) => {
    const net = row.follows - row.unfollows;
    const h = Math.max(1,net / max * (H - T - B));
    return '<rect class="perf-col" x="'+(L + index * band + Math.min(2,band*.15)).toFixed(1)+'" y="'+(H - B - h).toFixed(1)+'" width="'+Math.max(1,band - Math.min(4,band*.3)).toFixed(1)+'" height="'+h.toFixed(1)+'" rx="'+Math.min(4,band/3).toFixed(1)+'"><title>'+shortDay.format(dateOf(row.date))+': +'+row.follows+' / −'+row.unfollows+' = '+(net>=0?"+":"")+net+'</title></rect>';
  }).join("");
  const grid = [0,.5,1].map(f => '<line class="perf-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+(T+(1-f)*(H-T-B))+'" y2="'+(T+(1-f)*(H-T-B))+'"/><text class="perf-axis" x="'+(L-8)+'" y="'+(T+(1-f)*(H-T-B)+4)+'" text-anchor="end">'+compact(max*f)+'</text>').join("");
  const ticks = [...new Set([0,rows.length-1])].map(index => '<text class="perf-axis" x="'+(L + index*band + band/2)+'" y="'+(H-8)+'" text-anchor="'+(index?"end":"start")+'">'+shortDay.format(dateOf(rows[index].date))+'</text>').join("");
  wrap.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Saldo de seguidores por dia">'+grid+bars+ticks+'</svg>';
  wrap.append(dataTable(rows,[["Dia",row => shortDay.format(dateOf(row.date))],["Ganhos",row => "+"+value(row.follows)],["Perdidos",row => "−"+value(row.unfollows)],["Saldo",row => value(row.follows-row.unfollows)]]));
  return wrap;
}

function hoursChart(width) {
  const wrap = el("div","perf-chart");
  const W = width, H = 150, L = 8, R = 8, T = 10, B = 24;
  const max = Math.max(...onlineHours);
  const band = (W - L - R) / 24;
  const peak = onlineHours.indexOf(max);
  wrap.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Seguidores online por hora">'+onlineHours.map((v,hour) => {
    const h = v / max * (H - T - B);
    return '<rect class="perf-col'+(hour===peak?' is-peak':'')+'" x="'+(L+hour*band+2).toFixed(1)+'" y="'+(H-B-h).toFixed(1)+'" width="'+(band-4).toFixed(1)+'" height="'+h.toFixed(1)+'" rx="4"><title>'+hour+'h: '+v+'% dos seguidores online</title></rect>';
  }).join("") + [0,6,12,18,23].map(hour => '<text class="perf-axis" x="'+(L+hour*band+band/2)+'" y="'+(H-6)+'" text-anchor="middle">'+hour+'h</text>').join("")+'</svg>';
  wrap.append(el("p","perf-note","Pico às " + peak + "h. Média dos últimos 30 dias, horário de Brasília."));
  return wrap;
}

function empty(message) { return el("p","perf-empty",message); }

// ---------- Tela ----------
let audienceMode = "followers";
let lastArgs;
let drawnWidth = 0;
// Os gráficos são desenhados na largura real da seção, para o texto dos eixos manter 12px.
const chartWidth = node => Math.max(300, Math.round(node.clientWidth || 640));
export function showPerformance() { if (lastArgs) renderPerformance(lastArgs); }
let resizeFrame;
const resize = new ResizeObserver(entries => {
  const width = Math.round(entries[0].contentRect.width);
  if (!width || Math.abs(width - drawnWidth) < 24) return;
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(showPerformance);
});
let contentType = "";
let sortKey = "reach";

export function renderPerformance(args) {
  const {accounts, start, end, isDemo, scopeLabel, onPeriod} = args;
  lastArgs = args;
  const root = document.getElementById("performance-body");
  if (!root) return;
  if (!root.hasAttribute("data-observed")) { resize.observe(root); root.dataset.observed = "true"; }
  if (!root.offsetParent) return; // a tela está oculta; desenha ao abrir
  drawnWidth = root.clientWidth;
  const $ = id => document.getElementById(id);
  const sections = ["perf-overview","perf-views","perf-interactions","perf-followers","perf-audience","perf-content"].map($);
  $("performance-summary").textContent = "Entenda o que cresce, o que engaja e quem acompanha sua marca. " + (isDemo ? "Demonstração · dados fictícios." : "Sem fonte conectada.");
  if (!isDemo || !accounts.length) {
    const message = !accounts.length ? "Nenhuma conta do Instagram conectada para este filtro." : "Conecte uma conta do Instagram para ver as métricas da API da Meta.";
    sections.forEach(section => section.querySelector(".perf-section-body").replaceChildren(empty(message)));
    return;
  }
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const prevEnd = offsetDay(start,-1), prevStart = offsetDay(start,-days);
  const now = periodSummary(accounts,start,end), before = periodSummary(accounts,prevStart,prevEnd);
  const ids = new Set(accounts.map(account => account.id));
  const single = accounts.length === 1 ? accounts[0] : null;
  const shortPeriod = !now.rows.length || !now.complete;
  const periodHint = () => {
    const box = el("div","perf-empty");
    box.append(document.createTextNode("Histórico diário indisponível neste intervalo. "));
    const button = el("button","ac-button","Ver últimos 30 dias");
    button.type = "button";
    button.addEventListener("click",() => onPeriod("30"));
    box.append(button);
    return box;
  };

  // 1. Visão geral
  const kpis = el("div","perf-kpis");
  kpis.append(
    kpi("Alcance",now.reach,before.reach,{icon:"users-round"}),
    kpi("Visualizações",now.views,before.views),
    kpi("Interações",now.interactions,before.interactions,{icon:"heart"}),
    kpi("Seguidores",now.followers,null,{icon:"user-round-plus",net:true,hint:now.follows === null ? "Sem histórico suficiente" :
      (now.follows - now.unfollows >= 0 ? "+" : "−") + value(Math.abs(now.follows - now.unfollows)) + " no período"}),
  );
  const secondary = el("div","perf-secondary-metrics");
  secondary.append(kpi("Contas com engajamento",now.engaged,before.engaged,{secondary:true,icon:"pulse"}),
    kpi("Toques em links do perfil",now.linkTaps,before.linkTaps,{secondary:true,icon:"link-2",validate:true}));
  const overviewBody = sections[0].querySelector(".perf-section-body");
  overviewBody.replaceChildren(kpis,secondary);
  if (accounts.length > 1) overviewBody.append(el("p","perf-note","Soma das " + accounts.length + " contas. Alcance e engajamento podem contar a mesma pessoa em mais de uma conta."));

  // 2. Visualizações
  const viewsBody = sections[1].querySelector(".perf-section-body");
  const viewTypes = {reels:Math.round(now.views * .52),posts:Math.round(now.views * .31)};
  viewTypes.stories = now.views - viewTypes.reels - viewTypes.posts;
  const fromFollowers = Math.round(now.views * .41);
  const split = el("div","perf-split");
  const followerBlock = el("div","perf-block");
  followerBlock.append(el("h3","","Seguidores e não seguidores"));
  const stack = el("div","perf-stack");
  stack.setAttribute("role","img");
  stack.setAttribute("aria-label","Seguidores " + percent(41) + ", não seguidores " + percent(59));
  for (const [label,share,type] of [["Seguidores",41,"followers"],["Não seguidores",59,"others"]]) {
    const part = el("span","perf-stack-part");
    part.style.flexGrow = share;
    part.dataset.type = type;
    stack.append(part);
  }
  followerBlock.append(stack,barList([{label:"Seguidores",value:fromFollowers,share:41,type:"followers"},{label:"Não seguidores",value:now.views - fromFollowers,share:59,type:"others"}],{max:now.views}));
  const typeBlock = el("div","perf-block");
  typeBlock.append(el("h3","","Por tipo de conteúdo"),barList(TYPES.map(([key,label]) => ({label,value:viewTypes[key],share:viewTypes[key] / now.views * 100,type:key})),{max:now.views}));
  split.append(followerBlock,typeBlock);
  const evolution = el("div","perf-evolution");
  const evolutionHead = el("div","perf-evolution-head");
  const evolutionMetric = el("div");
  evolutionMetric.append(el("span","perf-eyebrow","Visualizações no período"),el("strong","perf-evolution-value",value(now.views)));
  evolutionHead.append(evolutionMetric,el("span","perf-note",days === 1 ? "1 dia selecionado" : days + " dias selecionados"));
  evolution.append(evolutionHead,shortPeriod ? periodHint() : lineChart(now.rows,"views","Visualizações",Math.max(280,Math.round(chartWidth(viewsBody)*.64))));
  split.classList.add("perf-view-breakdown");
  viewsBody.replaceChildren(...(now.views === null ? [periodHint()] : [evolution,split]));

  // 3. Interações
  const interactionsBody = sections[2].querySelector(".perf-section-body");
  const actions = [["Curtidas","likes"],["Comentários","comments"],["Salvamentos","saves"],["Compartilhamentos","shares"],["Reposts","reposts"],["Respostas a Stories","replies"]];
  const interSplit = el("div","perf-split");
  const actionBlock = el("div","perf-block");
  actionBlock.append(el("h3","","Por tipo de interação"),barList(actions.map(([label,key]) => ({label,value:now.parts?.[key] ?? null,share:now.interactions > 0 ? now.parts[key] / now.interactions * 100 : undefined})),{kind:"main"}));
  const interTypes = {reels:Math.round(now.interactions * .55),posts:Math.round(now.interactions * .35)};
  interTypes.stories = now.interactions - interTypes.reels - interTypes.posts;
  const interTypeBlock = el("div","perf-block");
  interTypeBlock.append(el("h3","","Por tipo de conteúdo"),barList(TYPES.map(([key,label]) => ({label,value:interTypes[key],share:interTypes[key] / now.interactions * 100,type:key})),{max:now.interactions}),
    el("p","perf-note","Taxa de interação: " + percent(now.interactions / sum(now.rows,"reach") * 100) + " (interações ÷ alcance diário somado)."));
  interSplit.append(actionBlock,interTypeBlock);
  interactionsBody.replaceChildren(now.interactions === null ? empty("Interações indisponíveis para este intervalo. Tente um período com cobertura completa.") : interSplit);

  // 4. Seguidores
  const followersBody = sections[3].querySelector(".perf-section-body");
  const stats = el("dl","perf-stats");
  for (const [label,v] of [["Total atual",value(now.followers)],["Ganhos",now.follows === null ? "—" : "+" + value(now.follows)],["Perdidos",now.unfollows === null ? "—" : "−" + value(now.unfollows)],["Saldo",now.follows === null ? "—" : (now.follows - now.unfollows >= 0 ? "+" : "−") + value(Math.abs(now.follows - now.unfollows))]]) {
    const item = el("div"); item.append(el("dt","",label),el("dd","",v)); stats.append(item);
  }
  followersBody.replaceChildren(stats,shortPeriod ? periodHint() : followersChart(now.rows,chartWidth(followersBody)),
    el("p","perf-note","Ganhos e perdidos só são informados pela API para contas com 100 seguidores ou mais."));

  // 5. Público
  const audienceBody = sections[4].querySelector(".perf-section-body");
  if (!single) {
    const prompt = el("div","perf-audience-prompt");
    const copy = el("div");
    copy.append(el("h3","","Conheça o público de cada conta"),el("p","perf-note","Escolha uma conta para explorar idade, gênero, localização e horários ativos."));
    const choices = el("div","perf-account-choices");
    for (const account of accounts) {
      const button = el("button","button",account.name);
      button.type = "button";
      button.addEventListener("click",() => { args.onAccount(account.id); document.querySelector('#perf-audience [aria-checked=true]')?.focus(); });
      choices.append(button);
    }
    prompt.append(copy,choices);
    audienceBody.replaceChildren(prompt,el("p","perf-note","Dados demográficos de contas diferentes são analisados separadamente."));
  }
  else {
    const data = audienceFor(single.id,audienceMode);
    const modes = el("div","ac-tabs");
    modes.setAttribute("role","radiogroup");
    modes.setAttribute("aria-label","Público analisado");
    for (const [key,label] of [["followers","Seguidores"],["reached","Alcançados"],["engaged","Engajados"]]) {
      const button = el("button","",label);
      button.type = "button";
      button.setAttribute("role","radio");
      button.setAttribute("aria-checked",String(audienceMode === key));
      button.addEventListener("click",() => { audienceMode = key; renderPerformance(lastArgs); document.querySelector('#perf-audience [role=radio][aria-checked=true]')?.focus(); });
      modes.append(button);
    }
    const ageBlock = el("div","perf-block");
    ageBlock.append(el("h3","","Idade e gênero"),legend([["Mulheres","main"],["Homens","others"]]));
    const ages = el("ul","perf-ages");
    data.ages.forEach((share,index) => {
      const row = el("li");
      row.append(el("span","perf-bar-label",AGES[index]));
      const pair = el("span","perf-age-bars");
      for (const [type,part] of [["main",share * data.female / 100],["others",share * (97 - data.female) / 100]]) {
        const bar = el("i","perf-bar-fill");
        bar.dataset.type = type;
        bar.style.width = (part / 25 * 100) + "%";
        bar.title = (type === "main" ? "Mulheres " : "Homens ") + AGES[index] + ": " + percent(part);
        pair.append(bar);
      }
      row.append(pair,el("span","perf-bar-value",percent(share)));
      ages.append(row);
    });
    ageBlock.append(ages,el("p","perf-note","Mulheres " + percent(data.female) + " · Homens " + percent(97 - data.female) + " · Não informado 3%"));
    const placeBlock = el("div","perf-block");
    placeBlock.append(el("h3","","Principais cidades"),barList(data.cities.map(([label,share]) => ({label,value:share})),{max:data.cities[0][1],format:percent,kind:"main"}),
      el("h3","","Principais países"),barList(data.countries.map(([label,share]) => ({label,value:share})),{max:100,format:percent,kind:"main"}));
    const hourBlock = el("div","perf-block perf-wide");
    const hourHead = el("h3","","Horários em que os seguidores estão online");
    hourHead.append(el("span","perf-flag","A validar"));
    hourBlock.append(hourHead,hoursChart(chartWidth(audienceBody) > 1060 ? Math.max(280,Math.round(chartWidth(audienceBody)/3)-48) : chartWidth(audienceBody)-32));
    const audienceGrid = el("div","perf-split perf-audience-grid");
    audienceGrid.append(ageBlock,placeBlock,hourBlock);
    audienceBody.replaceChildren(modes,audienceGrid,el("p","perf-note","Dados demográficos exigem conta com 100 seguidores ou mais. Conta: " + single.name + "."));
  }

  // 6. Conteúdos
  const contentBody = sections[5].querySelector(".perf-section-body");
  const media = mediaRows(ids,start,end).filter(item => !contentType || item.type === contentType)
    .sort((a,b) => (b[sortKey] ?? -1) - (a[sortKey] ?? -1));
  const typeTabs = el("div","ac-tabs");
  typeTabs.setAttribute("role","radiogroup");
  typeTabs.setAttribute("aria-label","Tipo de conteúdo");
  for (const [key,label] of [["","Todos"],...TYPES]) {
    const button = el("button","",label);
    button.type = "button";
    button.setAttribute("role","radio");
    button.setAttribute("aria-checked",String(contentType === key));
    button.addEventListener("click",() => { contentType = key; renderPerformance(lastArgs); document.querySelector('#perf-content [role=radio][aria-checked=true]')?.focus(); });
    typeTabs.append(button);
  }
  const columns = [["reach","Alcance"],["views","Visualizações"],["likes","Curtidas"],["comments","Comentários"],["saves","Salvamentos"],["shares","Compart."],["interactions","Interações"],["profileVisits","Visitas ao perfil"]];
  const toolbar = el("div","perf-content-toolbar");
  const order = el("label","perf-order","Ordenar por");
  const select = el("select");
  select.setAttribute("aria-label","Ordenar publicações por");
  for (const [key,label] of columns) {
    const option = el("option","",label);
    option.value = key;
    option.selected = sortKey === key;
    select.append(option);
  }
  select.addEventListener("change",() => { sortKey = select.value; renderPerformance(lastArgs); document.querySelector(".perf-order select")?.focus(); });
  order.append(select);
  toolbar.append(typeTabs,order);
  const scroller = el("div","perf-table-scroll scroll-region");
  scroller.tabIndex = 0;
  scroller.setAttribute("role","region");
  scroller.setAttribute("aria-label","Métricas por publicação");
  const table = el("table","perf-table perf-media");
  const headRow = el("tr");
  headRow.append(el("th","","Publicação"),el("th","","Tipo"));
  for (const [key,label] of columns) {
    const th = el("th");
    th.setAttribute("aria-sort",sortKey === key ? "descending" : "none");
    const button = el("button","perf-sort",label + (sortKey === key ? " ↓" : ""));
    button.type = "button";
    button.addEventListener("click",() => { sortKey = key; renderPerformance(lastArgs); document.querySelector('#perf-content th[aria-sort=descending] button')?.focus(); });
    th.append(button);
    headRow.append(th);
  }
  headRow.append(el("th","","Detalhe do formato"));
  const thead = el("thead"); thead.append(headRow);
  const tbody = el("tbody");
  for (const item of media) {
    const tr = el("tr");
    const titleCell = el("td","perf-media-title");
    titleCell.append(el("strong","",item.title),el("small","",shortDay.format(dateOf(item.date)) + " · " + (accounts.find(account => account.id === item.account)?.name ?? "")));
    const typeCell = el("td");
    const tag = el("span","perf-type",TYPES.find(([key]) => key === item.type)[1]);
    tag.dataset.type = item.type;
    typeCell.append(tag);
    titleCell.dataset.label = "Publicação";
    typeCell.dataset.label = "Tipo";
    tr.append(titleCell,typeCell);
    for (const [key,label] of columns) {
      const cell = el("td","perf-num",item[key] === null || item[key] === undefined ? "—" : value(item[key]));
      cell.dataset.label = label;
      tr.append(cell);
    }
    tr.append(el("td","perf-extra",item.type === "reels" ? "Tempo médio assistido: " + decimal.format(item.avgWatch) + " s · Novos seguidores: " + value(item.follows) :
      item.type === "stories" ? "Respostas: " + item.replies + " · Avançou: " + item.forward + " · Voltou: " + item.back + " · Saiu: " + item.exits :
      "Novos seguidores: " + value(item.follows)));
    tr.lastElementChild.dataset.label = "Detalhe do formato";
    tbody.append(tr);
  }
  table.append(thead,tbody);
  scroller.append(table);
  contentBody.replaceChildren(toolbar,media.length ? scroller : empty("Nenhuma publicação deste tipo no período selecionado."),
    el("p","perf-note","Demonstração · Métricas acumuladas por publicação na data-base. Curtidas, comentários e salvamentos não se aplicam a Stories (—)."));
  renderWidgetHelp(isDemo);
}
