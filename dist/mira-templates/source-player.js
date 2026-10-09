// Play in the clicked card. Keep at most one embedded player mounted per page.
export function createSourcePlayer({ canOpen = () => true } = {}) {
  let active = null;
  function close({ restoreFocus = false } = {}) {
    if (!active) return;
    const { host, cover, resize } = active;
    resize.disconnect();
    host.replaceWith(cover);
    host.replaceChildren(); // Dispose the iframe even if its card was removed.
    active = null;
    if (restoreFocus && cover.isConnected) cover.focus();
  }
  return {
    close,
    open(candidate, cover) {
      if (!canOpen() || !candidate || !cover?.isConnected) return;
      const match = candidate.url?.match(/^https:\/\/www\.douyin\.com\/video\/(\d{19})$/);
      if (!match) return;
      close();
      const host = document.createElement('div');
      host.className = `${cover.className} source-player-inline`;
      host.setAttribute('role', 'group');
      host.setAttribute('aria-label', `${candidate.creator}的卡片播放器`);
      const frame = document.createElement('iframe');
      frame.src = `https://open.douyin.com/player/video?vid=${match[1]}&autoplay=1`;
      frame.title = `${candidate.creator} · 原片播放器`;
      frame.allow = 'autoplay; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      const stop = document.createElement('button');
      stop.type = 'button';
      stop.className = 'source-player-stop';
      stop.textContent = '×';
      stop.setAttribute('aria-label', '停止播放并恢复封面');
      stop.onclick = () => close({ restoreFocus: true });
      host.append(frame, stop);
      cover.replaceWith(host);
      // The official embed has a minimum internal portrait layout. Scale its
      // viewport as a whole so a short card does not crop the video/controls.
      const resize = new ResizeObserver(() => {
        const scale = Math.min(host.clientWidth / 360, host.clientHeight / 720);
        frame.style.transform = `translateX(-50%) scale(${scale})`;
      });
      resize.observe(host);
      active = { host, cover, resize };
    }
  };
}
