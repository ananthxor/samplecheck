import { useState, useMemo, useRef, useEffect, useDeferredValue, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router";
import { toast } from 'sonner';
import { useCampaigns } from "@/features/campaigns/hooks/use-campaigns";
import { useCreative, useCreateCreative, useUpdateCreative } from "@/features/creatives/hooks/use-creatives";
import { updateCreative } from "@/features/creatives/api/creatives-api";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { buildAdPayload } from "@scrolltoday/ad-sdk";
import { generateCdnBundle, getBundleUrl } from "@/features/editor/lib/bundle-generator";
import { getFormat } from "@/features/templates/formats/registry";
import { generatePreviewHtml } from "@/features/editor/lib/renderer";
import { SharePanel } from "@/features/creatives/components/share-panel";
import { ShareDialog } from "@/features/creatives/components/share-dialog";
import { CampaignFormDialog } from "@/features/campaigns/components/campaign-form-dialog";
import type { FieldDefinition } from "@/features/templates/formats/_shared/types";
import { STORAGE_BUCKET, type Json, type Tables } from "@scrolltoday/shared";
import { adCategories, allFormats, findFormatById } from "../data/fmtData";
import type { AdCategory } from "../data/fmtData";
import FormatDetailsModal from "./format-details-modal";
import {
    FormInput, FormSection, LinkIcon, InfoIcon,
    SMSIcon, PhoneIcon, EmailIcon, ColorSwatch,
    TextIcon, FormSwitch, DynamicFieldMapper,
    FormSelect
} from "../components/FormElements";
import "../styles/creatives.css";

/* ─────────────────────────────────────────────────
   STATIC BANNER RENDERER (used for all non-registered formats)
   Injected via buildAdPayload — runs inside the sandboxed ad iframe.
───────────────────────────────────────────────── */
const STATIC_BANNER_CSS = `
  .st-wrap { width:100%; height:100%; display:flex; flex-direction:column; overflow:hidden; background:#fff; }
  .st-img { flex:1; width:100%; object-fit:cover; display:block; min-height:0; }
  .st-footer { padding:8px; text-align:center; flex-shrink:0; }
`;
const STATIC_BANNER_JS = `
  function renderStaticBanner(root, cfg) {
    var fallback = cfg.fallbackImage ? ' onerror="this.onerror=null;this.src=\\'' + sanitize(cfg.fallbackImage) + '\\';"' : '';
    var imageHtml = cfg.imageUrl
      ? '<img class="st-img" src="' + sanitize(cfg.imageUrl) + '"' + fallback + ' alt="" />'
      : '<div class="st-img" style="background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:13px;color:#94a3b8">No image</div>';
    root.innerHTML =
      '<div class="st-wrap">' + imageHtml
      + '<div class="st-footer">'
      + '<a class="sb-cta" style="background:' + sanitize(cfg.brandColor || '#2563eb') + ';color:' + sanitize(cfg.brandTextColor || '#ffffff') + '" href="' + sanitize(cfg.ctaUrl || 'https://www.scrolltoday.com') + '" target="_blank" rel="noopener">'
      + sanitize(cfg.ctaText || 'Learn More')
      + '</a></div></div>';
  }
`;

/* ─────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */
function catFormatCount(cat: AdCategory) {
    return (
        cat.formats.length +
        cat.adSizes.reduce((acc, sz) => acc + sz.formats.length, 0)
    );
}

type ViewMode = "grid" | "list";

/* ─────────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────────── */
const CheckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const GridIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
);

const ListIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="3" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="3" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
);

const EyeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const AnalyticsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);

const BackArrow = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

const MobileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
);

const TabletIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2" ry="2" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const DesktopIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

const ExpandIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
);

const RefreshIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
);

const XIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/* ─────────────────────────────────────────────────────────────────
   PROGRESS STEPPER

   DOM layout (flat, no nesting mixup):
   .cr-stepper  [display:flex, align-items:flex-start]
     .cr-step           ← Step 1
     .cr-step-connector ← line between 1 and 2
     .cr-step           ← Step 2
     .cr-step-connector ← line between 2 and 3
     .cr-step           ← Step 3

   Each .cr-step is flex-column (bubble on top, labels below).
   Each .cr-step-connector is a flex-row bar with a fill layer,
   aligned vertically to the centre of the bubble via margin-top.
───────────────────────────────────────────────────────────────── */
interface StepperProps {
    step: 0 | 1 | 2 | 3 | 4;
    catName?: string;
    sizeName?: string;
    formatName?: string;
}

const BUBBLE_H = 44; // px — must match CSS .cr-step__bubble height

