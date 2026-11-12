import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";

const url = new URL(process.env.STUDIO_URL ?? "http://127.0.0.1:3021");
url.searchParams.set("demo","1");
const browser = await chromium.launch();
await mkdir("test-results/layout",{recursive:true});
try {
  const p = await browser.newPage({viewport:{width:1366,height:768}});
  await p.clock.setFixedTime(new Date("2026-11-09T16:48:00Z"));
  const errors = [];
  p.on("pageerror",error => errors.push(error.message));
  await p.goto(url.href);
  await p.getByRole("link",{name:"Agenda",exact:true}).click();
  const agenda = p.locator("#agenda");
  await agenda.waitFor();
  const attention = agenda.getByRole("region",{name:"Central de atenção"});
  assert.equal(await attention.locator("#agenda-alert-count").textContent(),"3");
  assert.match(await attention.locator("li").first().innerText(),/Falha na publicação/);
  await attention.screenshot({path:"test-results/layout/agenda-central-atencao.png",animations:"disabled"});
  await attention.getByRole("button",{name:/Enquete de cores/}).click();
  await p.getByRole("dialog",{name:"Enquete de cores"}).waitFor();
  await p.keyboard.press("Escape");
  await attention.getByRole("link",{name:"Ver todos"}).click();
  await p.locator("#attention").waitFor();
  assert.equal(await p.locator("#alerts li").count(),3);
  await p.getByRole("link",{name:"Agenda",exact:true}).click();
  await agenda.waitFor();
  const mini = agenda.getByRole("complementary",{name:"Navegação por data"});
  const calendar = agenda.locator("#agenda-content");
  const initialPeriod = await calendar.getAttribute("aria-label");
  await mini.getByRole("button",{name:"Próximo mês"}).click();
  assert.match(await mini.locator("#agenda-mini-month").textContent(),/dezembro de 2026/);
  assert.equal(await calendar.getAttribute("aria-label"),initialPeriod);
  await mini.getByRole("button",{name:/10 de dezembro de 2026/}).click();
  assert.match(await calendar.getAttribute("aria-label"),/dezembro de 2026/);
  assert.equal(await calendar.getAttribute("data-mode"),"week");
  assert.equal(await mini.locator('[aria-pressed="true"]').getAttribute("data-date"),"2026-12-10");
  await agenda.getByRole("radio",{name:"Hoje",exact:true}).check();
  assert.match(await calendar.getAttribute("aria-label"),/9 de novembro de 2026/);
  assert.equal(await calendar.getAttribute("data-mode"),"day");
  assert.equal(await calendar.locator('.agenda-hour-header time[aria-current="date"]').getAttribute("datetime"),"2026-11-09");
  assert.equal(await attention.locator("#agenda-alert-count").textContent(),"3");
  await p.screenshot({path:"test-results/layout/agenda-hoje-alertas.png"});
  assert.equal(await mini.locator('[aria-current="date"]').getAttribute("data-date"),"2026-11-09");
  assert.equal(await mini.locator('[aria-current="date"]').getAttribute("aria-pressed"),"true");
  await mini.getByRole("button",{name:"sexta-feira, 6 de novembro de 2026",exact:true}).click();
  assert.equal(await agenda.getByRole("radio",{name:"Hoje",exact:true}).isChecked(),false);
  await agenda.getByRole("radio",{name:"Semana",exact:true}).check();
  assert.equal(await calendar.getAttribute("aria-label"),initialPeriod);
  assert.equal(await mini.locator('[data-date="2026-11-06"]').getAttribute("aria-current"),null);
  const clockPage=await browser.newPage({viewport:{width:390,height:844}});
  await clockPage.clock.install({time:new Date("2026-11-09T14:59:58Z")});
  await clockPage.clock.pauseAt(new Date("2026-11-09T14:59:59Z"));
  await clockPage.goto(new URL("#agenda",url).href);
  const clock=clockPage.locator("#agenda-clock-date");
  assert.equal(await clockPage.locator("#agenda-greeting,#agenda-period,#agenda .widget-help").count(),0);
  assert.match(await clock.textContent(),/segunda-feira, 9 de novembro de 2026, às 11h59/);
  await clockPage.clock.runFor(1000);
  assert.match(await clock.textContent(),/12h00/);
  await clockPage.getByRole("radio",{name:"Semana",exact:true}).check();
  assert.match(await clock.textContent(),/9 de novembro.*12h00/);
  await clockPage.clock.setSystemTime(new Date("2026-11-09T20:59:59Z"));
  await clockPage.evaluate(()=>document.dispatchEvent(new Event("visibilitychange")));
  assert.match(await clock.textContent(),/17h59/);
  await clockPage.clock.runFor(1000);
  assert.match(await clock.textContent(),/18h00/);
  await clockPage.clock.setSystemTime(new Date("2026-11-10T02:59:59Z"));
  await clockPage.evaluate(()=>document.dispatchEvent(new Event("visibilitychange")));
  await clockPage.clock.runFor(1000);
  assert.match(await clock.textContent(),/terça-feira, 10 de novembro de 2026, às 00h00/);
  assert.match(await clockPage.locator("#agenda-scope").textContent(),/Data-base da demonstração: 6 de nov/);
  await clockPage.getByRole("switch",{name:"Modo escuro"}).click();
  await clockPage.locator("#agenda-clock-date").screenshot({path:"test-results/layout/agenda-relogio-mobile.png",animations:"disabled"});
  await clockPage.close();
  await p.locator("#overview-top").getByRole("heading",{name:"Agenda",level:1}).waitFor();
  assert.match(await p.locator("#agenda-heading p").innerText(),/9 de novembro de 2026, às 13h48/);
  assert.equal(await agenda.locator("#agenda-clock-date,#agenda-mini-today").count(),0);
  assert.equal(await p.locator("#agenda input[type=date]").count(),0);
  assert.equal(await agenda.locator("#agenda-prev,#agenda-today,#agenda-next").count(),0);
  assert.equal(await p.getByRole("link",{name:"Agenda",exact:true}).getAttribute("aria-current"),"location");
  assert.equal(await agenda.getByRole("radio",{name:"Semana"}).isChecked(),true);
  const weekDates=agenda.locator(".agenda-hour-header time");
  assert.equal(await weekDates.count(),7);
  const todayHeader=agenda.locator('.agenda-hour-header [aria-current="date"]');
  assert.equal(await todayHeader.count(),0);
  assert.equal(await agenda.locator("[data-hour]").count(),24);
  const collision = agenda.locator('[data-hour="10"] .agenda-hour-cell').filter({hasText:"Texturas do ateliê"});
  const boxes = await Promise.all((await collision.locator("[data-agenda-event]").all()).map(card => card.boundingBox()));
  assert.ok(boxes.length >= 2 && boxes[0].y+boxes[0].height <= boxes[1].y);
  const night = agenda.getByRole("button",{name:/Bastidores da madrugada/});
  assert.equal(await night.locator("xpath=ancestor::*[@data-hour]").getAttribute("data-hour"),"02");
  await night.click();
  const detail = p.getByRole("dialog",{name:"Bastidores da madrugada"});
  await detail.waitFor();
  const instagramLink = detail.getByRole("heading",{name:"Publicação no Instagram"}).locator("..");
  assert.match(await instagramLink.innerText(),/Link indisponível na demonstração/);
  assert.equal(await instagramLink.getByRole("link").count(),0);
  assert.equal(await instagramLink.getByRole("button").count(),0);
  assert.equal(await detail.locator(".agenda-detail-rows dd").nth(1).innerText(),"02:15");
  assert.equal(await detail.locator(".agenda-detail-rows dd").nth(2).innerText(),"Horário de Brasília");
  await p.keyboard.press("Escape");
  await p.screenshot({path:"test-results/layout/agenda-semana-hd.png"});
  for (const mode of ["Mês","Lista","Semana"]) {
    await agenda.getByRole("radio",{name:mode,exact:true}).check();
    assert.equal(await agenda.getByRole("radio",{name:mode,exact:true}).isChecked(),true);
  }
  await agenda.getByRole("radio",{name:"Mês"}).check();
  assert.equal(await calendar.locator(".agenda-month > .agenda-date-surface").count(),7);
  assert.equal(await calendar.locator('.agenda-month-date[aria-current="date"] .agenda-day-number').textContent(),"9");
  await p.screenshot({path:"test-results/layout/agenda-mes-alertas.png"});
  await agenda.getByRole("button",{name:/Ver todas as publicações de 6 de nov/}).click();
  assert.equal(await calendar.getAttribute("data-mode"),"day");
  assert.equal(await agenda.getByRole("radio",{name:"Hoje",exact:true}).isChecked(),false);
  const filters = p.locator("#agenda-filter-trigger");
  assert.equal(await p.locator("#filter-trigger").isVisible(),false);
  await filters.click();
  assert.equal(await p.locator("#analysis-period").isVisible(),false);
  await p.locator("#client-toggle").click();
  await p.getByRole("radio",{name:/Aurora Studio/}).check();
  await p.locator("#account-toggle").click();
  const account = p.locator("#account-options input[type=radio]").last();
  if (await account.count()) await account.check();
  await p.getByRole("button",{name:"Aplicar filtros"}).click();
  assert.equal(await p.locator("#agenda-filter-count").textContent(),"2");
  assert.match(await p.locator("#agenda-scope").innerText(),/Aurora Studio/);
  assert.match(await attention.innerText(),/Tudo em dia/);
  await attention.screenshot({path:"test-results/layout/agenda-sem-pendencias.png",animations:"disabled"});
  assert.equal(await agenda.getByRole("button",{name:/Bastidores do estúdio/}).count(),0);
  await filters.click();
  await p.getByRole("button",{name:"Limpar",exact:true}).click();
  await p.getByRole("button",{name:"Aplicar filtros"}).click();
  assert.equal(await agenda.getByRole("button",{name:/Bastidores do estúdio/}).count(),1);
  assert.equal(await p.locator("#agenda-filter-count").getAttribute("data-active"),"false");
  await agenda.getByRole("button",{name:"Novo agendamento",exact:true}).click();
  await p.getByRole("dialog",{name:"Nova publicação"}).getByRole("heading",{name:"Onde você deseja publicar?"}).waitFor();
  await p.keyboard.press("Escape");
  assert.deepEqual(errors,[]);
  await p.close();
  const volume = await browser.newPage({viewport:{width:1366,height:768}});
  const fixtures = [];
  function add(day,hour,count,account="aurora") {
    for (let index=0;index<count;index++) {
      const minute = hour===10 && day===16 && index<3 ? [1,15,30][index] : hour===10 && day===16 ? 30 : 0;
      const id = "volume-"+fixtures.length;
      const scheduledAt = `2026-11-${day}T${hour}:${String(minute).padStart(2,"0")}:00-03:00`;
      fixtures.push({id,occurrence:id,account,title:"Publicação de teste "+id,clientName:account==="aurora"?"Aurora Studio":"Casanova Design",
        format:"Reel",status:"Agendado",scheduledAt,destinations:[{platform:"instagram",status:"Agendado",scheduledAt}]});
    }
  }
  add(16,10,1);
  add(16,10,4,"casa");
  add(17,10,1);
  add(16,11,10);
  add(16,12,2);
  await volume.route("**/demo-data.mjs",async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text())+"\n demoSchedules.push(..."+JSON.stringify(fixtures)+");"});
  });
  await volume.goto(new URL("#agenda",url).href);
  await volume.locator('.agenda-mini-day[data-date="2026-11-16"]').click();
  const row = hour => volume.locator('.agenda-hour-row[data-hour="'+hour+'"]');
  const monday = hour => row(hour).locator(".agenda-hour-cell").first();
  for (const [hour,count] of [[10,5],[11,10],[12,2]]) {
    const cards = monday(hour).locator("[data-agenda-event]");
    assert.equal(await cards.count(),count);
    const boxes = await cards.evaluateAll(items=>items.map(item=>item.getBoundingClientRect().toJSON()));
    assert.ok(boxes.every((box,index)=>index===0||box.top>=boxes[index-1].bottom));
  }
  assert.deepEqual(await monday(10).locator(".scheduled-time > span").allTextContents(),["10:01","10:01","10:15","10:30","10:30"]);
  assert.equal(await row(10).locator(".agenda-hour-cell").nth(1).locator("[data-agenda-event]").count(),1);
  const originalHeight=(await row(10).boundingBox()).height;
  await volume.locator("#agenda-filter-trigger").click();
  await volume.locator("#client-toggle").click();
  await volume.getByRole("radio",{name:/Aurora Studio/}).check();
  await volume.getByRole("button",{name:"Aplicar filtros"}).click();
  assert.equal(await monday(10).locator("[data-agenda-event]").count(),1);
  assert.ok((await row(10).boundingBox()).height<originalHeight);
  await volume.close();
  const live = await browser.newPage();
  await live.goto(new URL("#agenda",process.env.STUDIO_URL ?? "http://127.0.0.1:3021").href);
  assert.match(await live.locator("#agenda-alerts").innerText(),/indisponível/);
  assert.equal(await live.locator("#agenda-alerts button").count(),0);
  await live.close();

  for (const [width,height] of [[390,844],[768,1024],[1024,768],[1366,768],[1440,900],[1920,1080],[2560,1440],[3440,1440]]) {
    const page = await browser.newPage({viewport:{width,height},hasTouch:width===390});
    await page.goto(new URL("#agenda",url).href);
    if (width===390) assert.equal(await page.locator("#agenda-content").getAttribute("data-mode"),"day");
    for (const dark of [false,true]) {
      if (dark) await page.getByRole("switch",{name:"Modo escuro"}).click();
      const toggle = page.getByRole("button",{name:dark?"Recolher menu":"Expandir menu"});
      for (let pass=0;pass<2;pass++) {
        if (pass && await toggle.isVisible()) await toggle.click();
        await page.getByRole("radio",{name:"Semana"}).check();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
        assert.ok(await page.locator("#agenda [data-agenda-event]").count()>0);
        const [miniBox,segmentsBox] = await page.locator(".agenda-mini,.agenda-segments").evaluateAll(items=>items.map(item=>item.getBoundingClientRect().toJSON()));
        assert.ok(Math.abs(miniBox.x-segmentsBox.x)<1 && Math.abs(miniBox.width-segmentsBox.width)<1 && segmentsBox.y>=miniBox.bottom,
          JSON.stringify({width,dark,pass,miniBox,segmentsBox}));
        const widths = await page.locator(".agenda-segments .metric-segment").evaluateAll(items=>items.map(item=>item.getBoundingClientRect().width));
        assert.ok(Math.max(...widths)-Math.min(...widths)<0.1);
        if ([1366,1920,3440].includes(width)) await page.screenshot({path:`test-results/layout/agenda-lateral-${width}-${dark?"escuro":"claro"}-${pass}.png`});
        if (pass) {
          const timeline=page.locator(".agenda-timeline");
          const geometry=await timeline.evaluate(el=>{
            el.scrollTop=300;
            el.scrollLeft=180;
            const header=el.querySelector(".agenda-hour-header");
            const row=el.querySelector('[data-hour="08"]');
            const alerts=el.closest(".agenda-calendar-layout").querySelector(".agenda-attention").getBoundingClientRect();
            const bounds=el.getBoundingClientRect();
            return {
              fillsColumn:bounds.bottom>=alerts.bottom-1,
              verticalScroll:el.scrollTop,
              sticky:Math.abs(header.getBoundingClientRect().top-el.getBoundingClientRect().top)<=2,
              aligned:[...header.querySelectorAll("time")].every((day,index)=>{
                const heading=day.getBoundingClientRect(),cell=row.children[index+1].getBoundingClientRect();
                return Math.abs(heading.x-cell.x)<1&&Math.abs(heading.width-cell.width)<1;
              }),
              textured:getComputedStyle(header).backgroundImage.includes("repeating-linear-gradient"),
              scrollLeft:el.scrollLeft,
            };
          });
          assert.ok(geometry.sticky&&geometry.aligned&&geometry.textured);
          assert.ok(geometry.fillsColumn&&geometry.verticalScroll>0);
          if (width===390) assert.ok(geometry.scrollLeft>0);
          if (width===1366) await page.locator(".agenda-hour-header").screenshot({path:`test-results/layout/agenda-semana-cabecalho-${dark?"escuro":"claro"}.png`,animations:"disabled"});
        }
        const filter = page.locator("#agenda-filter-trigger");
        if (width===1366 && !dark && pass) await page.locator(".agenda-actions").screenshot({path:"test-results/layout/agenda-acoes-laterais.png"});
        await filter.click();
        const box = await page.locator("#filter-panel").boundingBox();
        assert.ok(box.x >= 0 && box.y >= 0 && box.x+box.width <= width+1 && box.y+box.height <= height+1);
        if (width===390 && dark && pass) await page.screenshot({path:"test-results/layout/agenda-filtros-mobile.png",animations:"disabled"});
        await page.keyboard.press("Escape");
      }
    }
    if ([390,1920,3440].includes(width)) await page.screenshot({path:`test-results/layout/agenda-${width}-dark.png`});
    if (width===1366) await page.locator(".agenda-attention").screenshot({path:"test-results/layout/agenda-central-atencao-escuro.png",animations:"disabled"});
    await page.close();
  }
  console.log("Agenda: navegação, quatro modos, filtros, detalhes, colisão, madrugada e responsividade verificados.");
} finally {
  await browser.close();
}
