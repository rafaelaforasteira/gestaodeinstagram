import {chromium} from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport:{width:1366,height:768}});
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:3021/?demo=1#banners");
  await page.getByRole("button",{name:"Adicionar banner para Aurora Studio",exact:true}).click();
  const modal = page.locator("#banner-dialog");
  assert.equal(await modal.locator("select[name=account],input[type=datetime-local]").count(),0);
  assert.equal(await modal.locator("[data-remove-image]").isVisible(),false);
  assert.match(await modal.locator(".banner-editor-client").innerText(),/Aurora Studio/);
  await page.getByRole("button",{name:"Salvar banner",exact:true}).click();
  assert.match(await modal.locator('[data-error=name]').innerText(),/título/);
  assert.match(await modal.locator('[data-error=image]').innerText(),/imagem/);
  await page.getByLabel("Título público *",{exact:true}).fill("Coleção teste");
  await page.getByLabel("Link de destino *",{exact:true}).fill("javascript:alert(1)");
  await page.getByRole("button",{name:"Salvar banner",exact:true}).click();
  assert.match(await modal.locator('[data-error=url]').innerText(),/HTTPS/);
  await page.getByLabel("Link de destino *",{exact:true}).fill("https://example.com/");
  await modal.getByRole("button",{name:"Início *",exact:true}).click();
  const calendar = modal.locator("#banner-date-popover-start");
  await calendar.getByLabel("Hora de Início",{exact:true}).fill("14");
  await calendar.getByLabel("Minuto de Início",{exact:true}).fill("37");
  await calendar.getByRole("button",{name:"Aplicar",exact:true}).click();
  await modal.getByRole("button",{name:"Término — opcional",exact:true}).click();
  const endCalendar = modal.locator("#banner-date-popover-end");
  await endCalendar.getByRole("button",{name:"5 de novembro de 2026",exact:true}).click();
  await endCalendar.getByRole("button",{name:"Aplicar",exact:true}).click();
  await page.getByRole("button",{name:"Salvar banner",exact:true}).click();
  assert.match(await modal.locator('[data-error=end]').innerText(),/posterior/);
  await modal.getByRole("button",{name:"Término — opcional",exact:true}).click();
  await endCalendar.getByRole("button",{name:"Sem término",exact:true}).click();
  await modal.locator("[name=file]").setInputFiles({name:"invalid.txt",mimeType:"text/plain",buffer:Buffer.from("inválido")});
  assert.match(await modal.locator("[role=alert]").innerText(),/JPEG/);
  const png = await page.evaluate(()=>{
    const canvas=document.createElement("canvas");
    canvas.width=120;canvas.height=80;
    return canvas.toDataURL().split(",")[1];
  });
  await modal.locator("[name=file]").setInputFiles({name:"image.png",mimeType:"image/png",buffer:Buffer.from(png,"base64")});
  await modal.locator(".banner-media img").waitFor();
  assert.ok(await modal.locator("[data-remove-image]").isVisible());
  await page.screenshot({path:"test-results/layout/banner-new-filled.png"});
  await page.getByRole("button",{name:"Salvar banner",exact:true}).click();
  await modal.waitFor({state:"hidden"});
  assert.match(await page.locator(".banner-client").filter({hasText:"Aurora Studio"}).innerText(),/Coleção teste/);
  await page.getByRole("button",{name:"Adicionar banner para Casanova Design",exact:true}).click();

  assert.match(await modal.locator(".banner-editor-client").innerText(),/@casanova.design/);
  for(const width of [390,768,1024,1366,1440,1920,3440]) {
    await page.setViewportSize({width,height:844});
    assert.ok(await modal.evaluate(element=>element.scrollWidth<=element.clientWidth+1));
  }
  await page.evaluate(()=>document.documentElement.dataset.theme="dark");
  await modal.getByRole("button",{name:"Término — opcional",exact:true}).click();
  await page.screenshot({path:"test-results/layout/banner-new-calendar-dark.png"});
  await page.keyboard.press("Escape");
  assert.ok(await modal.isVisible());
  assert.deepEqual(errors,[]);
  console.log("Editor de banners: contexto, validações, upload, calendário, minutos, criação e responsividade verificados.");
} finally {
  await browser.close();
}
