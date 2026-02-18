import React, { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { RoadMesh, RoadDrawingPreview } from './renderers/RoadRenderer';
import { BuildingMesh } from './renderers/BuildingRenderer';
import { InfraObject, ParkMesh, WaterMesh } from './renderers/InfraRenderer';

const GRID_SIZE = 300;

/* =============================================
   SCENE — 3D content inside the Canvas
   ============================================= */
function EditorScene({ layout, activeTool, onPointerAction, cursorRef, selectedId, gridSnap, gridSize, roadDrawState }) {
    const { camera } = useThree();
    const [hoverPos, setHoverPos] = useState(null);
    const [isRotating, setIsRotating] = useState(false);
    const controlsRef = useRef();

    const handlePointerMove = useCallback((e) => {
        if (isRotating) return;
        const snap = gridSnap ? gridSize : 1;
        const x = Math.round(e.point.x / snap) * snap;
        const z = Math.round(e.point.z / snap) * snap;
        setHoverPos([x, 0, z]);
        if (cursorRef) cursorRef.current = [x, 0, z];

        // Send hover update (for road drawing preview)
        onPointerAction({ type: 'hover', x, z });

        // Drag paint for non-road placement tools
        if (e.buttons === 1 && !['select', 'eraser', 'event', 'label', 'road', 'bezier', 'spline'].includes(activeTool)) {
            onPointerAction({ type: 'drag', x, z });
        }
    }, [isRotating, activeTool, gridSnap, gridSize, cursorRef, onPointerAction]);

    const handlePointerDown = useCallback((e) => {
        if (e.button !== 0) return;
        if (isRotating) return;
        if (!hoverPos) return;
        onPointerAction({ type: 'click', x: hoverPos[0], z: hoverPos[2], shiftKey: e.shiftKey });
    }, [hoverPos, isRotating, onPointerAction]);

    const handleDoubleClick = useCallback((e) => {
        if (!hoverPos) return;
        onPointerAction({ type: 'dblclick', x: hoverPos[0], z: hoverPos[2] });
    }, [hoverPos, onPointerAction]);

    // Determine ghost visibility
    const isRoadTool = ['road', 'bezier', 'spline'].includes(activeTool);
    const showGhost = hoverPos && !isRotating && !['select', 'eraser', 'event', 'label'].includes(activeTool) && !isRoadTool;

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[40, 60, 30]} intensity={1.2} castShadow />
            <hemisphereLight args={['#b1e1ff', '#b97a20', 0.3]} />

            <OrbitControls
                ref={controlsRef}
                makeDefault
                maxPolarAngle={Math.PI / 2.1}
                minDistance={5}
                maxDistance={300}
                onStart={() => setIsRotating(true)}
                onEnd={() => setIsRotating(false)}
                mouseButtons={{
                    LEFT: null,
                    MIDDLE: THREE.MOUSE.PAN,
                    RIGHT: THREE.MOUSE.ROTATE
                }}
                enableDamping
                dampingFactor={0.1}
            />

            <Grid
                infiniteGrid
                sectionColor="#444"
                cellColor="#222"
                sectionSize={20}
                cellSize={gridSnap ? gridSize : 2}
                fadeDistance={200}
            />

            {/* Invisible ground plane for raycasting */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onDoubleClick={handleDoubleClick}
            >
                <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {/* Render all objects */}
            {layout.map(item => {
                if (item.type === 'road') {
                    return <RoadMesh key={item.id} item={item} isSelected={item.id === selectedId} />;
                }
                if (item.type === 'building') {
                    return <BuildingMesh key={item.id} item={item} isSelected={item.id === selectedId} />;
                }
                if (item.type === 'park') {
                    return <ParkMesh key={item.id} item={item} isSelected={item.id === selectedId} />;
                }
                if (item.type === 'water') {
                    return <WaterMesh key={item.id} item={item} isSelected={item.id === selectedId} />;
                }
                if (['bridge', 'tunnel', 'streetlight', 'signal', 'busstop', 'parking'].includes(item.type)) {
                    return <InfraObject key={item.id} item={item} isSelected={item.id === selectedId} />;
                }
                return <MapObject key={item.id} item={item} isSelected={item.id === selectedId} />;
            })}

            {/* Road drawing preview */}
            {roadDrawState && roadDrawState.points.length > 0 && (
                <RoadDrawingPreview
                    drawState={roadDrawState}
                    activeTool={activeTool}
                    gridSnap={gridSnap}
                    gridSize={gridSize}
                />
            )}

            {/* Ghost preview (non-road tools) */}
            {showGhost && (
                <group position={[hoverPos[0], 0.5, hoverPos[2]]}>
                    <mesh>
                        <boxGeometry args={[2, 1, 2]} />
                        <meshStandardMaterial color="#7c3aed" transparent opacity={0.3} />
                    </mesh>
                </group>
            )}

            {/* Road tool cursor (crosshair dot) */}
            {hoverPos && !isRotating && isRoadTool && (
                <mesh position={[hoverPos[0], 0.3, hoverPos[2]]}>
                    <sphereGeometry args={[0.5, 12, 12]} />
                    <meshStandardMaterial color="#7c3aed" transparent opacity={0.6} />
                </mesh>
            )}

            {/* Cursor indicator for select/eraser/event/label */}
            {hoverPos && !isRotating && ['select', 'eraser', 'event', 'label'].includes(activeTool) && (
                <mesh position={[hoverPos[0], 0.5, hoverPos[2]]}>
                    <boxGeometry args={[2.2, 0.1, 2.2]} />
                    <meshStandardMaterial
                        color={activeTool === 'eraser' ? '#ef4444' : '#7c3aed'}
                        wireframe
                    />
                </mesh>
            )}
        </>
    );
}

