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

export function comparePublicationFormats(rows, accounts, start, end, metric) {
  const eligible = rows.filter(post => post.status === "Publicado");
  const {current,previous,previousStart} = selectPeriods(eligible,accounts,start,end);
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
  return {formats,previousStart,previousEnd:offsetDay(start,-1)};
}
