import { demo, demoFollowerSnapshot, demoPeriodInsights, demoSchedules, offsetDay, samples, posts } from "./demo-data.mjs";
import { completeTotal, percentChange, selectPeriods, selectScheduledPosts, sum } from "./analytics.mjs";

const $ = (id) => document.getElementById(id);
const number = new Intl.NumberFormat("pt-BR");
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat("pt-BR", {day:"2-digit", month:"2-digit", timeZone:"UTC"});
const timezone = demo.timezone;
const query = new URLSearchParams(location.search);
const isDemo = query.get("demo") === "1";
const icon = (name) => '<svg aria-hidden="true"><use href="#icon-' + name + '"/></svg>';
const empty = (message) => '<p class="empty">' + message + '</p>';
const formatDate = (value) => shortDate.format(new Date(value + "T12:00:00Z"));
const dateKey = new Intl.DateTimeFormat("sv-SE", {timeZone: timezone});
const today = isDemo ? demo.today : dateKey.format(new Date());
const calendarMin = offsetDay(today,-89);
const calendarMax = isDemo ? demoSchedules.reduce((latest, post) => {
  const day = dateKey.format(new Date(post.scheduledAt));
  return day > latest ? day : latest;
},today) : today;
const workspaces = isDemo ? demo.workspaces : [];
let page = 1;
let activity = [];
const pageSize = 5;
const statusText = { Publicado:"Publicação realizada", Agendado:"Agendamento criado", Falha:"Falha no processamento", Rascunho:"Rascunho atualizado" };
const accountName = (id) => demo.accounts.find((account) => account.id === id)?.name ?? "Conta indisponível";
const activeWorkspace = workspaces.find(({id}) => id === query.get("workspace")) ?? workspaces[0];
const scopedAccounts = isDemo ? demo.accounts.filter(({workspace}) => workspace === activeWorkspace?.id) : [];
const defaultFilters = { account:"all", period:"30", start:offsetDay(today,-29), end:today };
const requestedAccount = query.get("account");
const requestedPeriod = query.get("period");
let appliedFilters = {
  account: scopedAccounts.some(({id}) => id === requestedAccount) ? requestedAccount : "all",
  period: ["today","yesterday","7","30","90","custom"].includes(requestedPeriod) ? requestedPeriod : "30",
  start: query.get("start") ?? defaultFilters.start,
  end: query.get("end") ?? defaultFilters.end,
};

function range({period, start, end}) {
  if (period === "today") return {start:today,end:today};
  if (period === "yesterday") {
    const yesterday = offsetDay(today,-1);
    return {start:yesterday,end:yesterday};
  }
  if (period === "custom") {
    const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
    if (!validDate(start) || !validDate(end) || start > end || start < calendarMin ||
      end > calendarMax || end > offsetDay(start,89)) return null;
    return { start, end };
  }
  return { start: offsetDay(today, 1 - Number(period)), end: today };
}
if (!range(appliedFilters)) appliedFilters = { ...defaultFilters, account:appliedFilters.account };

function getData(start, end) {
  const accounts = scopedAccounts.filter(({id}) => appliedFilters.account === "all" || appliedFilters.account === id);
  const accountIds = new Set(accounts.map(({id}) => id));
  const belongs = ({account}) => accountIds.has(account);
  const within = ({date}) => date >= start && date <= end;
  const allPosts = posts.filter(belongs);
  return {
    accounts, allPosts, start, end,
    ...selectPeriods(samples, accountIds, start, end),
    activity: allPosts.filter(within).sort((a,b) => (b.date+b.hour).localeCompare(a.date+a.hour)),
  };
}

const valueText = (value, suffix = "") => value === null ? "—" : (suffix ? decimal.format(value) : number.format(value)) + suffix;

/** @param {{title:string,symbol:string,description:string,value:number|null,change:number|null,net?:boolean,note?:string,status?:string}} kpi */
function metric({title,symbol,description,value,change,net=false,note="",status="ready"}) {
  const id = "kpi-" + symbol;
  const signed = change > 0 ? "+" : change < 0 ? "−" : "";
  const label = change === null ? "Sem comparação disponível" :
    signed + (net ? number : decimal).format(Math.abs(change)) + (net ? "" : "%");
  const comparison = value === null ? (status === "disconnected" ? "Conecte o Instagram" :
    status === "error" ? "Falha na sincronização" : "Dados indisponíveis") :
    '<span class="trend ' + (change < 0 ? "down" : change > 0 ? "" : "neutral") + '">' + label + '</span>' +
    (change === null ? "" : '<span>' + (net ? "no período selecionado" : "vs. período anterior") + '</span>');
  return '<article class="card metric" aria-labelledby="' + id + '" aria-busy="' + (status === "loading") +
    '"><div class="kpi-heading">' + icon(symbol) + '<h3 id="' + id + '">' + title +
    '</h3><span class="kpi-help"><button type="button" aria-label="Sobre ' + title +
    '" aria-describedby="' + id + '-help">?</button><span role="tooltip" id="' + id + '-help">' + description + (note ? " " + note : "") +
    '</span></span></div><p class="value">' + (status === "loading" ? '<span class="kpi-skeleton" aria-label="Carregando"></span>' :
    valueText(value)) + '</p><div class="kpi-comparison muted">' + (status === "loading" ? "Carregando dados…" : comparison) +
    '</div></article>';
}

