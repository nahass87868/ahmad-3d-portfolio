# Phase 3 guide: project data file, share cards, no-JS list

**What changes for visitors:** nothing visible on the site. Links you share now show each project's own preview, and visitors without JavaScript (and search engines) see a real project list.
**What changes for you:** the project list now lives in one file, `content/works.js`. The published site is also smaller (145 MB to 87 MB) because the `.jpg` masters are no longer published. They stay in your repo.

## Step 1: copy the files in
Unzip `phase3.zip` and copy everything into your clone folder. Choose **Replace** for `index.html` and `script.js`. No new `npm install` is needed.

## Step 2: check it
In Git Bash, in the clone folder:
```
npm run build
npm run preview
```
`npm run build` must end with **OK**, saying about **131 files** and **16 share-card pages**. Open the preview address and check the site looks and works as before.

## Step 3: commit and push
GitHub Desktop: summary `Phase 3: project data file, share cards, no-JS list` -> **Commit to main** -> **Push origin**. Watch **Actions** for the green tick.

## Step 4: check it live
1. The site looks the same. Open a project, then close it.
2. Open `https://nahass87868.github.io/ahmad-3d-portfolio/work/realistic-ice/`: it should send you straight to that project.
3. Share that same link on Telegram: it should show the project's title and image. Telegram caches old previews. If it shows the generic card, ask the bot `@WebpageBot` to refresh the link.
4. No-JS check: in the browser press `F12`, open the three-dot menu, then Settings and "Disable JavaScript", and reload: you should see your name and a list of the 16 projects.

## Adding or editing a project later
Edit `content/works.js`. For a new project, also add a 1200x630 preview image named `og/<slug>.jpg` (without it the build still works, with a warning, and that project shares without an image).

## If anything goes wrong
GitHub Desktop -> **History** -> right-click the Phase 3 commit -> **Revert this commit** -> **Push origin**. That restores Phase 2.
