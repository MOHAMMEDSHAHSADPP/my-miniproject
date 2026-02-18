import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapLibre GL Base Map Component
 * Provides professional map tiles with roads, labels, and terrain
 */
export default function MapLibreBase({ center, zoom = 15, onMapLoad, onCameraChange }) {
    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if (map.current) return; // Initialize map only once

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // Light OSM style
            center: center || [76.0357, 10.8505], // Default: Kuttippuram
            zoom: zoom,
            pitch: 0, // Top-down view for now
            bearing: 0
        });

        // Add navigation controls
        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Add scale control
        map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

        // Map loaded event
        map.current.on('load', () => {
            console.log('✅ MapLibre GL loaded');
            if (onMapLoad) {
                onMapLoad(map.current);
            }
        });

        // Camera change events for Three.js sync
        if (onCameraChange) {
            const handleMove = () => {
                const center = map.current.getCenter();
                const zoom = map.current.getZoom();
                const bearing = map.current.getBearing();
                const pitch = map.current.getPitch();

                onCameraChange({
                    center: [center.lng, center.lat],
                    zoom,
                    bearing,
                    pitch
                });
            };

            map.current.on('move', handleMove);
            map.current.on('zoom', handleMove);
            map.current.on('rotate', handleMove);
            map.current.on('pitch', handleMove);
        }

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update center when prop changes
    useEffect(() => {
        if (map.current && center) {
            map.current.setCenter(center);
        }
    }, [center]);

    return (
        <div
            ref={mapContainer}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}
        />
    );
}