function renderKpis({accounts,start,end,previousStart,current,previous,length}) {
  const period = (key, from, to) => isDemo && to <= today ? completeTotal(accounts,
    (account) => demoPeriodInsights(account,from,to)[key]) : null;
  const views = (rows) => completeTotal(accounts, ({id}) => {
    const own = rows.filter(({account}) => account === id);
    return new Set(own.map(({date}) => date)).size === length && own.length === length &&
      own.every(({views}) => Number.isFinite(views) && views >= 0) ? sum(own,"views") : null;
  });
  const snapshot = (date) => isDemo ? completeTotal(accounts, (account) => demoFollowerSnapshot(account,date)) : null;
  const previousEnd = offsetDay(start,-1);
  const reach = period("reach",start,end), engaged = period("accountsEngaged",start,end);
  const currentViews = views(current), followers = snapshot(today);
  const baseline = snapshot(previousEnd), closing = snapshot(end);
  const overlap = accounts.length > 1 ? "Soma por perfil; pode incluir as mesmas contas." : "";
  const status = accounts.length ? "ready" : "disconnected";
  $("metrics").innerHTML = [
    {title:"Alcance",symbol:"users-round",value:reach,change:percentChange(reach,period("reach",previousStart,previousEnd)),
      note:overlap,description:"Quantidade de contas alcançadas pelos conteúdos no período selecionado."},
    {title:"Views",symbol:"eye",value:currentViews,change:percentChange(currentViews,views(previous)),
      description:"Quantidade de visualizações registradas no período, incluindo visualizações repetidas quando aplicável."},
    {title:"Engajados",symbol:"heart",value:engaged,change:percentChange(engaged,period("accountsEngaged",previousStart,previousEnd)),
      note:overlap,description:"Quantidade de contas que realizaram interações com o conteúdo no período, conforme a definição da API."},
    {title:"Seguidores",symbol:"user-round-plus",value:followers,change:baseline === null || closing === null ? null : closing - baseline,
      net:true,note:accounts.length > 1 ? "Total atual dos perfis selecionados." : "",description:"Quantidade atual de seguidores e variação líquida no período, quando houver dados históricos suficientes."},
  ].map((kpi) => metric({...kpi,status})).join("");
}

function renderAnalytics(data) {
  renderKpis(data);
}

const weekdayLabels = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const editorialMonth = new Intl.DateTimeFormat("pt-BR",{month:"short",year:"numeric",timeZone:"UTC"});
const editorialDate = new Intl.DateTimeFormat("pt-BR",{dateStyle:"full",timeZone:"UTC"});
let heatmapObserver;
function renderConsistency(data) {
  heatmapObserver?.disconnect();
  const root = $("consistency");
  root.replaceChildren();
  if (!data.accounts.length) {
    root.append(scheduleElement("p","empty","Conecte uma conta do Instagram para acompanhar a consistência editorial."));
    return;
  }
  const published = [...new Map(data.allPosts.filter(post => post.status === "Publicado").map(post => [post.id,post])).values()];
  const contextStart = offsetDay(data.end,-370);
  const occurrences = selectScheduledPosts(demoSchedules,new Set(data.accounts.map(({id}) => id)),contextStart,calendarMax,timezone);
  const days = new Map();
  for (let day = contextStart; day <= calendarMax; day = offsetDay(day,1)) {
    days.set(day,{published:[],planned:[],failed:[],scheduledCount:0});
  }
  for (const post of published) days.get(post.date)?.published.push(post);
  for (const post of occurrences) {
    const day = days.get(post.day);
    day.scheduledCount++;
    if (post.status === "Agendado") day.planned.push(post);
    if (post.status === "Falha") day.failed.push(post);
  }
  const filteredDays = [...days.keys()].filter(day => day >= data.start && day <= data.end);
  const values = filteredDays.map(day => days.get(day));
  const viewport = scheduleElement("div","heatmap-scroll");
  const grid = scheduleElement("div","heatmap");
  const offset = day => (new Date(day+"T12:00:00Z").getUTCDay()+6)%7;
  const selectedFirst = offsetDay(data.start,-offset(data.start));
  const last = offsetDay(data.end,6-offset(data.end));
  const lastWeek = offsetDay(last,-6);
  const selectedWeeks = Math.round((Date.parse(lastWeek)-Date.parse(selectedFirst))/604800000)+1;
  const tooltip = scheduleElement("div","heat-tooltip");
  tooltip.id = "editorial-day-detail";
  tooltip.setAttribute("popover","manual");
  tooltip.setAttribute("role","tooltip");
  function hideTooltip() {
    if (tooltip.matches(":popover-open")) tooltip.hidePopover();
  }
  function showTooltip(cell, detail) {
    tooltip.textContent = detail;
    if (!tooltip.matches(":popover-open")) tooltip.showPopover();
    const box = cell.getBoundingClientRect();
    const left = Math.max(8,Math.min(innerWidth-tooltip.offsetWidth-8,box.left));
    const top = box.top >= tooltip.offsetHeight+12 ? box.top-tooltip.offsetHeight-7 : box.bottom+7;
    tooltip.style.left = left+"px";
    tooltip.style.top = Math.max(8,Math.min(innerHeight-tooltip.offsetHeight-8,top))+"px";
  }
  viewport.addEventListener("scroll",hideTooltip,{passive:true});
  let visibleWeeks;
  function drawWeeks() {
    const available = Math.floor((viewport.clientWidth-34)/15);
    const count = Math.max(selectedWeeks,Math.min(52,available));
    if (count === visibleWeeks) return;
    visibleWeeks = count;
    hideTooltip();
    grid.replaceChildren();
    const first = offsetDay(lastWeek,-7*(count-1));
    const labels = scheduleElement("div","heat-week");
    labels.append(document.createElement("span"),...weekdayLabels.map(label => scheduleElement("span","heat-label",label)));
    grid.append(labels);
    let week, lastMonth;
    const cells = new Map();
    for (let day = first; day <= last; day = offsetDay(day,1)) {
      if (!offset(day)) {
        week = scheduleElement("div","heat-week");
        const monthDay = day === first ? day : offsetDay(day,6);
        const month = monthDay.slice(0,7);
        const showMonth = lastMonth !== month;
        lastMonth = month;
        week.append(scheduleElement("span","heat-month",showMonth ? editorialMonth.format(new Date(monthDay+"T12:00:00Z")).split(" ")[0] : ""));
        grid.append(week);
      }
      const entry = days.get(day) ?? {published:[],planned:[],failed:[],scheduledCount:0};
      const selected = day >= data.start && day <= data.end;
      const date = editorialDate.format(new Date(day+"T12:00:00Z"));
      const hasHistory = day <= today && (selected || entry.published.length > 0);
      const scope = data.accounts.length === 1 ? data.accounts[0].name : "Todas as contas";
      const realized = entry.published.length === 1 ? "1 publicação realizada" : entry.published.length + " publicações realizadas";
      const detail = date + " · " + (hasHistory ? realized : "Histórico indisponível") +
        " · " + entry.planned.length + " agendadas · " + entry.failed.length + " falhas" +
        (hasHistory && entry.scheduledCount ? " · " + entry.scheduledCount + " na programação original" : "") +
        " · " + scope + (selected ? "" : " · Fora do período selecionado");
      const cell = scheduleElement("button","heat-cell");
      cell.type = "button";
      cell.dataset.date = day;
      cell.tabIndex = day === data.start ? 0 : -1;
      cell.dataset.level = hasHistory ? Math.min(entry.published.length,4) : "unknown";
      cell.setAttribute("aria-label",detail);
      if (day === today) cell.setAttribute("aria-current","date");
      cell.classList.toggle("heat-context",!selected);
      if (entry.planned.length) cell.classList.add("heat-planned");
      for (const event of ["focus","pointerenter"]) cell.addEventListener(event,() => showTooltip(cell,detail));
      for (const event of ["blur","pointerleave"]) cell.addEventListener(event,hideTooltip);
      cell.addEventListener("click",() => {
        hideTooltip();
        const posts = [...entry.published,...entry.planned,...entry.failed];
        openDialog(date,posts.length ? posts.map(post => post.status+" · "+post.title+" · "+accountName(post.account)) :
          [hasHistory ? "Nenhuma publicação registrada neste dia." : "Histórico indisponível para este dia."]);
      });
      cell.addEventListener("keydown",event => {
        if (event.key === "Escape") hideTooltip();
        const step = {ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1}[event.key];
        if (step === undefined) return;
        event.preventDefault();
        const next = cells.get(offsetDay(day,step));
        if (next) {
          cell.tabIndex = -1;
          next.tabIndex = 0;
          next.focus();
        }
      });
      cells.set(day,cell);
      week.append(cell);
    }
    viewport.scrollLeft = count > available ? 0 : viewport.scrollWidth;
  }
  viewport.append(grid);
  root.append(viewport,tooltip);
  drawWeeks();
  heatmapObserver = new ResizeObserver(drawWeeks);
  heatmapObserver.observe(viewport);
  if (!values.some(day => day.published.length) && data.start <= today) root.append(scheduleElement("p","muted","Nenhuma publicação registrada neste período."));
}

