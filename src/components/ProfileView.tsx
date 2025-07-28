import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Camera, Edit3, Settings, Heart, MapPin, Star, Trophy, Calendar } from 'lucide-react';

const mockUserProfile = {
  name: 'Alex Thompson',
  bio: 'Food enthusiast & amateur chef. Always looking for the next great meal to share!',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  city: 'New York, NY',
  joinedDate: 'January 2024',
  stats: {
    matches: 47,
    meals: 23,
    reviews: 12,
    rating: 4.9
  },
  preferences: {
    cuisines: ['Italian', 'Japanese', 'Mediterranean'],
    dietaryRestrictions: ['Vegetarian-friendly'],
    maxDistance: 25,
    preferredTimes: ['Lunch', 'Dinner']
  },
  recentActivity: [
    {
      id: '1',
      type: 'match',
      description: 'Matched with Sarah for Truffle Pasta',
      time: '2 hours ago',
      restaurant: 'Pasta Paradise'
    },
    {
      id: '2',
      type: 'review',
      description: 'Reviewed The Garden Bistro',
      time: '1 day ago',
      rating: 5
    },
    {
      id: '3',
      type: 'meal',
      description: 'Shared Wagyu Ramen with Mike',
      time: '3 days ago',
      restaurant: 'Tokyo Dreams'
    }
  ]
};

export const ProfileView = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(mockUserProfile);

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Save profile logic would go here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pt-safe pb-24">
      {/* Header */}
      <div className="p-4">
        <div className="glass-card p-6 rounded-2xl text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="text-xl">{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full ios-button"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="text-center font-bold text-lg rounded-xl"
              />
              <Input
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                className="text-center text-sm rounded-xl"
              />
              <div className="flex gap-2 justify-center">
                <Button onClick={handleSaveProfile} size="sm" className="ios-button">
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} size="sm" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="w-8 h-8"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground mb-3">{profile.bio}</p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{profile.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {profile.joinedDate}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Matches', value: profile.stats.matches, icon: Heart },
            { label: 'Meals', value: profile.stats.meals, icon: Calendar },
            { label: 'Reviews', value: profile.stats.reviews, icon: Star },
            { label: 'Rating', value: profile.stats.rating, icon: Trophy }
          ].map((stat, index) => (
            <Card key={index} className="glass-card p-3 text-center">
              <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4">
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-card p-1 rounded-xl mb-6">
            <TabsTrigger value="activity" className="rounded-lg text-xs">Activity</TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg text-xs">Preferences</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg text-xs">Settings</TabsTrigger>
          </TabsList>

          {/* Recent Activity */}
          <TabsContent value="activity" className="space-y-3">
            {profile.recentActivity.map((activity) => (
              <Card key={activity.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {activity.type === 'match' && <Heart className="h-4 w-4 text-primary" />}
                      {activity.type === 'review' && <Star className="h-4 w-4 text-primary" />}
                      {activity.type === 'meal' && <Calendar className="h-4 w-4 text-primary" />}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.time}</span>
                        {activity.restaurant && (
                          <>
                            <span>•</span>
                            <span>{activity.restaurant}</span>
                          </>
                        )}
                        {activity.rating && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{activity.rating}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Food Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Favorite Cuisines</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferences.cuisines.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary">{cuisine}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Dietary Restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferences.dietaryRestrictions.map((restriction) => (
                      <Badge key={restriction} variant="outline">{restriction}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Preferred Meal Times</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferences.preferredTimes.map((time) => (
                      <Badge key={time} variant="secondary">{time}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="glass-card">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">Get notified about matches</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Location Services</div>
                    <div className="text-sm text-muted-foreground">Find nearby foodies</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Profile Visibility</div>
                    <div className="text-sm text-muted-foreground">Show profile to others</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
            
            <Button className="w-full ios-button-secondary">
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};