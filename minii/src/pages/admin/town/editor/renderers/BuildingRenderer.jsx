import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

/* =============================================
   BUILDING TEMPLATES — visual config per type
   ============================================= */
const BUILDING_CONFIGS = {
    house: {
        floors: 1, roofType: 'pitched', baseColor: '#d97706', roofColor: '#7c2d12',
        windowRows: 1, windowCols: 2, doorWidth: 0.8
    },
    apartment: {
        floors: 4, roofType: 'flat', baseColor: '#6366f1', roofColor: '#4338ca',
        windowRows: 4, windowCols: 3, doorWidth: 1
    },
    office: {
        floors: 6, roofType: 'flat', baseColor: '#0ea5e9', roofColor: '#0284c7',
        windowRows: 6, windowCols: 4, doorWidth: 1.2
    },
    school: {
        floors: 2, roofType: 'flat', baseColor: '#f59e0b', roofColor: '#d97706',
        windowRows: 2, windowCols: 5, doorWidth: 1.5
    },
    hospital: {
        floors: 3, roofType: 'flat', baseColor: '#ef4444', roofColor: '#dc2626',
        windowRows: 3, windowCols: 4, doorWidth: 1.5
    },
    mall: {
        floors: 2, roofType: 'flat', baseColor: '#8b5cf6', roofColor: '#7c3aed',
        windowRows: 1, windowCols: 6, doorWidth: 2
    },
    shop: {
        floors: 1, roofType: 'flat', baseColor: '#10b981', roofColor: '#059669',
        windowRows: 1, windowCols: 2, doorWidth: 1.2
    },
    warehouse: {
        floors: 1, roofType: 'barrel', baseColor: '#6b7280', roofColor: '#4b5563',
        windowRows: 0, windowCols: 0, doorWidth: 2
    },
};

function darken(hex, amount) {
    try {
        let c = new THREE.Color(hex);
        c.multiplyScalar(1 - amount);
        return '#' + c.getHexString();
    } catch { return hex; }
}

function lighten(hex, amount) {
    try {
        let c = new THREE.Color(hex);
        c.lerp(new THREE.Color('#ffffff'), amount);
        return '#' + c.getHexString();
    } catch { return hex; }
}

/* =============================================
   BUILDING MESH — Architectural 3D rendering
   ============================================= */