function renderEditorial(data) {
  renderConsistency(data);
  const ranked = data.activity.filter(({status,cover}) => status === "Publicado" && cover).sort((a,b) => b.reach-a.reach).slice(0,2);
  $("featured").innerHTML = ranked.length ? '<div class="featured">' + ranked.map((post) =>
    '<button class="creative" data-post="' + post.id + '"><img class="creative-cover" src="./' + post.cover +
    '.svg" alt=""><span class="creative-text"><strong>' + post.title + '</strong><small>' + post.format + ' · ' +
    number.format(post.reach) + ' de alcance</small></span></button>').join("") + '</div>' : empty("Sem conteúdos classificados neste período.");
  const upcoming = data.allPosts.filter(({scheduled}) => scheduled > today).sort((a,b) => a.scheduled.localeCompare(b.scheduled));
  const failures = data.activity.filter(({status}) => status === "Falha");
  $("upcoming").innerHTML = upcoming.length ? '<ul class="detail-list">' + upcoming.map((post) =>
    '<li><button class="button" data-post="' + post.id + '">' + formatDate(post.scheduled) + ' · ' + post.title + '</button></li>').join("") +
    '</ul><p class="muted">Agenda futura da conta selecionada.</p>' : empty("Nenhuma publicação futura disponível.");
  $("alerts").innerHTML = failures.length ? '<ul class="detail-list">' + failures.map((post) =>
    '<li><button class="button" data-post="' + post.id + '">Revisar ' + post.title + '</button></li>').join("") +
    '</ul>' : empty(isDemo ? "Nenhuma falha neste período." : "Dados operacionais indisponíveis.");
  const priorReach = sum(data.previous,"reach");
  const delta = priorReach ? (sum(data.current,"reach") / priorReach - 1)*100 : null;
  $("insights").innerHTML = data.current.length ? '<ul class="detail-list"><li>' +
    (delta === null ? "Sem base equivalente para comparar o alcance." : "O alcance diário acumulado variou " + decimal.format(delta) + "% em relação ao período anterior.") +
    '</li><li>' + (ranked.length ? ranked[0].title + " liderou o alcance entre os conteúdos disponíveis." : "Sem publicações classificadas no período.") +
    '</li></ul>' : empty("Os insights aparecem quando há métricas suficientes.");
}


