import { demo } from "./demo-data.mjs";
import { composerDropdowns, scheduledInstant } from "./composer.mjs";

export function createBannerDatePicker(root,modal,label,icon,optional=false) {
  const create = (tag,text) => Object.assign(document.createElement(tag),{textContent:text ?? ""});
  const key = root.dataset.date;
  let value = "", day = "", month, hour = "08", minute = "00";
  const caption = create("span",label);
  caption.id = "banner-date-label-"+key;
  const trigger = create("button");
  trigger.type = "button";
  trigger.className = "composer-select";
  trigger.setAttribute("aria-labelledby",caption.id);
  trigger.setAttribute("aria-haspopup","dialog");
  trigger.setAttribute("aria-expanded","false");
  const panel = create("div");
  panel.className = "banner-date-popover composer-calendar";
  panel.id = "banner-date-popover-"+key;
  panel.setAttribute("popover","auto");
  panel.setAttribute("role","dialog");
  panel.setAttribute("aria-label","Selecionar "+label.replace(" *",""));
  trigger.setAttribute("aria-controls",panel.id);
  const errors = create("span");
  errors.className = "banner-error";
  errors.dataset.error = key;
  errors.id = "banner-date-error-"+key;
  trigger.setAttribute("aria-describedby",errors.id);
  root.append(caption,trigger,panel,errors);
  const dropdowns = composerDropdowns(modal,panel,icon);
  function close() {
    dropdowns.close();
    if(panel.matches(":popover-open")) panel.hidePopover();
    trigger.setAttribute("aria-expanded","false");
  }
  function update() {
    trigger.replaceChildren(create("span",value ? new Intl.DateTimeFormat("pt-BR",{
      timeZone:demo.timezone,dateStyle:"short",timeStyle:"short",
    }).format(new Date(scheduledInstant(value.slice(0,10),value.slice(11),demo.timezone))) :
      optional ? "Sem término" : "Selecionar data e horário"));
    trigger.insertAdjacentHTML("beforeend",icon("calendar"));
  }
  function place() {
    if (!panel.matches(":popover-open")) return;
    const rect=trigger.getBoundingClientRect();
    const width=Math.min(330,document.documentElement.clientWidth-24);
    panel.style.width=width+"px";
    panel.style.left=Math.max(12,Math.min(rect.left,document.documentElement.clientWidth-width-12))+"px";
    panel.style.maxHeight=(document.documentElement.clientHeight-24)+"px";
    panel.style.top=Math.max(12,Math.min(rect.bottom+6,document.documentElement.clientHeight-panel.offsetHeight-12))+"px";
  }
  function action(text,fn,aria) {
    const button=create("button",text);
    button.type="button";
    button.className="button";
    if(aria) button.setAttribute("aria-label",aria);
    button.addEventListener("click",fn);
    return button;
  }
  function render() {
    dropdowns.close();
    const year=month.getUTCFullYear(), index=month.getUTCMonth();
    const controls=create("div");
    controls.className="calendar-head";
    for(const [field,options,selected] of [
      ["month",Array.from({length:12},(_,i)=>[i,new Intl.DateTimeFormat("pt-BR",{month:"long",timeZone:"UTC"}).format(new Date(Date.UTC(2026,i,1)))]),index],
      ["year",Array.from({length:201},(_,i)=>[1900+i,String(1900+i)]),year],
    ]) {
      const select=create("select");
      select.dataset.field="banner-"+key+"-"+field;
      select.setAttribute("aria-label",(field==="month" ? "Mês" : "Ano")+" de "+label.replace(" *",""));
      for(const [id,text] of options) select.add(new Option(text,String(id)));
      select.value=String(selected);
      select.addEventListener("change",()=>{
        month=new Date(Date.UTC(field==="year"?Number(select.value):year,field==="month"?Number(select.value):index,1));
        render();
      });
      controls.append(select);
    }
    const navigation=create("div");
    navigation.className="banner-calendar-nav";
    navigation.append(action("‹",()=>{month.setUTCMonth(index-1);render();},"Mês anterior"),
      action("›",()=>{month.setUTCMonth(index+1);render();},"Próximo mês"));
    const grid=create("div");
    grid.className="calendar-days";
    for(const title of ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]) grid.append(create("span",title));
    const offset=(new Date(Date.UTC(year,index,1)).getUTCDay()+6)%7;
    for(let i=0;i<offset;i++) grid.append(create("span"));
    const today=new Intl.DateTimeFormat("sv-SE",{timeZone:demo.timezone}).format(new Date());
    for(let date=1;date<=new Date(Date.UTC(year,index+1,0)).getUTCDate();date++) {
      const iso=year+"-"+String(index+1).padStart(2,"0")+"-"+String(date).padStart(2,"0");
      const button=action(String(date),()=>{
        day=iso;
        render();
        panel.querySelector('[data-day="'+iso+'"]')?.focus();
      },new Intl.DateTimeFormat("pt-BR",{dateStyle:"long",timeZone:"UTC"}).format(new Date(iso+"T12:00:00Z")));
      button.dataset.day=iso;
      button.setAttribute("aria-pressed",String(day===iso));
      if(iso===today) button.setAttribute("aria-current","date");
      grid.append(button);
    }
    const time=create("div");
    time.className="banner-time-fields";
    for(const [name,current] of [["Hora",hour],["Minuto",minute]]) {
      const labelNode=create("label",name);
      const input=create("input");
      input.type="text";
      input.inputMode="numeric";
      input.maxLength=2;
      input.value=current;
      input.setAttribute("aria-label",name+" de "+label.replace(" *",""));
      input.addEventListener("input",()=>{if(name==="Hora") hour=input.value;else minute=input.value;});
      labelNode.append(input);
      time.append(labelNode);
    }
    const notice=create("p");
    notice.className="banner-error";
    notice.setAttribute("role","status");
    const footer=create("div");
    footer.className="banner-form-actions";
    if(optional) footer.append(action("Sem término",()=>{value="";update();close();trigger.focus();}));
    footer.append(action("Aplicar",()=>{
      const time=hour.padStart(2,"0")+":"+minute.padStart(2,"0");
      if(!scheduledInstant(day,time,demo.timezone)) {
        notice.textContent="Selecione uma data e um horário válido entre 00:00 e 23:59.";
        return;
      }
      value=day+"T"+time;
      update();close();trigger.focus();
    }));
    panel.replaceChildren(controls,navigation,grid,time,notice,footer);
    dropdowns.enhance();
    place();
  }
  trigger.addEventListener("click",()=>{
    if(panel.matches(":popover-open")) {close();return;}
    const draft=value || demo.now.slice(0,16);
    day=draft.slice(0,10);
    hour=draft.slice(11,13);minute=draft.slice(14,16);
    month=new Date(day.slice(0,7)+"-01T12:00:00Z");
    render();panel.showPopover();place();
  });
  panel.addEventListener("toggle",()=>trigger.setAttribute("aria-expanded",String(panel.matches(":popover-open"))));
  window.addEventListener("resize",place);
  modal.addEventListener("close",close);
  update();
  return {
    set(next) {value=next || "";update();},
    value:()=>value,
    instant:()=>value ? scheduledInstant(value.slice(0,10),value.slice(11),demo.timezone) : "",
  };
}
