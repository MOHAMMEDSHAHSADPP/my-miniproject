import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// You'll need to add your Mapbox token to .env as VITE_MAPBOX_TOKEN
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

/**
 * MapboxMap Component - 3D Map with Mapbox GL JS
 * @param {Object} townConfig - Town configuration (centerLat, centerLon, radiusKm)
 * @param {Array} adminBuildings - Admin-managed building metadata
 * @param {Function} onBuildingSelect - Callback when building is selected
 */
export default function MapboxMap({ townConfig, adminBuildings = [], onBuildingSelect }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const markersRef = useRef([]);

    // Initialize map
    useEffect(() => {
        if (!townConfig || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [townConfig.centerLon, townConfig.centerLat],
            zoom: 15,
            pitch: 60, // 3D tilt
            bearing: 0,
            antialias: true
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        // Enable 3D buildings
        map.current.on('load', () => {
            // Add 3D building layer
            const layers = map.current.getStyle().layers;
            const labelLayerId = layers.find(
                (layer) => layer.type === 'symbol' && layer.layout['text-field']
            ).id;

            map.current.addLayer(
                {
                    id: '3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 14,
                    paint: {
                        'fill-extrusion-color': [
                            'case',
                            ['boolean', ['feature-state', 'hover'], false],
                            '#4285F4',
                            '#ddd'
                        ],
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'height']
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height']
                        ],
                        'fill-extrusion-opacity': 0.8
                    }
                },
                labelLayerId
            );

            setMapLoaded(true);
        });

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [townConfig]);

    // Add custom markers for admin buildings
    useEffect(() => {
        if (!mapLoaded || !map.current || !adminBuildings.length) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers
        adminBuildings.forEach(building => {
            if (!building.lat || !building.lon) return;

            // Create custom marker element
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = getMarkerColor(building.type);
            el.style.border = '2px solid white';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

            // Add marker to map
            const marker = new mapboxgl.Marker(el)
                .setLngLat([building.lon, building.lat])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
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

            // Click handler
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

    return (
        <div
            ref={mapContainer}
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
            }}
        />
    );
}

// Helper function to get marker color based on building type
function getMarkerColor(type) {
    const colors = {
        shop: '#3b82f6',        // Blue
        restaurant: '#f59e0b',  // Orange
        hospital: '#ef4444',    // Red
        gov: '#8b5cf6',         // Purple
        school: '#ec4899',      // Pink
        hotel: '#eab308',       // Yellow
        transport: '#10b981',   // Green
        other: '#6b7280'        // Gray
    };
    return colors[type] || colors.other;
}