function renderTable() {
  const query = $("search").value.trim().toLocaleLowerCase("pt-BR");
  const status = $("status-filter").value;
  const filtered = activity.filter((post) => (!status || status === post.status) &&
    [post.title,post.format,accountName(post.account),statusText[post.status]].join(" ").toLocaleLowerCase("pt-BR").includes(query));
  if (!filtered.length) {
    $("activity-table").innerHTML = empty(isDemo ? "Nenhuma atividade encontrada para os filtros." : "Nenhuma fonte de atividade conectada.");
    return;
  }
  const pages = Math.ceil(filtered.length/pageSize);
  page = Math.min(page,pages);
  const cell = (label,content) => '<td data-label="' + label + '">' + content + '</td>';
  $("activity-table").innerHTML = '<div class="table-wrap"><table><thead><tr>' +
    ["Publicação","Conta","Atividade","Status","Data","Ações"].map((label) => '<th scope="col">' + label + '</th>').join("") +
    '</tr></thead><tbody>' + filtered.slice((page-1)*pageSize,page*pageSize).map((post) =>
    '<tr>' + cell("Publicação",'<span class="entry">' + icon(post.format==="Reel"?"posts":"media") + post.title + '</span>') +
    cell("Conta",accountName(post.account)) + cell("Atividade",statusText[post.status]) +
    cell("Status",'<span class="status ' + post.status.toLowerCase() + '">' + post.status + '</span>') +
    cell("Data",formatDate(post.date) + ' · ' + post.hour) + cell("Ações",'<button class="row-action" data-post="' + post.id +
    '" aria-label="Abrir detalhes de ' + post.title + '">···</button>') + '</tr>').join("") +
    '</tbody></table></div><div class="pages"><span>' + filtered.length + ' registros · ' + page + '/' + pages +
    '</span><button class="button" data-page="-1" aria-label="Página anterior" ' + (page===1?"disabled":"") +
    '>‹</button><button class="button" data-page="1" aria-label="Próxima página" ' + (page===pages?"disabled":"") + '>›</button></div>';
}

const scheduleDayLabel = new Intl.DateTimeFormat("pt-BR",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"});
const schedulePageSize = 20;
let visibleSchedules = [];

function scheduleElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.textContent = content;
  return element;
}

function scheduledCard(post) {
  const title = post.title || post.format + " sem título";
  const card = scheduleElement("button","scheduled-post");
  card.type = "button";
  card.dataset.schedule = post.occurrence;
  card.dataset.tint = [...post.occurrence].reduce((hash, char) => (hash * 31 + char.codePointAt(0)) % 7,0);
  const thumb = scheduleElement("span","scheduled-thumb");
  thumb.setAttribute("aria-hidden","true");
  thumb.innerHTML = icon(({Reel:"video",Carrossel:"layers",Imagem:"image",Story:"phone"})[post.format] ?? "calendar");
  if (post.cover === "aurora" || post.cover === "texturas") {
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.addEventListener("error",() => img.remove(),{once:true});
    img.src = "./" + post.cover + ".svg";
    thumb.append(img);
  }
  const body = scheduleElement("span","scheduled-copy");
  body.append(scheduleElement("strong","",title),scheduleElement("span","scheduled-meta",post.time + " · " + accountName(post.account)));
  const badges = scheduleElement("span","scheduled-badges");
  const status = scheduleElement("span","scheduled-status",post.status);
  status.dataset.status = post.status;
  badges.append(scheduleElement("span","",""+post.format),status);
  card.append(thumb,body,badges);
  return card;
}

function renderScheduledPosts(data) {
  const list = $("scheduled-list");
  list.replaceChildren();
  list.setAttribute("aria-busy","false");
  list.scrollTop = 0;
  try {
    visibleSchedules = selectScheduledPosts(isDemo ? demoSchedules : [],new Set(data.accounts.map(({id}) => id)),data.start,data.end,timezone);
  } catch {
    visibleSchedules = [];
    const error = scheduleElement("p","","Não foi possível carregar os posts programados.");
    error.setAttribute("role","alert");
    list.append(error);
    return;
  }
  if (!visibleSchedules.length) {
    list.append(scheduleElement("strong","",data.accounts.length ?
      "Nenhuma publicação programada neste período." : "Nenhuma conta do Instagram conectada."),
      scheduleElement("p","muted",data.accounts.length ? "Experimente outro período ou consulte a agenda." : "Os agendamentos aparecem quando houver uma fonte autorizada."));
    return;
  }
  let rendered = 0, lastDay, group;
  const more = scheduleElement("button","button scheduled-more","Carregar mais");
  more.type = "button";
  function appendPage() {
    let firstCard;
    for (const post of visibleSchedules.slice(rendered,rendered + schedulePageSize)) {
      if (lastDay !== post.day) {
        const heading = scheduleElement("h3","scheduled-day",scheduleDayLabel.format(new Date(post.day + "T12:00:00Z")));
        group = scheduleElement("ul","scheduled-group");
        list.insertBefore(heading,more);
        list.insertBefore(group,more);
        lastDay = post.day;
      }
      const row = document.createElement("li");
      const card = scheduledCard(post);
      firstCard ??= card;
      row.append(card);
      group.append(row);
      rendered++;
    }
    more.hidden = rendered >= visibleSchedules.length;
    return firstCard;
  }
  list.append(more);
  appendPage();
  more.addEventListener("click",() => appendPage()?.focus());
}

