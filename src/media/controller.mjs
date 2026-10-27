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
    const source = figure.querySelector('source');
    // The GIF stays available as the fallback when a browser cannot play VP9
    const gif = image ? { animation: image.getAttribute('src'), poster: source?.getAttribute('srcset') } : null;
    const projectVideo = Boolean(video?.hasAttribute('data-project-video') && image);
    const videoSource = projectVideo ? video.getAttribute('src') : null;
    const canPlayProjectVideo = Boolean(projectVideo && videoSource && typeof video.canPlayType === 'function'
      && video.canPlayType('video/webm; codecs="vp9"'));
    const rect = observer ? figure.getBoundingClientRect() : null;
    let inView = !rect || (rect.bottom > 0 && rect.top < browser.innerHeight && rect.right > 0 && rect.left < browser.innerWidth);
    let requested = !preference.matches;
    let active = true;
    let optimized = canPlayProjectVideo;
    let playPending = false;
    let playbackGeneration = 0;

    // Plain videos keep the loop control and pause at their current frame
    const plainVideo = Boolean(video && !projectVideo);
    const paused = () => plainVideo ? video.paused
      : optimized ? video.hidden
        : image.getAttribute('src') !== gif.animation;
    const render = () => {
      // Labels follow visible playback, including browsers that block autoplay
      button.textContent = plainVideo
        ? (paused() ? 'Play loop' : 'Pause loop')
        : (paused() ? 'Play animation' : 'Stop animation');
    };
    const showPoster = () => {
      if (picture) picture.hidden = false;
      if (image && gif.poster && image.getAttribute('src') !== gif.poster) image.setAttribute('src', gif.poster);
    };
    const releaseProjectVideo = () => {
      // Invalidating the request prevents a late play result from revealing released media
      playbackGeneration++;
      playPending = false;
      video.hidden = true;
      if (picture) picture.hidden = false;
      video.pause();
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
    };
    const pause = () => {
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
      try {
        if (plainVideo) {
          video.muted = true;
          await video.play();
        } else if (optimized) {
          // Visibility notifications can repeat while a preview is already playing
          if (playPending || (!video.paused && !video.hidden)) {
            render();
            return;
          }
          // A released preview gets a fresh resource and restarts like the GIF
          if (!video.hasAttribute('src')) {
            video.setAttribute('src', videoSource);
            video.load();
          }
          video.hidden = true;
          video.muted = true;

          const generation = ++playbackGeneration;
          playPending = true;
          try {
            await video.play();
          } catch {
            // A rejected play request stays retryable from the visible button
            if (generation === playbackGeneration) playPending = false;
            render();
            return;
          }

          if (generation !== playbackGeneration) {
            render();
            return;
          }
          playPending = false;
          // The GIF remains visible until playback has really started
          if (active && requested && inView && !document.hidden && optimized && !video.paused) {
            if (picture) picture.hidden = true;
            video.hidden = false;
          }
        } else if (paused()) image.setAttribute('src', gif.animation);

        // Pending play requests cannot restart media after a visibility transition or disposal
        if (!active || !requested || !inView || document.hidden) pause();
        render();
      } catch {
        render();
      }
    };
    const toggle = () => { requested = paused(); void sync(); };
    const failedImage = () => { requested = false; pause(); };
    const failedProjectVideo = () => {
      // Decode failures fall back to the original GIF with its normal controls
      if (!optimized || !video.hasAttribute('src')) return;
      optimized = false;
      releaseProjectVideo();
      void sync();
    };

    if (video) {
      video.addEventListener('play', render);
      video.addEventListener('pause', render);
      if (projectVideo) {
        video.hidden = true;
        if (optimized) showPoster();
        else releaseProjectVideo();
        video.addEventListener('error', failedProjectVideo);
      }
    }
    if (image) {
      image.addEventListener('error', failedImage);
      // Keep the browser from selecting the motion-sensitive source after JS takes control
      if (source) source.media = 'not all';
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
          video.removeEventListener('play', render);
          video.removeEventListener('pause', render);
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
