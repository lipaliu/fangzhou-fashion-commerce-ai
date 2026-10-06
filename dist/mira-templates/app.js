import { template, styles, validateForm, buildRequest } from "./template.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast("浏览器存储不可用，本次内容暂留在页面中。");
  }
};
let favorites = read("mira-template-favorites", []),
  drafts = read("mira-template-drafts", []);
if (!Array.isArray(favorites)) favorites = [];
if (!Array.isArray(drafts)) drafts = [];
const state = {
  assets: {},
  extras: new Set(),
  sceneMode: "default",
  sceneText: "",
  inspiration: "",
  style: "跟随模板",
  action: "跟随模板",
  duration: 10,
  ratio: "9:16",
  quality: "1080p",
};
let filter = "all",
  tab = "daily",
  lastRequest = null,
  toastTimer,
  mediaAvailable = false;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const roleLabels = {
  outfit: "衣服",
  person: "人物",
  scene: "场景",
  hair: "发型",
  bag: "包包",
  shoes: "鞋子",
  accessory: "配饰",
};
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}
function renderCards() {
  const q = $("#search").value.trim().toLowerCase();
  const matches =
    (filter === "all" || filter === "douyin") &&
    (!q ||
      ["悬浮搭配", "穿搭", "上身", "小椰爆爆", "悬浮", "快切"].some((x) =>
        x.includes(q),
      )) &&
    (tab !== "saved" || favorites.includes(template.id));
  $("#saved-count").textContent = favorites.length;
  $("#template-grid").hidden = !matches;
  $("#empty-state").hidden = matches;
  $("#empty-copy").textContent =
    tab === "saved"
      ? "点模板卡片上的爱心，把喜欢的玩法留在这里。"
      : filter !== "all" && filter !== "douyin"
        ? "该平台尚未接入。这份提案使用你提供的抖音作品作为示例。"
        : "没有找到匹配的玩法，试试“悬浮搭配”。";
  if (!matches) return;
  $("#template-grid").innerHTML =
    `<article class="template-card"><button class="cover-button" data-preview aria-label="预览悬浮搭配效果"><img src="${template.poster}" alt="目标衣服与靴子在人物附近悬浮"><span class="cover-pill">本期示例 · 悬浮特效</span><span class="cover-platform">抖音 · 小椰爆爆🥥</span><span class="play-button">▶</span></button><div class="card-copy"><div class="card-title-row"><h2>悬浮搭配</h2><button class="icon-button ${favorites.includes(template.id) ? "saved" : ""}" id="favorite" aria-label="收藏悬浮搭配" aria-pressed="${favorites.includes(template.id)}">${favorites.includes(template.id) ? "♥" : "♡"}</button></div><p>单品悬浮上身，接一组穿搭快切。</p><div class="card-footer"><small>可换衣服 / 人物 / 场景</small><button data-make>做同款 →</button></div></div></article><aside class="intro-card"><small>MAKE IT YOURS</small><div class="big-star">✳</div><div><h2>看中了这个效果，<br>接下来，换你来演。</h2><p>换上自己的搭配与人物，<br>把场景搬到你想去的地方。<br>一套完整玩法，一条你的新视频。</p></div></aside>`;
  $$("[data-preview]").forEach((b) => (b.onclick = openPreview));
  $$("[data-make]").forEach((b) => (b.onclick = startCreate));
  $("#favorite").onclick = () => {
    favorites = favorites.includes(template.id)
      ? favorites.filter((x) => x !== template.id)
      : [template.id];
    save("mira-template-favorites", favorites);
    renderCards();
  };
}
function mediaMarkup() {
  return mediaAvailable
    ? `<video controls playsinline preload="metadata" poster="${template.poster}" aria-label="原作者示例视频首轮"><source src="${template.media}" type="video/mp4"></video><span class="media-label">原片参考 · 首轮节选</span>`
    : `<div class="media-fallback"><img src="${template.poster}" alt="悬浮搭配原片参考"><a href="${template.sourceUrl}" target="_blank" rel="noopener noreferrer">打开原作者视频 ↗</a></div>`;
}
function openPreview() {
  $("#modal-media").innerHTML = mediaMarkup();
  $("#modal-source").href = template.sourceUrl;
  $("#preview-dialog").showModal();
}
function startCreate() {
  if ($("#preview-dialog").open) $("#preview-dialog").close();
  location.hash = "create";
  route();
}
function pauseMedia(root = document) {
  root.querySelectorAll("video").forEach((v) => v.pause());
}
function route() {
  pauseMedia();
  let hash = location.hash.slice(1) || "discover";
  if (!["discover", "saved", "create", "drafts"].includes(hash))
    hash = "discover";
  $("#discover-page").hidden = !["discover", "saved"].includes(hash);
  $("#create-page").hidden = hash !== "create";
  $("#drafts-page").hidden = hash !== "drafts";
  $$(".nav-item").forEach((a) =>
    a.classList.toggle(
      "active",
      a.id ===
        { discover: "nav-discover", saved: "nav-saved", drafts: "nav-drafts" }[
          hash
        ],
    ),
  );
  $("#breadcrumb").textContent =
    hash === "create"
      ? "爆款模板 / 悬浮搭配 / 做同款"
      : hash === "drafts"
        ? "创作空间 / 制作草稿"
        : "创作空间 / 爆款模板";
  if (hash === "saved") {
    tab = "saved";
    updateTabs();
    renderCards();
  }
  if (hash === "discover" && tab === "saved") {
    tab = "daily";
    updateTabs();
    renderCards();
  }
  if (hash === "create") {
    $("#reference-video").innerHTML = mediaMarkup();
    $("#create-source").href = template.sourceUrl;
  }
  if (hash === "drafts") renderDrafts();
  window.scrollTo(0, 0);
}
function updateTabs() {
  $$("[data-tab]").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === tab),
  );
}
$$("[data-tab]").forEach(
  (b) =>
    (b.onclick = () => {
      tab = b.dataset.tab;
      updateTabs();
      renderCards();
    }),
);
$$("[data-platform]").forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.platform;
      $$("[data-platform]").forEach((x) =>
        x.classList.toggle("active", x === b),
      );
      renderCards();
    }),
);
$("#search").oninput = renderCards;
$("#reset-filters").onclick = () => {
  filter = "all";
  tab = "all";
  $("#search").value = "";
  $$("[data-platform]").forEach((b) =>
    b.classList.toggle("active", b.dataset.platform === "all"),
  );
  updateTabs();
  renderCards();
};
$("#how-button").onclick = () => $("#how-dialog").showModal();
$("#make-same").onclick = startCreate;
$("#reopen-preview").onclick = openPreview;
$("#back-to-templates").onclick = () => {
  location.hash = "discover";
};
$$("[data-close]").forEach(
  (b) => (b.onclick = () => b.closest("dialog").close()),
);
$$("dialog").forEach((d) => {
  d.addEventListener("close", () => pauseMedia(d));
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  });
});
function displayAsset(slot) {
  const card = document
      .querySelector(`[data-slot="${slot}"]`)
      .closest(".upload-card"),
    a = state.assets[slot];
  card.querySelector(".upload-placeholder").hidden = !!a;
  const preview = card.querySelector(".asset-preview");
  preview.hidden = !a;
  if (a) {
    preview.innerHTML = `<img src="${escape(a.url)}" alt="${roleLabels[slot]}参考缩略图"><div><strong>${escape(a.name)}</strong><small>${a.origin === "sample" ? "示例素材" : "仅在本页使用，尚未上传"}</small><span>点击替换图片</span></div>`;
  }
}
async function upload(input) {
  const file = input.files[0],
    slot = input.dataset.slot;
  if (!file) return;
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 20 * 1024 * 1024
  ) {
    input.value = "";
    toast("请选择不超过 20 MB 的 JPG、PNG 或 WebP 图片。");
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
  } catch {
    URL.revokeObjectURL(url);
    input.value = "";
    toast("无法读取这张图片，请换一张试试。");
    return;
  }
  if (state.assets[slot]?.origin === "upload")
    URL.revokeObjectURL(state.assets[slot].url);
  state.assets[slot] = { name: file.name, url, origin: "upload", file };
  displayAsset(slot);
  $("#form-error").hidden = true;
}
function bindInputs() {
  $$("[data-slot]").forEach((input) => {
    input.onchange = () => upload(input);
  });
}
bindInputs();
$$("[data-sample]").forEach(
  (b) =>
    (b.onclick = () => {
      const slot = b.dataset.sample;
      if (state.assets[slot]?.origin === "upload")
        URL.revokeObjectURL(state.assets[slot].url);
      state.assets[slot] =
        slot === "outfit"
          ? {
              name: "示例 · 黑色套装与完整搭配",
              url: "assets/outfit.jpg",
              origin: "sample",
            }
          : {
              name: "示例 · 人物参考",
              url: "../assets/fashion-model.png",
              origin: "sample",
            };
      displayAsset(slot);
      $("#form-error").hidden = true;
    }),
);
function addExtra(slot) {
  if (state.extras.has(slot)) return;
  state.extras.add(slot);
  const target = slot === "hair" ? $("#person-extras") : $("#outfit-extras");
  const block = document.createElement("div");
  block.className = "extra-slot";
  block.dataset.extraSlot = slot;
  block.innerHTML = `<header><strong>单独指定${roleLabels[slot]}</strong><button type="button" data-remove="${slot}">移除</button></header><label class="upload-card compact"><input type="file" accept="image/jpeg,image/png,image/webp" data-slot="${slot}" aria-label="上传${roleLabels[slot]}参考图"><div class="upload-placeholder"><strong>＋ 上传${roleLabels[slot]}参考图</strong><small>${slot === "hair" ? "只提取发型，不采用图中人脸" : "该类别以此图为准"}</small></div><div class="asset-preview" hidden></div></label>`;
  target.append(block);
  block.querySelector("[data-remove]").onclick = () => {
    if (state.assets[slot]?.origin === "upload")
      URL.revokeObjectURL(state.assets[slot].url);
    delete state.assets[slot];
    state.extras.delete(slot);
    block.remove();
  };
  bindInputs();
}
$$("[data-extra]").forEach(
  (b) => (b.onclick = () => addExtra(b.dataset.extra)),
);
$$("[data-scene]").forEach(
  (b) =>
    (b.onclick = () => {
      state.sceneMode = b.dataset.scene;
      $$("[data-scene]").forEach((x) => x.classList.toggle("active", x === b));
      ["default", "text", "image"].forEach(
        (k) => ($("#scene-" + k).hidden = k !== state.sceneMode),
      );
    }),
);
$("#style-options").innerHTML = Object.keys(styles)
  .map(
    (s) =>
      `<button type="button" data-style="${s}" class="${s === state.style ? "active" : ""}">${s}</button>`,
  )
  .join("");
