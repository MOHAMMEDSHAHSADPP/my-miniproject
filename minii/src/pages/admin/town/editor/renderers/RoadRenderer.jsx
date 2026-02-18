import React, { useMemo } from 'react';
import * as THREE from 'three';

const EVENT_COLORS = {
    none: null,
    traffic: '#f59e0b',
    emergency: '#ef4444',
    accident: '#dc2626',
    closed: '#1f2937',
};

/* =============================================
   Build a flat road mesh along a path of points
   ============================================= */
function buildRoadGeometry(points, width = 4) {
    if (!points || points.length < 2) return null;

    const verts = [];
    const indices = [];
    const uvs = [];
    const half = width / 2;

    for (let i = 0; i < points.length; i++) {
        const curr = points[i];
        let dir;

        if (i === 0) {
            dir = new THREE.Vector3().subVectors(
                new THREE.Vector3(points[1].x, 0, points[1].z),
                new THREE.Vector3(curr.x, 0, curr.z)
            ).normalize();
        } else if (i === points.length - 1) {
            dir = new THREE.Vector3().subVectors(
                new THREE.Vector3(curr.x, 0, curr.z),
                new THREE.Vector3(points[i - 1].x, 0, points[i - 1].z)
            ).normalize();
        } else {
            dir = new THREE.Vector3().subVectors(
                new THREE.Vector3(points[i + 1].x, 0, points[i + 1].z),
                new THREE.Vector3(points[i - 1].x, 0, points[i - 1].z)
            ).normalize();
        }

        // Perpendicular (left/right offset)
        const perp = new THREE.Vector3(-dir.z, 0, dir.x);

        const y = curr.y || 0.08;

        verts.push(
            curr.x + perp.x * half, y, curr.z + perp.z * half,
            curr.x - perp.x * half, y, curr.z - perp.z * half
        );

        const t = i / (points.length - 1);
        uvs.push(0, t, 1, t);

        if (i < points.length - 1) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);
        }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
}

/* =============================================
   Compute curve points from control points
   ============================================= */
function computeCurvePoints(item, segments = 32) {
    const { roadMode, curvePoints, x, z } = item;

    // If we have curvePoints array, use them
    if (curvePoints && curvePoints.length >= 2) {
        if (roadMode === 'bezier') {
            return computeBezierPoints(curvePoints, segments);
        }
        if (roadMode === 'spline') {
            return computeSplinePoints(curvePoints, segments);
        }
        // Straight — just use the 2 endpoints
        return curvePoints.map(p => ({ x: p.x, y: p.y || 0.08, z: p.z }));
    }

    // Fallback: simple block-style road (old format), make a short segment
    const w = item.width || 2;
    const d = item.depth || 2;
    const rot = (item.rotation || 0) * Math.PI / 180;
    const dx = Math.sin(rot) * d / 2;
    const dz = Math.cos(rot) * d / 2;

    return [
        { x: x - dx, y: 0.08, z: z - dz },
        { x: x + dx, y: 0.08, z: z + dz }
    ];
}

function computeBezierPoints(controlPts, segments) {
    // Cubic Bezier if 4 points, Quadratic if 3, else linear
    const pts = controlPts.map(p => new THREE.Vector3(p.x, p.y || 0.08, p.z));
    let curve;

    if (pts.length === 4) {
        curve = new THREE.CubicBezierCurve3(pts[0], pts[1], pts[2], pts[3]);
    } else if (pts.length === 3) {
        curve = new THREE.QuadraticBezierCurve3(pts[0], pts[1], pts[2]);
    } else if (pts.length >= 2) {
        curve = new THREE.LineCurve3(pts[0], pts[pts.length - 1]);
    } else {
        return controlPts;
    }

    return curve.getPoints(segments).map(p => ({ x: p.x, y: p.y, z: p.z }));
}

function computeSplinePoints(controlPts, segments) {
    if (controlPts.length < 2) return controlPts;
    const pts = controlPts.map(p => new THREE.Vector3(p.x, p.y || 0.08, p.z));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    return curve.getPoints(segments).map(p => ({ x: p.x, y: p.y, z: p.z }));
}

/* =============================================
   Compute road length
   ============================================= */
function computeRoadLength(points) {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dz = points[i].z - points[i - 1].z;
        len += Math.sqrt(dx * dx + dz * dz);
    }
    return len;
}

/* =============================================
   ROAD MESH — One rendered road
   ============================================= */
