import { createBannerManager } from "./banners.mjs";
import { renderWidgetHelp } from "./widget-help.mjs";
import { renderPerformance, showPerformance } from "./performance.mjs";
import { createAgenda } from "./agenda.mjs";
import { createComposer } from "./composer.mjs";
import { destinationName, publicationNetworkBadges, publicationFormatIcons, publicationFormatTag, renderIntelligence } from "./editorial.mjs";
import { demo, demoBannerClients, demoBannerAccounts, demoEditorialHistory, demoFailureDetails, demoFollowerSnapshot, demoPeriodInsights, demoPublicationDetails, demoSchedules, offsetDay, samples, posts } from "./demo-data.mjs";
import { accountsInScope, completeTotal, percentChange, selectPeriods, selectActiveSchedules, sum } from "./analytics.mjs";

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
const scheduleRecords = isDemo ? [...demoSchedules] : [];
let calendarMax = isDemo ? scheduleRecords.reduce((latest, post) => {
  const day = dateKey.format(new Date(post.scheduledAt));
  return day > latest ? day : latest;
},today) : today;
const workspaces = isDemo ? demo.workspaces : [];
let page = 1;
let activity = [];
const pageSize = 8;
let currentRange = {start:"",end:""};
let lastAccounts = [];
let attentionAlerts = [];
let connectionEvents = [];
const statusText = { Publicado:"Publicação realizada", Agendado:"Agendamento criado", Falha:"Falha no processamento", Rascunho:"Rascunho atualizado" };
const accountName = (id) => demo.accounts.find((account) => account.id === id)?.name ?? "Conta indisponível";
const activeWorkspace = workspaces.find(({id}) => id === query.get("workspace")) ?? workspaces[0];
const scopedClients = isDemo ? demo.clients.filter(({workspace}) => workspace === activeWorkspace?.id) : [];
const scopedAccounts = isDemo ? accountsInScope(demo.accounts,scopedClients,activeWorkspace?.id) : [];
const accountsFor = (client,account = "all") => accountsInScope(scopedAccounts,scopedClients,activeWorkspace?.id,client,account);
const defaultFilters = { client:"all", account:"all", period:"today", start:today, end:today };
const requestedAccount = query.get("account");
const requestedClient = query.get("client") ?? scopedAccounts.find(({id}) => id === requestedAccount)?.client;
const initialClient = scopedClients.some(({id}) => id === requestedClient) ? requestedClient : "all";
const requestedPeriod = query.get("period");
let appliedFilters = {
  client: initialClient,
  account: accountsFor(initialClient,requestedAccount).length ? requestedAccount : "all",
  period: ["today","yesterday","7","30","90","custom"].includes(requestedPeriod) ? requestedPeriod : defaultFilters.period,
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
if (!range(appliedFilters)) appliedFilters = { ...defaultFilters, client:appliedFilters.client, account:appliedFilters.account };

function getData(start, end) {
  const accounts = accountsFor(appliedFilters.client,appliedFilters.account);
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

/** @param {{title:string,symbol:string,value:number|null,change:number|null,net?:boolean,status?:string}} kpi */
function metric({title,symbol,value,change,net=false,status="ready"}) {
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
    '</h3></div><p class="value">' + (status === "loading" ? '<span class="kpi-skeleton" aria-label="Carregando"></span>' :
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
  const status = accounts.length ? "ready" : "disconnected";
  $("metrics").innerHTML = [
    {title:"Alcance",symbol:"users-round",value:reach,change:percentChange(reach,period("reach",previousStart,previousEnd))},
    {title:"Views",symbol:"eye",value:currentViews,change:percentChange(currentViews,views(previous))},
    {title:"Engajados",symbol:"heart",value:engaged,change:percentChange(engaged,period("accountsEngaged",previousStart,previousEnd))},
    {title:"Seguidores",symbol:"user-round-plus",value:followers,change:baseline === null || closing === null ? null : closing - baseline,
      net:true},
  ].map((kpi) => metric({...kpi,status})).join("");
}

function renderAnalytics(data) {
  renderKpis(data);
}

const weekdayLabels = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"];
const editorialMonth = new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"});
const shortMonth = new Intl.DateTimeFormat("pt-BR",{month:"short",timeZone:"UTC"});
const editorialDate = new Intl.DateTimeFormat("pt-BR",{dateStyle:"full",timeZone:"UTC"});
function editorialLegend() {
  const legend = scheduleElement("div","heat-legend","Menos");
  legend.setAttribute("aria-label","Intensidade: zero a quatro ou mais publicações");
  for (let level = 0; level <= 4; level++) {
    const swatch = scheduleElement("span","heat-cell");
    swatch.dataset.level = level;
    swatch.setAttribute("aria-hidden","true");
    legend.append(swatch);
  }
  legend.append("Mais");
  return legend;
}
let heatmapObserver;
function renderConsistency(data) {
  heatmapObserver?.disconnect();
  const root = $("consistency");
  root.replaceChildren();
  if (!data.accounts.length) {
    root.append(scheduleElement("p","empty","Conecte uma conta do Instagram para acompanhar a consistência editorial."));
    return;
  }
  const accountIds = new Set(data.accounts.map(({id}) => id));
  const history = isDemo ? demoEditorialHistory.filter(post => accountIds.has(post.account)) : [];
  const published = [...new Map([...data.allPosts,...history].filter(post => post.status === "Publicado")
    .map(post => [post.account+":"+post.id,post])).values()];
  const days = new Map();
  for (const post of published) {
    if (!days.has(post.date)) days.set(post.date,[]);
    days.get(post.date).push(post);
  }
  const surface = scheduleElement("div","heat-surface");
  const viewport = scheduleElement("div","heatmap-scroll scroll-region");
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
  function attachTooltip(element, detail) {
    element.setAttribute("aria-label",detail);
    for (const event of ["focus","pointerenter"]) element.addEventListener(event,() => showTooltip(element,detail));
    for (const event of ["blur","pointerleave"]) element.addEventListener(event,hideTooltip);
    element.addEventListener("keydown",event => { if (event.key === "Escape") hideTooltip(); });
  }
  viewport.addEventListener("scroll",hideTooltip,{passive:true});
  let visibleWeeks;
  function drawWeeks() {
    const viewportStyle = getComputedStyle(viewport);
    const contentWidth = viewport.clientWidth - parseFloat(viewportStyle.paddingLeft) - parseFloat(viewportStyle.paddingRight);
    const labelWidth = 16;
    const gap = 4;
    const cellSize = Math.max(16,Math.min(22,Math.floor((contentWidth-labelWidth)/23)-gap));
    viewport.style.setProperty("--heat-size",cellSize+"px");
    const available = Math.floor((contentWidth-labelWidth)/(cellSize+gap));
    const count = Math.max(selectedWeeks,Math.min(52,available));
    if (count === visibleWeeks) return;
    visibleWeeks = count;
    hideTooltip();
    grid.replaceChildren();
    const first = offsetDay(lastWeek,-7*(count-1));
    const labels = scheduleElement("div","heat-week");
    labels.append(document.createElement("span"),...weekdayLabels.map(label => {
      const item = scheduleElement("span","heat-label",label[0]);
      item.tabIndex = 0;
      attachTooltip(item,label);
      return item;
    }));
    grid.append(labels);
    let week, lastMonth;
    const cells = new Map();
    for (let day = first; day <= last; day = offsetDay(day,1)) {
      if (!offset(day)) {
        week = scheduleElement("div","heat-week");
        const weekEnd = offsetDay(day,6);
        const monthDay = day === first && day !== lastWeek ? day : weekEnd > data.end ? data.end : weekEnd;
        const month = monthDay.slice(0,7);
        const firstMonthIsBrief = day === first && day !== lastWeek && offsetDay(day,13).slice(0,7) !== month &&
          month !== data.end.slice(0,7);
        const showMonth = lastMonth !== month && !firstMonthIsBrief;
        lastMonth = month;
        const monthDate = new Date(monthDay+"T12:00:00Z");
        const monthLabel = scheduleElement("span","heat-month",showMonth ? shortMonth.format(monthDate) : "");
        if (showMonth) {
          monthLabel.tabIndex = 0;
          attachTooltip(monthLabel,editorialMonth.format(monthDate));
        }
        week.append(monthLabel);
        grid.append(week);
      }
      const entries = days.get(day) ?? [];
      const selected = day >= data.start && day <= data.end;
      const date = editorialDate.format(new Date(day+"T12:00:00Z"));
      const hasHistory = isDemo && day <= today && day >= offsetDay(today,-180);
      const scope = data.accounts.length === 1 ? data.accounts[0].name : "Todas as contas";
      const realized = entries.length === 1 ? "1 publicação realizada" : entries.length + " publicações realizadas";
      const detail = date + " · " + (hasHistory ? realized : "Histórico indisponível") +
        " · " + scope + (selected ? "" : " · Fora do período selecionado");
      const cell = scheduleElement("button","heat-cell");
      cell.type = "button";
      cell.dataset.date = day;
      cell.tabIndex = day === data.start ? 0 : -1;
      cell.dataset.level = hasHistory ? Math.min(entries.length,4) : "unknown";
      if (day === today) cell.setAttribute("aria-current","date");
      cell.classList.toggle("heat-context",!selected);
      attachTooltip(cell,detail);
      cell.addEventListener("click",() => {
        hideTooltip();
        openDialog(date,entries.length ? entries.map(post => post.status+" · "+post.title+" · "+accountName(post.account)) :
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
    viewport.scrollLeft = viewport.scrollWidth;
  }
  viewport.append(grid);
  surface.append(viewport);
  root.append(surface,editorialLegend(),tooltip);
  drawWeeks();
  heatmapObserver = new ResizeObserver(drawWeeks);
  heatmapObserver.observe(viewport);
}

function renderEditorial(data) {
  renderConsistency(data);
  renderIntelligence(data, {isDemo, today, icon, formatDate});
  const failures = data.activity.filter(({status}) => status === "Falha");
  $("editorial-alert").hidden = !failures.length;
}

function renderAttention(accounts) {
  const alerts = [];
  const dateTime = new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,dateStyle:"short",timeStyle:"short"});
  const clientName = id => scopedClients.find(client => client.id === id)?.name;
  const byAccount = new Map(accounts.map(account => [account.id,account]));
  if (isDemo) {
    // The latest schedule state supersedes the editorial record for the same publication.
    const publications = new Map(posts.map(post => [post.account+":"+post.id,post]));
    for (const post of scheduleRecords) publications.set(post.account+":"+post.id,post);
    for (const post of publications.values()) {
      const account = byAccount.get(post.account);
      if (!account || post.status !== "Falha") continue;
      const at = post.scheduledAt ?? post.date+"T"+post.hour+":00-03:00";
      alerts.push({kind:"publication",key:"publication:"+post.account+":"+post.id+":"+at,post,title:"Falha na publicação",name:post.title,
        format:post.format,client:clientName(account.client),account:account.name,at,status:"Falha"});
    }
    if (appliedFilters.account === "all") {
      for (const account of demo.accounts) {
        if (account.connected !== false || account.workspace !== activeWorkspace?.id || !clientName(account.client) ||
            (appliedFilters.client !== "all" && appliedFilters.client !== account.client)) continue;
        alerts.push({kind:"connection",key:"connection:"+account.id+":"+account.connectionChangedAt,title:"Conta desconectada",
          name:account.name,client:clientName(account.client),account:account.name,at:account.connectionChangedAt,status:"Desconectada"});
      }
    }
    alerts.sort((a,b) => Number(a.kind==="connection")-Number(b.kind==="connection") ||
      (Date.parse(b.at)||0)-(Date.parse(a.at)||0));
  }

  function fill(root,visible) {
    root.replaceChildren();
    if (!visible.length) {
      const message = scheduleElement("p","agenda-alert-empty");
      if (isDemo) message.innerHTML = icon("check")+" <strong>Tudo em dia!</strong>";
      message.append(document.createTextNode(isDemo ? " Nenhuma pendência neste escopo." : "Fonte de alertas operacionais indisponível."));
      root.append(message);
      return;
    }
    const list = scheduleElement("ul","agenda-alert-list");
    for (const alert of visible) {
      const item = scheduleElement("li");
      const button = scheduleElement("button","agenda-alert-item");
      button.type = "button";
      button.dataset.kind = alert.kind;
      button.innerHTML = icon(alert.kind === "connection" ? "unplug" : "circle-alert");
      const summary = scheduleElement("span");
      const when = Number.isFinite(Date.parse(alert.at)) ? dateTime.format(new Date(alert.at)) : "";
      summary.append(scheduleElement("strong","",alert.title),scheduleElement("span","",alert.name),
        scheduleElement("span","muted",[alert.client,when].filter(Boolean).join(" · ")));
      button.append(summary);
      button.onclick = () => openDialog(alert.name,[alert.title,alert.client,alert.account,when,"Estado: "+alert.status,"Dados de demonstração."].filter(Boolean));
      item.append(button);
      list.append(item);
    }
    root.append(list);
  }
  lastAccounts = accounts;
  attentionAlerts = alerts;
  connectionEvents = alerts.filter(alert => alert.kind === "connection");
  // A Agenda mostra só os alertas ainda abertos; os resolvidos ficam na Central de atividades.
  const open = alerts.filter(alert => !resolvedAlerts.has(alert.key));
  fill($("agenda-alerts"),open.slice(0,3));
  $("agenda-alert-count").textContent = open.length;
  $("agenda-alert-count").hidden = !open.length;
  $("agenda-alert-all").hidden = !open.length;
  renderAttentionCenter();
}

// Central de atividades · coluna "Precisa de atenção"
let attentionTab = "open";
const resolvedKey = "studio-resolved-alerts-v1-" + (activeWorkspace?.id ?? "sem-workspace");
let resolvedAlerts = new Set();
try { resolvedAlerts = new Set(JSON.parse(localStorage.getItem(resolvedKey)) ?? []); }
catch { /* Sem armazenamento: os alertas resolvidos valem só nesta sessão. */ }
function saveResolved() {
  try { localStorage.setItem(resolvedKey, JSON.stringify([...resolvedAlerts])); }
  catch { /* Mantém o estado em memória. */ }
}
function relativeTime(at) {
  const instant = Date.parse(at);
  if (!Number.isFinite(instant)) return "";
  const minutes = Math.round(((isDemo ? Date.parse(demo.now) : Date.now()) - instant) / 60000);
  if (minutes < 0) return "";
  if (minutes < 1) return "agora";
  if (minutes < 60) return "há " + minutes + " min";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return "há " + hours + " h";
  const days = Math.round(hours / 24);
  return "há " + days + (days === 1 ? " dia" : " dias");
}
function openSoon(title, text) {
  $("soon-title").textContent = title;
  $("soon-text").textContent = text;
  $("soon-dialog").showModal();
}
function renderAttentionCenter() {
  const el = scheduleElement;
  const dateTime = new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
  const open = attentionAlerts.filter(alert => !resolvedAlerts.has(alert.key));
  const done = attentionAlerts.filter(alert => resolvedAlerts.has(alert.key));
  const count = $("attention-count");
  count.textContent = open.length;
  count.dataset.tone = open.length ? "danger" : "neutral";
  for (const [key,list] of [["open",open],["resolved",done]]) {
    document.querySelector('[data-attention-total="'+key+'"]').textContent = list.length;
  }
  for (const tab of document.querySelectorAll("[data-attention-tab]")) {
    tab.setAttribute("aria-checked", String(tab.dataset.attentionTab === attentionTab));
  }
  const badge = $("activity-badge");
  badge.textContent = open.length;
  badge.hidden = !open.length;
  const link = badge.closest("a");
  link.setAttribute("aria-label", "Central de atividades" + (open.length ? ", " + open.length + (open.length === 1 ? " alerta aberto" : " alertas abertos") : ""));
  $("ac-tab-attention-count").textContent = open.length ? "(" + open.length + ")" : "";

  const root = $("alerts");
  root.replaceChildren();
  const visible = attentionTab === "open" ? open : done;
  if (!visible.length) {
    const message = el("p","ac-empty");
    if (attentionTab === "open" && isDemo) message.innerHTML = icon("circle-check") + " <strong>Tudo em dia!</strong>";
    message.append(document.createTextNode(attentionTab === "resolved" ? "Nenhum alerta resolvido." :
      isDemo ? " Nenhuma pendência neste escopo." : "Fonte de alertas operacionais indisponível."));
    root.append(message);
    return;
  }
  const list = el("ul","ac-alert-list");
  for (const alert of visible) {
    const resolved = resolvedAlerts.has(alert.key);
    const item = el("li","ac-alert");
    item.dataset.kind = alert.kind;
    item.dataset.state = resolved ? "resolved" : "open";
    const tile = el("span","ac-alert-tile");
    tile.innerHTML = icon(alert.kind === "connection" ? "unplug" : "circle-alert");
    tile.setAttribute("aria-hidden","true");
    const body = el("div","ac-alert-body");
    const top = el("div","ac-alert-top");
    top.append(el("strong","",alert.title));
    const ago = relativeTime(alert.at);
    if (ago) {
      const time = el("time","",ago);
      time.dateTime = alert.at;
      top.append(time);
    }
    const when = Number.isFinite(Date.parse(alert.at)) ? dateTime.format(new Date(alert.at)) : "";
    body.append(top,
      el("p","ac-alert-what",alert.kind === "publication" ? alert.name + " · " + (alert.format === "Imagem" ? "Feed" : alert.format) : alert.name),
      el("p","ac-alert-ctx",[alert.client, alert.kind === "publication" ? alert.account : "Instagram", when].filter(Boolean).join(" · ")));
    if (!resolved) {
      const impact = el("p","ac-alert-impact",alert.kind === "connection" ?
        "Os agendamentos desta conta não serão publicados até reconectar." :
        "A publicação não saiu. Revise e agende de novo.");
      impact.insertAdjacentHTML("afterbegin",icon("triangle-alert"));
      body.append(impact);
    }
    const actions = el("div","ac-alert-actions");
    const primary = el("button","ac-button ac-button-primary",alert.kind === "connection" ? "Reconectar conta" : "Revisar publicação");
    primary.type = "button";
    primary.insertAdjacentHTML("afterbegin",icon(alert.kind === "connection" ? "refresh" : "eye"));
    primary.addEventListener("click",() => alert.kind === "connection" ?
      openSoon("Reconectar conta","A reconexão de contas do Instagram ainda está em construção. Quando estiver pronta, este botão vai abrir a autorização da Meta para " + alert.name + ".") :
      openFailureDetail(alert.post,alert.key));
    const toggle = el("button","ac-button ac-button-ghost",resolved ? "Reabrir" : "Resolvido");
    toggle.type = "button";
    toggle.insertAdjacentHTML("afterbegin",icon(resolved ? "rotate-ccw" : "check"));
    toggle.setAttribute("aria-label",(resolved ? "Reabrir alerta: " : "Marcar como resolvido: ") + alert.title + " · " + alert.name);
    toggle.addEventListener("click",() => {
      const index = visible.indexOf(alert);
      if (resolved) resolvedAlerts.delete(alert.key); else resolvedAlerts.add(alert.key);
      saveResolved();
      renderAttention(lastAccounts);
      // Mantém o foco no próximo alerta da lista, ou nas abas quando a lista esvazia.
      const buttons = $("alerts").querySelectorAll(".ac-button-ghost");
      (buttons[Math.min(index,buttons.length-1)] ?? document.querySelector('[data-attention-tab="'+attentionTab+'"]'))?.focus();
    });
    actions.append(primary,toggle);
    if (resolved) actions.prepend(el("span","ac-resolved-chip","Resolvido"));
    body.append(actions);
    item.append(tile,body);
    list.append(item);
  }
  root.append(list);
}
for (const tab of document.querySelectorAll("[data-attention-tab]")) {
  tab.addEventListener("click",() => {
    attentionTab = tab.dataset.attentionTab;
    renderAttentionCenter();
    tab.focus();
  });
}
function showActivityView(view) {
  document.querySelector(".activity-center-grid").dataset.view = view;
  $("ac-tab-attention").setAttribute("aria-selected",String(view === "attention"));
  $("ac-tab-history").setAttribute("aria-selected",String(view === "history"));
}
$("ac-tab-attention").addEventListener("click",() => showActivityView("attention"));
$("ac-tab-history").addEventListener("click",() => showActivityView("history"));


function renderTable() {
  const el = scheduleElement;
  const query = $("search").value.trim().toLocaleLowerCase("pt-BR");
  const status = $("status-filter").value;
  const clientOf = id => scopedClients.find(client => client.id === demo.accounts.find(account => account.id === id)?.client)?.name ?? "";
  const events = [
    ...activity.map(post => ({kind:"post",post,at:post.date+"T"+post.hour+":00-03:00",time:post.hour,status:post.status,
      title:post.title,label:statusText[post.status],account:accountName(post.account),client:clientOf(post.account),format:post.format})),
    ...connectionEvents.filter(alert => {
      const day = dateKey.format(new Date(alert.at));
      return day >= currentRange.start && day <= currentRange.end;
    }).map(alert => ({kind:"connection",alert,at:alert.at,status:"Desconectada",title:alert.name,label:"Conta desconectada",
      account:"Instagram",client:alert.client})),
  ].sort((a,b) => Date.parse(b.at) - Date.parse(a.at));
  const filtered = events.filter(event => (!status || status === event.status) &&
    [event.title,event.format,event.account,event.client,event.label].join(" ").toLocaleLowerCase("pt-BR").includes(query));
  $("activity-count").textContent = filtered.length;
  const root = $("activity-table");
  root.replaceChildren();
  if (!filtered.length) {
    root.append(el("p","ac-empty",isDemo ? "Nenhuma atividade encontrada para os filtros." : "Nenhuma fonte de atividade conectada."));
    return;
  }
  const shown = filtered.slice(0,page*pageSize);
  const dayName = new Intl.DateTimeFormat("pt-BR",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"});
  const timeOf = at => new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(at));
  const symbols = {Publicado:"check",Agendado:"clock",Falha:"x",Rascunho:"pencil",Desconectada:"unplug"};
  let lastDay, list;
  for (const event of shown) {
    const day = dateKey.format(new Date(event.at));
    if (day !== lastDay) {
      const name = dayName.format(new Date(day+"T12:00:00Z"));
      const prefix = day === today ? "Hoje · " : day === offsetDay(today,-1) ? "Ontem · " : "";
      root.append(el("h3","ac-day",prefix + name));
      list = el("ul","ac-event-list");
      root.append(list);
      lastDay = day;
    }
    const row = el("li");
    const button = el("button","ac-event");
    button.type = "button";
    button.dataset.status = event.status;
    button.setAttribute("aria-label","Abrir detalhes de " + event.title);
    if (event.kind === "post") button.dataset.post = event.post.id;
    else button.addEventListener("click",() => openDialog(event.title,[event.label,event.client,"Instagram",
      new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,dateStyle:"short",timeStyle:"short"}).format(new Date(event.at)),
      isDemo ? "Dados de demonstração." : ""].filter(Boolean)));
    const mark = el("span","ac-event-mark");
    mark.innerHTML = icon(symbols[event.status] ?? "clock");
    mark.setAttribute("aria-hidden","true");
    const copy = el("span","ac-event-copy");
    const line = el("span","ac-event-line");
    line.append(el("strong","",event.title),document.createTextNode(" · " + event.label));
    const meta = el("span","ac-event-meta",[event.account,event.client].filter(Boolean).join(" · "));
    if (event.format) meta.append(el("span","ac-tag",event.format === "Imagem" ? "Feed" : event.format));
    copy.append(line,meta);
    const side = el("span","ac-event-side");
    const chip = el("span","ac-chip",event.status);
    chip.dataset.status = event.status;
    side.append(chip,el("time","",event.time ?? timeOf(event.at)));
    button.append(mark,copy,side);
    row.append(button);
    list.append(row);
  }
  const footer = el("div","ac-feed-footer");
  footer.append(el("span","","Mostrando " + shown.length + " de " + filtered.length));
  if (shown.length < filtered.length) {
    const more = el("button","ac-button ac-button-ghost","Carregar mais");
    more.type = "button";
    more.dataset.more = "";
    more.insertAdjacentHTML("beforeend",icon("chevron-down"));
    footer.append(more);
  }
  root.append(footer);
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

function scheduledTag(label, symbol, kind) {
  const tag = scheduleElement("span","scheduled-tag scheduled-tag-"+kind);
  if (symbol) tag.innerHTML = icon(symbol);
  tag.append(scheduleElement("span","",label));
  return tag;
}

function agendaPublicationStatus(post) {
  const statuses = new Set((post.destinations ?? []).map(destination => destination.status || post.status));
  return statuses.size > 1 ? "Parcial" : [...statuses][0] || post.status;
}

function scheduledCard(post, inAgenda = false) {
  const title = post.title || post.format + " sem título";
  const card = scheduleElement("button","scheduled-post");
  card.type = "button";
  card.dataset.schedule = post.occurrence;
  if (inAgenda) {
    card.dataset.agendaEvent = "";
    card.dataset.title = title;
  }
  card.dataset.publicationFormat = ({Story:"story",Reel:"reel",Carrossel:"carousel",Imagem:"feed",Feed:"feed"})[post.format] ?? "unknown";
  const thumb = scheduleElement("span","scheduled-thumb");
  thumb.setAttribute("aria-hidden","true");
  const formatIcon = publicationFormatIcons[post.format];
  thumb.innerHTML = icon(formatIcon ?? "calendar");
  if (post.cover === "aurora" || post.cover === "texturas") {
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.addEventListener("error",() => img.remove(),{once:true});
    img.src = "./" + post.cover + ".svg";
    thumb.append(img);
  }
  const body = scheduleElement("span","scheduled-copy");
  const destinations = post.destinations ?? [];
  const differentTimes = destinations.some(destination => destination.scheduledAt &&
    Date.parse(destination.scheduledAt) !== Date.parse(post.scheduledAt));
  const time = differentTimes && !inAgenda ? "Horários diferentes" : post.time;
  function detail(symbol, value, kind) {
    const item = scheduleElement("span","scheduled-meta-item scheduled-"+kind);
    item.innerHTML = icon(symbol);
    item.append(scheduleElement("span","",value));
    item.title = value;
    return item;
  }
  const client = detail("building",post.clientName || "Cliente não informado","client");
  const clock = detail("clock",time,"time");
  const group = scheduleElement("span","scheduled-meta-item scheduled-destinations");
  group.append(...publicationNetworkBadges(destinations,icon));
  const heading = scheduleElement("strong","",title);
  heading.title = title;
  if (inAgenda) {
    const titleRow = scheduleElement("span","agenda-event-title");
    titleRow.append(heading,clock);
    body.append(client,titleRow);
  } else {
    body.append(heading,client);
  }
  const accent = scheduleElement("span","scheduled-accent");
  accent.setAttribute("aria-hidden","true");
  const format = publicationFormatTag(post.format,icon);
  if (inAgenda) {
    const meta = scheduleElement("span","agenda-event-meta");
    meta.append(group,format);
    const statusLabel = agendaPublicationStatus(post);
    const statusIcon = {Publicado:"check",Agendado:"calendar",Falha:"circle-alert",Cancelado:"circle-alert",Rascunho:"posts",Parcial:"circle-alert"}[statusLabel] ?? "clock";
    const status = scheduledTag(statusLabel,statusIcon,"status");
    status.dataset.scheduleStatus = statusLabel;
    meta.append(status);
    card.append(accent,thumb,body,meta);
    return card;
  }
  card.append(thumb,accent,body,group,clock,format);
  if (post.status === "Agendado") {
    const status = scheduledTag(post.status,post.status === "Agendado" || post.status === "Publicado" ? "check" : "", "status");
    status.dataset.scheduleStatus = post.status;
    card.append(status);
  }
  return card;
}

const scheduledList = $("scheduled-list");
const scheduledViewport = scheduledList.parentElement;
function updateScheduledFade() {
  const remaining = scheduledList.scrollHeight - scheduledList.clientHeight - scheduledList.scrollTop;
  scheduledViewport.dataset.fadeTop = String(scheduledList.scrollTop > 1);
  scheduledViewport.dataset.fadeBottom = String(remaining > 1);
}
const scheduledResize = new ResizeObserver(updateScheduledFade);
scheduledList.addEventListener("scroll",updateScheduledFade,{passive:true});

function renderScheduledPosts(data) {
  const list = scheduledList;
  scheduledResize.disconnect();
  scheduledResize.observe(list);
  list.replaceChildren();
  list.setAttribute("aria-busy","false");
  list.scrollTop = 0;
  try {
    visibleSchedules = selectActiveSchedules(scheduleRecords,new Set(data.accounts.map(({id}) => id)),
      data.start,data.end,timezone,isDemo ? Date.parse(demo.now) : Date.now());
  } catch {
    visibleSchedules = [];
    const error = scheduleElement("p","","Não foi possível carregar os posts programados.");
    error.setAttribute("role","alert");
    list.append(error);
    updateScheduledFade();
    return;
  }
  if (!visibleSchedules.length) {
    list.append(scheduleElement("strong","",data.accounts.length ?
      "Nenhum post programado neste período." : "Nenhuma conta do Instagram conectada."),
      scheduleElement("p","muted",data.accounts.length ? "Confira outro período ou acesse a agenda para programar uma publicação." : "Os agendamentos aparecem quando houver uma fonte autorizada."));
    updateScheduledFade();
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
        scheduledResize.observe(group);
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
  updateScheduledFade();
  more.addEventListener("click",() => {
    appendPage()?.focus();
    updateScheduledFade();
  });
}

function refresh() {
  const selected = range(appliedFilters);
  const data = getData(selected.start,selected.end);
  activity = data.activity;
  currentRange = selected;
  page = 1;
  renderAnalytics(data);
  renderScheduledPosts(data);
  renderEditorial(data);
  renderAttention(data.accounts);
  renderTable();
  const periodText = selected.start === selected.end ? formatDate(selected.start) : formatDate(selected.start) + " a " + formatDate(selected.end);
  renderPerformance({accounts:data.accounts,start:selected.start,end:selected.end,isDemo,period:appliedFilters.period,
    scopeLabel:[scopedClients.find(({id}) => id === appliedFilters.client)?.name ?? "Todos os clientes",
      data.accounts.find(({id}) => id === appliedFilters.account)?.name ?? (data.accounts.length + (data.accounts.length === 1 ? " conta" : " contas")),
      periodText].join(" · "),
    onPeriod:period => { appliedFilters = {...appliedFilters,period}; refresh(); },
    onAccount:account => { const client = scopedAccounts.find(item => item.id === account)?.client; if (client) { appliedFilters = {...appliedFilters,client,account}; refresh(); } }});
  agenda.setScope(data.accounts, [
    demo.clients.find(client => client.id === appliedFilters.client)?.name ?? "Todos os clientes",
    data.accounts.find(account => account.id === appliedFilters.account)?.name ?? "Todas as redes",
  ].join(" · "), selected);
  renderWidgetHelp(isDemo);
  const {client,account,period} = appliedFilters;
  const count = ["client","account","period"].filter(key => appliedFilters[key] !== defaultFilters[key]).length;
  const agendaCount = Number(client !== "all") + Number(account !== "all");
  const agendaBadge = $("agenda-filter-count");
  agendaBadge.textContent = agendaCount || "";
  agendaBadge.dataset.active = String(agendaCount > 0);
  $("agenda-filter-trigger").setAttribute("aria-label",agendaCount ?
    "Filtrar cliente e contas do Instagram, "+agendaCount+" filtro(s) ativo(s)" : "Filtrar cliente e contas do Instagram");
  const badge = $("filter-count");
  if (count) badge.textContent = count;
  badge.dataset.active = String(count > 0);
  const filterLabel = count ? "Filtrar resultados, " + count + (count === 1 ? " filtro ativo" : " filtros ativos") : "Filtrar resultados";
  $("filter-trigger").setAttribute("aria-label", filterLabel);
  // O Desempenho tem o próprio botão de filtro, com o mesmo estado do filtro global.
  $("perf-filter-trigger").setAttribute("aria-label", filterLabel);
  $("perf-filter-count").textContent = count || "";
  $("perf-filter-count").dataset.active = String(count > 0);
  for (const [key,value] of Object.entries({workspace:activeWorkspace?.id,client,account,period,
    start:period==="custom"?selected.start:"",end:period==="custom"?selected.end:""})) {
    if (value) query.set(key,value); else query.delete(key);
  }
  history.replaceState(null,"","?" + query + location.hash);
  $("scope-status").textContent = "Indicadores atualizados para " + formatDate(selected.start) + " a " + formatDate(selected.end) + ".";
}

// Motivo da falha: fixture identificada na demonstração; com dados reais virá do job e da resposta da API.
const failureFor = post => isDemo ? demoFailureDetails[post.account + ":" + post.title] : undefined;
const formatKeys = {Reel:"reel",Carrossel:"carousel",Imagem:"feed",Feed:"feed",Story:"story"};

// Abre o compositor preenchido com a publicação que falhou, num horário futuro sugerido.
function retryPublication(post, failure, alertKey) {
  const original = post.scheduledAt ?? post.date + "T" + post.hour + ":00-03:00";
  const time = new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(original));
  const now = isDemo ? Date.parse(demo.now) : Date.now();
  let day = today;
  if (Date.parse(day + "T" + time + ":00-03:00") <= now) day = offsetDay(day,1);
  const covers = (post.media ?? demoPublicationDetails[post.id]?.media ?? [post.cover]).filter(cover => ["aurora","texturas"].includes(cover));
  const account = scopedAccounts.find(item => item.id === post.account);
  composer({client:account?.client, account:post.account, day, time, retryOf:alertKey,
    stage:failure?.fixStage ?? 4,
    notice:failure?.retryable === false ? "Corrija o que causou a falha antes de reagendar: " + failure.suggestion :
      "Dados da publicação original carregados. Confira o novo horário e confirme.",
    prefill:{format:formatKeys[post.format], title:post.title, caption:post.caption ?? failure?.caption ?? demoPublicationDetails[post.id]?.caption ?? "",
      covers:failure?.retryable === false ? [] : covers}});
}

function openAgendaDetail(post, extra = {}) {
  const dialog = $("dialog");
  const title = $("dialog-title");
  title.textContent = post.title || post.format + " sem título";
  const el = scheduleElement;
  const account = accountName(post.account);
  const sample = isDemo ? demoPublicationDetails[post.id] : undefined;
  const destinations = (post.destinations ?? []).map(destination => ({
    ...destination,
    ...sample?.destinations.find(item => item.account === post.account && destination.platform === "instagram"),
  }));
  const caption = (post.caption ?? sample?.caption)?.trim() || "Sem legenda";
  const format = publicationFormatTag(post.format,icon);
  const status = agendaPublicationStatus(post);
  const preview = el("div","agenda-detail-preview");
  const header = el("div","agenda-detail-preview-header");
  header.append(...publicationNetworkBadges(destinations.slice(0,1),icon),el("strong","",account));
  const media = el("div","agenda-detail-media");
  media.dataset.format = post.format;
  const frame = el("div","agenda-detail-frame");
  const count = el("span","agenda-detail-count");
  count.setAttribute("aria-live","polite");
  const covers = (post.media ?? sample?.media ?? []).filter(item =>
    ["aurora","texturas"].includes(item) || item instanceof File);
  if (!covers.length && ["aurora","texturas"].includes(post.cover)) covers.push(post.cover);
  let slide = 0, mediaUrl;
  function renderSlide() {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    mediaUrl = undefined;
    const cover = covers[slide];
    if (cover) {
      const video = cover instanceof File && cover.type.startsWith("video/");
      const asset = el(video ? "video" : "img","");
      if (video) {
        asset.controls = true;
        asset.playsInline = true;
        asset.setAttribute("aria-label","Prévia de " + title.textContent);
      } else asset.alt = "Prévia de " + title.textContent;
      asset.src = cover instanceof File ? (mediaUrl = URL.createObjectURL(cover)) : "./" + cover + ".svg";
      frame.replaceChildren(asset);
    } else {
      const placeholder = el("span","agenda-detail-placeholder","Prévia de mídia indisponível");
      placeholder.insertAdjacentHTML("afterbegin",icon("image"));
      frame.replaceChildren(placeholder);
    }
    count.textContent = (slide+1) + " / " + covers.length;
  }
  renderSlide();
  media.append(frame);
  if (post.format === "Carrossel" && covers.length > 1) {
    for (const [step,label,symbol] of [[-1,"Mídia anterior","‹"],[1,"Próxima mídia","›"]]) {
      const arrow = el("button","button agenda-detail-arrow",symbol);
      arrow.type = "button";
      arrow.dataset.step = step;
      arrow.setAttribute("aria-label",label);
      arrow.addEventListener("click",() => {
        slide = (slide + step + covers.length) % covers.length;
        renderSlide();
      });
      media.append(arrow);
    }
    media.append(count);
  }
  const actions = el("div","agenda-detail-icons");
  actions.setAttribute("aria-hidden","true");
  actions.innerHTML = ["heart","message-circle","send","bookmark"].map(icon).join("");
  preview.append(header,media,actions,el("p","agenda-detail-excerpt",caption));

  const details = el("div","agenda-detail-info");
  const badges = el("div","agenda-detail-badges");
  const statusTag = scheduledTag(status,{Publicado:"check",Agendado:"calendar",Falha:"circle-alert"}[status] ?? "clock","status");
  statusTag.dataset.scheduleStatus = status;
  badges.append(scheduledTag(post.clientName || "Cliente não informado","building","identity"),
    scheduledTag(account,"brand-instagram","identity"),format,statusTag);
  const rows = el("dl","agenda-detail-panel agenda-detail-rows");
  function row(symbol,label,value) {
    const item = el("div","");
    const term = el("dt","",label);
    term.insertAdjacentHTML("afterbegin",icon(symbol));
    const description = el("dd","");
    description.append(...(Array.isArray(value) ? value : [value]));
    item.append(term,description);
    rows.append(item);
  }
  row("calendar","Data",new Intl.DateTimeFormat("pt-BR",{timeZone:"UTC",dateStyle:"long"}).format(new Date(post.day+"T00:00:00Z")));
  row("clock","Horário",post.time);
  row("clock","Fuso horário","Horário de Brasília");
  row("share-2","Destinos",destinations.length ? publicationNetworkBadges(destinations,icon) : "Não informados");
  const copy = el("section","agenda-detail-panel agenda-detail-caption");
  const captionTitle = el("h3","","Legenda");
  captionTitle.insertAdjacentHTML("afterbegin",icon("posts"));
  copy.append(captionTitle,el("p","",caption));
  const failure = status === "Falha" ? (extra.failure ?? failureFor(post) ?? null) : null;
  details.append(title,badges);
  if (status === "Falha") details.append(failurePanel(failure));
  details.append(rows,copy);
  if (destinations.length) {
    const history = el("section","agenda-detail-panel");
    history.append(el("h3","",isDemo ? "Destinos demonstrativos" : "Detalhes dos destinos"));
    const dateTime = new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,dateStyle:"short",timeStyle:"short"});
    for (const destination of destinations) {
      const published = Date.parse(destination.publishedAt);
      const scheduled = Date.parse(destination.scheduledAt);
      const timing = Number.isFinite(published) ? "Publicado em "+dateTime.format(published) :
        Number.isFinite(scheduled) ? "Programado para "+dateTime.format(scheduled) : "";
      history.append(el("p","",[destinationName(destination),destination.status,timing].filter(Boolean).join(" · ")));
    }
    details.append(history);
  }
  if (destinations.some(destination => destination.platform === "instagram")) {
    const links = el("section","agenda-detail-panel");
    const heading = el("h3","","Publicação no Instagram");
    heading.insertAdjacentHTML("afterbegin",icon("external-link"));
    links.append(heading,el("p","",isDemo ? "Link indisponível na demonstração." : "Link oficial indisponível."));
    details.append(links);
  }
  if (status === "Falha") {
    const bar = el("div","failure-actions");
    const retry = el("button","ac-button ac-button-primary",failure?.retryable === false ? "Corrigir e reagendar" : "Tentar novamente");
    retry.type = "button";
    retry.insertAdjacentHTML("afterbegin",icon("refresh"));
    retry.addEventListener("click",() => {
      dialog.close();
      retryPublication(post,failure,extra.alertKey);
    });
    const close = el("button","ac-button","Fechar");
    close.type = "button";
    close.addEventListener("click",() => dialog.close());
    bar.append(close,retry);
    details.append(bar);
  }
  $("dialog-content").replaceChildren(preview,details);
  dialog.dataset.agendaDetail = "";
  dialog.showModal();
  dialog.scrollTop = 0;
  dialog.addEventListener("close",() => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    frame.replaceChildren();
  },{once:true});
}

function failurePanel(failure) {
  const el = scheduleElement;
  const panel = el("section","agenda-detail-panel failure-panel");
  panel.dataset.source = failure?.source ?? "unknown";
  const heading = el("h3","","Motivo da falha");
  heading.insertAdjacentHTML("afterbegin",icon("circle-alert"));
  panel.append(heading);
  if (!failure) {
    panel.append(el("p","","A fonte não informou o motivo desta falha."));
    return panel;
  }
  const origin = el("div","failure-origin");
  const source = el("span","failure-source",failure.sourceLabel);
  source.insertAdjacentHTML("afterbegin",icon(failure.source === "automation" ? "pulse" : "brand-instagram"));
  origin.append(source,el("code","failure-code",failure.code));
  panel.append(origin,el("strong","failure-title",failure.title),el("p","failure-message",failure.message));
  if (failure.attempts?.length) {
    const time = new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
    const list = el("ol","failure-attempts");
    list.setAttribute("aria-label","Tentativas de publicação");
    for (const attempt of failure.attempts) {
      const item = el("li");
      const when = el("time","",time.format(new Date(attempt.at)));
      when.dateTime = attempt.at;
      item.append(when,el("span","",attempt.result));
      list.append(item);
    }
    panel.append(el("p","failure-label",failure.attempts.length === 1 ? "1 tentativa" : failure.attempts.length + " tentativas"),list);
  }
  const tip = el("p","failure-tip",failure.suggestion);
  tip.insertAdjacentHTML("afterbegin",icon(failure.retryable ? "refresh" : "triangle-alert"));
  panel.append(tip);
  if (isDemo) panel.append(el("p","failure-demo","Motivo fictício · Dados de demonstração"));
  return panel;
}

// Detalhe de uma publicação com falha, aberto pela Central de atividades.
function openFailureDetail(post, alertKey) {
  const at = post.scheduledAt ?? post.date + "T" + post.hour + ":00-03:00";
  const timeOf = new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  const account = scopedAccounts.find(item => item.id === post.account);
  openAgendaDetail({...post, status:"Falha", day:dateKey.format(new Date(at)), time:timeOf.format(new Date(at)),
    clientName:post.clientName ?? scopedClients.find(client => client.id === account?.client)?.name,
    caption:post.caption ?? failureFor(post)?.caption,
    destinations:(post.destinations?.length ? post.destinations : [{platform:"instagram",scheduledAt:at}]).map(item => ({...item,status:"Falha"}))},
    {alertKey});
}

function openDialog(title, paragraphs) {
  delete $("dialog").dataset.agendaDetail;
  $("dialog").insertBefore($("dialog-title"),$("dialog-content"));
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

const filterPanel = $("filter-panel");
const filterTrigger = $("filter-trigger");
const agendaFilterTrigger = $("agenda-filter-trigger");
const isAgendaRoute = () => location.hash === "#agenda";
const currentFilterTrigger = () => isAgendaRoute() ? agendaFilterTrigger : location.hash === "#performance" ? $("perf-filter-trigger") : filterTrigger;
const filterForm = $("scope");
const clientChoices = [{id:"all",name:"Todos os clientes"},...scopedClients];
let accountChoices = [];
const agendaAccountIcon = id => id === "all" ? "layers" : "instagram";
function updateAccountSelection(id) {
  $("account-selection").textContent = accountChoices.find(choice => choice.id === id).name;
  const symbol = isAgendaRoute() ? agendaAccountIcon(id) : "users-round";
  $("account-toggle").querySelector("use").setAttribute("href","#icon-"+symbol);
}
function renderScopeChoices(key, choices, selected) {
  $(key+"-options").replaceChildren(...choices.map(({id,name}) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = key;
    input.value = id;
    input.checked = id === selected;
    const caption = scheduleElement("span","",name);
    label.dataset.search = name;
    label.title = name;
    const avatar = scheduleElement("span","account-fallback",id === "all" ? "" : name[0].toUpperCase());
    avatar.setAttribute("aria-hidden","true");
    if (key === "account" && isAgendaRoute()) avatar.innerHTML = icon(agendaAccountIcon(id));
    else if (id === "all") avatar.innerHTML = icon("users-round");
    label.append(input,avatar,caption);
    return label;
  }));
  if (key === "account") updateAccountSelection(selected);
  else $(key+"-selection").textContent = choices.find(({id}) => id === selected).name;
  $(key+"-search").value = "";
  $(key+"-search").dispatchEvent(new Event("input"));
}
function renderNetworks(client, account = "all") {
  $("network-field").hidden = client === "all";
  accountChoices = [{id:"all",name:isAgendaRoute() ? "Todas as contas" : "Todas as redes"},...accountsFor(client)
    .filter(({platform}) => client !== "all" && (!isAgendaRoute() || platform === "Instagram"))
    .map(({id,platform,name}) => ({id,name:platform+" — "+name}))];
  renderScopeChoices("account",accountChoices,account);
  $("account-toggle").disabled = accountChoices.length === 1;
  $("network-empty").hidden = client === "all" || accountChoices.length > 1;
}
function resetFilterDraft(filters) {
  closePicker();
  renderScopeChoices("client",clientChoices,filters.client);
  renderNetworks(filters.client,filters.account);
  $("no-clients").hidden = scopedClients.length > 0;
  filterForm.elements.period.value = filters.period;
  $("date-start").value = filters.period === "custom" ? filters.start : "";
  $("date-end").value = filters.period === "custom" ? filters.end : "";
  updateDateSummary();
  $("custom-dates").hidden = filters.period !== "custom";
  closeCalendarMenus();
  if (filters.period === "custom") moveCalendar(filters.end,false);
  $("scope-error").hidden = true;
}
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
for (const key of ["client","account"]) {
  const search = $(key+"-search"), options = $(key+"-options");
  search.addEventListener("input",() => {
    const normalize = value => value.normalize("NFD").replace(/\p{M}/gu,"").toLocaleLowerCase("pt-BR");
    const term = normalize(search.value.trim());
    for (const label of options.children) label.hidden = !normalize(label.dataset.search).includes(term);
    const empty = $(key+"-empty");
    empty.hidden = Boolean(options.querySelector("label:not([hidden])"));
    empty.textContent = key === "client" ? "Nenhum cliente encontrado." : "Nenhuma rede encontrada.";
  });
  search.addEventListener("keydown",event => {
    if (event.key === "Enter") event.preventDefault();
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    (options.querySelector("label:not([hidden]) input:checked") ??
      options.querySelector("label:not([hidden]) input"))?.focus();
  });
  $(key+"-toggle").addEventListener("click",event => {
    showPicker(event.currentTarget);
    if (openPicker) {
      search.value = "";
      search.dispatchEvent(new Event("input"));
      search.focus();
    }
  });
  options.addEventListener("click",event => {
    if (event.target.name === key) closePicker(true);
  });
}
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
  const anchor = currentFilterTrigger().getBoundingClientRect();
  const right = isAgendaRoute() ? innerWidth-anchor.left-370 : innerWidth-anchor.right;
  filterPanel.style.setProperty("--filter-right", Math.max(12,right) + "px");
  filterPanel.style.setProperty("--filter-top", Math.max(12,Math.min(anchor.bottom+8,innerHeight-180)) + "px");
}
filterPanel.addEventListener("beforetoggle", (event) => {
  if (event.newState !== "open") return;
  $("analysis-period").hidden = isAgendaRoute();
  $("network-legend").textContent = isAgendaRoute() ? "Contas do Instagram" : "Redes sociais conectadas";
  resetFilterDraft(appliedFilters);
  placeFilterPanel();
});
function repositionOpenFilters() {
  if (filterPanel.matches(":popover-open")) placeFilterPanel();
}
window.addEventListener("resize", repositionOpenFilters);
const contentViewport = document.querySelector(".workspace");
contentViewport.addEventListener("scroll", repositionOpenFilters, { passive:true });
filterForm.addEventListener("change", (event) => {
  if (event.target.name === "client") {
    $("client-selection").textContent = clientChoices.find(({id}) => id === event.target.value).name;
    renderNetworks(event.target.value);
  }
  if (event.target.name === "account") {
    updateAccountSelection(event.target.value);
  }
  if (event.target.name === "period") {
    $("custom-dates").hidden = event.target.value !== "custom";
    closePicker();
    closeCalendarMenus();
    if (event.target.value === "custom") moveCalendar($("date-end").value || $("date-start").value || today,false);
  }
  $("scope-error").hidden = true;
});
$("clear-filters").addEventListener("click", () => resetFilterDraft(isAgendaRoute() ?
  {...appliedFilters,client:"all",account:"all"} : defaultFilters));
