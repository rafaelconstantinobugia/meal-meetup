import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, MapPin, Clock, Users, Heart, Star } from 'lucide-react';

const mockTrendingDishes = [
  {
    id: '1',
    name: 'Truffle Carbonara',
    restaurant: 'Pasta Paradise',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d946?w=400',
    likes: 234,
    location: '0.5 km away',
    price: '$$$'
  },
  {
    id: '2', 
    name: 'Wagyu Ramen',
    restaurant: 'Tokyo Dreams',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    likes: 189,
    location: '1.2 km away',
    price: '$$$$'
  },
  {
    id: '3',
    name: 'Avocado Toast',
    restaurant: 'Green & Fresh',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
    likes: 156,
    location: '0.8 km away',
    price: '$$'
  }
];

const mockNearbyRestaurants = [
  {
    id: '1',
    name: 'The Garden Bistro',
    cuisine: 'Mediterranean',
    rating: 4.8,
    distance: '0.3 km',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    priceRange: '$$$',
    isOpen: true
  },
  {
    id: '2',
    name: 'Sakura Sushi',
    cuisine: 'Japanese',
    rating: 4.9,
    distance: '0.7 km',
    image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400',
    priceRange: '$$$$',
    isOpen: true
  }
];

export const ExploreView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: '🍽️' },
    { id: 'italian', label: 'Italian', icon: '🍝' },
    { id: 'asian', label: 'Asian', icon: '🍜' },
    { id: 'healthy', label: 'Healthy', icon: '🥗' },
    { id: 'dessert', label: 'Dessert', icon: '🍰' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pt-safe pb-24">
      {/* Header */}
      <div className="p-4">
        <div className="glass-card p-4 rounded-2xl mb-6">
          <h1 className="text-2xl font-bold mb-4">Explore</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dishes, restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 rounded-xl border-0 bg-muted/50 backdrop-blur-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-xl whitespace-nowrap"
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4">
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass-card p-1 rounded-xl mb-6">
            <TabsTrigger value="trending" className="rounded-lg">Trending Dishes</TabsTrigger>
            <TabsTrigger value="restaurants" className="rounded-lg">Restaurants</TabsTrigger>
          </TabsList>

          {/* Trending Dishes */}
          <TabsContent value="trending" className="space-y-4">
            {mockTrendingDishes.map((dish) => (
              <Card key={dish.id} className="glass-card overflow-hidden">
                <div className="flex">
                  <div className="w-24 h-24 relative overflow-hidden rounded-l-xl">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <CardContent className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{dish.name}</h3>
                        <p className="text-sm text-muted-foreground">{dish.restaurant}</p>
                      </div>
                      <Badge variant="secondary">{dish.price}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{dish.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span>{dish.likes}</span>
                        </div>
                      </div>
                      
                      <Button size="sm" className="ios-button">
                        Try This
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Nearby Restaurants */}
          <TabsContent value="restaurants" className="space-y-4">
            {mockNearbyRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="glass-card overflow-hidden">
                <div className="flex">
                  <div className="w-24 h-24 relative overflow-hidden rounded-l-xl">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    {restaurant.isOpen && (
                      <Badge className="absolute top-2 left-2 text-xs bg-green-500">
                        Open
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                      </div>
                      <Badge variant="secondary">{restaurant.priceRange}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{restaurant.distance}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{restaurant.rating}</span>
                        </div>
                      </div>
                      
                      <Button size="sm" variant="outline" className="rounded-xl">
                        View Menu
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};