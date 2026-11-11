# Phase 3 Fix 03b: interaction polish (follow-up to Fix 03)

**What this does:** four small CSS-only additions inside `polish.js` (no logic, no new listeners). Fix 03's five changes were audited and left as they are.

1. Filter chips and the Mode/Scheme switches get a hover border (they had none).
2. Filter chips ease their on/off colour change instead of snapping.
3. Prev/Next project links get the same underline on keyboard focus as on hover.
4. Phone Appearance popover rows ease their press highlight on release.

Changed files: `polish.js`, `GUIDE.md`, and the refreshed `graphify-out/` map.

## Step 1: copy the files in
Unzip `fix03b.zip`, copy everything into your clone folder (the one with `package.json`), choose **Replace** for all. No `npm install` needed.

## Step 2: check it
Open Git Bash in the folder:
```
npm run build
npm run preview
```
`npm run build` must end with **OK** and say **131 files**. Open the preview address.

## Step 3: look at it (desktop)
- Hover a filter chip and a Mode/Scheme switch: the border turns to the text colour. Click a chip: it fades to filled, not a snap.
- Press Tab to reach a Prev/Next link inside a project: it is underlined like on hover.
- Re-check Fix 03: Tab through the featured cards (they lift), switch to Index and Tab (the focused row stays bright).

## Step 4: commit and push
GitHub Desktop: summary `Phase 3 Fix 03b: chip hover and focus parity` -> **Commit to main** -> **Push origin**. Watch **Actions** for the green tick.

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**.
