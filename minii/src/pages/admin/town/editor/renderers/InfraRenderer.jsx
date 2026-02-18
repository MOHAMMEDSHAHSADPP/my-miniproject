import React, { useMemo } from 'react';
import * as THREE from 'three';

/* =============================================
   INFRASTRUCTURE RENDERER
   Specialized 3D meshes for non-building, non-road items
   ============================================= */

/* ---- BRIDGE ---- */
function BridgeMesh({ item, isSelected }) {
    const { x, z, width, depth, height, color, rotation, elevation } = item;
    const w = width || 6;
    const d = depth || 12;
    const h = height || 2;
    const elev = elevation || 2;
    const rot = (rotation || 0) * Math.PI / 180;
    const c = color || '#9ca3af';

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            {/* Deck */}
            <mesh position={[0, elev, 0]} castShadow>
                <boxGeometry args={[w, 0.3, d]} />
                <meshStandardMaterial color={c} roughness={0.6} />
            </mesh>
            {/* Railings */}
            <mesh position={[-w / 2 + 0.1, elev + 0.5, 0]}>
                <boxGeometry args={[0.1, 0.7, d]} />
                <meshStandardMaterial color="#6b7280" />
            </mesh>
            <mesh position={[w / 2 - 0.1, elev + 0.5, 0]}>
                <boxGeometry args={[0.1, 0.7, d]} />
                <meshStandardMaterial color="#6b7280" />
            </mesh>
            {/* Support pillars */}
            {[-d / 3, 0, d / 3].map((pz, i) => (
                <mesh key={i} position={[0, elev / 2, pz]}>
                    <cylinderGeometry args={[0.3, 0.4, elev, 8]} />
                    <meshStandardMaterial color="#4b5563" roughness={0.8} />
                </mesh>
            ))}
            {/* Selection */}
            {isSelected && (
                <mesh position={[0, elev, 0]}>
                    <boxGeometry args={[w + 0.4, 1.5, d + 0.4]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

/* ---- TUNNEL ---- */
function TunnelMesh({ item, isSelected }) {
    const { x, z, width, depth, height, color, rotation } = item;
    const w = width || 6;
    const d = depth || 12;
    const h = height || 3;
    const rot = (rotation || 0) * Math.PI / 180;
    const c = color || '#374151';

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            {/* Arch shell */}
            <mesh position={[0, h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[w / 2, w / 2, d, 16, 1, true, 0, Math.PI]} />
                <meshStandardMaterial color={c} side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
            {/* Base walls */}
            <mesh position={[-w / 2, h / 4, 0]}>
                <boxGeometry args={[0.3, h / 2, d]} />
                <meshStandardMaterial color={c} />
            </mesh>
            <mesh position={[w / 2, h / 4, 0]}>
                <boxGeometry args={[0.3, h / 2, d]} />
                <meshStandardMaterial color={c} />
            </mesh>
            {/* Entrance frames */}
            {[-d / 2, d / 2].map((pz, i) => (
                <mesh key={i} position={[0, h / 2, pz]}>
                    <ringGeometry args={[w / 2 - 0.3, w / 2, 16, 1, 0, Math.PI]} />
                    <meshStandardMaterial color="#1f2937" side={THREE.DoubleSide} />
                </mesh>
            ))}
            {isSelected && (
                <mesh position={[0, h / 2, 0]}>
                    <boxGeometry args={[w + 0.5, h + 0.5, d + 0.5]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

/* ---- STREETLIGHT ---- */
function StreetlightMesh({ item, isSelected }) {
    const { x, z, height, color, rotation } = item;
    const h = height || 5;
    const rot = (rotation || 0) * Math.PI / 180;

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            {/* Pole */}
            <mesh position={[0, h / 2, 0]}>
                <cylinderGeometry args={[0.08, 0.12, h, 8]} />
                <meshStandardMaterial color="#374151" metalness={0.6} />
            </mesh>
            {/* Arm */}
            <mesh position={[0.4, h - 0.2, 0]} rotation={[0, 0, Math.PI / 6]}>
                <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
                <meshStandardMaterial color="#374151" metalness={0.6} />
            </mesh>
            {/* Lamp */}
            <mesh position={[0.7, h - 0.1, 0]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial
                    color={color || '#fbbf24'}
                    emissive={color || '#fbbf24'}
                    emissiveIntensity={0.5}
                />
            </mesh>
            {/* Light glow */}
            <pointLight position={[0.7, h - 0.1, 0]} color={color || '#fbbf24'} intensity={0.3} distance={8} />
            {isSelected && (
                <mesh position={[0, h / 2, 0]}>
                    <boxGeometry args={[1.5, h + 0.5, 1.5]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

/* ---- TRAFFIC SIGNAL ---- */
function SignalMesh({ item, isSelected }) {
    const { x, z, height, rotation } = item;
    const h = height || 4;
    const rot = (rotation || 0) * Math.PI / 180;

    const lights = [
        { y: h - 0.3, color: '#ef4444', emissive: '#ef4444' },
        { y: h - 0.7, color: '#f59e0b', emissive: '#f59e0b' },
        { y: h - 1.1, color: '#22c55e', emissive: '#22c55e' },
    ];

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            {/* Pole */}
            <mesh position={[0, h / 2 - 0.5, 0]}>
                <cylinderGeometry args={[0.08, 0.1, h - 1, 8]} />
                <meshStandardMaterial color="#374151" metalness={0.7} />
            </mesh>
            {/* Signal box */}
            <mesh position={[0, h - 0.7, 0.15]}>
                <boxGeometry args={[0.4, 1.2, 0.25]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            {/* Lights */}
            {lights.map((l, i) => (
                <mesh key={i} position={[0, l.y, 0.3]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshStandardMaterial color={l.color} emissive={l.emissive} emissiveIntensity={0.4} />
                </mesh>
            ))}
            {isSelected && (
                <mesh position={[0, h / 2, 0]}>
                    <boxGeometry args={[1, h + 0.5, 1]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

/* ---- BUS STOP ---- */
function BusStopMesh({ item, isSelected }) {
    const { x, z, width, depth, height, color, rotation } = item;
    const w = width || 2;
    const d = depth || 1;
    const h = height || 3;
    const rot = (rotation || 0) * Math.PI / 180;

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            {/* Roof */}
            <mesh position={[0, h, 0]}>
                <boxGeometry args={[w + 0.4, 0.1, d + 0.3]} />
                <meshStandardMaterial color={color || '#06b6d4'} transparent opacity={0.7} />
            </mesh>
            {/* Back wall */}
            <mesh position={[0, h / 2, -d / 2]}>
                <boxGeometry args={[w, h, 0.08]} />
                <meshStandardMaterial color="#e5e7eb" transparent opacity={0.4} />
            </mesh>
            {/* Support poles */}
            {[-w / 2 + 0.1, w / 2 - 0.1].map((px, i) => (
                <mesh key={i} position={[px, h / 2, d / 2]}>
                    <cylinderGeometry args={[0.06, 0.06, h, 6]} />
                    <meshStandardMaterial color="#6b7280" metalness={0.5} />
                </mesh>
            ))}
            {/* Bench */}
            <mesh position={[0, 0.5, -d / 4]}>
                <boxGeometry args={[w * 0.8, 0.08, 0.4]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
            {isSelected && (
                <mesh position={[0, h / 2, 0]}>
                    <boxGeometry args={[w + 0.8, h + 0.5, d + 0.8]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

/* ---- PARKING LOT ---- */
function ParkingMesh({ item, isSelected }) {
    const { x, z, width, depth, color, rotation } = item;
    const w = width || 6;
    const d = depth || 8;
    const rot = (rotation || 0) * Math.PI / 180;

    // Generate parking lines
    const lines = useMemo(() => {
        const result = [];
        const slotWidth = 2.5;
        const count = Math.floor(w / slotWidth);
        for (let i = 0; i <= count; i++) {
            const lx = -w / 2 + i * slotWidth;
            result.push(lx);
        }
        return result;
    }, [w]);

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            {/* Ground slab */}
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[w, 0.04, d]} />
                <meshStandardMaterial color={color || '#4b5563'} roughness={1} />
            </mesh>
            {/* Parking lines */}
            {lines.map((lx, i) => (
                <mesh key={i} position={[lx, 0.05, 0]}>
                    <boxGeometry args={[0.08, 0.01, d * 0.7]} />
                    <meshStandardMaterial color="#fbbf24" />
                </mesh>
            ))}
            {/* "P" marker — simple box */}
            <mesh position={[0, 0.06, -d / 2 + 0.5]}>
                <boxGeometry args={[1, 0.01, 1]} />
                <meshStandardMaterial color="#3b82f6" />
            </mesh>
            {isSelected && (
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[w + 0.4, 1, d + 0.4]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

/* ---- PARK (green space with trees) ---- */
function ParkMesh({ item, isSelected }) {
    const { x, z, width, depth, height, color, rotation } = item;
    const w = width || 8;
    const d = depth || 8;
    const h = height || 0.15;
    const rot = (rotation || 0) * Math.PI / 180;

    // Generate some trees
    const trees = useMemo(() => {
        const result = [];
        const count = Math.min(8, Math.floor((w * d) / 12));
        for (let i = 0; i < count; i++) {
            result.push({
                x: (Math.random() - 0.5) * (w - 2),
                z: (Math.random() - 0.5) * (d - 2),
                h: 1.5 + Math.random() * 2,
                r: 0.6 + Math.random() * 0.6,
            });
        }
        return result;
    }, [w, d]);

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            {/* Grass */}
            <mesh position={[0, h / 2, 0]}>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={color || '#10b981'} roughness={1} />
            </mesh>
            {/* Trees */}
            {trees.map((t, i) => (
                <group key={i} position={[t.x, h, t.z]}>
                    {/* Trunk */}
                    <mesh position={[0, t.h / 2, 0]}>
                        <cylinderGeometry args={[0.1, 0.15, t.h, 6]} />
                        <meshStandardMaterial color="#92400e" />
                    </mesh>
                    {/* Canopy */}
                    <mesh position={[0, t.h + t.r * 0.5, 0]} castShadow>
                        <sphereGeometry args={[t.r, 8, 8]} />
                        <meshStandardMaterial color="#15803d" />
                    </mesh>
                </group>
            ))}
            {isSelected && (
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[w + 0.4, 3, d + 0.4]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

/* ---- WATER BODY ---- */
function WaterMesh({ item, isSelected }) {
    const { x, z, width, depth, color, rotation } = item;
    const w = width || 8;
    const d = depth || 8;
    const rot = (rotation || 0) * Math.PI / 180;

    return (
        <group position={[x, 0, z]} rotation={[0, rot, 0]}>
            <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[w, 0.15, d]} />
                <meshStandardMaterial
                    color={color || '#3b82f6'}
                    transparent
                    opacity={0.65}
                    roughness={0.1}
                    metalness={0.3}
                />
            </mesh>
            {/* Water surface shimmer */}
            <mesh position={[0, 0.01, 0]}>
                <planeGeometry args={[w, d]} />
                <meshStandardMaterial
                    color="#60a5fa"
                    transparent
                    opacity={0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {isSelected && (
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[w + 0.4, 1, d + 0.4]} />
                    <meshStandardMaterial color="#a78bfa" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

/* =============================================
   DISPATCHER — picks the right renderer
   ============================================= */
function InfraObject({ item, isSelected }) {
    const infraType = item.infraType || item.type;

    switch (infraType) {
        case 'bridge':
        case 'flyover':
            return <BridgeMesh item={item} isSelected={isSelected} />;
        case 'tunnel':
            return <TunnelMesh item={item} isSelected={isSelected} />;
        case 'streetlight':
            return <StreetlightMesh item={item} isSelected={isSelected} />;
        case 'signal':
            return <SignalMesh item={item} isSelected={isSelected} />;
        case 'busstop':
            return <BusStopMesh item={item} isSelected={isSelected} />;
        case 'parking':
            return <ParkingMesh item={item} isSelected={isSelected} />;
        default:
            return null;
    }
}

export {
    InfraObject,
    ParkMesh,
    WaterMesh,
    BridgeMesh,
    TunnelMesh,
    StreetlightMesh,
    SignalMesh,
    BusStopMesh,
    ParkingMesh,
};
