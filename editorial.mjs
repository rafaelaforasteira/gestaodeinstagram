import { demo, demoFeaturedNetworks, demoFeaturedPosts, demoFormatHistory, offsetDay } from "./demo-data.mjs";
import { comparePublicationFormats, completeTotal, selectEditorialPeriods } from "./analytics.mjs";

const labels = {reel:"Reels", carousel:"Carrosséis", feed:"Feed", story:"Stories"};
const interactions = {likes:"Curtidas", comments:"Comentários", saves:"Salvamentos", shares:"Compartilhamentos"};
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

export function summarizePosts(posts, key) {
  const measured = posts.filter(post => key === "rate"
    ? Number.isFinite(post.interactions) && Number.isFinite(post.reach) && post.reach > 0
    : Number.isFinite(post[key]));
  if (!measured.length) return null;
  return key === "rate"
    ? measured.reduce((total,post) => total + post.interactions,0) / measured.reduce((total,post) => total + post.reach,0) * 100
    : measured.reduce((total,post) => total + post[key],0) / measured.length;
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

export function renderIntelligence(data, {isDemo,today,snapshot,icon,formatDate}) {
  // This static preview has no authorized Insights adapter. All populated values are fixtures.
  const accountIds = new Set(data.accounts.map(account => account.id));
  const story = {id:"story-fixture",account:"aurora",status:"Publicado",title:"Detalhes da coleção",format:"Story",date:offsetDay(today,-1),views:2320,reach:2040};
  const posts = isDemo ? data.activity.filter(post => post.status === "Publicado") : [];
  if (isDemo && accountIds.has(story.account) && story.date >= data.start && story.date <= data.end) posts.push(story);
  const mounted = ["featured","formats","engagement","audience","profile-actions"];
  if (!data.accounts.length) {
    const messages = ["Sem conteúdos classificados neste período.","Sem publicações para comparar por formato.",
      "Interações indisponíveis para este período.","Não há histórico suficiente para calcular a evolução.",
      "Essas informações não estão disponíveis para as contas selecionadas."];
    mounted.forEach((id,index) => { root(id).innerHTML = empty(messages[index]); });
    root("editorial-source").textContent = "Nenhuma fonte de Instagram Insights conectada.";
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
        '</div></div><p class="editorial-note muted format-method"></p>';
    }
    panel.querySelector('.format-legend [data-series="current"]').textContent = "Atual";
    panel.querySelector('.format-legend [data-series="previous"]').textContent = "Anterior";
    const method = panel.querySelector(".format-method");
    method.hidden = !historical;
    method.textContent = historical ? "Até "+formatDate(data.end)+" vs. até "+formatDate(previousEnd)+
      ". Os conjuntos se sobrepõem e usam métricas acumuladas da mesma base." : "";
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
          measured+" de "+total+" publicações",measured===1 ? "Amostra pequena" : ""].filter(Boolean).join(" · ");
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

  const measured = posts.filter(post => post.format !== "Story");
  const mix = Object.entries(interactions).map(([key,label]) => {
    const values = measured.map(post => post[key]).filter(Number.isFinite);
    return {label,value:values.length ? values.reduce((a,b) => a+b,0) : null};
  });
  const maxMix = Math.max(1,...mix.map(item => item.value ?? 0));
  const rate = summarizePosts(measured,"rate");
  root("engagement").innerHTML = '<div class="editorial-well editorial-lines">'+mix.map(({label,value}) =>
    '<div><span>'+label+'</span><strong>'+formatValue(value)+'</strong><div class="engagement-track" aria-hidden="true"><i style="--bar:'+((value ?? 0)/maxMix*100)+'%"></i></div></div>').join("")+
    '</div><p class="editorial-note">Taxa de interação <strong>'+formatValue(rate,"%")+'</strong><br><span class="muted">Interações ÷ soma dos alcances por publicação.</span></p>';

  const end = data.end > today ? today : data.end;
  const countAt = day => completeTotal(data.accounts, account => snapshot(account,day));
  const days = Math.round((Date.parse(end)-Date.parse(data.start))/86400000)+1;
  const series = days > 0 ? Array.from({length:days+1},(_,index) => {
    const date = offsetDay(data.start,index-1);
    return {date,value:countAt(date)};
  }) : [];
  const net = series.length > 1 && series.every(({value}) => Number.isFinite(value))
    ? series.at(-1).value-series[0].value : null;
  root("audience").innerHTML = net === null ? empty("Não há histórico suficiente para calcular a evolução.") : audienceChart(series,net,formatDate);

  root("profile-actions").innerHTML = data.current.length ? '<dl class="editorial-well profile-metrics"><div><dt>Visitas ao perfil</dt><dd>'+formatValue(data.current.reduce((total,row) => total + Math.round(row.reach * .035),0))+'</dd></div><div><dt>Toques em links</dt><dd>Indisponível</dd></div></dl><p class="muted editorial-note">Visitas simuladas apenas na demonstração.</p>' : empty("Essas informações não estão disponíveis para as contas selecionadas.");
  root("editorial-source").textContent = "Dados fictícios de demonstração · "+formatDate(data.start)+" a "+formatDate(data.end)+
    (data.end >= today && data.start <= today ? " · Hoje é um período parcial." : "");
}

function audienceChart(series, net, formatDate) {
  const values = series.map(item => item.value);
  const min = Math.min(...values), span = Math.max(1,Math.max(...values)-min);
  const points = values.map((value,index) => [5+index/(values.length-1)*290,85-(value-min)/span*72]);
  return '<p class="audience-total"><strong>'+(net>0?"+":"")+formatValue(net)+'</strong> seguidores líquidos</p>'+
    '<div class="editorial-well"><svg class="audience-chart" viewBox="0 0 300 94" preserveAspectRatio="none" aria-hidden="true"><path d="M5 85H295M5 49H295M5 13H295"/>'+
    '<polyline points="'+points.map(point => point.join(",")).join(" ")+'"/></svg>'+
    '<div class="audience-labels"><span>'+formatDate(series[0].date)+' · '+formatValue(values[0])+'</span><span>'+
    formatDate(series.at(-1).date)+' · '+formatValue(values.at(-1))+'</span></div></div>'+
    '<details class="editorial-note"><summary>Valores por data</summary><ul>'+series.map(({date,value}) =>
      '<li>'+formatDate(date)+' · '+formatValue(value)+' seguidores</li>').join("")+'</ul></details>';
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
    const network = badges ? '<p class="publication-network">'+badges+'</p>' : "";
    return '<article class="editorial-post" data-place="'+position+'"><div class="publication-preview">'+publicationMedia(post.cover,icon,true)+
      rankingBadge(position,icon)+
      publicationFormatTag(post.format,icon).outerHTML+'</div><div class="publication-summary"><h3>'+title+'</h3><p class="muted scheduled-meta-item publication-client">'+icon("building")+'<span>'+escapeHtml(client)+'</span></p>'+network+
      metricPanel(post,icon,position)+'</div></article>';
  }).join("")+"</div>";
}
