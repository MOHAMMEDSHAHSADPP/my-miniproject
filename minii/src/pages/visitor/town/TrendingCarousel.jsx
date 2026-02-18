import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './town.css'; // Ensure we have access to base styles

const TrendingCarousel = ({ items = [], townSlug }) => {
    const navigate = useNavigate();
    const [currDeg, setCurrDeg] = useState(0);
    const containerRef = useRef(null);

    // Auto-rotate FASTER (2.5s)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrDeg(d => d - 60);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const count = 6;
    const angle = 360 / 6;
    const radius = 350; // Increased radius for better spacing

    // Ensure we have exactly 6 items (repeat if needed or fill)
    const validItems = items.length > 0 ? items : [];
    // If fewer than 6, we can repeat them to fill the carousel? 
    // Or just fill with "Coming Soon". User asked for 6 cards.
    // Let's just use what we have and fill the rest.

    return (
        <div style={{
            perspective: '1200px',
            height: '420px', // Increased height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '40px 0 80px',
            overflow: 'visible'
        }}>
            <div
                ref={containerRef}
                style={{
                    width: '300px', // Increased card width
                    height: '380px', // Increased card height
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${currDeg}deg)`,
                    transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
            >
                {/* Render 6 slots specifically */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const item = validItems[i % validItems.length]; // Cycle through items if fewer than 6? 
                    // Better: Show actual items, then placeholders.
                    const isReal = i < validItems.length;
                    const realItem = isReal ? validItems[i] : null;

                    return (
                        <div
                            key={i}
                            onClick={() => realItem && navigate(`/town/${townSlug}/trending/${realItem._id}`)}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                left: 0,
                                top: 0,
                                transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
                                backfaceVisibility: 'hidden',
                                background: isReal ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255,255,255,0.1)',
                                borderRadius: '24px',
                                padding: '12px',
                                boxShadow: isReal ? '0 15px 40px rgba(139, 92, 246, 0.25)' : 'none',
                                border: isReal ? '1px solid rgba(255, 255, 255, 0.8)' : '2px dashed rgba(255,255,255,0.2)',
                                cursor: isReal ? 'pointer' : 'default',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {realItem ? (
                                <>
                                    <div style={{
                                        flex: 1,
                                        background: '#f3f4f6',
                                        borderRadius: '16px',
                                        backgroundImage: realItem.image ? `url(http://localhost:8081${realItem.image})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        marginBottom: '12px',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: 12, right: 12,
                                            background: 'var(--th-primary)', color: 'white',
                                            padding: '4px 12px', borderRadius: '50px',
                                            fontSize: '0.75rem', fontWeight: 700,
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                        }}>HOT</div>
                                    </div>
                                    <div style={{ padding: '0 4px 6px' }}>
                                        <h3 style={{ margin: '0 0 6px', fontSize: '1.3rem', color: '#1f2937', fontWeight: 700 }}>{realItem.title}</h3>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {realItem.subtitle || "Check this out!"}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0.5, fontWeight: 600, fontSize: '1.2rem' }}>
                                    Coming Soon
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrendingCarousel;
