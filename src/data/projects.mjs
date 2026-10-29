// The capability query includes 4:4:4 RGB and a level 3.1 decoding budget
export const projectVideoType = 'video/webm; codecs="vp09.01.31.08.03.02.02.00.01"';

// Project records keep repository links and display copy consistent across pages
export const projects = [
  {
    slug: 'unixnotis',
    title: 'UnixNotis',
    repository: 'UnixNotis',
    category: 'Linux desktop',
    description: 'A Wayland notification daemon and control center for Hyprland. Media controls and event-driven widgets, in one place.',
    stack: ['Rust', 'GTK4', 'Wayland'],
    home: 'notifications',
  },
  {
    slug: 'inplainsight',
    title: 'InPlainSight',
    repository: 'InPlainSight',
    category: 'Image steganography',
    description: 'A small secret, a very normal-looking image. Encrypted data tucked into RGB values, with a C CLI and a Rust GTK4 interface.',
    stack: ['C', 'Rust', 'GTK4'],
    home: 'stego',
    note: '18 seconds inside the least-significant bits.',
    media: {
      animation: 'assets/stego/inplainsight.gif', video: 'assets/stego/inplainsight.webm', poster: 'assets/stego/poster.webp', width: 960, height: 680,
      type: projectVideoType,
      alt: "A note becomes encrypted data, then tiny changes to an image's RGB channel bits",
      description: 'An 18-second illustration shows a note being packaged and encrypted, a selected channel changing by one level, then the nearly identical image. Example bytes and placement are schematic, not a recording of the complete algorithm.',
      caption: 'there’s something hidden in here. probably.',
    },
  },
  {
    slug: 'protoninformer',
    title: 'ProtonInformer',
    repository: 'ProtonInformer',
    category: 'Linux tools',
    description: 'A Linux-native CLI for loading Windows DLLs into Proton and Wine processes, with target discovery and PE validation.',
    stack: ['Rust'],
    home: 'more',
    media: {
      animation: 'assets/proton/protoninformer.gif', video: 'assets/proton/protoninformer.webm', poster: 'assets/proton/poster.webp', width: 720, height: 480,
      type: projectVideoType,
      alt: 'An illustrated DLL moves through validation and a Wine prefix into a target process',
      description: 'A workflow illustration shows target discovery, DLL architecture checks, a matching Windows helper loading the DLL inside a Wine prefix, and verification of the expected module path. It is a schematic illustration rather than a recording.',
    },
  },
  {
    slug: 'data-structures-and-algorithms',
    title: 'Data Structures & Algorithms',
    repository: 'Data-Structures-and-Algorithms',
    category: 'C++ examples',
    description: 'C++ examples, cleaned up and expanded from class.',
    stack: ['C++'],
  },
  {
    slug: 'lenovo-legion-profiles',
    title: 'Lenovo Legion Profiles',
    repository: 'lenovo-legion-profiles',
    category: 'Linux / laptop profiles',
    description: 'Turn Fn+Q on Lenovo Legion laptops into a 4-mode performance switch on Linux, unlocking hidden pink extreme profile via ACPI platform_profile.',
    stack: ['Shell'],
  },
  {
    slug: 'hyprvolume',
    title: 'HyprVolume',
    repository: 'HyprVolume',
    category: 'Hyprland / audio',
    description: 'Inspired by KDE volume OSD, built for Hyprland with GTK4-layer-shell and customizable JSON/CSS themes.',
    stack: ['C', 'CSS', 'Shell'],
  },
];
