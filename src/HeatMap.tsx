import { useEffect, useRef } from "react";

declare global {
    interface Window {
        google: any;
    }
}

interface HeatmapPoint {
    location: { lat: number; lng: number };
    weight: number;
}

interface Props {
    points: HeatmapPoint[];
}

export default function HeatmapView({ points }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 13.0105, lng: 74.794 },
            zoom: 16,
            mapTypeId: "roadmap",
        });

        const heatmapData = points.map(
            (p) =>
                new window.google.maps.visualization.WeightedLocation({
                    location: new window.google.maps.LatLng(
                        p.location.lat,
                        p.location.lng
                    ),
                    weight: p.weight,
                })
        );

        const heatmap = new window.google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            radius: 40,
        });

        heatmap.setMap(map);
    }, [points]);

    return (
        <div
            ref={mapRef}
            className="w-full h-full rounded-lg"
        />
    );
}
