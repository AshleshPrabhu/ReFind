import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useState, useCallback } from 'react';

interface MapLocationPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; name: string; description?: string }) => void;
    selectedLocation?: { lat: number; lng: number; name: string; description?: string } | null;
    className?: string;
}

const NITK_BOUNDS = {
    north: 13.015,
    south: 13.007,
    east: 74.800,
    west: 74.790
};

const NITK_CENTER = {
    lat: 13.01085,
    lng: 74.79460
};

const mapContainerStyle = {
    width: '100%',
    height: '400px'
};

const getLocationName = async (lat: number, lng: number, geocoder: google.maps.Geocoder): Promise<string> => {
    try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        
        if (response.results && response.results.length > 0) {
        const result = response.results[0];
        
        const establishment = result.address_components?.find(component => 
            component.types.includes('establishment') || component.types.includes('point_of_interest')
        );
        
        if (establishment) {
            return establishment.long_name;
        }
        const premise = result.address_components?.find(component => 
            component.types.includes('premise') || component.types.includes('subpremise')
        );
        
        if (premise) {
            return premise.long_name;
        }
        
        const route = result.address_components?.find(component => 
            component.types.includes('route')
        );
        
        if (route) {
            return `Near ${route.long_name}`;
        }
        
        return result.formatted_address.split(',')[0] || 'NITK Campus Location';
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    
    return `NITK Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
};

export default function MapLocationPicker({ onLocationSelect, selectedLocation, className }: MapLocationPickerProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS || '',
        libraries: ['geocoding'],
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<{ lat: number; lng: number; name: string; description?: string } | null>(
        selectedLocation || null
    );
    const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
    const [locationDescription, setLocationDescription] = useState<string>(selectedLocation?.description || '');

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
        setGeocoder(new window.google.maps.Geocoder());
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
        setGeocoder(null);
    }, []);

    const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
        if (event.latLng && geocoder) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        if (lat >= NITK_BOUNDS.south && lat <= NITK_BOUNDS.north && 
            lng >= NITK_BOUNDS.west && lng <= NITK_BOUNDS.east) {
            
            setIsGeocodingLocation(true);
            
            try {
                const locationName = await getLocationName(lat, lng, geocoder);
                const newLocation = { lat, lng, name: locationName, description: locationDescription };
                
                setSelectedMarker(newLocation);
                onLocationSelect(newLocation);
            } catch (error) {
                console.error('Error getting location name:', error);
                const fallbackName = `NITK Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                const newLocation = { lat, lng, name: fallbackName, description: locationDescription };
                
                setSelectedMarker(newLocation);
                onLocationSelect(newLocation);
            } finally {
                setIsGeocodingLocation(false);
            }
        }
        }
    }, [onLocationSelect, geocoder]);

    if (!isLoaded) {
        return (
        <div className={`${className} bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center`}>
            <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400">Loading map...</span>
            </div>
        </div>
        );
    }

    const mapOptions = {
        restriction: {
            latLngBounds: NITK_BOUNDS,
            strictBounds: true,
        },
        zoom: 17,
        center: NITK_CENTER,
        mapTypeId: 'hybrid' as google.maps.MapTypeId,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_CENTER,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid']
        },
        gestureHandling: 'cooperative',
    };

    return (
        <div className={className}>
        <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Select Location on NITK Campus</h3>
            <p className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            Click anywhere on the map to drop a pin and select your location. The map is restricted to NITK campus area.
            </p>
        </div>

        <div className="rounded-lg overflow-hidden border border-slate-700 relative">
            {isGeocodingLocation && (
            <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Getting location name...</span>
            </div>
            )}
            
            <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={17}
            center={NITK_CENTER}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={mapOptions}
            >

            {selectedMarker && (
                <Marker
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                title={selectedMarker.name}
                icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2C10.48 2 6 6.48 6 12C6 20 16 30 16 30C16 30 26 20 26 12C26 6.48 21.52 2 16 2ZM16 16C13.79 16 12 14.21 12 12C12 9.79 13.79 8 16 8C18.21 8 20 9.79 20 12C20 14.21 18.21 16 16 16Z" fill="#ef4444"/>
                        <circle cx="16" cy="12" r="3" fill="white"/>
                    </svg>
                    `),
                    scaledSize: isLoaded ? new window.google.maps.Size(32, 32) : undefined,
                    anchor: isLoaded ? new window.google.maps.Point(16, 32) : undefined,
                }}
                />
            )}
            </GoogleMap>
        </div>

        <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
                Location Description
            </label>
            <textarea
                value={locationDescription}
                onChange={(e) => {
                    setLocationDescription(e.target.value);
                    if (selectedMarker) {
                        const updatedLocation = { ...selectedMarker, description: e.target.value };
                        setSelectedMarker(updatedLocation);
                        onLocationSelect(updatedLocation);
                    }
                }}
                placeholder="Tell more about this location (e.g., Classroom 201, Near main entrance, 2nd floor library section...)"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 placeholder-slate-500 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
            />
            <p className="text-xs text-slate-500 mt-1">
                Add specific details to help identify the exact location within the area
            </p>
        </div>
        
        {selectedMarker && (
            <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                        <p className="text-blue-300 font-medium text-sm mb-1">
                            {selectedMarker.name}
                        </p>
                        {selectedMarker.description && (
                            <p className="text-slate-300 text-sm mb-2 bg-slate-700/50 p-2 rounded border-l-2 border-blue-400">
                                {selectedMarker.description}
                            </p>
                        )}
                        <p className="text-xs text-slate-500">
                            Coordinates: {selectedMarker.lat.toFixed(5)}, {selectedMarker.lng.toFixed(5)}
                        </p>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}