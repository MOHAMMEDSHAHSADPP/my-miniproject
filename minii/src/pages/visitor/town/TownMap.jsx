import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import API from '../../../api';

// Reuse the same renderers from the editor
import { RoadMesh } from '../../admin/town/editor/renderers/RoadRenderer';
import { BuildingMesh } from '../../admin/town/editor/renderers/BuildingRenderer';
import { InfraObject, ParkMesh, WaterMesh } from '../../admin/town/editor/renderers/InfraRenderer';

/**
 * TownMap — Read-Only 3D Visitor Viewer (v5.0)
 * Renders the layout built by Admin with full visual fidelity.
 */

/* =============================================
   EVENT STATUS BADGES
   ============================================= */
const EVENT_LABELS = {
    traffic: { label: '🚗 Heavy Traffic', color: '#f59e0b' },
    emergency: { label: '🚨 Emergency', color: '#ef4444' },
    accident: { label: '⚠️ Accident', color: '#dc2626' },
    closed: { label: '🚧 Road Closed', color: '#6b7280' },
};

/* =============================================
   CLICKABLE BUILDING WRAPPER
   ============================================= */
function ClickableBuilding({ item, onSelect }) {
    return (
        <group
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
            <BuildingMesh item={item} isSelected={false} />
        </group>
    );
}

/* =============================================
   VISITOR SCENE
   ============================================= */
function VisitorScene({ layout, onBuildingSelect }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[40, 60, 30]} intensity={1.2} castShadow />
            <hemisphereLight args={['#b1e1ff', '#b97a20', 0.3]} />

            <OrbitControls
                makeDefault
                maxPolarAngle={Math.PI / 2.1}
                minDistance={5}
                maxDistance={300}
                enableDamping
                dampingFactor={0.1}
                touches={{
                    ONE: THREE.TOUCH.ROTATE,
                    TWO: THREE.TOUCH.DOLLY_PAN,
                }}
            />

            <Grid
                infiniteGrid
                sectionColor="#333"
                cellColor="#1a1a1a"
                sectionSize={20}
                cellSize={2}
                fadeDistance={200}
            />

            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial color="#1a1a2e" />
            </mesh>

            {/* Render all layout items */}
            {layout.map((item) => {
                if (item.type === 'road') return <RoadMesh key={item.id} item={item} isSelected={false} />;
                if (item.type === 'building') return <ClickableBuilding key={item.id} item={item} onSelect={onBuildingSelect} />;
                if (item.type === 'park') return <ParkMesh key={item.id} item={item} isSelected={false} />;
                if (item.type === 'water') return <WaterMesh key={item.id} item={item} isSelected={false} />;
                if (['bridge', 'tunnel', 'streetlight', 'signal', 'busstop', 'parking'].includes(item.type)) {
                    return <InfraObject key={item.id} item={item} isSelected={false} />;
                }
                // Fallback generic block
                return (
                    <mesh key={item.id} position={[item.x, (item.height || 1) / 2, item.z]}>
                        <boxGeometry args={[item.width || 2, item.height || 1, item.depth || 2]} />
                        <meshStandardMaterial color={item.color || '#888'} />
                    </mesh>
                );
            })}
        </>
    );
}

/* =============================================
   BUILDING INFO CARD
   ============================================= */
const TEMPLATE_ICONS = {
    house: '🏠', apartment: '🏢', office: '🏛️', school: '🏫',
    hospital: '🏥', mall: '🛍️', shop: '🏪', warehouse: '🏭',
};

function InfoCard({ item, onClose }) {
    if (!item) return null;

    const icon = TEMPLATE_ICONS[item.buildingTemplate || item.subType] || '🏗️';
    const label = (item.buildingTemplate || item.subType || 'building').charAt(0).toUpperCase() +
        (item.buildingTemplate || item.subType || 'building').slice(1);

    return (
        <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
                <span style={{ fontSize: 28 }}>{icon}</span>
                <button onClick={onClose} style={styles.closeBtn}>✕</button>
            </div>

            <h2 style={styles.infoTitle}>{item.name || label}</h2>

            {item.hashtag?.enabled && item.hashtag?.text && (
                <div style={{ ...styles.hashtag, color: item.hashtag.color || '#a78bfa' }}>
                    {item.hashtag.icon && <span>{item.hashtag.icon} </span>}
                    #{item.hashtag.text}
                </div>
            )}

            <div style={styles.infoDivider} />

            <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Type</span>
                <span>{label}</span>
            </div>
            <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Location</span>
                <span>({item.x}, {item.z})</span>
            </div>
            {item.height && (
                <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Height</span>
                    <span>{item.height}u</span>
                </div>
            )}

            {item.description && (
                <p style={styles.infoDesc}>{item.description}</p>
            )}

            {item.buildingTemplate === 'hospital' && (
                <div style={{ ...styles.badge, background: '#ef444433', color: '#ef4444' }}>🚑 Emergency 24/7</div>
            )}
            {item.buildingTemplate === 'school' && (
                <div style={{ ...styles.badge, background: '#f59e0b33', color: '#f59e0b' }}>📚 Open 7 AM – 3 PM</div>
            )}
            {item.buildingTemplate === 'shop' && (
                <div style={{ ...styles.badge, background: '#10b98133', color: '#10b981' }}>🕐 Open 9 AM – 9 PM</div>
            )}
        </div>
    );
}

/* =============================================
   EVENTS PANEL — shows active road events
   ============================================= */
