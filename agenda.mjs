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

function createAgendaClock(timezone, onTick) {
  const date=new Intl.DateTimeFormat("pt-BR",{dateStyle:"full",timeZone:timezone});
  const time=new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:timezone});
  const line=document.getElementById("agenda-clock-date");
  let timer, lifecycle;
  function stop() {clearTimeout(timer);}
  function update() {
    stop();
    if (document.hidden) return;
    const now=new Date();
    const [hour,minute]=time.format(now).split(":");
    line.textContent="Hoje é "+date.format(now)+", às "+hour+"h"+minute+".";
    onTick(now);
    timer=setTimeout(update,60000-(Date.now()%60000));
  }
  return active=>{
    if (!active) {stop();lifecycle?.abort();lifecycle=undefined;return;}
    if (lifecycle) return;
    lifecycle=new AbortController();
    const options={signal:lifecycle.signal};
    document.addEventListener("visibilitychange",update,options);
    window.addEventListener("pagehide",stop,options);
    window.addEventListener("pageshow",update,options);
    update();
  };
}

export function connectSegmentIndicator(selector) {
  function positionIndicator() {
    const selected = selector.querySelector("input:checked")?.parentElement;
    if (!selected) return;
    selector.style.setProperty("--segment-x",selected.offsetLeft+"px");
    selector.style.setProperty("--segment-width",selected.offsetWidth+"px");
  }
  new ResizeObserver(positionIndicator).observe(selector);
  selector.addEventListener("change",positionIndicator);
  return positionIndicator;
}

