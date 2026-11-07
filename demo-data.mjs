export const demo = {
  user: "Marina",
  timezone: "America/Sao_Paulo",
  today: "2026-11-06",
  workspaces: [
    { id: "studio", name: "Estúdio editorial", goal: 12 },
    { id: "lab", name: "Laboratório criativo", goal: 8 },
  ],
  accounts: [
    { id: "aurora", workspace: "studio", name: "@aurora.studio", followers: 8420 },
    { id: "casa", workspace: "studio", name: "@casanova.design", followers: 3900 },
    { id: "forma", workspace: "lab", name: "@forma.lab", followers: 1780 },
  ],
};

export function offsetDay(day, offset) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export const samples = demo.accounts.flatMap((account, index) => Array.from({length: 180}, (_, day) => {
  const reach = Math.round((510 + 90 * Math.sin(day / 4) + 100 * Math.cos(day * 1.7) + (180 - day) * 3) * (1 - index * .28));
  return { account: account.id, date: offsetDay(demo.today, -day), reach, views: Math.round(reach * 2.1),
    interactions: Math.round(reach * (.041 + .006 * Math.sin(day))), saves: Math.round(reach * .011) };
}));

const records = [
  ["aurora", "Coleção Aurora", "Reel", "Publicado", 0, 11420, "aurora"],
  ["casa", "Texturas naturais", "Carrossel", "Publicado", 0, 8630, "texturas"],
  ["aurora", "Bastidores do estúdio", "Story", "Agendado", 0, 0],
  ["casa", "Detalhes da coleção", "Reel", "Falha", -1, 0],
  ["aurora", "Guia de composição", "Carrossel", "Rascunho", -1, 0],
  ["aurora", "Luz da manhã", "Reel", "Publicado", -2, 5840, "aurora"],
  ["casa", "Uma casa em calma", "Imagem", "Publicado", -4, 4500, "texturas"],
  ["forma", "Estudos de forma", "Reel", "Publicado", -3, 2310, "aurora"],
  ["forma", "Paleta de novembro", "Carrossel", "Rascunho", -1, 0],
  ["aurora", "Diário visual", "Reel", "Agendado", -1, 0],
  ["casa", "Novos ângulos", "Carrossel", "Agendado", -3, 0],
  ["forma", "Processo criativo", "Story", "Agendado", 0, 0],
];

// Synthetic period totals, independent of the daily chart and interaction samples.
export function demoPeriodInsights(account, start, end) {
  const days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
  const age = (Date.parse(demo.today) - Date.parse(end)) / 86400000;
  const scale = account.followers / 8420;
  const reach = Math.round(5500 * Math.sqrt(days) * scale * (1 - age * .002));
  return {reach, accountsEngaged:Math.round(reach * (.16 + age * .0015))};
}

export function demoFollowerSnapshot(account, date) {
  const age = (Date.parse(demo.today) - Date.parse(date)) / 86400000;
  return age >= 0 && age <= 180 ? account.followers - age * (account.id === "casa" ? 4 : 7) : null;
}
export const posts = records.map(([account, title, format, status, days, reach, cover], id) => ({
  id, account, title, format, status, reach, cover, date: offsetDay(demo.today, days),
  hour: ["15:20", "12:40", "10:10", "16:25", "11:15"][id % 5],
  scheduled: status === "Agendado" ? offsetDay(demo.today, 1 + id % 4) : null,
}));

// Demonstration occurrences. Scheduled timestamps carry the Brasília offset.
const historicSchedules = new Map([[0,[0,"09:00"]],[1,[0,"14:30"]],[3,[-1,"18:00"]],
  [5,[-2,"11:00"]],[6,[-4,"08:30"]],[7,[-3,"15:00"]]]);
export const demoSchedules = posts.flatMap(post => {
  const history = historicSchedules.get(post.id);
  const date = history ? offsetDay(demo.today,history[0]) : post.scheduled;
  if (!date) return [];
  return [{...post, occurrence:"demo-"+post.id,
    scheduledAt:date+"T"+(history?.[1] ?? post.hour)+":00-03:00"}];
});