filterForm.noValidate = true;
filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const draft = Object.fromEntries(new FormData(filterForm));
  draft.account ??= "all";
  if (!clientChoices.some(({id}) => id === draft.client) ||
    (draft.account !== "all" && !accountsFor(draft.client,draft.account).length)) {
    $("scope-error").textContent = "Selecione um cliente e uma rede disponíveis.";
    $("scope-error").hidden = false;
    $("client-toggle").focus();
    return;
  }
  if (!range(draft)) {
    $("scope-error").textContent = "Escolha duas datas em ordem, dentro das datas disponíveis, em um intervalo de até 90 dias.";
    $("scope-error").hidden = false;
    $("calendar-days").querySelector('[tabindex="0"]')?.focus();
    return;
  }
  appliedFilters = draft;
  refresh();
  filterPanel.hidePopover();
  currentFilterTrigger().focus();
});

if (!isDemo) {
  $("summary").textContent="Conecte uma fonte autorizada para acompanhar resultados e atividades.";
} else {
  // A demonstração precisa continuar identificada (spec: Visão Geral §3 e §15).
  $("demo-note").textContent = "Dados fictícios · Data-base " + formatDate(demo.today) + "/" + demo.today.slice(0,4) + " · Horário de Brasília";
  $("demo-note").hidden = false;
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
    const post = button.hasAttribute("data-agenda-event") ? agenda.find(button.dataset.schedule) :
      visibleSchedules.find(({occurrence}) => occurrence === button.dataset.schedule);
    if (post && button.hasAttribute("data-agenda-event")) {
      openAgendaDetail(post);
    } else if (post) {
      const dateTime = new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,dateStyle:"short",timeStyle:"short"});
      const destinations = (post.destinations ?? []).map(destination => {
        const timestamp = Date.parse(destination.scheduledAt);
        return destinationName(destination) + (Number.isFinite(timestamp) ? " · "+dateTime.format(timestamp) : " · Horário não informado") +
          (destination.status ? " · "+destination.status : "");
      });
      openDialog(post.title || post.format + " sem título",[post.format+" · "+accountName(post.account),
        post.clientName || "Cliente não informado","Status: "+(button.hasAttribute("data-agenda-event") ? agendaPublicationStatus(post) : post.status),
        "Programado para "+post.day.split("-").reverse().join("/")+" às "+post.time+" · horário de Brasília",
        ...(isDemo && destinations.length ? ["Destinos demonstrativos"] : []),...destinations,
        ...(post.caption ? ["Legenda: "+post.caption] : [])]);
    }
  }
  if (button.dataset.post && button.dataset.status === "Falha") {
    const post = posts.find(({id}) => id===Number(button.dataset.post));
    const alert = attentionAlerts.find(item => item.post?.account === post?.account && item.post?.id === post?.id);
    if (post) openFailureDetail(alert?.post ?? post, alert?.key);
  } else if (button.dataset.post) {
    const post=posts.find(({id}) => id===Number(button.dataset.post));
    if (post && isDemo) openDialog(post.title,[post.format+" · "+accountName(post.account),
      statusText[post.status]+" · "+formatDate(post.date)+" às "+post.hour,
      post.scheduled ? "Previsto para "+formatDate(post.scheduled) : post.reach ? number.format(post.reach)+" de alcance no exemplo" : "Dados de alcance indisponíveis."]);
  }
  if (button.hasAttribute("data-more")) {
    const before = document.querySelectorAll("#activity-table .ac-event").length;
    page++;
    renderTable();
    document.querySelectorAll("#activity-table .ac-event")[before]?.focus();
  }
});
const composer = createComposer({isDemo,workspace:activeWorkspace?.id,today,now:Date.parse(demo.now),timezone,clients:scopedClients,accountsFor,icon,
  onSchedule(post) {
    if (!isDemo || !accountsFor(scopedAccounts.find(a=>a.id===post.account)?.client,post.account).length) throw new Error("Destino inválido");
    if (!scheduleRecords.some(item=>item.occurrence===post.occurrence)) scheduleRecords.push(post);
    if (post.retryOf) { resolvedAlerts.add(post.retryOf); saveResolved(); }
    const day = dateKey.format(new Date(post.scheduledAt));
    if (day>calendarMax) calendarMax=day;
    refresh();
  },
  onView(day,client,account) {
    if (!accountsFor(appliedFilters.client,appliedFilters.account).some(item=>item.id===account)) {
      appliedFilters={...appliedFilters,client,account};
      refresh();
    }
    agenda.viewDate(day);
  },
});
const agenda = createAgenda({referenceDate:today,timezone,isDemo,records:scheduleRecords,
  card:post => scheduledCard(post,true),
  openNew:(day,time) => composer({day,time,client:appliedFilters.client,account:appliedFilters.account}),
});
const renderBanners = createBannerManager({
  icon,
  installScrollIndicator,
  workspace:activeWorkspace?.id,
  accounts:[...scopedAccounts,...(isDemo ? demoBannerAccounts.filter(item=>item.workspace===activeWorkspace?.id) : [])],
  clients:[...scopedClients,...(isDemo ? demoBannerClients.filter(item=>item.workspace===activeWorkspace?.id) : [])],
  refresh,
  getRange:()=>range(appliedFilters),
});
function updateNavigation() {
  const current=location.hash || "#overview-top";
  const route = current.slice(1);
  const main = document.querySelector(".workspace main");
  main.dataset.operation = ["activities","agenda","attention","banners","performance"].includes(route) ? route : "";
  $("overview-heading").hidden = route === "agenda";
  $("agenda-heading").hidden = route !== "agenda";
  $("overview-top").setAttribute("aria-labelledby",route === "agenda" ? "agenda-page-title" : "greeting");
  if (filterPanel.matches(":popover-open")) filterPanel.hidePopover();
  agenda.setClockActive(route === "agenda");
  if (route === "agenda") agenda.render();
  if (route === "banners") renderBanners();
  if (route === "performance") showPerformance();
  if (route === "attention" || route === "activities") showActivityView(route === "attention" ? "attention" : document.querySelector(".activity-center-grid").dataset.view);
  if (main.dataset.operation || route === "overview-top") contentViewport.scrollTo({top:0,behavior:"instant"});
  else $(route)?.scrollIntoView();
  document.querySelectorAll(".side-nav a,.sidebar-footer a").forEach((link) => {
    if (link.hash===current || (current==="#attention" && link.hash==="#activities")) link.setAttribute("aria-current","location");
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

function installScrollIndicator(viewport, surface, content, fade = false) {
  const indicator = document.createElement("div");
  indicator.className = "scroll-indicator";
  indicator.setAttribute("aria-hidden","true");
  const thumb = indicator.appendChild(document.createElement("span"));
  surface.append(indicator);
  viewport.dataset.overlayScroll = "";
  let frame = 0, timeout, dragging = null;
  let range = 0, travel = 0;
  function measure() {
    const height = viewport.clientHeight;
    const total = viewport.scrollHeight;
    range = Math.max(0,total-height);
    const size = range > 1 ? Math.min(height,Math.max(24,height*height/total)) : 0;
    travel = height-size;
    indicator.style.setProperty("--thumb-size",size+"px");
    indicator.style.setProperty("--thumb-offset",(size && range ? Math.max(0,Math.min(1,viewport.scrollTop/range))*travel : 0)+"px");
    indicator.hidden = !size;
    if (fade) {
      surface.dataset.fadeTop = String(viewport.scrollTop>1);
      surface.dataset.fadeBottom = String(range-viewport.scrollTop>1);
    }
  }
  function queueMeasure() {
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  }
  function show() {
    queueMeasure();
    indicator.dataset.visible = "true";
    clearTimeout(timeout);
    if (!dragging) timeout = setTimeout(() => { indicator.dataset.visible = "false"; },650);
  }
  viewport.addEventListener("scroll",show,{passive:true});
  thumb.addEventListener("pointerdown",event => {
    if (event.button !== 0 || !travel || event.pointerType === "touch") return;
    event.preventDefault();
    dragging = {y:event.clientY,top:viewport.scrollTop};
    thumb.setPointerCapture(event.pointerId);
    show();
  });
  thumb.addEventListener("pointermove",event => {
    if (dragging && travel) viewport.scrollTop = dragging.top+(event.clientY-dragging.y)*range/travel;
  });
  thumb.addEventListener("lostpointercapture",() => {
    dragging = null;
    show();
  });
  const observer = new ResizeObserver(queueMeasure);
  observer.observe(viewport);
  if (content) observer.observe(content);
  const mutations = new MutationObserver(queueMeasure);
  mutations.observe(viewport,{childList:true,subtree:true});
  measure();
  return () => {
    observer.disconnect();
    mutations.disconnect();
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
    viewport.removeEventListener("scroll",show);
  };
}

installScrollIndicator(contentViewport,contentViewport.parentElement,$("content"),true);
const navViewport = document.querySelector(".side-nav");
installScrollIndicator(navViewport,navViewport.parentElement);
