export const demo = {
  user: "Marina",
  timezone: "America/Sao_Paulo",
  today: "2026-11-06",
  now: "2026-11-06T08:00:00-03:00",
  workspaces: [
    { id: "studio", name: "Estúdio editorial", goal: 12 },
    { id: "lab", name: "Laboratório criativo", goal: 8 },
  ],
  clients: [
    {id:"aurora-studio",workspace:"studio",name:"Aurora Studio"},
    {id:"casanova",workspace:"studio",name:"Casanova Design"},
    {id:"sem-redes",workspace:"studio",name:"Estúdio Horizonte"},
    {id:"forma-lab",workspace:"lab",name:"Forma Lab"},
  ],
  accounts: [
    { id: "aurora", workspace: "studio", client:"aurora-studio", platform:"Instagram", connected:true, name: "@aurora.studio", followers: 8420 },
    { id: "casa", workspace: "studio", client:"casanova", platform:"Instagram", connected:true, name: "@casanova.design", followers: 3900 },
    { id: "forma", workspace: "lab", client:"forma-lab", platform:"Instagram", connected:true, name: "@forma.lab", followers: 1780 },
    { id: "forma-editorial", workspace: "lab", client:"forma-lab", platform:"Instagram", connected:true, name: "@forma.editorial", followers: 320 },
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
  id, account, title, format, status, reach, cover,
  ...(status === "Publicado" ? {views:Math.round(reach * (1.15 + id % 4 * .3)),
    likes:Math.round(reach * .07), comments:18 + id, saves:45 + (id % 3) * 57, shares:28 + id * 7,
    interactions:Math.round(reach * .07) + 18 + id + 45 + (id % 3) * 57 + 28 + id * 7} : {}),
  date: offsetDay(demo.today, days),
  hour: ["15:20", "12:40", "10:10", "16:25", "11:15"][id % 5],
  scheduled: status === "Agendado" ? offsetDay(demo.today, 1 + id % 4) : null,
}));

// The featured preview places the existing third example on its reference day.
const featuredDates = {5:demo.today};
export const demoFeaturedNetworks = {
  0:["instagram","facebook","youtube"],
  1:["instagram","facebook"],
  5:["instagram","tiktok","youtube"],
};
export const demoFeaturedPosts = posts.map(post => {
  const date = featuredDates[post.id];
  return date ? {...post,date,publishedAt:date+"T"+post.hour+":00-03:00"} : post;
});

// Demonstration occurrences. Scheduled timestamps carry the Brasília offset.
const historicSchedules = new Map([[0,[0,"09:00"]],[1,[0,"14:30"]],[3,[-1,"18:00"]],
  [5,[-2,"11:00"]],[6,[-4,"08:30"]],[7,[-3,"15:00"]]]);
const demoClients = Object.fromEntries(demo.accounts.map(({id,client}) => [
  id,demo.clients.find(item => item.id === client)?.name,
]));
export const demoSchedules = posts.flatMap(post => {
  const history = historicSchedules.get(post.id);
  const date = history ? offsetDay(demo.today,history[0]) : post.scheduled;
  if (!date) return [];
  const scheduledAt = date+"T"+(history?.[1] ?? post.hour)+":00-03:00";
  return [{...post, occurrence:"demo-"+post.id, clientName:demoClients[post.account],
    scheduledAt, destinations:[{platform:"instagram",scheduledAt}]}];
});

demoSchedules.push(...[
  ["aurora","Lançamento Aurora","Reel","09:00","aurora",["instagram","facebook","youtube"]],
  ["casa","Bastidores do estúdio","Story","11:30","texturas"],
  ["aurora","Oferta do dia","Imagem","14:00","aurora",["instagram","tiktok"]],
  ["casa","Guia de composição","Carrossel","16:45","texturas"],
  ["aurora","Story de enquete","Story","17:00"],
  ["casa","Reel coleção Bella","Reel","19:00","aurora"],
  ["aurora","Dicas de cuidado com joias","Carrossel","20:30","texturas",["instagram","facebook","tiktok","youtube"]],
].map(([account,title,format,time,cover,platforms=["instagram"]],index) => {
  const scheduledAt = demo.today+"T"+time+":00-03:00";
  return {
    id:"upcoming-"+index, occurrence:"upcoming-"+index, account,title,format,cover,
    clientName:demoClients[account],status:"Agendado",scheduledAt,
    destinations:platforms.map(platform => ({platform,scheduledAt})),
  };
}));

// Confirmed historical fixtures scoped to the editorial heatmap.
export const demoEditorialHistory = demo.accounts.flatMap(({id:account},index) =>
  Array.from({length:174},(_,day) => {
    const seed = (day * 17 + Math.floor(day / 7) * 3 + index * 13) % 29;
    const count = seed < 11 ? 0 : seed % 5;
    const date = offsetDay(demo.today, -(day + 7));
    return Array.from({length:count},(_,item) => ({
      id: "editorial-"+account+"-"+date+"-"+item, account, date,
      status:"Publicado", title:"Publicação de exemplo "+(item+1),
    }));
  }).flat()
);

// Explicit sample metadata for the publication detail preview.
export const demoPublicationDetails = {
  0: { caption:"A Coleção Aurora chegou.\n\nFormas simples e cores quentes para os pequenos rituais do dia.", media:["aurora"],
    destinations:[{account:"aurora", scheduledAt:"2026-11-06T09:00:00-03:00", publishedAt:"2026-11-06T15:20:00-03:00"}] },
  1: { caption:"Texturas naturais, luz suave e detalhes que convidam a olhar de novo.\n\nDeslize para ver a composição completa.", media:["texturas","aurora"],
    destinations:[{account:"casa", publishedAt:"2026-11-06T12:40:00-03:00"}] },
  5: { caption:"A primeira luz do dia, em três tons.", media:["aurora"],
    destinations:[{account:"aurora", scheduledAt:"2026-11-04T11:00:00-03:00", publishedAt:"2026-11-04T15:20:00-03:00"}] },
};

// Historical fixtures used exclusively by the format comparison.
export const demoFormatHistory = [
  {account:"aurora",date:offsetDay(demo.today,-1),format:"Reel",views:9420,reach:8200,likes:950},
  {account:"casa",date:offsetDay(demo.today,-1),format:"Carrossel",views:10110,reach:7900,likes:480},
  {account:"aurora",date:offsetDay(demo.today,-8),format:"Reel",views:8700,reach:7100,likes:850},
  {account:"casa",date:offsetDay(demo.today,-8),format:"Carrossel",views:10600,reach:7600,likes:420},
].map(post => ({...post,status:"Publicado"}));