function refresh() {
  const selected = range(appliedFilters);
  const data = getData(selected.start,selected.end);
  activity = data.activity;
  page = 1;
  renderAnalytics(data);
  renderScheduledPosts(data);
  renderEditorial(data);
  renderTable();
  const {account,period} = appliedFilters;
  $("filter-trigger").setAttribute("aria-label", account === "all" && period === "30" ? "Filtrar resultados" : "Filtrar resultados, filtros ativos");
  for (const [key,value] of Object.entries({workspace:activeWorkspace?.id,account,period,
    start:period==="custom"?selected.start:"",end:period==="custom"?selected.end:""})) {
    if (value) query.set(key,value); else query.delete(key);
  }
  history.replaceState(null,"","?" + query + location.hash);
  $("scope-status").textContent = "Indicadores atualizados para " + formatDate(selected.start) + " a " + formatDate(selected.end) + ".";
}

function openDialog(title, paragraphs) {
  $("dialog-title").textContent = title;
  $("dialog-content").replaceChildren(...paragraphs.map((text) => Object.assign(document.createElement("p"),{textContent:text})));
  $("dialog").showModal();
}

function theme(value) {
  document.documentElement.dataset.theme = value;
  const dark = value === "dark";
  $("appearance").setAttribute("aria-checked", String(dark));
  $("appearance").dataset.tooltip = dark ? "Ativar modo claro" : "Ativar modo escuro";
  try { localStorage.setItem("studio-theme",value); } catch { /* Browser storage can be unavailable. */ }
}

let profileName = "";
try { profileName = localStorage.getItem("studio-profile-name") ?? ""; }
catch { /* The anonymous profile remains available. */ }
const avatarIcon = $("profile-avatar").firstElementChild;
function renderProfile() {
  const firstName = profileName.trim().split(/\s+/)[0];
  $("profile-name").textContent = firstName || "Meu perfil";
  $("profile-button").setAttribute("aria-label", firstName ? "Configurar perfil de " + firstName : "Configurar perfil");
  $("profile-avatar").replaceChildren(firstName ? [...firstName][0].toLocaleUpperCase("pt-BR") : avatarIcon);
  const hour = Number(new Intl.DateTimeFormat("en-GB",{hour:"2-digit",hourCycle:"h23",timeZone:timezone}).format(new Date()));
  const greeting = hour>=5&&hour<12 ? "Bom dia" : hour>=12&&hour<18 ? "Boa tarde" : "Boa noite";
  const greetingName = firstName || (isDemo ? demo.user : "");
  $("greeting").textContent = greetingName ? greeting + ", " + greetingName + "!" : "Boas-vindas ao Social Studio!";
}
$("profile-button").addEventListener("click", () => {
  $("profile-input").value = profileName;
  $("profile-error").hidden = true;
  $("profile-dialog").showModal();
  $("profile-input").focus();
});
$("profile-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("profile-input").value.trim();
  try { localStorage.setItem("studio-profile-name",name); }
  catch {
    $("profile-error").textContent = "Este navegador não permitiu salvar a preferência.";
    $("profile-error").hidden = false;
    return;
  }
  profileName = name;
  renderProfile();
  $("profile-dialog").close();
});
renderProfile();

const scrollIndicators = new Map();
const scrollIdleDelay = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scrollbar-hide-delay"));
const customScrollbars = matchMedia("(hover:hover) and (pointer:fine) and (forced-colors:none)");
let scrollFrame = 0;

function paintScrollIndicators() {
  scrollFrame = 0;
  const root = document.documentElement;
  for (const [scroller, state] of scrollIndicators) {
    const documentScroll = scroller === root;
    const bounds = documentScroll ? { left:0, top:0, right:innerWidth, bottom:innerHeight } : scroller.getBoundingClientRect();
    const clip = !documentScroll && scroller.closest(".workspace");
    const clipBounds = clip && clip !== scroller ? clip.getBoundingClientRect() : null;
    for (const axis of ["vertical", "horizontal"]) {
      const vertical = axis === "vertical";
      const node = state[axis];
      const viewport = vertical ? scroller.clientHeight : scroller.clientWidth;
      const extent = vertical ? scroller.scrollHeight : scroller.scrollWidth;
      const position = vertical ? scroller.scrollTop : scroller.scrollLeft;
      const trackStart = (vertical ? bounds.top : bounds.left) + 2;
      const trackSize = Math.max(0, viewport - 4);
      const thumbSize = Math.min(trackSize, Math.max(20, trackSize * viewport / extent));
      const start = trackStart + (trackSize - thumbSize) * Math.max(0, position) / Math.max(1, extent - viewport);
      const end = start + thumbSize;
      const min = Math.max(start, clipBounds ? vertical ? clipBounds.top : clipBounds.left : 0);
      const max = Math.min(end, vertical ? innerHeight : innerWidth,
        clipBounds ? vertical ? clipBounds.bottom : clipBounds.right : Infinity);
      node.hidden = extent <= viewport || max <= min;
      if (node.hidden) continue;
      const cross = vertical ? bounds.right : bounds.bottom;
      node.style.left = (vertical ? cross - 7 : min) + "px";
      node.style.top = (vertical ? min : cross - 7) + "px";
      node.style[vertical ? "height" : "width"] = max - min + "px";
    }
  }
}

function scheduleScrollPaint() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(paintScrollIndicators);
}

