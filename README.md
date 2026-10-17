# Ahmad Nahass — Portfolio Redesign

A multi-page, responsive 3D artist portfolio built from the supplied HTML/CSS/JS project and inspired by the interaction direction of https://mikewilcockdesign.com/.

## Run locally
This is a static website. From this folder, run:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/ in your browser. You can also use another static server.

## Pages
- `index.html` — experiential homepage and interactive object study
- `work.html` — project archive with category filters, List/Grid modes, contextual previews
- `about.html`, `services.html`, `contact.html`, `privacy.html`
- 15 individual `project-*.html` case studies with next-project navigation

## Interaction notes
- First-visit opening counter and skip-intro control (session scoped)
- Stable Sky Blue letter-by-letter page transition with a single cover state (prevents double-triggered / competing wipes)
- Pointer-reactive Archivo variable typography: heavy/wide at rest, lighter/narrower near the pointer
- Custom cursor hides the native system cursor on fine-pointer devices; contextual labels adapt to hover targets
- Contextual hover explanations for headings, section labels, service rows and next-project links
- Magnetic link feedback, animated project art and pointer-following project preview; List/Grid controls
- Pause/Resume control for the selected-work rail
- Scroll-led word lighting and draggable / wheel / keyboard object study
- Reduced-motion preference support and keyboard focus states

## Important asset note
The uploaded ZIP contained only four source files (`index.html`, `style.css`, `script.js`, and `particles.js`) and did **not** include the referenced `images/` or `videos/` folders. The project descriptions and contact links have been preserved from the supplied source, while CSS-authored abstract visual plates are used as deliberate stand-ins so the redesign remains complete and visually composed. Replace those stand-ins with your original renders and animations when you provide the missing media assets; no original artwork was available in the upload to embed.

## Validation performed
- JavaScript syntax checks (`node --check`) passed for `site.js` and `projects-data.js`.
- Local HTML link/script/style references checked: no broken local references.
- HTML ID duplicate scan: no duplicate IDs.
- CSS brace balance checked.
- Browser automation was attempted in the current sandbox but its Chromium navigation was blocked by the environment policy; run the local server steps above to verify in your own browser.
- The website is static and requires no build step or package installation.


## Latest interaction fixes
- Removed the Selected Worlds rail and the Up Close 3D interaction section from the homepage.
- Removed floating hover-copy tooltips.
- Kept proximity typography on prominent display text and links, excluding supporting paragraphs and subcopy.
- Normalized page transition handoff timing and mapped Home to the correct transition label.
- Added CSS safeguards against splitting words and syllables.
