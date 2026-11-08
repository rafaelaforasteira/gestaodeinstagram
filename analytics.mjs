import { offsetDay } from "./demo-data.mjs";

/**
 * Aggregates a single authorized selection. The caller is responsible for
 * authorizing rows before supplying real data.
 * @param {{account: string, date: string, reach: number, views: number, interactions: number, saves: number}[]} rows
 * @param {Set<string>} accounts
 * @param {string} start ISO calendar date
 * @param {string} end ISO calendar date
 */
export function selectPeriods(rows, accounts, start, end) {
  const length = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const previousStart = offsetDay(start, -length);
  const eligible = rows.filter(({ account }) => accounts.has(account));
  return {
    length, previousStart,
    current: eligible.filter(({ date }) => date >= start && date <= end),
    previous: eligible.filter(({ date }) => date >= previousStart && date < start),
  };
}

// Unique account metrics must come from an exact-period record for each profile.
export function completeTotal(accounts, read) {
  if (!accounts.length) return null;
  const values = accounts.map(read);
  return values.every((value) => Number.isFinite(value) && value >= 0)
    ? values.reduce((total, value) => total + value, 0) : null;
}

export function percentChange(current, previous) {
  return Number.isFinite(current) && Number.isFinite(previous) && previous > 0
    ? (current - previous) / previous * 100 : null;
}

export function selectActiveSchedules(records, accountIds, start, end, timezone, now) {
  const active = records.filter(record => record.status === "Agendado" && Date.parse(record.scheduledAt) >= now);
  return selectScheduledPosts(active,accountIds,start,end,timezone);
}

export function accountsInScope(accounts, clients, workspace, client = "all", account = "all") {
  const authorized = new Set(clients.filter(item => item.workspace === workspace &&
    (client === "all" || item.id === client)).map(item => item.id));
  if (client === "all" && account !== "all") return [];
  return accounts.filter(item => item.workspace === workspace && authorized.has(item.client) &&
    item.connected === true && (account === "all" || item.id === account));
}

export function selectScheduledPosts(records, accountIds, start, end, timezone) {
  const dates = new Intl.DateTimeFormat("sv-SE",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"});
  const times = new Intl.DateTimeFormat("pt-BR",{timeZone:timezone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  return records.flatMap(record => {
    const timestamp = Date.parse(record.scheduledAt);
    if (!accountIds.has(record.account) || !Number.isFinite(timestamp)) return [];
    const day = dates.format(timestamp);
    return day >= start && day <= end ? [{...record,day,time:times.format(timestamp),timestamp}] : [];
  }).sort((a,b) => a.timestamp - b.timestamp || a.occurrence.localeCompare(b.occurrence));
}

export function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0);
}

export function engagement(rows) {
  const reach = sum(rows, "reach");
  return reach ? sum(rows, "interactions") / reach * 100 : null;
}

const publicationFormats = {Reel:"reel",Carrossel:"carousel",Imagem:"feed",Feed:"feed",Story:"story"};

export function selectEditorialPeriods(rows, accounts, start, end) {
  const eligible = rows.filter(post => post.status === "Publicado");
  const previousEnd = offsetDay(start,-1);
  if (start !== end) return {...selectPeriods(eligible,accounts,start,end),previousEnd,historical:false};
  const current = eligible.filter(post => accounts.has(post.account) && post.date <= end);
  return {current,previous:current.filter(post => post.date <= previousEnd),previousStart:null,previousEnd,historical:true};
}

export function comparePublicationFormats(rows, accounts, start, end, metric) {
  const {current,previous,previousStart,previousEnd,historical} = selectEditorialPeriods(rows,accounts,start,end);
  function summarize(posts, format) {
    const group = posts.filter(post => publicationFormats[post.format] === format);
    const values = group.map(post => post[metric]).filter(value => Number.isFinite(value) && value >= 0);
    return {total:group.length, measured:values.length,
      value:values.length ? values.reduce((mean,value,index) => mean+(value-mean)/(index+1),0) : null};
  }
  const formats = ["reel","carousel","feed","story"].map(format => {
    const now = summarize(current,format), before = summarize(previous,format);
    const change = percentChange(now.value,before.value);
    return {format,now,before,change:Number.isFinite(change) ? change : null};
  });
  return {formats,previousStart,previousEnd,historical};
}

export function summarizeLinkBio(banners, events, accounts, start, end, now) {
  const scoped = new Map(banners.filter(banner => accounts.has(banner.account)).map(banner => [banner.id,banner]));
  const statuses = {live:0,scheduled:0,inactive:0};
  const state = banner => {
    if (["paused","archived","inactive"].includes(banner.state) || (banner.endsAt && Date.parse(banner.endsAt) <= now)) return "inactive";
    if (banner.state !== "published" || !Number.isFinite(Date.parse(banner.startsAt))) return null;
    return Date.parse(banner.startsAt) > now ? "scheduled" : "live";
  };
  for (const banner of scoped.values()) {
    const status = state(banner);
    if (status) statuses[status]++;
  }

  const seen = new Set();
  const valid = events.filter(event => {
    if (!event.id || !scoped.has(event.banner) || event.valid !== true || seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
  const days = Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
  const previousStart = offsetDay(start,-days);
  const counts = new Map();
  let clicks = 0, previous = 0;
  for (const event of valid) {
    if (event.date >= start && event.date <= end) {
      clicks++;
      counts.set(event.banner,(counts.get(event.banner) ?? 0)+1);
    } else if (event.date >= previousStart && event.date < start) previous++;
  }
  const ranking = [...counts].map(([id,clicks]) => {
    const banner = scoped.get(id);
    return {...banner,status:state(banner),clicks};
  }).sort((a,b) => b.clicks-a.clicks || a.name.localeCompare(b.name,"pt-BR") || a.id.localeCompare(b.id)).slice(0,5);
  return {clicks,change:percentChange(clicks,previous),statuses,ranking};
}
