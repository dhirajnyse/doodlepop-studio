# DoodlePop Studio

![DoodlePop Studio logo](assets/doodlepop-logo.svg)

DoodlePop Studio is a playful browser painting app for kids. It runs as a static website, so it can be hosted directly on GitHub Pages with no backend, build step, account system, or install.

## Features

- Free-draw canvas with brush, eraser, sprinkle, stamps, undo, redo, and PNG export
- Coloring pages with a paint bucket fill tool
- Upload or drag in a drawing/image and paint over it
- Responsive layout for desktop, tablet, and mobile screens
- Launch-ready static files for GitHub Pages

## Project Files

- `index.html` - App markup and controls
- `styles.css` - Brand, layout, and responsive UI styling
- `app.js` - Canvas drawing, templates, image upload, history, and export
- `assets/doodlepop-logo.svg` - Brand logo and favicon

## Run Locally

Open `index.html` in a browser. No dependency install is required.

## Publish On GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`. After the files are pushed to `main`, GitHub Pages can deploy the site from Actions.

The live site URL is:

https://dhirajnyse.github.io/doodlepop-studio/

## License

MIT
