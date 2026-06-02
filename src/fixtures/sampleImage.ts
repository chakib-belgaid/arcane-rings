export function sampleImageDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#182840"/>
      <stop offset="0.45" stop-color="#6c7fa2"/>
      <stop offset="1" stop-color="#d6a85f"/>
    </linearGradient>
    <radialGradient id="moon" cx="66%" cy="22%" r="18%">
      <stop offset="0" stop-color="#fff7cf"/>
      <stop offset="1" stop-color="#c5d7ec" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#sky)"/>
  <circle cx="680" cy="210" r="180" fill="url(#moon)"/>
  <path d="M0 690 C160 570 270 640 420 530 C610 390 740 450 1024 260 V1024 H0Z" fill="#182133"/>
  <path d="M0 780 C130 700 270 760 420 670 C570 580 760 640 1024 500 V1024 H0Z" fill="#25384a"/>
  <path d="M112 820 L234 508 L356 820 Z" fill="#0c141f"/>
  <path d="M650 855 L790 420 L930 855 Z" fill="#101a28"/>
  <path d="M120 650 C260 610 420 695 545 595 C650 510 770 535 920 450" fill="none" stroke="#e1c076" stroke-width="18" stroke-linecap="round" opacity="0.7"/>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
