import type { FeatureCollection } from 'geojson';

export interface WorldProps {
    data: ArcData[];
    globeConfig: GlobeConfig;
    satellites?: SatelliteData[];
}

export interface ArcData {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    arcAlt: number;
    color: string;
}

export interface SatelliteData {
    lat: number;
    lng: number;
    alt: number;
    color: string;
}

export interface GlobeConfig {
    globeColor: string;
    emissive: string;
    emissiveIntensity: number;
    shininess: number;
    atmosphereColor: string;
    atmosphereAltitude: number;
    pointSize: number;
    pointLight: string;
    ambientLight: string;
    directionalLeftLight: string;
    directionalTopLight: string;
    polygonColor: string;
    showAtmosphere: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
}

export type CountriesData = FeatureCollection;