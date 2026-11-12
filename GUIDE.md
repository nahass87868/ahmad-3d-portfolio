# Fix 06: headings keep their outline when the fill finishes (no thinning, no flicker step)

**What this does:** one CSS rule in `style.css` (`.st.on .l`). Every heading with the outline-then-fill animation (hero name, Works, About, Skills, Contact, the pull quote and the project-panel titles all use the same rule) now keeps its ink-coloured 1.4 px outline after the fill instead of fading the outline out over 0.4 s.
- Letters no longer get about 10% thinner at the end of the animation (measured: 32,181 px of ink stay 32,181 px).
- The heavy 0.4 s outline fade-out step, which repainted every big letter and is the likely cause of the flicker on weak phones, is gone.
- Finished headings are about 10% bolder than the font's plain weight, the same weight you see during the outline stage. You approved this.

Not changed: reduced motion, high-contrast mode and the viewport easter-egg modes keep their own rules.

Changed files: `style.css`, `GUIDE.md`, refreshed `graphify-out/`.

## Step 1: copy the files in
Unzip `fix06.zip` into your clone folder (the one with `package.json`), choose **Replace**.

## Step 2: build and look
```
npm run build
npm run preview
```
`npm run build` must end with **OK** and say **129 files**. Scroll the whole page: every heading should outline, fill from the bottom, and then stay exactly the same size.

## Step 3: push
GitHub Desktop: summary `Fix 06: keep heading outline after fill` -> **Commit to main** -> **Push origin**. Wait for the green tick under **Actions**.

## Step 4: test on the A10
Reload the live site and watch a heading fill in. If it still flickers, send a short screen recording.

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**.
