import React from 'react';

const TOOLS = [
    {
        cat: 'Navigation', items: [
            { id: 'select', icon: '👆', label: 'Select / Move', key: 'V' },
        ]
    },
    {
        cat: 'Roads', items: [
            { id: 'road', icon: '🛣️', label: 'Straight Road', key: 'R' },
            { id: 'bezier', icon: '〰️', label: 'Bezier Curve', key: 'B' },
            { id: 'spline', icon: '🔀', label: 'Spline Path', key: 'P' },
            { id: 'line', icon: '📏', label: 'Quick Line', key: 'L' },
        ]
    },
    {
        cat: 'Structures', items: [
            { id: 'building', icon: '🏢', label: 'Building', key: 'E' },
            { id: 'park', icon: '🌳', label: 'Park / Green', key: 'G' },
            { id: 'water', icon: '💧', label: 'Water / River', key: 'W' },
        ]
    },
    {
        cat: 'Infrastructure', items: [
            { id: 'bridge', icon: '🌉', label: 'Bridge', key: '' },
            { id: 'tunnel', icon: '🕳️', label: 'Tunnel', key: '' },
            { id: 'light', icon: '💡', label: 'Street Light', key: '' },
            { id: 'signal', icon: '🚦', label: 'Traffic Signal', key: '' },
            { id: 'busstop', icon: '🚏', label: 'Bus Stop', key: '' },
            { id: 'parking', icon: '🅿️', label: 'Parking', key: '' },
        ]
    },
    {
        cat: 'Overlays', items: [
            { id: 'event', icon: '⚠️', label: 'Event / Status', key: 'S' },
            { id: 'label', icon: '#️⃣', label: 'Hashtag Label', key: 'H' },
        ]
    },
    {
        cat: 'Modify', items: [
            { id: 'eraser', icon: '❌', label: 'Eraser', key: 'X', danger: true },
        ]
    },
];

export default function Toolbar({ activeTool, onToolChange }) {
    return (
        <div className="me-toolbar">
            {TOOLS.map(cat => (
                <React.Fragment key={cat.cat}>
                    <div className="me-tool-cat">{cat.cat}</div>
                    {cat.items.map(t => (
                        <button
                            key={t.id}
                            className={`me-tool-btn ${activeTool === t.id ? 'active' : ''} ${t.danger ? 'danger' : ''}`}
                            onClick={() => onToolChange(t.id)}
                            title={t.key ? `Shortcut: ${t.key}` : ''}
                        >
                            <span className="icon">{t.icon}</span>
                            {t.label}
                            {t.key && <span className="shortcut">{t.key}</span>}
                        </button>
                    ))}
                </React.Fragment>
            ))}
        </div>
    );
}

// Export keybind map for parent to use
export const TOOL_KEYS = {};
TOOLS.forEach(cat => cat.items.forEach(t => {
    if (t.key) TOOL_KEYS[t.key.toLowerCase()] = t.id;
}));
