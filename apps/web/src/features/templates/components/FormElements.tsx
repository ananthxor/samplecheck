import React, { useState, useRef, useEffect } from "react";
import type { DynamicField } from "../data/fmtData";
import { GLOBAL_LIMITS } from "../data/fmtData";

/* ─────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────── */
export const InfoIcon = ({ tooltip }: { tooltip?: string }) => (
    <div className="cr-tooltip-trigger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#999', cursor: 'help' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        {tooltip && (
            <div className="cr-tooltip-content">
                {tooltip}
                <div className="cr-tooltip-arrow" />
            </div>
        )}
    </div>
);

export const LinkIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

export const ChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export const SMSIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);

export const PhoneIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1-2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);

export const EmailIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);

export const TextIcon = ({ color }: { color: string }) => (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8 4V20M17 12V20M6 20H10M15 20H19M13 7V4H3V7M21 14V12H13V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>
);

export const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const UploadIcon = ({ color }: { color?: string }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);

export const CalendarIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

export const CTAIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
    </svg>
);

export const ColorIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 1 1 0-18c4.97 0 9 3.582 9 8 0 1.035-.84 1.875-1.875 1.875H17.25c-1.035 0-1.875.84-1.875 1.875 0 1.275 1.035 2.5 1.035 3.844 0 1.344-1.117 2.406-2.41 2.406z" />
        <circle cx="7.5" cy="10.5" r="1.5" fill={color} />
        <circle cx="10.5" cy="7.5" r="1.5" fill={color} />
        <circle cx="13.5" cy="7.5" r="1.5" fill={color} />
        <circle cx="16.5" cy="10.5" r="1.5" fill={color} />
    </svg>
);

export const RedirectIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

