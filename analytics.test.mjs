import test from "node:test";
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
import { selectScheduledPosts } from "./analytics.mjs";

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