/* =============================================
   MAP OBJECT — renders a single non-road item
   ============================================= */
function MapObject({ item, isSelected }) {
    const { type, x, z, width, depth, height, color, rotation } = item;

    let objColor = color || '#888';
    const h = height || 0.2;
    const w = width || 2;
    const d = depth || 2;

    // Generic (park, water, prop, infrastructure, etc.)
    const materialProps = type === 'water'
        ? { color: objColor, transparent: true, opacity: 0.7 }
        : { color: objColor };

    return (
        <group position={[x, h / 2, z]} rotation={[0, (rotation || 0) * Math.PI / 180, 0]}>
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            {isSelected && (
                <mesh>
                    <boxGeometry args={[w + 0.3, h + 0.3, d + 0.3]} />
                    <meshStandardMaterial color="#a78bfa" wireframe />
                </mesh>
            )}
        </group>
    );
}

function darken(hex, amount) {
    try {
        let c = new THREE.Color(hex);
        c.multiplyScalar(1 - amount);
        return '#' + c.getHexString();
    } catch { return hex; }
}

/* =============================================
   EXPORTED CANVAS WRAPPER
   ============================================= */
export default function Canvas3D({ layout, activeTool, selectedId, onPointerAction, cursorRef, gridSnap, gridSize, roadDrawState }) {
    return (
        <div className="me-canvas-area" onContextMenu={e => e.preventDefault()}>
            <Canvas
                shadows
                camera={{ position: [30, 50, 30], fov: 45 }}
                gl={{ antialias: true }}
            >
                <EditorScene
                    layout={layout}
                    activeTool={activeTool}
                    onPointerAction={onPointerAction}
                    cursorRef={cursorRef}
                    selectedId={selectedId}
                    gridSnap={gridSnap}
                    gridSize={gridSize}
                    roadDrawState={roadDrawState}
                />
            </Canvas>

            {/* Canvas overlay info */}
            <div style={{
                position: 'absolute', bottom: 10, left: 10,
                color: '#666', fontSize: 9, pointerEvents: 'none',
                background: 'rgba(0,0,0,0.6)', padding: '4px 10px',
                borderRadius: 4, fontFamily: 'monospace'
            }}>
                <b>L-Click</b>: Place/Select &nbsp;•&nbsp;
                <b>R-Drag</b>: Rotate &nbsp;•&nbsp;
                <b>M-Drag</b>: Pan &nbsp;•&nbsp;
                <b>Scroll</b>: Zoom
            </div>
        </div>
    );
}
