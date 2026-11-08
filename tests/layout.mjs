import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = new URL(process.env.STUDIO_URL ?? "http://127.0.0.1:3021");
url.searchParams.set("demo", "1");
const resolutions = [
  [1366, 768], [1440, 900], [1600, 900], [1920, 1080],
  [2560, 1440], [2560, 1080], [3440, 1440], [3840, 1600],
  [1024, 768], [768, 1024], [390, 844], [375, 812],
];

const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
try {
  const editorialPage = await browser.newPage({viewport:{width:1366,height:768}});
  await editorialPage.goto(new URL("?demo=1&period=7",url).href);
  assert.equal(await editorialPage.locator("#featured .editorial-post").count(),3);
  assert.equal(await editorialPage.locator("#formats .format-comparison").count(),4);
  assert.equal(await editorialPage.locator("#formats .format-comparison [data-series=current] strong").filter({hasText:"—"}).count(),0);
  await editorialPage.getByRole("radio",{name:"Curtidas",exact:true}).check();
  assert.match(await editorialPage.locator('#formats [data-format="story"] [data-series=current] strong').innerText(), /—/);
  await editorialPage.goto(new URL("?demo=1&period=7&account=aurora",url).href);
  assert.equal(await editorialPage.locator("#featured").getByText("Casa Nova",{exact:false}).count(),0);
  await editorialPage.goto(new URL("?demo=1&period=7",url).href);
  const featured = editorialPage.locator("#featured");
  const cards = featured.locator(".editorial-post");
  assert.deepEqual(await cards.locator(".publication-place").allTextContents(),["1º lugar","2º lugar","3º lugar"]);
  assert(await cards.locator(".publication-preview").evaluateAll(nodes => nodes.every(node => Math.abs(node.clientWidth/node.clientHeight-.8)<.01)));
  assert.equal(await cards.locator(".publication-metrics dd").count(),18);
  assert.deepEqual(await cards.locator(".publication-network").evaluateAll(groups => groups.map(group => group.children.length)),[3,2,3]);
  const reachIcon = cards.first().locator(".publication-metrics dt").first();
  await reachIcon.focus();
  assert(await reachIcon.getByRole("tooltip",{name:"Alcance"}).isVisible());
  await cards.first().locator(".publication-preview").click();
  assert.equal(await editorialPage.locator("dialog[open]").count(),0);
  await mkdir("test-results/layout", {recursive:true});
  await editorialPage.close();
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto(url.href);
  assert.equal(new URL(page.url()).searchParams.get("period"),"today");
  assert(!(await page.locator('#filter-count[data-active="true"]').count()));
  await page.locator(".editorial-post").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(() => getComputedStyle(document.querySelector(".metric .value")).fontFamily.includes("Geist Sans") &&
    document.fonts.check('600 26px "Geist Sans"')));
  assert.equal(await page.locator("#metrics .metric").count(), 4);
  assert.deepEqual(await page.locator("#metrics h3").allTextContents(), ["Alcance","Views","Engajados","Seguidores"]);
  assert.equal(await page.locator("#kpi-user-round-plus + .kpi-help").count(), 1);
  assert.equal(await page.locator("#metrics .metric").last().locator(".value").innerText(), "12.320");
  await page.getByRole("button", { name:"Sobre Engajados" }).focus();
  assert(await page.getByRole("tooltip").isVisible());
  assert.equal(await page.locator("#featured img").count(), 3);
  const ranking = page.locator("#featured .editorial-post");
  assert.match(await ranking.first().innerText(), /Coleção Aurora/);
  assert.equal(await ranking.first().locator(".publication-metrics dt").count(),6);
  await page.getByRole("radio",{name:"Curtidas",exact:true}).check();
  assert.match(await page.locator("#formats").innerText(), /%/);
  await page.getByRole("radio",{name:"Visualizações",exact:true}).check();
  const scheduled = page.getByRole("region", { name:"Posts programados", exact:true });
  assert.equal(await scheduled.locator("input,select").count(), 0);
  assert.equal(await scheduled.locator(".scheduled-post").count(), 7);
  assert.equal(await scheduled.getByText(/Publicado|Falha/).count(),0);
  assert.equal(await scheduled.locator(".scheduled-accent").count(),7);
  assert.equal(await page.locator("#sidebar-toggle use").count(), 0);
  assert.equal(await page.locator("#sidebar-toggle path").getAttribute("d"), "m9 18 6-6-6-6");
  await mkdir("test-results/layout", { recursive: true });

  for (const [width, height] of resolutions) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => {
      const box = (selector) => document.querySelector(selector).getBoundingClientRect();
      const frame = box(".app-frame");
      const main = box("main");
      const sidebar = box(".app-sidebar");
      const headerActions = box("#filter-trigger");
      const overlaps = sidebar.left < headerActions.right && sidebar.right > headerActions.left &&
        sidebar.top < headerActions.bottom && sidebar.bottom > headerActions.top;
      return {
        viewport: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        frame: Math.round(frame.width),
        cardsFit: [...document.querySelectorAll("main .card:not(.operational-pages .card)")].every((card) => {
          const bounds = card.getBoundingClientRect();
          return bounds.width > 0 && bounds.left >= main.left - 1 && bounds.right <= main.right + 1;
        }),
        widgetsFit: box(".heatmap-scroll").right <= box(".consistency-widget").right && (box(".consistency-widget").top !== box(".scheduled-widget").top || Math.abs(box(".consistency-widget").width - box(".scheduled-widget").width) < 1 && box(".consistency-widget").height === box(".scheduled-widget").height),
        overlaps,
      };
    });
    assert(layout.overflow <= 0 && layout.cardsFit && layout.widgetsFit && !layout.overlaps,
      `${width}×${height}: ${JSON.stringify(layout)}`);
    assert(layout.viewport - layout.frame <= 89, "O frame deixou margens excessivas além da barra nativa");
    console.log(`${width}×${height}: frame ${layout.frame}px`);
    await page.locator("#editorial").screenshot({style:".skip:not(:focus){visibility:hidden}",path:`test-results/layout/editorial-${width}x${height}.png`});
    await page.locator(".workspace").evaluate(pane => pane.scrollTo(0,0));
    await page.screenshot({ path: `test-results/layout/${width}x${height}.png` });
    await page.locator("#filter-trigger").click();
    const panel = page.getByRole("dialog", { name: "Filtros" });
    const bounds = await panel.boundingBox();
    assert(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height);
    await page.keyboard.press("Escape");
    await panel.waitFor({ state: "hidden" });
  }

  for (const zoom of [1.25, 1.5, 2]) {
    await page.setViewportSize({ width: Math.floor(1366 / zoom), height: Math.floor(768 / zoom) });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      `Overflow na largura efetiva de ${zoom * 100}% de zoom`);
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  const reach = page.locator(".metric:has(#kpi-users-round) .value");
  const initial = await reach.innerText();
  const filter = page.locator("#filter-trigger");
  await filter.click();
  const clientToggle = page.locator("#client-toggle");
  const accountToggle = page.locator("#account-toggle");
  assert(!(await accountToggle.isVisible()));
  await clientToggle.click();
  await page.getByRole("searchbox", {name:"Buscar cliente"}).fill("aurora");
  assert.equal(await page.getByRole("radio", {name:"Casanova Design"}).count(),0);
  await page.getByRole("radio", {name:"Aurora Studio"}).click();
  await accountToggle.click();
  await page.getByRole("searchbox", { name:"Buscar rede" }).fill("aurora");
  await page.getByRole("radio", { name:"Instagram — @aurora.studio" }).click();
  await clientToggle.click();
  await page.getByRole("radio", {name:"Casanova Design"}).click();
  assert.equal(await accountToggle.innerText(),"Todas as redes");
  assert.equal(await reach.innerText(), initial);
  await page.keyboard.press("Escape");
  await filter.click();
  assert.equal(await clientToggle.innerText(),"Todos os clientes");
  assert(!(await accountToggle.isVisible()));
  await page.getByText("Últimos 7 dias", { exact: true }).click();
  await page.locator("#greeting").click();
  await page.getByRole("dialog", { name: "Filtros" }).waitFor({ state: "hidden" });
  await filter.click();
  assert(await page.getByRole("radio", { name: "Hoje", exact:true }).isChecked());
  await clientToggle.click();
  await page.getByRole("radio", {name:"Aurora Studio"}).click();
  await accountToggle.click();
  await page.getByRole("radio", { name:"Instagram — @aurora.studio" }).click();
  await page.getByText("Período personalizado", { exact: true }).click();
  await page.locator("#range-calendar").waitFor();
  const month = page.locator("#calendar-month summary");
  await month.focus();
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.locator("#calendar-month button").count(),12);
  await page.keyboard.press("Escape");
  await page.locator('[data-day="2026-11-06"]').focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.locator("#scope-error").waitFor();
  await page.locator('[data-day="2026-11-06"]').click();
  assert.match(await page.locator("#date-summary").innerText(),/06\/11\/2026 até 06\/11\/2026/);
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  assert.equal(await filter.getAttribute("aria-label"),"Filtrar resultados, 3 filtros ativos");
  assert.equal(await page.locator("#filter-count").innerText(),"3");
  assert.equal(await page.locator("#metrics .metric").last().locator(".value").innerText(), "8.420");
  assert.notEqual(await reach.innerText(), initial);
  assert.equal(await page.locator("#consistency button.heat-cell:not(.heat-context)").count(), 1);
  assert(await page.locator("#consistency button.heat-context").count() > 100);
  assert(await page.locator(".heat-week").evaluateAll(weeks => weeks.every(week => week.children.length === 8)));
  assert.equal(await scheduled.locator(".scheduled-post").count(), 4);
  await scheduled.getByRole("button", { name:/Lançamento Aurora/ }).click();
  assert.match(await page.getByRole("dialog").innerText(), /09:00/);
  await page.getByRole("button", { name:"Fechar", exact:true }).click();
  await page.locator("#consistency button.heat-cell:not(.heat-context)").focus();
  await page.getByRole("tooltip").waitFor();
  assert.match(await page.locator("#editorial-day-detail").innerText(), /1 publicação realizada/);
  await page.keyboard.press("Escape");
  await page.locator("#editorial-day-detail").waitFor({state:"hidden"});
  assert.equal(await page.locator(".sidebar-footer #profile-name").innerText(), "Meu perfil");
  await page.getByRole("button", { name: "Configurar perfil", exact: true }).click();
  await page.getByLabel("Seu nome").fill("Rafael Miranda");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  assert.equal(await page.locator("#profile-name").innerText(), "Rafael");
  await page.reload();
  assert.equal(await page.locator("#profile-name").innerText(), "Rafael");
  await page.locator('.side-nav a[href="#activities"]').click();
  await page.getByRole("table").waitFor();
  await page.getByRole("searchbox").fill("Coleção");
  await page.getByRole("button", { name: "Abrir detalhes de Coleção Aurora" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.locator('.side-nav a[href="#overview-top"]').click();
  await filter.click();
  await page.getByRole("button", { name: "Limpar" }).click();
  assert.equal(await filter.getAttribute("aria-label"),"Filtrar resultados, 3 filtros ativos");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  assert.equal(await filter.getAttribute("aria-label"),"Filtrar resultados");
  assert(!(await page.locator('#filter-count[data-active="true"]').count()));
  assert.equal(await reach.innerText(), initial);
  await page.getByRole("navigation", { name: "Atalhos da Visão Geral" }).getByRole("link", { name: "Agenda" }).click();
  await page.waitForURL((current) => current.hash === "#agenda");
  await page.locator("#agenda").waitFor();
  await page.goto(new URL("/",url).href);
  assert(await scheduled.getByText("Nenhuma conta do Instagram conectada.").isVisible());
  assert.deepEqual(await page.locator("#metrics .value").allTextContents(), ["—","—","—","—"]);
  assert.equal(await page.locator("#consistency button.heat-cell").count(), 0);
  assert.equal(await page.locator("#editorial .empty").count(), 5);
  await page.locator("#editorial").screenshot({style:".skip:not(:focus){visibility:hidden}",path:"test-results/layout/editorial-empty.png"});
  console.log("Filtros, foco no gráfico, busca, diálogo e navegação verificados.");

  const sidebarPage = await browser.newPage({ reducedMotion: "no-preference" });
  await sidebarPage.goto(url.href);
  await sidebarPage.locator(".editorial-post").first().waitFor();
  await sidebarPage.evaluate(() => document.fonts.ready);
  const toggle = sidebarPage.locator("#sidebar-toggle");
  const sideMenu = sidebarPage.locator("#side-menu");
  const theme = sidebarPage.getByRole("switch", { name: "Modo escuro" });
  assert.equal(await sideMenu.locator(".sidebar-footer .side-item").count(), 3);
  await theme.click();
  assert.equal(await theme.getAttribute("aria-checked"), "true");
  await sidebarPage.reload();
  assert.equal(await theme.getAttribute("aria-checked"), "true");
  await theme.click();
  assert.equal(await theme.getAttribute("aria-checked"), "false");
  const geometry = () => sidebarPage.evaluate(() => {
    const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
    const sidebar = rect("#side-menu");
    const main = rect("main");
    const workspace = document.querySelector(".workspace");
    return {
      width: sidebar.width,
      right: sidebar.right,
      top: sidebar.top,
      bottom: sidebar.bottom,
      mainLeft: main.left,
      mainWidth: main.width,
      workspaceWidth: workspace.offsetWidth,
      frameWidth: rect(".app-frame").width,
      consistencyWidth: rect(".consistency-widget").width,
      toggleBottom: rect("#sidebar-toggle").bottom,
      settingsTop: rect(".sidebar-footer #profile-button").top,
      navBottom: rect(".side-nav").bottom,
      cardsClear: [...document.querySelectorAll("main .card:not(.operational-pages .card)")].every((card) =>
        card.getBoundingClientRect().left >= sidebar.right),
    };
  });
  for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1440], [3440, 1440], [1024, 768]]) {
    await sidebarPage.setViewportSize({ width, height });
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    const compact = await geometry();
    assert.equal(compact.width, 72);
    assert(compact.cardsClear && compact.mainLeft >= compact.right && compact.toggleBottom <= height);
    assert(compact.settingsTop >= compact.navBottom && compact.bottom - compact.toggleBottom <= 16);
    assert.equal(await sideMenu.locator(".sidebar-brand .side-label").evaluate((label) => getComputedStyle(label).opacity), "0");
    await sidebarPage.screenshot({ path: `test-results/layout/sidebar-compacta-${width}x${height}.png` });
    await toggle.focus();
    await sidebarPage.keyboard.press("Enter");
    await sidebarPage.waitForFunction(() => document.querySelector("#side-menu").getBoundingClientRect().width === 260);
    assert.equal(await toggle.getAttribute("aria-label"), "Recolher menu");
    assert.equal(await toggle.evaluate((button) => getComputedStyle(button.querySelector("svg")).transform), "matrix(-1, 0, 0, -1, 0, 0)");
    assert.equal(await sideMenu.locator(".sidebar-brand .side-label").evaluate((label) => getComputedStyle(label).opacity), "1");
    const expanded = await geometry();
    assert.equal(expanded.mainLeft - compact.mainLeft, 188);
    assert.equal(compact.workspaceWidth - expanded.workspaceWidth, 188 + Math.round(compact.frameWidth - expanded.frameWidth));
    assert(expanded.mainWidth < compact.mainWidth && expanded.mainWidth <= expanded.workspaceWidth);
    assert.notEqual(expanded.consistencyWidth, compact.consistencyWidth);
    assert(expanded.cardsClear && expanded.mainLeft >= expanded.right);
    assert.equal(expanded.top, compact.top);
    assert.equal(expanded.bottom, compact.bottom);
    assert(await sidebarPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    await sidebarPage.screenshot({ path: `test-results/layout/sidebar-expandida-${width}x${height}.png` });
    await sidebarPage.keyboard.press("Escape");
    await sidebarPage.waitForFunction(() => document.querySelector("#side-menu").getBoundingClientRect().width === 72);
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal((await geometry()).mainWidth, compact.mainWidth);
  }
  assert.equal(await sideMenu.getByRole("link", { name: "Configurações" }).count(), 0);
  await toggle.click();
  await sidebarPage.reload();
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await theme.click();
  await sidebarPage.locator("#filter-trigger").click();
  await sidebarPage.getByRole("dialog", { name: "Filtros" }).waitFor();
  await sidebarPage.screenshot({ path: "test-results/layout/filtros-dark.png" });
  await sidebarPage.keyboard.press("Escape");
  await sidebarPage.getByRole("dialog", { name: "Filtros" }).waitFor({ state: "hidden" });
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await theme.click();
  await sidebarPage.setViewportSize({ width: 390, height: 844 });
  await sidebarPage.goto(url.href);
  await sidebarPage.locator(".editorial-post").first().waitFor();
  assert(!(await toggle.isVisible()));
  assert(await sidebarPage.getByRole("navigation", { name: "Atalhos da Visão Geral" }).isVisible());
  await sidebarPage.screenshot({ path: "test-results/layout/sidebar-mobile-390x844.png" });
  console.log("Sidebar estrutural validada em desktop e celular.");

  const scrollPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await scrollPage.goto(url.href);
  await scrollPage.locator(".editorial-post").first().waitFor();
  const sidebarBounds = () => scrollPage.evaluate(() => {
    const sidebar = document.querySelector(".app-sidebar").getBoundingClientRect();
    const footer = document.querySelector(".sidebar-footer").getBoundingClientRect();
    return { top: sidebar.top, bottom: sidebar.bottom, footer: footer.bottom };
  });
  assert(await scrollPage.evaluate(() => document.scrollingElement === document.documentElement &&
    getComputedStyle(document.querySelector(".workspace")).overflowY === "auto"));
  for (const expanded of [false, true]) {
    if (expanded) await scrollPage.getByRole("button", {name:"Expandir menu"}).click();
    await scrollPage.waitForFunction(width => document.querySelector(".app-sidebar").offsetWidth === width,expanded ? 260 : 72);
    for (const [width,height] of resolutions.filter(([width]) => width >= 1024)) {
      await scrollPage.setViewportSize({width,height});
      await scrollPage.evaluate(() => document.querySelector(".workspace").scrollTo(0,0));
      const top = await sidebarBounds();
      for (const fraction of [.5,1]) {
        await scrollPage.evaluate(part => {
          const pane = document.querySelector(".workspace");
          pane.scrollTo(0,(pane.scrollHeight-pane.clientHeight)*part);
        },fraction);
        const current = await sidebarBounds();
        assert(Math.abs(current.top-top.top)<=1 && current.bottom<=height && current.footer<=height);
        assert(await scrollPage.evaluate(() => {
          const root = document.scrollingElement;
          return root.scrollHeight === root.clientHeight && window.scrollY === 0;
        }));
      }
    }
  }
  await scrollPage.setViewportSize({width:1366,height:768});
  await scrollPage.evaluate(() => document.querySelector(".workspace").scrollTo(0,0));
  await scrollPage.locator(".workspace").focus();
  await scrollPage.keyboard.press("PageDown");
  await scrollPage.waitForFunction(() => document.querySelector(".workspace").scrollTop>0);
  const indicator = scrollPage.locator(".content-shell > .scroll-indicator");
  await indicator.locator("xpath=self::*[@data-visible='true']").waitFor();
  assert.equal(await indicator.locator("span").evaluate(thumb => getComputedStyle(thumb,"::after").backgroundColor),"rgb(244, 119, 69)");
  assert.equal(await indicator.locator("span").evaluate(thumb => getComputedStyle(thumb,"::after").width),"1.5px");
  await scrollPage.screenshot({path:"test-results/layout/app-shell-light.png"});
  await indicator.locator("xpath=self::*[@data-visible='false']").waitFor();
  const shell = scrollPage.locator(".content-shell");
  await scrollPage.locator(".workspace").evaluate(pane => pane.scrollTop = pane.scrollHeight);
  await shell.locator("xpath=self::*[@data-fade-top='true' and @data-fade-bottom='false']").waitFor();
  await scrollPage.locator(".workspace").evaluate(pane => pane.scrollTop = 0);
  await shell.locator("xpath=self::*[@data-fade-top='false' and @data-fade-bottom='true']").waitFor();
  await scrollPage.locator(".workspace").evaluate(pane => {pane.scrollTop = pane.scrollHeight/3;});
  await indicator.locator("xpath=self::*[@data-visible='true']").waitFor();
  const handle = await indicator.locator("span").boundingBox();
  await scrollPage.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);
  const oldPosition = await scrollPage.locator(".workspace").evaluate(pane => pane.scrollTop);
  await scrollPage.mouse.down();
  await scrollPage.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2+35,{steps:4});
  await scrollPage.mouse.up();
  assert((await scrollPage.locator(".workspace").evaluate(pane => pane.scrollTop))>oldPosition);
  await scrollPage.getByRole("switch",{name:"Modo escuro"}).click();
  await scrollPage.locator(".workspace").hover({position:{x:15,y:120}});
  await scrollPage.mouse.wheel(0,160);
  await indicator.locator("xpath=self::*[@data-visible='true']").waitFor();
  assert.equal(await indicator.locator("span").evaluate(thumb => getComputedStyle(thumb,"::after").backgroundColor),"rgb(244, 119, 69)");
  await scrollPage.screenshot({path:"test-results/layout/app-shell-dark.png",animations:"disabled"});
  await scrollPage.locator("#editorial").screenshot({style:".skip:not(:focus){visibility:hidden}",path:"test-results/layout/editorial-dark.png"});
  await scrollPage.evaluate(() => document.querySelector(".workspace").scrollTo(0,0));
  const list = scrollPage.locator("#scheduled-list");
  assert.equal(await list.evaluate(element => getComputedStyle(element).scrollbarWidth),"none");
  const widget = scrollPage.locator(".scheduled-widget");
  assert.equal(await widget.locator(".scroll-indicator").count(),0);
  const footer = widget.locator("footer");
  const header = widget.locator("header");
  const viewport = widget.locator(".scheduled-viewport");
  await viewport.locator("xpath=self::*[@data-fade-top='false' and @data-fade-bottom='true']").waitFor();
  for (const [format, color] of Object.entries({story:"#ffe5d7",reel:"#fbe2ee",carousel:"#fff0ce",feed:"#ddeeff"})) {
    const cards = list.locator(`[data-publication-format="${format}"]`);
    assert((await cards.count()) > 0, format);
    assert((await cards.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).getPropertyValue("--pastel").trim()))).every(value => value === color), format);
  }
  await widget.screenshot({path:"test-results/layout/posts-programados-dark.png"});
  const before = [await header.boundingBox(),await footer.boundingBox(),await scrollPage.evaluate(() => document.querySelector(".workspace").scrollTop)];
  await list.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await viewport.locator("xpath=self::*[@data-fade-top='true' and @data-fade-bottom='false']").waitFor();
  assert(await list.evaluate(element => element.scrollTop>0 && Math.abs(element.scrollHeight-element.clientHeight-element.scrollTop)<=1));
  assert.deepEqual([await header.boundingBox(),await footer.boundingBox(),await scrollPage.evaluate(() => document.querySelector(".workspace").scrollTop)],before);
  const agenda = footer.getByRole("link", {name:"Ver agenda completa"});
  assert.equal(await agenda.getAttribute("href"), "#agenda");
  await scrollPage.setViewportSize({width:1366,height:420});
  await scrollPage.locator(".side-nav").evaluate(nav => {nav.scrollTop = nav.scrollHeight});
  assert(await scrollPage.locator(".side-nav").evaluate(nav => nav.scrollTop>0));
  assert((await sidebarBounds()).footer<=420);
  console.log("Rolagem do ContentViewport, navegação lateral e lista interna verificadas.");
} finally {
  await browser.close();
}
