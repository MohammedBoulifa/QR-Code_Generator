# qr/gen

A small, self-contained QR code generator. No sign-up, no server, no
tracking — everything is encoded in your browser and the page works
straight off your filesystem.

## Features

- **Text or URL → QR code**, generated instantly, client-side
- **Size control** from 50–600px, either by dragging the slider or
  typing an exact value (clamped to that range)
- **Color picker** for both the code and the background — pick from
  the wheel or type a hex value directly, the two stay in sync
- **Live preview** that scales to fit the card at any size, while the
  exported file is still generated at full resolution
- **Download as PNG, JPG, SVG, or PDF** — SVG is built as true vector
  shapes from the QR's module grid, not a raster image wrapped in a
  tag
- Responsive layout: two columns on desktop, stacking down through
  tablet and phone widths

## Structure

```
qr-generator/
├── index.html      generator page
├── about.html       about page
├── css/
│   └── style.css    all styling
└── js/
    └── script.js     generation, color/size sync, and export logic
```

## Running it

Unzip and open `index.html` in a browser. That's it — no build step,
no install. An internet connection is needed the first time to load
the fonts and the two small libraries used (see below).

## Built with

Plain HTML, CSS, and vanilla JavaScript. Two open-source libraries,
loaded from a CDN:

- [qrcode.js](https://github.com/davidshimjs/qrcodejs) — core QR
  encoding and canvas rendering
- [jsPDF](https://github.com/parallax/jsPDF) — used only for the PDF
  export option

No frameworks, no bundler.

## Made by

**Mohammed** — freelance designer & developer, Ouargla, Algeria.
Brand identity and social design work at
[behance.net/MohammedBoulifa](https://behance.net/MohammedBoulifa),
[@X07Mohammed](https://x.com/X07Mohammed) on X.
