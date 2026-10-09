import {
  candidates as initialCandidates,
  statusLabels,
  canManage,
  makeAnalysisRequest,
} from "./candidates.js";
import { readSelections, mergeCandidates, candidateInstruction, CREATOR_SELECTION_KEY } from './creator-store.js';
let creatorCatalog = [];
try {
  const response = await fetch('./creators.json');
  if (response.ok) creatorCatalog = await response.json();
} catch {}
let candidates = mergeCandidates(creatorCatalog, readSelections(), initialCandidates);
const $ = (s) => document.querySelector(s);
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let records = {};
try {
  const value = JSON.parse(localStorage.getItem("mira-admin-candidates-v1"));
  if (value && typeof value === "object" && !Array.isArray(value))
    records = value;
} catch {}
let filter = "all",
  activeId = null,
  lastRequest = null,
  timer;
const record = (id) => records[id] || { status: "pending" };
const role = () => $("#role").value;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function persist() {
  try {
    localStorage.setItem("mira-admin-candidates-v1", JSON.stringify(records));
  } catch {
    toast("存储不可用，修改仅保留在本页。");
  }
}
function render() {
  candidates = mergeCandidates(creatorCatalog, readSelections(), initialCandidates);
  const allowed = canManage(role());
  $("#access-denied").hidden = allowed;
  $("#admin-workspace").hidden = !allowed;
  if (!allowed) return;
  const q = $("#candidate-search").value.trim().toLowerCase(),
    platform = $("#candidate-platform").value;
  const visible = candidates.filter(
    (c) =>
      (filter === "all" || record(c.id).status === filter) &&
      (platform === "all" || platform === c.platform) &&
      `${c.title} ${c.creator}`.toLowerCase().includes(q),
  );
  $("#candidate-count").textContent = `${visible.length} 条候选`;
  $("#candidate-empty").hidden = visible.length > 0;
  $("#candidate-grid").innerHTML = visible
    .map(
      (c, i) =>
        `<article class="candidate-card"><a class="candidate-cover" href="${c.url}" target="_blank" rel="noopener noreferrer" aria-label="观看${escape(c.title)}原视频">${c.poster ? `<img src="${c.poster}" alt="${escape(c.title)}原片截图">` : `<strong>${["↻", "✦", "▧"][i % 3]} ${escape(c.title.split(" · ")[0])}</strong>`}<small>${c.poster ? "原片截图 · 看视频" : "文字线索 · 暂无核验封面"} ↗</small></a><div class="candidate-copy"><div class="candidate-meta"><span>抖音 · ${escape(c.creator)}</span><span>${statusLabels[record(c.id).status] || "待筛选"}</span></div><h2>${escape(c.title)}</h2><p>${escape(c.note)}</p><small>${escape(c.evidence)} · 热度待核验</small><div class="candidate-actions"><a class="source-link" href="${c.url}" target="_blank" rel="noopener noreferrer">看原视频 ↗</a><button class="text-button" data-defer="${c.id}">${record(c.id).status === "deferred" ? "恢复候选" : "暂不做"}</button><button class="primary" data-select="${c.id}">${["selected", "request"].includes(record(c.id).status) ? "修改拆解要求" : "愿意做这个 →"}</button></div></div></article>`,
    )
    .join("");
  document
    .querySelectorAll("[data-select]")
    .forEach((b) => (b.onclick = () => openAnalysis(b.dataset.select)));
  document.querySelectorAll("[data-defer]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!canManage(role())) return;
        const id = b.dataset.defer;
        records[id] = {
          ...record(id),
          status: record(id).status === "deferred" ? "pending" : "deferred",
        };
        persist();
        render();
      }),
  );
}
function openAnalysis(id) {
  if (!canManage(role())) return;
  const c = candidates.find((c) => c.id === id);
  if (!c) return;
  activeId = id;
  lastRequest = null;
  $("#analysis-title").textContent = c.title;
  $("#analysis-source").href = c.url;
  $("#analysis-instruction").value =
    candidateInstruction(c, record(id));
  $("#analysis-result").hidden = true;
  $("#analysis-dialog").showModal();
}
$("#save-selection").onclick = () => {
  if (!canManage(role()) || !activeId) return;
  records[activeId] = {
    status: "selected",
    instruction: $("#analysis-instruction").value.trim(),
    updatedAt: new Date().toISOString(),
  };
  persist();
  render();
  $("#analysis-dialog").close();
  toast("已选中并保存拆解要求。尚未调用模型。");
};
$("#prepare-analysis").onclick = () => {
  if (!activeId || !canManage(role())) return;
  lastRequest = makeAnalysisRequest(
    candidates.find((c) => c.id === activeId),
    $("#analysis-instruction").value,
    role(),
  );
  records[activeId] = {
    status: "request",
    instruction: lastRequest.operatorInstruction,
    request: lastRequest,
    updatedAt: new Date().toISOString(),
  };
  persist();
  render();
  $("#analysis-payload").textContent = JSON.stringify(lastRequest, null, 2);
  $("#analysis-result").hidden = false;
  $("#analysis-result").scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
};
$("#analysis-instruction").oninput = () => {
  lastRequest = null;
  $("#analysis-result").hidden = true;
};
$("#download-analysis").onclick = () => {
  if (!lastRequest || !canManage(role())) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(lastRequest, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `mira-analysis-${activeId}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("#close-analysis").onclick = () => $("#analysis-dialog").close();
$("#role").onchange = () => {
  $("#analysis-dialog").close();
  activeId = null;
  lastRequest = null;
  render();
};
$("#candidate-search").oninput = render;
$("#candidate-platform").onchange = render;
document.querySelectorAll("[data-status]").forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.status;
      document
        .querySelectorAll("[data-status]")
        .forEach((x) => x.classList.toggle("active", x === b));
      render();
    }),
);
render();
window.addEventListener('storage', (event) => {
  if (event.key === CREATOR_SELECTION_KEY) render();
});