function ProgressStepper({ step, catName, sizeName, formatName }: StepperProps) {
    const steps = [
        { label: "Ad Type", icon: "01", value: catName ?? "Choose a type" },
        { label: "Ad Size", icon: "02", value: sizeName ?? "Choose a size" },
        { label: "Ad Format", icon: "03", value: formatName ?? "Select format" },
        { label: "Customize", icon: "04", value: step >= 3 ? "Configure ad" : "Pending" },
        { label: "Publish", icon: "05", value: "Ready to go" },
    ];

    return (
        <div className="cr-stepper">
            {steps.map((s, i) => {
                const isDone = step > i;
                const isActive = step === i;

                return (
                    // React.Fragment with key to avoid array-key warnings
                    // We render [step, connector] pairs — connector first for i>0
                    <div key={i} className="cr-stepper__pair">

                        {/* Connector line that precedes this step (not shown for step 0) */}
                        {i > 0 && (
                            <div
                                className="cr-step-connector"
                                style={{ marginTop: BUBBLE_H / 2 - 1 + "px" }}
                            >
                                <div
                                    className={`cr-step-connector__fill${step > i - 1 ? " cr-step-connector__fill--on" : ""
                                        }`}
                                />
                            </div>
                        )}

                        {/* Step item itself */}
                        <div
                            className={`cr-step${isDone ? " cr-step--done" :
                                isActive ? " cr-step--active" : ""
                                }`}
                        >
                            {/* Outer ring (glow effect when active) */}
                            <div className="cr-step__ring">
                                <div className="cr-step__bubble">
                                    {isDone ? <CheckIcon /> : <span className="cr-step__num">{i + 1}</span>}
                                </div>
                            </div>

                            {/* Labels */}
                            <div className="cr-step__labels">
                                <span className="cr-step__label">{s.label}</span>
                                <span className="cr-step__value">{s.value}</span>
                            </div>
                        </div>

                    </div>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────────────────────────
   URL ↔ STEP HELPERS
───────────────────────────────────────────────── */
function parseCreativeUrl(pathname: string) {
    const base = '/creatives/new';
    const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, '') : '';
    const [catKey, seg1, seg2] = rest.split('/').filter(Boolean);

    if (!catKey) return { step: 0 as const, catId: null, sizeId: null, formatId: null };
    const cat = adCategories.find(c => c.key === catKey);
    if (!cat) return { step: 0 as const, catId: null, sizeId: null, formatId: null };

    if (cat.hasAdSizes) {
        if (!seg1) return { step: 1 as const, catId: cat.id, sizeId: null, formatId: null };
        const size = cat.adSizes.find(s => s.key === seg1);
        if (!size) return { step: 1 as const, catId: cat.id, sizeId: null, formatId: null };
        if (!seg2) return { step: 2 as const, catId: cat.id, sizeId: size.id, formatId: null };
        return { step: 3 as const, catId: cat.id, sizeId: size.id, formatId: seg2 };
    } else {
        if (!seg1) return { step: 2 as const, catId: cat.id, sizeId: '_direct', formatId: null };
        return { step: 3 as const, catId: cat.id, sizeId: '_direct', formatId: seg1 };
    }
}

function buildCreativeUrl(catId: string | null, sizeId: string | null, formatId: string | null): string {
    if (!catId) return '/creatives/new';
    const cat = adCategories.find(c => c.id === catId);
    if (!cat) return '/creatives/new';
    const base = `/creatives/new/${cat.key}`;
    if (!cat.hasAdSizes) return formatId ? `${base}/${formatId}` : base;
    if (!sizeId || sizeId === '_direct') return base;
    const size = cat.adSizes.find(s => s.id === sizeId);
    if (!size) return base;
    return formatId ? `${base}/${size.key}/${formatId}` : `${base}/${size.key}`;
}

/* ─────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────── */
export default function Creatives({ editId }: { editId?: string } = {}) {
    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [direction, setDirection] = useState<"forward" | "back">("forward");
    const [activeCatId, setActiveCatId] = useState<string | null>(null);
    const [activeSizeId, setActiveSizeId] = useState<string | null>(null);
    const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
    const [previewFormatId, setPreviewFormatId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [creativeId, setCreativeId] = useState("");
    const [lastModified, setLastModified] = useState("");
    const [, setShowFeedbackPreview] = useState(false);
    const [previewMode, setPreviewMode] = useState<"mobile" | "tablet" | "desktop">("mobile");
    const [formTab, setFormTab] = useState<"content" | "style" | "settings">("content");
    const [fullscreenPreview, setFullscreenPreview] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const topRef = useRef<HTMLDivElement>(null);
    const mainImageInputRef = useRef<HTMLInputElement>(null);
    const fallbackImageInputRef = useRef<HTMLInputElement>(null);
    // Single shared file input for registry format image fields
    const registryImageInputRef = useRef<HTMLInputElement>(null);
    const [pendingImageKey, setPendingImageKey] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { activeAdvertiserId } = useAuth();

    // Load campaigns from DB for the campaign selector — scoped to active advertiser
    const { data: campaignsData } = useCampaigns(activeAdvertiserId ?? undefined);
    const campaignOptions = useMemo(
        () => (campaignsData ?? []).map((c) => ({ value: c.id, label: c.name })),
        [campaignsData]
    );
    const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
    const createCreative = useCreateCreative();
    const [isCreating, setIsCreating] = useState(false);
    const { data: existingCreative, isLoading: loadingExisting } = useCreative(editId);
    const updateCreativeMutation = useUpdateCreative();
    const [editInitialized, setEditInitialized] = useState(false);
    const [, setPublishedBundleUrl] = useState<string | null>(null);
    const [createdCreative, setCreatedCreative] = useState<Tables<'creatives'> | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Track the last URL we intentionally navigated to (to skip circular sync)
    const lastNavUrl = useRef<string | null>(null);

    // Sync state from URL — fires on mount (refresh support) and on browser back/forward
    useEffect(() => {
        // Edit mode: state is driven by existingCreative data, not URL segments
        if (editId) return;
        // If we triggered this URL change ourselves, state is already correct — skip
        if (lastNavUrl.current === location.pathname) {
            lastNavUrl.current = null;
            return;
        }

        const parsed = parseCreativeUrl(location.pathname);

        // Don't overwrite a publish-in-progress
        if (step === 4) return;

        setStep(parsed.step as any);
        setActiveCatId(parsed.catId);
        setActiveSizeId(parsed.sizeId);
        setSelectedFormatId(parsed.formatId);

        if (parsed.formatId) {
            const found = allFormats.find(f => f.id === parsed.formatId);
            if (found?.previewModes?.[0]) setPreviewMode(found.previewModes[0]);

            const registryFmt = getFormat(parsed.formatId);
            const dynamicDefaults: Record<string, unknown> = {};
            if (registryFmt) {
                for (const field of registryFmt.fields) {
                    if (field.type === 'group') continue;
                    if ((field as any).type === 'array' && (field as any).arrayConfig) {
                        const af = field as any;
                        dynamicDefaults[field.id] = Array.from(
                            { length: af.arrayConfig.minItems ?? 1 },
                            () => ({ ...(af.arrayConfig.defaultItem ?? {}) })
                        );
                    } else if (field.default !== null && field.default !== undefined) {
                        dynamicDefaults[field.id] = field.default;
                    }
                }
            }
            const initialDevices = found?.previewModes?.flatMap((m: string) => {
                if (m === 'desktop') return ['desktop'];
                if (m === 'mobile') return ['mobile-portrait', 'mobile-landscape'];
                if (m === 'tablet') return ['tablet-portrait', 'tablet-landscape'];
                return [];
            }) ?? ['desktop', 'mobile-portrait', 'mobile-landscape', 'tablet-portrait', 'tablet-landscape'];
            setCustomData(prev => ({
                ...prev,
                enabledDevices: initialDevices,
                dynamicValues: registryFmt ? dynamicDefaults : {},
            }));
        } else if (parsed.step < 3) {
            resetCustomData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Edit mode: populate form state from the fetched creative
    useEffect(() => {
        if (!editId || !existingCreative || editInitialized) return;

        const fmtId = existingCreative.format_id ?? '';

        // Find which category and size contains this format
        let foundCatId: string | null = null;
        let foundSizeId: string | null = null;
        outer: for (const cat of adCategories) {
            if (cat.hasAdSizes) {
                for (const sz of cat.adSizes) {
                    if (sz.formats.some(f => f.id === fmtId)) {
                        foundCatId = cat.id;
                        foundSizeId = sz.id;
                        break outer;
                    }
                }
            } else {
                if (cat.formats.some(f => f.id === fmtId)) {
                    foundCatId = cat.id;
                    foundSizeId = '_direct';
                    break outer;
                }
            }
        }

        setActiveCatId(foundCatId);
        setActiveSizeId(foundSizeId);
        setSelectedFormatId(fmtId || null);

        // Set preview mode based on format capabilities
        const fmtDef = allFormats.find(f => f.id === fmtId);
        if (fmtDef?.previewModes?.[0]) setPreviewMode(fmtDef.previewModes[0]);

        // Pre-populate customData from template_data
        const td = (existingCreative.template_data as Record<string, unknown>) ?? {};
        const metaKeys = new Set(['type', 'id', 'advertiserId', 'campaignId', 'ctaUrl', 'ctaText',
            'image', 'fallbackImage', 'brandColor', 'brandTextColor', 'enableFeedback',
            'enabledDevices', 'linkType', 'campaignSource', 'campaignMedium',
            'trackerImpression', 'trackerClick', 'trackerCTA']);
        const dv: Record<string, unknown> = {};
        for (const key of Object.keys(td)) {
            if (!metaKeys.has(key)) dv[key] = td[key];
        }

        setCustomData(prev => ({
            ...prev,
            creativeName: existingCreative.name ?? '',
            campaignName: existingCreative.campaign_id ?? '',
            link: (td.ctaUrl as string) || '',
            cta: (td.ctaText as string) || 'Learn More',
            image: (td.image as string) || '',
            fallbackImage: (td.fallbackImage as string) || '',
            customCTAColor: (td.brandColor as string) || '',
            customCTATextColor: (td.brandTextColor as string) || '',
            enableFeedback: Boolean(td.enableFeedback),
            enabledDevices: (td.enabledDevices as string[]) || ['mobile', 'tablet', 'desktop'],
            linkType: (td.linkType as string) || 'hyperlink',
            campaignSource: (td.campaignSource as string) || '',
            campaignMedium: (td.campaignMedium as string) || '',
            dynamicValues: dv,
        }));

        setFormTab('content');
        setStep(3);
        setEditInitialized(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, existingCreative, editInitialized]);

    // Validation errors for Step 3 → Step 4 transition
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Supabase storage base URL for CDN tag generation
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';

    // Form data for customization
    const [customData, setCustomData] = useState({
        creativeName: "",
        image: "",
        link: "",
        imageRedirect: "",
        linkType: "hyperlink",
        cta: "Learn More",
        fallbackImage: "",
        campaignSource: "",
        campaignMedium: "",
        campaignName: "",
        trackerImpression: "",
        trackerClick: "",
        trackerCTA: "",
        customCTAColor: "",
        customCTATextColor: "",
        enableFeedback: true,
        enabledDevices: [] as string[],
        dynamicValues: {} as Record<string, any>
    });

    const resetCustomData = () => {
        setCustomData({
            creativeName: "",
            image: "",
            link: "",
            imageRedirect: "",
            linkType: "hyperlink",
            cta: "Learn More",
            fallbackImage: "",
            campaignSource: "",
            campaignMedium: "",
            campaignName: "",
            trackerImpression: "",
            trackerClick: "",
            trackerCTA: "",
            customCTAColor: "",
            customCTATextColor: "",
            enableFeedback: true,
            enabledDevices: [],
            dynamicValues: {}
        });
    };

    /** Build the final CTA URL based on linkType and append UTM params */
    const buildCtaUrl = () => {
        const raw = customData.link?.trim() || '';
        let url: string;
        switch (customData.linkType) {
            case 'sms':
                url = raw ? `sms:${raw}` : '';
                break;
            case 'call':
                url = raw ? `tel:${raw}` : '';
                break;
            case 'email':
                url = raw ? `mailto:${raw}` : '';
                break;
            case 'whatsappchat':
                url = raw
                    ? (raw.startsWith('http') ? raw : `https://wa.me/${raw.replace(/[^0-9]/g, '')}`)
                    : '';
                break;
            case 'none':
                url = '';
                break;
            default: // 'hyperlink'
                url = raw || 'https://www.scrolltoday.com';
                break;
        }
        // Append UTM params for hyperlink-type URLs
        if (url && url.startsWith('http')) {
            const params = new URLSearchParams();
            if (customData.campaignSource) params.set('utm_source', customData.campaignSource);
            if (customData.campaignMedium) params.set('utm_medium', customData.campaignMedium);
            // Use creativeName for utm_campaign since campaignName is the campaign ID
            if (customData.campaignSource || customData.campaignMedium) {
                const sep = url.includes('?') ? '&' : '?';
                const qs = params.toString();
                if (qs) url = `${url}${sep}${qs}`;
            }
        }
        return url || 'https://www.scrolltoday.com';
    };

    const category = activeCatId ? adCategories.find((c) => c.id === activeCatId) ?? null : null;
    const currentSize = category?.adSizes.find((s) => s.id === activeSizeId) ?? null;

    const themeColor = category?.color || "#6366f1";
    const brandColor = customData.customCTAColor || themeColor;
    const brandTextColor = customData.customCTATextColor || "#ffffff";

    // To find the selected format object
    const selectedFormat = useMemo(() => {
        if (!selectedFormatId || !category) return null;
        const fmts = category.hasAdSizes
            ? (category.adSizes.find((s) => s.id === activeSizeId)?.formats ?? [])
            : category.formats;
        return fmts.find(f => f.id === selectedFormatId) || null;
    }, [selectedFormatId, category, activeSizeId]);

    // Registry format definition (if the selected format has a registered renderer)
    const registryFormat = selectedFormat ? getFormat(selectedFormat.id) : undefined;

    // ── Manual-only preview for registered formats ─────────────────────────
    // Preview only updates when the user clicks Refresh.
    const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
    const [snapshotDv, setSnapshotDv] = useState(customData.dynamicValues);
    const [snapshotFeedback, setSnapshotFeedback] = useState(customData.enableFeedback);

    const refreshPreview = useCallback(() => {
        setSnapshotDv(customData.dynamicValues);
        setSnapshotFeedback(customData.enableFeedback);
        setPreviewRefreshKey(k => k + 1);
    }, [customData.dynamicValues, customData.enableFeedback]);

    // Live preview HTML for registered formats — generic, driven by FormatDefinition.fields
    const registryPreviewHtml = useMemo(() => {
        if (!registryFormat || !selectedFormat) return '';
        const dv = snapshotDv as Record<string, unknown>;

        // Build config from each field's current value (or its default)
        // Inject ctaUrl from common settings (Interaction Type + UTM) so renderers get the resolved URL
        const config: Record<string, unknown> = { type: selectedFormat.id, enableFeedback: snapshotFeedback, ctaUrl: buildCtaUrl() };
        for (const field of registryFormat.fields) {
            if (field.type === 'group') continue;
            if (field.type === 'array' && field.arrayConfig) {
                const arr = dv[field.id] as Record<string, unknown>[] | undefined;
                config[field.id] = arr && arr.length > 0
                    ? arr
                    : Array.from({ length: field.arrayConfig.minItems ?? 1 },
                        () => ({ ...(field.arrayConfig!.defaultItem ?? {}) }));
            } else {
                config[field.id] = dv[field.id] !== undefined ? dv[field.id] : field.default;
            }
        }
        return generatePreviewHtml(config as any, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registryFormat, selectedFormat?.id, snapshotDv, snapshotFeedback, previewRefreshKey]);

    /* pick category → next step */
    const pickCategory = (id: string) => {
        const cat = adCategories.find((c) => c.id === id)!;
        setActiveCatId(id);
        setActiveSizeId(cat.hasAdSizes ? null : "_direct");
        setSelectedFormatId(null);
        resetCustomData();
        setSearch("");
        setDirection("forward");
        setStep(cat.hasAdSizes ? 1 : 2);
        const url = `/creatives/new/${cat.key}`;
        lastNavUrl.current = url;
        navigate(url);
        setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };

    const goBack = () => {
        setDirection("back");
        if (step === 3) resetCustomData();

        // Compute the parent URL based on current step
        let parentUrl = '/creatives/new';
        if (category) {
            if (step === 3) {
                // Back to format picker
                parentUrl = buildCreativeUrl(activeCatId, category.hasAdSizes ? activeSizeId : null, null);
            } else if (step === 2) {
                // Back to size picker (has-size) or category picker (no-size, skipping step 1)
                parentUrl = category.hasAdSizes
                    ? `/creatives/new/${category.key}`
                    : '/creatives/new';
            } else if (step === 1) {
                parentUrl = '/creatives/new';
            }
        }

        if (step > 0) {
            const newStep = (step === 2 && category && !category.hasAdSizes) ? 0 : (step - 1);
            setStep(newStep as any);
        }
        lastNavUrl.current = parentUrl;
        navigate(parentUrl);
        setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };

    /* pick size → next step */
    const pickSize = (id: string) => {
        setActiveSizeId(id);
        setSearch("");
        setStep(2);
        if (category) {
            const size = category.adSizes.find(s => s.id === id);
            if (size) {
                const url = `/creatives/new/${category.key}/${size.key}`;
                lastNavUrl.current = url;
                navigate(url);
            }
        }
    };

    /* select format → go to customize */
    const selectFormat = (id: string) => {
        const found = allFormats.find(f => f.id === id);

        // Initialize default device targeting based on format capabilities
        let initialDevices: string[] = [];
        if (found && found.previewModes) {
            found.previewModes.forEach(mode => {
                if (mode === "desktop") initialDevices.push("desktop");
                if (mode === "mobile") initialDevices.push("mobile-portrait", "mobile-landscape");
                if (mode === "tablet") initialDevices.push("tablet-portrait", "tablet-landscape");
            });
        } else {
            // Default fallback
            initialDevices = ["desktop", "mobile-portrait", "mobile-landscape", "tablet-portrait", "tablet-landscape"];
        }

        // Set initial preview mode based on available modes
        if (found && found.previewModes && found.previewModes[0]) {
            setPreviewMode(found.previewModes[0]);
        } else {
            setPreviewMode("mobile");
        }

        // If it's a registered format, seed dynamicValues with field defaults
        const registryFmt = getFormat(id);
        const dynamicDefaults: Record<string, unknown> = {};
        if (registryFmt) {
            for (const field of registryFmt.fields) {
                if (field.type === 'group') continue;
                if (field.type === 'array' && field.arrayConfig) {
                    dynamicDefaults[field.id] = Array.from(
                        { length: field.arrayConfig.minItems ?? 1 },
                        () => ({ ...(field.arrayConfig!.defaultItem ?? {}) })
                    );
                } else if (field.default !== null && field.default !== undefined) {
                    dynamicDefaults[field.id] = field.default;
                }
            }
        }

        setCustomData({
            ...customData,
            enabledDevices: initialDevices,
            dynamicValues: registryFmt ? dynamicDefaults : {},
        });
        setSelectedFormatId(id);
        setDirection("forward");
        setStep(3);
        setFormTab("content");
        const url = buildCreativeUrl(activeCatId, activeSizeId, id);
        lastNavUrl.current = url;
        navigate(url);
        setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };

    /* select a format from the global search (step 0) — fully self-contained */
    const selectFormatGlobal = (formatId: string) => {
        const info = findFormatById(formatId);
        if (!info) return;

        const catId = info.category.id;
        const sizeId = info.size ? info.size.id : '_direct';
        const found = allFormats.find(f => f.id === formatId);

        // Device targeting defaults
        let initialDevices: string[] = [];
        if (found?.previewModes) {
            found.previewModes.forEach(mode => {
                if (mode === "desktop") initialDevices.push("desktop");
                if (mode === "mobile") initialDevices.push("mobile-portrait", "mobile-landscape");
                if (mode === "tablet") initialDevices.push("tablet-portrait", "tablet-landscape");
            });
        } else {
            initialDevices = ["desktop", "mobile-portrait", "mobile-landscape", "tablet-portrait", "tablet-landscape"];
        }
        if (found?.previewModes?.[0]) {
            setPreviewMode(found.previewModes[0]);
        } else {
            setPreviewMode("mobile");
        }

        // Seed dynamic field defaults from registry
        const registryFmt = getFormat(formatId);
        const dynamicDefaults: Record<string, unknown> = {};
        if (registryFmt) {
            for (const field of registryFmt.fields) {
                if (field.type === 'group') continue;
                if (field.type === 'array' && field.arrayConfig) {
                    dynamicDefaults[field.id] = Array.from(
                        { length: field.arrayConfig.minItems ?? 1 },
                        () => ({ ...(field.arrayConfig!.defaultItem ?? {}) })
                    );
                } else if (field.default !== null && field.default !== undefined) {
                    dynamicDefaults[field.id] = field.default;
                }
            }
        }

        // Set all state at once
        setActiveCatId(catId);
        setActiveSizeId(sizeId);
        setSearch("");
        setCustomData({
            ...customData,
            enabledDevices: initialDevices,
            dynamicValues: registryFmt ? dynamicDefaults : {},
        });
        setSelectedFormatId(formatId);
        setDirection("forward");
        setStep(3);
        setFormTab("content");

        // Navigate to the correct URL
        const url = buildCreativeUrl(catId, sizeId, formatId);
        lastNavUrl.current = url;
        navigate(url);
        setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    };

    /* save edits to an existing creative (edit mode) */
    const handleSaveEdit = async () => {
        if (!editId || !selectedFormat || !activeAdvertiserId) return;

        const errors: Record<string, string> = {};
        if (!customData.creativeName.trim()) errors.creativeName = 'Creative name is required';
        if (!customData.campaignName) errors.campaignName = 'Campaign selection is required';
        if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
        setValidationErrors({});

        setIsCreating(true);
        try {
            const trackUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/track-event` : '';
            const ctaUrl = buildCtaUrl();

            let width: number | null = null;
            let height: number | null = null;
            if (selectedFormat.dimension) {
                const parts = selectedFormat.dimension.toLowerCase().split(/[x×]/);
                width = parseInt(parts[0] ?? '', 10) || null;
                height = parseInt(parts[1] ?? '', 10) || null;
            }
            const w = width || 300;
            const h = height || 250;

            // Helper: upload new blob URLs to Supabase Storage
            const uploadBlob = async (blobUrl: string, folder = ''): Promise<string> => {
                if (!blobUrl.startsWith('blob:')) return blobUrl;
                const res = await fetch(blobUrl);
                const blob = await res.blob();
                const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
                const filePath = `${activeAdvertiserId!}/${folder || crypto.randomUUID()}/asset.${ext}`;
                const { error } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(filePath, blob, { cacheControl: '31536000', upsert: false });
                if (error) return blobUrl;
                return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath).data.publicUrl;
            };

            if (registryFormat) {
                const rawDv = customData.dynamicValues as Record<string, unknown>;
                const dv: Record<string, unknown> = {};
                for (const key of Object.keys(rawDv)) {
                    const val = rawDv[key];
                    if (typeof val === 'string' && val.startsWith('blob:')) {
                        dv[key] = await uploadBlob(val, key);
                    } else if (Array.isArray(val)) {
                        dv[key] = await Promise.all(val.map(async (item: unknown) => {
                            if (item && typeof item === 'object') {
                                const updated = { ...(item as Record<string, unknown>) };
                                for (const subKey of Object.keys(updated)) {
                                    if (typeof updated[subKey] === 'string' && (updated[subKey] as string).startsWith('blob:')) {
                                        updated[subKey] = await uploadBlob(updated[subKey] as string, `${key}_${subKey}`);
                                    }
                                }
                                return updated;
                            }
                            return item;
                        }));
                    } else {
                        dv[key] = val;
                    }
                }

                const enrichedConfig: Record<string, unknown> = {
                    type: selectedFormat.id,
                    ctaUrl,
                    ...dv,
                    ctaText: (dv.ctaText as string) || customData.cta || 'Learn More',
                    enableFeedback: customData.enableFeedback,
                    id: editId,
                    advertiserId: activeAdvertiserId,
                    campaignId: customData.campaignName,
                };
                const enrichedHtml = generatePreviewHtml(enrichedConfig as any, trackUrl);

                const bundleJs = generateCdnBundle({ renderedHtml: enrichedHtml, width: w, height: h });
                const { error: bundleErr } = await supabase.storage
                    .from('ad-bundles')
                    .upload(`${editId}.js`, new Blob([bundleJs], { type: 'application/javascript' }), {
                        upsert: true, cacheControl: '3600',
                    });
                if (bundleErr) throw new Error(`Bundle upload failed: ${bundleErr.message}`);
                const bundleUrl = getBundleUrl(editId);

                await updateCreativeMutation.mutateAsync({
                    id: editId,
                    updates: {
                        name: customData.creativeName,
                        campaign_id: customData.campaignName,
                        template_data: enrichedConfig as unknown as Json,
                        rendered_html: enrichedHtml,
                        bundle_url: bundleUrl,
                        width,
                        height,
                    },
                });
            } else {
                // Static banner path
                const imageUrl = await uploadBlob(customData.image || '', 'main');
                const fallbackImageUrl = customData.fallbackImage
                    ? await uploadBlob(customData.fallbackImage, 'fallback')
                    : '';
                const enrichedConfig = {
                    type: selectedFormat.id, imageUrl, ctaUrl,
                    ctaText: customData.cta || 'Learn More', brandColor, brandTextColor,
                    enableFeedback: customData.enableFeedback,
                    fallbackImage: fallbackImageUrl,
                    id: editId,
                    advertiserId: activeAdvertiserId,
                    campaignId: customData.campaignName,
                };
                const enrichedHtml = buildAdPayload({
                    config: enrichedConfig,
                    formatCss: STATIC_BANNER_CSS,
                    formatJs: STATIC_BANNER_JS,
                    formatFunctionName: 'renderStaticBanner',
                    trackUrl,
                });
                const bundleJs = generateCdnBundle({ renderedHtml: enrichedHtml, width: w, height: h });
                const { error: bundleErr } = await supabase.storage
                    .from('ad-bundles')
                    .upload(`${editId}.js`, new Blob([bundleJs], { type: 'application/javascript' }), {
                        upsert: true, cacheControl: '3600',
                    });
                if (bundleErr) throw new Error(`Bundle upload failed: ${bundleErr.message}`);
                const bundleUrl = getBundleUrl(editId);

                await updateCreativeMutation.mutateAsync({
                    id: editId,
                    updates: {
                        name: customData.creativeName,
                        campaign_id: customData.campaignName,
                        template_data: { ...customData, imageUrl, fallbackImage: fallbackImageUrl } as unknown as Json,
                        rendered_html: enrichedHtml,
                        bundle_url: bundleUrl,
                        width,
                        height,
                    },
                });
            }

            toast.success('Creative saved successfully');
            navigate('/creatives');
        } catch (err) {
            setValidationErrors({
                creativeName: err instanceof Error ? err.message : 'Failed to save creative.',
            });
        } finally {
            setIsCreating(false);
        }
    };

    /* finalize customization → full publish pipeline → go to Step 4 */
    const handleFinalize = async () => {
        // Validate required fields
        const errors: Record<string, string> = {};
        if (!customData.creativeName.trim()) errors.creativeName = 'Creative name is required';
        if (!customData.campaignName) errors.campaignName = 'Campaign selection is required';
        if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }
        setValidationErrors({});

        if (!activeAdvertiserId) {
            setValidationErrors({ creativeName: 'No advertiser account found.' });
            return;
        }
        if (!selectedFormat) return;

        // Parse width/height from dimension string e.g. "300x250", "320×50"
        let width: number | null = null;
        let height: number | null = null;
        if (selectedFormat.dimension) {
            const parts = selectedFormat.dimension.toLowerCase().split(/[x×]/);
            width = parseInt(parts[0] ?? '', 10) || null;
            height = parseInt(parts[1] ?? '', 10) || null;
        }
        const w = width || 300;
        const h = height || 250;

        setIsCreating(true);
        try {
            const trackUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/track-event` : '';
            const ctaUrl = buildCtaUrl();

            // ── Helper: upload a blob URL to Supabase Storage → return permanent URL ──
            const uploadBlob = async (blobUrl: string, folder = ''): Promise<string> => {
                if (!blobUrl.startsWith('blob:')) return blobUrl;
                const res = await fetch(blobUrl);
                const blob = await res.blob();
                const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
                const filePath = `${activeAdvertiserId!}/${folder || crypto.randomUUID()}/asset.${ext}`;
                const { error } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(filePath, blob, { cacheControl: '31536000', upsert: false });
                if (error) return blobUrl; // fallback — non-fatal
                return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath).data.publicUrl;
            };

            let initialHtml: string;
            let enrichedConfig: Record<string, unknown>;

            if (registryFormat) {
                // ── REGISTERED FORMAT PATH (flipcard, cube, countdown, …) ──────────────

                // Step 1: Upload any blob images in dynamicValues (including nested arrays)
                const rawDv = customData.dynamicValues as Record<string, unknown>;
                const dv: Record<string, unknown> = {};
                for (const key of Object.keys(rawDv)) {
                    const val = rawDv[key];
                    if (typeof val === 'string' && val.startsWith('blob:')) {
                        dv[key] = await uploadBlob(val, key);
                    } else if (Array.isArray(val)) {
                        // Handle arrays of objects (e.g. cube faces)
                        dv[key] = await Promise.all(val.map(async (item: unknown) => {
                            if (item && typeof item === 'object') {
                                const updated = { ...(item as Record<string, unknown>) };
                                for (const subKey of Object.keys(updated)) {
                                    if (typeof updated[subKey] === 'string' && (updated[subKey] as string).startsWith('blob:')) {
                                        updated[subKey] = await uploadBlob(updated[subKey] as string, `${key}_${subKey}`);
                                    }
                                }
                                return updated;
                            }
                            return item;
                        }));
                    } else {
                        dv[key] = val;
                    }
                }

                // Step 2: Build draft config (no tracking IDs yet)
                const draftConfig: Record<string, unknown> = {
                    type: selectedFormat.id,
                    ctaUrl,
                    ...dv,
                    // Merge wizard-level fields that map to format fields
                    ctaText: (dv.ctaText as string) || customData.cta || 'Learn More',
                    enableFeedback: customData.enableFeedback,
                };
                initialHtml = generatePreviewHtml(draftConfig as any, '');

                // Step 3: Save draft to DB
                const created = await createCreative.mutateAsync({
                    advertiser_id: activeAdvertiserId,
                    campaign_id: customData.campaignName,
                    name: customData.creativeName,
                    format_id: selectedFormat.id,
                    format_name: selectedFormat.name,
                    template_data: draftConfig as unknown as Json,
                    rendered_html: initialHtml,
                    width,
                    height,
                    status: 'draft',
                });

                // Step 4: Re-render with tracking IDs baked in
                enrichedConfig = {
                    ...draftConfig,
                    id: created.id,
                    advertiserId: activeAdvertiserId,
                    campaignId: customData.campaignName,
                };
                const enrichedHtml = generatePreviewHtml(enrichedConfig as any, trackUrl);

                // Steps 5-7: Bundle, upload, activate
                const bundleJs = generateCdnBundle({ renderedHtml: enrichedHtml, width: w, height: h });
                const { error: bundleErr } = await supabase.storage
                    .from('ad-bundles')
                    .upload(`${created.id}.js`, new Blob([bundleJs], { type: 'application/javascript' }), {
                        upsert: true, cacheControl: '3600',
                    });
                if (bundleErr) throw new Error(`Bundle upload failed: ${bundleErr.message}`);
                const bundleUrl = getBundleUrl(created.id);
                const finalRecord = await updateCreative(created.id, {
                    rendered_html: enrichedHtml,
                    bundle_url: bundleUrl,
                    status: 'active',
                });

                setCreativeId(created.id);
                setPublishedBundleUrl(bundleUrl);
                setCreatedCreative(finalRecord);
            } else {
                // ── STATIC BANNER PATH (all non-registered formats) ──────────────────

                // Step 1: Upload main image + fallback blob → permanent URLs
                const imageUrl = await uploadBlob(customData.image || '', 'main');
                const fallbackImageUrl = customData.fallbackImage
                    ? await uploadBlob(customData.fallbackImage, 'fallback')
                    : '';

                // Step 2: Build draft HTML
                initialHtml = buildAdPayload({
                    config: { type: selectedFormat.id, imageUrl, ctaUrl, ctaText: customData.cta || 'Learn More', brandColor, brandTextColor, enableFeedback: customData.enableFeedback },
                    formatCss: STATIC_BANNER_CSS,
                    formatJs: STATIC_BANNER_JS,
                    formatFunctionName: 'renderStaticBanner',
                    trackUrl: '',
                });

                // Step 3: Save draft to DB
                const created = await createCreative.mutateAsync({
                    advertiser_id: activeAdvertiserId,
                    campaign_id: customData.campaignName,
                    name: customData.creativeName,
                    format_id: selectedFormat.id,
                    format_name: selectedFormat.name,
                    template_data: { ...customData, imageUrl, fallbackImage: fallbackImageUrl } as unknown as Json,
                    rendered_html: initialHtml,
                    width,
                    height,
                    status: 'draft',
                });

                // Step 4: Re-render with tracking IDs
                enrichedConfig = {
                    type: selectedFormat.id, imageUrl, ctaUrl,
                    ctaText: customData.cta || 'Learn More', brandColor, brandTextColor,
                    enableFeedback: customData.enableFeedback,
                    id: created.id,
                    advertiserId: activeAdvertiserId,
                    campaignId: customData.campaignName,
                };
                const enrichedHtml = buildAdPayload({
                    config: enrichedConfig,
                    formatCss: STATIC_BANNER_CSS,
                    formatJs: STATIC_BANNER_JS,
                    formatFunctionName: 'renderStaticBanner',
                    trackUrl,
                });

                // Steps 5-7: Bundle, upload, activate
                const bundleJs = generateCdnBundle({ renderedHtml: enrichedHtml, width: w, height: h });
                const { error: bundleErr } = await supabase.storage
                    .from('ad-bundles')
                    .upload(`${created.id}.js`, new Blob([bundleJs], { type: 'application/javascript' }), {
                        upsert: true, cacheControl: '3600',
                    });
                if (bundleErr) throw new Error(`Bundle upload failed: ${bundleErr.message}`);
                const bundleUrl = getBundleUrl(created.id);
                const finalRecord = await updateCreative(created.id, {
                    rendered_html: enrichedHtml,
                    bundle_url: bundleUrl,
                    status: 'active',
                });

                setCreativeId(created.id);
                setPublishedBundleUrl(bundleUrl);
                setCreatedCreative(finalRecord);
            }

            const now = new Date();
            setLastModified(now.toLocaleString('en-US', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }));
            setDirection("forward");
            setStep(4);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            setValidationErrors({
                creativeName: err instanceof Error ? err.message : 'Failed to create creative. Please try again.'
            });
        } finally {
            setIsCreating(false);
        }
    };

    /* filtered formats */
    const displayFormats = useMemo(() => {
        if (!category) return [];
        let formats = category.hasAdSizes
            ? (category.adSizes.find((s) => s.id === activeSizeId)?.formats ?? [])
            : category.formats;
        if (search.trim()) {
            const q = search.toLowerCase();
            formats = formats.filter((f) =>
                f.name.toLowerCase().includes(q) ||
                (f.dimension && f.dimension.toLowerCase().includes(q))
            );
        }
        return formats;
    }, [category, activeSizeId, search]);

    /* deferred search value — keeps typing snappy while results render in background */
    const deferredSearch = useDeferredValue(search);

    /* global search: matching CATEGORIES first (step 0) */
    const matchingCategories = useMemo(() => {
        if (step !== 0 || !deferredSearch.trim()) return [];
        const q = deferredSearch.toLowerCase();
        return adCategories.filter(cat =>
            cat.name.toLowerCase().includes(q) ||
            cat.description.toLowerCase().includes(q) ||
            cat.key.toLowerCase().includes(q)
        );
    }, [step, deferredSearch]);

    /* global search: matching FORMATS grouped by category (step 0) */
    const globalSearchGroups = useMemo(() => {
        if (step !== 0 || !deferredSearch.trim()) return [];
        const q = deferredSearch.toLowerCase();
        const groups: { category: AdCategory; formats: { format: typeof allFormats[0]; sizeName?: string }[] }[] = [];
        for (const cat of adCategories) {
            const matches: { format: typeof allFormats[0]; sizeName?: string }[] = [];
            for (const f of cat.formats) {
                if (f.name.toLowerCase().includes(q) || (f.dimension && f.dimension.toLowerCase().includes(q))) {
                    matches.push({ format: f });
                }
            }
            for (const size of cat.adSizes) {
                for (const f of size.formats) {
                    if (f.name.toLowerCase().includes(q) || (f.dimension && f.dimension.toLowerCase().includes(q))) {
                        matches.push({ format: f, sizeName: size.name });
                    }
                }
            }
            if (matches.length > 0) groups.push({ category: cat, formats: matches });
        }
        return groups;
    }, [step, deferredSearch]);

    const globalSearchCount = useMemo(
        () => matchingCategories.length + globalSearchGroups.reduce((sum, g) => sum + g.formats.length, 0),
        [matchingCategories, globalSearchGroups]
    );

    /* "/" keyboard shortcut for search */
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "/" && (step === 0 || step === 2) && document.activeElement !== searchRef.current) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [step]);

    /* ESC to close fullscreen preview */
    useEffect(() => {
        if (!fullscreenPreview) return;
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreenPreview(false); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [fullscreenPreview]);

    const totalFormats = adCategories.reduce(
        (s, c) => s + c.formats.length + c.adSizes.reduce((a, sz) => a + sz.formats.length, 0), 0
    );

    /* ════════════════════ RENDER ════════════════════ */

    // Edit mode: show loading until creative is fetched and state is initialized
    if (editId && (loadingExisting || !editInitialized)) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
                Loading creative…
            </div>
        );
    }
    if (editId && !loadingExisting && !existingCreative) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
                <p style={{ fontWeight: 600 }}>Creative not found</p>
                <button onClick={() => navigate('/creatives')} style={{ color: '#6366f1', textDecoration: 'underline', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>Back to Creatives</button>
            </div>
        );
    }

    return (
        <div className="cr-page" ref={topRef}>

            {/* ── STEPPER (inline, not sticky) — hidden in edit mode ── */}
            {!editId && (
            <div className="cr-stepper-wrap">
                <ProgressStepper
                    step={step}
                    catName={category?.name}
                    sizeName={
                        currentSize?.name ??
                        (!category?.hasAdSizes && step >= 2 ? "All" : undefined)
                    }
                    formatName={selectedFormat?.name}
                />
            </div>
            )}

            {/* ════════ STEP 0 — CHOOSE AD TYPE ════════ */}
            {step === 0 && (
                <div className={`cr-view cr-view--enter-${direction}`}>
                    <div className="cr-page-header">
                        <h1 className="cr-page-header__title">Choose an Ad Type</h1>
                        <p className="cr-page-header__sub">
                            {adCategories.length} categories &nbsp;·&nbsp; {totalFormats}+ total formats
                        </p>
                    </div>

                    {/* Global search across all formats */}
                    <div className="cr-toolbar" style={{ marginBottom: 16 }}>
                        <div className="cr-search-wrap">
                            <span className="cr-search-icon"><SearchIcon /></span>
                            <input
                                ref={searchRef}
                                type="text"
                                className="cr-search"
                                placeholder="Search all formats…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search all ad formats"
                            />
                            {search && (
                                <button className="cr-search-clear" onClick={() => setSearch("")}>×</button>
                            )}
                            <kbd className="cr-search-kbd">/</kbd>
                        </div>
                        {deferredSearch.trim() && (
                            <span className="cr-count-pill">
                                <strong>{globalSearchCount}</strong> result{globalSearchCount !== 1 ? "s" : ""}
                                &nbsp;·&nbsp;"<em>{deferredSearch}</em>"
                            </span>
                        )}
                    </div>

                    {deferredSearch.trim() ? (
                        /* Global search results — categories FIRST, then formats */
                        globalSearchCount > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                                {/* ── 1. MATCHING CATEGORIES (top priority) ── */}
                                {matchingCategories.length > 0 && (
                                    <div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            marginBottom: 12, paddingBottom: 8,
                                            borderBottom: '1px solid rgba(148,163,184,0.15)'
                                        }}>
                                            <span style={{ fontWeight: 600, fontSize: 15 }}>Ad Types</span>
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                                {matchingCategories.length} match{matchingCategories.length !== 1 ? 'es' : ''}
                                            </span>
                                        </div>
                                        <div className="cr-cat-grid">
                                            {matchingCategories.map((cat, idx) => (
                                                <button
                                                    key={cat.id}
                                                    className="cr-cat-card"
                                                    style={{ "--cat-color": cat.color, animationDelay: `${idx * 60}ms` } as React.CSSProperties}
                                                    onClick={() => pickCategory(cat.id)}
                                                >
                                                    <div className="cr-cat-card__glow" />
                                                    <div className="cr-cat-card__icon">{cat.icon}</div>
                                                    <div className="cr-cat-card__body">
                                                        <h2 className="cr-cat-card__name">{cat.name}</h2>
                                                        <p className="cr-cat-card__desc">{cat.description}</p>
                                                    </div>
                                                    <div className="cr-cat-card__footer">
                                                        <span className="cr-cat-card__count">{catFormatCount(cat)} formats</span>
                                                        <span className="cr-cat-card__meta">
                                                            {cat.hasAdSizes ? `${cat.adSizes.length} sizes` : "No sub-sizes"}
                                                        </span>
                                                        <span className="cr-cat-card__arrow">→</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── 2. MATCHING FORMATS (grouped by category) ── */}
                                {globalSearchGroups.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            paddingBottom: 4,
                                            borderBottom: '1px solid rgba(148,163,184,0.15)'
                                        }}>
                                            <span style={{ fontWeight: 600, fontSize: 15 }}>Ad Formats</span>
                                        </div>
                                        {globalSearchGroups.map((group) => (
                                            <div key={group.category.id}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    marginBottom: 10
                                                }}>
                                                    <span style={{ fontSize: 18 }}>{group.category.icon}</span>
                                                    <span style={{ fontWeight: 500, fontSize: 14, color: group.category.color }}>
                                                        {group.category.name}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                                        {group.formats.length} match{group.formats.length !== 1 ? 'es' : ''}
                                                    </span>
                                                </div>
                                                <div className="cr-formats-grid">
                                                    {group.formats.map((item, idx) => (
                                                        <div
                                                            key={item.format.id}
                                                            className="cr-fmt-card"
                                                            style={{ animationDelay: `${Math.min(idx * 14, 300)}ms`, cursor: "pointer" }}
                                                            onClick={() => selectFormatGlobal(item.format.id)}
                                                        >
                                                            <div className="cr-fmt-card__top">
                                                                <p className="cr-fmt-card__name">{item.format.name}</p>
                                                                <div
                                                                    className="cr-fmt-card__preview-link"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPreviewFormatId(item.format.id);
                                                                    }}
                                                                    title="View Overview & Device Preview"
                                                                >
                                                                    <EyeIcon />
                                                                </div>
                                                            </div>
                                                            {item.format.dimension && <span className="cr-fmt-card__dim">{item.format.dimension}</span>}
                                                            {item.sizeName && (
                                                                <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                                                                    {item.sizeName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="cr-empty">
                                <p className="cr-empty__text">No results match "<em>{deferredSearch}</em>"</p>
                            </div>
                        )
                    ) : (
                        /* Category cards (default, no search) */
                        <div className="cr-cat-grid">
                            {adCategories.map((cat, idx) => (
                                <button
                                    key={cat.id}
                                    className="cr-cat-card"
                                    style={{ "--cat-color": cat.color, animationDelay: `${idx * 60}ms` } as React.CSSProperties}
                                    onClick={() => pickCategory(cat.id)}
                                >
                                    <div className="cr-cat-card__glow" />
                                    <div className="cr-cat-card__icon">{cat.icon}</div>
                                    <div className="cr-cat-card__body">
                                        <h2 className="cr-cat-card__name">{cat.name}</h2>
                                        <p className="cr-cat-card__desc">{cat.description}</p>
                                    </div>
                                    <div className="cr-cat-card__footer">
                                        <span className="cr-cat-card__count">{catFormatCount(cat)} formats</span>
                                        <span className="cr-cat-card__meta">
                                            {cat.hasAdSizes ? `${cat.adSizes.length} sizes` : "No sub-sizes"}
                                        </span>
                                        <span className="cr-cat-card__arrow">→</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════════ STEP 1 & 2 — SIZE & FORMAT PAGE ════════ */}
            {(step === 1 || step === 2) && category && (
                <div className={`cr-view cr-view--enter-${direction}`}>

                    {/* Header */}
                    <div className="cr-format-header" style={{ "--cat-color": category.color } as React.CSSProperties}>
                        <button className="cr-back-btn" onClick={goBack} aria-label="Back to Ad Types">
                            <BackArrow /> All types
                        </button>
                        <div className="cr-format-header__info">
                            <span className="cr-format-header__icon">{category.icon}</span>
                            <div>
                                <h1 className="cr-format-header__title">{category.name}</h1>
                                <p className="cr-format-header__desc">{category.description}</p>
                            </div>
                            <div className="cr-format-header__badge">{catFormatCount(category)} formats</div>
                        </div>
                    </div>

                    {/* Size selector */}
                    {category.hasAdSizes && (
                        <div className="cr-size-section">
                            <p className="cr-size-section__label">Select Ad Size</p>
                            <div className="cr-size-row">
                                {category.adSizes.map((size) => (
                                    <button
                                        key={size.id}
                                        className={`cr-size-tab${size.id === activeSizeId ? " cr-size-tab--active" : ""}`}
                                        style={{ "--cat-color": category.color } as React.CSSProperties}
                                        onClick={() => pickSize(size.id)}
                                        aria-pressed={size.id === activeSizeId}
                                    >
                                        <span className="cr-size-tab__name">{size.name}</span>
                                        {size.dimension && <span className="cr-size-tab__dim">{size.dimension}</span>}
                                        <span className="cr-size-tab__count">{size.formats.length}</span>
                                    </button>
                                ))}
                            </div>
                            {currentSize && <p className="cr-size-desc">{currentSize.description}</p>}
                        </div>
                    )}

                    {/* Format grid */}
                    {(activeSizeId || !category.hasAdSizes) && (
                        <div className="cr-formats-wrap" style={{ "--cat-color": category.color } as React.CSSProperties}>
                            {/* Toolbar */}
                            <div className="cr-toolbar">
                                <div className="cr-search-wrap">
                                    <span className="cr-search-icon"><SearchIcon /></span>
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        id="search"
                                        name="search"
                                        className="cr-search"
                                        placeholder="Search formats…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        aria-label="Search ad formats"
                                    />
                                    {search && (
                                        <button className="cr-search-clear" onClick={() => setSearch("")}>×</button>
                                    )}
                                    <kbd className="cr-search-kbd">/</kbd>
                                </div>

                                <span className="cr-count-pill">
                                    <strong>{displayFormats.length}</strong> format{displayFormats.length !== 1 ? "s" : ""}
                                    {search && <> · "<em>{search}</em>"</>}
                                </span>

                                <div className="cr-view-toggle" role="group">
                                    <button
                                        className={`cr-view-btn${viewMode === "grid" ? " cr-view-btn--active" : ""}`}
                                        onClick={() => setViewMode("grid")} title="Grid view" aria-pressed={viewMode === "grid"}
                                    ><GridIcon /></button>
                                    <button
                                        className={`cr-view-btn${viewMode === "list" ? " cr-view-btn--active" : ""}`}
                                        onClick={() => setViewMode("list")} title="List view" aria-pressed={viewMode === "list"}
                                    ><ListIcon /></button>
                                </div>
                            </div>

                            {/* Cards / empty */}
                            {displayFormats.length > 0 ? (
                                <div className={viewMode === "grid" ? "cr-formats-grid" : "cr-formats-list"}>
                                    {displayFormats.map((fmt, idx) => (
                                        <div
                                            key={fmt.id}
                                            className="cr-fmt-card"
                                            style={{ animationDelay: `${Math.min(idx * 14, 300)}ms`, cursor: "pointer" }}
                                            onClick={() => selectFormat(fmt.id)}
                                        >
                                            {viewMode === "grid" ? (
                                                <>
                                                    <div className="cr-fmt-card__top">
                                                        <p className="cr-fmt-card__name">{fmt.name}</p>
                                                        <div
                                                            className="cr-fmt-card__preview-link"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewFormatId(fmt.id);
                                                            }}
                                                            title="View Overview & Device Preview"
                                                        >
                                                            <EyeIcon />
                                                        </div>
                                                    </div>
                                                    {fmt.dimension && <span className="cr-fmt-card__dim">{fmt.dimension}</span>}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="cr-fmt-card__idx">{String(idx + 1).padStart(2, "0")}</span>
                                                    <p className="cr-fmt-card__name cr-fmt-card__name--list">{fmt.name}</p>
                                                    {fmt.dimension ? <span className="cr-fmt-card__dim">{fmt.dimension}</span> : <span />}
                                                    <div
                                                        className="cr-fmt-card__preview-link"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewFormatId(fmt.id);
                                                        }}
                                                        style={{ marginLeft: '12px' }}
                                                    >
                                                        <EyeIcon /> Preview
                                                    </div>
                                                    <span className="cr-fmt-card__arrow">→</span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="cr-empty">
                                    <div className="cr-empty__icon">🔍</div>
                                    <p className="cr-empty__title">No formats found</p>
                                    <p className="cr-empty__sub">
                                        {search
                                            ? `No results for "${search}" — try a different keyword.`
                                            : "No formats available for this selection."}
                                    </p>
                                    {search && <button className="cr-empty__clear" onClick={() => setSearch("")}>Clear search</button>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Prompt when size not yet picked */}
                    {category.hasAdSizes && !activeSizeId && (
                        <div className="cr-size-prompt">
                            <span className="cr-size-prompt__icon">☝️</span>
                            <p>Pick an ad size above to see available formats</p>
                        </div>
                    )}
                </div>
            )}

            {/* ════════ STEP 3 — CUSTOMIZE ════════ */}
            {step === 3 && selectedFormat && (
                <div className={`cr-view cr-view--enter-${direction}`}>
                    <div className="cr-format-header" style={{ "--cat-color": category?.color } as React.CSSProperties}>
                        <button className="cr-back-btn" onClick={editId ? () => navigate('/creatives') : goBack}>
                            <BackArrow /> {editId ? 'Back to Creatives' : 'Change Format'}
                        </button>
                        <div className="cr-format-header__info">
                            <span className="cr-format-header__icon">🎨</span>
                            <div>
                                <h1 className="cr-format-header__title">{editId ? 'Edit Creative' : 'Customize Creative'}</h1>
                                <p className="cr-format-header__desc">
                                    Configuring <strong>{selectedFormat.name}</strong>{!editId && <> for {currentSize?.name || "All sizes"}</>}.
                                </p>
                            </div>
                            {editId && existingCreative && (
                                <button
                                    className="cr-finish-btn"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={() => setShowShareDialog(true)}
                                >
                                    Share &amp; Embed
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="cr-customize-container">
                        <div className="cr-customize-form-revamp">

                            {/* ── TAB BAR ── */}
                            <div className="cr-form-tabs">
                                {(["content", "style", "settings"] as const).map(tab => (
                                    <button
                                        key={tab}
                                        className={`cr-form-tab${formTab === tab ? " cr-form-tab--active" : ""}`}
                                        onClick={() => setFormTab(tab)}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* ══ CONTENT TAB ══ */}
                            {/* 0. NAME DECLARATION CARD */}
                            {formTab === "content" && <div className="cr-revamp-card">
                                <h3 className="cr-revamp-card__title">Name Declaration</h3>
                                <div className="cr-revamp-card__grid">
                                    <div className="cr-form-field">
                                        <label className="cr-form-label-legacy" htmlFor="creative-name">Creative Name *</label>
                                        <FormInput
                                            id="creative-name"
                                            name="creative-name"
                                            type="text"
                                            className={`cr-form-input${validationErrors.creativeName ? ' cr-input--error' : ''}`}
                                            placeholder="Enter creative name"
                                            icon={<TextIcon color={themeColor} />}
                                            value={customData.creativeName}
                                            onChange={(e) => setCustomData({ ...customData, creativeName: e.target.value })}
                                        />
                                        {validationErrors.creativeName && (
                                            <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                {validationErrors.creativeName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="cr-form-field">
                                        <label className="cr-form-label-legacy" htmlFor="campaign-name">Campaign Name *</label>
                                        <FormSelect
                                            value={customData.campaignName || ""}
                                            placeholder="Select a campaign"
                                            options={campaignOptions}
                                            onChange={(e: any) => setCustomData({ ...customData, campaignName: e.target.value })}
                                            footerAction={
                                                <button
                                                    type="button"
                                                    onClick={() => setCampaignDialogOpen(true)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                                                        padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer',
                                                        color: '#6366f1', fontSize: '13px', fontWeight: 500,
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                                    Create New Campaign
                                                </button>
                                            }
                                        />
                                        <CampaignFormDialog
                                            open={campaignDialogOpen}
                                            onOpenChange={setCampaignDialogOpen}
                                            onCreated={(created) => setCustomData(prev => ({ ...prev, campaignName: created.id }))}
                                        />
                                        {validationErrors.campaignName && (
                                            <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                {validationErrors.campaignName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>}

                            {/* 1. MAIN ASSET CARD — only for non-registered (static banner) formats */}
                            {formTab === "content" && !registryFormat && <div className="cr-revamp-card">
                                <h3 className="cr-revamp-card__title">Main Asset Configuration</h3>
                                <div className="cr-revamp-card__grid">
                                    <div className="cr-form-field">
                                        <label className="cr-form-label-legacy" htmlFor="creative-image">Creative Image (Main Asset)</label>
                                        <div className="cr-upload-box-v3">
                                            {customData.image && (
                                                <img src={customData.image} alt="Preview" className="cr-dynamic-image-preview" />
                                            )}
                                            <div className="cr-upload-hint">Drag & drop or click</div>
                                            <button
                                                id="creative-image"
                                                name="creative-image"
                                                className="cr-upload-btn-v2"
                                                type="button"
                                                onClick={() => mainImageInputRef.current?.click()}
                                            >
                                                {customData.image ? 'Change Image' : 'Choose Image'}
                                            </button>
                                            <input
                                                ref={mainImageInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) setCustomData({ ...customData, image: URL.createObjectURL(file) })
                                                    e.target.value = ''
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="cr-form-field-stack">
                                        <FormInput
                                            id="designation-url"
                                            name="designation-url"
                                            label="Designation URL"
                                            placeholder="https://example.com/dest"
                                            value={customData.link}
                                            onChange={(e) => setCustomData({ ...customData, link: e.target.value })}
                                            icon={<LinkIcon color={themeColor} />}
                                            infoText="The final destination where users will be landed after clicking the ad."
                                        />
                                        <FormInput
                                            id="image-redirect-url"
                                            name="image-redirect-url"
                                            label="Image Redirect URL"
                                            placeholder="https://example.com/redirect"
                                            value={customData.imageRedirect}
                                            onChange={(e) => setCustomData({ ...customData, imageRedirect: e.target.value })}
                                            icon={<LinkIcon color={themeColor} />}
                                            infoText="An optional redirect URL for specific image interactions."
                                        />
                                    </div>
                                </div>
                            </div>

                            }

                            {/* 2. DYNAMIC FORMAT ASSETS (IF ANY) — only for non-registered formats */}
                            {formTab === "content" && !registryFormat && selectedFormat?.dynamicFields && selectedFormat.dynamicFields.length > 0 && (
                                <div className="cr-revamp-card">
                                    <div className="cr-revamp-card__head">
                                        <h3 className="cr-revamp-card__title">Format Specific Assets</h3>
                                        <InfoIcon tooltip="Upload the visual assets required for this specific ad format." />
                                    </div>
                                    <DynamicFieldMapper
                                        fields={selectedFormat.dynamicFields}
                                        values={customData.dynamicValues}
                                        onChange={(fieldId, val) => setCustomData({
                                            ...customData,
                                            dynamicValues: { ...customData.dynamicValues, [fieldId]: val }
                                        })}
                                        themeColor={themeColor}
                                    />
                                </div>
                            )}

                            {/* ── REGISTERED FORMAT FIELDS — generic, driven by FormatDefinition.fields ── */}
                            {registryFormat && (() => {
                                const dv = customData.dynamicValues as Record<string, unknown>;

                                const updateDv = (key: string, val: unknown) =>
                                    setCustomData(prev => ({
                                        ...prev,
                                        dynamicValues: { ...prev.dynamicValues, [key]: val }
                                    }));

                                const updateArrayItem = (arrKey: string, idx: number, subKey: string, val: unknown) => {
                                    const arr = [...((dv[arrKey] as Record<string, unknown>[]) || [])];
                                    arr[idx] = { ...arr[idx], [subKey]: val };
                                    updateDv(arrKey, arr);
                                };

                                // Shared image upload box for any field
                                const imageBox = (fieldKey: string) => {
                                    const url = (dv[fieldKey] as string) || '';
                                    return (
                                        <div className="cr-upload-box-v3">
                                            {url && <img src={url} alt="Preview" className="cr-dynamic-image-preview" />}
                                            <button type="button" className="cr-upload-btn-v2"
                                                onClick={() => { setPendingImageKey(fieldKey); registryImageInputRef.current?.click(); }}>
                                                {url ? 'Change Image' : 'Choose Image'}
                                            </button>
                                        </div>
                                    );
                                };

                                // Render a single field (non-array, non-group)
                                const renderField = (field: FieldDefinition, val: unknown, onChange: (v: unknown) => void, imageKey: string) => {
                                    switch (field.type) {
                                        case 'group':
                                            return (
                                                <p key={field.id} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', margin: '12px 0 4px', gridColumn: '1 / -1' }}>
                                                    {field.groupLabel || field.label}
                                                </p>
                                            );
                                        case 'image':
                                            return (
                                                <div key={field.id} className="cr-form-field">
                                                    <label className="cr-form-label-legacy">{field.label}</label>
                                                    {imageBox(imageKey)}
                                                </div>
                                            );
                                        case 'color':
                                            return (
                                                <div key={field.id} className="cr-form-field">
                                                    <ColorSwatch
                                                        color={(val as string) || (field.default as string) || '#000000'}
                                                        label={field.label}
                                                        onChange={v => onChange(v)}
                                                    />
                                                </div>
                                            );
                                        case 'switch':
                                            return (
                                                <div key={field.id} className="cr-form-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                                    <label className="cr-form-label-legacy" style={{ margin: 0 }}>{field.label}</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => onChange(!val)}
                                                        style={{
                                                            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                                                            background: val ? 'var(--c-primary, #6366f1)' : '#cbd5e1',
                                                            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                                                        }}
                                                    >
                                                        <span style={{
                                                            position: 'absolute', top: 2, left: val ? 22 : 2,
                                                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                                        }} />
                                                    </button>
                                                </div>
                                            );
                                        case 'textarea':
                                            return (
                                                <div key={field.id} className="cr-form-field">
                                                    <label className="cr-form-label-legacy">{field.label}</label>
                                                    <textarea
                                                        className="cr-form-input"
                                                        value={(val as string) || ''}
                                                        onChange={e => onChange(e.target.value)}
                                                        rows={2}
                                                        style={{ width: '100%', resize: 'vertical', minHeight: '52px' }}
                                                    />
                                                </div>
                                            );
                                        case 'number':
                                            return (
                                                <div key={field.id} className="cr-form-field">
                                                    <FormInput label={field.label} type="number" value={String(val ?? field.default ?? '')}
                                                        onChange={e => onChange(Number(e.target.value))} />
                                                </div>
                                            );
                                        case 'url':
                                        case 'text':
                                        default:
                                            return (
                                                <div key={field.id} className="cr-form-field">
                                                    <FormInput label={field.label} type={field.type === 'url' ? 'url' : 'text'}
                                                        value={(val as string) || ''} onChange={e => onChange(e.target.value)} />
                                                </div>
                                            );
                                    }
                                };

                                // Group fields by tab
                                const contentFields = registryFormat.fields.filter(f => !f.tab || f.tab === 'content');
                                const styleFields = registryFormat.fields.filter(f => f.tab === 'style');
                                const settingsFields = registryFormat.fields.filter(f => f.tab === 'settings');

                                return (
                                    <>
                                        {/* Hidden single file input for all registry image fields */}
                                        <input
                                            ref={registryImageInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                const key = pendingImageKey;
                                                e.target.value = '';
                                                setPendingImageKey(null);
                                                if (file && key) {
                                                    // Use FileReader for base64 data URLs so images work
                                                    // inside sandboxed iframes (blob: URLs are blocked there)
                                                    const reader = new FileReader();
                                                    reader.onload = (evt) => {
                                                        const dataUrl = evt.target?.result as string;
                                                        if (!dataUrl) return;
                                                        const arrMatch = key.match(/^__arr__(.+)__(\d+)__(.+)$/);
                                                        if (arrMatch) {
                                                            updateArrayItem(arrMatch[1]!, Number(arrMatch[2]), arrMatch[3]!, dataUrl);
                                                        } else {
                                                            updateDv(key, dataUrl);
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />

                                        {/* Content fields */}
                                        {formTab === "content" && contentFields.length > 0 && (
                                            <div className="cr-revamp-card">
                                                <h3 className="cr-revamp-card__title">{registryFormat.name}</h3>
                                                {contentFields.map(field => {
                                                    if (field.type === 'array' && field.arrayConfig) {
                                                        const cfg = field.arrayConfig;
                                                        const items = (dv[field.id] as Record<string, unknown>[])
                                                            || Array.from({ length: cfg.minItems ?? 1 }, () => ({ ...cfg.defaultItem }));
                                                        return (
                                                            <div key={field.id}>
                                                                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', margin: '12px 0 8px' }}>{field.label}</p>
                                                                {items.map((item, idx) => (
                                                                    <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                                                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>{cfg.itemLabel ?? 'Item'} {idx + 1}</p>
                                                                        {cfg.fields.map(sub => renderField(
                                                                            sub,
                                                                            item[sub.id] ?? sub.default,
                                                                            val => updateArrayItem(field.id, idx, sub.id, val),
                                                                            `__arr__${field.id}__${idx}__${sub.id}`
                                                                        ))}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return renderField(
                                                        field,
                                                        dv[field.id] !== undefined ? dv[field.id] : field.default,
                                                        val => updateDv(field.id, val),
                                                        field.id
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Style fields */}
                                        {formTab === "style" && styleFields.length > 0 && (
                                            <div className="cr-revamp-card">
                                                <h3 className="cr-revamp-card__title">Style</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {styleFields.map(field => renderField(
                                                        field,
                                                        dv[field.id] !== undefined ? dv[field.id] : field.default,
                                                        val => updateDv(field.id, val),
                                                        field.id
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Settings fields */}
                                        {formTab === "settings" && settingsFields.length > 0 && (
                                            <div className="cr-revamp-card">
                                                <h3 className="cr-revamp-card__title">Settings</h3>
                                                {settingsFields.map(field => renderField(
                                                    field,
                                                    dv[field.id] !== undefined ? dv[field.id] : field.default,
                                                    val => updateDv(field.id, val),
                                                    field.id
                                                ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* ══ STYLE TAB ══ */}
                            {/* 3. BRAND THEME CARD — only for non-registered formats */}
                            {formTab === "style" && !registryFormat && <div className="cr-revamp-card">
                                <div className="cr-revamp-card__head">
                                    <h3 className="cr-revamp-card__title">Brand & Visual Identity</h3>
                                    <InfoIcon tooltip="Customize the visual look and feel to match your brand identity." />
                                </div>
                                <FormInput
                                    id="call-to-action-label"
                                    name="call-to-action-label"
                                    label="Call To Action Label"
                                    placeholder="e.g. Shop Now, Book Now"
                                    value={customData.cta}
                                    onChange={(e) => setCustomData({ ...customData, cta: e.target.value })}
                                    infoText="The text displayed on the main button (e.g., Shop Now)."
                                    icon={<PhoneIcon color={themeColor} />}
                                />

                                <div className="cr-brand-theme-revamp">
                                    <div className="cr-brand-color-box">
                                        <ColorSwatch
                                            color={brandColor}
                                            label="Primary Brand Color"
                                            onChange={(color) => setCustomData({ ...customData, customCTAColor: color })}
                                        />
                                    </div>
                                    <div className="cr-brand-color-box">
                                        <ColorSwatch
                                            color={brandTextColor}
                                            label="Primary Brand Text Color"
                                            onChange={(color) => setCustomData({ ...customData, customCTATextColor: color })}
                                        />
                                    </div>
                                </div>
                                <div className="cr-brand-info-text">
                                    <p>Your brand colors are automatically extracted from your category, but you can override them for specific campaigns.</p>
                                    <button className="cr-reset-color-btn" type="button" onClick={() => setCustomData({ ...customData, customCTAColor: "", customCTATextColor: "" })}>
                                        Reset to Category Default
                                    </button>
                                </div>
                            </div>}

                            {/* ══ SETTINGS TAB ══ */}
                            {/* 4. INTERACTION TYPE CARD */}
                            {formTab === "settings" && <div className="cr-revamp-card">
                                <div className="cr-revamp-card__head">
                                    <h3 className="cr-revamp-card__title">Interaction Type</h3>
                                    <InfoIcon tooltip="Choose how users will interact with your ad (e.g. Website, SMS, Call)." />
                                </div>
                                <div className="cr-link-type-grid">
                                    {[
                                        { id: "hyperlink", label: "Hyperlink", icon: <LinkIcon color={themeColor} /> },
                                        { id: "sms", label: "SMS", icon: <SMSIcon color={themeColor} /> },
                                        { id: "whatsappchat", label: "WhatsApp", icon: <SMSIcon color={themeColor} /> },
                                        { id: "call", label: "Voice Call", icon: <PhoneIcon color={themeColor} /> },
                                        { id: "email", label: "Email", icon: <EmailIcon color={themeColor} /> },
                                        { id: "none", label: "None", icon: <span style={{ fontSize: '18px' }}>🚫</span> },
                                    ].map(opt => (
                                        <div
                                            key={opt.id}
                                            className={`cr-link-card-v2 ${customData.linkType === opt.id ? 'active' : ''}`}
                                            onClick={() => setCustomData({ ...customData, linkType: opt.id })}
                                        >
                                            <div className="cr-link-card__icon-v2">{opt.icon}</div>
                                            <span className="cr-link-card__label-v2">{opt.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {customData.linkType !== "none" && (
                                    <div className="cr-dynamic-input-row" style={{ marginTop: '24px' }}>
                                        <FormInput
                                            id="dynamic-input"
                                            name="dynamic-input"
                                            label={
                                                customData.linkType === "sms" ? "Recipient Phone Number" :
                                                    customData.linkType === "email" ? "Target Email Address" :
                                                        customData.linkType === "call" ? "Target Phone Number" :
                                                            customData.linkType === "whatsappchat" ? "WhatsApp Number or Link" :
                                                                "CTA Destination Link"
                                            }
                                            type={(customData.linkType === "email" || customData.linkType === "hyperlink" || customData.linkType === "whatsappchat") ? "text" : "tel"}
                                            required
                                            infoText="Specify the contact detail or link for your chosen interaction type."
                                            value={customData.link}
                                            onChange={(e) => setCustomData({ ...customData, link: e.target.value })}
                                            placeholder={
                                                customData.linkType === "email" ? "hello@example.com" :
                                                    customData.linkType === "hyperlink" ? "https://example.com" :
                                                        customData.linkType === "whatsappchat" ? "e.g. 1234567890" :
                                                            "+1 234 567 8900"
                                            }
                                            icon={
                                                customData.linkType === "sms" || customData.linkType === "whatsappchat" ? <SMSIcon color={themeColor} /> :
                                                    customData.linkType === "email" ? <EmailIcon color={themeColor} /> :
                                                        customData.linkType === "call" ? <PhoneIcon color={themeColor} /> :
                                                            <LinkIcon color={themeColor} />
                                            }
                                        />
                                    </div>
                                )}
                            </div>}

                            {/* 5. FALLBACK ASSET CARD */}
                            {formTab === "settings" && <div className="cr-revamp-card">
                                <div className="cr-revamp-card__head">
                                    <h3 className="cr-revamp-card__title">Fallback Asset</h3>
                                    <InfoIcon tooltip="Used as a backup if the primary asset fails to load." />
                                </div>
                                <div className="cr-fallback-revamp">
                                    <div className="cr-upload-box-v3">
                                        {customData.fallbackImage && (
                                            <img src={customData.fallbackImage} alt="Fallback preview" className="cr-dynamic-image-preview" />
                                        )}
                                        <div className="cr-upload-hint">Upload backup image</div>
                                        <button
                                            className="cr-upload-btn-v2"
                                            type="button"
                                            onClick={() => fallbackImageInputRef.current?.click()}
                                        >
                                            {customData.fallbackImage ? 'Change Fallback' : 'Choose Fallback'}
                                        </button>
                                        <input
                                            ref={fallbackImageInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) setCustomData({ ...customData, fallbackImage: URL.createObjectURL(file) })
                                                e.target.value = ''
                                            }}
                                        />
                                    </div>
                                    <p className="cr-field-hint" style={{ marginTop: '12px' }}>
                                        Used as a backup if the primary asset fails to load.
                                    </p>
                                </div>
                            </div>}

                            {/* 6. PARAMETERS CARD */}
                            {formTab === "settings" && <div className="cr-revamp-card" style={{ padding: '20px' }}>
                                <FormSection title="Campaign Tracking Parameters" infoText="Add tracking parameters to measure the success of your campaign." defaultExpanded={false}>
                                    <div className="cr-params-grid">
                                        <FormInput
                                            id="campaign-source"
                                            name="campaign-source"
                                            label="Campaign Source"
                                            placeholder="e.g. Google, newsletter"
                                            value={customData.campaignSource}
                                            onChange={(e) => setCustomData({ ...customData, campaignSource: e.target.value })}
                                            icon={<TextIcon color={themeColor} />}
                                        />
                                        <FormInput
                                            id="campaign-medium"
                                            name="campaign-medium"
                                            label="Campaign Medium"
                                            placeholder="e.g. cpc, banner"
                                            value={customData.campaignMedium}
                                            onChange={(e) => setCustomData({ ...customData, campaignMedium: e.target.value })}
                                            icon={<TextIcon color={themeColor} />}
                                        />
                                        <FormInput
                                            id="campaign-name"
                                            name="campaign-name"
                                            label="Campaign Name"
                                            placeholder="e.g. summer_sale"
                                            value={customData.campaignName}
                                            onChange={(e) => setCustomData({ ...customData, campaignName: e.target.value })}
                                            icon={<TextIcon color={themeColor} />}
                                        />
                                    </div>
                                </FormSection>
                            </div>}

                            {/* 7. TRACKERS CARD */}
                            {formTab === "settings" && <div className="cr-revamp-card" style={{ padding: '20px' }}>
                                <FormSection title="Third Party Event Tracking" infoText="Integrate with third-party tracking services for external auditing." defaultExpanded={false}>
                                    <div className="cr-params-grid">
                                        <FormInput
                                            id="tracker-impression"
                                            name="tracker-impression"
                                            label="Impression Tracker"
                                            placeholder="https://tracker.com/pixel..."
                                            value={customData.trackerImpression}
                                            onChange={(e) => setCustomData({ ...customData, trackerImpression: e.target.value })}
                                            icon={<TextIcon color={themeColor} />}
                                        />
                                        <FormInput
                                            id="tracker-click"
                                            name="tracker-click"
                                            label="Click Tracker"
                                            placeholder="https://tracker.com/click..."
                                            value={customData.trackerClick}
                                            onChange={(e) => setCustomData({ ...customData, trackerClick: e.target.value })}
                                            icon={<TextIcon color={themeColor} />}
                                        />
                                    </div>
                                </FormSection>
                            </div>}

                            {/* 8. FEEDBACK CARD */}
                            {formTab === "settings" && <div className="cr-revamp-card" style={{ padding: '20px' }}>
                                <FormSection title="Ad Services & Feedback" infoText="Configure ad feedback and branding options." defaultExpanded={false}>
                                    <div className="cr-feedback-revamp" style={{ marginTop: '20px' }}>
                                        <FormSwitch
                                            label="Enable Feedback & Ad Choices"
                                            checked={customData.enableFeedback}
                                            onChange={(val) => {
                                                setCustomData({ ...customData, enableFeedback: val });
                                                if (!val) setShowFeedbackPreview(false);
                                            }}
                                        />
                                        <p className="cr-brand-info-text" style={{ marginTop: '12px' }}>
                                            When enabled, users will see standard "Ads by Scroll Today" branding and a close icon.
                                        </p>
                                    </div>
                                </FormSection>
                            </div>}

                            {/* 9. DEVICE TARGETING CARD */}
                            {formTab === "settings" && <div className="cr-revamp-card" style={{ padding: '20px' }}>
                                <FormSection title="Device Targeting" infoText="Choose the device orientations where this ad is allowed to serve." defaultExpanded={false}>
                                    <div className="cr-device-targeting-revamp" style={{ marginTop: '20px' }}>
                                        <div className="cr-device-target-grid">
                                            {[
                                                { id: "mobile-portrait", label: "Mobile Portrait", mode: "mobile" },
                                                { id: "mobile-landscape", label: "Mobile Landscape", mode: "mobile" },
                                                { id: "tablet-portrait", label: "Tablet Portrait", mode: "tablet" },
                                                { id: "tablet-landscape", label: "Tablet Landscape", mode: "tablet" },
                                                { id: "desktop", label: "Desktop", mode: "desktop" },
                                            ].filter(dev => (selectedFormat?.previewModes || ["mobile", "tablet", "desktop"]).includes(dev.mode as any))
                                            .map(dev => (
                                                <div key={dev.id} className="cr-device-switch-item">
                                                    <FormSwitch
                                                        label={dev.label}
                                                        checked={customData.enabledDevices.includes(dev.id)}
                                                        onChange={(val) => {
                                                            const current = [...customData.enabledDevices];
                                                            if (val) {
                                                                if (!current.includes(dev.id)) current.push(dev.id);
                                                            } else {
                                                                const idx = current.indexOf(dev.id);
                                                                if (idx > -1) current.splice(idx, 1);
                                                            }
                                                            setCustomData({ ...customData, enabledDevices: current });
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </FormSection>
                            </div>}

                            <div className="cr-form-actions-sticky">
                                <button
                                    className="cr-next-btn-v3"
                                    onClick={() => editId ? void handleSaveEdit() : void handleFinalize()}
                                    disabled={isCreating}
                                >
                                    {isCreating
                                        ? (editId ? 'Saving…' : 'Creating…')
                                        : (editId ? 'Save Changes' : 'Confirm & Generate Creative')}
                                </button>
                            </div>
                        </div>

                        {/* Visual summary sidebox */}
                        <div className="cr-customize-preview">
                            <div className="cr-device-switcher">
                                {(selectedFormat.previewModes || ["mobile", "tablet", "desktop"]).includes("mobile") && (
                                    <button
                                        className={`cr-device-btn ${previewMode === "mobile" ? "active" : ""}`}
                                        onClick={() => setPreviewMode("mobile")}
                                    >
                                        <MobileIcon />
                                        <span>Mobile</span>
                                    </button>
                                )}
                                {(selectedFormat.previewModes || ["mobile", "tablet", "desktop"]).includes("tablet") && (
                                    <button
                                        className={`cr-device-btn ${previewMode === "tablet" ? "active" : ""}`}
                                        onClick={() => setPreviewMode("tablet")}
                                    >
                                        <TabletIcon />
                                        <span>Tablet</span>
                                    </button>
                                )}
                                {(selectedFormat.previewModes || ["mobile", "tablet", "desktop"]).includes("desktop") && (
                                    <button
                                        className={`cr-device-btn ${previewMode === "desktop" ? "active" : ""}`}
                                        onClick={() => setPreviewMode("desktop")}
                                    >
                                        <DesktopIcon />
                                        <span>Desktop</span>
                                    </button>
                                )}
                                <div className="cr-device-switcher-sep" />
                                <button
                                    className="cr-device-btn"
                                    onClick={refreshPreview}
                                    title="Refresh preview now"
                                >
                                    <RefreshIcon />
                                    <span>Refresh</span>
                                </button>
                                <button
                                    className="cr-device-btn cr-fullscreen-btn"
                                    onClick={() => setFullscreenPreview(true)}
                                    title="Full-size preview (ESC to close)"
                                >
                                    <ExpandIcon />
                                    <span>Full Size</span>
                                </button>
                            </div>

                            {(() => {
                                // Parse the format's actual pixel dimensions
                                const dimParts = selectedFormat.dimension?.toLowerCase().split(/[x×]/) ?? ['300', '250'];
                                const fw = parseInt(dimParts[0] ?? '300', 10) || 300;
                                const fh = parseInt(dimParts[1] ?? '250', 10) || 250;

                                // Ad inner content — live iframe for registry formats, static mock for others
                                const adInner = (scale: number, dispW: number, dispH: number, keySuffix = '') =>
                                    registryFormat && registryPreviewHtml ? (
                                        <iframe
                                            key={`${registryPreviewHtml.length}-${previewMode}-${previewRefreshKey}${keySuffix}`}
                                            srcDoc={registryPreviewHtml}
                                            style={{ width: fw, height: fh, border: 'none', display: 'block', transform: `scale(${scale})`, transformOrigin: 'top left' }}
                                            sandbox="allow-scripts"
                                            title="Creative Preview"
                                        />
                                    ) : (
                                        <div style={{ width: dispW, height: dispH, display: 'flex', flexDirection: 'column', background: brandColor, overflow: 'hidden' }}>
                                            {customData.image
                                                ? <img src={customData.image} alt="" style={{ width: '100%', height: '65%', objectFit: 'cover', display: 'block' }} />
                                                : <div style={{ width: '100%', height: '65%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>Image</span></div>
                                            }
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: brandTextColor, padding: '0 4px', textAlign: 'center' }}>
                                                {customData.cta || 'Learn More'}
                                            </div>
                                        </div>
                                    );

                                const dimLabel = (label = '') => (
                                    <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                                        {fw}×{fh}px &nbsp;·&nbsp; {previewMode}{label}
                                    </p>
                                );

                                // ── Build phone device for a given screen width ──
                                // Frame shape: iPhone 15 Pro (393×852). Ad scale ref: iPhone 14 viewport (390×844).
                                const buildPhone = (screenW: number, keySuffix = '') => {
                                    const iPhoneW = 393, iPhoneH = 852;
                                    const viewportW = 390, viewportH = 844;
                                    const totalScreenH = Math.round(screenW * iPhoneH / iPhoneW);
                                    const homeAreaH = 30;   // fixed — matches CSS .cr-dev-phone__home-area height
                                    const contentH = totalScreenH - homeAreaH;
                                    const deviceScale = Math.min(screenW / viewportW, contentH / viewportH);
                                    const scale = Math.min(deviceScale, screenW / fw, contentH / fh);
                                    const dispW = Math.round(fw * scale);
                                    const dispH = Math.round(fh * scale);
                                    return (
                                        <>
                                            <div className="cr-dev-phone">
                                                <div className="cr-dev-phone__screen" style={{ width: screenW, height: totalScreenH }}>
                                                    <div className="cr-dev-page-content" style={{ height: contentH, padding: '8px 0 0 0' }}>
                                                        <div className="cr-skel" style={{ height: 5, width: '72%', marginLeft: 8 }} />
                                                        <div className="cr-skel" style={{ height: 5, width: '52%', marginLeft: 8 }} />
                                                        <div className="cr-dev-ad-slot" style={{ width: dispW, height: dispH, alignSelf: 'center' }}>
                                                            {adInner(scale, dispW, dispH, keySuffix)}
                                                        </div>
                                                        <div className="cr-skel" style={{ height: 4, width: '62%', marginLeft: 8 }} />
                                                        <div className="cr-skel" style={{ height: 4, width: '44%', marginLeft: 8 }} />
                                                    </div>
                                                    <div className="cr-dev-phone__home-area">
                                                        <div className="cr-dev-phone__home-bar" />
                                                    </div>
                                                </div>
                                            </div>
                                            {dimLabel(keySuffix ? ' · full size' : '')}
                                        </>
                                    );
                                };

                                // ── Build tablet device for a given screen width ──
                                // Frame shape & ad scale ref: iPad 768×1024.
                                const buildTablet = (screenW: number, keySuffix = '') => {
                                    const iPadW = 768, iPadH = 1024;
                                    const viewportW = 768, viewportH = 1024;
                                    const statusH = 36;
                                    const contentH = Math.round(screenW * iPadH / iPadW) - statusH;
                                    const pad = 8;
                                    const usableW = screenW - pad * 2;
                                    const usableH = contentH - pad * 2;
                                    const deviceScale = Math.min(usableW / viewportW, usableH / viewportH);
                                    const scale = Math.min(deviceScale, usableW / fw, usableH / fh);
                                    const dispW = Math.round(fw * scale);
                                    const dispH = Math.round(fh * scale);
                                    return (
                                        <>
                                            <div className="cr-dev-tablet">
                                                <div className="cr-dev-tablet__camera" />
                                                <div className="cr-dev-tablet__screen" style={{ width: screenW, height: statusH + contentH }}>
                                                    <div className="cr-dev-status-bar" style={{ height: statusH }}>
                                                        <div className="cr-skel" style={{ width: 32, height: 4 }} />
                                                        <div className="cr-skel" style={{ width: 22, height: 4 }} />
                                                    </div>
                                                    <div className="cr-dev-page-content" style={{ height: contentH, padding: pad }}>
                                                        <div className="cr-skel" style={{ height: 5, width: '68%' }} />
                                                        <div className="cr-skel" style={{ height: 5, width: '50%' }} />
                                                        <div className="cr-dev-ad-slot" style={{ width: dispW, height: dispH, alignSelf: 'center', marginTop: 2 }}>
                                                            {adInner(scale, dispW, dispH, keySuffix)}
                                                        </div>
                                                        <div className="cr-skel" style={{ height: 5, width: '70%' }} />
                                                        <div className="cr-skel" style={{ height: 5, width: '52%' }} />
                                                    </div>
                                                </div>
                                                <div className="cr-dev-tablet__home" />
                                            </div>
                                            {dimLabel(keySuffix ? ' · full size' : '')}
                                        </>
                                    );
                                };

                                // ── Build laptop device for a given laptop width ──
                                // Frame shape: MacBook Pro 16" (1728×1117). Ad scale ref: MacBook 13" (1280×800).
                                const buildLaptop = (laptopW: number, keySuffix = '') => {
                                    const macW = 1728, macH = 1117;
                                    const viewportW = 1280, viewportH = 800;
                                    const lidInnerW = laptopW - 14;
                                    const pageInnerW = lidInnerW - 16;
                                    const barH = 20;  // fixed — matches CSS .cr-dev-laptop__bar height
                                    const pageH = Math.round(lidInnerW * (macH / macW)) - barH;
                                    const sidebarW = Math.floor(pageInnerW * 0.25);
                                    const mainW = pageInnerW - sidebarW - 8;
                                    const pageUsableH = pageH - 16;
                                    const deviceScale = Math.min(pageInnerW / viewportW, pageUsableH / viewportH);
                                    const scale = Math.min(deviceScale, mainW / fw, pageUsableH / fh);
                                    const dispW = Math.round(fw * scale);
                                    const dispH = Math.round(fh * scale);
                                    return (
                                        <>
                                            <div className="cr-dev-laptop" style={{ width: laptopW }}>
                                                <div className="cr-dev-laptop__lid">
                                                    <div className="cr-dev-laptop__screen">
                                                        <div className="cr-dev-laptop__bar">
                                                            <div className="cr-dev-laptop__dot" />
                                                            <div className="cr-dev-laptop__dot" />
                                                            <div className="cr-dev-laptop__dot" />
                                                            <div className="cr-dev-laptop__addr" />
                                                        </div>
                                                        <div className="cr-dev-laptop__page" style={{ height: pageH, overflow: 'hidden' }}>
                                                            <div className="cr-dev-laptop__sidebar" style={{ width: sidebarW }}>
                                                                <div className="cr-skel" style={{ height: 6, width: '90%' }} />
                                                                <div className="cr-skel" style={{ height: 6, width: '75%' }} />
                                                                <div className="cr-skel" style={{ height: 42, width: '100%', marginTop: 2 }} />
                                                                <div className="cr-skel" style={{ height: 5, width: '82%' }} />
                                                                <div className="cr-skel" style={{ height: 5, width: '62%' }} />
                                                                <div className="cr-skel" style={{ height: 5, width: '72%' }} />
                                                            </div>
                                                            <div className="cr-dev-laptop__main">
                                                                <div className="cr-skel" style={{ height: 5, width: '85%' }} />
                                                                <div className="cr-dev-ad-slot" style={{ width: dispW, height: dispH }}>
                                                                    {adInner(scale, dispW, dispH, keySuffix)}
                                                                </div>
                                                                <div className="cr-skel" style={{ height: 5, width: '72%' }} />
                                                                <div className="cr-skel" style={{ height: 5, width: '58%' }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="cr-dev-laptop__base" />
                                                <div className="cr-dev-laptop__foot" />
                                            </div>
                                            {dimLabel(keySuffix ? ' · full size' : '')}
                                        </>
                                    );
                                };

                                // Normal preview sizes
                                const normalDevice =
                                    previewMode === 'mobile' ? buildPhone(220) :
                                        previewMode === 'tablet' ? buildTablet(256) :
                                            buildLaptop(660);

                                // Fullscreen sizes — fit within visible viewport
                                // Modal chrome: padding (76px) + dimLabel (22px) + hint (28px) + safety (14px) = 140px
                                const fsAvailH = window.innerHeight * 0.96 - 140;
                                const fsAvailW = window.innerWidth * 0.92;

                                const fsDevice = (() => {
                                    if (previewMode === 'mobile') {
                                        // Phone frame: +32px V (padding 15+17), +18px H (padding 9×2)
                                        const ratio = 852 / 393;
                                        const byH = (fsAvailH - 32) / ratio;
                                        const sw = Math.round(Math.min(byH, fsAvailW - 18, 390));
                                        return buildPhone(Math.max(220, sw), '-fs');
                                    }
                                    if (previewMode === 'tablet') {
                                        // Tablet frame: +48px V (padding 24 + camera 8 + home 4 + gaps 12), +32px H (padding 16×2)
                                        const ratio = 1024 / 768;
                                        const byH = (fsAvailH - 48) / ratio;
                                        const sw = Math.round(Math.min(byH, fsAvailW - 32, 768));
                                        return buildTablet(Math.max(256, sw), '-fs');
                                    }
                                    // Laptop frame: total H ≈ (laptopW-14)*(1117/1728) + 27
                                    const ratio = 1117 / 1728;
                                    const byH = (fsAvailH - 27) / ratio + 14;
                                    const lw = Math.round(Math.min(byH, fsAvailW));
                                    return buildLaptop(Math.max(660, lw), '-fs');
                                })();

                                return (
                                    <>
                                        {normalDevice}
                                        {fullscreenPreview && createPortal(
                                            <div className="cr-fs-overlay" onClick={() => setFullscreenPreview(false)}>
                                                <div className="cr-fs-modal" onClick={e => e.stopPropagation()}>
                                                    <button className="cr-fs-close" onClick={() => setFullscreenPreview(false)} title="Close (ESC)">
                                                        <XIcon />
                                                    </button>
                                                    {fsDevice}
                                                    <p className="cr-fs-hint">Press ESC or click outside to close</p>
                                                </div>
                                            </div>,
                                            document.body
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ STEP 4 — PUBLISH ════════ */}
            {step === 4 && selectedFormat && (
                <div className={`cr-view cr-view--enter-${direction}`}>
                    <div className="cr-publish-layout">
                        {/* Summary Column */}
                        <div className="cr-publish-col cr-publish-col--main">
                            <div className="cr-publish-card">
                                <div className="cr-publish-success">
                                    <div className="cr-success-icon"><CheckIcon /></div>
                                    <div className="cr-success-text">
                                        <h2 className="cr-publish-title">Creative Ready!</h2>
                                        <p className="cr-publish-sub">Your {selectedFormat.name} ad is ready for deployment.</p>
                                    </div>
                                </div>

                                {/* Integration Code — inline share panel */}
                                <div className="cr-code-section">
                                    <div className="cr-code-header">
                                        <h3 className="cr-code-title">Integration Code</h3>
                                        <span className="cr-code-hint">Select a platform to get the correct ad tag</span>
                                    </div>

                                    {createdCreative ? (
                                        <SharePanel creative={createdCreative} />
                                    ) : (
                                        <p style={{ fontSize: 13, color: '#94a3b8' }}>Creative is being published, please wait...</p>
                                    )}
                                </div>

                                {/* Detailed Specs */}
                                <div className="cr-specs-grid">
                                    <div className="cr-spec">
                                        <span className="cr-spec-label">Creative Name</span>
                                        <span className="cr-spec-val">{customData.creativeName}</span>
                                    </div>
                                    <div className="cr-spec">
                                        <span className="cr-spec-label">Creative ID</span>
                                        <span className="cr-spec-val cr-spec-val--id">{creativeId}</span>
                                    </div>
                                    <div className="cr-spec">
                                        <span className="cr-spec-label">Interaction Type</span>
                                        <span className="cr-spec-val" style={{ textTransform: 'capitalize' }}>{customData.linkType}</span>
                                    </div>
                                    <div className="cr-spec">
                                        <span className="cr-spec-label">Ad Type</span>
                                        <span className="cr-spec-val">{category?.name}</span>
                                    </div>
                                    <div className="cr-spec">
                                        <span className="cr-spec-label">Campaign Source</span>
                                        <span className="cr-spec-val">{customData.campaignSource || "Not Set"}</span>
                                    </div>
                                    <div className="cr-spec">
                                        <span className="cr-spec-label">Campaign Medium</span>
                                        <span className="cr-spec-val">{customData.campaignMedium || "Not Set"}</span>
                                    </div>
                                    <div className="cr-spec">
                                        <span className="cr-spec-label">Last Modified</span>
                                        <span className="cr-spec-val">{lastModified}</span>
                                    </div>
                                </div>

                                <div className="cr-publish-actions">
                                    <button className="cr-analytics-btn" title="View Format Analytics">
                                        <AnalyticsIcon /> Format Analytics
                                    </button>
                                    <div className="cr-publish-primary">
                                        <button className="cr-finish-btn" onClick={() => navigate('/creatives/new')}>
                                            Create Another
                                        </button>
                                        <button className="cr-publish-btn" onClick={() => navigate('/creatives')}>
                                            Go to Creatives
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Column */}
                        <div className="cr-publish-col cr-publish-col--preview">
                            <div className="cr-final-preview">
                                <h3 className="cr-preview-label">Creative Preview</h3>
                                <div className="cr-preview-frame">
                                    {registryFormat && registryPreviewHtml ? (() => {
                                        const dimParts = selectedFormat.dimension?.toLowerCase().split(/[x×]/) ?? ['300', '250'];
                                        const fw = parseInt(dimParts[0] ?? '300', 10) || 300;
                                        const fh = parseInt(dimParts[1] ?? '250', 10) || 250;
                                        const maxW = 300; const maxH = 480;
                                        const scale = Math.min(1, maxW / fw, maxH / fh);
                                        const scaledW = Math.round(fw * scale);
                                        const scaledH = Math.round(fh * scale);
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: scaledW, height: scaledH, overflow: 'hidden', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', position: 'relative' }}>
                                                    <iframe
                                                        srcDoc={registryPreviewHtml}
                                                        style={{ width: fw, height: fh, border: 'none', display: 'block', transform: `scale(${scale})`, transformOrigin: 'top left' }}
                                                        sandbox="allow-scripts"
                                                        title="Creative Preview"
                                                    />
                                                </div>
                                                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                                                    {fw}×{fh} · Interactable preview
                                                </p>
                                            </div>
                                        );
                                    })() : (
                                        <div className="cr-mini-ad cr-mini-ad--final">
                                            {customData.image ? (
                                                <img src={customData.image} alt="Creative" className="cr-mini-ad__img" />
                                            ) : (
                                                <div className="cr-mini-ad__img cr-mini-ad__img--placeholder">Visual Preview Available</div>
                                            )}
                                            <div className="cr-mini-ad__body">
                                                <div className="cr-mini-ad__title">{selectedFormat.name}</div>
                                                <button className="cr-mini-ad__btn" style={{ background: brandColor, color: brandTextColor }}>
                                                    {customData.cta}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="cr-preview-meta">
                                    <span>Live Preview: <strong>{selectedFormat.name}</strong></span>
                                    <span>Target URL: <strong>{customData.link || "Not Set"}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share dialog for edit mode */}
            {existingCreative && (
                <ShareDialog
                    open={showShareDialog}
                    onOpenChange={setShowShareDialog}
                    creative={existingCreative}
                />
            )}

            <FormatDetailsModal
                formatId={previewFormatId}
                onClose={() => setPreviewFormatId(null)}
            />
        </div>
    );
}
