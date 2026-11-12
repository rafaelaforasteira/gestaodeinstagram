import {offsetDay} from "./demo-data.mjs";
import {publicationFormatIcons,publicationNetworkBadges} from "./editorial.mjs";

const steps = [
  ["Rede social","Onde você deseja publicar?","Escolha a rede social para criar seu conteúdo."],
  ["Cliente e conta","Para qual cliente vamos publicar?","Confira o perfil antes de confirmar o destino."],
  ["Formato e categoria","Qual tipo de publicação você deseja criar?","O formato define a apresentação. A categoria é opcional."],
  ["Criação","Crie seu conteúdo","Adicione mídia e acompanhe a prévia enquanto escreve."],
  ["Programação","Quando deseja publicar?","Escolha entre guardar um rascunho ou testar o agendamento."],
  ["Revisão","Revise sua publicação","Confira o destino, a mídia e a programação antes de confirmar."],
];
const platforms = [["instagram","Instagram"],["facebook","Facebook"],["youtube","YouTube Shorts"],["tiktok","TikTok"],["whatsapp","WhatsApp"]];
const formats = {
  feed:{name:"Feed",record:"Imagem",description:"Uma imagem estática.",types:["image/jpeg","image/png","image/webp"],min:1,max:1},
  carousel:{name:"Carrossel",record:"Carrossel",description:"Uma sequência de imagens ou vídeos.",types:["image/jpeg","image/png","image/webp","video/mp4"],min:2,max:10},
  reel:{name:"Reel",record:"Reel",description:"Um vídeo vertical.",types:["video/mp4"],min:1,max:1},
  story:{name:"Story",record:"Story",description:"Uma imagem ou um vídeo vertical.",types:["image/jpeg","image/png","image/webp","video/mp4"],min:1,max:1},
};
const categories = ["Institucional","Humanizado","Educativo","Promocional","Bastidores","Prova social","Entretenimento","Outro"];
const escape = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const selected = (a,b) => a===b ? " selected" : "";
const validDate = day => /^\d{4}-\d\d-\d\d$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0,10)===day;
const humanDate = day => new Intl.DateTimeFormat("pt-BR",{dateStyle:"long",timeZone:"UTC"}).format(new Date(day+"T12:00:00Z"));

