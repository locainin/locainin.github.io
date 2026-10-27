# ProtonInformer workflow illustration

`protoninformer.gif` is a code-drawn 14-second loop at 720×480 and 10 frames per second. `poster.webp` shows the exact-path verification step when motion is unavailable or paused.

The sequence illustrates the documented workflow:

1. Select a Wine or Proton process and its Steam AppID
2. Read the DLL's PE architecture and compare it with the target
3. Stage a private request and hand it to the matching Windows helper inside the prefix
4. Load the DLL with `LoadLibraryW`
5. Compare the loaded module's full Windows path with the expected path

The process IDs, module counts, and Windows path are schematic examples, not a live capture. The sequence describes the product's documented flow and does not imply that an injection was performed.

Regenerate the animation assets with `bun run render:proton`. Rendering uses Pillow, FFmpeg, and Fontconfig fonts already available to the project.

Reference documentation: [ProtonInformer README](https://github.com/locainin/ProtonInformer/blob/main/README.md), [usage guide](https://github.com/locainin/ProtonInformer/blob/main/docs/usage.md), and [CLI reference](https://github.com/locainin/ProtonInformer/blob/main/docs/cli.md).
