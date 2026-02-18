import React from 'react';
import { Html } from '@react-three/drei';

/**
 * Floating hashtag label component
 * @param {Object} props
 * @param {string} props.text - Label text (e.g., "#GrandMall")
 * @param {[number, number, number]} props.position - 3D position
 * @param {string} props.color - Label color
 */
export default function BuildingLabel({ text, position, color = "#00ff00" }) {
    if (!text) return null;

    return (
        <Html
            position={position}
            center
            distanceFactor={15}
            style={{
                pointerEvents: 'none',
                userSelect: 'none'
            }}
        >
            <div
                style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: color,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    border: `1px solid ${color}`,
                    boxShadow: `0 0 10px ${color}`,
                    fontFamily: 'monospace'
                }}
            >
                {text}
            </div>
        </Html>
    );
}
