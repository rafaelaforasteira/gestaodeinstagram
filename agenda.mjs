import {selectScheduledPosts} from "./analytics.mjs";
import {offsetDay} from "./demo-data.mjs";

const dayKey = date => date.toISOString().slice(0,10);
const utc = key => new Date(key + "T12:00:00Z");
const weekStart = key => offsetDay(key,-((utc(key).getUTCDay()+6)%7));
const dates = (start,length) => Array.from({length},(_,index) => offsetDay(start,index));
const label = (key,options) => new Intl.DateTimeFormat("pt-BR",{...options,timeZone:"UTC"}).format(utc(key));
const monthLabel = key => label(key,{month:"long",year:"numeric"});
const weekday = key => label(key,{weekday:"short"});
const dayLabel = key => label(key,{day:"numeric",month:"short"});
const monthStart = key => key.slice(0,7)+"-01";
function shiftMonth(key,step) {
  const date = utc(monthStart(key));
  date.setUTCMonth(date.getUTCMonth()+step);
  return dayKey(date);
}
function element(tag,className,text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createAgenda({today,timezone,isDemo,records,card,openNew}) {
  const byId = id => document.getElementById(id);
  const root = byId("agenda"), content = byId("agenda-content");
  const selector = root.querySelector(".agenda-segments");
  let mode = matchMedia("(max-width: 600px)").matches ? "day" : "week";
  let anchor = today, accounts = [], scope = "", events = [], filterPeriod;
  const allowedDate = key => key >= "1900-01-01" && key <= "2099-12-31";
  const modeInput = value => selector.querySelector('[value="'+value+'"]');
  modeInput(mode).checked = true;

  function positionIndicator() {
    const selected = modeInput(mode).parentElement;
    selector.style.setProperty("--segment-x",selected.offsetLeft+"px");
    selector.style.setProperty("--segment-width",selected.offsetWidth+"px");
  }
  new ResizeObserver(positionIndicator).observe(selector);

  function showDay(key) {
    anchor = key;
    mode = "day";
    modeInput(mode).checked = true;
    render();
    modeInput(mode).focus();
  }

  function timeline(days,byDay,initialScroll) {
    const viewport = element("div","agenda-timeline scroll-region");
    viewport.tabIndex = 0;
    viewport.setAttribute("role","region");
    viewport.setAttribute("aria-label",mode==="day" ? "Horários do dia" : "Horários da semana");
    const grid = element("div","agenda-hours");
    grid.style.setProperty("--agenda-days",String(days.length));
    grid.dataset.mode = mode;
    const header = element("div","agenda-hour-row agenda-hour-header");
    header.append(element("span","agenda-hour-label","BRT"));
    for (const day of days) {
      const heading = element("span","agenda-day-heading",weekday(day)+" "+day.slice(-2));
      if (day===today) heading.setAttribute("aria-current","date");
      header.append(heading);
    }
    grid.append(header);
    for (let hour=0;hour<24;hour++) {
      const row = element("div","agenda-hour-row");
      const hourText = String(hour).padStart(2,"0");
      row.dataset.hour = hourText;
      const hourLabel = element(mode==="day"?"button":"span","agenda-hour-label",hourText+":00");
      if (mode==="day") {
        hourLabel.type="button";
        hourLabel.setAttribute("aria-label","Nova publicação às "+hourText+":00");
        hourLabel.onclick=()=>openNew(days[0],hourText+":00");
      }
      row.append(hourLabel);
      for (const day of days) {
        const cell = element("div","agenda-hour-cell");
        const entries = (byDay.get(day) ?? []).filter(post => post.time.startsWith(hourText+":"));
        let bottom = 0;
        for (const post of entries) {
          const item = card(post);
          const minuteOffset = Number(post.time.slice(3))*1.45;
          item.style.marginBlockStart = Math.max(0,minuteOffset-bottom)+"px";
          bottom = Math.max(bottom,minuteOffset)+80;
          cell.append(item);
        }
        row.append(cell);
      }
      grid.append(row);
    }
    viewport.append(grid);
    content.append(viewport);
    if (initialScroll !== undefined) viewport.scrollTop = initialScroll;
    else {
      viewport.scrollTop = grid.querySelector('[data-hour="08"]').offsetTop-header.offsetHeight;
    }
  }

  function month(days,byDay) {
    const viewport = element("div","agenda-month-viewport scroll-region");
    viewport.tabIndex = 0;
    viewport.setAttribute("role","region");
    viewport.setAttribute("aria-label","Calendário mensal");
    const grid = element("div","agenda-month");
    for (const day of days.slice(0,7)) grid.append(element("div","agenda-day-heading",weekday(day)));
    for (const day of days) {
      const cell = element("div","agenda-month-cell");
      cell.dataset.outside = String(day.slice(0,7)!==anchor.slice(0,7));
      const link = element("button","button agenda-month-date",String(Number(day.slice(-2))));
      link.type = "button";
      link.setAttribute("aria-label",label(day,{dateStyle:"full"}));
      if (day===today) link.setAttribute("aria-current","date");
      link.onclick = () => showDay(day);
      cell.append(link);
      const entries = byDay.get(day) ?? [];
      cell.append(...entries.slice(0,2).map(card));
      if (entries.length>2) {
        const more = element("button","button agenda-more","+"+(entries.length-2));
        more.type = "button";
        more.setAttribute("aria-label","Ver todas as publicações de "+dayLabel(day));
        more.onclick = () => showDay(day);
        cell.append(more);
      }
      grid.append(cell);
    }
    viewport.append(grid);
    content.append(viewport);
  }

  function render(preserveScroll = false) {
    if (!root.getClientRects().length) return;
    const oldScroll = preserveScroll ? content.querySelector(".agenda-timeline")?.scrollTop : undefined;
    positionIndicator();
    const first = mode==="month" ? weekStart(monthStart(anchor)) : mode==="day" ? anchor : weekStart(anchor);
    const monthEnd = mode==="month" ? offsetDay(shiftMonth(anchor,1),-1) : null;
    const last = mode==="month" ? offsetDay(weekStart(monthEnd),6) : offsetDay(first,mode==="day" ? 0 : 6);
    const days = dates(first,(utc(last)-utc(first))/86400000+1);
    const from = mode==="month" ? monthStart(anchor) : first;
    const to = monthEnd ?? last;
    const period = mode==="month" ? monthLabel(anchor) : mode==="day" ? label(anchor,{dateStyle:"long"}) :
      dayLabel(first)+" a "+label(last,{dateStyle:"long"});
    byId("agenda-period").textContent = period;
    byId("agenda-scope").textContent = [scope,"Horário de Brasília",isDemo ? "Demonstração · Hoje: "+dayLabel(today) : "Fonte de agendamentos não conectada"].filter(Boolean).join(" · ");
    events = selectScheduledPosts(records,new Set(accounts.map(account => account.id)),from,to,timezone);
    const byDay = new Map();
    for (const post of events) {
      if (!byDay.has(post.day)) byDay.set(post.day,[]);
      byDay.get(post.day).push(post);
    }
    content.replaceChildren();
    content.dataset.mode = mode;
    if (!events.length) content.append(element("p","agenda-empty muted",isDemo ?
      "Nenhuma publicação neste intervalo para a seleção atual." : "Conecte uma fonte autorizada para visualizar publicações."));
    if (mode==="month") month(days,byDay);
    else if (mode==="list") {
      for (const [day,entries] of byDay) {
        const group = element("section","agenda-list-group");
        group.append(element("h4","",label(day,{dateStyle:"full"})),...entries.map(card));
        content.append(group);
      }
    } else timeline(days,byDay,oldScroll);
  }

  function move(step) {
    const next = mode==="month" ? shiftMonth(anchor,step) : offsetDay(anchor,step*(mode==="day" ? 1 : 7));
    if (allowedDate(next)) {anchor = next;render();}
  }
  selector.addEventListener("change",event => {mode = event.target.value;render();});
  byId("agenda-prev").onclick = () => move(-1);
  byId("agenda-next").onclick = () => move(1);
  byId("agenda-today").onclick = () => {anchor = today;render();};
  byId("agenda-new").onclick = () => openNew(anchor);
  return {
    render,
    viewDate(day) {
      anchor=day;
      mode="list";
      modeInput(mode).checked=true;
      render();
      modeInput(mode).focus();
    },
    setScope(nextAccounts,nextScope,period) {
      accounts = nextAccounts;
      scope = nextScope;
      const changed = period.start !== filterPeriod?.start || period.end !== filterPeriod?.end;
      if (changed) anchor = period.end;
      filterPeriod = period;
      render(!changed);
    },
    find(occurrence) {return events.find(post => post.occurrence===occurrence);},
  };
}
