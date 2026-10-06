import test from "node:test";
import assert from "node:assert/strict";
import { buildRequest, validateForm } from "../dist/mira-templates/template.js";
const base = () => ({
  assets: {
    outfit: { name: "outfit.jpg", origin: "upload" },
    person: { name: "person.jpg", origin: "upload" },
  },
  sceneMode: "default",
  sceneText: "",
  inspiration: "",
  style: "跟随模板",
  action: "跟随模板",
  duration: 10,
  ratio: "9:16",
  quality: "1080p",
});
test("one complete output with contiguous internal phases and exact duration", () => {
  for (const d of [8, 10, 12, 15]) {
    const s = base();
    s.duration = d;
    const r = buildRequest(s);
    assert.equal(r.outputCount, 1);
    assert.equal(r.internalStructure[0].from, 0);
    assert.equal(r.internalStructure[0].to, r.internalStructure[1].from);
    assert.equal(r.internalStructure[1].to, d);
  }
});
test("disabled optional references do not enter the prompt", () => {
  const r = buildRequest(base());
  assert.deepEqual(
    r.assets.map((a) => a.role),
    ["person", "outfit"],
  );
  assert(!r.compiledBasePrompt.includes("@Image3"));
  assert(!r.compiledBasePrompt.includes("发型参考"));
});
test("independent hair and accessory sources get unique explicit references", () => {
  const s = base();
  s.assets.hair = { name: "hair.jpg" };
  s.assets.bag = { name: "bag.jpg" };
  const r = buildRequest(s);
  assert.match(r.compiledBasePrompt, /@Image3 是本次明确指定的发型/);
  assert.match(r.compiledBasePrompt, /@Image4 是本次明确指定的包袋/);
  assert.match(r.compiledBasePrompt, /不采用这张图的人脸/);
  delete s.assets.bag;
  assert(!buildRequest(s).compiledBasePrompt.includes("@Image4"));
});
test("inactive scene asset is omitted and text scene replaces default", () => {
  const s = base();
  s.assets.scene = { name: "old-scene.jpg" };
  s.sceneMode = "text";
  s.sceneText = "夜晚的城市街角";
  const r = buildRequest(s);
  assert(!r.assets.some((a) => a.role === "scene"));
  assert.match(r.compiledBasePrompt, /夜晚的城市街角/);
  assert(!r.compiledBasePrompt.includes("柔光浅色摄影棚"));
  s.sceneMode = "image";
  assert(buildRequest(s).assets.some((a) => a.role === "scene"));
});
test("invalid required inputs prevent request construction", () => {
  const s = base();
  delete s.assets.person;
  assert(validateForm(s).length);
  assert.throws(() => buildRequest(s));
  const t = base();
  t.sceneMode = "image";
  assert.throws(() => buildRequest(t));
  t.sceneMode = "text";
  assert.throws(() => buildRequest(t));
});
test("inspiration is explicit pending planner input, no fake fusion or Lite fallback", () => {
  const s = base();
  s.inspiration = "在街边转身，不要行走";
  const r = buildRequest(s);
  assert.equal(r.authorInspiration, s.inspiration);
  assert(!r.compiledBasePrompt.includes(s.inspiration));
  assert.equal(r.planningStatus, "requires-multimodal-planner");
  assert.equal(r.planningModelPolicy.allowLite, false);
  assert.equal(r.planningModelPolicy.allowSilentDowngrade, false);
});
