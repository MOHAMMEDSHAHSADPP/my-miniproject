import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import API from '../../../../api';
import Toolbar, { TOOL_KEYS } from './Toolbar';
import Canvas3D from './Canvas3D';
import PropertiesPanel, { BUILDING_TEMPLATES } from './PropertiesPanel';
import StatusBar from './StatusBar';
import { computeRoadLength } from './renderers/RoadRenderer';
import './MapEditor.css';

/* =============================================
   UNDO / REDO REDUCER
   ============================================= */
const MAX_HISTORY = 50;

function layoutReducer(state, action) {
    switch (action.type) {
        case 'SET':
            return { past: [], present: action.layout, future: [] };
        case 'UPDATE':
            return {
                past: [...state.past.slice(-MAX_HISTORY), state.present],
                present: action.layout,
                future: []
            };
        case 'UNDO':
            if (state.past.length === 0) return state;
            return {
                past: state.past.slice(0, -1),
                present: state.past[state.past.length - 1],
                future: [state.present, ...state.future]
            };
        case 'REDO':
            if (state.future.length === 0) return state;
            return {
                past: [...state.past, state.present],
                present: state.future[0],
                future: state.future.slice(1)
            };
        default:
            return state;
    }
}

/* =============================================
   DEFAULT PROPERTIES
   ============================================= */
const TOOL_DEFAULTS = {
    road: { type: 'road', width: 6, depth: 2, height: 0.15, color: '#555555', roadMode: 'straight', lanes: 2 },
    bezier: { type: 'road', width: 4, depth: 2, height: 0.15, color: '#555555', roadMode: 'bezier', lanes: 2 },
    spline: { type: 'road', width: 4, depth: 2, height: 0.15, color: '#555555', roadMode: 'spline', lanes: 2 },
    line: { type: 'road', width: 2, depth: 2, height: 0.15, color: '#555555', roadMode: 'straight', lanes: 2 },
    building: { type: 'building', width: 4, depth: 4, height: 6, color: '#f59e0b', buildingTemplate: 'house', subType: 'house' },
    park: { type: 'park', width: 8, depth: 8, height: 0.2, color: '#10b981' },
    water: { type: 'water', width: 8, depth: 8, height: 0.1, color: '#3b82f6' },
    bridge: { type: 'bridge', width: 6, depth: 2, height: 2, color: '#9ca3af', infraType: 'bridge', elevation: 2 },
    tunnel: { type: 'tunnel', width: 6, depth: 2, height: 3, color: '#374151', infraType: 'tunnel' },
    light: { type: 'streetlight', width: 0.5, depth: 0.5, height: 5, color: '#fbbf24', infraType: 'streetlight' },
    signal: { type: 'signal', width: 0.5, depth: 0.5, height: 4, color: '#ef4444', infraType: 'signal' },
    busstop: { type: 'busstop', width: 2, depth: 1, height: 3, color: '#06b6d4', infraType: 'busstop' },
    parking: { type: 'parking', width: 6, depth: 8, height: 0.1, color: '#6b7280', infraType: 'parking' },
};

const ROAD_TOOLS = ['road', 'bezier', 'spline'];

/* =============================================
   MAP EDITOR PAGE — Main Orchestrator
   ============================================= */
