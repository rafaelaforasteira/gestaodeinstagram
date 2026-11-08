import test from "node:test";
import { rankPosts, summarizePosts } from "./editorial.mjs";
import assert from "node:assert/strict";
import { engagement, selectPeriods, sum } from "./analytics.mjs";
import { demo, samples, offsetDay } from "./demo-data.mjs";

test("a conta selecionada e as duas janelas equivalentes definem todos os agregados", () => {
  const scoped = selectPeriods(samples, new Set(["aurora"]), offsetDay(demo.today,-6), demo.today);
  assert.equal(scoped.length, 7);
  assert.equal(scoped.current.length, 7);
  assert.equal(scoped.previous.length, 7);
  assert(scoped.current.every(({account}) => account === "aurora"));
  assert(scoped.previous.every(({date}) => date < offsetDay(demo.today,-6)));
  assert(sum(scoped.current,"views") > sum(scoped.current,"reach"));
});

test("escopo vazio não tem métricas e engajamento sem denominador é indisponível", () => {
  const { current, previous } = selectPeriods(samples, new Set(), demo.today, demo.today);
  assert.deepEqual([current,previous],[[],[]]);
  assert.equal(engagement(current),null);
  assert.equal(engagement([{reach:0,interactions:12}]),null);
});

test("taxa agregada usa soma de numeradores e denominadores", () => {
  assert.equal(engagement([{reach:100,interactions:10},{reach:900,interactions:9}]),1.9);
});
import { completeTotal, percentChange } from "./analytics.mjs";

test("KPIs preservam zero real e não apresentam um agregado parcial", () => {
  assert.equal(completeTotal(["a","b"], () => 0), 0);
  assert.equal(completeTotal(["a","b"], (id) => id === "a" ? 10 : null), null);
  assert.equal(percentChange(10, 0), null);
  assert.equal(percentChange(null, 20), null);
  assert.equal(percentChange(0, 20), -100);
  assert.equal(percentChange(24, 20), 20);
});
import { accountsInScope, selectActiveSchedules, selectScheduledPosts } from "./analytics.mjs";

test("escopo reúne contas conectadas do cliente sem aceitar vínculos fora do workspace", () => {
  const clients = [{id:"a",workspace:"studio"},{id:"b",workspace:"studio"},{id:"c",workspace:"lab"}];
  const accounts = [
    {id:"a1",client:"a",workspace:"studio",connected:true},
    {id:"a2",client:"a",workspace:"studio",connected:true,canPublish:false},
    {id:"a3",client:"a",workspace:"studio",connected:false},
    {id:"b1",client:"b",workspace:"studio",connected:true},
    {id:"invalid",client:"c",workspace:"studio",connected:true},
  ];
  assert.deepEqual(accountsInScope(accounts,clients,"studio","a").map(({id}) => id),["a1","a2"]);
  assert.deepEqual(accountsInScope(accounts,clients,"studio","a","b1"),[]);
  assert.deepEqual(accountsInScope(accounts,clients,"studio").map(({id}) => id),["a1","a2","b1"]);
});

test("agenda exclui registros vencidos e estados que não aguardam publicação", () => {
  const now = Date.parse("2026-11-06T15:00:00Z");
  const records = ["Agendado","Publicado","Falha","Cancelado","Rascunho","Processando"].map(status =>
    ({status,occurrence:status,account:"a",scheduledAt:"2026-11-07T01:00:00Z"}));
  records.push({status:"Agendado",occurrence:"vencido",account:"a",scheduledAt:"2026-11-06T14:59:59Z"});
  records.push({status:"Agendado",occurrence:"outra conta",account:"b",scheduledAt:"2026-11-07T01:00:00Z"});
  assert.deepEqual(selectActiveSchedules(records,new Set(["a"]),"2026-11-06","2026-11-06","America/Sao_Paulo",now)
    .map(({occurrence,time}) => [occurrence,time]),[["Agendado","22:00"]]);
});

test("agendamentos usam data operacional, escopo autorizado e ordem por ocorrência", () => {
  const records = [
    {occurrence:"b",account:"a",scheduledAt:"2026-11-07T02:30:00Z",status:"Falha"},
    {occurrence:"a",account:"a",scheduledAt:"2026-11-07T02:30:00Z",status:"Publicado"},
    {occurrence:"c",account:"b",scheduledAt:"2026-11-06T12:00:00Z"},
    {occurrence:"d",account:"a",scheduledAt:"2026-11-07T03:00:00Z"},
    {occurrence:"e",account:"a",scheduledAt:null},
  ];
  const rows = selectScheduledPosts(records,new Set(["a"]),"2026-11-06","2026-11-06","America/Sao_Paulo");
  assert.deepEqual(rows.map(({occurrence,time,status}) => [occurrence,time,status]),
    [["a","23:30","Publicado"],["b","23:30","Falha"]]);
});

test("ranking por alcance preserva zero e exclui pendentes, métricas ausentes e duplicatas", () => {
  const rows = [{id:1,account:"a",reach:20,status:"Publicado",externalId:"x"},
    {id:2,account:"a",reach:0,status:"Publicado"}, {id:3,account:"a",reach:null,status:"Publicado"},
    {id:4,account:"a",reach:50,status:"Agendado"}, {id:5,account:"a",reach:19,status:"Publicado",externalId:"x"}];
  assert.deepEqual(rankPosts(rows).map(post => post.id), [1,2]);
});

test("comparação usa valores disponíveis e taxa usa pares com alcance positivo", () => {
  const posts = [{views:20,reach:100,interactions:10}, {views:0,reach:300,interactions:90},
    {views:null,reach:0,interactions:100}, {reach:700,interactions:null}];
  assert.equal(summarizePosts(posts,"views"), 10);
  assert.equal(summarizePosts(posts,"rate"), 25);
  assert.equal(summarizePosts(posts.slice(2),"rate"), null);
});

test("comparação por formato usa janelas equivalentes e distingue zero de ausência", async () => {
  const {comparePublicationFormats} = await import("./analytics.mjs");
  const rows = [
    {account:"a",format:"Reel",status:"Publicado",date:"2026-01-01",views:0},
    {account:"b",format:"Reel",status:"Publicado",date:"2026-01-02",views:20},
    {account:"a",format:"Reel",status:"Publicado",date:"2026-01-02"},
    {account:"a",format:"Reel",status:"Publicado",date:"2025-12-31",views:5},
    {account:"z",format:"Reel",status:"Publicado",date:"2026-01-02",views:900}
  ];
  const result = comparePublicationFormats(rows,new Set(["a","b"]),"2026-01-01","2026-01-02","views");
  assert.equal(result.previousStart,"2025-12-30");
  assert.equal(result.previousEnd,"2025-12-31");
  assert.deepEqual(result.formats[0],{format:"reel",now:{total:3,measured:2,value:10},before:{total:1,measured:1,value:5},change:100});
  assert.equal(result.formats[1].now.value,null);
  for (const days of [1,7,30,90]) {
    const start=offsetDay("2026-01-02",1-days);
    const window=comparePublicationFormats([],new Set(),start,"2026-01-02","views");
    assert.equal(window.previousStart,offsetDay(start,-days));
    assert.equal(window.previousEnd,offsetDay(start,-1));
  }
});