const RoadMesh = React.memo(({ item, isSelected }) => {
    const points = useMemo(() => computeCurvePoints(item), [item]);
    const geom = useMemo(() => buildRoadGeometry(points, item.width || 4), [points, item.width]);

    if (!geom) return null;

    // Event color override
    let color = item.color || '#555555';
    if (item.eventStatus?.type && item.eventStatus.type !== 'none') {
        color = EVENT_COLORS[item.eventStatus.type] || color;
    }

    return (
        <group>
            <mesh geometry={geom}>
                <meshStandardMaterial
                    color={color}
                    side={THREE.DoubleSide}
                    roughness={0.9}
                />
            </mesh>

            {/* Lane lines */}
            {(item.lanes || 2) > 1 && (
                <mesh geometry={geom} position={[0, 0.01, 0]}>
                    <meshStandardMaterial
                        color="#ffffff"
                        side={THREE.DoubleSide}
                        transparent
                        opacity={0.15}
                        wireframe
                    />
                </mesh>
            )}

            {/* Sidewalk edges */}
            {item.sidewalk && (() => {
                const sideGeom = buildRoadGeometry(points, (item.width || 4) + 1.5);
                return sideGeom ? (
                    <mesh geometry={sideGeom} position={[0, -0.01, 0]}>
                        <meshStandardMaterial color="#9ca3af" side={THREE.DoubleSide} roughness={1} />
                    </mesh>
                ) : null;
            })()}

            {/* Divider center line */}
            {item.divider && (() => {
                const divGeom = buildRoadGeometry(points, 0.15);
                return divGeom ? (
                    <mesh geometry={divGeom} position={[0, 0.02, 0]}>
                        <meshStandardMaterial color="#fbbf24" side={THREE.DoubleSide} />
                    </mesh>
                ) : null;
            })()}

            {/* Selection highlight */}
            {isSelected && (
                <mesh geometry={geom} position={[0, 0.03, 0]}>
                    <meshStandardMaterial
                        color="#a78bfa"
                        side={THREE.DoubleSide}
                        transparent
                        opacity={0.4}
                        wireframe
                    />
                </mesh>
            )}

            {/* Control point handles (when selected) */}
            {isSelected && item.curvePoints && item.curvePoints.map((pt, i) => (
                <mesh key={i} position={[pt.x, 1, pt.z]}>
                    <sphereGeometry args={[0.4, 8, 8]} />
                    <meshStandardMaterial color={i === 0 || i === item.curvePoints.length - 1 ? '#22c55e' : '#f59e0b'} />
                </mesh>
            ))}
        </group>
    );
});

/* =============================================
   DRAWING PREVIEW — shows while user is drawing
   ============================================= */
function RoadDrawingPreview({ drawState, activeTool, gridSnap, gridSize }) {
    if (!drawState || !drawState.points || drawState.points.length < 1) return null;

    const previewPoints = useMemo(() => {
        const pts = drawState.points;
        if (drawState.hoverPoint) {
            const allPts = [...pts, drawState.hoverPoint];

            if (activeTool === 'bezier' && allPts.length >= 2) {
                // For bezier, generate midpoint controls automatically
                if (allPts.length === 2) {
                    return allPts.map(p => ({ x: p.x, y: 0.08, z: p.z }));
                }
                return computeBezierPoints(
                    allPts.map(p => ({ x: p.x, y: p.y || 0.08, z: p.z })),
                    24
                );
            }

            if (activeTool === 'spline' && allPts.length >= 2) {
                return computeSplinePoints(
                    allPts.map(p => ({ x: p.x, y: p.y || 0.08, z: p.z })),
                    24
                );
            }

            return allPts.map(p => ({ x: p.x, y: 0.08, z: p.z }));
        }

        return pts.map(p => ({ x: p.x, y: 0.08, z: p.z }));
    }, [drawState, activeTool]);

    const geom = useMemo(() => buildRoadGeometry(previewPoints, drawState.width || 4), [previewPoints, drawState.width]);

    if (!geom) return null;

    const length = computeRoadLength(previewPoints);

    return (
        <group>
            <mesh geometry={geom}>
                <meshStandardMaterial color="#7c3aed" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>

            {/* Point markers */}
            {drawState.points.map((pt, i) => (
                <mesh key={i} position={[pt.x, 0.5, pt.z]}>
                    <sphereGeometry args={[0.4, 8, 8]} />
                    <meshStandardMaterial color={i === 0 ? '#22c55e' : '#f59e0b'} transparent opacity={0.8} />
                </mesh>
            ))}

            {/* Length display at midpoint */}
            {previewPoints.length >= 2 && (
                <mesh position={[
                    (previewPoints[0].x + previewPoints[previewPoints.length - 1].x) / 2,
                    2,
                    (previewPoints[0].z + previewPoints[previewPoints.length - 1].z) / 2
                ]}>
                    <sphereGeometry args={[0.01]} />
                    {/* Length shown via StatusBar, but visual marker helps */}
                </mesh>
            )}
        </group>
    );
}

export { RoadMesh, RoadDrawingPreview, computeCurvePoints, computeRoadLength, buildRoadGeometry };
