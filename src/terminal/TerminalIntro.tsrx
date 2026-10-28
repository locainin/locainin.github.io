import { effect, track } from 'ripple';
import { frameAt, intro, timing } from './sequence.mjs';
import { runCommand } from './commands.mjs';
import { startSessionClock } from './clock.mjs';
import { trainAt } from './train.mjs';
import { asciiName } from './identity.mjs';
import { createCommandHistory } from './history.mjs';

export function TerminalIntro({ animate = false, interactive = false }: { animate?: boolean; interactive?: boolean }) @{
  const elapsed = track(0);
  const mode = track(animate ? 'loop' : 'prompt');
  // Keep the prerendered introduction until the first character is ready to paint
  const frame = track(() => mode.value === 'prompt' || elapsed.value < timing.character
    ? frameAt(timing.aboutReady) : frameAt(elapsed.value));
  const line = track('');
  const response = track<ReturnType<typeof runCommand>>(null);
  const cleared = track(false);

  const history = createCommandHistory();
  let terminal: HTMLDivElement;
  let focusPromptOnMount = false;

  const showPrompt = (focus = false) => {
    focusPromptOnMount = focus;
    mode.value = 'prompt';
  };
  const mountPrompt = (input: HTMLInputElement) => {
    // Focus follows an explicit Stop or a completed command, never the first page load
    if (focusPromptOnMount) input.focus({ preventScroll: true });
    focusPromptOnMount = false;
  };
  const clearScreen = () => {
    // Screen contents and command history have separate lifetimes
    cleared.value = true;
    response.value = null;
  };
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    history.record(line.value);
    const result = runCommand(line.value);
    line.value = '';
    if (!result) return;
    if (result.action === 'clear') clearScreen();
    else if (result.action === 'navigate') window.location.assign(result.href);
    else if (result.action === 'train') {
      // The command field is replaced during the train and restored when it ends
      terminal.focus({ preventScroll: true });
      response.value = null;
      elapsed.value = timing.trainStart;
      mode.value = 'train';
    } else response.value = result;
  };
  const browseHistory = (event: KeyboardEvent) => {
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      clearScreen();
      return;
    }
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    line.value = event.key === 'ArrowUp' ? history.previous(line.value) : history.next(line.value);
  };
  const togglePlayback = () => {
    response.value = null;
    if (mode.value !== 'prompt') showPrompt(true);
    else {
      line.value = '';
      cleared.value = false;
      elapsed.value = 0;
      mode.value = 'loop';
    }
  };

  if (interactive) {
    effect(() => {
      if (mode.value === 'prompt') return;
      return startSessionClock(window, (delta) => {
        elapsed.value += delta;
        // A typed sl runs once while the automatic introduction keeps looping
        if (mode.value === 'train' && elapsed.value >= timing.trainEnd) showPrompt(document.activeElement === terminal);
      });
    });
    effect(() => {
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const changed = (event: MediaQueryListEvent) => {
        if (!event.matches) return;
        showPrompt(mode.value === 'train' && document.activeElement === terminal);
      };
      preference.addEventListener('change', changed);
      return () => preference.removeEventListener('change', changed);
    });
  }

  <div class="terminal-window" tabindex="-1" data-mode={mode.value} ref={terminal}>
    <div class="terminal-titlebar">
      <span class="terminal-title"><span class="window-dots" aria-hidden="true"><i /><i /><i /></span>~</span>
      <div class="terminal-action">
        @if (interactive) {
          <button class="terminal-control terminal-playback" type="button" aria-label={mode.value === 'prompt' ? 'Play terminal animation' : 'Stop terminal animation'} onClick={togglePlayback}>{mode.value === 'prompt' ? 'Play' : 'Stop'}</button>
        }
      </div>
    </div>
    <div class="terminal-body" data-phase={frame.value.phase}>
      <h1 id="intro-title"><span class="sr-only">{intro.name}</span></h1>
      @if (frame.value.phase === 'train') {
        <div class="terminal-train" aria-hidden="true"><pre>{trainAt(frame.value.trainProgress)}</pre></div>
      } @else if (frame.value.phase === 'reset') {
        <div class="terminal-reset" aria-hidden="true"><span class="prompt-symbol">❯</span> <span class="resting-cursor">_</span></div>
      } @else {
        <div class="terminal-transcript">
          @if (!cleared.value || mode.value !== 'prompt') {
            <>
              <div class="terminal-command who-command" aria-hidden="true"><span class="prompt-symbol">❯</span><span class="command-text">{intro.command.slice(0, frame.value.command)}</span>@if (frame.value.command < intro.command.length) { <span class="terminal-cursor">_</span> }</div>
              <pre class="name-output typed-name" aria-hidden="true">{frame.value.name ? asciiName : ''}</pre>
              <div class="terminal-command about-command" aria-hidden="true" data-visible={String(frame.value.name === intro.name.length)}><span class="prompt-symbol">❯</span><span>{intro.aboutCommand.slice(0, frame.value.aboutCommand)}</span>@if (frame.value.name === intro.name.length && frame.value.aboutCommand < intro.aboutCommand.length) { <span class="terminal-cursor">_</span> }</div>
              <p class="about-output" hidden={Boolean(response.value)} data-visible={String(frame.value.showAbout)}>{intro.about}</p>
              @if (mode.value !== 'prompt') {
                <div class="terminal-command sl-command" aria-hidden="true" data-visible={String(frame.value.showAbout)}><span class="prompt-symbol">❯</span><span>{intro.slCommand.slice(0, frame.value.slCommand)}</span>@if (frame.value.slCommand < intro.slCommand.length) { <span class="terminal-cursor">_</span> }</div>
              }
            </>
          }
          @if (interactive && mode.value === 'prompt') {
            <>
              <div class="terminal-replies" aria-live="polite" aria-atomic="true">
                @if (response.value) {
                  <div class="terminal-response" data-format={response.value.format}>
                    <p>{response.value.text}</p>
                    @if (response.value.links.length) {
                      <div class="terminal-directory" data-format={response.value.format}>
                        @for (const link of response.value.links; key link.href) {
                          <a href={link.href}>{link.label}</a>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
              <form class="terminal-prompt" onSubmit={submit}>
                <span class="prompt-symbol" aria-hidden="true">❯</span>
                <div class="prompt-entry">
                  <input class="terminal-input" ref={(input: HTMLInputElement) => mountPrompt(input)} aria-label="Terminal command" placeholder=" " maxlength="80" autocomplete="off" autocapitalize="off" spellcheck={false} value={line.value} onInput={(event) => { line.value = event.currentTarget.value; }} onKeyDown={browseHistory} />
                  <span class="resting-cursor" aria-hidden="true">_</span>
                </div>
                <button class="prompt-submit" type="submit" aria-label="Run terminal command">↵</button>
              </form>
            </>
          } @else if (mode.value === 'prompt') {
            <div class="terminal-prompt" aria-hidden="true" data-visible="true"><span class="prompt-symbol">❯</span><span class="resting-cursor">_</span></div>
          }
        </div>
      }
    </div>
  </div>
}
