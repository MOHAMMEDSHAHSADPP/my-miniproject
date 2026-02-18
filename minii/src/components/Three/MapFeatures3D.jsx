import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';

/**
 * Road3D - Renders a road with Google Maps styling (Outline + Fill) + Bridges
 */
export function Road3D({ coords, type = 'primary', isBridge = false }) {
    if (!coords || coords.length < 2) return null;

    // 3-Tier Road Color System
    const isHighway = ['motorway', 'trunk', 'primary'].includes(type);
    const isSecondary = ['secondary', 'tertiary'].includes(type);
    const isLocal = ['residential', 'service', 'unclassified'].includes(type);

    // Colors - 3 distinct levels
    let fillColor, outlineColor, fillWidth;

    if (isHighway) {
        fillColor = '#Fbd98e';  // Orange for highways
        outlineColor = isBridge ? '#888888' : '#d3a54d';
        fillWidth = 12;
    } else if (isSecondary) {
        fillColor = '#fef08a';  // Yellow for secondary roads
        outlineColor = isBridge ? '#888888' : '#d4af37';
        fillWidth = 9;
    } else {
        fillColor = '#ffffff';  // White for local roads
        outlineColor = isBridge ? '#888888' : '#cccccc';
        fillWidth = 6;
    }

    const outlineWidth = fillWidth + 3;

    // Elevation - Bridges are higher
    const elevation = isBridge ? 5 : 0.2;
    const outlineElevation = elevation - 0.05;

    // Convert coords to 3D points
    const points = coords.map(({ x, z }) => [x, elevation, z]);
    const outlinePoints = coords.map(({ x, z }) => [x, outlineElevation, z]);

    // Generate Pillars for bridge
    const pillars = useMemo(() => {
        if (!isBridge) return null;
        // Place pillars every ~50 meters or at points
        return coords.filter((_, i) => i % 2 === 0).map((coord, i) => (
            <mesh key={`pillar-${i}`} position={[coord.x, elevation / 2, coord.z]}>
                <cylinderGeometry args={[1, 1, elevation, 8]} />
                <meshStandardMaterial color="#888888" />
            </mesh>
        ));
    }, [coords, isBridge, elevation]);

    return (
        <group>
            {/* Road Outline (Bottom Layer) */}
            <Line
                points={outlinePoints}
                color={outlineColor}
                lineWidth={outlineWidth}
            />
            {/* Road Fill (Top Layer) */}
            <Line
                points={points}
                color={fillColor}
                lineWidth={fillWidth}
            />
            {/* Bridge Pillars */}
            {pillars}
        </group>
    );
}

/**
 * Water3D - Google Maps Blue
 */
export function Water3D({ coords, type = 'river' }) {
    if (!coords || coords.length < 3) return null;

    const shape = new THREE.Shape();
    coords.forEach((coord, i) => {
        if (i === 0) {
            shape.moveTo(coord.x, coord.z);
        } else {
            shape.lineTo(coord.x, coord.z);
        }
    });

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial
                color="#aadaff" // Google Maps Water Blue
                transparent
                opacity={0.8}
                roughness={0.2}
                metalness={0.1}
            />
        </mesh>
    );
}

/**
 * Park3D - Google Maps Green
 */
export function Park3D({ coords }) {
    if (!coords || coords.length < 3) return null;

    const shape = new THREE.Shape();
    coords.forEach((coord, i) => {
        if (i === 0) {
            shape.moveTo(coord.x, coord.z);
        } else {
            shape.lineTo(coord.x, coord.z);
        }
    });

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <shapeGeometry args={[shape]} />
            <meshStandardMaterial
                color="#cbe6a3" // Google Maps Park Green
                roughness={0.9}
            />
        </mesh>
    );
}

/**
 * Railway3D - Renders train tracks
 */
export function Railway3D({ coords }) {
    if (!coords || coords.length < 2) return null;

    const points = coords.map(({ x, z }) => [x, 0.25, z]); // Slightly higher than roads?

    return (
        <group>
            {/* Main Track Line */}
            <Line
                points={points}
                color="#555555"
                lineWidth={4}
                dashed={true}
                dashScale={2}
                gapSize={1}
            />
            {/* Simple visual representation for now */}
        </group>
    );
}

/**
 * MapLabel3D - Floating text label
 */
export function MapLabel3D({ position, text, type = 'default' }) {
    if (!position || !text) return null;

    const bgColor = type === 'station' ? '#ffffff' : (type === 'bridge' ? '#eeeeee' : 'rgba(255,255,255,0.8)');
    const textColor = '#000000';
    const border = type === 'station' ? '2px solid #4285F4' : '1px solid #999';

    return (
        <Html position={[position.x, 15, position.z]} center distanceFactor={400} zIndexRange={[100, 0]}>
            <div style={{
                background: bgColor,
                color: textColor,
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: border,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
                {text}
            </div>
        </Html>
    );
}

/**
 * BusStation3D - Enhanced Shelter Model
 */
export function BusStation3D({ coords, name }) {
    if (!coords) return null;

    return (
        <group position={[coords.x, 0, coords.z]}>
            {/* Shelter Roof */}
            <mesh position={[0, 4, 0]}>
                <boxGeometry args={[8, 0.5, 5]} />
                <meshStandardMaterial color="#4285F4" /> {/* Google Blue */}
            </mesh>

            {/* Glass Panels (Back) */}
            <mesh position={[0, 2, -2]}>
                <boxGeometry args={[7.5, 3.5, 0.2]} />
                <meshStandardMaterial color="#aadaff" transparent opacity={0.3} />
            </mesh>

            {/* Pillars */}
            <mesh position={[-3.5, 2, 2]}>
                <cylinderGeometry args={[0.2, 0.2, 4]} />
                <meshStandardMaterial color="#999999" />
            </mesh>
            <mesh position={[3.5, 2, 2]}>
                <cylinderGeometry args={[0.2, 0.2, 4]} />
                <meshStandardMaterial color="#999999" />
            </mesh>

            {/* Bench */}
            <mesh position={[0, 0.8, -1]}>
                <boxGeometry args={[6, 0.2, 1]} />
                <meshStandardMaterial color="#bf8040" />
            </mesh>

            {/* Bus Sign Pole */}
            <group position={[5, 0, 0]}>
                <mesh position={[0, 1.5, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 3]} />
                    <meshStandardMaterial color="#333333" />
                </mesh>
                <mesh position={[0, 3, 0]}>
                    <boxGeometry args={[0.6, 0.6, 0.05]} />
                    <meshStandardMaterial color="#4285F4" />
                </mesh>
                {/* Icon placeholder (white box) */}
                <mesh position={[0, 3, 0.03]}>
                    <boxGeometry args={[0.4, 0.3, 0.01]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            </group>

            {/* Label */}
            {name && (
                <MapLabel3D position={{ x: 0, z: 0 }} text={name} type="station" />
            )}
        </group>
    );
}
