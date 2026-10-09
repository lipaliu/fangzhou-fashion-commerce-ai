// Official Douyin iframe player. Create one on demand; remove it on close to stop audio.
export function createSourcePlayer({ canOpen = () => true, onSelect } = {}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'source-player-dialog';
  dialog.setAttribute('aria-label', '原片播放器');
  dialog.innerHTML = `<button type="button" class="close-button" aria-label="关闭播放器">×</button>
    <div class="source-player-layout"><div class="source-player-screen"></div>
    <div class="source-player-info"><span class="eyebrow">SOURCE VIDEO</span><h2></h2><p class="source-player-caption"></p>
    <p class="source-player-help">点击画面播放，可暂停、拖动进度或全屏观看。</p>
    <button type="button" class="primary source-player-select">选为玩法候选 →</button>
    <div class="source-player-links"><button type="button" class="text-button source-player-retry">重新加载</button><a target="_blank" rel="noopener noreferrer" class="source-link">抖音原片 ↗</a></div>
    <p class="field-help">若原片无法加载，可重新加载或打开抖音原片。</p></div></div>`;
  document.body.append(dialog);
  const screen = dialog.querySelector('.source-player-screen');
  const select = dialog.querySelector('.source-player-select');
  let current = null;
  function mount() {
    const match = current?.url?.match(/^https:\/\/www\.douyin\.com\/video\/(\d{19})$/);
    screen.replaceChildren();
    if (!match) { screen.textContent = '暂不支持此来源的页内播放。'; return; }
    const frame = document.createElement('iframe');
    frame.src = `https://open.douyin.com/player/video?vid=${match[1]}&autoplay=1`;
    frame.title = `${current.creator} · 原片播放器`;
    frame.allow = 'autoplay; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    screen.append(frame);
  }
  function close() { screen.replaceChildren(); dialog.close(); current = null; }
  dialog.querySelector('.close-button').onclick = close;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => { screen.replaceChildren(); current = null; });
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  dialog.querySelector('.source-player-retry').onclick = () => { if (canOpen()) mount(); };
  select.onclick = () => { if (!canOpen() || !current) return; const id = current.id; close(); onSelect?.(id); };
  return {
    close,
    open(candidate) {
      if (!canOpen() || !candidate) return;
      current = candidate;
      dialog.querySelector('h2').textContent = candidate.creator;
      dialog.querySelector('.source-player-caption').textContent = candidate.sourceTitle || candidate.title;
      dialog.querySelector('a').href = candidate.url;
      select.hidden = !onSelect;
      dialog.showModal();
      mount();
    }
  };
}
