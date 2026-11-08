import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";

const url = new URL(process.env.STUDIO_URL ?? "http://127.0.0.1:3021");
url.searchParams.set("demo","1");
const browser = await chromium.launch();
await mkdir("test-results/layout",{recursive:true});
try {
  const p = await browser.newPage({viewport:{width:1366,height:768}});
  const errors = [];
  p.on("pageerror",error => errors.push(error.message));
  await p.goto(url.href);
  await p.getByRole("link",{name:"Agenda",exact:true}).click();
  const agenda = p.locator("#agenda");
  await agenda.waitFor();
  await p.locator("#overview-top").getByRole("heading",{name:"Agenda",level:1}).waitFor();
  assert.equal(await p.locator("#agenda-heading p").innerText(),"Planeje e acompanhe suas publicações.");
  assert.equal(await p.locator("#agenda input[type=date]").count(),0);
  assert.equal(await p.getByRole("link",{name:"Agenda",exact:true}).getAttribute("aria-current"),"location");
  assert.equal(await agenda.getByRole("radio",{name:"Semana"}).isChecked(),true);
  assert.equal(await agenda.locator("[data-hour]").count(),24);
  const collision = agenda.locator('[data-hour="10"] .agenda-hour-cell').filter({hasText:"Texturas do ateliê"});
  const boxes = await Promise.all((await collision.locator("[data-agenda-event]").all()).map(card => card.boundingBox()));
  assert.ok(boxes.length >= 2 && boxes[0].y+boxes[0].height <= boxes[1].y);
  const night = agenda.getByRole("button",{name:/Bastidores da madrugada/});
  assert.equal(await night.locator("xpath=ancestor::*[@data-hour]").getAttribute("data-hour"),"02");
  await night.click();
  assert.match(await p.locator("#dialog-content").innerText(),/02:15.*Brasília/);
  await p.keyboard.press("Escape");
  await agenda.getByRole("button",{name:"Hoje",exact:true}).click();
  await p.screenshot({path:"test-results/layout/agenda-semana-hd.png"});
  for (const mode of ["Dia","Mês","Lista","Semana"]) {
    await agenda.getByRole("radio",{name:mode,exact:true}).check();
    const before = await p.locator("#agenda-period").innerText();
    await agenda.getByRole("button",{name:"Próximo período"}).click();
    assert.notEqual(await p.locator("#agenda-period").innerText(),before);
    await agenda.getByRole("button",{name:"Período anterior"}).click();
    assert.equal(await p.locator("#agenda-period").innerText(),before);
  }
  await agenda.getByRole("radio",{name:"Mês"}).check();
  await agenda.getByRole("button",{name:/Ver todas as publicações de 6 de nov/}).click();
  assert.equal(await agenda.getByRole("radio",{name:"Dia",exact:true}).isChecked(),true);
  const filters = p.locator("#filter-trigger");
  await filters.click();
  assert.equal(await p.locator("#analysis-period").isVisible(),true);
  await p.locator('.period-options label').getByText("Ontem",{exact:true}).click();
  await p.keyboard.press("Escape");
  assert.match(await p.locator("#agenda-period").innerText(),/^6 de novembro/);
  await filters.click();
  assert.equal(await p.getByRole("radio",{name:"Hoje",exact:true}).isChecked(),true);
  await p.locator('.custom-option').getByText("Período personalizado").click();
  await p.locator('#calendar-days [data-day="2026-11-04"]').click();
  await p.locator('#calendar-days [data-day="2026-11-05"]').click();
  await p.getByRole("button",{name:"Aplicar filtros"}).click();
  assert.match(await p.locator("#agenda-period").innerText(),/^5 de novembro/);
  assert.equal(await p.locator("#filter-count").textContent(),"1");
  await agenda.getByRole("button",{name:"Hoje",exact:true}).click();
  await filters.click();
  await p.locator("#client-toggle").click();
  await p.getByRole("radio",{name:/Aurora Studio/}).check();
  await p.locator("#account-toggle").click();
  const account = p.locator("#account-options input[type=radio]").last();
  if (await account.count()) await account.check();
  await p.getByRole("button",{name:"Aplicar filtros"}).click();
  assert.match(await p.locator("#agenda-scope").innerText(),/Aurora Studio/);
  assert.equal(await agenda.getByRole("button",{name:/Bastidores do estúdio/}).count(),0);
  await filters.click();
  await p.getByRole("button",{name:"Limpar",exact:true}).click();
  await p.getByRole("button",{name:"Aplicar filtros"}).click();
  assert.equal(await agenda.getByRole("button",{name:/Bastidores do estúdio/}).count(),1);
  assert.equal(await p.locator("#filter-count").getAttribute("data-active"),"false");
  await agenda.getByRole("button",{name:"+ Nova publicação",exact:true}).click();
  await p.getByRole("dialog",{name:"Nova publicação"}).getByRole("heading",{name:"Onde você deseja publicar?"}).waitFor();
  await p.keyboard.press("Escape");
  assert.deepEqual(errors,[]);
  await p.close();

  for (const [width,height] of [[390,844],[768,1024],[1024,768],[1366,768],[1440,900],[1920,1080],[3440,1440]]) {
    const page = await browser.newPage({viewport:{width,height},hasTouch:width===390});
    await page.goto(new URL("#agenda",url).href);
    if (width===390) assert.equal(await page.getByRole("radio",{name:"Dia",exact:true}).isChecked(),true);
    for (const dark of [false,true]) {
      if (dark) await page.getByRole("switch",{name:"Modo escuro"}).click();
      const toggle = page.getByRole("button",{name:dark?"Recolher menu":"Expandir menu"});
      for (let pass=0;pass<2;pass++) {
        if (pass && await toggle.isVisible()) await toggle.click();
        await page.getByRole("radio",{name:"Semana"}).check();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
        assert.ok(await page.locator("#agenda [data-agenda-event]").count()>0);
        const filter = page.locator("#overview-top #filter-trigger");
        await filter.click();
        const box = await page.locator("#filter-panel").boundingBox();
        assert.ok(box.x >= 0 && box.y >= 0 && box.x+box.width <= width+1 && box.y+box.height <= height+1);
        if (width===390 && dark && pass) await page.screenshot({path:"test-results/layout/agenda-filtros-mobile.png",animations:"disabled"});
        await page.keyboard.press("Escape");
      }
    }
    if ([390,1920,3440].includes(width)) await page.screenshot({path:`test-results/layout/agenda-${width}-dark.png`});
    await page.close();
  }
  console.log("Agenda: navegação, quatro modos, filtros, detalhes, colisão, madrugada e responsividade verificados.");
} finally {
  await browser.close();
}
