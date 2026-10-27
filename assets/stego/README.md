# InPlainSight illustration

Final assets: `inplainsight.gif`, `poster.webp`, and the original `cover.png` in this directory.

`inplainsight.gif` is an 18-second, 216-frame explanation of RGB least-significant-bit embedding. It is a visual illustration, not an output file from InPlainSight. The cover art is original and the sample byte is illustrative. No downloadable media links are added to the page.

The sequence packages a note, represents an encrypted container, replaces the least-significant bit of selected RGB bytes, then compares the nearly identical cover images. The example byte `A7` is displayed in least-significant-bit-first order. Eight illustrative writes change six channel values by at most one level. The selected red sample changes from 176 to 177.

The locations are schematic; the actual project uses passphrase- and cover-derived placement, a permutation, and textured slots first. Its length prefix, framing, cryptography, and full placement algorithm are not simulated by this animation.

Source references reviewed:

- [README: prepare, encrypt, embed](https://github.com/locainin/InPlainSight/blob/main/README.md)
- [Embedding implementation: bit order and channel writes](https://github.com/locainin/InPlainSight/blob/main/src/embed/embed_lsb.c#L206-L316)
- [Single-image flow: container creation and encryption](https://github.com/locainin/InPlainSight/blob/main/src/cli/hide/write_single.c#L194-L283)
- [Technical notes: RGB carrier and placement](https://github.com/locainin/InPlainSight/blob/main/docs/TECHNICAL.md)

## Rebuild

From the project root:

```sh
bun run render:stego
```

Rendering needs Python 3, Pillow, Fontconfig (`fc-match`), and FFmpeg. The script discovers fonts locally and uses temporary PNG frames; only the GIF and still poster remain in this directory. The production build copies the referenced GIF and poster, while the original cover stays in the source checkout for reproducibility.

## Cover artwork

The original `cover.png` was generated using the built-in image generation tool. Exact prompt:

> Create an original cover illustration for a personal developer website's steganography animation. Asset type: a standalone landscape illustration, no interface. A quiet anime-inspired city at night viewed across low rooftops under a deep indigo sky, a small pale moon, a few softly lit windows and restrained dusty pink light along the horizon. Clean composed shapes with subtly painted texture, rich slate blue and periwinkle tones, cinematic and a little nostalgic. Landscape 3:2 composition with clear silhouettes that still read at a small size. No people, no signs, no text, no letters, no digits, no logo, no watermark, no UI frames. It will be used as a lossless cover image whose tiny pixel changes are demonstrated later; do not draw diagrams, arrows, binary code, or technical overlays into the art.
