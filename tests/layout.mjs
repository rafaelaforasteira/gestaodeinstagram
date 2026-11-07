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
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto(url.href);
  await page.getByRole("table").waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(() => getComputedStyle(document.querySelector(".metric .value")).fontFamily.includes("Geist Sans") &&
    document.fonts.check('600 26px "Geist Sans"')));
  assert.equal(await page.locator("#metrics .metric").count(), 4);
  assert.deepEqual(await page.locator("#metrics h3").allTextContents(), ["Alcance","Views","Engajados","Seguidores"]);
  assert.equal(await page.locator("#kpi-user-round-plus + .kpi-help").count(), 1);
  assert.equal(await page.locator("#metrics .metric").last().locator(".value").innerText(), "12.320");
  await page.getByRole("button", { name:"Sobre Engajados" }).focus();
  assert(await page.getByRole("tooltip").isVisible());
  assert.equal(await page.locator("#featured img").count(), 2);
  const scheduled = page.getByRole("region", { name:"Posts programados", exact:true });
  assert.equal(await scheduled.locator("input,select").count(), 0);
  assert.equal(await scheduled.locator(".scheduled-post").count(), 5);
  assert(await scheduled.getByText("Falha", { exact:true }).isVisible());
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
        cardsFit: [...document.querySelectorAll("main .card")].every((card) => {
          const bounds = card.getBoundingClientRect();
          return bounds.width > 0 && bounds.left >= main.left - 1 && bounds.right <= main.right + 1;
        }),
        widgetsFit: box(".heatmap-scroll").right <= box(".consistency-widget").right && (box(".consistency-widget").top !== box(".scheduled-widget").top || Math.abs(box(".consistency-widget").width - box(".scheduled-widget").width) < 1 && box(".consistency-widget").height === box(".scheduled-widget").height),
        tableOverflow: document.querySelector(".table-wrap").scrollWidth - document.querySelector(".table-wrap").clientWidth,
        table: Math.round(box(".table-wrap").width),
        overlaps,
      };
    });
    assert(layout.overflow <= 0 && layout.cardsFit && layout.widgetsFit && !layout.overlaps,
      `${width}×${height}: ${JSON.stringify(layout)}`);
    assert(layout.viewport - layout.frame <= 81, "O frame deixou margens excessivas");
    assert(layout.tableOverflow <= 1, "Tabela com conteúdo horizontal fora da área");
    console.log(`${width}×${height}: frame ${layout.frame}px, tabela ${layout.table}px`);
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
  const accountToggle = page.locator("#account-toggle");
  await accountToggle.click();
  await page.getByRole("searchbox", { name:"Buscar conta" }).fill("aurora");
  assert.equal(await page.getByRole("radio", { name:"@casanova.design" }).count(),0);
  await page.getByRole("radio", { name:"@aurora.studio" }).click();
  assert.equal(await reach.innerText(), initial);
  await page.keyboard.press("Escape");
  await filter.click();
  assert.equal(await accountToggle.innerText(),"Todas as contas");
  await page.getByText("Últimos 7 dias", { exact: true }).click();
  await page.locator("#greeting").click();
  await page.getByRole("dialog", { name: "Filtros" }).waitFor({ state: "hidden" });
  await filter.click();
  assert(await page.getByRole("radio", { name: "Últimos 30 dias" }).isChecked());
  await accountToggle.click();
  await page.getByRole("radio", { name:"@aurora.studio" }).click();
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
  assert.equal(await filter.getAttribute("aria-label"),"Filtrar resultados, filtros ativos");
  assert.equal(await page.locator("#metrics .metric").last().locator(".value").innerText(), "8.420");
  assert.notEqual(await reach.innerText(), initial);
  assert.equal(await page.locator("#consistency button.heat-cell:not(.heat-context)").count(), 1);
  assert(await page.locator("#consistency button.heat-context").count() > 100);
  assert(await page.locator(".heat-week").evaluateAll(weeks => weeks.every(week => week.children.length === 8)));
  assert.equal(await scheduled.locator(".scheduled-post").count(), 1);
  await scheduled.getByRole("button", { name:/Coleção Aurora/ }).click();
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
  await page.getByRole("searchbox").fill("Coleção");
  await page.getByRole("button", { name: "Abrir detalhes de Coleção Aurora" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await filter.click();
  await page.getByRole("button", { name: "Limpar" }).click();
  assert.equal(await filter.getAttribute("aria-label"),"Filtrar resultados, filtros ativos");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  assert.equal(await filter.getAttribute("aria-label"),"Filtrar resultados");
  assert.equal(await reach.innerText(), initial);
  await page.getByRole("navigation", { name: "Atalhos da Visão Geral" }).getByRole("link", { name: "Agenda" }).click();
  await page.waitForURL((current) => current.hash === "#agenda");
  assert(await page.locator(".workspace").evaluate((workspace) => workspace.scrollTop > 0), "Não foi possível chegar à agenda");
  await page.goto(new URL("/",url).href);
  assert(await scheduled.getByText("Nenhuma conta do Instagram conectada.").isVisible());
  assert.deepEqual(await page.locator("#metrics .value").allTextContents(), ["—","—","—","—"]);
  assert.equal(await page.locator("#consistency button.heat-cell").count(), 0);
  console.log("Filtros, foco no gráfico, busca, diálogo e navegação verificados.");

  const sidebarPage = await browser.newPage({ reducedMotion: "no-preference" });
  await sidebarPage.goto(url.href);
  await sidebarPage.getByRole("table").waitFor();
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
      cardsClear: [...document.querySelectorAll("main .card")].every((card) =>
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
  await sidebarPage.getByRole("table").waitFor();
  assert(!(await toggle.isVisible()));
  assert(await sidebarPage.getByRole("navigation", { name: "Atalhos da Visão Geral" }).isVisible());
  await sidebarPage.screenshot({ path: "test-results/layout/sidebar-mobile-390x844.png" });
  console.log("Sidebar estrutural validada em desktop e celular.");

  const scrollPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await scrollPage.goto(url.href);
  await scrollPage.getByRole("table").waitFor();
  const workspace = scrollPage.locator(".workspace");
  const thumb = scrollPage.locator(".scroll-indicator.vertical:not([hidden])");
  const waitForOpacity = (opacity) => scrollPage.waitForFunction((expected) => {
    const element = document.querySelector(".scroll-indicator.vertical:not([hidden])");
    return (element ? Number(getComputedStyle(element).opacity) : 0) === expected;
  }, opacity);
  await waitForOpacity(0);
  assert.equal(await workspace.evaluate((element) => getComputedStyle(element).scrollbarWidth), "thin");
  assert.equal(await workspace.evaluate((element) => getComputedStyle(element).scrollbarColor), "rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)");
  const before = await workspace.boundingBox();
  await scrollPage.mouse.move(900, 600);
  await scrollPage.mouse.wheel(0, 300);
  await scrollPage.waitForFunction(() => {
    const element = document.querySelector(".scroll-indicator.vertical[data-visible]:not([hidden])");
    return element && Number(getComputedStyle(element).opacity) > 0 && Number(getComputedStyle(element).opacity) < 1;
  });
  await waitForOpacity(1);
  assert.equal(await thumb.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(244, 119, 69)");
  await scrollPage.screenshot({ path: "test-results/layout/scrollbar-light.png" });
  await scrollPage.waitForFunction(() => {
    const element = document.querySelector(".scroll-indicator.vertical:not([hidden])");
    return element && !element.hasAttribute("data-visible") && Number(getComputedStyle(element).opacity) < 1 &&
      Number(getComputedStyle(element).opacity) > 0;
  });
  await waitForOpacity(0);
  assert.deepEqual(await workspace.boundingBox(), before);
  await workspace.focus();
  await scrollPage.keyboard.press("PageUp");
  await waitForOpacity(1);
  await waitForOpacity(0);
  await scrollPage.getByRole("switch", { name: "Modo escuro" }).click();
  await scrollPage.mouse.move(900, 600);
  await scrollPage.mouse.wheel(0, 250);
  await waitForOpacity(1);
  assert.equal(await thumb.evaluate((element) => getComputedStyle(element).backgroundColor), "rgba(255, 255, 255, 0.85)");
  await scrollPage.screenshot({ path: "test-results/layout/scrollbar-dark.png" });
  await waitForOpacity(0);
  const sidebarBounds = () => scrollPage.evaluate(() => {
    const sidebar = document.querySelector(".app-sidebar").getBoundingClientRect();
    const footer = document.querySelector(".sidebar-footer").getBoundingClientRect();
    const brand = document.querySelector(".sidebar-brand").getBoundingClientRect();
    return { top: sidebar.top, bottom: sidebar.bottom, brand: brand.top, footer: footer.bottom };
  });
  for (const expanded of [false, true]) {
    if (expanded) await scrollPage.getByRole("button", { name: "Expandir menu" }).click();
    await scrollPage.waitForFunction((width) => document.querySelector(".app-sidebar").offsetWidth === width, expanded ? 260 : 72);
    for (const [width, height] of [[1366,768],[1440,900],[1920,1080],[2560,1440],[3440,1440],[1024,768]]) {
      await scrollPage.setViewportSize({width,height});
      const stable = await sidebarBounds();
      assert(stable.top >= 0 && stable.bottom <= height && stable.brand >= stable.top && stable.footer <= stable.bottom);
      for (const [position, fraction] of [["topo", 0], ["meio", .5], ["final", 1]]) {
        await workspace.evaluate((scroll, part) => { scroll.scrollTop = (scroll.scrollHeight - scroll.clientHeight) * part; }, fraction);
        assert.deepEqual(await sidebarBounds(), stable);
        assert.equal(await scrollPage.evaluate(() => window.scrollY), 0);
        if (width === 1366) await scrollPage.screenshot({ path: `test-results/layout/sidebar-${expanded ? "expandida" : "compacta"}-${position}.png` });
      }
    }
  }
  const darkBounds = await sidebarBounds();
  await scrollPage.getByRole("switch", { name: "Modo escuro" }).click();
  assert.deepEqual(await sidebarBounds(), darkBounds);
  for (const position of [0, 1]) {
    await workspace.evaluate((scroll, part) => { scroll.scrollTop = (scroll.scrollHeight - scroll.clientHeight) * part; }, position);
    assert.deepEqual(await sidebarBounds(), darkBounds);
  }
  await scrollPage.setViewportSize({ width: 1366, height: 420 });
  await workspace.evaluate((scroll) => { scroll.scrollTop = 0; });
  await scrollPage.locator(".side-nav").evaluate((nav) => { nav.scrollTop = nav.scrollHeight; });
  await scrollPage.locator(".side-nav[data-scrolling]").waitFor({ state: "attached" });
  assert(await scrollPage.locator(".side-nav").evaluate((nav) => nav.scrollTop > 0));
  assert((await scrollPage.locator(".sidebar-footer").boundingBox()).y < 420);
  await workspace.focus();
  await scrollPage.keyboard.press("PageDown");
  await scrollPage.waitForFunction(() => document.querySelector(".workspace").scrollTop > 0);
  await scrollPage.emulateMedia({ reducedMotion: "reduce" });
  assert(await thumb.evaluateAll((elements) =>
    elements.every((element) => getComputedStyle(element).transitionDuration === "0s")));
  await waitForOpacity(0);
  console.log("Perfil local, tema, scrollbar nativa e posição da sidebar verificados.");
} finally {
  await browser.close();
}
