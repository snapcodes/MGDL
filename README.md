# MGDL — Maldivian Geometry Dash List (v3.0)

A responsive, static leaderboard for Snaps' version of the Maldivian Geometry Dash List.

## Included
- 50 reserved placements
- 34 submitted levels, kept in the exact order provided
- 16 open placements for future additions
- Crimson / near-black responsive UI
- Search, top-three feature cards, and copy-ranking button
- Keyboard shortcut `/` to focus search; `Esc` clears it
- Reduced-motion accessibility support
- No backend, build step, or dependencies required

## Run locally
Open `index.html` in a browser. For a local web server, use VS Code Live Server or run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages
1. Create a new GitHub repository, for example `mgdl`.
2. Upload `index.html`, `styles.css`, and `script.js` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site. The URL will appear in the Pages settings.

## Updating the rankings
Open `script.js` and edit the `rankedLevels` array near the top. Keep the array in hardest-to-easiest order. The rank number is generated automatically from each item's position.

The page currently displays 34 named levels and 16 reserved slots. Add names to the array to fill those slots. The display capacity is controlled by `totalPlacements` in `script.js`.

## iPhone / iPad
The layout is responsive and designed to work in Safari on iOS. GitHub Pages serves it over HTTPS. No installation is needed; visitors can open the published URL in Safari and optionally use **Share → Add to Home Screen**.
