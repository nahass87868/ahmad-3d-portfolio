import type { Privacy } from './types';

export const privacy: Privacy = {
  lead: "A simple note on what this portfolio does and doesn't collect.",
  updated: 'Last updated: October 2026',
  blocks: [
    [
      'Personal information',
      'This portfolio is a personal showcase of 3D artwork and creative services. It does not provide an account system or collect information through a built-in contact form.',
    ],
    [
      'Contacting me',
      'If you contact me by email or through a linked social platform, the information you provide is handled by that service and used to respond to your message.',
    ],
    [
      'Local preferences',
      'This site stores your colour mode and colour scheme choice in your browser so it can remember it. The site does not use that preference to identify you.',
    ],
    [
      'Third-party services',
      'Fonts and media are served from this site. External links (Instagram, Telegram, WhatsApp) are subject to their own privacy policies.',
    ],
    [
      'Questions',
      'For questions about this notice, email me at the address in the contact section.',
    ],
  ],
};
