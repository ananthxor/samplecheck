// ─── Types ───────────────────────────────────────────────────────────────────

export const GLOBAL_LIMITS = {
  image: 1, // MB
  video: 2, // MB
};

export type FieldType = "text" | "image" | "video" | "select" | "group" | "cta" | "redirect" | "color" | "date";

export interface DynamicField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  multiple?: boolean;
  options?: { value: string; label: string }[]; // For select type
  count?: number; // How many assets (e.g. image(2))
  fields?: DynamicField[]; // For group type
  infoText?: string; // Descriptive tooltip text
}

export interface AdFormat {
  id: string;
  name: string;
  dimension?: string;
  longDescription?: string;
  tags?: string[];
  previewModes?: ("mobile" | "tablet" | "desktop")[];
  dynamicFields?: DynamicField[];
  bestPractices?: string[];
}

export interface AdSize {
  id: string;
  key: string;
  name: string;
  description: string;
  dimension?: string;
  formats: AdFormat[];
}

export interface AdCategory {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  hasAdSizes: boolean;
  adSizes: AdSize[];
  formats: AdFormat[];
}

export const findFormatById = (id: string) => {
  for (const cat of adCategories) {
    // Check direct formats
    const direct = cat.formats.find(f => f.id === id);
    if (direct) return { format: direct, category: cat };

    // Check inside sizes
    for (const size of cat.adSizes) {
      const found = size.formats.find(f => f.id === id);
      if (found) return { format: found, category: cat, size };
    }
  }
  return null;
};

// ─── Helper ──────────────────────────────────────────────────────────────────

const _usedSlugs = new Set<string>();

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueSlug(name: string): string {
  const base = toSlug(name);
  if (!_usedSlugs.has(base)) { _usedSlugs.add(base); return base; }
  let i = 2;
  while (_usedSlugs.has(`${base}-${i}`)) i++;
  const slug = `${base}-${i}`;
  _usedSlugs.add(slug);
  return slug;
}

const fmt = (
  name: string,
  dimension?: string,
  longDescription?: string,
  tags?: string[],
  previewModes: ("mobile" | "tablet" | "desktop")[] = ["mobile", "tablet", "desktop"],
  dynamicFields?: DynamicField[],
  bestPractices?: string[]
): AdFormat => ({
  id: uniqueSlug(name),
  name,
  ...(dimension && { dimension }),
  longDescription: longDescription || `Elevate your campaign with the ${name} format. Designed for maximum engagement and seamless integration, this format ensures your brand story is told effectively across all devices.`,
  tags: tags || ["Brand Awareness", "Direct Response", "Mobile First"],
  previewModes,
  dynamicFields,
  bestPractices,
});

// ─── 1. INTERACTIVE ADS ─────────────────────────────────────────────────────

const interactiveAds: AdCategory = {
  id: "cat-1",
  key: "interactive",
  name: "Interactive Ads",
  description:
    "A great way for brands to tell stories, enhance word of mouth, and get personal like never before.",
  icon: "🎯",
  color: "#6366f1",
  hasAdSizes: true,
  formats: [],
  adSizes: [
    {
      id: "size-1-1",
      key: "responsive",
      name: "Responsive",
      description:
        "A dynamic creative that adapts to the screen size of phones and tablets for both landscape and portrait.",
      formats: [
        fmt(
          "Quiz-n-Win",
          undefined,
          "Engage users with interactive trivia that rewards participation. Perfect for brand education and data collection, this format gamifies the ad experience, leading to higher completion rates and improved brand recall.",
          ["Gamification", "Engagement", "Data Collection", "Gen Z", "Brand Awareness"],
          ["mobile", "tablet"],
          [
            {
              id: "quiz_props",
              type: "group",
              label: "Quiz Setup",
              fields: [
                {
                  id: "q_type",
                  type: "select",
                  label: "Question Type",
                  options: [
                    { value: "manual", label: "Manual Input" },
                    { value: "predefined", label: "Predefined Options" }
                  ]
                },
                { id: "text_q", type: "text", label: "Quiz Question", placeholder: "What is your favorite..." },
                { id: "media", type: "image", label: "Quest Images", count: 2 }
              ]
            }
          ]
        ),
        fmt("Quiz Up"),
        fmt(
          "Shake To Reveal",
          undefined,
          "Create a moment of surprise and delight.",
          ["Haptic", "Interactive", "Teaser"],
          ["mobile"]
        ),
        fmt("Peel To Reveal"),
        fmt("Scratch To Reveal"),
        fmt("Image Flow"),
        fmt("Scratch-to-Win"),
        fmt("Catalog"),
        fmt(
          "Carousel",
          undefined,
          "Showcase multiple products or storytelling chapters.",
          ["E-commerce", "Multi-product", "Swipable"],
          ["mobile", "tablet", "desktop"],
          [
            { id: "slides", type: "image", label: "Carousel Cards", multiple: true }
          ]
        ),
        fmt("Image Slider"),
        fmt("Shake to Scroll"),
        fmt(
          "360 Video",
          undefined,
          "Offer a fully immersive 360-degree environment.",
          ["Immersive", "VR", "Storytelling"],
          ["mobile", "tablet"],
          [
            { id: "env_vid", type: "video", label: "Environment Video", count: 1 }
          ]
        ),
        // ── Registered format — ID must match registry type key ──────────────
        {
          id: 'flipcard',
          name: 'Flip Card',
          dimension: '300x600',
          longDescription: 'An interactive 3D card with tilt-on-hover and click-to-flip reveal. Perfect for before/after reveals, exclusive offers, and interactive brand storytelling.',
          tags: ['Interactive', '3D', 'Gamification', 'Brand Awareness', 'Rich Media', 'Engagement'],
          previewModes: ['mobile', 'tablet', 'desktop'] as ('mobile' | 'tablet' | 'desktop')[],
          bestPractices: [
            'Use a compelling teaser headline on the front to drive curiosity',
            'Reveal the full offer or call-to-action on the back',
            'Keep front image high-contrast for instant visual impact',
            'CTA button should have a clear action verb (Shop, Claim, Explore)',
          ],
        },
        fmt("Image Strip"),
        fmt("Spin Cube"),
        fmt("Photosphere"),
        fmt("3D Photo"),
        fmt("Survey Unit", "1024x768"),
        fmt("Survey Builder with Branching", "1024x768"),
        fmt("Video Wall"),
        fmt("Interstitial Puzzle"),
        fmt("Pixel Board"),
      ],
    },
    {
      id: "size-1-2",
      key: "interstitials",
      name: "Interstitials",
      description:
        "Capture 100% attention of your audience, with these 320x480 full screen experiences.",
      dimension: "320x480",
      formats: [
        fmt("Catalog"),
        fmt(
          "Ferris Wheel",
          undefined,
          "A visually striking carousel variant where products rotate in a circular 'Ferris Wheel' motion. This high-impact format is exceptional for showing off a seasonal collection or a variety of product colors. It captures attention through its unique mechanical motion and invites users to spin and explore.",
          ["Visual Impact", "Product Discovery", "Interactive", "Creative", "Retail"],
          ["mobile", "tablet"]
        ),
        fmt("Image Flow"),
        fmt("VideoWall Youtube"),
        fmt("Music Player"),
        fmt("Scratch To Reveal"),
        fmt("Peel-to-Reveal"),
        fmt(
          "Trivia",
          undefined,
          "Test your audience's knowledge with a quick-fire trivia challenge. This format is a powerhouse for educational campaigns or brand myth-busting. By engaging the user's competitive spirit, it ensures high dwell time and creates a memorable brand association through active learning.",
          ["Education", "Gamification", "High Retention", "Awareness", "Engagement"],
          ["mobile", "tablet", "desktop"]
        ),
        fmt("Flash Sale"),
        fmt("Videoflow"),
        fmt("Scratch-to-Win"),
        fmt("Swipe to Install"),
        fmt("Shake To Reveal"),
        fmt(
          "Swipe to Like",
          undefined,
          "Borrowing from popular social mechanics, this format lets users swipe left or right on products to express interest. It provides brands with invaluable preference data in a fun, frictionless way. Perfect for fashion, food, or any category where personal taste drives the purchase decision.",
          ["Social Mechanic", "Preference Data", "Frictionless", "Consumer Insights", "Product Discovery"],
          ["mobile"]
        ),
        fmt("Lamp Drag"),
        fmt("Crack to Reveal"),
        fmt("Pull Up"),
        fmt("Image Strip"),
        fmt("Continuous Shake"),
        fmt("Video Wall"),
        fmt("Click to Map"),
        fmt("Drag to Reveal"),
        fmt("Vote Swipe"),
        fmt("Vote Click"),
        fmt("Giftbox"),
        fmt("Theater"),
        fmt("Black Board"),
        fmt("Likert Scale"),
        fmt("Sign Up"),
        fmt("Carousel"),
        fmt("Survey", "320x480 IBV"),
        fmt("Survey", "320x480"),
        fmt("Survey Builder with Branching", "320x480 IBV"),
        fmt("Survey Builder with Branching", "320x480"),
        fmt("THRESHOLD360", "320x480"),
        fmt("Survey V2", "320x480 IBV"),
        fmt("Survey Builder with Branching - Multiple End Card"),
        fmt("Shake To Reveal - Fullscreen"),
      ],
    },
    {
      id: "size-1-3",
      key: "banner",
      name: "Banner",
      description:
        "320x50 Interactive banners. Engage with the audience using innovative banner experiences.",
      dimension: "320x50",
      formats: [
        fmt("Quiz"),
        fmt("Scratch to Reveal"),
        fmt("Peel to Reveal"),
        fmt("Shake To Reveal"),
        fmt("Continuous Shake"),
        fmt("Carousel"),
        fmt("Hotspot"),
        fmt("Scheduler"),
      ],
    },
    {
      id: "size-1-4",
      key: "squares",
      name: "Squares",
      description:
        "300x250 Square interactive formats that engage with the user using reveal experiences.",
      dimension: "300x250",
      formats: [
        fmt("Swipe to Like"),
        fmt("Shake to Reveal"),
        fmt("Scratch To Reveal"),
        fmt("Video Wall"),
        fmt("Video Scratch"),
        fmt("Image Strip"),
        fmt("Scratch To Scroll"),
        fmt("Pull Up"),
        fmt("Theater"),
        fmt("Black Board"),
        fmt("Roundabout"),
        fmt("Likert Scale"),
        fmt("Carousel"),
        fmt("Swipe to Match"),
        fmt("3D Photo"),
        fmt("Quiz-n-Win"),
        fmt("Quiz Up"),
        fmt("Vote Swipe"),
        fmt("Vote Click"),
        fmt("Survey", "300x250 Banner"),
        fmt("Survey", "300x250 IBV"),
        fmt("Music Player"),
        fmt("Video Wall - Square"),
        fmt("Click to Map", "300x250"),
        fmt("Survey Builder with Branching", "300x250 Banner"),
        fmt("Survey Builder with Branching", "300x250 IBV"),
        fmt("Carousel with Custom CTA Button"),
        fmt("THRESHOLD360", "300x250"),
        fmt("Survey Builder with Branching V2", "300x250 Banner"),
        fmt("Survey V2", "300x250 IBV"),
        fmt("Survey Builder with Branching V3 - Random Q1"),
      ],
    },
    {
      id: "size-1-5",
      key: "expandable-banner",
      name: "Expandable Banner",
      description:
        "Starts off as a standard banner which expands politely on user engagement to a full screen interstitial.",
      formats: [
        fmt("Sleigh In"),
        fmt("Scratch-to-Reveal"),
        fmt("Scratch-to-Win"),
        fmt("Peel to Reveal"),
        fmt("Catalog"),
        fmt("Expand to Scroll"),
      ],
    },
  ],
};

