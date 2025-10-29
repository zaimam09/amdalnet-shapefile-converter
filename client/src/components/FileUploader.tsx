import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import shp from "shpjs";

interface FileUploaderProps {
  onFileLoaded: (geometry: any, area: string, attributes?: any) => void;
}

export default function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'zip') {
        // Handle shapefile ZIP
        await handleShapefileZip(file);
      } else if (fileExtension === 'kml') {
        // Handle KML
        await handleKML(file);
      } else if (fileExtension === 'geojson' || fileExtension === 'json') {
        // Handle GeoJSON
        await handleGeoJSON(file);
      } else {
        toast.error("Format file tidak didukung. Gunakan ZIP (shapefile), KML, atau GeoJSON");
      }
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error(`Gagal memuat file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleShapefileZip = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const geojsonRaw = await shp(arrayBuffer);
    
    // Handle both single FeatureCollection and array of FeatureCollections
    const geojson: any = Array.isArray(geojsonRaw) ? geojsonRaw[0] : geojsonRaw;

    if (!geojson || !geojson.features || geojson.features.length === 0) {
      throw new Error("Shapefile tidak mengandung feature");
    }

    // Get first feature
    const feature = geojson.features[0];
    const geometry = feature.geometry;
    const properties = feature.properties || {};

    // Calculate area
    const area = calculateAreaInHectares(geometry);

    // Extract AMDALNET attributes if available
    const attributes = {
      pemrakarsa: properties.PEMRAKARSA || properties.pemrakarsa || "",
      kegiatan: properties.KEGIATAN || properties.kegiatan || "",
      tahun: properties.TAHUN || properties.tahun || new Date().getFullYear(),
      provinsi: properties.PROVINSI || properties.provinsi || "",
      keterangan: properties.KETERANGAN || properties.keterangan || "",
    };

    onFileLoaded(geometry, area, attributes);
    toast.success("Shapefile berhasil dimuat");
  };

  const handleKML = async (file: File) => {
    const text = await file.text();
    
    // Parse KML to GeoJSON using a simple parser
    // For production, consider using a library like togeojson
    const parser = new DOMParser();
    const kml = parser.parseFromString(text, 'text/xml');
    
    // Extract coordinates from first Polygon
    const coordinates = kml.querySelector('Polygon coordinates')?.textContent?.trim();
    if (!coordinates) {
      throw new Error("Tidak ditemukan polygon dalam file KML");
    }

    // Parse coordinates (KML format: lon,lat,alt lon,lat,alt ...)
    const coords = coordinates.split(/\s+/).map(coord => {
      const [lon, lat] = coord.split(',').map(Number);
      return [lon, lat];
    });

    const geometry = {
      type: "Polygon",
      coordinates: [coords],
    };

    const area = calculateAreaInHectares(geometry);
    onFileLoaded(geometry, area);
    toast.success("KML berhasil dimuat");
  };

  const handleGeoJSON = async (file: File) => {
    const text = await file.text();
    const geojson = JSON.parse(text);

    let geometry;
    let properties: any = {};

    if (geojson.type === 'FeatureCollection') {
      if (!geojson.features || geojson.features.length === 0) {
        throw new Error("GeoJSON tidak mengandung feature");
      }
      geometry = geojson.features[0].geometry;
      properties = geojson.features[0].properties || {};
    } else if (geojson.type === 'Feature') {
      geometry = geojson.geometry;
      properties = geojson.properties || {};
    } else {
      geometry = geojson;
    }

    const area = calculateAreaInHectares(geometry);

    // Extract AMDALNET attributes if available
    const attributes = {
      pemrakarsa: properties.PEMRAKARSA || properties.pemrakarsa || "",
      kegiatan: properties.KEGIATAN || properties.kegiatan || "",
      tahun: properties.TAHUN || properties.tahun || new Date().getFullYear(),
      provinsi: properties.PROVINSI || properties.provinsi || "",
      keterangan: properties.KETERANGAN || properties.keterangan || "",
    };

    onFileLoaded(geometry, area, attributes);
    toast.success("GeoJSON berhasil dimuat");
  };

  const calculateAreaInHectares = (geometry: any): string => {
    try {
      // Simple area calculation for polygon
      // For production, use turf.js
      const turf = require('@turf/turf');
      const area = turf.area(geometry);
      const hectares = area / 10000;
      return hectares.toFixed(11);
    } catch (error) {
      console.error("Error calculating area:", error);
      return "0.00000000000";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
        <CardDescription>
          Upload shapefile (ZIP), KML, atau GeoJSON untuk import polygon
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.kml,.geojson,.json"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memuat file...
              </>
            ) : (
              <>
                <FileUp className="h-4 w-4 mr-2" />
                Pilih File
              </>
            )}
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Format yang didukung: ZIP (shapefile), KML, GeoJSON
        </p>
      </CardContent>
    </Card>
  );
}
