import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import API from '../../../api';
import './AdminMapBuilder.css';

// --- CONFIGURATION ---
const GRID_SIZE = 200;

const BUILDING_TYPES = [
    { value: 'house', label: '🏠 House', defaultColor: '#f59e0b', defaultHeight: 4 },
    { value: 'shop', label: '🛒 Shop', defaultColor: '#4285F4', defaultHeight: 6 },
    { value: 'office', label: '🏢 Office', defaultColor: '#8b5cf6', defaultHeight: 12 },
    { value: 'hospital', label: '🏥 Hospital', defaultColor: '#ef4444', defaultHeight: 8 },
    { value: 'school', label: '🏫 School', defaultColor: '#eab308', defaultHeight: 6 },
    { value: 'station', label: '🚉 Station', defaultColor: '#6b7280', defaultHeight: 5 },
    { value: 'petrol', label: '⛽ Petrol Pump', defaultColor: '#a855f7', defaultHeight: 4 },
    { value: 'park', label: '🌳 Park', defaultColor: '#10b981', defaultHeight: 0.2 },
    { value: 'other', label: '📍 Other', defaultColor: '#cccccc', defaultHeight: 4 },
];

function BuilderScene({ layout, activeTool, properties, onInteract, hoverPos, setHoverPos, selectedBlockId, lineStartPos, setLineStartPos }) {
    const { camera } = useThree();

    const [isRotating, setIsRotating] = useState(false);

    const handlePointerMove = (e) => {
        if (isRotating) return; // Stop updates while rotating

        const x = Math.round(e.point.x / 2) * 2;
        const z = Math.round(e.point.z / 2) * 2;

        if (!hoverPos || hoverPos[0] !== x || hoverPos[2] !== z) {
            setHoverPos([x, 0, z]);
        }

        // ONLY paint on Left Click Drag (buttons === 1)
        // And ONLY if NOT in line mode
        if (e.buttons === 1 && activeTool !== 'select' && activeTool !== 'line' && !lineStartPos) {
            onInteract(x, z, true);
        }
    };

    const handlePointerDown = (e) => {
        // button === 0 is LEFT CLICK
        if (e.button !== 0) return;
        if (isRotating) return; // Extra guard

        if (!hoverPos) return;

        if (activeTool === 'line') {
            if (!lineStartPos) {
                setLineStartPos(hoverPos);
            } else {
                // Second click - handleInteract will be called for the whole line
                onInteract(hoverPos[0], hoverPos[2], false, lineStartPos);
                setLineStartPos(null);
            }
        } else {
            onInteract(hoverPos[0], hoverPos[2], false);
        }
    };

    // Calculate line blocks for preview
    const getLineBlocks = () => {
        if (!lineStartPos || !hoverPos) return [];
        const blocks = [];
        const [x1, , z1] = lineStartPos;
        const [x2, , z2] = hoverPos;

        // Snap to axis (straight lines only)
        const dx = Math.abs(x2 - x1);
        const dz = Math.abs(z2 - z1);

        if (dx > dz) {
            const start = Math.min(x1, x2);
            const end = Math.max(x1, x2);
            for (let x = start; x <= end; x += 2) {
                blocks.push([x, 0, z1]);
            }
        } else {
            const start = Math.min(z1, z2);
            const end = Math.max(z1, z2);
            for (let z = start; z <= end; z += 2) {
                blocks.push([x1, 0, z]);
            }
        }
        return blocks;
    };

    return (
        <>
            <ambientLight intensity={0.7} />
            <directionalLight position={[20, 30, 10]} intensity={1} castShadow />
            <OrbitControls
                makeDefault
                maxPolarAngle={Math.PI / 2.1}
                onStart={() => setIsRotating(true)}
                onEnd={() => setIsRotating(false)}
                mouseButtons={{
                    LEFT: null,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.ROTATE
                }}
            />

            <Grid infiniteGrid sectionColor="#555" cellColor="#333" sectionSize={20} cellSize={2} fadeDistance={150} />

            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
            >
                <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {/* EXISTING BLOCKS */}
            {layout.map((item) => (
                <Block key={item.id} item={item} selected={item.id === selectedBlockId} />
            ))}

            {/* LINE PREVIEW */}
            {lineStartPos && !isRotating && getLineBlocks().map((pos, i) => (
                <group key={i} position={[pos[0], (properties.height || 0.1) / 2, pos[2]]}>
                    <mesh>
                        <boxGeometry args={[properties.width || 2, properties.height || 0.1, properties.depth || 2]} />
                        <meshStandardMaterial color={properties.color || '#fff'} transparent opacity={0.4} />
                    </mesh>
                </group>
            ))}

            {/* GHOST BLOCK (if not in line mode) - HIDE WHEN ROTATING */}
            {hoverPos && !isRotating && activeTool !== 'eraser' && activeTool !== 'select' && activeTool !== 'line' && (
                <group position={[hoverPos[0], (properties.height || 0.1) / 2, hoverPos[2]]}>
                    <mesh>
                        <boxGeometry args={[properties.width || 2, properties.height || 0.1, properties.depth || 2]} />
                        <meshStandardMaterial color={properties.color || '#fff'} transparent opacity={0.6} />
                    </mesh>
                </group>
            )}

            {/* CURSOR INDICATOR - HIDE WHEN ROTATING */}
            {hoverPos && !isRotating && (activeTool === 'eraser' || activeTool === 'select' || (activeTool === 'line' && !lineStartPos)) && (
                <mesh position={[hoverPos[0], 1, hoverPos[2]]}>
                    <boxGeometry args={[2.2, 2.2, 2.2]} />
                    <meshStandardMaterial color={activeTool === 'eraser' ? '#ff0000' : '#ffff00'} wireframe />
                </mesh>
            )}
        </>
    );
}