export function createAgenda({referenceDate,timezone,isDemo,records,card,openNew}) {
  const byId = id => document.getElementById(id);
  const root = byId("agenda"), content = byId("agenda-content");
  const dateKey = new Intl.DateTimeFormat("sv-SE",{timeZone:timezone});
  let today = dateKey.format(new Date());
  const selector = root.querySelector(".agenda-segments");
  let mode = matchMedia("(max-width: 600px)").matches ? "day" : "week";
  let anchor = referenceDate, accounts = [], scope = "", events = [], filterPeriod;
  let miniMonth = monthStart(anchor);
  const setClockActive = createAgendaClock(timezone, now => {
    const current = dateKey.format(now);
    if (current !== today) {
      today = current;
      render(true);
    }
  });
  const miniDays = byId("agenda-mini-days");
  const modeInput = value => selector.querySelector('[value="'+value+'"]');

  const positionIndicator = connectSegmentIndicator(selector);

  function renderMini(focusDate) {
    byId("agenda-mini-month").textContent = monthLabel(miniMonth);
    const weekdays = ["D","S","T","Q","Q","S","S"].map(name => {
      const item = element("span","agenda-mini-weekday",name);
      item.setAttribute("aria-hidden","true");
      return item;
    });
    const first = offsetDay(miniMonth,-utc(miniMonth).getUTCDay());
    const buttons = dates(first,42).map(day => {
      const button = element("button","agenda-mini-day",String(Number(day.slice(-2))));
      button.type = "button";
      button.dataset.date = day;
      button.dataset.outside = String(monthStart(day) !== miniMonth);
      button.setAttribute("aria-label",label(day,{dateStyle:"full"}));
      button.setAttribute("aria-pressed",String(day === anchor));
      if (day === today) button.setAttribute("aria-current","date");
      button.onclick = () => selectDate(day,true);
      return button;
    });
    miniDays.replaceChildren(...weekdays,...buttons);
    if (focusDate) miniDays.querySelector('[data-date="'+focusDate+'"]')?.focus({preventScroll:true});
  }

  function selectDate(day,focusDay = false) {
    anchor = day;
    miniMonth = monthStart(day);
    render(false,focusDay ? day : undefined);
  }

  for (const [id,step] of [["agenda-mini-prev",-1],["agenda-mini-next",1]]) {
    byId(id).onclick = () => {
      miniMonth = shiftMonth(miniMonth,step);
      renderMini();
    };
  }

  function showDay(key) {
    mode = "day";
    selectDate(key);
    modeInput(mode).focus();
  }

  function dateIndicator(day, withWeekday = false) {
    const indicator = element(withWeekday ? "time" : "button","agenda-day-heading");
    if (withWeekday) {
      indicator.dateTime = day;
      const name = element("span","agenda-weekday",weekday(day));
      name.setAttribute("aria-hidden","true");
      indicator.append(name);
    } else {
      indicator.type = "button";
      indicator.classList.add("agenda-month-date");
      indicator.setAttribute("aria-pressed",String(day === anchor));
      indicator.onclick = () => showDay(day);
    }
    const number = element("span","agenda-day-number",String(Number(day.slice(-2))));
    number.setAttribute("aria-hidden","true");
    indicator.append(number,element("span","sr-only",label(day,{dateStyle:"full"})));
    if (day === today) indicator.setAttribute("aria-current","date");
    return indicator;
  }

  function timeline(days,byDay,initialScroll) {
    const viewport = element("div","agenda-timeline scroll-region");
    viewport.tabIndex = 0;
    viewport.setAttribute("role","region");
    viewport.setAttribute("aria-label",mode==="day" ? "Horários do dia" : "Horários da semana");
    const grid = element("div","agenda-hours");
    grid.style.setProperty("--agenda-days",String(days.length));
    grid.dataset.mode = mode;
    const header = element("div","agenda-hour-row agenda-hour-header agenda-date-surface");
    header.append(element("span","agenda-hour-label","BRT"));
    for (const day of days) header.append(dateIndicator(day,true));
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
        if (entries.length) cell.style.setProperty("--agenda-first-minute",Number(entries[0].time.slice(3)));
        cell.append(...entries.map(card));
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
    for (const day of days.slice(0,7)) grid.append(element("div","agenda-day-heading agenda-weekday agenda-date-surface",weekday(day)));
    for (const day of days) {
      const cell = element("div","agenda-month-cell");
      cell.dataset.outside = String(day.slice(0,7)!==anchor.slice(0,7));
      cell.append(dateIndicator(day));
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

  function render(preserveScroll = false,focusDate) {
    if (!root.getClientRects().length) return;
    const oldScroll = preserveScroll ? content.querySelector(".agenda-timeline")?.scrollTop : undefined;
    for (const input of selector.querySelectorAll("input")) {
      input.checked = input.value === mode && (mode !== "day" || anchor === today);
    }
    positionIndicator();
    renderMini(focusDate);
    const first = mode==="month" ? weekStart(monthStart(anchor)) : mode==="day" ? anchor : weekStart(anchor);
    const monthEnd = mode==="month" ? offsetDay(shiftMonth(anchor,1),-1) : null;
    const last = mode==="month" ? offsetDay(weekStart(monthEnd),6) : offsetDay(first,mode==="day" ? 0 : 6);
    const days = dates(first,(utc(last)-utc(first))/86400000+1);
    const from = mode==="month" ? monthStart(anchor) : first;
    const to = monthEnd ?? last;
    const period = mode==="month" ? monthLabel(anchor) : mode==="day" ? label(anchor,{dateStyle:"long"}) :
      dayLabel(first)+" a "+label(last,{dateStyle:"long"});
    content.setAttribute("aria-label","Calendário: "+period);
    byId("agenda-scope").textContent = [scope,"Horário de Brasília",isDemo ? "Data-base da demonstração: "+dayLabel(referenceDate) : "Fonte de agendamentos não conectada"].filter(Boolean).join(" · ");
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

  function showToday() {
    today = dateKey.format(new Date());
    selectDate(today);
  }
  modeInput("day").addEventListener("click", () => {
    if (mode === "day" && anchor === today) showToday();
  });
  selector.addEventListener("change",event => {
    mode = event.target.value;
    if (mode === "day") showToday();
    else render();
  });
  byId("agenda-new").onclick = () => openNew(anchor);
  return {
    render,
    setClockActive,
    viewDate(day) {
      mode="list";
      selectDate(day);
      modeInput(mode).focus();
    },
    setScope(nextAccounts,nextScope,period) {
      accounts = nextAccounts;
      scope = nextScope;
      const changed = period.start !== filterPeriod?.start || period.end !== filterPeriod?.end;
      if (changed) {
        anchor = period.end;
        miniMonth = monthStart(anchor);
      }
      filterPeriod = period;
      render(!changed);
    },
    find(occurrence) {return events.find(post => post.occurrence===occurrence);},
  };
}
