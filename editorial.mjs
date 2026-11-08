import { demo, demoBioBanners, demoBioClicks, demoFeaturedNetworks, demoFeaturedPosts, demoFormatHistory, offsetDay } from "./demo-data.mjs";
import { comparePublicationFormats, selectEditorialPeriods, summarizeLinkBio } from "./analytics.mjs";

const labels = {reel:"Reels", carousel:"Carrosséis", feed:"Feed", story:"Stories"};
const metrics = [
  ["reach","Alcance","users-round"], ["views","Visualizações","eye"], ["likes","Curtidas","heart"],
  ["comments","Comentários","message-circle"], ["saves","Salvamentos","bookmark"], ["shares","Compartilhamentos","share-2"],
];
const comparison = {views:"Visualizações médias", reach:"Alcance médio", likes:"Curtidas médias", comments:"Comentários médios", saves:"Salvamentos médios", shares:"Compartilhamentos médios"};
const compact = new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1});
const number = new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1});
const formatValue = (value, suffix = "") => Number.isFinite(value) ? number.format(value) + suffix : "Indisponível";
const root = id => document.getElementById(id);
const empty = message => '<p class="empty">' + message + '</p>';

export function rankPosts(posts) {
  const seen = new Set();
  return posts.filter(post => post.status === "Publicado" && Number.isFinite(post.reach) && post.reach >= 0)
    .sort((a,b) => b.reach-a.reach || String(b.date ?? "").localeCompare(String(a.date ?? "")))
    .filter(post => {
      const key = JSON.stringify([post.account,post.externalId ?? post.id]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0,3);
}

function metricSelector(chart) {
  const labels = {views:"Visualizações",reach:"Alcance",likes:"Curtidas",comments:"Comentários",saves:"Salvamentos",shares:"Compartilhamentos"};
  chart.innerHTML = '<div class="metric-segments scroll-region" role="radiogroup" aria-label="Métrica">'+
    '<div class="metric-segments-track"><span class="metric-segments-pill" aria-hidden="true"></span>'+
    Object.entries(labels).map(([key,label]) =>
      '<label class="metric-segment"><input type="radio" name="format-metric" value="'+key+'"'+
      (key==="views"?' checked':'')+'><span>'+label+'</span></label>').join("")+
    '</div></div><div class="editorial-well" aria-live="polite"></div>';
  const viewport = chart.querySelector(".metric-segments");
  const track = viewport.firstElementChild;
  function position() {
    const segment = track.querySelector("input:checked").parentElement;
    const left = segment.offsetLeft;
    const width = segment.offsetWidth;
    track.style.setProperty("--segment-x",left+"px");
    track.style.setProperty("--segment-width",width+"px");
    if (left < viewport.scrollLeft) viewport.scrollLeft = left;
    if (left+width > viewport.scrollLeft+viewport.clientWidth) viewport.scrollLeft = left+width-viewport.clientWidth+4;
  }
  viewport.addEventListener("change",position);
  const observer = new ResizeObserver(position);
  observer.observe(viewport);
  track.querySelectorAll(".metric-segment").forEach(segment => observer.observe(segment));
  position();
  return viewport;
}

export function renderIntelligence(data, {isDemo,today,icon,formatDate}) {
  // This static preview has no authorized Insights adapter. All populated values are fixtures.
  const accountIds = new Set(data.accounts.map(account => account.id));
  renderLinkBio(data,accountIds,isDemo,icon,formatDate);
  const story = {id:"story-fixture",account:"aurora",status:"Publicado",title:"Detalhes da coleção",format:"Story",date:offsetDay(today,-1),views:2320,reach:2040};
  if (!data.accounts.length) {
    root("featured").innerHTML = empty("Sem conteúdos classificados neste período.");
    root("formats").innerHTML = empty("Sem publicações para comparar por formato.");
    return;
  }

  const history = isDemo ? [...demoFeaturedPosts,...demoFormatHistory,story] : [];
  const scope = selectEditorialPeriods(history,accountIds,data.start,data.end);
  const chart = root("formats");
  const featuredNote = root("featured-title").nextElementSibling;
  featuredNote.textContent = "Top 3 por alcance · "+(scope.historical ? "Histórico até "+formatDate(data.end) : "Publicações do período")+" · Métricas acumuladas.";
  renderFeatured(scope.current,data.accounts,icon);
  function renderComparison(key) {
    const {formats,previousStart,previousEnd,historical} = comparePublicationFormats(history,accountIds,data.start,data.end,key);
    const peak = Math.max(1,...formats.map(({now,before}) => (now.value ?? 0)+(before.value ?? 0)));
    const step = Math.pow(10,Math.floor(Math.log10(peak/4)));
    const max = Math.ceil(peak/(4*step))*4*step;
    const current = historical ? "até "+formatDate(data.end) : formatDate(data.start)+" a "+formatDate(data.end);
    const prior = historical ? "até "+formatDate(previousEnd) : formatDate(previousStart)+" a "+formatDate(previousEnd);
    const partial = data.start <= today && data.end >= today ? " · inclui hoje, parcial" : "";
    const panel = chart.querySelector(".editorial-well");
    if (!panel.querySelector(".format-plot")) {
      panel.innerHTML = '<div class="format-legend"><span data-series="current"></span><span data-series="previous"></span></div>'+
        '<div class="format-chart"><div class="format-axis" aria-hidden="true"></div><div class="format-plot">'+
        formats.map(({format}) =>
          '<section class="format-comparison" data-format="'+format+'"><div class="format-stack">'+
          '<span class="format-change"></span>'+
          ["previous","current"].map(period => '<div class="format-series" data-series="'+period+'" tabindex="0">'+
            '<strong></strong><span class="format-tooltip" aria-hidden="true"></span></div>').join("")+
          '</div><h3>'+labels[format]+'</h3></section>').join("")+
        '</div></div>';
    }
    panel.querySelector('.format-legend [data-series="current"]').textContent = "Atual";
    panel.querySelector('.format-legend [data-series="previous"]').textContent = "Anterior";
    panel.querySelector(".format-axis").innerHTML = [1,.75,.5,.25,0].map(fraction =>
      '<span>'+formatFeaturedMetric(max*fraction)+'</span>').join("");
    for (const {format,now,before,change} of formats) {
      const column = panel.querySelector('[data-format="'+format+'"]');
      const changeLabel = column.querySelector(".format-change");
      changeLabel.dataset.trend = change === null || change === 0 ? "neutral" : change > 0 ? "up" : "down";
      changeLabel.textContent = change === null ? "—" : (change>0?"+":"")+formatValue(change,"%");
      changeLabel.setAttribute("aria-label",change === null ? "Sem base comparável" : "Variação "+changeLabel.textContent);
      for (const [period,sample,dates] of [["current",now,current+partial],["previous",before,prior]]) {
        const segment = column.querySelector('[data-series="'+period+'"]');
        const {value,total,measured} = sample;
        const periodLabel = period === "current" ? "Atual" : "Anterior";
        const result = value === null ? (total ? "Métrica indisponível" : "Sem publicações") : formatValue(value);
        const detail = [labels[format],periodLabel+" "+dates,comparison[key]+": "+result,
          measured+" de "+total+" publicações",measured===1 ? "Amostra pequena" : "",
          historical ? "Conjuntos sobrepostos, com métricas acumuladas da mesma base" : ""].filter(Boolean).join(" · ");
        segment.style.setProperty("--segment-height",((value ?? 0)/max*100)+"%");
        segment.dataset.empty = String(value === null || value === 0);
        segment.setAttribute("aria-label",detail);
        segment.querySelector("strong").textContent = formatFeaturedMetric(value);
        segment.querySelector(".format-tooltip").textContent = detail;
      }
    }
  }
  const control = chart.querySelector(".metric-segments") ?? metricSelector(chart);
  control.onchange = event => renderComparison(event.target.value);
  renderComparison(control.querySelector("input:checked").value);

}

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
const publicationTitle = post => post.title || post.format + " sem título";

const featuredNumber = new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2});

