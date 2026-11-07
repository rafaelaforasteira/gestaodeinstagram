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
