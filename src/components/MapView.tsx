import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Users, Utensils, Navigation, Filter, Heart } from 'lucide-react';

interface FoodieLocation {
  id: string;
  name: string;
  restaurant: string;
  dish: string;
  coordinates: [number, number];
  isOnline: boolean;
  joinedTime: string;
}

// Mock data
const mockFoodieLocations: FoodieLocation[] = [
  {
    id: '1',
    name: 'Sarah',
    restaurant: 'Cozy Bistro',
    dish: 'Truffle Pasta',
    coordinates: [-74.006, 40.7128],
    isOnline: true,
    joinedTime: '10 min ago'
  },
  {
    id: '2', 
    name: 'Mike',
    restaurant: 'Sushi Palace',
    dish: 'Omakase',
    coordinates: [-74.0100, 40.7150],
    isOnline: true,
    joinedTime: '5 min ago'
  }
];

export const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<FoodieLocation | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const { getCurrentPosition, coordinates } = useGeolocation();

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    const initializeMap = async () => {
      try {
        mapboxgl.accessToken = mapboxToken;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: coordinates ? [coordinates.longitude, coordinates.latitude] : [-74.006, 40.7128],
          zoom: 14,
          pitch: 45,
          bearing: 0
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        if (coordinates) {
          new mapboxgl.Marker({ color: '#f97316' })
            .setLngLat([coordinates.longitude, coordinates.latitude])
            .setPopup(new mapboxgl.Popup().setHTML('<p>Your location</p>'))
            .addTo(map.current);
        }

        mockFoodieLocations.forEach((location) => {
          const el = document.createElement('div');
          el.className = 'foodie-marker';
          el.innerHTML = `
            <div class="w-12 h-12 rounded-full border-3 border-white shadow-lg bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform duration-200 ${location.isOnline ? 'animate-pulse' : ''}">
              <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <span class="text-sm font-bold text-orange-500">${location.name[0]}</span>
              </div>
            </div>
          `;

          el.addEventListener('click', () => {
            setSelectedLocation(location);
          });

          new mapboxgl.Marker(el)
            .setLngLat(location.coordinates)
            .addTo(map.current);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken, coordinates]);

  if (showTokenInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md glass-card">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Enable Map</h2>
              <p className="text-muted-foreground">
                Enter your Mapbox token to view foodie locations
              </p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter Mapbox public token"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 backdrop-blur-sm"
              />
              
              <Button
                onClick={() => setShowTokenInput(false)}
                disabled={!mapboxToken}
                className="w-full modern-button"
              >
                Initialize Map
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Get your token from{' '}
                <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  mapbox.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 pt-safe">
        <div className="p-4">
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Discover Foodies</h1>
                <p className="text-sm text-muted-foreground">
                  {mockFoodieLocations.filter(l => l.isOnline).length} people dining nearby
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-xl" />

      {/* Location Button */}
      <div className="absolute bottom-24 right-4 z-40">
        <Button
          onClick={getCurrentPosition}
          size="icon"
          className="w-12 h-12 rounded-full modern-button"
        >
          <Navigation className="h-5 w-5" />
        </Button>
      </div>

      {/* Selected Location Card */}
      {selectedLocation && (
        <div className="absolute bottom-20 left-4 right-4 z-40">
          <Card className="glass-card animate-slide-in-right">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold">{selectedLocation.name[0]}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{selectedLocation.name}</h3>
                    {selectedLocation.isOnline && (
                      <Badge variant="secondary" className="text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        Online
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedLocation.restaurant}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm mb-3">
                    <Utensils className="h-3 w-3 text-primary" />
                    <span>{selectedLocation.dish}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 modern-button">
                      <Heart className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedLocation(null)}
                      className="rounded-xl"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Activity Indicator */}
      <div className="absolute top-20 right-4 z-40">
        <Card className="glass-card p-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">Live</span>
          </div>
        </Card>
      </div>
    </div>
  );
};