export const VideoIcon = ({ color }: { color?: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

/* ─────────────────────────────────────────────────────
   REUSABLE UI COMPONENTS
   ───────────────────────────────────────────────────── */

interface SwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
    infoText?: string;
}

export const FormSwitch: React.FC<SwitchProps> = ({ label, checked, onChange, id, infoText }) => {
    return (
        <div className="cr-form-switch-row" onClick={() => onChange(!checked)}>
            <div className="cr-form-switch-info">
                <div className="cr-form-head-row">
                    {infoText && <InfoIcon tooltip={infoText} />}
                    <label className="cr-form-label" htmlFor={id}>{label}</label>
                </div>
            </div>
            <div className={`cr-switch ${checked ? 'cr-switch--active' : ''}`}>
                <div className="cr-switch-thumb" />
            </div>
        </div>
    );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    infoText?: string;
}

export const FormInput: React.FC<InputProps> = ({ label, icon, infoText, ...props }) => {
    return (
        <div className="cr-form-group">
            <div className="cr-form-head-row">
                {infoText && <InfoIcon tooltip={infoText} />}
                {label && <label className="cr-form-label">{label}</label>}
            </div>
            <div className="cr-form-input-wrap">
                {icon && <span className="cr-form-icon">{icon}</span>}
                <input
                    className="cr-form-input"
                    {...props}
                    style={icon ? { paddingLeft: '32px' } : {}}
                />
            </div>
        </div>
    );
};

export const FormDateInput: React.FC<InputProps> = ({ label, icon, infoText, ...props }) => {
    return (
        <div className="cr-form-group">
            <div className="cr-form-head-row">
                {infoText && <InfoIcon tooltip={infoText} />}
                {label && <label className="cr-form-label">{label}</label>}
            </div>
            <div className="cr-form-input-wrap">
                <span className="cr-form-icon">
                    {icon || <CalendarIcon color="#6366f1" />}
                </span>
                <input
                    type="date"
                    className="cr-form-input"
                    {...props}
                    style={{ paddingLeft: '32px' }}
                />
            </div>
        </div>
    );
};

export const FormColorInput: React.FC<InputProps> = ({ label, icon, infoText, value, onChange, ...props }) => {
    const pickerRef = useRef<HTMLInputElement>(null);
    return (
        <div className="cr-form-group">
            <div className="cr-form-head-row">
                {infoText && <InfoIcon tooltip={infoText} />}
                {label && <label className="cr-form-label">{label}</label>}
            </div>
            <div className="cr-form-input-wrap">
                <div
                    className="cr-color-preview-v4"
                    style={{
                        backgroundColor: String(value) || '#ffffff',
                    }}
                    onClick={() => pickerRef.current?.click()}
                />
                <input
                    className="cr-form-input"
                    {...props}
                    value={value}
                    onChange={onChange}
                    style={{ paddingLeft: '32px' }}
                />
                <input
                    ref={pickerRef}
                    type="color"
                    style={{ opacity: 0, position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
                    value={value && /^#[0-9A-F]{6}$/i.test(String(value)) ? value : "#000000"}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};

export const SearchIcon = ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

interface SelectProps {
    label?: string;
    value: string;
    onChange: (e: any) => void;
    options: { value: string; label: string }[];
    infoText?: string;
    placeholder?: string;
    /** Optional action rendered at the bottom of the dropdown (e.g. "Create new" button) */
    footerAction?: React.ReactNode;
}

export const FormSelect: React.FC<SelectProps> = ({ label, value, options, infoText, onChange, placeholder = "Select an option", footerAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div className="cr-form-group" ref={dropdownRef}>
            <div className="cr-form-head">
                {infoText && <InfoIcon tooltip={infoText} />}
                {label && <label className="cr-form-label">{label}</label>}
            </div>

            <div className={`cr-adv-select-wrap ${isOpen ? 'is-open' : ''}`}>
                <div
                    className="cr-adv-select-trigger"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className={`cr-adv-select-value ${!selectedOption ? 'placeholder' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <span className="cr-adv-select-chevron">
                        <ChevronDown />
                    </span>
                </div>

                {isOpen && (
                    <div className="cr-adv-select-dropdown">
                        {options.length >= 5 && (
                            <div className="cr-adv-select-search-wrap">
                                <SearchIcon color="#94a3b8" />
                                <input
                                    type="text"
                                    className="cr-adv-select-search-input"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="cr-adv-select-options">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <div
                                        key={opt.value}
                                        className={`cr-adv-select-option ${opt.value === value ? 'is-selected' : ''}`}
                                        onClick={() => handleSelect(opt.value)}
                                    >
                                        <span className="cr-adv-option-label">{opt.label}</span>
                                        {opt.value === value && (
                                            <span className="cr-adv-option-check">✓</span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="cr-adv-select-no-results">
                                    {options.length === 0 ? "No options available" : `No results found for "${search}"`}
                                </div>
                            )}
                        </div>
                        {footerAction && (
                            <div className="cr-adv-select-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '6px 8px' }}>
                                {footerAction}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface SectionProps {
    title: string;
    children: React.ReactNode;
    infoText?: string;
    defaultExpanded?: boolean;
}

export const FormSection: React.FC<SectionProps> = ({ title, children, infoText, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`cr-form-section ${isExpanded ? "cr-form-section--expanded" : ""}`}>
            <div className="cr-form-section-head" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="cr-form-head">
                    {infoText && <InfoIcon tooltip={infoText} />}
                    <h4 className="cr-form-section-title">{title}</h4>
                    <span className={`cr-form-section-toggle ${isExpanded ? "rotated" : ""}`}>
                        <ChevronDown />
                    </span>
                </div>
            </div>
            {isExpanded && <div className="cr-form-section-body">{children}</div>}
        </div>
    );
};

export const ColorSwatch: React.FC<{ color: string; label: string; onChange?: (color: string) => void }> = ({ color, label, onChange }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div
            className="cr-color-preview-box interactive"
            onClick={() => inputRef.current?.click()}
            style={{ "--swatch-color": color } as React.CSSProperties}
        >
            <input
                ref={inputRef}
                type="color"
                value={color}
                onChange={(e) => onChange?.(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <div className="cr-color-swatch-ring">
                <div className="cr-color-swatch" style={{ background: color }} />
            </div>
            <div className="cr-color-info">
                <span className="cr-color-label">{label}</span>
                <span className="cr-color-value">{color}</span>
            </div>
        </div>
    );
};

// --- DYNAMIC FIELD RENDERERS ---

interface AssetUploadProps {
    type: "image" | "video";
    label: string;
    value: any;
    onChange: (val: any) => void;
    multiple?: boolean;
    count?: number;
    themeColor: string;
    infoText?: string;
}

export const AssetUpload: React.FC<AssetUploadProps> = ({ type, label, value, onChange, multiple, count, themeColor, infoText }) => {
    const limit = type === "image" ? GLOBAL_LIMITS.image : GLOBAL_LIMITS.video;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const urls = files.map((f) => URL.createObjectURL(f));
        if (multiple) {
            const existing = Array.isArray(value) ? value : [];
            onChange([...existing, ...urls]);
        } else if (count && count > 1) {
            const existing = Array.isArray(value) ? value : [];
            onChange([...existing, ...urls].slice(0, count));
        } else {
            onChange(urls[0]);
        }
        e.target.value = '';
    };

    return (
        <div className="cr-form-field-stack">
            <div className="cr-form-head-row">
                {infoText && <InfoIcon tooltip={infoText} />}
                <label className="cr-form-label">{label} ({type === 'image' ? 'Img' : 'Vid'} max {limit}MB)</label>
            </div>

            {(multiple || (count && count > 1)) ? (
                <div className="cr-dynamic-multi-images">
                    {(Array.isArray(value) ? value : []).map((item, idx) => (
                        <div key={idx} className="cr-asset-preview-tile">
                            {type === 'image' ? (
                                <img src={item} alt="" className="cr-dynamic-multi-img" />
                            ) : (
                                <div className="cr-dynamic-multi-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0' }}>
                                    <VideoIcon color={themeColor} />
                                </div>
                            )}
                        </div>
                    ))}
                    {(multiple || (Array.isArray(value) && value.length < (count || 0))) && (
                        <button className="cr-upload-box-v3" style={{ minHeight: '80px', padding: '10px' }} onClick={handlePick}>
                            <UploadIcon color={themeColor} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="cr-upload-box-v3">
                    {value ? (
                        type === "image" ? (
                            <img src={value} className="cr-dynamic-image-preview" alt="Preview" />
                        ) : (
                            <div className="cr-dynamic-image-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0' }}>
                                <VideoIcon color={themeColor} />
                                <span style={{ marginLeft: '10px', fontSize: '12px' }}>Video Selected</span>
                            </div>
                        )
                    ) : (
                        <div className="cr-upload-hint">Upload {label}</div>
                    )}
                    <button className="cr-upload-btn-v2" onClick={handlePick}>
                        Pick {type === 'image' ? 'Image' : 'Video'}
                    </button>
                </div>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept={type === 'image' ? 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml' : 'video/*'}
                multiple={multiple || (count !== undefined && count > 1)}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
};

interface DynamicFieldMapperProps {
    fields: DynamicField[];
    values: Record<string, any>;
    onChange: (fieldId: string, val: any) => void;
    themeColor: string;
}

export const DynamicFieldMapper: React.FC<DynamicFieldMapperProps> = ({ fields, values, onChange, themeColor }) => {
    return (
        <div className="cr-form-field-stack">
            {fields.map(field => {
                const val = values[field.id];

                if (field.type === "group" && field.fields) {
                    return (
                        <div key={field.id} className="cr-dynamic-field-group" style={{ borderLeft: `2px solid ${themeColor}`, paddingLeft: '16px' }}>
                            <h4 className="cr-dynamic-asset-title">{field.label}</h4>
                            <DynamicFieldMapper
                                fields={field.fields}
                                values={val || {}}
                                onChange={(subId, subVal) => {
                                    const currentGroupVal = val || {};
                                    onChange(field.id, { ...currentGroupVal, [subId]: subVal });
                                }}
                                themeColor={themeColor}
                            />
                        </div>
                    );
                }

                if (field.type === "select") {
                    return (
                        <FormSelect
                            key={field.id}
                            label={field.label}
                            options={field.options || []}
                            value={val || ""}
                            onChange={(e: any) => onChange(field.id, e.target.value)}
                            infoText={field.infoText}
                        />
                    );
                }

                if (field.type === "text") {
                    return (
                        <FormInput
                            key={field.id}
                            label={field.label}
                            placeholder={field.placeholder}
                            value={val || ""}
                            onChange={(e: any) => onChange(field.id, e.target.value)}
                            icon={<TextIcon color={themeColor} />}
                            infoText={field.infoText}
                        />
                    );
                }

                if (field.type === "image" || field.type === "video") {
                    return (
                        <AssetUpload
                            key={field.id}
                            type={field.type}
                            label={field.label}
                            value={val}
                            multiple={field.multiple}
                            count={field.count}
                            themeColor={themeColor}
                            onChange={(newVal) => onChange(field.id, newVal)}
                            infoText={field.infoText}
                        />
                    );
                }

                if (field.type === "cta") {
                    return (
                        <FormInput
                            key={field.id}
                            label={field.label}
                            placeholder={field.placeholder}
                            value={val || ""}
                            onChange={(e: any) => onChange(field.id, e.target.value)}
                            icon={<CTAIcon color={themeColor} />}
                            infoText={field.infoText}
                        />
                    );
                }

                if (field.type === "redirect") {
                    return (
                        <FormInput
                            key={field.id}
                            label={field.label}
                            placeholder={field.placeholder}
                            value={val || ""}
                            onChange={(e: any) => onChange(field.id, e.target.value)}
                            icon={<RedirectIcon color={themeColor} />}
                            infoText={field.infoText}
                        />
                    );
                }

                if (field.type === "color") {
                    return (
                        <FormColorInput
                            key={field.id}
                            label={field.label}
                            placeholder={field.placeholder || "#000000"}
                            value={val || ""}
                            onChange={(e: any) => onChange(field.id, e.target.value)}
                            infoText={field.infoText}
                        />
                    );
                }

                if (field.type === "date") {
                    return (
                        <FormDateInput
                            key={field.id}
                            label={field.label}
                            value={val || ""}
                            onChange={(e: any) => onChange(field.id, e.target.value)}
                            infoText={field.infoText}
                        />
                    );
                }

                return null;
            })}
        </div>
    );
};