export function composerDropdowns(modal,body,icon) {
  let active;
  function close(restore=false) {
    if (!active) return;
    const {trigger,panel}=active;
    active=null;
    if (panel.matches(":popover-open")) panel.hidePopover();
    trigger.setAttribute("aria-expanded","false");
    if (restore) trigger.focus({preventScroll:true});
  }
  function place() {
    if(!active) return;
    const {trigger,panel}=active, rect=trigger.getBoundingClientRect();
    const {clientHeight:h,clientWidth:w}=document.documentElement;
    const below=h-rect.bottom-12, above=rect.top-12;
    const up=below<Math.min(panel.scrollHeight+2,280)&&above>below;
    panel.style.width=Math.min(rect.width,w-16)+"px";
    panel.style.maxHeight=Math.max(36,Math.min(280,up?above:below))+"px";
    panel.style.left=Math.max(8,Math.min(rect.left,w-panel.offsetWidth-8))+"px";
    panel.style.top=(up?rect.top-panel.offsetHeight-4:rect.bottom+4)+"px";
  }
  modal.addEventListener("keydown",event=>{
    if (!active) return;
    if(event.key==="Escape") {event.preventDefault();event.stopPropagation();close(true);}
    if(event.key==="Tab") close(true);
  },true);
  document.addEventListener("pointerdown",event=>{
    if(active&&!active.trigger.contains(event.target)&&!active.panel.contains(event.target)) close();
  },true);
  body.addEventListener("scroll",()=>close(),{passive:true});
  window.addEventListener("resize",place);
  modal.addEventListener("close",()=>close());
  return {
    close,
    enhance() {
      for(const source of body.querySelectorAll("select[data-field]")) {
        const field=source.dataset.field;
        const label=source.getAttribute("aria-label")??source.labels[0]?.firstChild.textContent.trim()??field;
        const trigger=document.createElement("button");
        trigger.type="button";trigger.className="composer-select";
        trigger.dataset.dropdown=field;trigger.disabled=source.disabled;
        trigger.setAttribute("aria-label",label);
        trigger.setAttribute("aria-describedby","composer-value-"+field);
        trigger.setAttribute("aria-haspopup","listbox");trigger.setAttribute("aria-expanded","false");
        const panel=document.createElement("div");
        panel.className="composer-select-panel scroll-region";panel.id="composer-select-"+field;
        panel.setAttribute("popover","manual");panel.setAttribute("role","listbox");panel.setAttribute("aria-label",label);
        trigger.setAttribute("aria-controls",panel.id);
        source.hidden=true;
        source.after(trigger,panel);
        function sync() {
          trigger.innerHTML='<span id="composer-value-'+field+'">'+escape(source.selectedOptions[0]?.textContent)+"</span>"+icon("chevron-down");
          for (const option of panel.children) option.setAttribute("aria-selected",String(option.dataset.value===source.value));
        }
        for(const item of source.options) {
          const option=document.createElement("button");
          option.type="button";option.tabIndex=-1;option.dataset.value=item.value;option.disabled=item.disabled;
          option.setAttribute("role","option");
          option.innerHTML="<span>"+escape(item.textContent)+"</span>"+icon("check");
          option.addEventListener("click",()=>{
            close(true);
            if(source.value!==item.value) {
              source.value=item.value;sync();source.dispatchEvent(new Event("change",{bubbles:true}));
            }
          });
          panel.append(option);
        }
        sync();
        function open(last=false) {
          close();active={trigger,panel};panel.showPopover();place();
          trigger.setAttribute("aria-expanded","true");
          const options=[...panel.querySelectorAll("button:not(:disabled)")];
          const option=last?options.at(-1):options.find(item=>item.getAttribute("aria-selected")==="true")??options[0];
          option?.focus({preventScroll:true});
          if(option) panel.scrollTop=Math.max(0,option.offsetTop-panel.clientHeight/2);
        }
        trigger.addEventListener("click",()=>active?.trigger===trigger?close(true):open());
        trigger.addEventListener("keydown",event=>{
          if(["ArrowDown","ArrowUp"].includes(event.key)) {event.preventDefault();open(event.key==="ArrowUp");}
        });
        panel.addEventListener("keydown",event=>{
          if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
          event.preventDefault();
          const options=[...panel.querySelectorAll("button:not(:disabled)")];
          const index=options.indexOf(document.activeElement);
          const next=event.key==="Home"?0:event.key==="End"?options.length-1:
            (index+(event.key==="ArrowDown"?1:-1)+options.length)%options.length;
          const option=options[next];
          option?.focus({preventScroll:true});
          if(option) {
            const row=option.getBoundingClientRect(), list=panel.getBoundingClientRect();
            if(row.top<list.top) panel.scrollTop-=list.top-row.top;
            else if(row.bottom>list.bottom) panel.scrollTop+=row.bottom-list.bottom;
          }
        });
      }
    },
  };
}

