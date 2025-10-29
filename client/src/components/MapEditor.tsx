import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import * as turf from "@turf/turf";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapEditorProps {
  onPolygonCreated?: (geometry: any, areaHa: string) => void;
  onPolygonEdited?: (geometry: any, areaHa: string) => void;
  onPolygonDeleted?: () => void;
  initialGeometry?: any;
  coordinateSystem?: string;
}

export default function MapEditor({
  onPolygonCreated,
  onPolygonEdited,
  onPolygonDeleted,
  initialGeometry,
  coordinateSystem = "EPSG:4326",
}: MapEditorProps) {
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (mapRef.current) return; // Map already initialized

    // Initialize map
    const map = L.map("map").setView([-2.5, 118.0], 5); // Center of Indonesia

    // Add Esri World Imagery satellite tile layer
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    }).addTo(map);
    
    // Add labels overlay for better readability
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
      attribution: '',
      maxZoom: 19,
    }).addTo(map);

    // Initialize FeatureGroup to store drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize draw control
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
        },
        polyline: false,
        rectangle: {
          showArea: true,
          metric: true,
        },
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Event handlers
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers(); // Only allow one polygon at a time
      drawnItems.addLayer(layer);

      const geojson = layer.toGeoJSON();
      const areaHa = calculateAreaInHectares(geojson.geometry);

      if (onPolygonCreated) {
        onPolygonCreated(geojson.geometry, areaHa);
      }
    });

    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const geojson = layer.toGeoJSON();
        const areaHa = calculateAreaInHectares(geojson.geometry);

        if (onPolygonEdited) {
          onPolygonEdited(geojson.geometry, areaHa);
        }
      });
    });

    map.on(L.Draw.Event.DELETED, () => {
      if (onPolygonDeleted) {
        onPolygonDeleted();
      }
    });

    mapRef.current = map;
    setMapReady(true);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Load initial geometry
  useEffect(() => {
    if (!mapReady || !initialGeometry || !drawnItemsRef.current) return;

    const drawnItems = drawnItemsRef.current;
    drawnItems.clearLayers();

    const layer = L.geoJSON(initialGeometry);
    layer.eachLayer((l) => {
      drawnItems.addLayer(l);
    });

    if (mapRef.current) {
      mapRef.current.fitBounds(drawnItems.getBounds());
    }
  }, [mapReady, initialGeometry]);

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full rounded-lg" />
    </div>
  );
}

function calculateAreaInHectares(geometry: any): string {
  try {
    const area = turf.area(geometry); // Returns area in square meters
    const hectares = area / 10000; // Convert to hectares
    return hectares.toFixed(11); // 11 decimal places as per AMDALNET spec
  } catch (error) {
    console.error("Error calculating area:", error);
    return "0.00000000000";
  }
}
