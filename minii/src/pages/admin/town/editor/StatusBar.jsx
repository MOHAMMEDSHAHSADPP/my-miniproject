import React from 'react';

export default function StatusBar({ cursorPos, gridSnap, gridSize, activeTool, objectCount, measureLength }) {
    return (
        <div className="me-statusbar">
            <span className="coord">
                X: {cursorPos ? cursorPos[0].toFixed(0) : '—'} &nbsp;
                Z: {cursorPos ? cursorPos[2].toFixed(0) : '—'}
            </span>

            <span className={gridSnap ? 'snap' : ''}>
                Grid: {gridSnap ? `${gridSize}u snap` : 'free'}
            </span>

            {measureLength > 0 && (
                <span className="info">📏 {measureLength.toFixed(1)}u</span>
            )}

            <span>Tool: {activeTool}</span>

            <span className="spacer" />

            <span className="count">{objectCount} objects</span>
        </div>
    );
}