document.addEventListener("scroll", (event) => {
  if (!customScrollbars.matches) return;
  const scroller = event.target === document ? document.documentElement : event.target;
  if (!(scroller instanceof HTMLElement)) return;
  let state = scrollIndicators.get(scroller);
  if (!state) {
    const makeThumb = (axis) => {
      const element = document.createElement("span");
      element.className = "scroll-indicator " + axis;
      element.setAttribute("aria-hidden", "true");
      (scroller.closest("dialog") ?? document.body).append(element);
      return element;
    };
    state = { vertical:makeThumb("vertical"), horizontal:makeThumb("horizontal") };
    scrollIndicators.set(scroller,state);
    state.animationFrame = requestAnimationFrame(() => {
      state.animationFrame = requestAnimationFrame(() => {
        state.animationFrame = 0;
        state.vertical.dataset.visible = "true";
        state.horizontal.dataset.visible = "true";
      });
    });
  } else if (!state.animationFrame) {
    state.vertical.dataset.visible = "true";
    state.horizontal.dataset.visible = "true";
  }
  scroller.dataset.scrolling = "true";
  clearTimeout(state.idle);
  clearTimeout(state.remove);
  state.idle = setTimeout(() => {
    delete scroller.dataset.scrolling;
    delete state.vertical.dataset.visible;
    delete state.horizontal.dataset.visible;
    state.remove = setTimeout(() => {
      state.vertical.remove();
      state.horizontal.remove();
      scrollIndicators.delete(scroller);
    }, 310);
  }, scrollIdleDelay);
  scheduleScrollPaint();
}, { capture: true, passive: true });
window.addEventListener("resize",scheduleScrollPaint,{ passive:true });


const filterPanel = $("filter-panel");
const filterTrigger = $("filter-trigger");
const filterForm = $("scope");
const accountChoices = [{id:"all", name:"Todas as contas"}, ...scopedAccounts];
for (const {id,name} of accountChoices) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "radio";
  input.name = "account";
  input.value = id;
  const caption = document.createElement("span");
  caption.textContent = name;
  label.dataset.search = [name,scopedAccounts.find(account => account.id === id)?.displayName].filter(Boolean).join(" ");
  const avatar = document.createElement("span");
  avatar.className = "account-fallback";
  avatar.setAttribute("aria-hidden","true");
  avatar.textContent = id === "all" ? "" : name.replace(/^@/,"").slice(0,1).toUpperCase();
  if (id === "all") avatar.innerHTML = icon("users-round");
  label.append(input, avatar, caption);
  $("account-options").append(label);
}

function resetFilterDraft(filters) {
  for (const input of filterForm.querySelectorAll('input[name="account"]')) {
    input.checked = input.value === filters.account;
  }
  filterForm.elements.period.value = filters.period;
  $("date-start").value = filters.period === "custom" ? filters.start : "";
  $("date-end").value = filters.period === "custom" ? filters.end : "";
  $("account-selection").textContent = accountChoices.find(({id}) => id === filters.account).name;
  closePicker();
  updateDateSummary();
  $("custom-dates").hidden = filters.period !== "custom";
  closeCalendarMenus();
  if (filters.period === "custom") moveCalendar(filters.end,false);
  $("account-search").value = "";
  $("account-search").dispatchEvent(new Event("input"));
  $("scope-error").hidden = true;
}
$("account-search").addEventListener("input", (event) => {
  const term = event.target.value.trim().toLocaleLowerCase("pt-BR");
  let matches = 0;
  for (const label of $("account-options").children) {
    label.hidden = !label.dataset.search.toLocaleLowerCase("pt-BR").includes(term);
    if (!label.hidden) matches++;
  }
  $("account-empty").hidden = matches > 0 && scopedAccounts.length > 0;
  $("account-empty").textContent = scopedAccounts.length ? "Nenhuma conta encontrada." : "Nenhuma conta conectada.";
});
$("account-search").addEventListener("keydown", (event) => {
  if (event.key === "Enter") event.preventDefault();
  if (event.key === "ArrowDown") {
    event.preventDefault();
    const options = $("account-options");
    (options.querySelector("label:not([hidden]) input:checked") ??
      options.querySelector("label:not([hidden]) input"))?.focus();
  }
});
let openPicker = null;
function closePicker(restoreFocus = false) {
  if (!openPicker) return;
  const toggle = openPicker;
  $(toggle.getAttribute("aria-controls")).hidden = true;
  toggle.setAttribute("aria-expanded","false");
  openPicker = null;
  if (restoreFocus) toggle.focus();
}
function showPicker(toggle) {
  if (openPicker === toggle) return closePicker(true);
  closePicker();
  openPicker = toggle;
  $(toggle.getAttribute("aria-controls")).hidden = false;
  toggle.setAttribute("aria-expanded","true");
}
$("account-toggle").addEventListener("click", (event) => {
  showPicker(event.currentTarget);
  if (openPicker) {
    $("account-search").value = "";
    $("account-search").dispatchEvent(new Event("input"));
    $("account-search").focus();
  }
});
$("account-options").addEventListener("click", (event) => {
  if (event.target.name !== "account") return;
  $("account-selection").textContent = accountChoices.find(({id}) => id === event.target.value).name;
  closePicker(true);
});
filterPanel.addEventListener("click", (event) => {
  for (const menu of calendarMenus) {
    if (!event.composedPath().includes(menu)) menu.open = false;
  }
  if (openPicker && !event.composedPath().includes(openPicker) &&
    !event.composedPath().includes($(openPicker.getAttribute("aria-controls")))) closePicker();
});
filterPanel.addEventListener("keydown", (event) => {
  const menu = calendarMenus.find(item => item.open);
  if (event.key === "Escape" && menu) {
    event.preventDefault();
    event.stopPropagation();
    menu.open = false;
    menu.querySelector("summary").focus();
    return;
  }
  if (event.key === "Escape" && openPicker) {
    event.preventDefault();
    event.stopPropagation();
    closePicker(true);
  }
});

