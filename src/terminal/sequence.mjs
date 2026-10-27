export const intro = {
  name: 'locainin',
  command: 'whoami',
  aboutCommand: 'cat about.txt',
  about: 'I enjoy software engineering and cybersecurity.\nBuilding things. Figuring out how they break.',
  slCommand: 'sl',
};

const character = 400;
const nameReady = intro.command.length * character;
const aboutStart = nameReady + 1800;
const aboutReady = aboutStart + intro.aboutCommand.length * character;
const slStart = aboutReady + 6000;
// Leave the complete command visible before the train takes over the screen
const trainStart = slStart + intro.slCommand.length * character + 600;
const trainEnd = trainStart + 6000;
export const timing = { character, nameReady, aboutStart, aboutReady, slStart, trainStart, trainEnd, cycle: trainEnd + 1200 };

export function frameAt(elapsed) {
  const time = Math.max(0, elapsed) % timing.cycle;
  const reset = time >= timing.trainEnd;
  const characters = (text, start) => Math.max(0, Math.min(text.length, Math.floor((time - start) / timing.character)));
  return {
    phase: reset ? 'reset' : time >= timing.trainStart ? 'train' : time >= timing.slStart ? 'sl' : time >= timing.aboutReady ? 'read' : time >= timing.aboutStart ? 'about' : time >= timing.nameReady ? 'name' : 'who',
    command: reset ? 0 : characters(intro.command, 0),
    name: !reset && time >= timing.nameReady ? intro.name.length : 0,
    aboutCommand: reset ? 0 : characters(intro.aboutCommand, timing.aboutStart),
    showAbout: !reset && time >= timing.aboutReady,
    slCommand: reset ? 0 : characters(intro.slCommand, timing.slStart),
    trainProgress: time >= timing.trainStart && !reset ? (time - timing.trainStart) / (timing.trainEnd - timing.trainStart) : 0,
  };
}

export function shouldAnimateSession(browser) {
  return !browser.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
