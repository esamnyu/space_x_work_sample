export interface Satellite {
    id: string;
    lat: number;
    lng: number;
    alt: number;
    color: string;
  }
  
  export interface WorldProps {
    data: Array<{
      startLat: number;
      startLng: number;
      endLat: number;
      endLng: number;
      arcAlt: number;
      color: string;
    }>;
    globeConfig: {
      pointSize: number;
      globeColor: string;
      showAtmosphere: boolean;
      atmosphereColor: string;
      atmosphereAltitude: number;
      emissive: string;
      emissiveIntensity: number;
      shininess: number;
      polygonColor: string;
      ambientLight: string;
      directionalLeftLight: string;
      directionalTopLight: string;
      pointLight: string;
      autoRotate: boolean;
      autoRotateSpeed: number;
    };
    satellites: Satellite[];
  }
  
  export interface CountriesData {
    type: string;
    features: Array<{
      type: string;
      geometry: {
        type: string;
        coordinates: number[][][];
      };
      properties: any;
    }>;
  }
  
  export interface Polygon {
    type: 'Polygon';
    coordinates: number[][][];
  }
  
  export interface MultiPolygon {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  }