const monthLabel = new Intl.DateTimeFormat("pt-BR",{month:"long",timeZone:"UTC"});
const dayLabel = new Intl.DateTimeFormat("pt-BR",{dateStyle:"full",timeZone:"UTC"});
const dateLabel = (day) => day.split("-").reverse().join("/");
const utcDate = (day) => new Date(day + "T12:00:00Z");
const nextMonth = (month) => offsetDay(month + "-28",4).slice(0,7);
const monthOptions = [];
for (let month = calendarMin.slice(0,7); month <= calendarMax.slice(0,7); month = nextMonth(month)) {
  monthOptions.push(month);
}
const calendarMenus = [$("calendar-month"),$("calendar-year")];
const calendarYears = [...new Set(monthOptions.map(month => month.slice(0,4)))];
function closeCalendarMenus() {
  for (const menu of calendarMenus) menu.open = false;
}
function renderCalendarMenu(menu, options, current) {
  const label = options.find(({value}) => value === current).label;
  menu.querySelector("summary span").textContent = label;
  menu.querySelector("summary").setAttribute("aria-label",(menu.id === "calendar-month" ? "Mês: " : "Ano: ") + label);
  menu.querySelector("div").replaceChildren(...options.map(({value,label,disabled}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = value;
    button.disabled = Boolean(disabled);
    button.setAttribute("aria-pressed",String(value === current));
    button.textContent = label;
    return button;
  }));
}
let calendarFocus = today;
function updateDateSummary() {
  const start = $("date-start").value, end = $("date-end").value;
  $("date-summary").textContent = start ? dateLabel(start) + " até " + (end ? dateLabel(end) : "…") : "Escolher datas";
}
function renderCalendar(focus = false) {
  const month = calendarFocus.slice(0,7), first = month + "-01";
  const start = $("date-start").value, end = $("date-end").value;
  const index = monthOptions.indexOf(month);
  const [year, monthNumber] = month.split("-");
  renderCalendarMenu(calendarMenus[0],Array.from({length:12},(_,index) => {
    const value = String(index+1).padStart(2,"0");
    const key = year + "-" + value;
    return {value,label:monthLabel.format(utcDate(key + "-01")),disabled:!monthOptions.includes(key)};
  }),monthNumber);
  renderCalendarMenu(calendarMenus[1],calendarYears.map(value => ({value,label:value})),year);
  $("calendar-prev").disabled = index === 0;
  $("calendar-next").disabled = index === monthOptions.length - 1;
  const headings = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(day => '<span aria-hidden="true">' + day + '</span>');
  const blanks = Array(utcDate(first).getUTCDay()).fill('<span aria-hidden="true"></span>');
  const days = [];
  for (let day = first; day.slice(0,7) === month; day = offsetDay(day,1)) {
    const edge = day === start || day === end;
    const inside = start && end && day > start && day < end;
    days.push('<button type="button" data-day="' + day + '" tabindex="' + (day === calendarFocus ? 0 : -1) +
      '" aria-label="' + dayLabel.format(utcDate(day)) + '" aria-pressed="' + Boolean(edge || inside) +
      '"' + (day === today ? ' aria-current="date"' : '') + (day < calendarMin || day > calendarMax ? ' disabled' : '') +
      ' class="' + (edge ? "range-edge" : inside ? "range-inside" : "") + '">' + Number(day.slice(-2)) + '</button>');
  }
  $("calendar-days").innerHTML = [...headings,...blanks,...days].join("");
  $("calendar-status").textContent = start && !end ? "Selecione a data final." : "Selecione a data inicial.";
  if (focus) $("calendar-days").querySelector('[tabindex="0"]').focus();
}
function moveCalendar(day, focus) {
  calendarFocus = day < calendarMin ? calendarMin : day > calendarMax ? calendarMax : day;
  renderCalendar(focus);
}
for (const menu of calendarMenus) {
  menu.addEventListener("toggle", () => {
    if (!menu.open) return;
    const options = menu.querySelector("div");
    const selected = options.querySelector('[aria-pressed="true"]');
    if (selected && !options.contains(document.activeElement)) {
      options.scrollTop = selected.offsetTop - (options.clientHeight - selected.offsetHeight) / 2;
    }
  });
  menu.addEventListener("click", (event) => {
    const value = event.target.dataset.value;
    if (!value) return;
    const [year, month] = calendarFocus.split("-");
    closeCalendarMenus();
    if (menu.id === "calendar-month") {
      moveCalendar(year + "-" + value + "-01",false);
    } else {
      const months = monthOptions.filter(option => option.startsWith(value + "-"));
      const preferred = value + "-" + month;
      const available = months.includes(preferred) ? preferred : value < year ? months.at(-1) : months[0];
      moveCalendar(available + "-01",false);
    }
    menu.querySelector("summary").focus();
  });
  menu.addEventListener("keydown", (event) => {
    if (!["ArrowUp","ArrowDown","Home","End"].includes(event.key)) return;
    event.preventDefault();
    menu.open = true;
    const options = [...menu.querySelectorAll("button:not(:disabled)")];
    const index = options.indexOf(event.target);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 :
      index < 0 ? options.findIndex(option => option.getAttribute("aria-pressed") === "true") :
      (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  });
}
for (const [id,delta] of [["calendar-prev",-1],["calendar-next",1]]) {
  $(id).addEventListener("click", () => {
    moveCalendar(monthOptions[monthOptions.indexOf(calendarFocus.slice(0,7)) + delta] + "-01",false);
    if ($(id).disabled) $("calendar-month").querySelector("summary").focus();
  });
}
$("calendar-days").addEventListener("keydown", (event) => {
  const day = event.target.dataset.day;
  if (!day) return;
  const weekday = utcDate(day).getUTCDay();
  const delta = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-weekday,End:6-weekday}[event.key];
  if (delta === undefined) return;
  event.preventDefault();
  moveCalendar(offsetDay(day,delta),true);
});
$("calendar-days").addEventListener("click", (event) => {
  const day = event.target.dataset.day;
  if (!day) return;
  const start = $("date-start"), end = $("date-end");
  if (!start.value || end.value || day < start.value) {
    start.value = day;
    end.value = "";
  } else end.value = day;
  updateDateSummary();
  $("scope-error").hidden = true;
  moveCalendar(day,true);
});
function placeFilterPanel() {
  const anchor = filterTrigger.getBoundingClientRect();
  filterPanel.style.setProperty("--filter-right", Math.max(12,innerWidth-anchor.right) + "px");
  filterPanel.style.setProperty("--filter-top", Math.max(12,Math.min(anchor.bottom+8,innerHeight-180)) + "px");
}
filterPanel.addEventListener("beforetoggle", (event) => {
  if (event.newState !== "open") return;
  resetFilterDraft(appliedFilters);
  placeFilterPanel();
});
function repositionOpenFilters() {
  if (filterPanel.matches(":popover-open")) placeFilterPanel();
}
window.addEventListener("resize", repositionOpenFilters);
document.querySelector(".workspace").addEventListener("scroll", repositionOpenFilters, { passive:true });
filterForm.addEventListener("change", (event) => {
  if (event.target.name === "account") {
    $("account-selection").textContent = accountChoices.find(({id}) => id === event.target.value).name;
  }
  if (event.target.name === "period") {
    $("custom-dates").hidden = event.target.value !== "custom";
    closePicker();
    closeCalendarMenus();
    if (event.target.value === "custom") moveCalendar($("date-end").value || $("date-start").value || today,false);
  }
  $("scope-error").hidden = true;
});
$("clear-filters").addEventListener("click", () => resetFilterDraft(defaultFilters));
filterForm.noValidate = true;
filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const draft = Object.fromEntries(new FormData(filterForm));
  if (!accountChoices.some(({id}) => id === draft.account) || !range(draft)) {
    $("scope-error").textContent = "Escolha duas datas em ordem, dentro das datas disponíveis, em um intervalo de até 90 dias.";
    $("scope-error").hidden = false;
    $("calendar-days").querySelector('[tabindex="0"]')?.focus();
    return;
  }
  appliedFilters = draft;
  refresh();
  filterPanel.hidePopover();
  filterTrigger.focus();
});

