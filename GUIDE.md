# Phase 3 Fix 04c: heading flicker on 2 GB phones (experiment)

**What this does:** only on phones where Chrome reports 2 GB of memory or less (your Galaxy A10), `polish.js` adds the class `x-lowmem` and three CSS rules:
1. The per-letter GPU layers on the headings are switched off (`will-change: auto`).
2. The heading fill no longer uses the clip-path wipe on a copy of each letter; the letters just fade from outline to filled.
3. Every other phone and all desktops are untouched.

Why: the flicker looks like the GPU dropping the per-letter layers (low memory) while the clip-path wipe repaints them. This is a **diagnosis from reading the code, not yet proven on a device**. Proximity morphing is not the cause: `script.js` already skips it on touch screens.

Changed files: `polish.js` (also carries Fix 03b), `GUIDE.md`, refreshed `graphify-out/`.

## Step 1: copy the files in
Unzip `fix04c.zip` into your clone folder, choose **Replace**.

## Step 2: build, push
```
npm run build
```
Must end with **OK** and say **131 files**. Then GitHub Desktop: summary `Phase 3 Fix 04c: low-memory heading fill` -> **Commit to main** -> **Push origin**. Wait for the green tick under **Actions**.

## Step 3: test on the A10 (the only test that counts)
Open the live site in Chrome, hard refresh a few times. Watch the AHMAD NAHASS name and the Skills/Work headings fill in.
- Smooth fade, no flicker: it worked.
- Still flickers: tell me, and in Chrome on the phone open `chrome://version` and send me the Chrome version. Do not keep editing.

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the commit -> **Revert this commit** -> **Push origin**.