export default function MapEditorPage({ townId, townSlug, onBack }) {
    const [state, dispatch] = useReducer(layoutReducer, { past: [], present: [], future: [] });
    const [activeTool, setActiveTool] = useState('select');
    const [selectedId, setSelectedId] = useState(null);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Road drawing state
    const [roadDrawState, setRoadDrawState] = useState(null); // { points: [], hoverPoint: null, width: 4 }
    const [measureLength, setMeasureLength] = useState(0);

    // Settings
    const [gridSnap, setGridSnap] = useState(true);
    const [gridSize, setGridSize] = useState(2);
    const [autosave, setAutosave] = useState(false);

    // Refs
    const cursorRef = useRef([0, 0, 0]);
    const autosaveTimer = useRef(null);
    const dirty = useRef(false);

    const layout = state.present;
    const selectedItem = selectedId ? layout.find(i => i.id === selectedId) : null;

    /* ===== Reset road draw when tool changes ===== */
    useEffect(() => {
        if (!ROAD_TOOLS.includes(activeTool)) {
            setRoadDrawState(null);
            setMeasureLength(0);
        }
    }, [activeTool]);

    /* ===== LOAD ===== */
    useEffect(() => {
        if (!townId) return;
        setLoading(true);
        API.get(`/admin/towns/${townId}`)
            .then(res => {
                dispatch({ type: 'SET', layout: res.data.layout || [] });
                if (res.data.mapSettings) {
                    setGridSnap(res.data.mapSettings.gridSnap ?? true);
                    setGridSize(res.data.mapSettings.gridSize ?? 2);
                    setAutosave(res.data.mapSettings.autosave ?? false);
                }
                setLoading(false);
                showMsg('Map loaded', 'ok');
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
                showMsg(err.response?.status === 403 ? '🚫 Access Denied' : 'Failed to load map', 'err');
            });
    }, [townId]);

    /* ===== SAVE ===== */
    const save = useCallback(async () => {
        if (!townId) return;
        setSaving(true);
        try {
            await API.put(`/admin/towns/${townId}/layout`, {
                layout,
                mapSettings: { gridSnap, gridSize, autosave }
            });
            dirty.current = false;
            showMsg('✅ Map saved!', 'ok');
        } catch (err) {
            showMsg(err.response?.status === 403 ? '🚫 Permission denied' : '❌ Save failed', 'err');
        }
        setSaving(false);
    }, [townId, layout, gridSnap, gridSize, autosave]);

    /* ===== AUTOSAVE ===== */
    useEffect(() => {
        if (autosave && dirty.current) {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
            autosaveTimer.current = setTimeout(save, 5000);
        }
        return () => clearTimeout(autosaveTimer.current);
    }, [layout, autosave, save]);

    const showMsg = (text, type) => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3000);
    };

    /* ===== FINALIZE ROAD ===== */
    const finalizeRoad = useCallback((points) => {
        if (!points || points.length < 2) return;

        const defaults = TOOL_DEFAULTS[activeTool] || TOOL_DEFAULTS.road;
        const curvePoints = points.map(p => ({ x: p.x, y: 0.08, z: p.z }));

        // Center position = midpoint of first and last
        const cx = (points[0].x + points[points.length - 1].x) / 2;
        const cz = (points[0].z + points[points.length - 1].z) / 2;

        const roadLength = computeRoadLength(curvePoints);

        const newRoad = {
            id: generateId(),
            ...defaults,
            x: cx,
            z: cz,
            curvePoints,
            roadLength,
            active: true,
            hashtag: { enabled: false },
            eventStatus: { type: 'none', active: false },
        };

        dispatch({ type: 'UPDATE', layout: [...layout, newRoad] });
        dirty.current = true;
        setSelectedId(newRoad.id);
        setRoadDrawState(null);
        setMeasureLength(0);
        showMsg(`Road placed (${roadLength.toFixed(1)}u)`, 'ok');
    }, [activeTool, layout]);

    /* ===== KEYBOARD ===== */
    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            const tool = TOOL_KEYS[e.key.toLowerCase()];
            if (tool && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setActiveTool(tool);
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }); return; }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); return; }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); return; }
            if (e.key === 'Delete' && selectedId) { e.preventDefault(); deleteItem(selectedId); return; }
            if (e.key === 'Escape') {
                // Cancel road drawing first
                if (roadDrawState) {
                    setRoadDrawState(null);
                    setMeasureLength(0);
                    showMsg('Drawing cancelled', 'ok');
                    return;
                }
                setActiveTool('select');
                setSelectedId(null);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedId, save, roadDrawState]);

    /* ===== POINTER ACTIONS ===== */
    const handlePointerAction = useCallback((action) => {
        const { type, x, z, shiftKey } = action;

        /* --- HOVER: update road preview --- */
        if (type === 'hover') {
            if (roadDrawState && roadDrawState.points.length > 0) {
                const hoverPoint = { x, z };
                const allPts = [...roadDrawState.points, hoverPoint].map(p => ({ x: p.x, y: 0.08, z: p.z }));
                setMeasureLength(computeRoadLength(allPts));
                setRoadDrawState(prev => prev ? { ...prev, hoverPoint } : null);
            }
            return;
        }

        /* --- CLICK --- */
        if (type === 'click') {
            // ========= ROAD TOOLS =========
            if (ROAD_TOOLS.includes(activeTool)) {
                if (!roadDrawState) {
                    // Start drawing
                    const defaults = TOOL_DEFAULTS[activeTool] || TOOL_DEFAULTS.road;
                    setRoadDrawState({ points: [{ x, z }], hoverPoint: null, width: defaults.width || 4 });
                    showMsg('Click next point. Double-click or ESC to finish.', 'ok');
                    return;
                }

                // Add point
                const newPoints = [...roadDrawState.points, { x, z }];

                // Straight road: 2 points = done
                if (activeTool === 'road' && newPoints.length >= 2) {
                    finalizeRoad(newPoints);
                    return;
                }

                // Bezier: 2 points for start/end, then auto-generate controls
                // On 2nd click, create road with auto mid-controls
                if (activeTool === 'bezier' && newPoints.length >= 2) {
                    // Auto-generate 2 control points (offset perpendicular to line)
                    const p1 = newPoints[0];
                    const p2 = newPoints[newPoints.length - 1];
                    const mx = (p1.x + p2.x) / 2;
                    const mz = (p1.z + p2.z) / 2;
                    const dx = p2.x - p1.x;
                    const dz = p2.z - p1.z;
                    const len = Math.sqrt(dx * dx + dz * dz);
                    const offset = len * 0.3;
                    const perpX = -dz / len * offset;
                    const perpZ = dx / len * offset;

                    const bezierPoints = [
                        p1,
                        { x: mx + perpX, z: mz + perpZ },
                        { x: mx - perpX, z: mz - perpZ },
                        p2,
                    ];
                    finalizeRoad(bezierPoints);
                    return;
                }

                // Spline: keep adding points
                setRoadDrawState(prev => ({ ...prev, points: newPoints }));
                return;
            }

            // ========= SELECT =========
            if (activeTool === 'select') {
                const hit = findObjectAt(layout, x, z);
                setSelectedId(hit ? hit.id : null);
                return;
            }

            // ========= ERASER =========
            if (activeTool === 'eraser') {
                const hit = findObjectAt(layout, x, z);
                if (hit) deleteItem(hit.id);
                return;
            }

            // ========= EVENT =========
            if (activeTool === 'event') {
                const hit = findObjectAt(layout, x, z);
                if (hit && hit.type === 'road') {
                    setSelectedId(hit.id);
                    setActiveTool('select');
                    showMsg('Set road status in Properties panel →', 'ok');
                }
                return;
            }

            // ========= LABEL =========
            if (activeTool === 'label') {
                const hit = findObjectAt(layout, x, z);
                if (hit && hit.type === 'building') {
                    setSelectedId(hit.id);
                    showMsg('Edit hashtag in Properties panel →', 'ok');
                }
                return;
            }

            // ========= OTHER PLACEMENT =========
            const defaults = TOOL_DEFAULTS[activeTool];
            if (defaults) {
                const existing = findObjectAt(layout, x, z);
                if (existing && !['road', 'line'].includes(activeTool)) return;

                const newItem = {
                    id: generateId(),
                    ...defaults,
                    x, z,
                    active: true,
                    hashtag: { enabled: false },
                    eventStatus: { type: 'none', active: false },
                };

                dispatch({ type: 'UPDATE', layout: [...layout, newItem] });
                dirty.current = true;
                setSelectedId(newItem.id);
            }
        }

        /* --- DOUBLE-CLICK: finalize spline --- */
        if (type === 'dblclick') {
            if (activeTool === 'spline' && roadDrawState && roadDrawState.points.length >= 2) {
                finalizeRoad(roadDrawState.points);
            }
        }
    }, [activeTool, layout, roadDrawState, finalizeRoad]);

    /* ===== HELPERS ===== */
    const deleteItem = (id) => {
        dispatch({ type: 'UPDATE', layout: layout.filter(i => i.id !== id) });
        dirty.current = true;
        if (selectedId === id) setSelectedId(null);
    };

    const updateItemProp = (id, key, value) => {
        const updated = layout.map(i => i.id === id ? { ...i, [key]: value } : i);
        dispatch({ type: 'UPDATE', layout: updated });
        dirty.current = true;
    };

    /* ===== LOADING ===== */
    if (loading) {
        return (
            <div className="map-editor">
                <div className="me-empty" style={{ flex: 1 }}>
                    <span className="icon">⏳</span>
                    <p>Loading map data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="map-editor">
            {/* TOP BAR */}
            <div className="me-topbar">
                <button className="me-btn" onClick={onBack}>← Back</button>
                <span className="me-divider" />
                <span className="me-brand">3D Map Builder</span>
                <span className="me-version">v5.0 PRO</span>
                <span className="me-divider" />

                {townSlug && <span style={{ fontSize: 12, color: '#888' }}>📍 {townSlug}</span>}
                <span className="me-spacer" />

                <button className={`me-btn ${gridSnap ? 'primary' : ''}`} onClick={() => setGridSnap(!gridSnap)}>
                    {gridSnap ? '🧲 Snap ON' : '🧲 Snap OFF'}
                </button>
                <select value={gridSize} onChange={e => setGridSize(+e.target.value)} style={{ width: 60 }}>
                    <option value={1}>1u</option>
                    <option value={2}>2u</option>
                    <option value={4}>4u</option>
                </select>

                <span className="me-divider" />

                <button className="me-btn" onClick={() => dispatch({ type: 'UNDO' })} disabled={state.past.length === 0} title="Ctrl+Z">↩ Undo</button>
                <button className="me-btn" onClick={() => dispatch({ type: 'REDO' })} disabled={state.future.length === 0} title="Ctrl+Y">↪ Redo</button>

                <span className="me-divider" />

                <button className="me-btn primary" onClick={save} disabled={saving} title="Ctrl+S">
                    {saving ? '⏳ Saving...' : '💾 Save'}
                </button>
                <button className={`me-btn ${autosave ? 'primary' : ''}`} onClick={() => setAutosave(!autosave)} style={{ fontSize: 11 }}>
                    {autosave ? '⚡ Auto ON' : '⚡ Auto OFF'}
                </button>

                {msg && <span className={`me-msg ${msg.type}`}>{msg.text}</span>}

                {/* Drawing status */}
                {roadDrawState && (
                    <span style={{ fontSize: 11, color: '#a78bfa', marginLeft: 8 }}>
                        📐 Drawing: {roadDrawState.points.length} pts
                    </span>
                )}
            </div>

            {/* WORKSPACE */}
            <div className="me-workspace">
                <Toolbar activeTool={activeTool} onToolChange={(t) => { setActiveTool(t); setRoadDrawState(null); }} />

                <Canvas3D
                    layout={layout}
                    activeTool={activeTool}
                    selectedId={selectedId}
                    onPointerAction={handlePointerAction}
                    cursorRef={cursorRef}
                    gridSnap={gridSnap}
                    gridSize={gridSize}
                    roadDrawState={roadDrawState}
                />

                <PropertiesPanel
                    selected={selectedItem}
                    activeTool={activeTool}
                    onUpdate={updateItemProp}
                    onDelete={deleteItem}
                />
            </div>

            {/* STATUS BAR */}
            <StatusBar
                cursorPos={cursorRef.current}
                gridSnap={gridSnap}
                gridSize={gridSize}
                activeTool={activeTool}
                objectCount={layout.length}
                measureLength={measureLength}
            />
        </div>
    );
}

/* =============================================
   UTILITIES
   ============================================= */
function generateId() {
    return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function findObjectAt(layout, x, z) {
    // Check roads first (by testing proximity to curve points)
    for (let i = layout.length - 1; i >= 0; i--) {
        const item = layout[i];

        if (item.type === 'road' && item.curvePoints && item.curvePoints.length >= 2) {
            // Point-to-segment proximity test
            const hw = (item.width || 4) / 2 + 1;
            for (const pt of item.curvePoints) {
                const dx = x - pt.x;
                const dz = z - pt.z;
                if (Math.sqrt(dx * dx + dz * dz) < hw) return item;
            }
            continue;
        }

        // Bounding box for non-curve objects
        const w = (item.width || 2) / 2;
        const d = (item.depth || 2) / 2;
        if (x >= item.x - w && x <= item.x + w && z >= item.z - d && z <= item.z + d) {
            return item;
        }
    }
    return null;
}