const animatedAds: AdCategory = {
  id: "cat-2",
  key: "animated",
  name: "Animated Ads",
  description:
    "Build animated ads quicker and easier than ever with our market leading Animated Ad experiences.",
  icon: "✨",
  color: "#ec4899",
  hasAdSizes: true,
  formats: [],
  adSizes: [
    // ─── SIZE 2-1: Responsive ───────────────────
    {
      id: "size-2-1",
      key: "responsive",
      name: "Responsive",
      description: "Responsive animated ad formats.",
      formats: [
        fmt("Fade In", undefined, "A four-panel fade-in format supporting rich graphic and text content across each slide. Each panel smoothly fades into view, making it ideal for sequential storytelling or showcasing multiple products in a polished presentation style.", ["brand-awareness", "product-launch", "retail", "fashion", "e-commerce", "storytelling", "multi-message", "lifestyle"], ["mobile", "tablet", "desktop"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "panel_4", type: "group", label: "Panel 4", fields: [
            { id: "p4_image", type: "image", label: "Panel 4 Image" },
            { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
            { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
            { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
            { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
        ], [
          "Sequence panels to tell a progressive story from intro to CTA",
          "Use consistent colour palettes across panels for visual cohesion",
          "Keep text overlay minimal so the fade transition stays elegant"
        ]),

        fmt("Spin Cube", undefined, "A four-panel spinning cube that rotates through graphic and text content to deliver a dynamic ad message. Each face of the cube presents a unique visual, creating an engaging 3D experience that holds user attention across multiple frames.", ["product-showcase", "new-arrival", "retail", "fashion", "gaming", "interactive", "engagement", "multi-message"], ["mobile", "tablet", "desktop"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "panel_4", type: "group", label: "Panel 4", fields: [
            { id: "p4_image", type: "image", label: "Panel 4 Image" },
            { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
            { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
            { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
            { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
        ], [
          "Use distinct visuals per face to reward the spinning interaction",
          "Keep panel text short so it reads clearly mid-rotation",
          "Ensure the CTA stands out against all four panel backgrounds"
        ]),
      ],
    },

    // ─── SIZE 2-2: Interstitials ────────────────
    {
      id: "size-2-2",
      key: "interstitials",
      name: "Interstitials",
      description: "Full-screen animated ad experiences.",
      formats: [
        fmt("Slide In", undefined, "Four panels that slide into view sequentially, blending graphic and text content into a smooth full-screen experience. The sliding motion creates a natural reading flow, guiding users through each message before landing on a strong call to action.", ["brand-awareness", "product-launch", "retail", "e-commerce", "storytelling", "multi-message", "fashion", "lifestyle"], ["mobile", "tablet"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "panel_4", type: "group", label: "Panel 4", fields: [
            { id: "p4_image", type: "image", label: "Panel 4 Image" },
            { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
            { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
            { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
            { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
        ], [
          "Design each panel to build on the previous for a story arc",
          "Align slide direction with the user's natural reading flow",
          "Place the strongest CTA on the final panel for maximum impact"
        ]),

        fmt("Storm In", undefined, "Multi-panel interstitial where content dramatically storms in from different directions to build the complete ad. The high-energy entrance animations grab attention instantly, making this a strong pick for product launches and bold brand statements.", ["high-impact", "product-launch", "entertainment", "gaming", "automotive", "engagement", "brand-awareness", "conversion"], ["mobile", "tablet"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use bold, high-contrast imagery that matches the storm energy",
          "Keep copy punchy and short so it lands with the fast animation",
          "Test panel entry directions to avoid overlapping content on load"
        ]),

        fmt("Roll In", undefined, "Full-screen interstitial with a background image onto which graphic and text content rolls in to complete the message. The smooth rolling animation creates an elegant reveal, well suited for lifestyle brands, travel, and aspirational campaigns.", ["brand-awareness", "lifestyle", "travel", "food", "retail", "product-showcase", "fashion", "conversion"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use a high-contrast background so rolling text stays readable",
          "Keep body copy brief to let the visual do the storytelling",
          "Place the CTA where it lands naturally after the roll animation"
        ]),

        fmt("Sleigh In", undefined, "Full-screen interstitial where graphic and text content sleighs in over a background image to complete the ad narrative. The playful sliding motion adds a festive touch, making it a natural fit for holiday promotions and seasonal gift campaigns.", ["seasonal", "holiday", "retail", "e-commerce", "gift-promotion", "fashion", "lifestyle", "new-arrival"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Pair festive background imagery with warm seasonal colour tones",
          "Lean into holiday urgency with time-sensitive CTA copy",
          "Ensure text background opacity keeps copy legible over busy scenes"
        ]),

        fmt("Slide In (Variant)", undefined, "A variant of the four-panel slide-in interstitial with alternate transition behaviour for added visual variety. Offers the same multi-panel storytelling power with a fresh animation twist to keep campaigns feeling new.", ["brand-awareness", "product-launch", "retail", "e-commerce", "storytelling", "multi-message", "fashion", "lifestyle"], ["mobile", "tablet"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "panel_4", type: "group", label: "Panel 4", fields: [
            { id: "p4_image", type: "image", label: "Panel 4 Image" },
            { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
            { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
            { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
            { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
        ], [
          "A/B test this variant against the standard Slide In for lift",
          "Use contrasting imagery per panel to emphasise the transitions",
          "Anchor the key offer on panel 1 to hook attention immediately"
        ]),

        fmt("Crash In", undefined, "Full-screen interstitial where graphic and text content crashes forcefully onto a background image for high-impact delivery. The dramatic crash animation demands instant attention, perfect for bold product drops and action-oriented campaigns.", ["high-impact", "gaming", "automotive", "entertainment", "product-launch", "engagement", "conversion", "sports"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use bold sans-serif headlines that match the forceful animation",
          "Pick a dark or dramatic background to amplify the crash effect",
          "Keep the CTA action-oriented with verbs like 'Get' or 'Grab'"
        ]),

        fmt("Crack In", undefined, "Full-screen interstitial where the background image cracks open to reveal graphic and text content beneath. The dramatic crack-and-reveal effect builds suspense, making it ideal for teasers, game launches, and cinematic product reveals.", ["high-impact", "reveal", "gaming", "entertainment", "product-launch", "automotive", "engagement", "sports"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Design the background as a teaser that hints at the reveal",
          "Use a contrasting inner layer to maximize the crack payoff",
          "Time the CTA to appear right after the crack for peak curiosity"
        ]),

        fmt("Transition Effect", undefined, "Full-screen interstitial using a smooth visual transition to bring graphic and text content into frame over a background image. The polished, fluid motion lends a premium feel suited to beauty, fashion, and lifestyle brand storytelling.", ["brand-awareness", "lifestyle", "travel", "beauty", "fashion", "product-showcase", "retail", "conversion"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Choose aspirational imagery that complements the smooth motion",
          "Limit text to one headline and one line of body for elegance",
          "Match text colour to the brand palette for a premium finish"
        ]),

        fmt("Shutter", undefined, "Full-screen interstitial that uses a shutter-style animation to unveil graphic and text content over a background image. The cinematic shutter reveal adds a sense of drama and sophistication, ideal for fashion drops and beauty launches.", ["reveal", "product-launch", "beauty", "fashion", "retail", "brand-awareness", "lifestyle", "new-arrival"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use a hero product shot as the revealed layer for max impact",
          "Keep the background simple so the shutter reveal feels clean",
          "Pair with an aspirational headline that builds anticipation"
        ]),

        fmt("Pinwheel", undefined, "Full-screen interstitial with a spinning pinwheel animation that brings graphic and text content into view. The playful, whimsical motion appeals to younger audiences and works well for fun, lighthearted campaigns in food, kids, and entertainment.", ["brand-awareness", "kids", "entertainment", "retail", "food", "lifestyle", "seasonal", "engagement"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use bright, saturated colours that complement the spin energy",
          "Keep copy playful and short to match the whimsical animation",
          "Ensure the CTA button is large enough for easy tapping on mobile"
        ]),

        fmt("Snow", undefined, "Full-screen interstitial where content drifts in over a background image with a gentle snow-fall animation effect. The calm, wintry ambiance sets the mood for seasonal retail, holiday gift guides, and end-of-year promotional campaigns.", ["seasonal", "holiday", "retail", "e-commerce", "gift-promotion", "winter", "fashion", "lifestyle"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use cool-toned or wintry backgrounds to reinforce the snowfall",
          "Leverage seasonal urgency in headlines like 'Last Chance Gifts'",
          "Ensure white text has a semi-transparent bg over snowy imagery"
        ]),

        fmt("Thunder", undefined, "Full-screen interstitial with a bold thunder-strike animation that delivers graphic and text content with high energy. The electrifying entrance creates instant impact, ideal for gaming, sports, and high-adrenaline product campaigns.", ["high-impact", "gaming", "sports", "automotive", "entertainment", "product-launch", "engagement", "conversion"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use dark, moody backgrounds to make the thunder flash pop",
          "Keep the headline to 3–5 power words for maximum punch",
          "Pair a high-contrast CTA button with an action verb like 'Strike'"
        ]),
      ],
    },

    // ─── SIZE 2-3: Banner ───────────────────────
    {
      id: "size-2-3",
      key: "banner",
      name: "Banner",
      description: "Animated banner formats.",
      formats: [
        fmt("Storm In", undefined, "Multi-panel banner where content storms in from multiple directions, assembling the full ad message on screen. The dynamic multi-directional entrances make this banner format stand out in crowded page layouts and drive high engagement.", ["high-impact", "product-launch", "entertainment", "gaming", "automotive", "brand-awareness", "conversion", "engagement"], ["mobile", "tablet", "desktop"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use bold, cropped visuals that read well at banner dimensions",
          "Keep each panel's message to a single short phrase",
          "Ensure the final assembled layout has a clear visual hierarchy"
        ]),

        fmt("Roll In", undefined, "Animated banner where content rolls in over a background image to complete the ad message. The elegant rolling motion adds polish to standard banner placements, ideal for lifestyle and retail campaigns seeking premium presentation.", ["brand-awareness", "lifestyle", "travel", "food", "retail", "product-showcase", "fashion", "conversion"], ["mobile", "tablet", "desktop"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Crop the background image to focus on the key visual at banner ratio",
          "Use a single headline — skip body text for narrow banner heights",
          "Anchor the CTA to the right side for natural left-to-right flow"
        ]),

        fmt("Display Shelf", undefined, "Banner showcasing multiple products on an animated shelf layout with individual product links. Each product slot rolls into view on a shared background, creating a mini storefront experience that drives multi-product discovery.", ["e-commerce", "retail", "product-showcase", "multi-product", "fashion", "food", "deal-seekers", "conversion"], ["mobile", "tablet", "desktop"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "shelf_label", type: "text", label: "Shelf Label", placeholder: "Featured Products..." },
          { id: "shelf_label_color", type: "color", label: "Shelf Label Text Color" },
          { id: "shelf_label_bg", type: "color", label: "Shelf Label Background Color" },
          { id: "product_1", type: "group", label: "Product 1", fields: [
            { id: "prod1_image", type: "image", label: "Product Image" },
            { id: "prod1_url", type: "redirect", label: "Product Link URL", placeholder: "https://..." },
            { id: "prod1_name", type: "text", label: "Product Name", placeholder: "Product name..." },
            { id: "prod1_name_color", type: "color", label: "Product Name Color" },
            { id: "prod1_name_bg", type: "color", label: "Product Name Background Color" },
          ]},
          { id: "product_2", type: "group", label: "Product 2", fields: [
            { id: "prod2_image", type: "image", label: "Product Image" },
            { id: "prod2_url", type: "redirect", label: "Product Link URL", placeholder: "https://..." },
            { id: "prod2_name", type: "text", label: "Product Name", placeholder: "Product name..." },
            { id: "prod2_name_color", type: "color", label: "Product Name Color" },
            { id: "prod2_name_bg", type: "color", label: "Product Name Background Color" },
          ]},
          { id: "product_3", type: "group", label: "Product 3", fields: [
            { id: "prod3_image", type: "image", label: "Product Image" },
            { id: "prod3_url", type: "redirect", label: "Product Link URL", placeholder: "https://..." },
            { id: "prod3_name", type: "text", label: "Product Name", placeholder: "Product name..." },
            { id: "prod3_name_color", type: "color", label: "Product Name Color" },
            { id: "prod3_name_bg", type: "color", label: "Product Name Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
        ], [
          "Use clean product photography on a transparent or white base",
          "Keep product names to 2–3 words so labels stay readable",
          "Highlight a price or discount badge in the shelf label area"
        ]),

        fmt("Count Down", undefined, "Full-screen countdown banner with a background image, animated timer, and configurable timezone to drive urgency. Perfect for flash sales, limited-time offers, and event promotions where a ticking clock motivates immediate action.", ["flash-sale", "limited-offer", "retail", "e-commerce", "event-promotion", "urgency", "seasonal", "deal-seekers"], ["mobile", "tablet", "desktop"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Limited time offer..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "countdown_date", type: "date", label: "Countdown Target Date", placeholder: "2025-12-31T00:00:00" },
          { id: "countdown_tz", type: "select", label: "Timezone", options: [
            { value: "UTC", label: "UTC" },
            { value: "America/New_York", label: "Eastern (ET)" },
            { value: "America/Chicago", label: "Central (CT)" },
            { value: "America/Denver", label: "Mountain (MT)" },
            { value: "America/Los_Angeles", label: "Pacific (PT)" },
            { value: "Europe/London", label: "London (GMT)" },
            { value: "Europe/Paris", label: "Paris (CET)" },
            { value: "Asia/Tokyo", label: "Tokyo (JST)" },
            { value: "Asia/Kolkata", label: "India (IST)" },
            { value: "Australia/Sydney", label: "Sydney (AEST)" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Set the deadline during peak shopping hours for your audience",
          "Use bold, contrasting colours for the timer to draw the eye",
          "Keep the headline action-oriented to amplify the urgency"
        ]),

        fmt("Countdown", "395x32", "Compact 395×32 countdown banner with a timer and background image, ideal for thin persistent placements. The ticking countdown creates urgency in a slim format that works perfectly as a sticky mobile header or inline strip.", ["flash-sale", "limited-offer", "retail", "e-commerce", "urgency", "deal-seekers", "impulse-buyers", "seasonal"], ["mobile", "tablet"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Limited time offer..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "countdown_date", type: "date", label: "Countdown Target Date", placeholder: "2025-12-31T00:00:00" },
          { id: "countdown_tz", type: "select", label: "Timezone", options: [
            { value: "UTC", label: "UTC" },
            { value: "America/New_York", label: "Eastern (ET)" },
            { value: "America/Chicago", label: "Central (CT)" },
            { value: "America/Denver", label: "Mountain (MT)" },
            { value: "America/Los_Angeles", label: "Pacific (PT)" },
            { value: "Europe/London", label: "London (GMT)" },
            { value: "Europe/Paris", label: "Paris (CET)" },
            { value: "Asia/Tokyo", label: "Tokyo (JST)" },
            { value: "Asia/Kolkata", label: "India (IST)" },
            { value: "Australia/Sydney", label: "Sydney (AEST)" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Keep headline to 4–5 words max to fit the slim 395×32 strip",
          "Use bold timer digits that stay legible at small banner height",
          "Test the CTA tap area is large enough on mobile despite the size"
        ]),
      ],
    },

    // ─── SIZE 2-4: Squares ──────────────────────
    {
      id: "size-2-4",
      key: "squares",
      name: "Squares",
      description: "Animated square ad formats.",
      formats: [
        fmt("Slide In", undefined, "Square four-panel format where each panel slides into view carrying its own graphic, text, and destination link. The slide motion within a square frame creates a compact storytelling canvas, ideal for in-feed and sidebar placements.", ["brand-awareness", "product-launch", "retail", "e-commerce", "storytelling", "multi-message", "fashion", "lifestyle"], ["mobile", "tablet", "desktop"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "panel_4", type: "group", label: "Panel 4", fields: [
            { id: "p4_image", type: "image", label: "Panel 4 Image" },
            { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
            { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
            { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
            { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
        ], [
          "Crop images to a 1:1 ratio before uploading for clean framing",
          "Use each panel for one distinct message or product highlight",
          "Ensure text stays within the safe zone of the square edges"
        ]),

        fmt("Storm In", undefined, "Square multi-panel format where content storms in from different directions to assemble the ad. The energetic multi-directional entries pack high impact into a compact square placement perfect for in-feed and sidebar visibility.", ["high-impact", "product-launch", "gaming", "automotive", "entertainment", "brand-awareness", "engagement", "conversion"], ["mobile", "tablet", "desktop"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use high-contrast product shots that pop against busy feeds",
          "Keep panel copy to 2–3 words so it lands with the fast motion",
          "Test that panels don't overlap during the storm-in sequence"
        ]),

        fmt("Transition Effect", undefined, "Square format using a polished visual transition to bring content over a background image. The smooth, refined animation gives a premium feel inside a compact square canvas — great for beauty, fashion, and product showcases.", ["brand-awareness", "lifestyle", "travel", "beauty", "fashion", "product-showcase", "retail", "conversion"], ["mobile", "tablet", "desktop"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
          { id: "body_text_color", type: "color", label: "Body Text Color" },
          { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Use a 1:1 hero image that fills the square frame beautifully",
          "Limit text to one headline to preserve the premium aesthetic",
          "Pick soft, complementary text colours that feel on-brand"
        ]),

        fmt("Video Cube", undefined, "A four-panel spinning cube where each face plays a video clip, creating an immersive 3D ad experience. Video on every face maximises engagement time, making it a standout choice for trailers, product demos, and brand storytelling.", ["video", "immersive", "product-showcase", "automotive", "travel", "entertainment", "engagement", "brand-awareness"], ["mobile", "tablet"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_video", type: "video", label: "Panel 1 Video" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_video", type: "video", label: "Panel 2 Video" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_video", type: "video", label: "Panel 3 Video" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "panel_4", type: "group", label: "Panel 4", fields: [
            { id: "p4_video", type: "video", label: "Panel 4 Video" },
            { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
            { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
            { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
            { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Watch Now" },
        ], [
          "Keep each video clip under 10 seconds for fast cube rotations",
          "Open each clip with the key visual in the first 2 seconds",
          "Compress videos for mobile to avoid slow load times on 4G"
        ]),

        fmt("Spin Cube", undefined, "Square four-panel spinning cube rotating through graphic and text content for an engaging 3D presentation. The interactive spin invites users to explore each face, making it effective for new arrivals, product ranges, and multi-feature showcases.", ["product-showcase", "new-arrival", "retail", "fashion", "gaming", "interactive", "engagement", "multi-message"], ["mobile", "tablet", "desktop"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "panel_4", type: "group", label: "Panel 4", fields: [
            { id: "p4_image", type: "image", label: "Panel 4 Image" },
            { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
            { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
            { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
            { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
        ], [
          "Showcase one product per face for a mini catalogue effect",
          "Use square-cropped images so nothing clips during rotation",
          "Place the CTA on the first and last face for double exposure"
        ]),

        fmt("Count Down", undefined, "Square countdown format with a full background image and animated timer to create urgency in a compact placement. The ticking clock in a square frame works well in-feed or in sidebar slots where urgency-driven campaigns need to grab attention fast.", ["flash-sale", "limited-offer", "retail", "e-commerce", "event-promotion", "urgency", "seasonal", "deal-seekers"], ["mobile", "tablet", "desktop"], [
          { id: "bg_image", type: "image", label: "Background Image" },
          { id: "headline", type: "text", label: "Headline", placeholder: "Limited time offer..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "countdown_date", type: "date", label: "Countdown Target Date", placeholder: "2025-12-31T00:00:00" },
          { id: "countdown_tz", type: "select", label: "Timezone", options: [
            { value: "UTC", label: "UTC" },
            { value: "America/New_York", label: "Eastern (ET)" },
            { value: "America/Chicago", label: "Central (CT)" },
            { value: "America/Denver", label: "Mountain (MT)" },
            { value: "America/Los_Angeles", label: "Pacific (PT)" },
            { value: "Europe/London", label: "London (GMT)" },
            { value: "Europe/Paris", label: "Paris (CET)" },
            { value: "Asia/Tokyo", label: "Tokyo (JST)" },
            { value: "Asia/Kolkata", label: "India (IST)" },
            { value: "Australia/Sydney", label: "Sydney (AEST)" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Centre the timer prominently in the square for instant clarity",
          "Use a product or lifestyle background that hints at the offer",
          "Match the countdown timezone to your primary target market"
        ]),

        fmt("360 Video", undefined, "Immersive square format featuring a 360° video that users can explore in all directions. Gyroscope and touch-driven navigation puts the viewer in control, ideal for virtual tours, destination marketing, and experiential brand campaigns.", ["immersive", "travel", "automotive", "real-estate", "experiential", "brand-awareness", "explorers", "tech-savvy"], ["mobile", "tablet"], [
          { id: "video_src", type: "video", label: "360° Video File" },
          { id: "headline", type: "text", label: "Overlay Headline", placeholder: "Explore our world..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Explore Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Optimise the 360° video for mobile file size under 5 MB",
          "Set the default view angle to the most compelling scene",
          "Add a subtle 'drag to explore' hint for first-time users"
        ]),

        fmt("Photosphere", undefined, "Interactive photosphere format that places the viewer inside a 360° image environment. Touch and gyroscope navigation let users look around freely, creating an immersive showcase perfect for hotels, venues, and real-estate walkthroughs.", ["immersive", "travel", "real-estate", "hospitality", "experiential", "brand-awareness", "explorers", "tech-savvy"], ["mobile", "tablet"], [
          { id: "photo_src", type: "video", label: "Photosphere File (360° Image)" },
          { id: "headline", type: "text", label: "Overlay Headline", placeholder: "Step inside..." },
          { id: "headline_color", type: "color", label: "Headline Text Color" },
          { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Explore Now" },
          { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
        ], [
          "Capture the photosphere in high resolution for crisp panning",
          "Point the default view at the room's most impressive feature",
          "Keep the overlay headline short so it doesn't block the scene"
        ]),

        fmt("THRESHOLD360 CUBE", "300x250", "A 300×250 four-panel cube powered by Threshold360, combining spatial imagery with interactive panel content. The fixed 300×250 size fits standard ad slots while offering an immersive cube experience that stands out in programmatic placements.", ["immersive", "real-estate", "hospitality", "travel", "retail", "product-showcase", "explorers", "brand-awareness"], ["mobile", "tablet"], [
          { id: "panel_1", type: "group", label: "Panel 1", fields: [
            { id: "p1_image", type: "image", label: "Panel 1 Image" },
            { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
            { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
            { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
            { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
          ]},
          { id: "panel_2", type: "group", label: "Panel 2", fields: [
            { id: "p2_image", type: "image", label: "Panel 2 Image" },
            { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
            { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
            { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
            { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
          ]},
          { id: "panel_3", type: "group", label: "Panel 3", fields: [
            { id: "p3_image", type: "image", label: "Panel 3 Image" },
            { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
            { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
            { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
            { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
          ]},
          { id: "panel_4", type: "group", label: "Panel 4", fields: [
            { id: "p4_image", type: "image", label: "Panel 4 Image" },
            { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
            { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
            { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
            { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
          ]},
          { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
        ], [
          "Design panel imagery at 300×250 native resolution for sharpness",
          "Use spatial or interior photography to leverage Threshold360",
          "Keep text overlays small — 300×250 has limited readable area"
        ]),
      ],
    },
  ],
};

// const animatedAds: AdCategory = {
//   id: "cat-2",
//   key: "animated",
//   name: "Animated Ads",
//   description:
//     "Build animated ads quicker and easier than ever with our market leading Animated Ad experiences.",
//   icon: "✨",
//   color: "#ec4899",
//   hasAdSizes: true,
//   formats: [],
//   adSizes: [
//     // ─── SIZE 2-1: Responsive ───────────────────
//     {
//       id: "size-2-1",
//       key: "responsive",
//       name: "Responsive",
//       description: "Responsive animated ad formats.",
//       formats: [
//         fmt("Fade In", undefined, "A four-panel fade-in format supporting rich graphic and text content across each slide.", ["brand-awareness", "product-launch", "retail", "fashion", "e-commerce", "storytelling", "multi-message", "lifestyle"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_4", type: "group", label: "Panel 4", fields: [
//               { id: "p4_image", type: "image", label: "Panel 4 Image" },
//               { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
//               { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
//               { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
//               { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         ]),

//         fmt("Spin Cube", undefined, "A four-panel spinning cube that rotates through graphic and text content to deliver a dynamic ad message.", ["product-showcase", "new-arrival", "retail", "fashion", "gaming", "interactive", "engagement", "multi-message"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_4", type: "group", label: "Panel 4", fields: [
//               { id: "p4_image", type: "image", label: "Panel 4 Image" },
//               { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
//               { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
//               { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
//               { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         ]),
//       ],
//     },

//     // ─── SIZE 2-2: Interstitials ────────────────
//     {
//       id: "size-2-2",
//       key: "interstitials",
//       name: "Interstitials",
//       description: "Full-screen animated ad experiences.",
//       formats: [
//         fmt("Slide In", undefined, "Four panels that slide into view sequentially, blending graphic and text content into a smooth full-screen experience.", ["brand-awareness", "product-launch", "retail", "e-commerce", "storytelling", "multi-message", "fashion", "lifestyle"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_4", type: "group", label: "Panel 4", fields: [
//               { id: "p4_image", type: "image", label: "Panel 4 Image" },
//               { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
//               { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
//               { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
//               { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         ]),

//         fmt("Storm In", undefined, "Multi-panel format where content dramatically storms in from different directions to build the complete ad.", ["high-impact", "product-launch", "entertainment", "gaming", "automotive", "engagement", "brand-awareness", "conversion"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Roll In", undefined, "Full-screen format with a background image onto which graphic and text content rolls in to complete the message.", ["brand-awareness", "lifestyle", "travel", "food", "retail", "product-showcase", "fashion", "conversion"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Sleigh In", undefined, "Full-screen format where graphic and text content sleighs in over a background image to complete the ad narrative.", ["seasonal", "holiday", "retail", "e-commerce", "gift-promotion", "fashion", "lifestyle", "new-arrival"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Slide In (Variant)", undefined, "A variant of the four-panel slide-in format with alternate transition behaviour for added visual variety.", ["brand-awareness", "product-launch", "retail", "e-commerce", "storytelling", "multi-message", "fashion", "lifestyle"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_4", type: "group", label: "Panel 4", fields: [
//               { id: "p4_image", type: "image", label: "Panel 4 Image" },
//               { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
//               { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
//               { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
//               { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         ]),

//         fmt("Crash In", undefined, "Full-screen format where graphic and text content crashes forcefully onto a background image for high-impact delivery.", ["high-impact", "gaming", "automotive", "entertainment", "product-launch", "engagement", "conversion", "sports"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Crack In", undefined, "Full-screen format where the background image cracks open to reveal graphic and text content beneath.", ["high-impact", "reveal", "gaming", "entertainment", "product-launch", "automotive", "engagement", "sports"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Transition Effect", undefined, "Full-screen format using a smooth visual transition to bring graphic and text content into frame over a background image.", ["brand-awareness", "lifestyle", "travel", "beauty", "fashion", "product-showcase", "retail", "conversion"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Shutter", undefined, "Full-screen format that uses a shutter-style animation to unveil graphic and text content over a background image.", ["reveal", "product-launch", "beauty", "fashion", "retail", "brand-awareness", "lifestyle", "new-arrival"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Pinwheel", undefined, "Full-screen format with a spinning pinwheel animation that brings graphic and text content into view.", ["brand-awareness", "kids", "entertainment", "retail", "food", "lifestyle", "seasonal", "engagement"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Snow", undefined, "Full-screen format where content drifts in over a background image with a gentle snow-fall animation effect.", ["seasonal", "holiday", "retail", "e-commerce", "gift-promotion", "winter", "fashion", "lifestyle"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Thunder", undefined, "Full-screen format with a bold thunder-strike animation that delivers graphic and text content with high energy.", ["high-impact", "gaming", "sports", "automotive", "entertainment", "product-launch", "engagement", "conversion"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),
//       ],
//     },

//     // ─── SIZE 2-3: Banner ───────────────────────
//     {
//       id: "size-2-3",
//       key: "banner",
//       name: "Banner",
//       description: "Animated banner formats.",
//       formats: [
//         fmt("Storm In", undefined, "Multi-panel banner where content storms in from multiple directions, assembling the full ad message on screen.", ["high-impact", "product-launch", "entertainment", "gaming", "automotive", "brand-awareness", "conversion", "engagement"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Roll In", undefined, "Animated banner where content rolls in over a background image to complete the ad message.", ["brand-awareness", "lifestyle", "travel", "food", "retail", "product-showcase", "fashion", "conversion"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Display Shelf", undefined, "Full-screen banner showcasing multiple products on an animated shelf layout with individual product links.", ["e-commerce", "retail", "product-showcase", "multi-product", "fashion", "food", "deal-seekers", "conversion"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "shelf_label", type: "text", label: "Shelf Label", placeholder: "Featured Products..." },
//           { id: "shelf_label_color", type: "color", label: "Shelf Label Text Color" },
//           { id: "shelf_label_bg", type: "color", label: "Shelf Label Background Color" },
//           {
//             id: "product_1", type: "group", label: "Product 1", fields: [
//               { id: "prod1_image", type: "image", label: "Product Image" },
//               { id: "prod1_url", type: "redirect", label: "Product Link URL", placeholder: "https://..." },
//               { id: "prod1_name", type: "text", label: "Product Name", placeholder: "Product name..." },
//               { id: "prod1_name_color", type: "color", label: "Product Name Color" },
//               { id: "prod1_name_bg", type: "color", label: "Product Name Background Color" },
//             ]
//           },
//           {
//             id: "product_2", type: "group", label: "Product 2", fields: [
//               { id: "prod2_image", type: "image", label: "Product Image" },
//               { id: "prod2_url", type: "redirect", label: "Product Link URL", placeholder: "https://..." },
//               { id: "prod2_name", type: "text", label: "Product Name", placeholder: "Product name..." },
//               { id: "prod2_name_color", type: "color", label: "Product Name Color" },
//               { id: "prod2_name_bg", type: "color", label: "Product Name Background Color" },
//             ]
//           },
//           {
//             id: "product_3", type: "group", label: "Product 3", fields: [
//               { id: "prod3_image", type: "image", label: "Product Image" },
//               { id: "prod3_url", type: "redirect", label: "Product Link URL", placeholder: "https://..." },
//               { id: "prod3_name", type: "text", label: "Product Name", placeholder: "Product name..." },
//               { id: "prod3_name_color", type: "color", label: "Product Name Color" },
//               { id: "prod3_name_bg", type: "color", label: "Product Name Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         ]),

//         fmt("Count Down", undefined, "Full-screen countdown banner with a background image, animated timer, and configurable timezone to drive urgency.", ["flash-sale", "limited-offer", "retail", "e-commerce", "event-promotion", "urgency", "seasonal", "deal-seekers"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Limited time offer..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "countdown_date", type: "date", label: "Countdown Target Date", placeholder: "2025-12-31T00:00:00" },
//           {
//             id: "countdown_tz", type: "select", label: "Timezone", options: [
//               { value: "UTC", label: "UTC" },
//               { value: "America/New_York", label: "Eastern (ET)" },
//               { value: "America/Chicago", label: "Central (CT)" },
//               { value: "America/Denver", label: "Mountain (MT)" },
//               { value: "America/Los_Angeles", label: "Pacific (PT)" },
//               { value: "Europe/London", label: "London (GMT)" },
//               { value: "Europe/Paris", label: "Paris (CET)" },
//               { value: "Asia/Tokyo", label: "Tokyo (JST)" },
//               { value: "Asia/Kolkata", label: "India (IST)" },
//               { value: "Australia/Sydney", label: "Sydney (AEST)" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Countdown", "395x32", "Compact 395×32 countdown banner with a timer and background image, ideal for thin persistent placements.", ["flash-sale", "limited-offer", "retail", "e-commerce", "urgency", "deal-seekers", "impulse-buyers", "seasonal"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Limited time offer..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "countdown_date", type: "text", label: "Countdown Target Date", placeholder: "2025-12-31T00:00:00" },
//           {
//             id: "countdown_tz", type: "select", label: "Timezone", options: [
//               { value: "UTC", label: "UTC" },
//               { value: "America/New_York", label: "Eastern (ET)" },
//               { value: "America/Chicago", label: "Central (CT)" },
//               { value: "America/Denver", label: "Mountain (MT)" },
//               { value: "America/Los_Angeles", label: "Pacific (PT)" },
//               { value: "Europe/London", label: "London (GMT)" },
//               { value: "Europe/Paris", label: "Paris (CET)" },
//               { value: "Asia/Tokyo", label: "Tokyo (JST)" },
//               { value: "Asia/Kolkata", label: "India (IST)" },
//               { value: "Australia/Sydney", label: "Sydney (AEST)" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),
//       ],
//     },

//     // ─── SIZE 2-4: Squares ──────────────────────
//     {
//       id: "size-2-4",
//       key: "squares",
//       name: "Squares",
//       description: "Animated square ad formats.",
//       formats: [
//         fmt("Slide In", undefined, "Square four-panel format where each panel slides into view carrying its own graphic, text, and destination link.", ["brand-awareness", "product-launch", "retail", "e-commerce", "storytelling", "multi-message", "fashion", "lifestyle"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_4", type: "group", label: "Panel 4", fields: [
//               { id: "p4_image", type: "image", label: "Panel 4 Image" },
//               { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
//               { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
//               { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
//               { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         ]),

//         fmt("Storm In", undefined, "Square multi-panel format where content storms in from different directions to assemble the ad.", ["high-impact", "product-launch", "gaming", "automotive", "entertainment", "brand-awareness", "engagement", "conversion"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Transition Effect", undefined, "Square format using a polished visual transition to bring content over a background image.", ["brand-awareness", "lifestyle", "travel", "beauty", "fashion", "product-showcase", "retail", "conversion"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Enter headline..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "body_text", type: "text", label: "Body Text", placeholder: "Enter body text..." },
//           { id: "body_text_color", type: "color", label: "Body Text Color" },
//           { id: "body_text_bg", type: "color", label: "Body Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Video Cube", undefined, "A four-panel spinning cube where each face plays a video clip, creating an immersive 3D ad experience.", ["video", "immersive", "product-showcase", "automotive", "travel", "entertainment", "engagement", "brand-awareness"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_video", type: "video", label: "Panel 1 Video" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_video", type: "video", label: "Panel 2 Video" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_video", type: "video", label: "Panel 3 Video" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_4", type: "group", label: "Panel 4", fields: [
//               { id: "p4_video", type: "video", label: "Panel 4 Video" },
//               { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
//               { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
//               { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
//               { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Watch Now" },
//         ]),

//         fmt("Spin Cube", undefined, "Square four-panel spinning cube rotating through graphic and text content for an engaging 3D presentation.", ["product-showcase", "new-arrival", "retail", "fashion", "gaming", "interactive", "engagement", "multi-message"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_4", type: "group", label: "Panel 4", fields: [
//               { id: "p4_image", type: "image", label: "Panel 4 Image" },
//               { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
//               { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
//               { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
//               { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         ]),

//         fmt("Count Down", undefined, "Square countdown format with a full background image and animated timer to create urgency in a compact placement.", ["flash-sale", "limited-offer", "retail", "e-commerce", "event-promotion", "urgency", "seasonal", "deal-seekers"], ["mobile", "tablet", "desktop"], [
//           { id: "bg_image", type: "image", label: "Background Image" },
//           { id: "headline", type: "text", label: "Headline", placeholder: "Limited time offer..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "countdown_date", type: "text", label: "Countdown Target Date", placeholder: "2025-12-31T00:00:00" },
//           {
//             id: "countdown_tz", type: "select", label: "Timezone", options: [
//               { value: "UTC", label: "UTC" },
//               { value: "America/New_York", label: "Eastern (ET)" },
//               { value: "America/Chicago", label: "Central (CT)" },
//               { value: "America/Denver", label: "Mountain (MT)" },
//               { value: "America/Los_Angeles", label: "Pacific (PT)" },
//               { value: "Europe/London", label: "London (GMT)" },
//               { value: "Europe/Paris", label: "Paris (CET)" },
//               { value: "Asia/Tokyo", label: "Tokyo (JST)" },
//               { value: "Asia/Kolkata", label: "India (IST)" },
//               { value: "Australia/Sydney", label: "Sydney (AEST)" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("360 Video", undefined, "Immersive square format featuring a 360° video that users can explore in all directions.", ["immersive", "travel", "automotive", "real-estate", "experiential", "brand-awareness", "explorers", "tech-savvy"], ["mobile", "tablet", "desktop"], [
//           { id: "video_src", type: "video", label: "360° Video File" },
//           { id: "headline", type: "text", label: "Overlay Headline", placeholder: "Explore our world..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Explore Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("Photosphere", undefined, "Interactive photosphere format that places the viewer inside a 360° image environment.", ["immersive", "travel", "real-estate", "hospitality", "experiential", "brand-awareness", "explorers", "tech-savvy"], ["mobile", "tablet", "desktop"], [
//           { id: "photo_src", type: "video", label: "Photosphere File (360° Image)" },
//           { id: "headline", type: "text", label: "Overlay Headline", placeholder: "Step inside..." },
//           { id: "headline_color", type: "color", label: "Headline Text Color" },
//           { id: "headline_bg", type: "color", label: "Headline Text Background Color" },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Explore Now" },
//           { id: "cta_url", type: "redirect", label: "CTA Landing Page URL", placeholder: "https://..." },
//         ]),

//         fmt("THRESHOLD360 CUBE", "300x250", "A 300×250 four-panel cube powered by Threshold360, combining spatial imagery with interactive panel content.", ["immersive", "real-estate", "hospitality", "travel", "retail", "product-showcase", "explorers", "brand-awareness"], ["mobile", "tablet", "desktop"], [
//           {
//             id: "panel_1", type: "group", label: "Panel 1", fields: [
//               { id: "p1_image", type: "image", label: "Panel 1 Image" },
//               { id: "p1_url", type: "redirect", label: "Panel 1 Link URL", placeholder: "https://..." },
//               { id: "p1_text", type: "text", label: "Panel 1 Text", placeholder: "Enter panel text..." },
//               { id: "p1_text_color", type: "color", label: "Panel 1 Text Color" },
//               { id: "p1_text_bg", type: "color", label: "Panel 1 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_2", type: "group", label: "Panel 2", fields: [
//               { id: "p2_image", type: "image", label: "Panel 2 Image" },
//               { id: "p2_url", type: "redirect", label: "Panel 2 Link URL", placeholder: "https://..." },
//               { id: "p2_text", type: "text", label: "Panel 2 Text", placeholder: "Enter panel text..." },
//               { id: "p2_text_color", type: "color", label: "Panel 2 Text Color" },
//               { id: "p2_text_bg", type: "color", label: "Panel 2 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_3", type: "group", label: "Panel 3", fields: [
//               { id: "p3_image", type: "image", label: "Panel 3 Image" },
//               { id: "p3_url", type: "redirect", label: "Panel 3 Link URL", placeholder: "https://..." },
//               { id: "p3_text", type: "text", label: "Panel 3 Text", placeholder: "Enter panel text..." },
//               { id: "p3_text_color", type: "color", label: "Panel 3 Text Color" },
//               { id: "p3_text_bg", type: "color", label: "Panel 3 Text Background Color" },
//             ]
//           },
//           {
//             id: "panel_4", type: "group", label: "Panel 4", fields: [
//               { id: "p4_image", type: "image", label: "Panel 4 Image" },
//               { id: "p4_url", type: "redirect", label: "Panel 4 Link URL", placeholder: "https://..." },
//               { id: "p4_text", type: "text", label: "Panel 4 Text", placeholder: "Enter panel text..." },
//               { id: "p4_text_color", type: "color", label: "Panel 4 Text Color" },
//               { id: "p4_text_bg", type: "color", label: "Panel 4 Text Background Color" },
//             ]
//           },
//           { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         ]),
//       ],
//     },
//   ],
// };
// const animatedAds: AdCategory = {
//   id: "cat-2",
//   key: "animated",
//   name: "Animated Ads",
//   description:
//     "Build animated ads quicker and easier than ever with our market leading Animated Ad experiences.",
//   icon: "✨",
//   color: "#ec4899",
//   hasAdSizes: true,
//   formats: [],
//   adSizes: [
//     {
//       id: "size-2-1",
//       key: "responsive",
//       name: "Responsive",
//       description: "Responsive animated ad formats.",
//       formats: [
//         fmt("Fade In", undefined, "Fade in ad format is perfect for creating presentation style mobile advertisements. This format has four panels that can accommodate graphic as well as textual content.It has a call to action button which redirects users to the promoting brand landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Spin Cube", undefined, "Spin cube ad format is perfect for creating presentation style mobile advertisements. This format has four panels that can accommodate graphic as well as textual content.It has a call to action button which redirects users to the promoting brand landing page.", [], ["mobile", "tablet", "desktop"],
//         [{
//           id: "panels",
//           type: "group",
//           label: "Panels",
//           fields: [
//             { id: "panel_image", type: "image", label: "Panel Image", count: 4 },
//             { id: "panel_text", type: "text", label: "Panel Text", count: 4, placeholder: "Enter panel text..." }
//           ]
//         },
//         { id: "cta_text", type: "cta", label: "CTA Button Text", placeholder: "Shop Now" },
//         { id: "cta_url", type: "redirect", label: "Landing Page URL", placeholder: "https://..." }]
//         ),
//       ],
//     },
//     {
//       id: "size-2-2",
//       key: "interstitials",
//       name: "Interstitials",
//       description: "Full-screen animated ad experiences.",
//       formats: [
//         fmt("Slide In", undefined, "Slide in ad format is perfect for creating presentation style mobile advertisements. This format has four panels that can accommodate graphic as well as textual content.It has a call to action button which redirects users to the promoting brand landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Storm In", undefined, "Storm In ad format is perfect for creating presentation style mobile advertisements. This format has several panels, which can accommodate graphic as well as textual content, which appear on the screen from different directions to complete the ad. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Roll In", undefined, "Roll In ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can roll in. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Sleigh In", undefined, "Sleigh In ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can roll in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Slide In (Variant)", undefined, "Slide in ad format is perfect for creating presentation style mobile advertisements. This format has four panels that can accommodate graphic as well as textual content.It has a call to action button which redirects users to the promoting brand landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Crash In", undefined, "Crash in ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can crash in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Crack In", undefined, "Crack in ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can crack in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Transition Effect", undefined, "Transition effect ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can transition in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Shutter", undefined, "Shutter ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can shutter in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Pinwheel", undefined, "Pinwheel ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can pinwheel in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Snow", undefined, "Snow ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can snow in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Thunder", undefined, "Thunder ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can thunder in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//       ],
//     },
//     {
//       id: "size-2-3",
//       key: "banner",
//       name: "Banner",
//       description: "Animated banner formats.",
//       formats: [
//         fmt("Storm In", undefined, "Storm In ad format is perfect for creating presentation style mobile advertisements. This format has several panels, which can accommodate graphic as well as textual content, which appear on the screen from different directions to complete the ad. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Roll In", undefined, "Roll In ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can roll in. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Display Shelf", undefined, "Display shelf ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can display in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Count Down", undefined, "Count down ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can count down to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Countdown", "395x32", "Count down ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can count down to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//       ],
//     },
//     {
//       id: "size-2-4",
//       key: "squares",
//       name: "Squares",
//       description: "Animated square ad formats.",
//       formats: [
//         fmt("Slide In", undefined, "Slide in ad format is perfect for creating presentation style mobile advertisements. This format has four panels that can accommodate graphic as well as textual content.It has a call to action button which redirects users to the promoting brand landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Storm In", undefined, "Storm In ad format is perfect for creating presentation style mobile advertisements. This format has several panels, which can accommodate graphic as well as textual content, which appear on the screen from different directions to complete the ad. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Transition Effect", undefined, "Transition effect ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can transition in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Video Cube", undefined, "Video cube ad format is perfect for creating presentation style mobile advertisements. This format has four panels that can accommodate graphic as well as textual content.It has a call to action button which redirects users to the promoting brand landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Spin Cube", undefined, "Spin cube ad format is perfect for creating presentation style mobile advertisements. This format has four panels that can accommodate graphic as well as textual content.It has a call to action button which redirects users to the promoting brand landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Count Down", undefined, "Count down ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can count down to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("360 Video", undefined, "360 video ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can 360 video in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("Photosphere", undefined, "Photosphere ad format is perfect for creating presentation style mobile advertisements. This format has a full screen background image on top of which graphic or textual content can photosphere in to complete the ad message. The CTA button redirects users to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"]),
//         fmt("THRESHOLD360 CUBE", "300x250", "Threshold360 cube ad format is perfect for creating presentation style mobile advertisements. This format has four panels that can accommodate graphic as well as textual content.It has a call to action button which redirects users to the promoting brand landing page.", [], ["mobile", "tablet", "desktop"]),
//       ],
//     },
//   ],
// };

// ─── 3. DESKTOP ADS ─────────────────────────────────────────────────────────

const desktopAds: AdCategory = {
  id: "cat-3",
  key: "desktop",
  name: "Desktop Ads",
  description:
    "A great way for marketers to create awareness about their brands through rich media ads for desktop.",
  icon: "🖥️",
  color: "#14b8a6",
  hasAdSizes: true,
  formats: [],
  adSizes: [
    {
      id: "size-3-1",
      key: "leaderboard",
      name: "Leaderboard",
      description:
        "728x90 Interactive banners. Engage with the audience using innovative banner experiences.",
      dimension: "728x90",
      formats: [
        fmt("180 Spinner", undefined, "180 spinner is a desktop ad format that features 3D 180 degree spin showcasing 2 images. The format is simple, intuitive and captivates the user to engage with the ad.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Transition Effect", undefined, "Transition Effect ad format is a nice way to stylize the content. Slide transitions can make content understandable, engaging and professional-looking. It offers several choice of transitions among which a style can be selected to apply to the images.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Falling Panels", undefined, "Falling Panels is a very simple and intuitive ad format. It consists of 2 images that have falling and bouncing effects and are displayed one over the other. This simple animation encourages the users to check out the required website by clicking on the images.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Ripple", undefined, "Ripple ad-format has an effect of ripples expanding across the water when an object is dropped into it, giving the illusion of underwater effect. It also creates a water ripple animation following the mouse cursor on the product image. Combining animation as well as interaction, this format is bound to grab users’ attention.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Video Billboard Carousel", undefined, "The Video Billboard Carousel allows any advertiser to showcase up to 10 videos in a single Native Ad unit. Each video is displayed along with a Description. The big banner size allows for a thumbnail of the upcoming video and description to be showcased when viewing a video. The user can control and toggle between the videos as they wish. Each video has a unique CTA URL.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Leader Board Hotspot", undefined, "Presenting to you a new and trendy way of showcasing products and their details. Each product in the ad image will have a hotspot. On tapping the product hotspot, a small pop-up appears with the details, which will in turn lead to the respective page on your website.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Display Shelf", undefined, "Display shelf is a simple animated format that displays the brand’s product details through animation that flips on and off continuously. It's a simple and informative way to attract users' attention.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Carousel", undefined, "Carousel is an intuitive, scrollable ad unit which engages users and nudges them to browse through collections with ease. The image slides automatically as well as users can also swipe manually. The image also has a CTA button that directs the user to the landing page.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Count Down", undefined, "Countdown Leaderboard is an animated ad which invokes excitement amongst the users by giving a sense of urgency. It is ideal for brands who are advertising for Flash sales and limited Offers. The timer is added on a background image of 728x90. The countdown is calculated based on the time and date entered by the advertiser in the Studio.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Catalog", undefined, "Catalog ad format lets you showcase your product in a square catalog format. Upon clicking on a product a separate pop-up window opens showing more details of the product. Each product can be linked to their respective page on the brand's website.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Scheduler", undefined, "Scheduler as the name suggests, works as a programmatic schedule of image display by uploading the intended images and its showcase timing. The image will be displayed according to the time input given by the advertiser. The advertiser has the option of displaying certain images during a pre-decided timeframe.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Video Wall Leaderboard", undefined, "This is a leaderboard ad, which allows the advertiser to showcase a video within a banner. The video is placed in the middle of the background image and the dimensions of the video can be customised to fit seamlessly with the background image. On clicking anywhere on the banner, the user is redirected to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Leaderboard Survey Builder with Branching", undefined, "This is a Survey ad unit that can be used for conducting surveys across a vast audience via display advertising. The survey progresses depending on the user's response to each question. The advertiser can customize the flow of the survey. This new template has the option to show the responses of all users and has more answer type options as well. Once the user completes the survey, a custom message appears.", [], ["mobile", "tablet", "desktop"],[],[]),
      ],
    },
    {
      id: "size-3-2",
      key: "large-leaderboard",
      name: "Large Leaderboard",
      description: "Captivate your audience with a 970x250 engaging ad.",
      dimension: "970x250",
      formats: [
        fmt("Video Billboard", undefined, "Taking advantage of the real estate a Billboard banner offers, we have developed an ad experience with multiple elements. The static image ensures the brand presence at all times, the video could showcase the product features. This banner is a clean representation of a static banner and video can be merged.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Video Billboard - Responsive", undefined, "Taking advantage of the real estate a Billboard banner offers, we have developed a responsive ad experience with multiple elements. The static image ensures the brand presence at all times, the video could showcase the product features. This banner is a clean representation of a static banner and video can be merged.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Scheduler", undefined, "Scheduler as the name suggests, works as a programmatic schedule of image display by uploading the intended images and its showcase timing. The image will be displayed according to the time input given by the advertiser. The advertiser has the option of displaying certain images during a pre-decided timeframe.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Hotspot", undefined, "Presenting to you a new and trendy way of showcasing products and their details. Each product in the ad image will have a hotspot. On tapping the product hotspot, a small pop-up appears with the details, which will in turn lead to the respective page on your website.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Video Wall Large Leaderboard", undefined, "This is a large leaderboard ad, which allows the advertiser to showcase a video within a banner. The video is placed in the middle of the background image and the dimensions of the video can be customised to fit seamlessly with the background image. On clicking anywhere on the banner, the user is redirected to the advertiser's landing page.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Large Leaderboard IBV", undefined, "This is a large leaderboard banner where half the banner is an image and the other half is a video. Both elements size and position can be customized as required.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Half Page IBV", undefined, "This is a half page banner where half the banner is an image and the other half is a video. Both elements size and position can be customized as required.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Feature Cards Leaderboard", undefined, "Showcase multiple products or offerings as a multi-card ad unit. The number of cards can be customized and each card has a unique click-through URL.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Multimedia Reel", undefined, "This is a multi-image Large Leaderboard ad unit that allows the advertisers to showcase different products redirecting the user to unique Landing Pages. The animation styles can be chosen by the advertiser when setting up the creative.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Exhibition - Audio Cards", undefined, "Core Messaging is an intuitive ad unit which engages users and nudges them to browse through collections with ease. The image slides automatically as well as users can also swipe manually. The image also has a CTA button that directs the user to the landing page.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Multimedia Reel", "970x180", "This is a multi-image Large Leaderboard ad unit that allows the advertisers to showcase different products redirecting the user to unique Landing Pages. The animation styles can be chosen by the advertiser when setting up the creative.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Data Board", undefined, "This is a multi-image Large Leaderboard ad unit that allows the advertisers to showcase different products redirecting the user to unique Landing Pages. The animation styles can be chosen by the advertiser when setting up the creative.", [], ["mobile", "tablet", "desktop"],[],[]),
      ],
    },
    {
      id: "size-3-3",
      key: "square",
      name: "Square",
      description:
        "Capture 100% attention of your audience, with these 300x250 experiences.",
      dimension: "300x250",
      formats: [
        fmt("Falling Panels", undefined, "Falling Panels is a very simple and intuitive ad format. It consists of 2 images that have falling and bouncing effects and are displayed one over the other. This simple animation encourages the users to check out the required website by clicking on the images.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Transition Effect", undefined, "Transition Effect ad format is a nice way to stylize the content. Slide transitions can make content understandable, engaging and professional-looking. It offers several choice of transitions among which a style can be selected to apply to the slides.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Inception", undefined, "Inception is a simple animated format. It has 2 images in which the overlay image breaks into two. Both the clipped parts of the image scale up and move out of the screen and back creating an inception effect", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Display Shelf", undefined, "Display shelf is a simple animated format that displays the brand’s product details through animation that flips on and off continuously. It's a simple and informative way to attract users' attention.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Beat", undefined, "Beat is a simple yet graceful ad creative. The logo/shake image on the overlay will be in a continuous shake mode. Upon hover the image starts to shake vigorously making it conspicuous and on clicking it, exhibits the underlay image.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Scheduler", undefined, "Scheduler as the name suggests, works as a programmatic schedule of image display by uploading the intended images and its showcase timing. The image will be displayed according to the time input given by the advertiser. The advertiser has the option of displaying certain images during a pre-decided timeframe.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Glue Stick", undefined, "Glue Stick is a simple swipe format using parallax. It uses a technique where the background content or an image is moved at a different speed than the foreground content while scrolling creating an unique effect and allowing the advertiser to view the product in differen scenarios.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Theater", undefined, "Theater is a combination of static and animated images. Where the first image is static and has a CTA urging the user to explore the series of images, where ‘n’ number of images slide showcasing different products/features. This transition is automatic as well as manual, giving the user control over the creative.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Black Board", undefined, "Blackboard is an interactive ad format, which mimics the action of cleaning a chalk slate. It is perfect to show a Before & After scenario. Once the underlay image shows, the CTA button appears simultaneously, which leads the user to the LP.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Window Shopping", undefined, "Window shopping is an interactive as well as automated ad, where the advertiser can put 'n' no. of slides. The individual slides can showcase different product/features and each slide can be assigned a unique redirect URL.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Video Player", undefined, "This is a video player which floats to the bottom left or right of the browser once the user opens it. This format combines video within the standard 300x250 ad unit, making it easier to implement with large inventory availability. You can either upload a video file or use a VAST tag for this unit.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("In-Banner Video", "300x250", "This is a video player which floats to the bottom left or right of the browser once the user opens it. This format combines video within the standard 300x250 ad unit, making it easier to implement with large inventory availability. You can either upload a video file or use a VAST tag for this unit.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Slider Video", undefined, "This is a video player which floats to the bottom left or right of the browser once the user opens it. This format combines video within the standard 300x250 ad unit, making it easier to implement with large inventory availability. You can either upload a video file or use a VAST tag for this unit.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Pop Up Poll", undefined, "Pop Up Poll is a square video ad format with a poll card which slides in at the end of the video. The advertiser can ask a question giving up to 5 options to their users. On selecting their answer, users will be able to view the percentage of all answers submitted till then. Clicking anywhere on the video will redirect the user to the advertiser’s landing page.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Glue Stick (Variant)", undefined, "Glue Stick is a simple swipe format using parallax. It uses a technique where the background content or an image is moved at a different speed than the foreground content while scrolling creating an unique effect and allowing the advertiser to view the product in differen scenarios.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Lightbox Catalog", undefined, "Lightbox creative which expands from a square creative to one that takes over your screen. The expanded version of this creative is a Catalog ad, which allows advertisers to showcase up to four products and their respective descriptions. Each product can be redirected to unique landing pages. This expandable unit can be executed on both mobile and desktop where the base creative is a square size.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Hotspot", undefined, "Presenting to you a new and trendy way of showcasing products and their details. Each product in the ad image will have a hotspot. On tapping the product hotspot, a small pop-up appears with the details, which will in turn lead to the respective page on your website.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Autoplay In Banner Video", "300x250", "This is an IBV ad unit where the video will lie on a background image. The position and size of the video can be customized.", [], ["mobile", "tablet", "desktop"],[],[]),
        fmt("Carousel", "300x250", "This is a multi-slide carousel square unit. Each slide can have a unique product image, text description and click-through URL. The background colour of the slides can also be set while setting up the creative.", [], ["mobile", "tablet", "desktop"],[],[]),
      ],
    },
    {
      id: "size-3-4",
      key: "half-page",
      name: "Half Page",
      description:
        "300x600 Interactive banners. Engage with the audience using innovative banner experiences.",
      dimension: "300x600",
      formats: [
        fmt("Spin Cube", undefined, ""),
        fmt("Video Cube", undefined, ""),
        fmt("Video Shopper", undefined, ""),
        fmt("Transition Effect", undefined, ""),
        fmt("Shutter", undefined, ""),
        fmt("Neon Board", undefined, ""),
        fmt("Snow", undefined, ""),
        fmt("Thunder", undefined, ""),
        fmt("Giftbox", undefined, ""),
        fmt("Unblur", undefined, ""),
        fmt("Glue Stick", undefined, ""),
        fmt("Pinwheel", undefined, ""),
        fmt("Ripple", undefined, ""),
        fmt("Theater", undefined, ""),
        fmt("Black Board", undefined, ""),
        fmt("Window Shopping", undefined, ""),
        fmt("Transition Video", undefined, ""),
        fmt("Likert Scale", undefined, ""),
        fmt("In Banner Video Ad", undefined, ""),
        fmt("Spin Cube (Variant)", undefined, ""),
        fmt("Video Shopper (Variant)", undefined, ""),
        fmt("Display Shelf", undefined, ""),
        fmt("Carousel", undefined, ""),
        fmt("Shutter (Variant)", undefined, ""),
        fmt("Hotspot", undefined, ""),
        fmt("Catalog", undefined, ""),
        fmt("Transition Effect (Variant)", undefined, ""),
        fmt("Survey - Halfpage", "300x600", ""),
        fmt("Music Player - Halfpage", "300x600", ""),
        fmt("Scheduler", undefined, ""),
        fmt("360 Video", undefined, ""),
        fmt("Photosphere", undefined, ""),
        fmt("Carousel - Halfpage", undefined, ""),
        fmt("Click to Map", "300x600", ""),
        fmt("Survey Builder with Branching - Halfpage", "300x600", ""),
        fmt("TikTok Half Page", undefined, ""),
        fmt("Reel Half Page", undefined, ""),
        fmt("THRESHOLD360 CUBE", "300x600", ""),
        fmt("Survey Builder with Branching V2 - Halfpage", "300x600", ""),
        fmt("Survey", "300x600", ""),
        fmt("Insta Stories", undefined, ""),
        fmt("Skyscraper Survey Builder with Branching", undefined, ""),
        fmt("Transition Slider", undefined, ""),
        fmt("Gallery Tab", "300x600", ""),
        fmt("Multimedia Reel", undefined, ""),
        fmt("Survey Builder V3 - Halfpage Variant Q1 & Multiple End Cards", "300x600", ""),
        fmt("Skyscraper Survey Builder - Variant Q1 & Multiple End Cards", undefined, ""),
        fmt("Spin Cube Video", "300x600", ""),
        fmt("Spin Cube Video", "400x600", ""),
      ],
    },
    {
      id: "size-3-5",
      key: "desktop-native",
      name: "Desktop Native",
      description:
        "Desktop Native that engages with the user using reveal experiences.",
      formats: [
        fmt("Scratch Expandable", "728x90"),
        fmt("Scratch Expandable", "300x250"),
        fmt("Scratch Expandable Banner"),
        fmt("Lightbox Expandable"),
        fmt("Youtube Video"),
        fmt("Leaderboard Expandable Catalog"),
        fmt("Desktop Glide"),
        fmt("Inline Responsive Banner + Video"),
        fmt("Glide Expandable"),
        fmt("Email Capture"),
        fmt("Desktop Header Pushdown", "970x90"),
        fmt("Square Expandable"),
        fmt("Expandable with Multiple Videos"),
        fmt("Lightbox Expandable Slider"),
        fmt("Desktop Pushdown Slider"),
        fmt("Lightbox Expandable Slider", "300x600"),
        fmt("Lightbox Expandable Slider", "970x250"),
        fmt("MDE Expandable Banner", "300x600"),
        fmt("MDE Expandable Banner", "970x250"),
        fmt("Video Mural", "970x250"),
        fmt("Video Mural", "300x600"),
        fmt("Video Mural", "300x250"),
        fmt("MDE Expandable Banner (Video)", "300x250"),
        fmt("MDE Expandable Banner (Video)", "300x600"),
        fmt("MDE Expandable Banner (Video)", "970x250"),
        fmt("Expandable Banner", "300x250"),
        fmt("Pushdown Banner", "300x250"),
        fmt("Gutter Banner", "160x600"),
        fmt("Custom Expandable Banner"),
        fmt("Curtain Raiser"),
        fmt("Curtain Raiser 2.0"),
        fmt("Product Showcase"),
        fmt("Image Drift"),
        fmt("Fading Billboard"),
        fmt("Fading Billboard Plus"),
        fmt("Large IBV Desktop"),
        fmt("Video Player", "Custom Dimension"),
        fmt("Vast Player", "Custom Dimension"),
        fmt("Desktop Video Footer"),
        fmt("Mini Shopper", "970x250"),
        fmt("Animated Tower"),
        fmt("Gallery Tab", "970x250"),
        fmt("Swivel Sticker"),
        fmt("Audio Preview", "970x250"),
        fmt("Swivel Sticker - Scroll"),
        fmt("Exhibition - Core Messaging Desktop"),
        fmt("Exhibition - Carousel Desktop"),
        fmt("Exhibition - Cards Desktop"),
        fmt("Swivel Sticker - Album"),
        fmt("Swivel Sticker - Video Expansion"),
        fmt("Sticky Adaptive IBV"),
        fmt("Swivel Sticker - Video Cards"),
        fmt("Swivel Sticker - Animated Clip"),
        fmt("Swivel Sticker - Multiplex"),
        fmt("Billboard Frame"),
        fmt("Billboard Frame 2"),
        fmt("Touch Spot"),
        fmt("MDE Expandable Banner", "728x90"),
        fmt("MDE Expandable Banner", "320x50"),
        fmt("Time Spotlight"),
      ],
    },
  ],
};

// ─── 4. NATIVE ADS ──────────────────────────────────────────────────────────

const nativeAds: AdCategory = {
  id: "cat-4",
  key: "native",
  name: "Native Ads",
  description:
    "The word 'native' refers to the coherence of the content with the other media that appears on the platform. It manifests as either an article or video, produced by an advertiser with the specific intent to promote a product.",
  icon: "📱",
  color: "#f59e0b",
  hasAdSizes: false,
  adSizes: [],
  formats: [
    fmt("Scroll Through"),
    fmt("Slider"),
    fmt("Carousel"),
    fmt("360 Video"),
    fmt("Unfold"),
    fmt("Glide Video"),
    fmt("Inline Video"),
    fmt("Wrapper"),
    fmt("Transition Wrapper"),
    fmt("Revolving Wrapper"),
    fmt("Carousel Wrapper"),
    fmt("Video Wrapper"),
    fmt("Fullscreen Video Wrapper"),
    fmt("Roundabout"),
    fmt("Scratch to Reveal - Sticky"),
    fmt("Peel to Reveal - Sticky"),
    fmt("Sticky Expandable - Video"),
    fmt("VideoWall Youtube"),
    fmt("Product Carousel With Rating"),
    fmt("Glide"),
    fmt("IBV Interscroller - Custom"),
    fmt("Sticky Expandable - Static"),
    fmt("Glide Pull Up"),
    fmt("Sticky Pull Up Banner"),
    fmt("Glide Contact Form"),
    fmt("Static Glide"),
    fmt("Video Interscroller"),
    fmt("Video + Image Interscroller"),
    fmt("Image Interscroller with Optional Video"),
    fmt("Horizontal Scroll"),
    fmt("Interscroller Carousel"),
    fmt("Flying Donut"),
    fmt("3D Expandable Carousel"),
    fmt("Press+Hold"),
    fmt("Mobile Skin Glide"),
    fmt("Mobile Video Skin Glide"),
    fmt("Image + Video Page Scroller"),
    fmt("Countdown"),
    fmt("Sticky Footer Banner"),
    fmt("Click to Play IBV"),
    fmt("Jumbo Header"),
    fmt("Full-Width Expandable Header Banner"),
    fmt("Miniscroller/Interscroller - Without Video"),
    fmt("Video Product"),
    fmt("Sticky Catalog"),
    fmt("Parallax"),
    fmt("Parallax", "320x480"),
    fmt("L Wrap"),
    fmt("Lower Third"),
    fmt("Sticky Footer Banner (Variant)"),
    fmt("Product Sidekick"),
    fmt("Wrapper - Scratch To Reveal"),
    fmt("Shoppable"),
    fmt("Parallax", "300x600"),
    fmt("InVideo Overlay"),
    fmt("Glide Gallery"),
    fmt("Parallax Video"),
    fmt("Parallax-2", "300x250"),
    fmt("Mobile Video Skin - Scratch Off"),
    fmt("Glide Vertical Video"),
    fmt("Anchor"),
    fmt("MDE Expandable Banner", "300x250"),
    fmt("Lightbox Mobile Expandable Slider", "300x250"),
    fmt("3D Display Board"),
    fmt("Sticky Switch"),
    fmt("Full Screen Interstitial"),
    fmt("Sticky Auto Expandable Mobile Banner"),
    fmt("Super Hero Pushdown"),
    fmt("IMA Video Player"),
    fmt("Flow"),
    fmt("Fancy Carousel"),
    fmt("Exhibition Timer"),
    fmt("Video Cube Shopper"),
    fmt("Insta Square"),
    fmt("TikTok Square"),
    fmt("Insta Video Square"),
    fmt("Facebook Post Ad"),
    fmt("Video Poll"),
    fmt("3D Video Cube"),
    fmt("Interstitial Sides Poll"),
    fmt("Jumbo Header V2"),
    fmt("Mast Head Unit"),
    fmt("3D Carousel"),
    fmt("Opinion Poll"),
    fmt("Responsive Pushdown"),
    fmt("Sticky Pushdown IBV"),
    fmt("TikTok Video Glide"),
    fmt("Video Footer Banner"),
    fmt("Responsive Header"),
    fmt("Mini Shopper", "300x250"),
    fmt("Sticky Curtain Raiser"),
    fmt("Mobile Horizon"),
    fmt("Floaters"),
    fmt("Glide Booklet"),
    fmt("Roulette Table"),
    fmt("Video Theater"),
    fmt("Video Spotlight"),
    fmt("Glide Contact Form (Variant)"),
    fmt("Photo Album"),
    fmt("Product Reel"),
    fmt("Exhibition - Core Messaging Mobile"),
    fmt("Exhibition - Carousel Mobile"),
    fmt("Glide with Animation"),
    fmt("Product Gallery"),
    fmt("Video Poster"),
    fmt("Jumbo Footer"),
    fmt("Insta Half Page"),
    fmt("Scratch to Reveal - Sticky Video"),
    fmt("Ticker Belt"),
    fmt("Tailored Overlay"),
    fmt("Opinion Poll with Branching", "300x600"),
    fmt("Mobile Fullscreen Interstitial"),
    fmt("Flip Frame Takeover"),
    fmt("Banner Shift"),
    fmt("Prime View Takeover"),
    fmt("Premiere Headliner"),
    fmt("Skin Carousel Interactive"),
    fmt("Glide Torstar"),
    fmt("Inline Video Strip"),
    fmt("Mobile Glide Carousel"),
    fmt("Wraparound"),
    fmt("Storefront"),
    fmt("Scratch To Reveal", "300x600"),
    fmt("Savvy Frame"),
    fmt("Sticky Pushdown Storefront"),
    fmt("Edge to Edge"),
    fmt("Video Spotlight Storefront"),
    fmt("Sticky Glide Banner"),
    fmt("Mobile SideTrail Skin"),
    fmt("Article Unit"),
    fmt("Time Spotlight Showcase"),
    fmt("Native Format V2"),
  ],
};

// ─── 5. STANDARD BANNERS ────────────────────────────────────────────────────

const standardBanners: AdCategory = {
  id: "cat-5",
  key: "standard-banners",
  name: "Standard Banners",
  description:
    "Simple banners with visuals such as logo or graphics. Only one interaction which on click leads to the advertiser landing page.",
  icon: "🖼️",
  color: "#8b5cf6",
  hasAdSizes: false,
  adSizes: [],
  formats: [
    fmt("Inline Rectangle", "300x250"),
    fmt("Square", "250x250"),
    fmt("Small Square", "200x200"),
    fmt("Banner", "468x60", undefined, undefined, ["tablet", "desktop"]),
    fmt("Leaderboard", "728x90", undefined, undefined, ["desktop"]),
    fmt("Large Rectangle", "336x280"),
    fmt("Skyscraper", "120x600", undefined, undefined, ["desktop"]),
    fmt("Wide Skyscraper", "160x600", undefined, undefined, ["desktop"]),
    fmt("Mobile Leaderboard", "320x50"),
    fmt("Desktop Web Banner", "1055x180", undefined, undefined, ["desktop"]),
    fmt("Mobile Web Banner", "340x180"),
    fmt("Desktop Intro Banner", "1600x450", undefined, undefined, ["desktop"]),
    fmt("Mobile Intro Banner", "540x350", undefined, undefined, ["desktop"]),
    fmt("Large Leaderboard", "728x300", undefined, undefined, ["desktop"]),
    fmt("Large Leaderboard 970x250", "970x250", undefined, undefined, ["desktop"]),
    fmt("Interstitial", "320x480"),
    fmt("Half Page", "300x600"),
    fmt("Large Leaderboard 970x90", "970x90", undefined, undefined, ["desktop"]),
    fmt("Mobile Banner 320x100", "320x100"),
    fmt("Custom Banner", undefined, undefined, undefined, ["mobile", "tablet", "desktop"]),
    fmt("Add To Calendar", "300x250"),
    fmt("Add To Calendar", "320x480"),
    fmt("Add To Calendar", "300x600"),
    fmt("Add To Calendar", "728x90"),
    fmt("Add To Calendar", "300x50"),
  ],
};

// ─── Export ──────────────────────────────────────────────────────────────────

export const adCategories: AdCategory[] = [
  interactiveAds,
  animatedAds,
  desktopAds,
  nativeAds,
  standardBanners,
];

/** Flat list of every ad format across all categories */
export const allFormats: AdFormat[] = adCategories.flatMap((cat) => {
  const sizeFormats = cat.adSizes.flatMap((size) => size.formats);
  return [...cat.formats, ...sizeFormats];
});

/** Quick stats */
export const adStats = {
  totalCategories: adCategories.length,
  totalFormats: allFormats.length,
  byCategory: adCategories.map((c) => ({
    name: c.name,
    count:
      c.formats.length +
      c.adSizes.reduce((sum, s) => sum + s.formats.length, 0),
  })),
};