if (isDemo) {
  $("mode-link").href=location.pathname;
  $("mode-link").textContent="Ver sem dados de exemplo";
  $("data-source").textContent="Dados fictícios · Referência de 06/11/2026 · Horários de Brasília";
} else {
  $("summary").textContent="Conecte uma fonte autorizada para acompanhar resultados e atividades.";
  $("data-source").textContent="Nenhuma fonte autorizada configurada.";
}
theme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
$("appearance").addEventListener("click", () => theme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

for (const [id,event] of [["search","input"],["status-filter","change"]]) {
  $(id).addEventListener(event,() => {page=1;renderTable();});
}
document.addEventListener("click",(event) => {
  const button=event.target.closest("button");
  if (!button) return;
  if (button.dataset.schedule) {
    const post = visibleSchedules.find(({occurrence}) => occurrence === button.dataset.schedule);
    if (post) openDialog(post.title || post.format + " sem título",[post.format+" · "+accountName(post.account),
      "Status: "+post.status,"Programado para "+post.day.split("-").reverse().join("/")+" às "+post.time+" · horário de Brasília"]);
  }
  if (button.dataset.post) {
    const post=posts.find(({id}) => id===Number(button.dataset.post));
    if (post && isDemo) openDialog(post.title,[post.format+" · "+accountName(post.account),
      statusText[post.status]+" · "+formatDate(post.date)+" às "+post.hour,
      post.scheduled ? "Previsto para "+formatDate(post.scheduled) : post.reach ? number.format(post.reach)+" de alcance no exemplo" : "Dados de alcance indisponíveis."]);
  }
  if (button.dataset.page) {
    page+=Number(button.dataset.page);
    renderTable();
    (document.querySelector('[data-page="'+button.dataset.page+'"]:not(:disabled)') ?? document.querySelector("[data-page]:not(:disabled)"))?.focus();
  }
});
function updateNavigation() {
  const current=location.hash || "#overview-top";
  document.querySelectorAll(".side-nav a,.sidebar-footer a").forEach((link) => {
    if (link.hash===current) link.setAttribute("aria-current","location");
    else link.removeAttribute("aria-current");
  });
}
window.addEventListener("hashchange",updateNavigation);
updateNavigation();

const sideMenu = $("side-menu");
const sidebarToggle = $("sidebar-toggle");
function setSidebarExpanded(expanded) {
  document.documentElement.dataset.sidebarExpanded = String(expanded);
  sidebarToggle.setAttribute("aria-expanded", String(expanded));
  sidebarToggle.setAttribute("aria-label", expanded ? "Recolher menu" : "Expandir menu");
}
setSidebarExpanded(document.documentElement.dataset.sidebarExpanded === "true");
function toggleSidebar(expanded) {
  setSidebarExpanded(expanded);
  try { localStorage.setItem("studio-sidebar-expanded", String(expanded)); }
  catch { /* The current session still has a working rail. */ }
}
sidebarToggle.addEventListener("click", () => toggleSidebar(sidebarToggle.getAttribute("aria-expanded") !== "true"));
sideMenu.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !filterPanel.matches(":popover-open") && sidebarToggle.getAttribute("aria-expanded") === "true" && sidebarToggle.offsetWidth) {
    toggleSidebar(false);
    sidebarToggle.focus();
  }
});
refresh();
