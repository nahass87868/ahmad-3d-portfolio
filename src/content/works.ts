import type { Work } from './types';

/**
 * Every project on the site, in display order.
 * `images` and `video` are ids from `src/media/manifest.ts` (not file paths).
 */
export const works: Work[] = [
  {
    slug: 'realistic-ice',
    title: 'Realistic Ice Render',
    category: 'Product Visualization',
    year: '2026',
    images: ['realistic-ice-image-1', 'realistic-ice-image-2'],
    description:
      'A realistic ice-focused 3D study built around materials, lighting, transparency, and detailed surface realism.',
    details:
      'A material and lighting study focused on believable ice, refraction, highlights, and controlled studio presentation.',
    tools: ['Blender', 'Cycles', 'Materials', 'Lighting'],
  },
  {
    slug: 'soap-animation',
    title: 'Soap Animation',
    category: 'Product Visualization',
    year: '2026',
    images: ['soap-image-1', 'soap-image-2', 'soap-image-3', 'soap-image-4'],
    video: 'soap-animation',
    description: 'Glossy surfaces and rich material realism.',
    details:
      'A product animation focused on aloe vera soap, material response, lighting, camera movement, and compositing.',
    tools: ['Blender', 'Cycles', 'Compositing'],
  },
  {
    slug: 'yerba-mate-animation',
    title: 'Yerba Mate Animation',
    category: 'Product Visualization',
    year: '2026',
    images: ['yerba-mate-image-1', 'yerba-mate-image-2'],
    video: 'yerba-mate-animation',
    description: 'Refreshing beverage hero shot with condensation and motion.',
    details:
      'Product-focused beverage visualization with emphasis on materials, condensation, lighting, and motion.',
    tools: ['Blender', 'Cycles', 'Product Visualization'],
  },
  {
    slug: 'asus-product-animation',
    title: 'Asus Product Animation',
    category: 'Product Visualization',
    year: '2026',
    images: ['asus-image'],
    video: 'asus-animation',
    description: 'A clean product-focused 3D presentation.',
    details: 'Product modeling, materials, lighting, camera work, and animation.',
    tools: ['Blender', 'Product Visualization', 'Motion'],
  },
  {
    slug: 'realistic-water-glass',
    title: 'Realistic Water Glass Render',
    category: 'Product Visualization',
    year: '2026',
    images: ['real-water-glass-image-1', 'real-water-glass-image-2'],
    description: 'A realistic study of transparent glass and water.',
    details:
      'Focused on believable transparency, refraction, liquid shading, lighting, and studio composition.',
    tools: ['Blender', 'Cycles', 'Materials', 'Lighting'],
  },
  {
    slug: 'smartwatch-animation',
    title: 'Smartwatch Animation',
    category: 'Product Visualization',
    year: '2026',
    images: ['smart-watch-image'],
    video: 'watch-animation',
    description: 'Macro product showcase with crisp studio lighting.',
    details:
      'A close-up product animation emphasizing clean forms, controlled lighting, materials, and camera movement.',
    tools: ['Blender', 'Product Visualization', 'Motion'],
  },
  {
    slug: 'nike-shoe-modeling',
    title: 'Nike Shoe Modeling',
    category: '3D Modeling',
    year: '2026',
    images: [
      'nike-shoe-image-1',
      'nike-shoe-image-2',
      'nike-shoe-image-3',
      'nike-shoe-image-4',
      'nike-shoe-image-5',
      'nike-shoe-image-6',
    ],
    description: 'Detailed footwear modeling and presentation.',
    details:
      'A modeling study focused on shape, construction, materials, and product presentation.',
    tools: ['Blender', 'Hard Surface', 'Product Modeling'],
  },
  {
    slug: 'interior-room-design',
    title: 'Interior Room Design',
    category: 'Interior design & architecture',
    year: '2026',
    images: ['interior-image-1', 'interior-image-2'],
    description: 'Concrete & Comfort — an interior scene focused on atmosphere and composition.',
    details:
      'Interior environment work with attention to materials, lighting, composition, and realistic scene presentation.',
    tools: ['Blender', 'Cycles', 'Environment Design', 'Lighting'],
  },
  {
    slug: 'booth-design',
    title: 'Booth Design',
    category: 'Interior design & architecture',
    year: '2026',
    images: [
      'booth-01-image-01',
      'booth-01-image-02',
      'booth-01-image-03',
      'booth-01-image-04',
      'booth-01-image-05',
      'booth-01-image-06',
      'booth-01-image-07',
      'booth-01-image-08',
      'booth-01-image-09',
    ],
    description: 'A modern exhibition booth design with a warm wooden touch and a luxury feel.',
    details:
      'A booth design modeled and rendered in Blender using Cycles, focused on modern architectural form, warm wood materials, lighting, and premium presentation.',
    tools: ['Blender', 'Cycles', 'Interior Design', 'Lighting'],
  },
  {
    slug: '2026-modes-looks',
    title: '2026 Modes & Looks',
    category: '3D Art',
    year: '2026',
    images: [
      '2026-looks',
      '2026-look-1',
      '2026-look-2',
      '2026-look-3',
      '2026-look-4',
      '2026-look-5',
      '2026-look-6',
    ],
    description: 'A visual exploration of different 3D moods, forms, and looks.',
    details:
      'An experimental collection exploring visual direction, lighting, materials, composition, and style.',
    tools: ['Blender', 'Lighting', 'Materials', 'Look Development'],
  },
  {
    slug: 'folder-inflation',
    title: 'Folder Inflation',
    category: 'Simulation',
    year: '2026',
    images: ['folder-image-1', 'folder-image-2'],
    video: 'folder-animation-1',
    description: 'A Windows folder icon transformed through soft-body and smoke effects.',
    details:
      'A procedural-style experiment combining soft body deformation, procedural shading, and volumetric smoke.',
    tools: ['Blender', 'Soft Body', 'Smoke', 'Procedural Shading'],
  },
  {
    slug: 'vellum-simulation',
    title: 'Vellum Simulation',
    category: 'Simulation',
    year: '2026',
    images: ['vellum-image'],
    video: 'vellum-animation-1',
    description: 'A procedural growth-style simulation study.',
    details:
      'A Houdini-inspired simulation experiment recreated with Blender techniques and procedural control.',
    tools: ['Blender', 'Geometry Nodes', 'Simulation', 'Procedural'],
  },
  {
    slug: 'date-cookies-animation',
    title: 'Date Cookies Animation',
    category: 'Product Visualization',
    year: '2026',
    images: ['dates-cookie-image'],
    video: 'dates-cookie-animation-1',
    description: 'Food-focused product animation with controlled lighting and presentation.',
    details:
      'A product visualization study focused on food form, materials, lighting, and camera movement.',
    tools: ['Blender', 'Cycles', 'Product Animation'],
  },
  {
    slug: 'blue-mall-logo-animation',
    title: 'Blue Mall Logo Animation',
    category: 'Motion Design',
    year: '2026',
    images: ['blue-mall-image'],
    video: 'blue-mall-animation',
    description: 'A premium 3D logo animation built around glass, light, and motion.',
    details:
      'Exploration of glass shaders, material alpha animation, camera movement, keyframes, and textured lighting.',
    tools: ['Blender', 'Logo Animation', 'Glass Shaders', 'Lighting'],
  },
  {
    slug: 'youth-affairs-logo-animation',
    title: 'Youth Affairs Logo Animation',
    category: 'Motion Design',
    year: '2026',
    images: ['youth-affairs-image-1', 'youth-affairs-image-2', 'youth-affairs-image-3'],
    video: 'youth-affairs-animation',
    description: '3D logo animation with final renders and making-of material.',
    details:
      'A logo motion project developed through modeling, materials, lighting, animation, and final rendering.',
    tools: ['Blender', 'Logo Animation', 'Motion Design'],
  },
];