export function formatFeaturedMetric(value) {
  if (!Number.isFinite(value)) return "—";
  for (const [threshold,suffix] of [[1e9,"B"],[1e6,"M"],[1e3,"K"]]) {
    if (Math.abs(value) >= threshold) return featuredNumber.format(value/threshold)+suffix;
  }
  return featuredNumber.format(value);
}

function metricPanel(post, icon, position) {
  return '<dl class="publication-metrics publication-metrics-list">' + metrics.map(([key,label,symbol]) => {
    const value = post[key];
    const id = "featured-metric-"+position+"-"+key;
    return '<div><dt tabindex="0" aria-describedby="'+id+'">'+icon(symbol)+'<span class="sr-only">'+label+'</span>'+
      '<span class="format-tooltip" id="'+id+'" role="tooltip">'+label+" · "+formatValue(value)+
      '</span></dt><dd>'+formatFeaturedMetric(value)+'</dd></div>';
  }).join("") + '</dl>';
}

function publicationMedia(cover, icon, lazy = false) {
  return /^[a-z-]+$/.test(cover ?? "") ? '<img '+(lazy?'loading="lazy" ':'')+'src="./'+cover+'.svg" alt="">' :
    '<span class="publication-placeholder">'+icon("media")+'Prévia indisponível</span>';
}

