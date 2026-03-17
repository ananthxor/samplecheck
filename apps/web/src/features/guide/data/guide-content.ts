import type { LucideIcon } from 'lucide-react'
import {
  Rocket,
  Layers,
  Megaphone,
  Crosshair,
  CreditCard,
  BarChart3,
} from 'lucide-react'

export interface GuideTopic {
  title: string
  content: string
}

export interface GuideCategory {
  id: string
  title: string
  icon: LucideIcon
  topics: GuideTopic[]
}

export const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    topics: [
      {
        title: 'Creating Your First Ad',
        content:
          'Navigate to the Dashboard and select an ad type to browse available templates. Choose a template, customize the text, images, and redirect URL in the editor, then save it to your Creatives library. Your ad is now ready to be assigned to a campaign.',
      },
      {
        title: 'Understanding Ad Formats',
        content:
          'ScrollToday offers 14 ad formats across four categories: Interactive (carousel, flipcard, scratch, quiz, cube, slider, accordion), Animated (animated banner, countdown), Video (video endcard, click-to-play), and Standard (static banner, multi-frame, in-feed native). Each format has unique engagement mechanics.',
      },
      {
        title: 'Platform Navigation',
        content:
          'Use the sidebar to navigate between sections: Dashboard for an overview, Creatives for your ad library, Campaigns to organize ads, Trackers for third-party tracking pixels, Analytics for performance data, Billing for credits, and Guide for help.',
      },
    ],
  },
  {
    id: 'ad-formats',
    title: 'Ad Formats',
    icon: Layers,
    topics: [
      {
        title: 'Interactive Ads',
        content:
          'Interactive formats like Carousel, Flipcard, Scratch-to-Reveal, Quiz/Poll, 3D Cube, Slider, and Accordion encourage direct user engagement. These formats typically achieve higher engagement rates and dwell times compared to static ads.',
      },
      {
        title: 'Animated & Video Ads',
        content:
          'Animated Banners use CSS entrance animations to capture attention. Countdown Timers create urgency with live ticking digits. Video Endcard and Click-to-Play formats combine video content with interactive CTAs that appear during or after playback.',
      },
      {
        title: 'Standard & Native Ads',
        content:
          'Static Banners are classic display ads with hover effects. Multi-Frame ads rotate through multiple panels with dot navigation. In-Feed Native ads blend seamlessly into content feeds with a Sponsored badge for transparency.',
      },
      {
        title: 'Customizing Templates',
        content:
          'In the editor, you can modify text fields, swap images by uploading new assets, change the redirect URL, and preview your changes in real time. Toggle between desktop and mobile preview modes to ensure your ad looks great on all devices.',
      },
    ],
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    icon: Megaphone,
    topics: [
      {
        title: 'Creating a Campaign',
        content:
          'Go to Campaigns and click "Create Campaign." Enter a campaign name, optionally set the advertiser/brand name, and specify start and end dates for flight scheduling. You can always edit these details later.',
      },
      {
        title: 'Assigning Creatives',
        content:
          'Open a campaign and use the "Assign Creatives" button to add ads from your library. Each creative can belong to one campaign at a time. Assigned creatives inherit the campaign context for analytics and tag generation.',
      },
      {
        title: 'Ad Lifecycle & Status',
        content:
          'Creatives follow a lifecycle: Draft (being built), Active (serving impressions), Paused (temporarily stopped), and Archived (retired). You can transition between statuses from the campaign detail page. Only Active creatives consume impression credits.',
      },
      {
        title: 'Getting Ad Tags',
        content:
          'For any active creative, click the tag icon to get embeddable code. Choose between a DFP/GAM-compatible tag (for programmatic ad servers) or a direct embed tag (for placing on any website). Copy the tag and paste it into your ad server or webpage.',
      },
    ],
  },
  {
    id: 'trackers',
    title: 'Trackers',
    icon: Crosshair,
    topics: [
      {
        title: 'What Are Trackers?',
        content:
          'Trackers are third-party tracking pixels or scripts that fire alongside your ads. They let you send impression, click, or conversion data to external analytics platforms like Google Analytics, DCM, or your own tracking servers.',
      },
      {
        title: 'Creating a Tracker',
        content:
          'Go to the Trackers page and click "Create Tracker." Set a name, choose a category (Conversion, Impression, or Click), select the type (Pixel for 1x1 image requests, Script for JavaScript tags), and enter the URL template. Use macros like %%CACHEBUSTER%% for cache-busting.',
      },
      {
        title: 'Assigning Trackers to Creatives',
        content:
          'In the campaign detail page, open a creative and use the Trackers section to assign tracker configurations. Choose a fire condition (On Load, On Viewable, On Click, On Engagement) to control when the tracker fires during the ad experience.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Credits',
    icon: CreditCard,
    topics: [
      {
        title: 'How Credits Work',
        content:
          'ScrollToday uses a prepaid impression credit system. Creating and previewing ads is free. Credits are consumed only when your ads are served to real users. One impression deducts one credit from your balance.',
      },
      {
        title: 'Purchasing Credits',
        content:
          'Go to the Billing page and choose a credit pack: 50,000, 200,000, or 1,000,000 impressions. Complete the purchase through Stripe checkout. Credits are added to your balance within seconds of payment confirmation.',
      },
      {
        title: 'Low Balance Warnings',
        content:
          'When your credit balance drops below 10% of your last purchased pack, you will see a warning notification. If your balance reaches zero, ad serving stops immediately until you purchase more credits.',
      },
      {
        title: 'Transaction History',
        content:
          'The Billing page shows a full history of all credit purchases with amounts, dates, and Stripe receipt links. Use this for accounting and expense tracking.',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    topics: [
      {
        title: 'Analytics Dashboard',
        content:
          'The Analytics page shows key performance metrics: Impressions, Clicks, CTR (Click-Through Rate), and Dwell Time. Use the date range selector to focus on specific time periods. Data updates on each page refresh.',
      },
      {
        title: 'Understanding Metrics',
        content:
          'Impressions count each time your ad loads. Viewable Impressions count when 50% of the ad is visible for at least 1 second (IAB/MRC standard). Clicks count user interactions with the CTA. CTR is clicks divided by impressions. Dwell Time measures how long users engage with interactive elements.',
      },
      {
        title: 'Exporting Data',
        content:
          'Click the "Export CSV" button to download your analytics data as a spreadsheet. You can filter by date range, campaign, or creative before exporting to get precisely the data you need.',
      },
    ],
  },
]
