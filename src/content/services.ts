import type { Service, ProcessStep } from './types';

export const services: Service[] = [
  {
    id: 'image',
    title: 'Product visualization',
    summary:
      'Studio renders, macro details, material studies, campaign imagery and product scenes built to make form and finish feel tangible.',
    items: [
      'Product modeling & look development',
      'Materials, lighting & rendering',
      'Commercial stills & hero imagery',
    ],
  },
  {
    id: 'time',
    title: 'Motion design',
    summary:
      'Movement with a reason: camera choreography, product reveals, logo animation, and short-form visual storytelling.',
    items: ['Product & logo animation', 'Camera movement & timing', 'Compositing & final delivery'],
  },
  {
    id: 'space',
    title: 'Environments & simulation',
    summary:
      'Designed spaces, atmospheric scenes and procedural experiments that build a world around an idea.',
    items: [
      'Environment & interior scenes',
      'Procedural effects & simulations',
      'Look development & visual exploration',
    ],
  },
];

/** [title, description] */
export const process: ProcessStep[] = [
  ['Discover', 'Align on the idea, audience, references and what the final work needs to achieve.'],
  ['Develop', 'Explore composition, materials and movement before committing to final production.'],
  ['Deliver', 'Polish, render and package final assets for the intended platform or campaign.'],
];
