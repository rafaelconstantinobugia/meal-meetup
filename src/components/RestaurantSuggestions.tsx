import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ExternalLink } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating?: number;
  cuisine_type?: string;
  distance?: number;
}

interface RestaurantSuggestionsProps {
  city: string;
  dishName: string;
}

export const RestaurantSuggestions = ({ city, dishName }: RestaurantSuggestionsProps) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For MVP, using mock data. In production, integrate with MapTiler/OpenStreetMap API
    const mockRestaurants: Restaurant[] = [
      {
        id: "1",
        name: "The Local Bistro",
        address: `123 Main St, ${city}`,
        rating: 4.5,
        cuisine_type: "International",
        distance: 0.5
      },
      {
        id: "2", 
        name: "Corner Cafe",
        address: `456 Oak Ave, ${city}`,
        rating: 4.2,
        cuisine_type: "Casual Dining",
        distance: 0.8
      },
      {
        id: "3",
        name: "Garden Restaurant",
        address: `789 Pine Rd, ${city}`,
        rating: 4.7,
        cuisine_type: "Modern European",
        distance: 1.2
      }
    ];

    // Simulate API call delay
    setTimeout(() => {
      setRestaurants(mockRestaurants);
      setLoading(false);
    }, 1000);
  }, [city, dishName]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Suggested Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Suggested Restaurants
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Perfect spots to enjoy {dishName} in {city}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium">{restaurant.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {restaurant.address}
                </p>
                
                <div className="flex items-center gap-3">
                  {restaurant.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{restaurant.rating}</span>
                    </div>
                  )}
                  
                  {restaurant.cuisine_type && (
                    <Badge variant="outline" className="text-xs">
                      {restaurant.cuisine_type}
                    </Badge>
                  )}
                  
                  {restaurant.distance && (
                    <span className="text-xs text-muted-foreground">
                      {restaurant.distance}km away
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => {
                  // Open in new tab for external maps
                  const searchQuery = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
                  window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const searchQuery = encodeURIComponent(`restaurants ${city}`);
              window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
            }}
          >
            View More on Maps
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};