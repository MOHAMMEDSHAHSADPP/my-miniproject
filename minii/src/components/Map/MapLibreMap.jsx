import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapLibreMap Component - Free 3D Map using OpenFreeMap styling
 * No API Key required!
 */
export default function MapLibreMap({ townConfig, adminBuildings = [], onBuildingSelect }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const markersRef = useRef([]);

    // Initialize map
    useEffect(() => {
        if (!townConfig || map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            // Use OpenFreeMap - completely free, no key required
            style: 'https://tiles.openfreemap.org/styles/bright',
            center: [townConfig.centerLon, townConfig.centerLat],
            zoom: 15,
            pitch: 60, // 3D tilt
            bearing: 0,
            antialias: true
        });

        // Add navigation controls
        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

        map.current.on('style.load', () => {
            // Add 3D building layer
            // Source name in OpenFreeMap style is 'openmaptiles'

            // Insert below labels if possible
            const layers = map.current.getStyle().layers;
            const labelLayerId = layers.find(
                (layer) => layer.type === 'symbol' && layer.layout['text-field']
            )?.id;

            if (!map.current.getLayer('3d-buildings')) {
                map.current.addLayer({
                    'id': '3d-buildings',
                    'source': 'openmaptiles', // Correct source name!
                    'source-layer': 'building',
                    'filter': ['!=', 'hide_3d', true],
                    'type': 'fill-extrusion',
                    'minzoom': 13,
                    'paint': {
                        'fill-extrusion-color': [
                            'case',
                            ['boolean', ['feature-state', 'hover'], false],
                            '#4285F4',
                            '#e0e0e0'
                        ],
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            13,
                            0,
                            13.05,
                            ['get', 'render_height']
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            13,
                            0,
                            13.05,
                            ['get', 'render_min_height']
                        ],
                        'fill-extrusion-opacity': 0.8
                    }
                }, labelLayerId);
            }

            setMapLoaded(true);
        });

        // Handle missing images (sprites) to avoid console errors
        map.current.on('styleimagemissing', (e) => {
            const id = e.id; // id of the missing image
            // Check if this missing image is one we want to ignore
            // For now, load a transparent placeholder
            if (!map.current.hasImage(id)) {
                var image = new Image(1, 1);
                image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';
                image.onload = function () {
                    if (!map.current.hasImage(id)) {
                        map.current.addImage(id, image);
                    }
                };
            }
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [townConfig]);

    // Add custom markers
    useEffect(() => {
        if (!mapLoaded || !map.current || !adminBuildings.length) return;

        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        adminBuildings.forEach(building => {
            if (!building.lat || !building.lon) return;

            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = getMarkerColor(building.type);
            el.style.border = '2px solid white';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

            const marker = new maplibregl.Marker(el)
                .setLngLat([building.lon, building.lat])
                .setPopup(
                    new maplibregl.Popup({ offset: 25 })
                        .setHTML(`
                            <div style="padding: 10px;">
                                <h3 style="margin: 0 0 5px 0; color: #333;">
                                    ${building.customName || building.name || 'Building'}
                                </h3>
                                <p style="margin: 0; color: #666; font-size: 12px;">
                                    ${building.type}
                                </p>
                            </div>
                        `)
                )
                .addTo(map.current);

            el.addEventListener('click', () => {
                onBuildingSelect && onBuildingSelect(building);
            });

            markersRef.current.push(marker);
        });

        return () => {
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];
        };
    }, [mapLoaded, adminBuildings, onBuildingSelect]);

    return <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
}

function getMarkerColor(type) {
    const colors = {
        shop: '#3b82f6', restaurant: '#f59e0b', hospital: '#ef4444',
        gov: '#8b5cf6', school: '#ec4899', hotel: '#eab308',
        transport: '#10b981', other: '#6b7280'
    };
    return colors[type] || colors.other;
}
