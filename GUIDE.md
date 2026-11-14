# Stage 1: add the smoke test (code-structure plan)

**What this adds (the website itself is NOT touched):**
- `tests/smoke.mjs`: opens the built site in Chrome (desktop and phone size) and fails if a path, font, script, the 3D hero, the project grid, filters, project panel or phone menu is broken.
- `package.json`: one dev-only dependency `playwright-core` (about 14 MB, downloads no browser, uses the Chrome already installed on your PC) and one script `test:smoke`.
- `package-lock.json`: updated for that dependency (+14 lines).
- `graphify-out/`: the regenerated code map.

Base: main = `pre-tidy` = `abbdbb2` (Fix 07).

## Step 1: copy the files in
Unzip this zip into your clone folder (the one with `package.json`) and choose **Replace** for all. Nothing is moved or deleted, so no `git mv` is needed.

## Step 2: install and test (Git Bash or terminal in the folder)
```
npm install
npm run build
npm run test:smoke
```
- `npm install` adds `playwright-core` (this folder's `node_modules`, never pushed).
- The test needs Google Chrome installed on your PC (you have it).
- It takes about 1 to 2 minutes. It must end with **SMOKE TEST PASSED**.
- If it fails once, run `npm run test:smoke` again (it uses fixed waits); if it fails again, send me the lines that start with FAIL.

## Step 3: push
GitHub Desktop: summary `Stage 1: add smoke test` -> **Commit to main** -> **Push origin**. Wait for the green tick under **Actions** (the test is not part of the deploy yet; that is Stage 4).

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**. The branch `pre-tidy` is the full rollback point.