function EventsPanel({ layout }) {
    const events = layout.filter(
        i => i.type === 'road' && i.eventStatus?.type && i.eventStatus.type !== 'none' && i.eventStatus.active !== false
    );
    if (events.length === 0) return null;

    return (
        <div style={styles.eventsPanel}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#fff' }}>🚦 Live Events</div>
            {events.map(ev => {
                const info = EVENT_LABELS[ev.eventStatus.type] || { label: ev.eventStatus.type, color: '#888' };
                return (
                    <div key={ev.id} style={{ ...styles.eventItem, borderLeft: `3px solid ${info.color}` }}>
                        <span style={{ fontSize: 12 }}>{info.label}</span>
                        {ev.eventStatus.description && <span style={{ fontSize: 10, color: '#aaa' }}>{ev.eventStatus.description}</span>}
                    </div>
                );
            })}
        </div>
    );
}

/* =============================================
   MAIN TOWNMAP COMPONENT
   ============================================= */
export default function TownMap() {
    const { townSlug } = useParams();
    const [loading, setLoading] = useState(true);
    const [townData, setTownData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (townSlug) {
            API.get(`/visitor/towns/${townSlug}`)
                .then(res => {
                    setTownData(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err.response?.status === 404 ? 'Town not found' : 'Failed to load');
                    setLoading(false);
                });
        }
    }, [townSlug]);

    if (loading) {
        return (
            <div style={styles.loadScreen}>
                <div style={styles.spinner} />
                <p style={{ color: '#aaa', marginTop: 16 }}>Loading World...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.loadScreen}>
                <p style={{ color: '#ef4444', fontSize: 20 }}>❌ {error}</p>
            </div>
        );
    }

    const layout = townData?.layout || [];

    return (
        <div style={styles.container}>
            <Canvas shadows camera={{ position: [30, 50, 30], fov: 45 }} gl={{ antialias: true }}>
                <VisitorScene layout={layout} onBuildingSelect={setSelectedItem} />
            </Canvas>

            {/* Town name overlay */}
            <div style={styles.titleBar}>
                <h1 style={styles.townTitle}>{townData?.townName || 'Town Map'}</h1>
                <p
                    style={{ ...styles.subtitle, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => window.location.href = `/town/${townSlug}`}
                >
                    ← Back to {townData?.townName || 'Town'}
                </p>
            </div>

            {/* Controls help */}
            <div style={styles.controlsHint}>
                🖱️ Drag to rotate • Scroll to zoom • Right-drag to pan
            </div>

            {/* Stats */}
            <div style={styles.statsBar}>
                <span>🏗️ {layout.filter(i => i.type === 'building').length} Buildings</span>
                <span>🛣️ {layout.filter(i => i.type === 'road').length} Roads</span>
                <span>📦 {layout.length} Total</span>
            </div>

            {/* Live events */}
            <EventsPanel layout={layout} />

            {/* Info card */}
            <InfoCard item={selectedItem} onClose={() => setSelectedItem(null)} />
        </div>
    );
}

/* =============================================
   STYLES
   ============================================= */
const styles = {
    container: {
        width: '100vw', height: '100vh',
        background: '#0a0a1a', position: 'relative', overflow: 'hidden',
    },
    loadScreen: {
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#0a0a1a', color: '#fff',
    },
    spinner: {
        width: 40, height: 40,
        border: '3px solid #333', borderTopColor: '#7c3aed',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    titleBar: {
        position: 'absolute', top: 16, left: 16,
        background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(10px)',
        padding: '14px 22px', borderRadius: 14,
        border: '1px solid rgba(124,58,237,0.2)',
        maxWidth: '90vw',
    },
    townTitle: {
        margin: 0, fontSize: 20, fontWeight: 800, color: '#fff',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    subtitle: {
        margin: '2px 0 0', fontSize: 12, color: '#888',
    },
    controlsHint: {
        position: 'absolute', bottom: 14, left: 14,
        color: '#555', fontSize: 10,
        background: 'rgba(0,0,0,0.5)', padding: '6px 12px',
        borderRadius: 8, fontFamily: 'monospace',
    },
    statsBar: {
        position: 'absolute', bottom: 14, right: 14,
        display: 'flex', gap: 12,
        background: 'rgba(10,10,26,0.85)', padding: '8px 16px',
        borderRadius: 10, color: '#888', fontSize: 11,
        backdropFilter: 'blur(6px)',
    },
    infoCard: {
        position: 'absolute', right: 16, top: 16,
        width: 300, maxHeight: '85vh', overflowY: 'auto',
        background: 'rgba(15,15,30,0.95)', color: '#fff',
        padding: 20, borderRadius: 16,
        border: '1px solid rgba(124,58,237,0.25)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    infoHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    closeBtn: {
        background: 'none', border: 'none', color: '#666',
        fontSize: 18, cursor: 'pointer', padding: 4,
    },
    infoTitle: {
        margin: '8px 0 4px', fontSize: 18, fontWeight: 700,
    },
    hashtag: {
        fontSize: 14, fontWeight: 600, marginBottom: 6,
    },
    infoDivider: {
        height: 1, background: '#333', margin: '10px 0',
    },
    infoRow: {
        display: 'flex', justifyContent: 'space-between',
        fontSize: 13, padding: '4px 0', color: '#ccc',
    },
    infoLabel: {
        color: '#888',
    },
    infoDesc: {
        fontSize: 13, color: '#aaa', marginTop: 10, lineHeight: 1.5,
    },
    badge: {
        fontSize: 12, fontWeight: 600,
        padding: '6px 12px', borderRadius: 8,
        marginTop: 10, textAlign: 'center',
    },
    eventsPanel: {
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(10,10,26,0.9)', padding: '12px 16px',
        borderRadius: 12, border: '1px solid #333',
        maxWidth: 250, backdropFilter: 'blur(8px)',
    },
    eventItem: {
        display: 'flex', flexDirection: 'column', gap: 2,
        padding: '6px 10px', marginTop: 4,
        background: 'rgba(255,255,255,0.04)', borderRadius: 6,
    },
};
