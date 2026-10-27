import { effect, track } from 'ripple';
import { frameAt, intro, timing } from './sequence.mjs';
import { runCommand } from './commands.mjs';
import { startSessionClock } from './clock.mjs';
import { trainAt } from './train.mjs';
import { asciiName } from './identity.mjs';

export function TerminalIntro({ animate = false, interactive = false }: { animate?: boolean; interactive?: boolean }) @{
  const elapsed = track(0);
  const mode = track(animate ? 'running' : 'static');
  // Keep the prerendered introduction until the first character is ready to paint
  const frame = track(() => mode.value === 'static' || elapsed.value < timing.character
    ? frameAt(timing.aboutReady) : frameAt(elapsed.value));
  const line = track('');
  const response = track<ReturnType<typeof runCommand>>(null);

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const result = runCommand(line.value);
    line.value = '';
    if (result?.action === 'train') {
      const terminal = (event.currentTarget as HTMLElement).closest('.terminal-window') as HTMLElement;
      terminal.focus();
      response.value = null;
      elapsed.value = timing.trainStart;
      mode.value = 'running';
    } else response.value = result;
  };
  const skip = (event: MouseEvent) => {
    const terminal = (event.currentTarget as HTMLElement).closest('.terminal-window') as HTMLElement;
    terminal.focus();
    response.value = null;
    mode.value = 'static';
  };
  const restart = (event: MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    // Keep the keyboard position when the focused control is replaced
    if (document.activeElement === button) (button.closest('.terminal-window') as HTMLElement).focus();
    response.value = null;
    line.value = '';
    elapsed.value = 0;
    mode.value = 'running';
  };

  if (interactive) {
    effect(() => {
      if (mode.value !== 'running') return;
      return startSessionClock(window, (delta) => { elapsed.value += delta; });
    });
    effect(() => {
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const changed = (event: MediaQueryListEvent) => {
        if (!event.matches) return;
        const control = document.activeElement;
        // Preserve focus before reduced motion removes the animation controls
        if (control?.matches('.terminal-pause, .terminal-skip')) (control.closest('.terminal-window') as HTMLElement).focus();
        mode.value = 'static';
      };
      preference.addEventListener('change', changed);
      return () => preference.removeEventListener('change', changed);
    });
  }

  <div class="terminal-window" tabindex="-1">
    <div class="terminal-titlebar">
      <span class="terminal-title"><span class="window-dots" aria-hidden="true"><i /><i /><i /></span>~</span>
      <div class="terminal-action">
        @if (interactive) {
          <>
            @if (mode.value === 'static') {
              <button class="terminal-control terminal-run" type="button" onClick={restart}>Run session</button>
            } @else {
              <>
                <button class="terminal-control terminal-pause" type="button" aria-label={mode.value === 'paused' ? 'Resume terminal' : 'Pause terminal'} onClick={() => { mode.value = mode.value === 'paused' ? 'running' : 'paused'; }}>{mode.value === 'paused' ? 'Resume' : 'Pause'}</button>
                <button class="terminal-control terminal-skip" type="button" aria-label="Skip terminal animation" onClick={skip}>Skip <span aria-hidden="true">↳</span></button>
              </>
            }
          </>
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
          <div class="terminal-command who-command" aria-hidden="true"><span class="prompt-symbol">❯</span><span class="command-text">{intro.command.slice(0, frame.value.command)}</span>@if (frame.value.command < intro.command.length) { <span class="terminal-cursor">_</span> }</div>
          <pre class="name-output typed-name" aria-hidden="true">{frame.value.name ? asciiName : ''}</pre>
          <div class="terminal-command about-command" aria-hidden="true" data-visible={String(frame.value.name === intro.name.length)}><span class="prompt-symbol">❯</span><span>{intro.aboutCommand.slice(0, frame.value.aboutCommand)}</span>@if (frame.value.name === intro.name.length && frame.value.aboutCommand < intro.aboutCommand.length) { <span class="terminal-cursor">_</span> }</div>
          <p class="about-output" hidden={Boolean(response.value)} data-visible={String(frame.value.showAbout)}>{intro.about}</p>
          @if (mode.value !== 'static') {
            <div class="terminal-command sl-command" aria-hidden="true" data-visible={String(frame.value.showAbout)}><span class="prompt-symbol">❯</span><span>{intro.slCommand.slice(0, frame.value.slCommand)}</span>@if (frame.value.slCommand < intro.slCommand.length) { <span class="terminal-cursor">_</span> }</div>
          }
          @if (interactive && mode.value === 'static') {
            <>
              <div class="terminal-replies" aria-live="polite" aria-atomic="true">
                @if (response.value) {
                  <div class="terminal-response">
                    <p>{response.value.text}</p>
                    @if (response.value.links.length) {
                      <div class="terminal-directory">
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
                  <input class="terminal-input" aria-label="Optional terminal command" aria-describedby="terminal-help" placeholder="help" maxlength="80" autocomplete="off" autocapitalize="off" spellcheck={false} value={line.value} onInput={(event) => { line.value = event.currentTarget.value; }} />
                  <span class="resting-cursor" aria-hidden="true">_</span>
                </div>
                <span class="prompt-help" id="terminal-help">try help ↵</span>
                <button class="prompt-submit" type="submit" aria-label="Run terminal command">↵</button>
              </form>
            </>
          } @else if (mode.value === 'static') {
            <div class="terminal-prompt" aria-hidden="true" data-visible="true"><span class="prompt-symbol">❯</span><span class="resting-cursor">_</span></div>
          }
        </div>
      }
    </div>
  </div>
}
