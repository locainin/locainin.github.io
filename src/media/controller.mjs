export function initMedia(document, browser) {
  const preference = browser.matchMedia('(prefers-reduced-motion: reduce)');
  const players = new Map();
  // One observer handles every player and does no work between viewport changes
  const observer = typeof browser.IntersectionObserver === 'function'
    ? new browser.IntersectionObserver((entries) => {
      for (const entry of entries) players.get(entry.target)?.visibility(entry.isIntersecting);
    }) : null;

  for (const figure of document.querySelectorAll('[data-media-loop]')) {
    const video = figure.querySelector('video');
    const picture = figure.querySelector('picture');
    const image = figure.querySelector('img');
    const button = figure.querySelector('[data-loop-toggle]');
    const sources = picture ? picture.querySelectorAll('source') : [];
    // The GIF stays available as the fallback when a browser cannot play VP9
    const gif = image ? { animation: image.getAttribute('src'), poster: sources[0]?.getAttribute('srcset') } : null;
    const projectVideo = Boolean(video?.hasAttribute('data-project-video') && image);
    const videoSource = projectVideo ? video.getAttribute('src') : null;
    const canPlayProjectVideo = Boolean(projectVideo && videoSource && typeof video.canPlayType === 'function'
      && video.canPlayType(video.getAttribute('data-video-type') ?? ''));
    const rect = observer ? figure.getBoundingClientRect() : null;
    let inView = !rect || (rect.bottom > 0 && rect.top < browser.innerHeight && rect.right > 0 && rect.left < browser.innerWidth);
    let requested = !preference.matches;
    let active = true;
    let optimized = canPlayProjectVideo;
    let state = 'stopped';
    let firstFrameCallback = null;
    let playbackGeneration = 0;

    // Plain videos keep the loop control and pause at their current frame
    const plainVideo = Boolean(video && !projectVideo);
    const render = () => {
      // Loading remains cancellable even while the poster is still covering the video
      const running = state === 'loading' || state === 'playing';
      button.textContent = plainVideo
        ? (running ? 'Pause loop' : 'Play loop')
        : (running ? 'Stop animation' : 'Play animation');
    };
    const showPoster = () => {
      if (picture) picture.hidden = false;
      if (image && gif.poster && image.getAttribute('src') !== gif.poster) image.setAttribute('src', gif.poster);
    };
    const invalidatePlayback = () => {
      // A stopped or replaced startup must never reveal a late decoded frame
      playbackGeneration++;
      if (firstFrameCallback !== null) {
        video.cancelVideoFrameCallback(firstFrameCallback);
        firstFrameCallback = null;
      }
    };
    const releaseProjectVideo = () => {
      video.hidden = true;
      video.pause();
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
    };
    const pause = () => {
      invalidatePlayback();
      state = 'stopped';
      if (plainVideo) video.pause();
      else {
        // Removing the source releases the preview while its still poster is visible
        if (projectVideo) releaseProjectVideo();
        showPoster();
      }
      render();
    };
    const sync = async () => {
      if (!active || !requested || !inView || document.hidden) {
        pause();
        return;
      }
      // Repeated observer notifications share the current startup or playback
      if (state === 'loading' || state === 'playing') return;
      if (!plainVideo && !optimized) {
        image.setAttribute('src', gif.animation);
        state = 'playing';
        render();
        return;
      }

      const generation = ++playbackGeneration;
      state = 'loading';
      render();
      if (optimized) {
        // The grid keeps the poster above a renderable video during startup
        showPoster();
        video.hidden = false;
        if (!video.hasAttribute('src')) {
          video.setAttribute('src', videoSource);
          video.load();
        }
        if (typeof video.requestVideoFrameCallback === 'function'
            && typeof video.cancelVideoFrameCallback === 'function') {
          firstFrameCallback = video.requestVideoFrameCallback(() => {
            if (generation !== playbackGeneration || state !== 'loading') return;
            firstFrameCallback = null;
            picture.hidden = true;
            state = 'playing';
            render();
          });
        }
      }
      video.muted = true;
      try {
        await video.play();
        if (generation !== playbackGeneration) return;
        // Older browsers hand off after playback starts instead of a frame callback
        if (!optimized || firstFrameCallback === null) {
          if (optimized) picture.hidden = true;
          state = 'playing';
          render();
        }
      } catch {
        if (generation !== playbackGeneration) return;
        pause();
        // A blocked request remains retryable rather than acting like a manual stop
        state = 'blocked';
        render();
      }
    };
    const toggle = () => {
      requested = state !== 'loading' && state !== 'playing';
      void sync();
    };
    const failedImage = () => {
      // A broken poster must not stop a video that can still play
      if (image.getAttribute('src') === gif.animation) { requested = false; pause(); }
    };
    const failedProjectVideo = () => {
      // Decode failures fall back to the original GIF with its normal controls
      if (!optimized || !video.hasAttribute('src')) return;
      optimized = false;
      pause();
      void sync();
    };
    const interrupted = () => {
      // Native playback can pause independently when the browser interrupts media
      // Ignore queued pause events from a source that has already been restarted
      if (!video.paused || (state !== 'loading' && state !== 'playing')) return;
      pause();
      state = 'blocked';
      render();
    };

    if (video) {
      video.addEventListener('pause', interrupted);
      if (projectVideo) {
        video.hidden = true;
        if (!optimized) releaseProjectVideo();
        video.addEventListener('error', failedProjectVideo);
      }
    }
    if (image) {
      image.addEventListener('error', failedImage);
      // Select the poster before releasing sources so the GIF does not start by accident
      showPoster();
      for (const source of sources) source.media = 'not all';
    }
    button.addEventListener('click', toggle);
    button.hidden = false;
    // Keep native playback available until the custom control has been installed
    if (plainVideo) video.controls = false;
    render();
    void sync();

    players.set(figure, {
      sync,
      visibility(visible) { inView = visible; void sync(); },
      preferenceChanged() {
        if (preference.matches) { requested = false; void sync(); }
      },
      dispose() {
        active = false;
        pause();
        if (video) {
          video.removeEventListener('pause', interrupted);
          if (projectVideo) video.removeEventListener('error', failedProjectVideo);
        }
        if (image) image.removeEventListener('error', failedImage);
        button.removeEventListener('click', toggle);
        // Native controls remain usable if the custom player is removed
        if (plainVideo) {
          video.controls = true;
          button.hidden = true;
        }
      },
    });
    observer?.observe(figure);
  }

  // Shared page listeners preserve each player's independent manual pause state
  const visibility = () => { for (const player of players.values()) void player.sync(); };
  const changed = () => { for (const player of players.values()) player.preferenceChanged(); };
  document.addEventListener('visibilitychange', visibility);
  preference.addEventListener('change', changed);
  return () => {
    observer?.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    preference.removeEventListener('change', changed);
    for (const player of players.values()) player.dispose();
    players.clear();
  };
}
