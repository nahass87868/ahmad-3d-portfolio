# Fix 07: every device gets the 3D hero, and the loading curtain no longer waits for it

**What this does:** two small edits.
- `src/main.js`: the hardware skip (2 GB RAM or less, or 2 CPU cores or less) is removed, so every device loads the 3D hero. These still skip the 3D and show the designed hero with the faint PORT / FOLIO backdrop, unchanged: Data Saver on, a very slow connection (2g, or under 0.5 Mbps) and a browser without WebGL 2.
- `premium.js`: `ASSETS_CAP_MS` goes from 3800 to 0. The curtain no longer waits for the 3D. It lifts after its normal minimum (about 2 s on a first visit, 0.8 s on later visits) once fonts and the page have loaded, and the 3D upgrades the hero when it arrives. In a sandbox test with the 3D delayed by 7 s the curtain lifted at 2.3 s instead of 4.3 s.

Not changed: `hero-3d.js`, `hero-fallback.js`, the Data Saver / slow-network / WebGL 2 rules, the `__hero3dReady` shim.

**Heads-up:** the 3D start-up work (a few hundred ms on a PC, more on a phone) can now land just after the curtain lifts instead of behind it. If the hero stutters after the lift on the A10, change `ASSETS_CAP_MS` in `premium.js` from 0 to about 1200 (a short wait) and tell me.

Changed files: `src/main.js`, `premium.js`, `GUIDE.md`, refreshed `graphify-out/`.

## Step 1: copy the files in
Unzip `fix07.zip` into your clone folder (the one with `package.json`), choose **Replace**.

## Step 2: build and look
```
npm run build
npm run preview
```
`npm run build` must end with **OK** and say **129 files**. Open the preview with DevTools network set to Slow 4G: the curtain should lift after about 2 s even while the 3D is still loading, then the 3D letters appear.

## Step 3: push
GitHub Desktop: summary `Fix 07: 3D on every device, curtain does not wait for it` -> **Commit to main** -> **Push origin**. Wait for the green tick under **Actions**.

## Step 4: test on the A10
Reload the live site on the A10. The 3D hero should now run (before, it showed the plain hero). Watch the curtain lift and scroll past the hero; if it feels laggy, send a short screen recording.

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**.
