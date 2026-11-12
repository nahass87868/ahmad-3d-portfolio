# Fix 04d: undo the heading-fill change on small phones, wait longer for the 3D on slow data

**What this does (2 tiny changes):**
1. `polish.js`: removes the Fix 04c block. On 2 GB phones it replaced the bottom-to-top fill inside the heading outlines with a plain left-to-right colour fade. You did not like that, and it never fixed the flicker. Headings now fill the original way on every device.
2. `premium.js`: `ASSETS_CAP_MS` 3800 -> 8000. The loading curtain used to give up waiting for the 3D after 3.8 s, so on slow data it lifted onto the plain fallback hero (AHMAD left / NAHASS right with hairlines). Now it waits up to 8 s. On fast connections nothing changes, because the curtain lifts as soon as the 3D is ready.

Changed files: `polish.js`, `premium.js`, `GUIDE.md`, refreshed `graphify-out/`.

## Step 1: copy the files in
Unzip `fix04d.zip` into your clone folder (the one with `package.json`), choose **Replace**.

## Step 2: build and push
```
npm run build
```
Must end with **OK** and say **131 files**. Then GitHub Desktop: summary `Fix 04d: revert 04c, longer 3D wait` -> **Commit to main** -> **Push origin**. Wait for the green tick under **Actions**.

## Step 3: test on the phone
Clear the site's data (Chrome -> Settings -> Site settings -> the site -> Clear), then load it on slow mobile data. The curtain may stay up longer, then the centred name and the 3D should appear. The headings should fill from bottom to top inside the outline.

## If you still see the old split layout
Plug the phone into a computer with USB debugging, open `chrome://inspect` in desktop Chrome, inspect the page, and in the Console type `__hero3d`. Send me the `state` and `reason` it shows. That says exactly why the 3D did not start.

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**.