const Block = React.memo(({ item, selected }) => {
    const { type, x, z, width, depth, height, color } = item;
    return (
        <group position={[x, height / 2, z]}>
            <mesh>
                <boxGeometry args={[width || 2, height || 2, depth || 2]} />
                <meshStandardMaterial color={color || '#ccc'} />
            </mesh>
            {selected && (
                <mesh>
                    <boxGeometry args={[(width || 2) + 0.2, (height || 2) + 0.2, (depth || 2) + 0.2]} />
                    <meshStandardMaterial color="#ffff00" wireframe />
                </mesh>
            )}
        </group>
    );
});

export default function AdminMapBuilder({ townId, onBack }) {
    const [layout, setLayout] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const [activeTool, setActiveTool] = useState('select');
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [lineStartPos, setLineStartPos] = useState(null);

    const [properties, setProperties] = useState({
        subType: 'house',
        name: '',
        color: '#555555',
        height: 0.1,
        width: 2,
        depth: 2
    });

    const [hoverPos, setHoverPos] = useState(null);

    useEffect(() => {
        loadTown();
    }, [townId]);

    const loadTown = async () => {
        try {
            const res = await API.get(`/admin/towns/${townId}`);
            if (res.data.layout) setLayout(res.data.layout);
            setLoading(false);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || err.message;
            setMsg(`❌ Failed to load: ${errorMsg}`);
            setLoading(false);
        }
    };

    const switchTool = (tool) => {
        setActiveTool(tool);
        setSelectedBlockId(null);
        setLineStartPos(null);

        if (tool === 'road' || tool === 'line') {
            setProperties({ ...properties, name: 'Road', color: '#555555', height: 0.1, width: 2, depth: 2, type: 'road' });
        } else if (tool === 'building') {
            const def = BUILDING_TYPES[0];
            setProperties({ ...properties, name: 'Building', subType: def.value, color: def.defaultColor, height: def.defaultHeight, width: 4, depth: 4, type: 'building' });
        } else if (tool === 'park') {
            setProperties({ ...properties, name: 'Park', color: '#10b981', height: 0.2, width: 4, depth: 4, type: 'park' });
        } else if (tool === 'water') {
            setProperties({ ...properties, name: 'Water', color: '#3b82f6', height: 0.1, width: 4, depth: 4, type: 'water' });
        }
    };

    const handleInteract = (x, z, isDrag, lineStart) => {
        if (activeTool === 'select') {
            if (isDrag) return;
            // Find clicked block
            // Basic proximity check
            const clicked = layout.slice().reverse().find(b => {
                const halfW = (b.width || 2) / 2;
                const halfD = (b.depth || 2) / 2;
                return Math.abs(b.x - x) <= halfW && Math.abs(b.z - z) <= halfD;
            });

            if (clicked) {
                setSelectedBlockId(clicked.id);
                setProperties({ ...clicked }); // Load properties
            } else {
                setSelectedBlockId(null);
            }
            return;
        }

        if (activeTool === 'eraser') {
            setLayout(prev => prev.filter(item => {
                // Precise deletion
                if (Math.abs(item.x - x) < 1 && Math.abs(item.z - z) < 1) return false;
                return true;
            }));
            return;
        }

        const createBlock = (px, pz) => ({
            id: Date.now() + Math.random().toString(),
            type: activeTool === 'line' ? 'road' : activeTool,
            subType: activeTool === 'building' ? properties.subType : null,
            name: properties.name,
            x: px,
            z: pz,
            width: properties.width,
            depth: properties.depth,
            height: properties.height,
            color: properties.color,
            rotation: 0
        });

        if (lineStart) {
            const [lx1, , lz1] = lineStart;
            const dx = Math.abs(x - lx1);
            const dz = Math.abs(z - lz1);
            const blocksToPlace = [];

            if (dx > dz) {
                const start = Math.min(lx1, x);
                const end = Math.max(lx1, x);
                for (let k = start; k <= end; k += 2) blocksToPlace.push({ x: k, z: lz1 });
            } else {
                const start = Math.min(lz1, z);
                const end = Math.max(lz1, z);
                for (let k = start; k <= end; k += 2) blocksToPlace.push({ x: lx1, z: k });
            }

            setLayout(prev => {
                let next = [...prev];
                blocksToPlace.forEach(b => {
                    const exists = next.find(item => Math.abs(item.x - b.x) < 0.5 && Math.abs(item.z - b.z) < 0.5);
                    if (!exists) next.push(createBlock(b.x, b.z));
                });
                return next;
            });
            return;
        }

        // Placing logic (prevent duplicates)
        setLayout(prev => {
            const exists = prev.find(item => Math.abs(item.x - x) < 0.5 && Math.abs(item.z - z) < 0.5);
            if (exists) return prev; // Don't stack
            return [...prev, createBlock(x, z)];
        });
    };

    // Live update of selected block when properties change
    const updateProperty = (key, value) => {
        setProperties(p => {
            const newProps = { ...p, [key]: value };

            // If subType changed, update defaults
            if (key === 'subType') {
                const typeConf = BUILDING_TYPES.find(t => t.value === value);
                if (typeConf) {
                    newProps.color = typeConf.defaultColor;
                    newProps.height = typeConf.defaultHeight;
                    newProps.name = typeConf.label; // Default name
                }
            }

            // Immediately update layout if a block is selected
            if (selectedBlockId) {
                setLayout(prev => prev.map(b => b.id === selectedBlockId ? { ...b, ...newProps } : b));
            }

            return newProps;
        });
    };

    const saveLayout = async () => {
        setSaving(true);
        setMsg('');
        try {
            await API.put(`/admin/towns/${townId}/layout`, { layout });
            setMsg('✅ Layout saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            console.error(err);
            setMsg('❌ Failed to save layout.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="map-builder-container"><div style={{ margin: 'auto' }}>
        {msg ? <div style={{ color: 'red' }}>{msg}</div> : 'Loading Map...'}
    </div></div>;

    const showProperties = selectedBlockId || activeTool === 'building';
    const isRoadSelected = selectedBlockId && properties.type === 'road';
    const isBuildingSelected = selectedBlockId ? properties.type === 'building' : activeTool === 'building';

    return (
        <div className="map-builder-container">
            <div className="builder-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <h3 style={{ margin: 0 }}>Town Layout Builder</h3>
                    <span style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>v4.0 PRO</span>
                </div>
                <div className="actions">
                    <span style={{ color: msg.includes('Fail') ? 'red' : 'green', marginRight: 10, alignSelf: 'center' }}>{msg}</span>
                    <button className="secondary" onClick={onBack}>Exit</button>
                    <button className="primary" onClick={saveLayout} disabled={saving}>{saving ? 'Saving...' : '💾 Save Map'}</button>
                </div>
            </div>

            <div className="builder-content">
                <div className="builder-toolbar">
                    <div className="tool-category">Tools</div>
                    <button className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => switchTool('select')}>
                        👆 Select / Edit
                    </button>
                    <button className={`tool-btn danger ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => switchTool('eraser')}>
                        ❌ Eraser
                    </button>

                    <div className="tool-category">Place</div>
                    <button className={`tool-btn ${activeTool === 'road' ? 'active' : ''}`} onClick={() => switchTool('road')}>
                        🛣️ Paint Road
                    </button>
                    <button className={`tool-btn ${activeTool === 'line' ? 'active' : ''}`} onClick={() => switchTool('line')}>
                        📏 Straight Road
                    </button>
                    <button className={`tool-btn ${activeTool === 'building' ? 'active' : ''}`} onClick={() => switchTool('building')}>
                        🏢 Building
                    </button>
                    <button className={`tool-btn ${activeTool === 'park' ? 'active' : ''}`} onClick={() => switchTool('park')}>
                        🌳 Park
                    </button>
                    <button className={`tool-btn ${activeTool === 'water' ? 'active' : ''}`} onClick={() => switchTool('water')}>
                        💧 Water
                    </button>
                </div>

                <div className="canvas-wrapper" onContextMenu={(e) => e.preventDefault()}>
                    <Canvas shadows camera={{ position: [20, 40, 20], fov: 45 }}>
                        <BuilderScene
                            layout={layout}
                            activeTool={activeTool}
                            properties={properties}
                            onInteract={handleInteract}
                            hoverPos={hoverPos}
                            setHoverPos={setHoverPos}
                            selectedBlockId={selectedBlockId}
                            lineStartPos={lineStartPos}
                            setLineStartPos={setLineStartPos}
                        />
                    </Canvas>
                    <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#aaa', fontSize: '10px', pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: 4 }}>
                        <b>Left Drag</b>: Paint • <b>Right Drag</b>: Rotate • <b>Line Tool</b>: Click Start then Click End
                    </div>
                </div>

                {/* PROPERTIES PANEL */}
                {(showProperties || isRoadSelected || selectedBlockId) && (
                    <div className="properties-panel">
                        <div className="tool-category">
                            {selectedBlockId ? 'Edit Selected' : 'New Block Settings'}
                        </div>

                        <div className="prop-group">
                            <label>Label</label>
                            <input
                                value={properties.name || ''}
                                onChange={(e) => updateProperty('name', e.target.value)}
                                placeholder="E.g. High Street"
                                style={{ background: '#333', color: 'white', border: '1px solid #444', padding: 8, borderRadius: 4 }}
                            />
                        </div>

                        {/* Building Type - Only for buildings */}
                        {isBuildingSelected && (
                            <div className="prop-group">
                                <label>Building Style</label>
                                <select
                                    value={properties.subType}
                                    onChange={(e) => updateProperty('subType', e.target.value)}
                                    style={{ background: '#333', color: 'white', border: '1px solid #444', padding: 8, borderRadius: 4 }}
                                >
                                    {BUILDING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Road Traffic Status - v3.2 Toggle Overhaul */}
                        {isRoadSelected && (
                            <div className="prop-group">
                                <label>Traffic Blockage</label>
                                <div
                                    onClick={() => updateProperty('color', properties.color === '#ef4444' ? '#555555' : '#ef4444')}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: properties.color === '#ef4444' ? '#ef4444' : '#444',
                                        padding: '10px 15px',
                                        borderRadius: 8,
                                        transition: 'all 0.2s',
                                        justifyContent: 'center',
                                        border: '2px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>
                                        {properties.color === '#ef4444' ? '🚫 BLOCKED (Red)' : '✅ NORMAL (Gray)'}
                                    </span>
                                </div>
                                <p style={{ fontSize: 10, color: '#888', marginTop: 8 }}>Click to toggle traffic status on visitor map.</p>
                            </div>
                        )}

                        {/* Color Picker - Only for Buildings/Other */}
                        {!isRoadSelected && (
                            <div className="prop-group">
                                <label>Base Color</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input
                                        type="color"
                                        value={properties.color}
                                        onChange={(e) => updateProperty('color', e.target.value)}
                                        style={{ border: 'none', width: 45, height: 45, padding: 0, background: 'none', cursor: 'pointer' }}
                                    />
                                    <div style={{ alignSelf: 'center' }}>
                                        <div style={{ fontSize: 12 }}>{properties.color.toUpperCase()}</div>
                                        <div style={{ fontSize: 10, color: '#888' }}>Click to change</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dimensions */}
                        {isBuildingSelected && (
                            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #333' }}>
                                <div className="prop-group">
                                    <label>Scale Height: {properties.height}</label>
                                    <input
                                        type="range" min="2" max="50" step="1"
                                        value={properties.height}
                                        onChange={(e) => updateProperty('height', Number(e.target.value))}
                                    />
                                </div>
                                <div className="prop-group">
                                    <label>Footprint Size: {properties.width}</label>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <span style={{ fontSize: 10, color: '#888' }}>Small</span>
                                        <input
                                            style={{ flex: 1 }}
                                            type="range" min="2" max="12" step="2"
                                            value={properties.width}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                updateProperty('width', val);
                                                updateProperty('depth', val); // Keep square for simplicity unless asked
                                            }}
                                        />
                                        <span style={{ fontSize: 10, color: '#888' }}>Large</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
