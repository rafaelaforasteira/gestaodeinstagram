import { createBannerDatePicker } from "./banner-date-picker.mjs";
import { composerDropdowns } from "./composer.mjs";
import { connectSegmentIndicator } from "./agenda.mjs";
import { demo, demoBioBanners, demoBioClicks } from "./demo-data.mjs";
import { bannerStatus, summarizeLinkBio } from "./analytics.mjs";

const statuses = {live:"No ar",scheduled:"Programado",inactive:"Inativo"};
const clock = () => Date.parse(demo.now);
const localTime = value => value ? new Intl.DateTimeFormat("sv-SE",{
  timeZone:demo.timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",
}).format(new Date(value)).replace(" ","T") : "";
const safeUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
};

export function createBannerManager({workspace,accounts,clients,icon,installScrollIndicator,refresh,getRange}) {
  const root = document.querySelector("#banners");
  const form = document.querySelector("#banner-editor");
  const dialog = form.closest("dialog");
  const list = root.querySelector(".banner-list");
  const filter = root.querySelector(".banner-segments");
  connectSegmentIndicator(filter);
  const error = form.querySelector("[role=alert]");
  const storageKey = "studio-banners-v1-"+workspace;
  const scope = new Map(accounts.map(account => [account.id,account]));
  const clientName = id => clients.find(item => item.id === scope.get(id)?.client)?.name ?? "";
  const scoped = () => demoBioBanners.filter(item => scope.has(item.account));
  // Só banners no ar ou programados ocupam posição no Link Bio; inativos ficam fora da ordem.
  const inOrder = item => item.state!=="archived" && bannerStatus(item,clock())!=="inactive";
  const sorted = () => scoped().sort((a,b) => (a.order ?? 0)-(b.order ?? 0));
  const create = (tag,text) => Object.assign(document.createElement(tag),{textContent:text ?? ""});
  const action = (label,fn) => {
    const button = create("button",label);
    button.type = "button";
    button.className = "button";
    button.addEventListener("click",fn);
    return button;
  };
  const message = text => {root.querySelector("[role=status]").textContent = text;};
  const field = name => form.elements.namedItem(name);
  for (const name of ["name","url"]) {
    const feedback = form.querySelector('[data-error="'+name+'"]');
    feedback.id = "banner-error-"+name;
    field(name).setAttribute("aria-describedby",feedback.id);
    field(name).addEventListener("input",()=>{
      feedback.textContent="";
      field(name).removeAttribute("aria-invalid");
    });
  }
  let editing, image, cover, dragged, initialDetails, initialState;
  let uploadRevision = 0;
  let storedVersion = localStorage.getItem(storageKey);
  const positionField = form.querySelector(".banner-position-field");
  const dropdowns = composerDropdowns(dialog,positionField,icon);
  const startPicker = createBannerDatePicker(form.querySelector('[data-date="start"]'),dialog,"Início *",icon);
  const endPicker = createBannerDatePicker(form.querySelector('[data-date="end"]'),dialog,"Término — opcional",icon,true);
  let managingClient;
  let scrollCleanups = [];
  const manager = document.querySelector("#banner-manager");
  const managerContent = manager.querySelector(".banner-manager-content");
  let managerFilter = "";
  let pendingFocus = "";
  let confirmingArchive = "";
  manager.addEventListener("close",()=>{managingClient=undefined;managerFilter="";confirmingArchive="";});
  manager.querySelector("[data-bm-close]").addEventListener("click",()=>manager.close());
  function manage(clientId) {
    managingClient = clientId;
    render();
    if (!manager.open) manager.showModal();
  }
  const displayTime = value => {
    if (!value) return "Sem término";
    const instant = Date.parse(value);
    return Number.isFinite(instant) ? new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",dateStyle:"short",timeStyle:"short"}).format(instant) : "Indisponível";
  };
  function commit(items) {
    if (localStorage.getItem(storageKey) !== storedVersion) {
      message("A ordem foi alterada em outra aba. Recarregue para continuar.");
      error.textContent = "A ordem foi alterada em outra aba. Recarregue e tente novamente.";
      return false;
    }
    try {
      const serialized = JSON.stringify(items);
      localStorage.setItem(storageKey,serialized);
      storedVersion = serialized;
    }
    catch { message("Não foi possível salvar. Verifique o espaço disponível no navegador."); return false; }
    for (let i=demoBioBanners.length-1;i>=0;i--) {
      if (scope.has(demoBioBanners[i].account)) demoBioBanners.splice(i,1);
    }
    demoBioBanners.push(...items);
    refresh();
    render();
    return true;
  }
  if (workspace) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved)) {
        const newSamples = scoped().filter(item => item.id.startsWith("banner-sample-") &&
          !saved.some(stored => stored.id===item.id));
        saved.push(...newSamples);
        for (let i=demoBioBanners.length-1;i>=0;i--) {
          if (scope.has(demoBioBanners[i].account)) demoBioBanners.splice(i,1);
        }
        demoBioBanners.push(...saved.filter(item => scope.has(item.account)));
      }
    } catch { message("Não foi possível carregar os banners salvos."); }
  }
  function picture(banner) {
    const src = banner.image || (["aurora","texturas"].includes(banner.cover) ? "./"+banner.cover+".svg" : "");
    if (!src) return create("span","Sem imagem");
    const img = create("img");
    img.src = src;
    img.alt = "Prévia do banner "+(banner.name || "");
    img.loading = "lazy";
    return img;
  }
  function positionChoices() {
    dropdowns.close();
    const account = field("account").value;
    const clientId = scope.get(account)?.client;
    const siblings = sorted().filter(item => inOrder(item) &&
      scope.get(item.account)?.client===clientId && item.id!==editing?.id);
    const selected = editing && scope.get(editing.account)?.client===clientId && inOrder(editing) ?
      sorted().filter(item=>inOrder(item) && scope.get(item.account)?.client===clientId).findIndex(item=>item.id===editing.id)+1 : siblings.length+1;
    const label = create("label","Posição do banner *");
    const source = create("select");
    source.name = "position";
    source.dataset.field = "banner-position";
    source.required = true;
    source.disabled = !clientId;
    const ordinals = ["Primeiro","Segundo","Terceiro","Quarto","Quinto","Sexto","Sétimo","Oitavo","Nono","Décimo"];
    for (let position=1;position<=siblings.length+1;position++) {
      source.add(new Option(position+"º — "+(ordinals[position-1] ?? position+"º")+" banner",String(position)));
    }
    source.value = String(Math.max(1,selected));
    const hint = create("p");
    hint.className = "muted banner-position-hint";
    hint.id = "banner-position-hint";
    source.setAttribute("aria-describedby",hint.id);
    function describePosition() {
      hint.textContent = Number(source.value)===siblings.length+1 ?
        "O banner será adicionado ao final do Link Bio." :
        "O banner será inserido na "+source.value+"ª posição. Os banners seguintes serão deslocados automaticamente.";
    }
    source.addEventListener("change",describePosition);
    label.append(source);
    positionField.replaceChildren(label,hint);
    describePosition();
    dropdowns.enhance();
    positionField.querySelector(".composer-select")?.setAttribute("aria-describedby","composer-value-banner-position banner-position-hint");
  }
  function edit(banner,duplicate=false,clientId,selectedAccount) {
    const available = accounts.filter(account=>account.client===clientId);
    if (!banner && !selectedAccount && available.length>1) {
      const chooser = document.querySelector("#banner-account-picker");
      chooser.querySelector("div").replaceChildren(...available.map(account=>action(account.name,()=>{
        chooser.close();
        edit(banner,duplicate,clientId,account.id);
      })));
      chooser.showModal();
      return;
    }
    uploadRevision++;
    form.querySelector("[type=submit]").disabled = false;
    form.querySelector("[type=submit]").textContent = "Salvar banner";
    editing = duplicate ? null : banner;
    initialDetails = banner ? {title:banner.title,description:banner.description,cta:banner.cta} : {};
    initialState = duplicate ? "paused" : banner?.state ?? "published";
    image = banner?.image || "";
    cover = banner?.cover;
    form.reset();
    form.querySelector("h2").textContent = editing ? "Editar banner" : "Novo banner";
    field("account").value = banner?.account ?? selectedAccount ?? available[0]?.id ?? "";
    field("name").value = banner?.title || banner?.name || "";
    field("url").value = banner?.url ?? "";
    if (duplicate) field("name").value += " (cópia)";
    startPicker.set(localTime(banner?.startsAt ?? demo.now));
    endPicker.set(localTime(banner?.endsAt));
    form.querySelector(".banner-media").replaceChildren(...(image || cover ? [picture({...banner,image})] : []));
    const account = scope.get(field("account").value);
    const identity = form.querySelector(".banner-editor-client");
    const avatar = create("span",clientName(account?.id).charAt(0));
    avatar.className = "banner-client-avatar";
    const accountInfo = create("div");
    accountInfo.append(create("strong",clientName(account?.id)),create("p",account?.name || ""));
    identity.replaceChildren(avatar,accountInfo);
    form.querySelector("[data-remove-image]").hidden = !image && !cover;
    for (const target of form.querySelectorAll("[data-error]")) target.textContent = "";
    error.textContent = "";
    positionChoices();
    dialog.showModal();
    if (!banner && !clientId) field("account").focus();
  }
  const upload = async file => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size>1024*1024) {
      error.textContent = "Selecione uma imagem JPEG, PNG ou WebP de até 1 MB.";
      return;
    }
    const revision = ++uploadRevision;
    const save = form.querySelector("[type=submit]");
    save.disabled = true;
    save.textContent = "Carregando imagem…";
    try {
      const bitmap = await createImageBitmap(file);
      const valid = bitmap.width>=32 && bitmap.height>=32 && bitmap.width<=4096 && bitmap.height<=4096;
      bitmap.close();
      if (!valid) throw Error();
      const loadedImage = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      if (revision !== uploadRevision || !dialog.open) return;
      image = loadedImage;
      form.querySelector(".banner-media").replaceChildren(picture({image}));
      form.querySelector("[data-remove-image]").hidden = false;
      form.querySelector('[data-error="image"]').textContent = "";
      error.textContent = "";
    } catch { error.textContent = "Use uma imagem válida de 32 a 4096 px em cada dimensão."; }
    finally { if (revision===uploadRevision) {save.disabled = false;save.textContent = "Salvar banner";} }
  };
  field("file").addEventListener("change",event => upload(event.target.files[0]));
  const drop = form.querySelector(".banner-upload");
  drop.addEventListener("click",event=>{if(event.target!==field("file")) field("file").click();});
  drop.addEventListener("keydown",event=>{
    if(event.key==="Enter" || event.key===" ") {event.preventDefault();field("file").click();}
  });
  drop.addEventListener("dragover",event => {event.preventDefault();drop.dataset.dragging="";});
  drop.addEventListener("dragleave",()=>delete drop.dataset.dragging);
  drop.addEventListener("drop",event => {event.preventDefault();delete drop.dataset.dragging; upload(event.dataTransfer.files[0]);});
  dialog.addEventListener("close",()=>{uploadRevision++;});
  form.querySelector("[data-remove-image]").addEventListener("click",() => {
    uploadRevision++;
    form.querySelector("[type=submit]").disabled = false;
    form.querySelector("[type=submit]").textContent = "Salvar banner";
    image = "";
    field("file").value = "";
    form.querySelector(".banner-media").replaceChildren();
    cover = undefined;
  });
  form.addEventListener("submit",event => {
    event.preventDefault();
    const account = field("account").value;
    const name = field("name").value.trim();
    const url = safeUrl(field("url").value);
    for (const target of form.querySelectorAll("[data-error]")) target.textContent = "";
    error.textContent = "";
    const startsAt = startPicker.instant();
    const endsAt = endPicker.instant();
    const invalid = (key,message) => {
      form.querySelector('[data-error="'+key+'"]').textContent = message;
      field(key)?.setAttribute("aria-invalid","true");
    };
    if (!name || name.length>100) invalid("name","Informe um título de até 100 caracteres.");
    if (!url) invalid("url","Informe um link de destino HTTPS válido.");
    if (!startsAt) invalid("start","Selecione a data e o horário de início.");
    if (endPicker.value() && (!endsAt || !startsAt || Date.parse(endsAt)<=Date.parse(startsAt))) {
      invalid("end","A data de término deve ser posterior ao início.");
    }
    if (!image && !cover) invalid("image","Adicione uma imagem para continuar.");
    if (!scope.has(account)) error.textContent = "O cliente e a conta não estão disponíveis.";
    if (error.textContent || [...form.querySelectorAll("[data-error]")].some(target=>target.textContent)) return;
    const items = sorted().filter(item => item.id !== editing?.id);
    const clientId = scope.get(account).client;
    const siblings = items.filter(item => inOrder(item) && scope.get(item.account).client===clientId);
    const outOfOrder = items.filter(item => item.state!=="archived" && !inOrder(item) && scope.get(item.account).client===clientId);
    const position = Number(field("position").value);
    if (!Number.isInteger(position) || position<1 || position>siblings.length+1) {
      error.textContent = "Escolha uma posição válida para o banner.";
      return;
    }
    const banner = {...editing,...initialDetails,id:editing?.id ?? crypto.randomUUID(),account,name,title:name,url,image,startsAt,endsAt,
      cover,state:initialState};
    siblings.splice(position-1,0,banner);
    const orderById = new Map([...siblings,...outOfOrder].map((item,index)=>[item.id,index]));
    const reordered = [...items,banner].map(item=>orderById.has(item.id) ? {...item,order:orderById.get(item.id)} : item);
    if (commit(reordered)) { dialog.close(); message("Banner salvo na demonstração."); }
    else if (!error.textContent) error.textContent = "Não foi possível salvar o banner neste navegador.";
  });
  form.querySelector(".banner-editor-close").addEventListener("click",()=>dialog.close());
  form.querySelector("[data-cancel-banner]").addEventListener("click",() => dialog.close());
  filter.addEventListener("change",render);
  // Modal "Banners do Link Bio": lista ordenável + prévia ao vivo.
  // A ordem da lista é a ordem do Link Bio; ações secundárias ficam no menu "Mais ações".
  function renderManager(client,siblings,items,move,start,end,now) {
    const el = (tag,className,text) => {
      const node = create(tag,text);
      if (className) node.className = className;
      return node;
    };
    const withIcon = (node,name) => {node.insertAdjacentHTML("afterbegin",icon(name));return node;};
    const short = day => day.split("-").reverse().slice(0,2).join("/");
    const clicksLabel = start===end ? (end===demo.today ? "cliques hoje" : "cliques em "+short(end)) :
      "cliques de "+short(start)+" a "+short(end);
    const statusOf = banner => bannerStatus(banner,now);
    const counts = {live:0,scheduled:0,inactive:0};
    for (const banner of siblings) if (counts[statusOf(banner)] !== undefined) counts[statusOf(banner)]++;

    manager.querySelector(".bm-avatar").textContent = client.name.charAt(0);
    const handles = [...new Set(siblings.map(item=>scope.get(item.account)?.name).filter(name=>name?.startsWith("@")))];
    manager.querySelector(".banner-manager-subtitle").textContent = [client.name,...handles,
      siblings.length+" "+(siblings.length===1?"banner":"banners")+", "+counts.live+" no ar"].join(" · ");

    // Barra: filtro por status com contagem + ação principal
    const toolbar = el("div","bm-toolbar");
    const filterGroup = el("div","bm-filter");
    filterGroup.setAttribute("role","radiogroup");
    filterGroup.setAttribute("aria-label","Filtrar banners por status");
    for (const [value,label,count] of [["","Todos",siblings.length],["live","No ar",counts.live],
      ["scheduled","Programados",counts.scheduled],["inactive","Inativos",counts.inactive]]) {
      const option = el("button","bm-filter-option");
      option.type = "button";
      option.setAttribute("role","radio");
      option.setAttribute("aria-checked",String(managerFilter===value));
      option.dataset.focus = "filter:"+value;
      option.append(create("span",label),el("span","bm-count",String(count)));
      option.addEventListener("click",()=>{managerFilter=value;pendingFocus="filter:"+value;render();});
      filterGroup.append(option);
    }
    const addButton = withIcon(el("button","bm-primary","Novo banner"),"plus");
    addButton.type = "button";
    addButton.disabled = !accounts.some(account=>account.client===client.id);
    addButton.addEventListener("click",()=>edit(undefined,false,client.id));
    toolbar.append(filterGroup,addButton);

    const layout = el("div","bm-layout");
    const listSection = el("section","bm-list");
    listSection.setAttribute("aria-label","Banners de "+client.name);
    const ordered = siblings.filter(banner=>statusOf(banner)!=="inactive");
    const inactive = siblings.filter(banner=>statusOf(banner)==="inactive");
    const visible = managerFilter ? siblings.filter(banner=>statusOf(banner)===managerFilter) : siblings;
    if (ordered.length>1 && managerFilter!=="inactive") {
      const hint = withIcon(el("p","bm-hint","Arraste para mudar a ordem. Banners inativos saem da ordem e descem automaticamente."),"grip-vertical");
      listSection.append(hint);
    }
    if (!visible.length) {
      listSection.append(el("p","bm-empty",siblings.length ? "Nenhum banner com este status." :
        "Nenhum banner cadastrado. Use Novo banner para criar o primeiro."));
    }
    const groups = [
      {key:"ordered",title:"Na ordem do Link Bio",note:"No ar e programados",rows:ordered.filter(item=>visible.includes(item)),tag:"ol"},
      {key:"inactive",title:"Inativos",note:"Fora do Link Bio · ative para voltar à ordem",rows:inactive.filter(item=>visible.includes(item)),tag:"ul"},
    ].filter(group=>group.rows.length);
    const statusChip = status => {
      const [label,symbol] = {live:["No ar","circle-check"],scheduled:["Programado","calendar-clock"],
        inactive:["Inativo","circle-pause"]}[status] ?? ["Indisponível","circle-alert"];
      const chip = withIcon(el("span","bm-chip",label),symbol);
      chip.dataset.status = status ?? "";
      return chip;
    };
    for (const group of groups) {
    const groupSection = el("section","bm-group");
    groupSection.dataset.group = group.key;
    const groupHead = el("div","bm-group-head");
    const groupTitle = el("h3","",group.title);
    groupTitle.id = "bm-group-"+group.key;
    groupHead.append(groupTitle,el("span","bm-count",String(group.rows.length)),el("span","bm-group-note",group.note));
    const list = el(group.tag,"bm-rows");
    list.setAttribute("aria-labelledby",groupTitle.id);
    groupSection.append(groupHead,list);
    for (const banner of group.rows) {
      const inLine = group.key==="ordered";
      const position = ordered.indexOf(banner);
      const status = statusOf(banner);
      const row = el("li","bm-row");
      row.dataset.status = status ?? "";
      row.draggable = inLine;
      row.addEventListener("dragstart",event=>{
        dragged = banner;
        event.dataTransfer.setData("text/plain",banner.id);
        event.dataTransfer.effectAllowed = "move";
        row.dataset.dragging = "";
      });
      row.addEventListener("dragend",()=>{dragged=undefined;delete row.dataset.dragging;});
      row.addEventListener("dragover",event=>{
        if (inLine && dragged && dragged!==banner && ordered.includes(dragged)) {event.preventDefault();row.dataset.dropTarget="";}
      });
      row.addEventListener("dragleave",()=>delete row.dataset.dropTarget);
      row.addEventListener("drop",event=>{
        event.preventDefault();delete row.dataset.dropTarget;
        if (inLine && ordered.includes(dragged)) move(dragged,banner);
      });

      const grip = el("span","bm-grip");
      grip.innerHTML = icon("grip-vertical");
      grip.setAttribute("aria-hidden","true");
      const order = el("span","bm-position",inLine ? String(position+1) : "–");
      order.setAttribute("aria-label",inLine ? "Posição "+(position+1)+" no Link Bio" : "Fora da ordem do Link Bio");
      const thumb = el("span","bm-thumb");
      thumb.append(picture(banner));

      const info = el("div","bm-info");
      const titleRow = el("div","bm-title-row");
      const title = el("h3","",banner.name);
      title.title = banner.name;
      titleRow.append(title,statusChip(status));
      const meta = el("div","bm-meta");
      const period = status==="scheduled" ? "Entra no ar em "+displayTime(banner.startsAt) :
        displayTime(banner.startsAt)+" → "+displayTime(banner.endsAt);
      meta.append(withIcon(el("span","",period),"calendar"));
      const clicks = summarizeLinkBio([banner],demoBioClicks,new Set([banner.account]),start,end,now).clicks;
      const clickLine = withIcon(el("span"),"mouse-pointer-click");
      if (clicks) {
        clickLine.append(el("strong","",clicks.toLocaleString("pt-BR")),document.createTextNode(" "+clicksLabel));
      } else clickLine.append(document.createTextNode("Sem "+clicksLabel));
      meta.append(clickLine);
      const url = safeUrl(banner.url);
      const destination = withIcon(el("span","bm-url"),"link-2");
      destination.append(document.createTextNode(url ? new URL(url).host+new URL(url).pathname.replace(/\/$/,"") : "Destino não configurado"));
      if (url) destination.title = url;
      meta.append(destination);
      info.append(titleRow,meta);

      const controls = el("div","bm-actions");
      const update = values => commit(items.map(item=>item.id===banner.id ? {...item,...values} : item));
      if (confirmingArchive===banner.id) {
        const question = el("span","bm-confirm-text","Arquivar este banner?");
        const cancel = el("button","bm-button","Cancelar");
        cancel.type = "button";
        cancel.dataset.focus = "cancel:"+banner.id;
        cancel.addEventListener("click",()=>{confirmingArchive="";pendingFocus="more:"+banner.id;render();});
        const confirm = el("button","bm-button bm-danger","Arquivar");
        confirm.type = "button";
        confirm.addEventListener("click",()=>{
          confirmingArchive="";
          pendingFocus="filter:"+managerFilter;
          if (update({state:"archived"})) message("Banner arquivado. O histórico de cliques foi preservado.");
        });
        controls.append(question,cancel,confirm);
      } else {
        const published = banner.state==="published";
        const toggle = el("button","bm-switch");
        toggle.type = "button";
        toggle.setAttribute("role","switch");
        toggle.setAttribute("aria-checked",String(published));
        toggle.setAttribute("aria-label","Banner ativo: "+banner.name);
        toggle.dataset.focus = "toggle:"+banner.id;
        toggle.append(el("span","bm-switch-label","Ativo"),el("span","bm-switch-track"));
        toggle.addEventListener("click",()=>{
          pendingFocus = "toggle:"+banner.id;
          if (update({state:published ? "paused" : "published"}))
            message(published ? "Banner desativado." : "Banner ativado.");
        });
        const editButton = withIcon(el("button","bm-button","Editar"),"pencil");
        editButton.type = "button";
        editButton.setAttribute("aria-label","Editar "+banner.name);
        editButton.addEventListener("click",()=>edit(banner));

        const more = el("button","bm-icon-button");
        more.type = "button";
        more.innerHTML = icon("ellipsis");
        more.dataset.focus = "more:"+banner.id;
        more.setAttribute("aria-label","Mais ações para "+banner.name);
        more.setAttribute("aria-haspopup","menu");
        more.setAttribute("aria-expanded","false");
        const menu = el("div","bm-menu");
        menu.id = "bm-menu-"+banner.id;
        menu.setAttribute("popover","auto");
        menu.setAttribute("role","menu");
        more.setAttribute("aria-controls",menu.id);
        const item = (label,symbol,fn,danger=false,disabled=false) => {
          const entry = withIcon(el("button","bm-menu-item"+(danger?" bm-danger-text":""),label),symbol);
          entry.type = "button";
          entry.setAttribute("role","menuitem");
          entry.tabIndex = -1;
          entry.disabled = disabled;
          entry.addEventListener("click",()=>{menu.hidePopover();fn();});
          return entry;
        };
        const previous = inLine ? ordered[position-1] : undefined, next = inLine ? ordered[position+1] : undefined;
        menu.append(
          item("Visualizar","eye",()=>{
            const target = document.querySelector("#banner-view");
            target.querySelector("h2").textContent = banner.name;
            target.querySelector(".banner-media").replaceChildren(picture(banner));
            target.querySelector("p").textContent = [{live:"No ar",scheduled:"Programado",inactive:"Inativo"}[status],
              banner.title,banner.description,banner.cta].filter(Boolean).join(" · ");
            target.showModal();
          }),
          item("Duplicar","copy",()=>edit(banner,true)),
          item("Copiar link","link-2",async()=>{
            try {await navigator.clipboard.writeText(url); message("Link copiado.");}
            catch {message("Não foi possível copiar o link.");}
          },false,!url),
          ...(inLine ? [
            item("Mover para cima","arrow-up",()=>{pendingFocus="more:"+banner.id;move(banner,previous);},false,!previous),
            item("Mover para baixo","arrow-down",()=>{pendingFocus="more:"+banner.id;move(banner,next);},false,!next),
          ] : []),
          el("hr","bm-menu-divider"),
          item("Arquivar","archive",()=>{confirmingArchive=banner.id;pendingFocus="cancel:"+banner.id;render();},true),
        );
        more.addEventListener("click",()=>{
          if (menu.matches(":popover-open")) {menu.hidePopover();return;}
          menu.showPopover();
          const rect = more.getBoundingClientRect();
          const width = menu.offsetWidth, height = menu.offsetHeight;
          const {clientWidth:w,clientHeight:h} = document.documentElement;
          menu.style.left = Math.max(8,Math.min(rect.right-width,w-width-8))+"px";
          menu.style.top = (rect.bottom+4+height>h-8 ? Math.max(8,rect.top-height-4) : rect.bottom+4)+"px";
          menu.querySelector(".bm-menu-item:not(:disabled)")?.focus();
        });
        menu.addEventListener("toggle",()=>more.setAttribute("aria-expanded",String(menu.matches(":popover-open"))));
        menu.addEventListener("keydown",event=>{
          if (!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
          event.preventDefault();
          const entries = [...menu.querySelectorAll(".bm-menu-item:not(:disabled)")];
          const index = entries.indexOf(document.activeElement);
          const target = event.key==="Home" ? 0 : event.key==="End" ? entries.length-1 :
            (index+(event.key==="ArrowDown"?1:-1)+entries.length)%entries.length;
          entries[target]?.focus();
        });
        controls.append(toggle,editButton,more,menu);
      }
      row.append(grip,order,thumb,info,controls);
      list.append(row);
    }
    listSection.append(groupSection);
    }

    // Prévia ao vivo: só banners no ar, na ordem da lista
    const preview = el("aside","bm-preview");
    preview.setAttribute("aria-label","Prévia do Link Bio");
    const previewHead = el("div","bm-preview-head");
    previewHead.append(el("span","","Prévia do Link Bio"),el("span","","Agora"));
    const phone = el("div","bm-phone");
    const screen = el("div","bm-screen");
    const profile = el("span","bm-profile",client.name.charAt(0));
    profile.setAttribute("aria-hidden","true");
    screen.append(profile,el("strong","",client.name));
    if (handles[0]) screen.append(el("small","",handles[0]));
    const live = siblings.filter(banner=>statusOf(banner)==="live");
    for (const banner of live) {
      const card = el("div","bm-phone-card");
      card.append(picture(banner),el("span","",banner.title || banner.name));
      screen.append(card);
    }
    const upcoming = siblings.filter(banner=>statusOf(banner)==="scheduled")
      .sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))[0];
    if (upcoming) screen.append(el("div","bm-phone-next",upcoming.name+" entra em "+displayTime(upcoming.startsAt)));
    if (!live.length && !upcoming) screen.append(el("div","bm-phone-next","Nenhum banner no ar"));
    phone.append(screen);
    preview.append(previewHead,phone,el("p","bm-preview-note","Mostra só os banners no ar, na ordem da lista."));

    layout.append(listSection,preview);
    const foot = el("footer","bm-foot");
    foot.append(el("span","","Demonstração · Horário de Brasília"),el("span","","Banners arquivados mantêm o histórico de cliques"));
    managerContent.append(toolbar,layout,foot);

    if (pendingFocus) {
      const target = managerContent.querySelector('[data-focus="'+CSS.escape(pendingFocus)+'"]');
      pendingFocus = "";
      target?.focus({preventScroll:true});
    }
  }
  function render() {
    const items = sorted();
    const active = items.filter(item => item.state!=="archived");
    const statusFilter = filter.querySelector(":checked").value;
    const selected = statusFilter ? active.filter(item => bannerStatus(item,clock())===statusFilter) : active;
    for (const cleanup of scrollCleanups) cleanup();
    scrollCleanups = [];
    list.replaceChildren();
    managerContent.replaceChildren();
    if (!clients.length) list.append(create("p","A gestão está disponível na demonstração local."));
    const {start,end} = getRange();
    const now = clock();
    function move(from,to) {
      if (!from || !to || from===to || scope.get(from.account).client!==scope.get(to.account).client) return;
      const reordered = items.filter(item=>item!==from);
      reordered.splice(items.indexOf(to),0,from);
      commit(reordered.map((item,order)=>({...item,order})));
    }
    for (const client of clients) {
      const siblings = active.filter(item=>scope.get(item.account).client===client.id);
      const lineUp = siblings.filter(item=>bannerStatus(item,now)!=="inactive");
      const visible = selected.filter(item=>scope.get(item.account).client===client.id)
        .sort((a,b)=>Number(!lineUp.includes(a))-Number(!lineUp.includes(b)));
      const panel = create("section");
      panel.className = "card banner-client";
      const header = create("header");
      const avatar = create("span",client.name.charAt(0));
      avatar.className = "banner-client-avatar";
      avatar.setAttribute("aria-hidden","true");
      const identity = create("div");
      identity.append(create("h2",client.name),create("p",siblings.length+" "+(siblings.length===1?"banner":"banners")));
      const add = action("Adicionar banner",()=>edit(undefined,false,client.id));
      add.disabled = !accounts.some(account=>account.client===client.id);
      add.innerHTML = icon("plus");
      add.title = "Adicionar banner";
      add.setAttribute("aria-label","Adicionar banner para "+client.name);
      const pencil = action("",()=>manage(client.id));
      pencil.innerHTML = icon("posts");
      pencil.title = "Gerenciar banners";
      pencil.setAttribute("aria-label","Gerenciar banners de "+client.name);
      header.append(avatar,identity,add,pencil);
      panel.append(header);
      panel.append(create("p","Demonstração · Imagens ilustrativas"));
      if (!visible.length) panel.append(create("p",siblings.length ? "Nenhum banner neste status." : "Nenhum banner cadastrado."));
      const surface = create("div");
      surface.className = "banner-scroll-surface";
      const viewport = create("div");
      viewport.className = "banner-scroll-viewport scroll-region";
      viewport.tabIndex = 0;
      viewport.setAttribute("role","region");
      viewport.setAttribute("aria-label","Banners de "+client.name);
      const entries = create("div");
      entries.className = "banner-scroll-entries";
      viewport.append(entries);
      surface.append(viewport);
      panel.append(surface);
      for (const banner of visible) {
        const compact = create("article");
        compact.className = "banner-row banner-compact";
        const copy = create("div");
        const heading = create("div");
        heading.className = "banner-preview-heading";
        const name = create("h3",(lineUp.includes(banner) ? (lineUp.indexOf(banner)+1)+". " : "")+banner.name);
        name.title = banner.name;
        name.tabIndex = 0;
        const badge = create("span",statuses[bannerStatus(banner,now)] ?? "Indisponível");
        badge.className = "bio-status";
        badge.dataset.status = bannerStatus(banner,now) ?? "";
        heading.append(name);
        copy.append(heading);
        const dates = create("div");
        dates.className = "banner-dates";
        for (const [symbol,label,value] of [
          ["calendar","Início",displayTime(banner.startsAt)],
          ["calendar-clock","Término",displayTime(banner.endsAt)],
        ]) {
          const line = create("p",label+": "+value);
          line.insertAdjacentHTML("afterbegin",icon(symbol));
          dates.append(line);
        }
        copy.append(dates);
        const lastLine = create("div");
        lastLine.className = "banner-last-line";
        lastLine.insertAdjacentHTML("afterbegin",icon("link-2"));
        const url = safeUrl(banner.url);
        if (url) {
          const link = create("a",new URL(url).host+new URL(url).pathname+new URL(url).search+new URL(url).hash);
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.title = url;
          link.setAttribute("aria-label","Abrir destino de "+banner.name+": "+url);
          const destination = create("div");
          destination.className = "banner-destination";
          destination.append(link);
          lastLine.append(destination);
        } else {
          lastLine.append(create("span","Destino não configurado"));
        }
        copy.append(lastLine);
        const media = create("div");
        media.className = "banner-preview-media";
        media.append(picture(banner),badge);
        compact.append(media,copy);
        entries.append(compact);
      }
      list.append(panel);
      let sizingFrame;
      const resize = new ResizeObserver(() => {
        cancelAnimationFrame(sizingFrame);
        sizingFrame = requestAnimationFrame(() => {
          const cards = [...entries.children];
          const height = cards.slice(0,2).reduce((sum,card)=>sum+card.getBoundingClientRect().height,0);
          viewport.style.maxHeight = height+(cards.length>1 ? 10 : 0)+"px";
        });
      });
      resize.observe(entries);
      for (const card of entries.children) resize.observe(card);
      const removeIndicator = installScrollIndicator(viewport,surface,entries,true);
      scrollCleanups.push(() => {
        resize.disconnect();
        cancelAnimationFrame(sizingFrame);
        removeIndicator();
      });
      if (managingClient !== client.id) continue;
      renderManager(client,siblings,items,move,start,end,now);
    }
  }
  return render;
}
