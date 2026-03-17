import type { TemplateConfig } from './template-schemas'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateSize {
  width: number
  height: number
  label: string
}

export interface Template {
  id: string
  formatId: string
  name: string
  description: string
  thumbnailUrl: string
  category: string
  sizes: TemplateSize[]
  defaultConfig: TemplateConfig
}

// ---------------------------------------------------------------------------
// 20 curated templates across 14 formats
// ---------------------------------------------------------------------------

export const TEMPLATES: Template[] = [
  // ── Standard: static-banner (3) ────────────────────────────────────────
  {
    id: 'hero-banner',
    formatId: 'static-banner',
    name: 'Hero Banner',
    description:
      'Bold hero layout with prominent headline and call-to-action button. Perfect for brand awareness campaigns.',
    thumbnailUrl: '',
    category: 'standard',
    sizes: [
      { width: 728, height: 90, label: '728x90' },
      { width: 300, height: 250, label: '300x250' },
      { width: 160, height: 600, label: '160x600' },
    ],
    defaultConfig: {
      type: 'static-banner',
      headline: 'Your Headline Here',
      bodyText: 'Your message goes here. Add compelling copy to engage your audience.',
      ctaText: 'Learn More',
      ctaUrl: '',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      ctaColor: '#2563eb',
      imageUrl: '',
    },
  },
  {
    id: 'product-spotlight',
    formatId: 'static-banner',
    name: 'Product Spotlight',
    description:
      'Clean product-focused layout with image prominence. Ideal for e-commerce product promotion.',
    thumbnailUrl: '',
    category: 'standard',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 336, height: 280, label: '336x280' },
      { width: 970, height: 250, label: '970x250' },
    ],
    defaultConfig: {
      type: 'static-banner',
      headline: 'Featured Product',
      bodyText: 'Discover our latest product with exclusive features designed just for you.',
      ctaText: 'Shop Now',
      ctaUrl: '',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      ctaColor: '#2563eb',
      imageUrl: '',
    },
  },
  {
    id: 'brand-awareness',
    formatId: 'static-banner',
    name: 'Brand Awareness',
    description:
      'Minimalist brand-forward design with logo placement and tagline. Great for top-of-funnel campaigns.',
    thumbnailUrl: '',
    category: 'standard',
    sizes: [
      { width: 728, height: 90, label: '728x90' },
      { width: 300, height: 250, label: '300x250' },
      { width: 320, height: 50, label: '320x50' },
    ],
    defaultConfig: {
      type: 'static-banner',
      headline: 'Your Brand Name',
      bodyText: 'Tagline that captures your brand essence in a few words.',
      ctaText: 'Discover',
      ctaUrl: '',
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      ctaColor: '#3b82f6',
      imageUrl: '',
    },
  },

  // ── Standard: multi-frame (2) ──────────────────────────────────────────
  {
    id: 'product-showcase',
    formatId: 'multi-frame',
    name: 'Product Showcase',
    description:
      'Auto-rotating frames highlighting multiple products or features. Great for multi-product campaigns.',
    thumbnailUrl: '',
    category: 'standard',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 728, height: 90, label: '728x90' },
    ],
    defaultConfig: {
      type: 'multi-frame',
      frames: [
        {
          headline: 'Product One',
          bodyText: 'First product description with key benefits.',
          imageUrl: '',
          backgroundColor: '#ffffff',
        },
        {
          headline: 'Product Two',
          bodyText: 'Second product description with key benefits.',
          imageUrl: '',
          backgroundColor: '#f1f5f9',
        },
        {
          headline: 'Product Three',
          bodyText: 'Third product description with key benefits.',
          imageUrl: '',
          backgroundColor: '#ffffff',
        },
      ],
      frameDuration: 3000,
      ctaText: 'View All',
      ctaUrl: '',
    },
  },
  {
    id: 'story-sequence',
    formatId: 'multi-frame',
    name: 'Story Sequence',
    description:
      'Sequential storytelling across frames that build a narrative. Perfect for brand stories.',
    thumbnailUrl: '',
    category: 'standard',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 160, height: 600, label: '160x600' },
    ],
    defaultConfig: {
      type: 'multi-frame',
      frames: [
        {
          headline: 'Chapter 1',
          bodyText: 'Set the scene for your story here.',
          imageUrl: '',
          backgroundColor: '#1e293b',
        },
        {
          headline: 'Chapter 2',
          bodyText: 'Build the narrative with the next scene.',
          imageUrl: '',
          backgroundColor: '#334155',
        },
      ],
      frameDuration: 4000,
      ctaText: 'Read More',
      ctaUrl: '',
    },
  },

  // ── Native: in-feed (2) ────────────────────────────────────────────────
  {
    id: 'content-promo',
    formatId: 'in-feed',
    name: 'Content Promo',
    description:
      'Blends seamlessly with publisher content feeds. Ideal for content marketing and article promotion.',
    thumbnailUrl: '',
    category: 'native',
    sizes: [{ width: 0, height: 0, label: 'Responsive' }],
    defaultConfig: {
      type: 'in-feed',
      headline: 'Engaging Article Title That Draws Readers In',
      bodyText:
        'Preview text that gives readers a taste of the content they will discover when they click through to learn more.',
      imageUrl: '',
      sponsorName: 'Your Brand',
      sponsorLogoUrl: '',
      ctaText: 'Read Article',
      ctaUrl: '',
    },
  },
  {
    id: 'product-card',
    formatId: 'in-feed',
    name: 'Product Card',
    description:
      'Native product card that blends with shopping feeds. Great for e-commerce native campaigns.',
    thumbnailUrl: '',
    category: 'native',
    sizes: [{ width: 0, height: 0, label: 'Responsive' }],
    defaultConfig: {
      type: 'in-feed',
      headline: 'Product Name - Special Offer',
      bodyText:
        'Brief product description highlighting key features and current promotional pricing.',
      imageUrl: '',
      sponsorName: 'Your Store',
      sponsorLogoUrl: '',
      ctaText: 'Shop Now',
      ctaUrl: '',
    },
  },

  // ── Interactive: carousel (2) ──────────────────────────────────────────
  {
    id: 'product-gallery',
    formatId: 'carousel',
    name: 'Product Gallery',
    description:
      'Swipeable product cards for browsing multiple items. Perfect for e-commerce product catalogs.',
    thumbnailUrl: '',
    category: 'interactive',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 320, height: 480, label: '320x480' },
    ],
    defaultConfig: {
      type: 'carousel',
      slides: [
        { headline: 'Item 1', imageUrl: '', bodyText: 'First product in the gallery.' },
        { headline: 'Item 2', imageUrl: '', bodyText: 'Second product in the gallery.' },
        { headline: 'Item 3', imageUrl: '', bodyText: 'Third product in the gallery.' },
      ],
      autoPlay: false,
      autoPlayInterval: 3000,
      ctaText: 'Shop Now',
      ctaUrl: '',
    },
  },
  {
    id: 'feature-highlights',
    formatId: 'carousel',
    name: 'Feature Highlights',
    description:
      'Showcase key features or benefits one-by-one with swipeable slides. Great for SaaS products.',
    thumbnailUrl: '',
    category: 'interactive',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 728, height: 90, label: '728x90' },
    ],
    defaultConfig: {
      type: 'carousel',
      slides: [
        { headline: 'Feature One', imageUrl: '', bodyText: 'Describe your first key feature.' },
        { headline: 'Feature Two', imageUrl: '', bodyText: 'Describe your second key feature.' },
        { headline: 'Feature Three', imageUrl: '', bodyText: 'Describe your third key feature.' },
      ],
      autoPlay: true,
      autoPlayInterval: 4000,
      ctaText: 'Learn More',
      ctaUrl: '',
    },
  },

  // ── Interactive: cube (1) ──────────────────────────────────────────────
  {
    id: '3d-product-display',
    formatId: 'cube',
    name: '3D Product Display',
    description:
      'Rotating 3D cube with content on each face. Eye-catching interactive format for premium brands.',
    thumbnailUrl: '',
    category: 'interactive',
    sizes: [{ width: 300, height: 250, label: '300x250' }],
    defaultConfig: {
      type: 'cube',
      faces: [
        { headline: 'Face 1', imageUrl: '', bodyText: 'First cube face content.' },
        { headline: 'Face 2', imageUrl: '', bodyText: 'Second cube face content.' },
        { headline: 'Face 3', imageUrl: '', bodyText: 'Third cube face content.' },
        { headline: 'Face 4', imageUrl: '', bodyText: 'Fourth cube face content.' },
      ],
      rotationSpeed: 4000,
      ctaText: 'Explore',
      ctaUrl: '',
    },
  },

  // ── Interactive: scratch (1) ───────────────────────────────────────────
  {
    id: 'mystery-reveal',
    formatId: 'scratch',
    name: 'Mystery Reveal',
    description:
      'Users scratch an overlay to reveal hidden content underneath. High engagement for promotions and contests.',
    thumbnailUrl: '',
    category: 'interactive',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 320, height: 480, label: '320x480' },
    ],
    defaultConfig: {
      type: 'scratch',
      overlayImageUrl: '',
      revealImageUrl: '',
      headline: 'Scratch to Reveal Your Prize!',
      bodyText: 'Use your finger or mouse to scratch the surface and discover what is underneath.',
      ctaText: 'Claim Now',
      ctaUrl: '',
    },
  },

  // ── Interactive: flipcard (1) ──────────────────────────────────────────
  {
    id: 'before-after',
    formatId: 'flipcard',
    name: 'Before & After',
    description:
      'Tap to flip the card and reveal the other side. Great for before/after comparisons.',
    thumbnailUrl: '',
    category: 'interactive',
    sizes: [{ width: 300, height: 250, label: '300x250' }],
    defaultConfig: {
      type: 'flipcard',
      frontHeadline: 'Before',
      frontImageUrl: '',
      frontBodyText: 'Tap to see the transformation.',
      backHeadline: 'After',
      backImageUrl: '',
      backBodyText: 'The amazing result revealed.',
      ctaText: 'Learn More',
      ctaUrl: '',
    },
  },

  // ── Interactive: quiz (1) ──────────────────────────────────────────────
  {
    id: 'brand-trivia',
    formatId: 'quiz',
    name: 'Brand Trivia',
    description:
      'Interactive quiz with multiple-choice questions. Drives engagement through gamification.',
    thumbnailUrl: '',
    category: 'interactive',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 320, height: 480, label: '320x480' },
    ],
    defaultConfig: {
      type: 'quiz',
      question: 'What makes our product unique?',
      options: [
        { text: 'Option A', isCorrect: false },
        { text: 'Option B', isCorrect: true },
        { text: 'Option C', isCorrect: false },
      ],
      resultText: 'Great job! You know your stuff.',
      ctaText: 'Learn More',
      ctaUrl: '',
    },
  },

  // ── Interactive: slider (1) ────────────────────────────────────────────
  {
    id: 'comparison-slider',
    formatId: 'slider',
    name: 'Comparison Slider',
    description:
      'Drag a handle to compare two images side-by-side. Perfect for before/after product demos.',
    thumbnailUrl: '',
    category: 'interactive',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 728, height: 90, label: '728x90' },
    ],
    defaultConfig: {
      type: 'slider',
      beforeImageUrl: '',
      afterImageUrl: '',
      headline: 'See the Difference',
      bodyText: 'Drag the slider to compare before and after.',
      ctaText: 'Try It Now',
      ctaUrl: '',
    },
  },

  // ── Interactive: accordion (1) ─────────────────────────────────────────
  {
    id: 'feature-accordion',
    formatId: 'accordion',
    name: 'Feature Accordion',
    description:
      'Expandable sections that reveal content on click. Great for presenting multiple features compactly.',
    thumbnailUrl: '',
    category: 'interactive',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 160, height: 600, label: '160x600' },
    ],
    defaultConfig: {
      type: 'accordion',
      sections: [
        { title: 'Feature One', content: 'Details about the first feature.', imageUrl: '' },
        { title: 'Feature Two', content: 'Details about the second feature.', imageUrl: '' },
        { title: 'Feature Three', content: 'Details about the third feature.', imageUrl: '' },
      ],
      ctaText: 'Get Started',
      ctaUrl: '',
    },
  },

  // ── Animated: animated-banner (1) ──────────────────────────────────────
  {
    id: 'attention-grabber',
    formatId: 'animated-banner',
    name: 'Attention Grabber',
    description:
      'Animated banner with eye-catching motion effects. Supports fade, slide, bounce, and zoom animations.',
    thumbnailUrl: '',
    category: 'animated',
    sizes: [
      { width: 728, height: 90, label: '728x90' },
      { width: 300, height: 250, label: '300x250' },
      { width: 320, height: 50, label: '320x50' },
    ],
    defaultConfig: {
      type: 'animated-banner',
      headline: 'Grab Attention Now',
      bodyText: 'Animated content that stands out from the crowd.',
      ctaText: 'Learn More',
      ctaUrl: '',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      ctaColor: '#2563eb',
      imageUrl: '',
      animationType: 'fade',
    },
  },

  // ── Animated: countdown (1) ────────────────────────────────────────────
  {
    id: 'flash-sale',
    formatId: 'countdown',
    name: 'Flash Sale',
    description:
      'Countdown timer that creates urgency for limited-time offers. Drives conversions for sales events.',
    thumbnailUrl: '',
    category: 'animated',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 728, height: 90, label: '728x90' },
    ],
    defaultConfig: {
      type: 'countdown',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      headline: 'Flash Sale Ends Soon!',
      bodyText: 'Do not miss out on our biggest deals of the year.',
      ctaText: 'Shop Now',
      ctaUrl: '',
      backgroundColor: '#dc2626',
      textColor: '#ffffff',
    },
  },

  // ── Video: video-endcard (1) ───────────────────────────────────────────
  {
    id: 'brand-story',
    formatId: 'video-endcard',
    name: 'Brand Story',
    description:
      'Video that plays and transitions to an interactive end card with CTA. Combines storytelling with conversion.',
    thumbnailUrl: '',
    category: 'video',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 640, height: 360, label: '640x360' },
    ],
    defaultConfig: {
      type: 'video-endcard',
      videoUrl: '',
      endcardHeadline: 'Thanks for Watching',
      endcardBodyText: 'Ready to learn more about what we offer?',
      endcardImageUrl: '',
      ctaText: 'Get Started',
      ctaUrl: '',
      autoplay: false,
    },
  },

  // ── Video: click-to-play (1) ───────────────────────────────────────────
  {
    id: 'product-demo',
    formatId: 'click-to-play',
    name: 'Product Demo',
    description:
      'Thumbnail image that expands to play a video on click. User-initiated playback for better engagement.',
    thumbnailUrl: '',
    category: 'video',
    sizes: [
      { width: 300, height: 250, label: '300x250' },
      { width: 640, height: 360, label: '640x360' },
    ],
    defaultConfig: {
      type: 'click-to-play',
      videoUrl: '',
      thumbnailImageUrl: '',
      headline: 'Watch Product Demo',
      ctaText: 'Play Video',
      ctaUrl: '',
    },
  },
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByFormat(formatId: string): Template[] {
  return TEMPLATES.filter((t) => t.formatId === formatId)
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter((t) => t.category === category)
}