const BuildingMesh = React.memo(({ item, isSelected }) => {
    const {
        x, z, width, depth, height, color, rotation,
        buildingTemplate, hashtag
    } = item;

    const template = buildingTemplate || 'house';
    const config = BUILDING_CONFIGS[template] || BUILDING_CONFIGS.house;

    const w = width || 4;
    const d = depth || 4;
    const h = height || (config.floors * 3);
    const baseColor = color || config.baseColor;
    const roofColor = config.roofColor;
    const rot = (rotation || 0) * Math.PI / 180;

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>

            {/* ===== MAIN BODY ===== */}
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={baseColor} roughness={0.7} />
            </mesh>

            {/* ===== ROOF ===== */}
            {config.roofType === 'pitched' && (
                <mesh position={[0, h + 0.8, 0]} castShadow>
                    <coneGeometry args={[Math.max(w, d) * 0.72, 1.6, 4]} />
                    <meshStandardMaterial color={roofColor} roughness={0.8} />
                </mesh>
            )}
            {config.roofType === 'flat' && (
                <mesh position={[0, h + 0.06, 0]}>
                    <boxGeometry args={[w + 0.15, 0.12, d + 0.15]} />
                    <meshStandardMaterial color={darken(baseColor, 0.25)} roughness={0.9} />
                </mesh>
            )}
            {config.roofType === 'barrel' && (
                <mesh position={[0, h + 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[d / 2, d / 2, w, 12, 1, false, 0, Math.PI]} />
                    <meshStandardMaterial color={roofColor} roughness={0.6} side={THREE.DoubleSide} />
                </mesh>
            )}

            {/* ===== WINDOWS ===== */}
            {config.windowRows > 0 && config.windowCols > 0 && (
                <WindowGrid
                    w={w} h={h} d={d}
                    rows={config.windowRows}
                    cols={config.windowCols}
                    baseColor={baseColor}
                />
            )}

            {/* ===== DOOR ===== */}
            <mesh position={[0, 0.6, d / 2 + 0.01]}>
                <planeGeometry args={[config.doorWidth, 1.2]} />
                <meshStandardMaterial color={darken(baseColor, 0.4)} side={THREE.DoubleSide} />
            </mesh>

            {/* ===== SELECTION GLOW ===== */}
            {isSelected && (
                <mesh position={[0, h / 2, 0]}>
                    <boxGeometry args={[w + 0.4, h + 0.4, d + 0.4]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.6} />
                </mesh>
            )}

            {/* ===== HASHTAG LABEL ===== */}
            {hashtag?.enabled && hashtag?.text && (
                <Html
                    position={[0, h + (hashtag.heightOffset || 2), 0]}
                    center
                    distanceFactor={15}
                    occlude={hashtag.occlusionTest ? 'blending' : false}
                    style={{ pointerEvents: 'none' }}
                >
                    <div style={{
                        background: 'rgba(10,10,20,0.85)',
                        color: hashtag.color || '#fff',
                        padding: '5px 12px',
                        borderRadius: 10,
                        fontSize: `${13 * (hashtag.size || 1)}px`,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        border: `1.5px solid ${hashtag.color || '#fff'}44`,
                        backdropFilter: 'blur(6px)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        boxShadow: `0 0 12px ${hashtag.color || '#fff'}33`,
                        letterSpacing: '0.03em',
                    }}>
                        {hashtag.icon && <span style={{ marginRight: 5, fontSize: '1.1em' }}>{hashtag.icon}</span>}
                        #{hashtag.text}
                    </div>
                </Html>
            )}
        </group>
    );
});

/* =============================================
   WINDOW GRID — procedural windows on 2 faces
   ============================================= */
function WindowGrid({ w, h, d, rows, cols, baseColor }) {
    const windows = useMemo(() => {
        const result = [];
        const winW = 0.5;
        const winH = 0.6;
        const winColor = lighten(baseColor, 0.5);

        // Front face (z+) and back face (z-)
        for (let face = 0; face < 2; face++) {
            const fz = face === 0 ? d / 2 + 0.02 : -(d / 2 + 0.02);
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const wx = (col - (cols - 1) / 2) * (w / (cols + 0.5));
                    const wy = h - (row + 0.7) * (h / (rows + 0.3));
                    result.push({ key: `${face}-${row}-${col}`, pos: [wx, wy, fz], color: winColor });
                }
            }
        }

        // Side faces (x+, x-)
        const sideCols = Math.max(1, Math.floor(cols * (d / w)));
        for (let face = 0; face < 2; face++) {
            const fx = face === 0 ? w / 2 + 0.02 : -(w / 2 + 0.02);
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < sideCols; col++) {
                    const wz = (col - (sideCols - 1) / 2) * (d / (sideCols + 0.5));
                    const wy = h - (row + 0.7) * (h / (rows + 0.3));
                    result.push({
                        key: `s${face}-${row}-${col}`,
                        pos: [fx, wy, wz],
                        rotY: Math.PI / 2,
                        color: winColor
                    });
                }
            }
        }

        return result;
    }, [w, h, d, rows, cols, baseColor]);

    return (
        <group>
            {windows.map(win => (
                <mesh key={win.key} position={win.pos} rotation={[0, win.rotY || 0, 0]}>
                    <planeGeometry args={[0.5, 0.6]} />
                    <meshStandardMaterial
                        color={win.color}
                        emissive={win.color}
                        emissiveIntensity={0.15}
                        side={THREE.DoubleSide}
                        transparent
                        opacity={0.7}
                    />
                </mesh>
            ))}
        </group>
    );
}

export { BuildingMesh, BUILDING_CONFIGS };
