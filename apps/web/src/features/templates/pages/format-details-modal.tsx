import { useState, useMemo } from "react";
import { findFormatById } from "../data/fmtData";
import "../styles/creatives.css";
import "../styles/details.css";

/* ─────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────── */
const Smartphone = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
);
const Tablet = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
);
const Monitor = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
);
const BackArrow = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

/* ─────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────── */
interface FormatDetailsModalProps {
    formatId: string | null;
    onClose: () => void;
}

export default function FormatDetailsModal({ formatId, onClose }: FormatDetailsModalProps) {
    const data = useMemo(() => (formatId ? findFormatById(formatId) : null), [formatId]);
    const [activeDevice, setActiveDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");

    const handleClose = () => {
        setActiveDevice("mobile");
        onClose();
    }

    if (!formatId || !data) return null;

    const { format, category, size } = data;

    return (
        <div className="fd-modal-overlay">
            <div className="cr-page fd-page fd-modal-content" style={{ "--cat-color": category.color } as React.CSSProperties}>

                {/* Fixed Header */}
                <header className="fd-modal-header">
                    <div className="fd-header-left">
                        <button onClick={handleClose} className="fd-back" title="Back to Selection">
                            <BackArrow />
                        </button>

                        <div className="fd-title-group--header">
                            <span className="fd-cat-name">{category.name} {size ? `› ${size.name}` : ""}</span>
                            <h1 className="fd-title fd-title--header">{format.name}</h1>
                        </div>
                    </div>

                    <button className="fd-modal-close" onClick={handleClose} title="Close">
                        <CloseIcon />
                    </button>
                </header>

                {/* Scrollable Body */}
                <div className="fd-modal-body">
                    <div className="fd-container">
                        <div className="fd-content">
                            {/* Left Column: Info */}
                            <div className="fd-info-col">
                                <section className="fd-section">
                                    <h3 className="fd-section-title">Overview</h3>
                                    <p className="fd-description">{format.longDescription}</p>
                                </section>

                                <section className="fd-section">
                                    <h3 className="fd-section-title">Use Case Tags</h3>
                                    <div className="fd-tags">
                                        {format.tags?.map(tag => (
                                            <span key={tag} className="fd-tag">#{tag}</span>
                                        ))}
                                    </div>
                                </section>

                                <section className="fd-section">
                                    <h3 className="fd-section-title">Best Practices</h3>
                                    <ul className="fd-list">
                                        {format.bestPractices?.map((practice, index) => (
                                            <li key={index}>{practice}</li>
                                        ))}
                                    </ul>
                                </section>
                            </div>

                            {/* Right Column: Preview */}
                            <div className="fd-preview-col">
                                <div className="fd-preview-card">
                                    <div className="fd-device-toolbar">
                                        <div className="fd-device-btns">
                                            {format.previewModes?.includes("mobile") && (
                                                <button
                                                    className={`fd-device-btn ${activeDevice === "mobile" ? "fd-device-btn--active" : ""}`}
                                                    onClick={() => setActiveDevice("mobile")}
                                                    title="Mobile Preview"
                                                >
                                                    <Smartphone />
                                                </button>
                                            )}
                                            {format.previewModes?.includes("tablet") && (
                                                <button
                                                    className={`fd-device-btn ${activeDevice === "tablet" ? "fd-device-btn--active" : ""}`}
                                                    onClick={() => setActiveDevice("tablet")}
                                                    title="Tablet Preview"
                                                >
                                                    <Tablet />
                                                </button>
                                            )}
                                            {format.previewModes?.includes("desktop") && (
                                                <button
                                                    className={`fd-device-btn ${activeDevice === "desktop" ? "fd-device-btn--active" : ""}`}
                                                    onClick={() => setActiveDevice("desktop")}
                                                    title="Desktop Preview"
                                                >
                                                    <Monitor />
                                                </button>
                                            )}
                                        </div>
                                        <div className="fd-status-pill">Preview Mode: <span>{activeDevice}</span></div>
                                    </div>

                                    <div className={`fd-viewport fd-viewport--${activeDevice}`}>
                                        <div className="fd-placeholder">
                                            <div className="fd-placeholder-box">
                                                <span className="fd-mock-icon">{category.icon}</span>
                                                <div className="fd-mock-text">Interactive {format.name} Preview</div>
                                                <div className="fd-mock-dim">{format.dimension || (activeDevice === 'mobile' ? '320x480' : '768x1024')}</div>
                                            </div>
                                            <div className="fd-mock-elements">
                                                <div className="fd-mock-line" style={{ width: '80%' }} />
                                                <div className="fd-mock-line" style={{ width: '60%' }} />
                                                <div className="fd-mock-btn">Tap to Interact</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="fd-preview-hint">
                                    * This is a visual representation of how the <strong>{format.name}</strong> adapts to {activeDevice} screens.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