export const publicationFormatIcons = {Reel:"video",Carrossel:"layers",Imagem:"image",Feed:"image",Story:"phone"};

export function publicationFormatTag(format, icon) {
  const tag = document.createElement("span");
  tag.className = "scheduled-tag scheduled-tag-format";
  if (Object.hasOwn(publicationFormatIcons,format)) tag.innerHTML = icon(publicationFormatIcons[format]);
  const label = document.createElement("span");
  label.textContent = format === "Imagem" ? "Feed" : format;
  tag.append(label);
  return tag;
}

const scheduledPlatforms = {instagram:"Instagram",facebook:"Facebook",tiktok:"TikTok",youtube:"YouTube",whatsapp:"WhatsApp"};
export const destinationName = ({platform}) => scheduledPlatforms[platform] ?? "Outro destino";

export function publicationNetworkBadges(destinations, icon) {
  const group = document.createDocumentFragment();
  if (destinations.length) {
    for (const destination of destinations.slice(0,3)) {
      const brand = document.createElement("span");
      brand.className = "scheduled-brand";
      const name = destinationName(destination);
      brand.title = name;
      brand.setAttribute("role","img");
      brand.setAttribute("aria-label",name);
      if (Object.hasOwn(scheduledPlatforms,destination.platform)) {
        brand.dataset.platform = destination.platform;
        brand.innerHTML = icon("brand-"+destination.platform);
      } else brand.textContent = "?";
      group.append(brand);
    }
    if (destinations.length > 3) {
      const extra = destinations.slice(3);
      const more = document.createElement("span");
      more.className = "scheduled-brand scheduled-brand-more";
      more.textContent = "+"+extra.length;
      more.title = extra.map(destinationName).join(", ");
      more.setAttribute("aria-label","Mais destinos: "+more.title+". Abra o cartão para ver os detalhes.");
      group.append(more);
    }
  }
  return [...group.children];
}

function rankingBadge(position, icon) {
  const symbol = ["crown","star","award"][position-1];
  return '<span class="publication-place">'+icon(symbol)+position+'º lugar</span>';
}

function renderFeatured(posts, accounts, icon) {
  const scope = new Map(accounts.map(account => [account.id,account]));
  const ranked = rankPosts(posts.filter(post => scope.has(post.account)));
  const featured = root("featured");
  if (!ranked.length) {
    featured.innerHTML = empty("Nenhuma publicação com alcance disponível neste período.");
    return;
  }
  featured.innerHTML = '<div class="editorial-ranking scroll-region" tabindex="0" role="region" aria-label="Ranking de publicações. Use as setas para navegar na horizontal.">'+ranked.map((post,index) => {
    const account = scope.get(post.account);
    const client = demo.clients.find(item => item.id === account.client)?.name ?? "Cliente indisponível";
    const title = escapeHtml(publicationTitle(post));
    const position = index+1;
    const platform = account.platform?.toLowerCase();
    const platforms = demoFeaturedNetworks[post.id] ?? [platform].filter(name => Object.hasOwn(scheduledPlatforms,name));
    const badges = publicationNetworkBadges(platforms.map(platform => ({platform})),icon)
      .map(badge => badge.outerHTML).join("");
    const network = badges ? '<span class="publication-network">'+badges+'</span>' : "";
    return '<article class="editorial-post" data-place="'+position+'"><div class="publication-preview">'+publicationMedia(post.cover,icon,true)+
      rankingBadge(position,icon)+
      publicationFormatTag(post.format,icon).outerHTML+'</div><div class="publication-summary"><h3>'+title+'</h3><div class="publication-meta"><p class="muted scheduled-meta-item publication-client">'+icon("building")+'<span title="'+escapeHtml(client)+'">'+escapeHtml(client)+'</span></p>'+network+'</div>'+
      metricPanel(post,icon,position)+'</div></article>';
  }).join("")+"</div>";
}

