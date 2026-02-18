import React from 'react';

const BUILDING_TEMPLATES = [
    { value: 'house', label: '🏠 House', color: '#f59e0b', height: 4 },
    { value: 'apartment', label: '🏬 Apartment', color: '#8b5cf6', height: 16 },
    { value: 'school', label: '🏫 School', color: '#eab308', height: 6 },
    { value: 'hospital', label: '🏥 Hospital', color: '#ef4444', height: 8 },
    { value: 'office', label: '🏢 Office', color: '#3b82f6', height: 12 },
    { value: 'mall', label: '🏬 Mall', color: '#a855f7', height: 10 },
    { value: 'shop', label: '🛒 Shop', color: '#4285F4', height: 5 },
    { value: 'warehouse', label: '📦 Warehouse', color: '#6b7280', height: 6 },
    { value: 'station', label: '🚉 Station', color: '#6b7280', height: 5 },
    { value: 'petrol', label: '⛽ Petrol', color: '#a855f7', height: 4 },
    { value: 'other', label: '📍 Other', color: '#cccccc', height: 4 },
];

const EVENT_TYPES = [
    { value: 'none', label: '✅ Normal', cls: '' },
    { value: 'traffic', label: '🟡 Traffic', cls: 'traffic' },
    { value: 'emergency', label: '🔴 Emergency', cls: 'emergency' },
    { value: 'accident', label: '🚨 Accident', cls: 'accident' },
    { value: 'closed', label: '⬛ Closed', cls: 'closed' },
];

function Toggle({ checked, onChange }) {
    return (
        <label className="me-toggle">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="slider"></span>
        </label>
    );
}

