import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assertNoGeneratedMarkers } from './validate.mjs';

export async function assertSafeOutput(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Allow the existing root marker while rejecting other hidden output
    if (entry.name.startsWith('.') && !(name === '.nojekyll' && entry.isFile())) {
      throw new Error(`Unexpected hidden build output: ${name}`);
    }
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link in build output: ${name}`);
    if (entry.isDirectory()) await assertSafeOutput(join(directory, entry.name), name);
    // Later build transforms can add content after the page is first rendered
    else if (entry.isFile() && name.endsWith('.html')) assertNoGeneratedMarkers(await readFile(join(directory, entry.name), 'utf8'));
  }
}