function renderLinkBio(data, accounts, isDemo, icon, formatDate) {
  const overview = root("bio-overview");
  const ranking = root("bio-ranking");
  const result = isDemo ? summarizeLinkBio(demoBioBanners,demoBioClicks,accounts,data.start,data.end,Date.parse(demo.now)) : null;
  const stats = [
    ["Cliques","mouse-pointer-click",result?.clicks,result?.change],
    ["No ar","radio",result?.statuses.live],
    ["Programados","calendar-clock",result?.statuses.scheduled],
    ["Inativos","circle-pause",result?.statuses.inactive],
  ];
  overview.innerHTML = '<dl class="bio-stats">'+stats.map(([label,symbol,value,change],index) => {
    const available = Number.isFinite(change);
    const tone = !available || change===0 ? " neutral" : change<0 ? " down" : "";
    const badge = available ? (change>0?"+":"")+formatValue(change,"%") : "—";
    const tooltipId = "bio-comparison-"+index;
    const detail = index===0 ? "Sem base anterior comparável." : "Comparação histórica ainda indisponível.";
    const comparison = '<span class="trend'+tone+'"'+
      (available ? "" : ' tabindex="0" aria-describedby="'+tooltipId+'"')+'>'+badge+
      (available ? "" : '<span class="format-tooltip" role="tooltip" id="'+tooltipId+'">'+detail+'</span>')+'</span>';
    return '<div class="bio-stat"><dt>'+label+'<span class="bio-stat-icon">'+icon(symbol)+'</span></dt><dd class="value">'+
      formatFeaturedMetric(value)+'</dd><dd class="kpi-comparison bio-comparison">'+comparison+'<span>vs. período anterior</span></dd></div>';
  }).join("")+'</dl><p class="muted bio-note">'+
    (isDemo ? "Demonstração · Status em "+formatDate(demo.today) : "Dados de Link Bio indisponíveis.")+'</p>';
  if (!result?.ranking.length) {
    ranking.innerHTML = empty(isDemo ? "Nenhum clique registrado no período para a seleção." : "Ranking indisponível.");
    return;
  }
  const statuses = {live:"No ar",scheduled:"Programado",inactive:"Inativo"};
  ranking.innerHTML = '<div class="table-wrap bio-table"><table aria-label="Banners mais clicados"><thead><tr>'+
    ["Posição","Banner","Cliente","Cliques","Status atual"].map(label=>'<th scope="col">'+label+'</th>').join("")+
    '</tr></thead><tbody>'+result.ranking.map((banner,index) => {
      const account = data.accounts.find(item => item.id === banner.account);
      const client = demo.clients.find(item => item.id === account?.client)?.name ?? "Cliente indisponível";
      return '<tr><td data-label="Posição">'+(index+1)+'º</td><td data-label="Banner"><span class="bio-banner">'+
        publicationMedia(banner.cover,icon,true)+escapeHtml(banner.name)+'</span></td><td data-label="Cliente">'+escapeHtml(client)+
        '</td><td data-label="Cliques"><strong title="'+formatValue(banner.clicks)+'" aria-label="'+formatValue(banner.clicks)+' cliques">'+
        formatFeaturedMetric(banner.clicks)+'</strong></td><td data-label="Status atual"><span class="bio-status" data-status="'+
        (banner.status ?? "")+'">'+(statuses[banner.status] ?? "Indisponível")+'</span></td></tr>';
    }).join("")+'</tbody></table></div>';
}