export default function PropertiesPanel({ selected, activeTool, onUpdate, onDelete }) {
    // If nothing selected, show default tool settings
    const item = selected;

    if (!item && activeTool === 'select') {
        return (
            <div className="me-props">
                <div className="me-props-title">Properties</div>
                <div className="me-empty" style={{ height: 'auto', padding: 40 }}>
                    <span className="icon" style={{ fontSize: 32 }}>👆</span>
                    <p style={{ fontSize: 12, textAlign: 'center' }}>Click an object to select it and edit its properties</p>
                </div>
            </div>
        );
    }

    // Tool defaults (shown when no item is selected but a tool is active)
    if (!item) {
        return (
            <div className="me-props">
                <div className="me-props-title">Tool Settings</div>
                <ToolDefaults activeTool={activeTool} />
            </div>
        );
    }

    const isRoad = item.type === 'road';
    const isBuilding = item.type === 'building';

    const set = (key, val) => onUpdate(item.id, key, val);
    const setNested = (parent, key, val) => {
        const updated = { ...(item[parent] || {}), [key]: val };
        onUpdate(item.id, parent, updated);
    };

    return (
        <div className="me-props">
            <div className="me-props-title">
                {isRoad ? '🛣️ Road Properties' : isBuilding ? '🏢 Building Properties' : '📦 Object Properties'}
            </div>

            {/* Name */}
            <div className="me-prop-group">
                <label>Name / Label</label>
                <input type="text" value={item.name || ''} onChange={e => set('name', e.target.value)} placeholder="E.g. Main Street" />
            </div>

            {/* Active Toggle */}
            <div className="me-toggle-row">
                <span>Active (visible to visitors)</span>
                <Toggle checked={item.active !== false} onChange={v => set('active', v)} />
            </div>

            {/* === ROAD === */}
            {isRoad && (
                <>
                    <div className="me-prop-group">
                        <label>Road Mode</label>
                        <select value={item.roadMode || 'straight'} onChange={e => set('roadMode', e.target.value)}>
                            <option value="straight">Straight</option>
                            <option value="bezier">Bezier Curve</option>
                            <option value="spline">Spline Path</option>
                        </select>
                    </div>
                    <div className="me-prop-row">
                        <div className="me-prop-group">
                            <label>Width</label>
                            <input type="number" min="1" max="12" value={item.width || 2} onChange={e => set('width', +e.target.value)} />
                        </div>
                        <div className="me-prop-group">
                            <label>Lanes</label>
                            <input type="number" min="1" max="6" value={item.lanes || 2} onChange={e => set('lanes', +e.target.value)} />
                        </div>
                    </div>
                    <div className="me-toggle-row">
                        <span>One Way</span>
                        <Toggle checked={!!item.oneWay} onChange={v => set('oneWay', v)} />
                    </div>
                    <div className="me-toggle-row">
                        <span>Sidewalk</span>
                        <Toggle checked={!!item.sidewalk} onChange={v => set('sidewalk', v)} />
                    </div>
                    <div className="me-toggle-row">
                        <span>Divider</span>
                        <Toggle checked={!!item.divider} onChange={v => set('divider', v)} />
                    </div>

                    {/* Event Status */}
                    <div className="me-prop-group" style={{ marginTop: 12 }}>
                        <label>Road Status</label>
                        <div className="me-event-btns">
                            {EVENT_TYPES.map(ev => (
                                <button
                                    key={ev.value}
                                    className={`me-event-btn ${ev.cls} ${(item.eventStatus?.type || 'none') === ev.value ? 'active' : ''}`}
                                    onClick={() => set('eventStatus', { ...(item.eventStatus || {}), type: ev.value, active: ev.value !== 'none' })}
                                >
                                    {ev.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Road Color */}
                    <div className="me-prop-group">
                        <label>Color</label>
                        <div className="me-prop-row">
                            <input type="color" value={item.color || '#555555'} onChange={e => set('color', e.target.value)} />
                            <span style={{ fontSize: 11, color: '#888' }}>{(item.color || '#555555').toUpperCase()}</span>
                        </div>
                    </div>
                </>
            )}

            {/* === BUILDING === */}
            {isBuilding && (
                <>
                    <div className="me-prop-group">
                        <label>Template</label>
                        <select value={item.buildingTemplate || item.subType || 'house'} onChange={e => {
                            const tpl = BUILDING_TEMPLATES.find(t => t.value === e.target.value);
                            if (tpl) {
                                onUpdate(item.id, 'buildingTemplate', tpl.value);
                                onUpdate(item.id, 'subType', tpl.value);
                                onUpdate(item.id, 'color', tpl.color);
                                onUpdate(item.id, 'height', tpl.height);
                            }
                        }}>
                            {BUILDING_TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="me-prop-group">
                        <label>Height: {item.height || 4}</label>
                        <input type="range" min="1" max="50" value={item.height || 4} onChange={e => set('height', +e.target.value)} />
                    </div>
                    <div className="me-prop-row">
                        <div className="me-prop-group">
                            <label>Width</label>
                            <input type="number" min="2" max="20" value={item.width || 4} onChange={e => set('width', +e.target.value)} />
                        </div>
                        <div className="me-prop-group">
                            <label>Depth</label>
                            <input type="number" min="2" max="20" value={item.depth || 4} onChange={e => set('depth', +e.target.value)} />
                        </div>
                    </div>
                    <div className="me-prop-group">
                        <label>Color</label>
                        <div className="me-prop-row">
                            <input type="color" value={item.color || '#f59e0b'} onChange={e => set('color', e.target.value)} />
                            <span style={{ fontSize: 11, color: '#888' }}>{(item.color || '#f59e0b').toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="me-prop-group">
                        <label>Description</label>
                        <textarea rows="3" value={item.description || ''} onChange={e => set('description', e.target.value)} placeholder="Building description..." />
                    </div>

                    {/* Hashtag */}
                    <div className="me-hashtag-section">
                        <div className="me-props-title" style={{ marginBottom: 8, paddingBottom: 4, borderBottom: 'none' }}>
                            #️⃣ Hashtag Label
                        </div>
                        <div className="me-toggle-row">
                            <span>Show Hashtag</span>
                            <Toggle checked={!!item.hashtag?.enabled} onChange={v => setNested('hashtag', 'enabled', v)} />
                        </div>
                        {item.hashtag?.enabled && (
                            <>
                                <div className="me-prop-group">
                                    <label>Text</label>
                                    <input type="text" value={item.hashtag?.text || ''} onChange={e => {
                                        let t = e.target.value;
                                        if (t && !t.startsWith('#')) t = '#' + t;
                                        setNested('hashtag', 'text', t);
                                    }} placeholder="#GrandMall" />
                                </div>
                                <div className="me-prop-group">
                                    <label>Icon</label>
                                    <input type="text" value={item.hashtag?.icon || ''} onChange={e => setNested('hashtag', 'icon', e.target.value)} placeholder="🏪" />
                                </div>
                                <div className="me-prop-row">
                                    <div className="me-prop-group">
                                        <label>Color</label>
                                        <input type="color" value={item.hashtag?.color || '#ffffff'} onChange={e => setNested('hashtag', 'color', e.target.value)} />
                                    </div>
                                    <div className="me-prop-group">
                                        <label>Size</label>
                                        <input type="number" min="0.5" max="5" step="0.5" value={item.hashtag?.size || 1} onChange={e => setNested('hashtag', 'size', +e.target.value)} />
                                    </div>
                                </div>
                                <div className="me-prop-group">
                                    <label>Height Above: {item.hashtag?.heightOffset || 2}</label>
                                    <input type="range" min="0" max="20" step="0.5" value={item.hashtag?.heightOffset || 2} onChange={e => setNested('hashtag', 'heightOffset', +e.target.value)} />
                                </div>
                                <div className="me-toggle-row">
                                    <span>Always Visible</span>
                                    <Toggle checked={item.hashtag?.alwaysVisible !== false} onChange={v => setNested('hashtag', 'alwaysVisible', v)} />
                                </div>
                                <div className="me-toggle-row">
                                    <span>Depth Test (hide behind)</span>
                                    <Toggle checked={!!item.hashtag?.occlusionTest} onChange={v => setNested('hashtag', 'occlusionTest', v)} />
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Generic non-road/building */}
            {!isRoad && !isBuilding && (
                <>
                    <div className="me-prop-group">
                        <label>Color</label>
                        <div className="me-prop-row">
                            <input type="color" value={item.color || '#10b981'} onChange={e => set('color', e.target.value)} />
                            <span style={{ fontSize: 11, color: '#888' }}>{(item.color || '#10b981').toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="me-prop-row">
                        <div className="me-prop-group">
                            <label>Width</label>
                            <input type="number" min="1" max="50" value={item.width || 4} onChange={e => set('width', +e.target.value)} />
                        </div>
                        <div className="me-prop-group">
                            <label>Depth</label>
                            <input type="number" min="1" max="50" value={item.depth || 4} onChange={e => set('depth', +e.target.value)} />
                        </div>
                    </div>
                    <div className="me-prop-group">
                        <label>Height: {item.height || 0.2}</label>
                        <input type="range" min="0.1" max="20" step="0.1" value={item.height || 0.2} onChange={e => set('height', +e.target.value)} />
                    </div>
                </>
            )}

            {/* Rotation (all types) */}
            <div className="me-prop-group" style={{ marginTop: 12 }}>
                <label>Rotation: {item.rotation || 0}°</label>
                <input type="range" min="0" max="360" step="15" value={item.rotation || 0} onChange={e => set('rotation', +e.target.value)} />
            </div>

            {/* Delete Button */}
            <button
                onClick={() => onDelete(item.id)}
                style={{ marginTop: 'auto', padding: '10px', background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
            >
                🗑 Delete Object
            </button>
        </div>
    );
}

function ToolDefaults({ activeTool }) {
    const tips = {
        road: '🛣️ Click two points to draw a straight road.',
        bezier: '〰️ Click start → click end → drag handles to curve.',
        spline: '🔀 Click multiple points to create a smooth path. Double-click to finish.',
        line: '📏 Click start, click end — fills with road blocks.',
        building: '🏢 Click to place a building. Edit properties on the right.',
        park: '🌳 Click to place a park area.',
        water: '💧 Click to place a water area.',
        bridge: '🌉 Click two road endpoints to create a bridge.',
        tunnel: '🕳️ Click to mark a tunnel entrance.',
        light: '💡 Click along roads to place street lights.',
        signal: '🚦 Click intersections to place signals.',
        busstop: '🚏 Click to place bus stop.',
        parking: '🅿️ Click to place parking area.',
        event: '⚠️ Click a road to set its event status.',
        label: '#️⃣ Click a building to add a hashtag label.',
        eraser: '❌ Click objects to delete them.',
    };
    return (
        <div style={{ padding: 16, color: '#888', fontSize: 12, lineHeight: 1.8 }}>
            <p>{tips[activeTool] || 'Select a tool to start.'}</p>
            <div style={{ marginTop: 20, fontSize: 10, color: '#555' }}>
                <div><b>Left Click</b> — Select / Place</div>
                <div><b>Right Drag</b> — Rotate Camera</div>
                <div><b>Middle Drag</b> — Pan Camera</div>
                <div><b>Scroll</b> — Zoom</div>
                <div><b>Delete</b> — Remove selected</div>
                <div><b>Ctrl+Z</b> — Undo</div>
                <div><b>Ctrl+Y</b> — Redo</div>
                <div><b>Ctrl+S</b> — Save</div>
            </div>
        </div>
    );
}

export { BUILDING_TEMPLATES };