$$("[data-style]").forEach(
  (b) =>
    (b.onclick = () => {
      state.style = b.dataset.style;
      $$("[data-style]").forEach((x) => x.classList.toggle("active", x === b));
    }),
);
$$("[data-action]").forEach(
  (b) =>
    (b.onclick = () => {
      state.action = b.dataset.action;
      $$("[data-action]").forEach((x) => x.classList.toggle("active", x === b));
    }),
);
["duration", "ratio", "quality"].forEach(
  (k) =>
    ($("#" + k).onchange = () => {
      state[k] = $("#" + k).value;
      $("#output-summary").textContent =
        `${state.duration} 秒 · ${state.ratio} · ${state.quality}`;
    }),
);
function showRequest(request) {
  lastRequest = request;
  $("#result-summary").innerHTML = [
    template.title,
    `${request.output.durationSeconds} 秒`,
    request.output.ratio,
    request.style,
    `${request.assets.length} 份参考`,
    "一条完整视频",
  ]
    .map((x) => `<span>${escape(x)}</span>`)
    .join("");
  $("#result-phases").innerHTML = request.internalStructure
    .map(
      (p) =>
        `<div><small>${p.from}–${p.to} 秒 · 同一条视频</small><strong>${p.title}</strong><p>${p.description}</p></div>`,
    )
    .join("");
  $("#result-prompt").textContent =
    request.compiledBasePrompt +
    (request.authorInspiration
      ? "\n\n【作者灵感 · 待编排模型融合】\n" + request.authorInspiration
      : "") +
    "\n\n注意：这是基础要求预览。真实生成前需完成图片识别、作者灵感融合与具体分镜编排。";
  $("#result-dialog").showModal();
}
$("#create-form").onsubmit = (e) => {
  e.preventDefault();
  state.sceneText = $("#scene-description").value;
  state.inspiration = $("#inspiration").value;
  const errors = validateForm(state);
  if (errors.length) {
    $("#form-error").textContent = errors.join(" ");
    $("#form-error").hidden = false;
    $("#form-error").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  $("#form-error").hidden = true;
  const request = buildRequest(state);
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    request,
  };
  drafts = [entry, ...drafts].slice(0, 20);
  save("mira-template-drafts", drafts);
  showRequest(request);
};
$("#continue-edit").onclick = () => $("#result-dialog").close();
$("#download-brief").onclick = () => {
  if (!lastRequest) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(lastRequest, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "mira-floating-outfit-brief.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function renderDrafts() {
  const el = $("#drafts-list");
  if (!drafts.length) {
    el.innerHTML =
      '<div class="empty-state"><span>◷</span><h2>还没有制作草稿</h2><p>从一个喜欢的玩法开始。</p><a href="#discover" class="secondary">去选模板 →</a></div>';
    return;
  }
  el.innerHTML = drafts
    .map(
      (d, i) =>
        `<article class="draft-row"><div><h2>悬浮搭配 · 制作方案</h2><p>${escape(new Date(d.createdAt).toLocaleString("zh-CN"))} · ${d.request.output.durationSeconds} 秒 · ${escape(d.request.output.ratio)} · 预览草稿</p></div><button class="secondary" data-draft="${i}">查看方案 ↗</button></article>`,
    )
    .join("");
  $$("[data-draft]").forEach(
    (b) =>
      (b.onclick = () => showRequest(drafts[Number(b.dataset.draft)].request)),
  );
}
window.addEventListener("hashchange", route);
renderCards();
route();
// Optional local reference clip is excluded from the public repository.
fetch(template.media, { method: "HEAD" })
  .then((r) => {
    mediaAvailable =
      r.ok && (r.headers.get("content-type") || "").includes("video");
    if (location.hash === "#create")
      $("#reference-video").innerHTML = mediaMarkup();
  })
  .catch(() => {});
