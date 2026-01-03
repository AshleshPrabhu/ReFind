import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./loadGoogleMaps";

declare global {
  interface Window {
    google: any;
  }
}
interface HeatmapPoint {
  location: { lat: number; lng: number };
  weight: number;
  type?: "lost" | "found";
}

interface LocationData {
  lat: number;
  lng: number;
  count: number;
}

interface Props {
  points: HeatmapPoint[];
}

export default function EnhancedHeatmap({ points }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const heatmapLayer = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'heatmap' | 'markers' | 'both'>('both');

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!mapRef.current) return;

      console.log('Initializing map with points:', points);

      await loadGoogleMaps();
      if (!mounted) return;

      console.log('Google Maps loaded, visualization available:', !!window.google?.maps?.visualization);

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 13.0105, lng: 74.794 },
        zoom: 16,
        mapTypeId: "roadmap",
        styles: [
          { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#1e293b" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#334155" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#1e3a5f" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#1e293b" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#0d3b2e" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0c4a6e" }],
          },
          {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#1e293b" }],
          },
        ],
      });

      mapInstance.current = map;

      markers.current.forEach(marker => marker.setMap(null));
      markers.current = [];
      if (heatmapLayer.current) {
        heatmapLayer.current.setMap(null);
      }

      if (window.google?.maps?.visualization && (viewMode === 'heatmap' || viewMode === 'both')) {
        console.log('Creating heatmap with points:', points);
        
        const heatmapData = points.map(p => {
          const latLng = new window.google.maps.LatLng(p.location.lat, p.location.lng);
          return { location: latLng, weight: p.weight };
        });

        console.log('Heatmap data:', heatmapData);

        const maxWeight = points.length > 0 ? Math.max(...points.map(p => p.weight)) : 1;
        
        heatmapLayer.current = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: map,
          radius: 50,
          opacity: 0.9,
          dissipating: true,
          maxIntensity: maxWeight,
          gradient: [
            "rgba(0, 0, 0, 0)",
            "rgba(0, 150, 255, 0.6)",
            "rgba(0, 200, 255, 0.7)",
            "rgba(50, 255, 200, 0.8)",
            "rgba(100, 255, 150, 0.85)",
            "rgba(200, 255, 50, 0.9)",
            "rgba(255, 200, 0, 0.95)",
            "rgba(255, 150, 0, 1)",
            "rgba(255, 100, 0, 1)",
            "rgba(255, 50, 0, 1)",
            "rgba(255, 0, 0, 1)",
          ],
        });

        console.log('Heatmap layer created:', heatmapLayer.current);
      } else {
        console.warn('Google Maps visualization library not loaded or viewMode not set to heatmap');
      }

      if (viewMode === 'markers' || viewMode === 'both') {
        const locationCounts = new Map<string, LocationData>();
        
        points.forEach(p => {
          const key = `${p.location.lat.toFixed(4)},${p.location.lng.toFixed(4)}`;
          const existing = locationCounts.get(key);
          
          if (existing) {
            existing.count += p.weight;
          } else {
            locationCounts.set(key, {
              lat: p.location.lat,
              lng: p.location.lng,
              count: p.weight,
            });
          }
        });

        locationCounts.forEach((data) => {
          const size = Math.max(10, Math.min(30, data.count * 4));
          const color = getColorForCount(data.count);
          
          const marker = new window.google.maps.Marker({
            position: { lat: data.lat, lng: data.lng },
            map: map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: size,
              fillColor: color,
              fillOpacity: 0.7,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
            title: `${data.count} lost item${data.count !== 1 ? 's' : ''}`,
            animation: window.google.maps.Animation.DROP,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                font-family: system-ui, -apple-system, sans-serif;
                border: 2px solid ${color};
                min-width: 160px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                text-align: center;
              ">
                <div style="
                  font-weight: 700; 
                  font-size: 18px; 
                  color: ${color};
                  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                  margin-bottom: 4px;
                ">
                  ${data.count}
                </div>
                <div style="
                  color: #e2e8f0;
                  font-size: 14px;
                ">
                  lost item${data.count !== 1 ? 's' : ''}
                </div>
                <div style="
                  color: #94a3b8;
                  font-size: 11px;
                  margin-top: 8px;
                ">
                  ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}
                </div>
              </div>
            `,
          });

          marker.addListener("mouseover", () => {
            infoWindow.open(map, marker);
          });

          marker.addListener("mouseout", () => {
            infoWindow.close();
          });

          marker.addListener("click", () => {
            map.setCenter(marker.getPosition());
            map.setZoom(18);
            marker.setAnimation(window.google.maps.Animation.BOUNCE);
            setTimeout(() => marker.setAnimation(null), 2000);
          });

          markers.current.push(marker);
        });
      }

      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
      if (heatmapLayer.current) {
        heatmapLayer.current.setMap(null);
      }
      markers.current.forEach(marker => marker.setMap(null));
    };
  }, [points, viewMode]);

  function getColorForCount(count: number): string {
    if (count >= 10) return "#ef4444";
    if (count >= 7) return "#f97316";
    if (count >= 5) return "#eab308";
    if (count >= 3) return "#3b82f6";
    return "#06b6d4";
  }



  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-2xl">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900 text-gray-300">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-semibold">Loading heatmap...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />
      
      <div className="absolute top-6 left-6 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-2 text-white shadow-xl">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('both')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              viewMode === 'both'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Both
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              viewMode === 'heatmap'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setViewMode('markers')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              viewMode === 'markers'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Markers
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-5 text-white shadow-2xl">
        <div className="font-bold text-lg mb-4 flex items-center gap-2">
          Lost Items Density
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-400 mb-2">Heat Intensity</div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-32 rounded-lg" style={{
                background: "linear-gradient(to right, rgba(0, 150, 255, 0.7), rgba(255, 200, 0, 1), rgba(255, 0, 0, 1))"
              }}></div>
              <div className="flex justify-between w-full text-xs text-gray-400">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-700">
            <div className="text-xs text-gray-400 mb-2">Marker Colors</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span>1-2 items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>3-4 items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>5-6 items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>7-9 items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>10+ items</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-gray-400">
          Hover over markers for details<br/>
          Click markers to zoom in
        </div>
      </div>
      
      <div className="absolute top-6 right-6 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-5 text-white shadow-2xl">
        <div className="font-bold text-sm mb-3 text-gray-400">Statistics</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Total Items:</span>
            <span className="font-bold text-lg text-blue-400">{points.reduce((sum, p) => sum + p.weight, 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Locations:</span>
            <span className="font-bold text-lg text-cyan-400">{new Set(points.map(p => `${p.location.lat},${p.location.lng}`)).size}</span>
          </div>
        </div>
      </div>
    </div>
  );
}