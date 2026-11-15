export const widgetHelp = {
  "kpi-users-round": "Contas alcançadas no período pelos perfis selecionados. Ao somar perfis, uma mesma conta pode aparecer mais de uma vez.",
  "kpi-eye": "Soma das visualizações diárias dos perfis selecionados. Uma pessoa pode gerar mais de uma visualização. A soma exige dados para todos os dias.",
  "kpi-heart": "Contas que interagiram com os conteúdos no período. A soma entre perfis pode contar uma mesma conta mais de uma vez.",
  "kpi-user-round-plus": "Total atual dos perfis selecionados. A variação compara o fim do período com a véspera do início, quando há dados nas duas datas.",
  "scheduled-title": "Publicações ainda agendadas para as contas selecionadas. A lista inclui horários a partir de agora, dentro do período, em ordem de agendamento.",
  "progress-title": "Cada quadrado representa um dia. A intensidade indica quantas publicações foram realizadas nas contas selecionadas. Dias fora do período e dias sem histórico têm marcas próprias.",
  "featured-title": "Até três publicações dos perfis selecionados, ordenadas pelo alcance acumulado. O filtro de período considera a data da publicação.",
  "formats-title": "Compara a média da métrica selecionada por publicação e formato. Intervalos usam janelas de mesma duração. Ao selecionar um dia, a comparação usa o histórico até esse dia e até a véspera.",
  "bio-overview-title": "Conta cliques únicos por evento no período para as contas selecionadas. Os totais de banners mostram a situação atual, independentemente do intervalo de cliques.",
  "banner-manager-title": "Banners do cliente na ordem em que aparecem no Link Bio. Arraste ou use Mover para cima/baixo para mudar a ordem. O interruptor liga e desliga o banner. Os cliques seguem o período do filtro e o status é o atual.",
  "bio-ranking-title": "Ordena até cinco banners pelos cliques válidos do período nas contas selecionadas. O status é o atual.",
  "activity-title": "Tudo o que aconteceu nas contas e no período selecionados: publicações, agendamentos, falhas, rascunhos e contas desconectadas, do mais recente ao mais antigo. Use a busca e o filtro de status para refinar.",
  "attention-title": "Problemas que impedem uma publicação nas contas e no período selecionados, como falhas e contas desconectadas. Use a ação de cada alerta para corrigir e marque como resolvido para tirar da lista. Avisos por WhatsApp e e-mail chegam em breve.",
};

let active;
let dismissTimer;

function closeHelp() {
  clearTimeout(dismissTimer);
  if (!active) return;
  const {button, panel} = active;
  active = undefined;
  panel.hidePopover();
  button.setAttribute("aria-expanded", "false");
}

function positionHelp() {
  if (!active) return;
  const {button, panel} = active;
  const rect = button.getBoundingClientRect();
  const margin = 8;
  const {clientWidth: width, clientHeight: height} = document.documentElement;
  const box = panel.getBoundingClientRect();
  const below = height - rect.bottom - margin;
  const above = rect.top - margin;
  const top = below >= box.height || below >= above ? rect.bottom + 4 : rect.top - box.height - 4;
  panel.style.left = Math.max(margin, Math.min(rect.right - box.width, width - box.width - margin)) + "px";
  panel.style.top = Math.max(margin, Math.min(top, height - box.height - margin)) + "px";
}

function openHelp(button, panel, pinned = false) {
  clearTimeout(dismissTimer);
  if (active?.button === button) {
    if (pinned) {
      if (active.pinned) closeHelp();
      else active.pinned = true;
    }
    return;
  }
  closeHelp();
  active = {button, panel, pinned};
  panel.showPopover();
  positionHelp();
  button.setAttribute("aria-expanded", "true");
}

export function renderWidgetHelp(isDemo) {
  closeHelp();
  for (const [id, description] of Object.entries(widgetHelp)) {
    const heading = document.getElementById(id);
    if (!heading) continue;
    const parent = heading.closest(".kpi-heading,[data-help-header]") ?? heading;
    if (parent.querySelector(".widget-help")) continue;
    document.getElementById(id + "-help")?.remove();
    const button = document.createElement("button");
    const panel = document.createElement("span");
    button.type = "button";
    button.className = "widget-help";
    button.innerHTML = '<span><svg aria-hidden="true"><use href="#icon-help"/></svg></span>';
    const title = heading.textContent.trim();
    heading.setAttribute("aria-label", title);
    button.setAttribute("aria-label", "Sobre " + title);
    button.setAttribute("aria-expanded", "false");
    panel.id = id + "-help";
    panel.className = "widget-help-panel";
    panel.setAttribute("popover", "manual");
    panel.setAttribute("role", "tooltip");
    panel.textContent = description + (isDemo ? " Dados de demonstração." : "");
    button.setAttribute("aria-describedby", panel.id);
    button.addEventListener("pointerenter", event => {
      if (event.pointerType === "mouse") openHelp(button, panel);
    });
    const deferClose = () => {
      if (active?.button === button && !active.pinned) dismissTimer = setTimeout(closeHelp, 140);
    };
    button.addEventListener("pointerleave", deferClose);
    panel.addEventListener("pointerenter", () => clearTimeout(dismissTimer));
    panel.addEventListener("pointerleave", deferClose);
    button.addEventListener("click", () => openHelp(button, panel, true));
    button.addEventListener("blur", () => {
      if (active?.button === button) closeHelp();
    });
    parent.classList.add("widget-help-heading");
    parent.append(button);
    document.body.append(panel);
  }
}

document.addEventListener("pointerdown", event => {
  if (active && !active.button.contains(event.target) && !active.panel.contains(event.target)) closeHelp();
}, true);
document.addEventListener("keydown", event => {
  if (active && event.key === "Escape") {
    closeHelp();
    event.preventDefault();
    event.stopPropagation();
  }
}, true);
window.addEventListener("scroll", closeHelp, true);
window.addEventListener("resize", closeHelp);
window.addEventListener("hashchange", closeHelp);
