import { mount } from 'ripple';
import { TerminalIntro } from './TerminalIntro.tsrx';
import { shouldAnimateSession } from './sequence.mjs';

const target = document.getElementById('terminal-root');
// Preserve the static introduction while local fonts finish loading
await document.fonts.ready;
const dispose = mount(TerminalIntro, { target, props: { animate: shouldAnimateSession(window), interactive: true } });

// Development updates release the previous component before mounting another
if (import.meta.hot) import.meta.hot.dispose(dispose);
