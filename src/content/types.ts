/** Shapes of everything in `src/content/*`. Edit the data there; the site rebuilds from it. */

export interface Social {
  handle: string;
  url: string;
}

export interface Site {
  name: string;
  role: string;
  tagline: string;
  positioning: string;
  /** IANA time zone used by the live clock in the hero. */
  timezone: string;
  timeLabel: string;
  availability: string;
  response: string;
  contacts: {
    email: string;
    instagram: Social;
    telegram: Social;
    whatsapp: { url: string };
  };
}

export type Pair = readonly [title: string, text: string];

export interface About {
  label: string;
  lead: string;
  pull: string;
  paragraphs: string[];
  facts: Pair[];
  principles: Pair[];
}

export interface Service {
  id: string;
  title: string;
  summary: string;
  items: string[];
}

export type ProcessStep = Pair;

export interface Work {
  slug: string;
  title: string;
  category: string;
  year: string;
  /** Ids from `src/media/manifest.ts` → `images`. The first one is the grid thumbnail. */
  images: string[];
  /** Id from `src/media/manifest.ts` → `videos`. */
  video?: string;
  description: string;
  details: string;
  tools: string[];
}

export interface Privacy {
  lead: string;
  updated: string;
  blocks: Pair[];
}