// Match the requested wall time to one unambiguous UTC instant, including DST transitions.
export function scheduledInstant(day,time,zone) {
  if (!validDate(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const wall = Date.parse(day+"T"+time+":00Z");
  const formatter = new Intl.DateTimeFormat("sv-SE",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  const offsets = new Set([-86400000,0,86400000].map(delta => {
    const sample = wall+delta;
    return Date.parse(formatter.format(sample).replace(" ","T")+":00Z")-sample;
  }));
  const matches = [...offsets].map(offset=>wall-offset).filter(instant=>formatter.format(instant)===day+" "+time);
  return matches.length===1 ? new Date(matches[0]).toISOString() : null;
}

function openStorage() {
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open("social-studio-demo-composer",1);
    req.onupgradeneeded = () => req.result.createObjectStore("drafts");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function draftStorage(key,action,value) {
  const db = await openStorage();
  try {
    return await new Promise((resolve,reject)=>{
      const tx = db.transaction("drafts",action==="get"?"readonly":"readwrite");
      const store = tx.objectStore("drafts");
      const req = action==="put" ? store.put(value,key) : action==="delete" ? store.delete(key) : store.get(key);
      tx.oncomplete = () => resolve(req.result);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export function createComposer({isDemo,workspace,today,now,timezone,clients,accountsFor,icon,onSchedule,onView}) {
  const modal = document.getElementById("composer");
  const body = modal.querySelector(".composer-body");
  const dropdowns=composerDropdowns(modal,body,icon);
  const progress = modal.querySelector(".composer-progress");
  const subtitle = modal.querySelector("#composer-subtitle");
  const feedback = modal.querySelector(".composer-feedback");
  const next = modal.querySelector('[data-composer-action="next"]');
  const back = modal.querySelector('[data-composer-action="back"]');
  const key = workspace ? "demo:"+workspace : "";
  const eligible = client => accountsFor(client).filter(account=>account.platform==="Instagram");
  const mediaUrls = new Map();
  let state, stage=0, furthest=0, slot, origin, recovered, month, result, previewIndex=0, pending=false, dirty=false, timer, session=0, saving=Promise.resolve();
  const account = () => eligible(state.client).find(a=>a.id===state.account);
  const client = () => clients.find(c=>c.id===state.client);
  const format = () => formats[state.format];
  const brand = platform => publicationNetworkBadges([{platform}],icon)[0]?.outerHTML ?? icon("posts");
  function blank(context) {
    const clientId = clients.some(c=>c.id===context.client) ? context.client : "";
    return {id:crypto.randomUUID(),platform:"",client:clientId,account:eligible(clientId).some(a=>a.id===context.account)?context.account:"",
      format:"",category:"",media:[],caption:"",title:"",mode:"draft",day:context.day||today,time:context.time||""};
  }
  function url(file) {
    if (!mediaUrls.has(file)) mediaUrls.set(file,URL.createObjectURL(file));
    return mediaUrls.get(file);
  }
  function clearUrls() {
    for (const address of mediaUrls.values()) URL.revokeObjectURL(address);
    mediaUrls.clear();
  }
  function report(message,error=false) {
    feedback.textContent=message;
    feedback.dataset.error=String(error);
  }
  function persist() {
    const snapshot = {...state,media:[...state.media]};
    const write = saving.catch(()=>{}).then(()=>draftStorage(key,"put",snapshot));
    saving = write;
    return write;
  }
  function change() {
    if (!isDemo || !key) return;
    dirty=true;
    clearTimeout(timer);
    report("Salvando rascunho local…");
    const current=session;
    timer=setTimeout(()=>{
      persist().then(()=>{if (current===session && !pending && !result && !feedback.matches('[data-error="true"]')) report("Rascunho salvo neste navegador.");})
        .catch(()=>{if(current===session && !pending && !result) report("Não foi possível salvar localmente. Mantenha o compositor aberto e tente salvar na revisão.",true);});
    },500);
  }
  function mediaError(file) {
    if (!format()?.types.includes(file.type)) return "Tipo de arquivo incompatível com "+(format()?.name??"o formato")+".";
    if (file.size===0 || file.size>25*1024*1024) return "Use arquivos não vazios de até 25 MB nesta demonstração.";
    return "";
  }
  function validation(index) {
    if (index===0 && (!isDemo || state.platform!=="instagram")) return "Escolha o Instagram demonstrativo para continuar.";
    if (index===1 && (!client() || !account())) return "Selecione um cliente e uma conta desse cliente.";
    if (index===2 && !format()) return "Escolha um formato.";
    if (index===3) {
      if (!format()) return "Escolha um formato antes de adicionar a mídia.";
      if (state.media.length<format().min || state.media.length>format().max) return "Adicione "+(format().min===format().max?format().min:format().min+" a "+format().max)+" mídia(s) para "+format().name+".";
      if (state.media.some(mediaError)) return "Remova ou substitua as mídias incompatíveis com o formato.";
      if (state.caption.length>2200) return "Reduza a legenda para até 2.200 caracteres.";
    }
    if (index===4 && state.mode==="schedule") {
      const instant = scheduledInstant(state.day,state.time,timezone);
      if (!instant) return "Escolha uma data e um horário válidos, sem ambiguidade no fuso informado.";
      if (Date.parse(instant)<=now) return "Escolha um horário futuro em relação ao relógio da demonstração.";
    }
    return "";
  }
  function heading() {
    return '<h3 tabindex="-1" class="composer-question">'+steps[stage][1]+'</h3><p class="composer-description">'+steps[stage][2]+'</p>';
  }
  function network() {
    return (recovered?'<div class="composer-notice"><div><strong>Rascunho encontrado</strong><p class="muted">Retome o rascunho local ou descarte-o para começar outro.</p></div><button class="button" data-composer-action="restore">Retomar</button><button class="button" data-composer-action="discard">Descartar</button></div>':"")+
      '<p class="composer-label">'+(isDemo?"Modo demonstração · Nenhuma publicação será enviada.":"Nenhuma integração de publicação disponível neste workspace.")+'</p>'+
      '<div class="composer-options composer-platforms">'+platforms.map(([id,name])=>{
        const available=id==="instagram" && isDemo && clients.some(c=>eligible(c.id).length);
        return '<button class="composer-option" data-platform-choice="'+id+'" aria-pressed="'+(state.platform===id)+'"'+(available&&!recovered?"":" disabled")+'>'+brand(id)+
          '<strong>'+name+'</strong><span class="muted">'+(available?"Demonstração":id==="instagram"?"Não conectado":"Em breve")+'</span></button>';
      }).join("")+'</div>';
  }
  function destination() {
    return '<div class="composer-fields"><label>Cliente<select data-field="client"><option value="">Selecione um cliente</option>'+clients.map(c=>'<option value="'+escape(c.id)+'"'+selected(c.id,state.client)+'>'+escape(c.name)+'</option>').join("")+
      '</select></label><label>Conta do Instagram<select data-field="account"'+(!eligible(state.client).length?" disabled":"")+'><option value="">Selecione uma conta</option>'+
      eligible(state.client).map(a=>'<option value="'+escape(a.id)+'"'+selected(a.id,state.account)+'>'+escape(a.name)+'</option>').join("")+'</select></label></div>'+
      (account()?'<div class="composer-notice">'+brand("instagram")+'<div><strong>Confirme o destino da publicação</strong><p>'+escape(client().name)+' · '+escape(account().name)+'</p><small>Conta fictícia · Não recebe publicações reais</small></div></div>':
        '<p class="composer-label">'+(state.client&&!eligible(state.client).length?"Este cliente não possui conta elegível na demonstração.":"Selecione uma conta para confirmar o destino.")+'</p>');
  }
  function editorial() {
    return '<div class="composer-options composer-formats">'+Object.entries(formats).map(([id,f])=>'<button class="composer-option" data-format-choice="'+id+
      '" data-publication-format="'+id+'" aria-pressed="'+(id===state.format)+'">'+icon(publicationFormatIcons[f.record])+'<strong>'+f.name+'</strong><span class="muted">'+f.description+'</span></button>').join("")+
      '</div><label class="composer-category">Categoria editorial<select data-field="category"><option value="">Sem categoria</option>'+
      categories.map(c=>'<option'+selected(c,state.category)+'>'+c+'</option>').join("")+'</select></label>';
  }
  function preview() {
    const index=Math.min(previewIndex,state.media.length-1);
    const file = state.media[index];
    const profile=account()?.name??"";
    return '<aside class="composer-preview" data-format="'+escape(state.format)+'"><p class="composer-label">PRÉVIA · '+escape(format()?.name)+'</p><div class="composer-preview-card"><header><span class="composer-preview-avatar" aria-hidden="true">'+escape(profile.replace(/^@/,"").slice(0,1).toUpperCase())+'</span><strong>'+escape(profile)+'</strong>'+brand("instagram")+'</header>'+
      '<div class="composer-preview-media" data-empty="'+!file+'">'+(!file?'<span>'+icon("image")+'<br>Adicione uma mídia para visualizar</span>':
      file.type.startsWith("video/")?'<video controls playsinline preload="metadata" src="'+url(file)+'"></video>':'<img alt="Prévia da mídia '+(index+1)+'" src="'+url(file)+'">')+
      '<span class="composer-preview-error" role="status" hidden>Não foi possível visualizar este arquivo. Verifique a mídia ou escolha outro arquivo.</span>'+
      '</div>'+(state.media.length>1?'<div class="composer-preview-nav"><button class="button" data-preview="-1" aria-label="Mídia anterior">‹</button><span>'+(index+1)+' / '+state.media.length+'</span><button class="button" data-preview="1" aria-label="Próxima mídia">›</button></div>':"")+
      (state.format==="story"?"":'<div class="composer-preview-actions" aria-hidden="true">'+icon("heart")+icon("message-circle")+icon("send")+icon("bookmark")+'</div>')+
      '<div class="composer-preview-copy"><p id="composer-preview-caption" class="composer-preview-caption">'+escape(state.caption || "Sem legenda")+'</p><button type="button" class="composer-caption-toggle" data-composer-action="caption" aria-controls="composer-preview-caption" aria-expanded="false" hidden>mais</button></div></div><p class="muted composer-preview-note">Prévia local · Enquadramento original, sem recorte.</p></aside>';
  }
  let captionObserver;
  function measureCaption() {
    const caption=body.querySelector(".composer-preview-caption");
    if (!caption) return;
    const toggle=body.querySelector(".composer-caption-toggle");
    const lineHeight=parseFloat(getComputedStyle(caption).lineHeight);
    const expanded=toggle.getAttribute("aria-expanded")==="true";
    toggle.hidden=!(caption.scrollHeight>Math.ceil(lineHeight*3));
    if(toggle.hidden&&expanded) {
      toggle.setAttribute("aria-expanded","false");
      toggle.textContent="mais";
      caption.classList.remove("expanded");
    }
  }
  function setupPreview() {
    captionObserver?.disconnect();
    const caption=body.querySelector(".composer-preview-caption");
    if(!caption) return;
    captionObserver=new ResizeObserver(measureCaption);
    captionObserver.observe(caption);
    const media=body.querySelector(".composer-preview-media :is(img,video)");
    if(media) {
      const showError=()=>{
        media.hidden=true;
        body.querySelector(".composer-preview-error").hidden=false;
      };
      media.addEventListener("error",showError,{once:true});
      if(media.error || (media.tagName==="IMG" && media.complete && !media.naturalWidth)) showError();
    }
  }
  function editor() {
    const f=format();
    return '<div class="composer-editor"><div class="composer-editor-fields"><label>Título interno<input data-field="title" maxlength="100" value="'+escape(state.title)+'" placeholder="Ex.: Lançamento Aurora"></label>'+
      '<div class="composer-drop"><label>'+icon("media")+'<strong>Adicionar mídia</strong><span class="muted">Selecione ou arraste arquivos · '+(f.types.includes("video/mp4")?"MP4"+(f.types.length>1?" ou imagem":""):"JPG, PNG ou WebP")+' · até 25 MB por arquivo</span>'+
      '<span class="button composer-file-label">Selecionar arquivos</span><input class="sr-only" aria-label="Adicionar mídia" type="file" accept="'+f.types.join(",")+'"'+(f.max>1?" multiple":"")+'></label></div>'+
      '<ol class="composer-media-list">'+state.media.map((file,i)=>'<li>'+ (file.type.startsWith("image/")?'<img alt="" src="'+url(file)+'">':icon("posts"))+
      '<span><strong>'+(i+1)+'. '+escape(file.name)+'</strong><small>'+Math.ceil(file.size/1024)+' KB'+(mediaError(file)?" · Incompatível":"")+'</small></span>'+
      '<div>'+(i>0?'<button class="button" data-up="'+i+'" aria-label="Mover mídia '+(i+1)+' para cima">↑</button>':"")+'<button class="button" data-remove="'+i+'" aria-label="Remover mídia '+(i+1)+'">×</button></div></li>').join("")+
      '</ol><label>Legenda<textarea data-field="caption" maxlength="2200" rows="5" placeholder="Escreva sua legenda…">'+escape(state.caption)+'</textarea></label>'+
      '<div class="composer-caption-tools"><button class="button" data-composer-action="hashtag">Inserir #</button><small class="muted" id="composer-caption-count">'+state.caption.length+' / 2.200</small></div></div>'+preview()+'</div>';
  }
  function calendar() {
    const first = month+"-01";
    const offset = (new Date(first+"T12:00:00Z").getUTCDay()+6)%7;
    const options = Array.from({length:12},(_,i)=>new Intl.DateTimeFormat("pt-BR",{month:"long",timeZone:"UTC"}).format(new Date(Date.UTC(2026,i,1))));
    const baseYear = Number(today.slice(0,4));
    return '<div class="composer-calendar"><div class="calendar-head"><select aria-label="Mês da publicação" data-field="month">'+options.map((name,i)=>{
      const value=String(i+1).padStart(2,"0");return '<option value="'+value+'"'+selected(value,month.slice(5))+'>'+name+'</option>';
    }).join("")+'</select><select aria-label="Ano da publicação" data-field="year">'+Array.from({length:6},(_,i)=>String(baseYear+i)).map(year=>'<option'+selected(year,month.slice(0,4))+'>'+year+'</option>').join("")+
      '</select></div><div class="calendar-days">'+["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d=>'<span>'+d+'</span>').join("")+
      Array.from({length:42},(_,i)=>{
        const day=offsetDay(first,i-offset);
        return day.slice(0,7)!==month?'<span></span>':'<button class="button" data-composer-day="'+day+'" aria-label="'+escape(humanDate(day))+'" aria-pressed="'+(day===state.day)+'"'+(day<today?" disabled":"")+'>'+Number(day.slice(-2))+'</button>';
      }).join("")+'</div></div>';
  }
  function schedule() {
    return '<div class="composer-options"><button class="composer-option" data-mode="draft" aria-pressed="'+(state.mode==="draft")+'"><strong>Salvar como rascunho</strong><span class="muted">Retome o trabalho neste navegador.</span></button>'+
      '<button class="composer-option" data-mode="schedule" aria-pressed="'+(state.mode==="schedule")+'"><strong>Agendar na demonstração</strong><span class="muted">Cria um registro de teste na Agenda.</span></button></div>'+
      (state.mode==="schedule"?'<div class="composer-schedule">'+calendar()+'<div><p class="composer-label">DATA SELECIONADA</p><strong>'+escape(humanDate(state.day))+'</strong>'+
      '<label>Horário<input type="time" data-field="time" value="'+escape(state.time)+'"></label><p class="muted">Horário de Brasília · '+escape(timezone)+'</p><p class="muted">'+escape(account()?.name)+' · Conta demonstrativa</p><p class="muted">Data-base da demonstração: '+escape(humanDate(today))+'</p></div></div>':"");
  }
  function review() {
    const rows=[["Rede social","Instagram",0],["Cliente",client()?.name,1],["Conta de destino",account()?.name,1],["Formato",format()?.name,2],["Categoria",state.category||"Sem categoria",2],
      ["Mídias",state.media.length,3],["Título interno",state.title||"Sem título",3],["Programação",state.mode==="schedule"?humanDate(state.day)+" às "+state.time+" · Brasília":"Rascunho local",4]];
    return '<div class="composer-editor"><dl class="composer-review">'+rows.map(([label,value,edit])=>'<div><dt>'+label+'</dt><dd>'+escape(value)+'</dd><button class="button" data-stage="'+edit+'" aria-label="Editar '+label+'">Editar</button></div>').join("")+
      '</dl>'+preview()+'</div><p class="composer-label">Somente demonstração. Nenhuma mídia ou publicação será enviada ao Instagram.</p>';
  }
  function render(focus=true) {
    dropdowns.close();
    modal.dataset.step=String(stage+1);
    subtitle.textContent=result?"Demonstração":'Etapa '+(stage+1)+' de 6 · '+steps[stage][0];
    progress.innerHTML=steps.map(([label],i)=>'<button class="composer-segment" data-stage="'+i+'" aria-label="Etapa '+(i+1)+': '+label+'"'+(i===stage?' aria-current="step"':"")+(i>=stage||result?" disabled":"")+' data-complete="'+(i<stage)+'"></button>').join("");
    next.hidden=Boolean(result);
    back.hidden=stage===0 || Boolean(result);
    next.disabled=pending || (!isDemo || (stage===0 && !state.platform));
    next.textContent=stage===5?(state.mode==="schedule"?"Confirmar agendamento de teste":"Salvar rascunho"):stage===1&&account()?"Confirmar e continuar":"Continuar";
    if (result) {
      body.innerHTML='<h3 tabindex="-1" class="composer-question">'+(result==="schedule"?"Agendamento de demonstração registrado":"Rascunho salvo")+'</h3><p class="composer-description">'+
        (result==="schedule"?"Disponível nesta sessão da Agenda. Nenhuma publicação será enviada.":"Disponível neste navegador. Abra Nova publicação para retomar.")+'</p>'+
        (result==="schedule"?'<button class="button composer-primary" data-composer-action="view">Ver na Agenda</button> ':"")+
        '<button class="button" data-composer-action="close">Fechar</button>';
    } else body.innerHTML=heading()+[network,destination,editorial,editor,schedule,review][stage]();
    dropdowns.enhance();
    setupPreview();
    body.scrollTop=0;
    if (focus) body.querySelector(".composer-question")?.focus({preventScroll:true});
  }
  function go(index) {
    stage=index;
    previewIndex=0;
    furthest=Math.max(furthest,index);
    report("");
    render();
  }
  function addFiles(files) {
    if (!files.length) return;
    const f=format();
    const added=Array.from(files);
    const error=added.map(mediaError).find(Boolean);
    const candidate=f.max===1?added:[...state.media,...added];
    if (error || candidate.length>f.max) {report(error||"O formato aceita até "+f.max+" mídia(s).",true);return;}
    if (candidate.reduce((total,file)=>total+file.size,0)>60*1024*1024) {report("O rascunho aceita até 60 MB de mídia no total.",true);return;}
    clearUrls();
    state.media=candidate;
    previewIndex=0;
    change();
    render(false);
    body.querySelector('input[type="file"]').focus();
  }
  async function submit() {
    for (let i=0;i<5;i++) {
      const error=validation(i);
      if (error) {go(i);report(error,true);return;}
    }
    pending=true;
    next.disabled=true;
    report("Confirmando…");
    clearTimeout(timer);
    try {
      if (state.mode==="draft") await persist();
      else {
        const scheduledAt=scheduledInstant(state.day,state.time,timezone);
        const occurrence="composer-"+state.id;
        onSchedule({id:occurrence,occurrence,account:account().id,title:state.title.trim()||format().name+" sem título",caption:state.caption,
          clientName:client().name,format:format().record,status:"Agendado",scheduledAt,media:[...state.media],
          destinations:[{platform:state.platform,scheduledAt,status:"Agendado"}]});
        // The fixture is already visible in this session. Draft cleanup is best effort.
        await saving.catch(()=>{});
        await draftStorage(key,"delete").catch(()=>{});
      }
      result=state.mode;
      dirty=false;
      report("");
      render();
    } catch {
      report(state.mode==="draft"?"O rascunho não pôde ser salvo neste navegador. Tente novamente sem fechar o compositor.":
        "Não foi possível registrar o teste na Agenda. Revise o destino e tente novamente.",true);
    } finally { pending=false;next.disabled=false; }
  }
  function close() {
    if (pending) return;
    if (!dirty) {modal.close();return;}
    pending=true;
    next.disabled=true;
    clearTimeout(timer);
    persist().then(()=>modal.close()).catch(()=>{
      report("Não foi possível salvar. Use Fechar compositor novamente para sair sem salvar.",true);
      dirty=false;
    }).finally(()=>{pending=false;next.disabled=false;});
  }
  modal.addEventListener("cancel",event=>{event.preventDefault();close();});
  modal.addEventListener("close",()=>{
    captionObserver?.disconnect();
    session++;
    clearTimeout(timer);
    clearUrls();
    body.replaceChildren();
    origin?.focus();
  });
  modal.addEventListener("click",async event=>{
    const button=event.target.closest("button");
    if (!button||pending) return;
    if (button.matches(".composer-close")) {close();return;}
    const {composerAction:action,platformChoice,formatChoice,stage:target,mode,composerDay,remove,up}=button.dataset;
    if (action==="close") close();
    if (action==="view") {origin=null;modal.close();onView(state.day,state.client,state.account);}
    if (action==="back"&&stage>0) go(stage-1);
    if (action==="next") {
      const error=validation(stage);
      if(error) report(error,true);
      else if(stage===5) await submit();
      else go(stage+1);
    }
    if (action==="restore"&&recovered) {
      state=recovered;recovered=null;
      if (!clients.some(c=>c.id===state.client)) state.client="";
      if (!eligible(state.client).some(a=>a.id===state.account)) state.account="";
      if (!validDate(state.day)) state.day=slot.day||today;
      month=(state.day<today?today:state.day).slice(0,7);
      go(0);
    }
    if(action==="discard") {
      pending=true;
      try {await draftStorage(key,"delete");recovered=null;render();}
      catch {report("Não foi possível descartar o rascunho salvo.",true);}
      finally {pending=false;}
    }
    if (action==="hashtag") {
      const caption=body.querySelector("textarea");
      if (caption.value.length<caption.maxLength) {
        caption.setRangeText("#",caption.selectionStart,caption.selectionStart,"end");
        caption.dispatchEvent(new Event("input",{bubbles:true}));
      }
      caption.focus();
    }
    if(button.dataset.preview && state.media.length>1) {
      previewIndex=(previewIndex+Number(button.dataset.preview)+state.media.length)%state.media.length;
      body.querySelector(".composer-preview").outerHTML=preview();
      setupPreview();
      body.querySelector('[data-preview="'+button.dataset.preview+'"]').focus();
    }
    if(action==="caption") {
      const expanded=button.getAttribute("aria-expanded")!=="true";
      button.setAttribute("aria-expanded",String(expanded));
      button.textContent=expanded?"menos":"mais";
      body.querySelector(".composer-preview-caption").classList.toggle("expanded",expanded);
    }
    if(target!==undefined && Number(target)<stage && Number(target)<=furthest) go(Number(target));
    if(platformChoice==="instagram" && isDemo) {state.platform=platformChoice;change();render(false);body.querySelector('[data-platform-choice="instagram"]').focus();}
    if(Object.hasOwn(formats,formatChoice)) {
      state.format=formatChoice;change();render(false);
      body.querySelector('[data-format-choice="'+formatChoice+'"]').focus();
      if(state.media.some(mediaError)||state.media.length>format().max) report("O formato mudou. Revise as mídias na próxima etapa.",true);
    }
    if (mode==="draft"||mode==="schedule") {state.mode=mode;change();render(false);body.querySelector('[data-mode="'+mode+'"]').focus();}
    if (composerDay && composerDay>=today) {state.day=composerDay;change();render(false);body.querySelector('[data-composer-day="'+composerDay+'"]').focus();}
    if (remove!==undefined||up!==undefined) {
      if(remove!==undefined) state.media.splice(Number(remove),1);
      else {const i=Number(up);[state.media[i-1],state.media[i]]=[state.media[i],state.media[i-1]];}
      clearUrls();previewIndex=0;change();render(false);body.querySelector('input[type="file"]').focus();
    }
  });
  body.addEventListener("change",event=>{
    const input=event.target;
    if (input.type==="file") {addFiles(input.files);input.value="";return;}
    const field=input.dataset.field;
    if (field==="client") {
      state.client=input.value;state.account="";change();render(false);body.querySelector('[data-dropdown="client"]').focus();
    } else if (field==="account") {
      state.account=input.value;change();render(false);body.querySelector('[data-dropdown="account"]').focus();
    } else if (field==="month"||field==="year") {
      month=field==="month"?month.slice(0,5)+input.value:input.value+month.slice(4);
      render(false);body.querySelector('[data-dropdown="'+field+'"]').focus();
    } else if (field==="category"||field==="time") {state[field]=input.value;change();}
  });
  body.addEventListener("input",event=>{
    const field=event.target.dataset.field;
    if (field!=="caption"&&field!=="title") return;
    state[field]=event.target.value;
    if(field==="caption") {
      body.querySelector(".composer-preview-caption").textContent=state.caption||"Sem legenda";
      measureCaption();
      body.querySelector("#composer-caption-count").textContent=state.caption.length+" / 2.200";
    }
    change();
  });
  body.addEventListener("dragover",event=>{if(event.target.closest(".composer-drop")) event.preventDefault();});
  body.addEventListener("drop",event=>{
    if(!event.target.closest(".composer-drop")) return;
    event.preventDefault();addFiles(event.dataTransfer.files);
  });
  return async context=>{
    if(modal.open||pending) return;
    const current=++session;
    origin=document.activeElement;
    slot=context;
    stage=furthest=previewIndex=0;
    dirty=false;result=null;recovered=null;
    state=blank(context);month=(state.day<today?today:state.day).slice(0,7);
    modal.showModal();report("");render();
    if(isDemo&&key) {
      try {
        const draft=await draftStorage(key,"get");
        if(current!==session||!modal.open||dirty||!draft) return;
        recovered=draft;render(body.contains(document.activeElement));
      } catch {if(current===session) report("O armazenamento local não está disponível.",true);}
    }
  };
}
