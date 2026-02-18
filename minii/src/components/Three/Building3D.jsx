import React, { useMemo, useState } from 'react';
import { Shape, ExtrudeGeometry } from 'three';
import BuildingLabel from './BuildingLabel';

/**
 * Single 3D building component
 * @param {Object} props
 * @param {Array<{x: number, z: number}>} props.coords - Building footprint coordinates in meters
 * @param {number} props.height - Building height in meters
 * @param {string} props.customName - Admin-set custom name (hashtag)
 * @param {string} props.type - Building type (shop, restaurant, etc.)
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.isSelected - Whether building is selected
 */
export default function Building3D({ coords, height = 10, customName, type, onClick, isSelected }) {
    const [hovered, setHovered] = useState(false);

    // Create extruded geometry from polygon
    const geometry = useMemo(() => {
        if (!coords || coords.length < 3) return null;

        const shape = new Shape();
        shape.moveTo(coords[0].x, coords[0].z);

        for (let i = 1; i < coords.length; i++) {
            shape.lineTo(coords[i].x, coords[i].z);
        }

        shape.closePath();

        return new ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false
        });
    }, [coords, height]);

    // Calculate centroid for label position
    const centroid = useMemo(() => {
        if (!coords || coords.length === 0) return [0, 0, 0];

        const sum = coords.reduce((acc, coord) => ({
            x: acc.x + coord.x,
            z: acc.z + coord.z
        }), { x: 0, z: 0 });

        return [
            sum.x / coords.length,
            height + 2, // Float above building
            sum.z / coords.length
        ];
    }, [coords, height]);

    // Color based on type (Google Maps style - subtle/pastel)
    const getColor = () => {
        const colors = {
            shop: '#dbeafe', // Pale Blue
            restaurant: '#ffedd5', // Pale Orange
            hospital: '#fee2e2', // Pale Red
            gov: '#e0e7ff', // Pale Indigo
            school: '#f3e8ff', // Pale Purple
            hotel: '#fef3c7', // Pale Yellow
            transport: '#d1fae5', // Pale Green
            other: '#f1f5f9' // Light Gray (Concrete)
        };
        return colors[type] || colors.other;
    };

    const baseColor = getColor();
    const emissiveColor = isSelected ? '#3b82f6' : '#000000'; // Only glow if selected
    const emissiveIntensity = isSelected ? 0.4 : 0;

    if (!geometry) return null;

    return (
        <group>
            <mesh
                geometry={geometry}
                rotation={[-Math.PI / 2, 0, 0]} // Rotate to stand upright
                castShadow
                receiveShadow
                onClick={(e) => {
                    e.stopPropagation();
                    onClick && onClick();
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'default';
                }}
            >
                <meshStandardMaterial
                    color={hovered ? '#cbd5e1' : baseColor} // Darker gray on hover
                    emissive={emissiveColor}
                    emissiveIntensity={emissiveIntensity}
                    roughness={0.2} // Smooth (like glass/finished concrete)
                    metalness={0.1}
                />
            </mesh>


            {customName && (
                <BuildingLabel
                    text={customName.startsWith('#') ? customName : `#${customName}`}
                    position={centroid}
                    color={baseColor}
                />
            )}
        </group>
    );
}
