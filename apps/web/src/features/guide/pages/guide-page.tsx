import { useState, useMemo, useRef } from 'react';
import { Search, ChevronRight, HelpCircle, BookOpen } from 'lucide-react';
import { GUIDE_CATEGORIES } from '../data/guide-content';
import '../styles/guide.css';

export default function GuidePage() {
    const [selectedCatId, setSelectedCatId] = useState(GUIDE_CATEGORIES[0]?.id);
    const [searchQuery, setSearchQuery] = useState('');
    const [openTopicIndex, setOpenTopicIndex] = useState<number | null>(0);
    const topicsRef = useRef<HTMLDivElement>(null);

    // Categories filter (mostly for visuals)
    const activeCategory = useMemo(() => 
        GUIDE_CATEGORIES.find(c => c.id === selectedCatId) || GUIDE_CATEGORIES[0],
    [selectedCatId]);

    // Global search logic
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        const results: {catTitle: string, topic: typeof GUIDE_CATEGORIES[0]['topics'][0]}[] = [];
        
        GUIDE_CATEGORIES.forEach(cat => {
            cat.topics.forEach(topic => {
                if (topic.title.toLowerCase().includes(q) || topic.content.toLowerCase().includes(q)) {
                    results.push({ catTitle: cat.title, topic });
                }
            });
        });
        return results;
    }, [searchQuery]);

    // Handle category click with mobile auto-scroll
    const handleCategoryClick = (id: string) => {
        setSelectedCatId(id);
        setOpenTopicIndex(0);
        
        // Auto-scroll logic for all breakpoints
        if (topicsRef.current) {
            setTimeout(() => {
                topicsRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 50);
        }
    };

    return (
        <div className="guide-page">
            {/* HERO SECTION */}
            <header className="guide-hero">
                <div className="guide-hero__content">
                    <h1 className="guide-hero__title">Knowledge Base</h1>
                    <p className="guide-hero__sub">
                        Master the ScrollToday platform with our comprehensive guides, 
                        format deep-dives, and best practices.
                    </p>
                    
                    <div className="guide-search-container">
                        <Search className="guide-search-icon" size={20} />
                        <input 
                            type="text" 
                            className="guide-search-input" 
                            placeholder="Search for a topic (e.g. 'Ad Tags', 'Credits')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* CATEGORY SELECTOR */}
            {!searchQuery && (
                <div className="guide-categories">
                    {GUIDE_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = selectedCatId === cat.id;
                        return (
                            <div 
                                key={cat.id} 
                                className={`guide-cat-card ${isActive ? 'guide-cat-card--active' : ''}`}
                                onClick={() => handleCategoryClick(cat.id)}
                            >
                                <div className="guide-cat-icon-wrap">
                                    <Icon size={24} />
                                </div>
                                <h3 className="guide-cat-title">{cat.title}</h3>
                                <p className="guide-cat-info">{cat.topics.length} articles in this category</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TOPICS LIST */}
            <main className="guide-topics-section" ref={topicsRef}>
                {searchQuery ? (
                    // SEARCH VIEW
                    <div className="guide-search-results">
                        <div className="guide-section-header">
                            <Search className="text-secondary" size={22} />
                            <h2>Search Results ({searchResults?.length || 0})</h2>
                        </div>
                        
                        {searchResults && searchResults.length > 0 ? (
                            <div className="guide-topic-list">
                                {searchResults.map((res, i) => (
                                    <div key={i} className="guide-topic-card" data-open="true">
                                        <div className="guide-topic-trigger">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">
                                                    {res.catTitle}
                                                </span>
                                                <span className="guide-topic-title">{res.topic.title}</span>
                                            </div>
                                        </div>
                                        <div className="guide-topic-content" style={{ display: 'block' }}>
                                            {res.topic.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="guide-empty">
                                <HelpCircle className="guide-empty-icon" />
                                <h3 className="text-lg font-bold mb-2">No results found</h3>
                                <p className="text-muted-foreground">Try different keywords or browse categories below.</p>
                                <button 
                                    className="mt-6 text-primary font-semibold underline"
                                    onClick={() => setSearchQuery('')}
                                >
                                    Clear search
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // CATEGORY VIEW
                    <>
                        <div className="guide-section-header">
                            <BookOpen className="text-primary" size={22} />
                            <h2>{activeCategory?.title || 'Category'}</h2>
                        </div>
                        
                        <div className="guide-topic-list">
                            {activeCategory?.topics.map((topic, i) => (
                                <div 
                                    key={i} 
                                    className="guide-topic-card" 
                                    data-open={openTopicIndex === i}
                                >
                                    <button 
                                        className="guide-topic-trigger"
                                        onClick={() => setOpenTopicIndex(openTopicIndex === i ? null : i)}
                                    >
                                        <span className="guide-topic-title">{topic.title}</span>
                                        <ChevronRight className="guide-topic-chevron" size={20} />
                                    </button>
                                    <div className="guide-topic-content">
                                        {topic.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
