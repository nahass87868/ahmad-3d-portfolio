# Mobile compatibility notes

The portfolio includes responsive breakpoints at 900px, 650px, and 560px, a mobile navigation menu, single-column work cards on phones, stacked contact/about/service layouts, and touch-device fallbacks for custom cursor, magnetic links, and hover tooltips.

This is a static code audit, not a real-device/browser automation test. Test on iOS Safari and Android Chrome before publishing.

The V6 CSS adds a narrow-phone hero font adjustment (up to 380px) so the deliberately unbroken headline lines remain inside the viewport while preserving each whole word.
