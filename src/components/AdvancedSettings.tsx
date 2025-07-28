import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocationMatching } from '@/hooks/useLocationMatching';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Shield, Settings, Smartphone, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const AdvancedSettings = () => {
  const { toast } = useToast();
  const { locationPrefs, updateLocationPreferences, loading } = useLocationMatching();
  const { getCurrentPosition, coordinates } = useGeolocation();
  
  const [maxDistance, setMaxDistance] = useState([25]);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [safetyEnabled, setSafetyEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if (locationPrefs) {
      setMaxDistance([locationPrefs.max_distance_km]);
    }
  }, [locationPrefs]);

  const handleSaveLocationPrefs = async () => {
    try {
      await updateLocationPreferences({
        max_distance_km: maxDistance[0]
      });
      
      toast({
        title: "Settings Updated",
        description: "Your location preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location preferences.",
        variant: "destructive",
      });
    }
  };

  const handleGetLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setLocationEnabled(true);
      
      toast({
        title: "Location Access Granted",
        description: `Location: ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`,
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Failed to access your location. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Advanced Settings</h1>
      </div>

      {/* Location Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Distance
          </CardTitle>
          <CardDescription>
            Configure location-based matching preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Location Services</Label>
              <p className="text-sm text-muted-foreground">
                Allow location access for better matches
              </p>
            </div>
            <div className="flex items-center gap-3">
              {coordinates && (
                <Badge variant="secondary">
                  Location: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </Badge>
              )}
              <Switch
                checked={locationEnabled}
                onCheckedChange={setLocationEnabled}
              />
              {!locationEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetLocation}
                >
                  Get Location
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Maximum Distance for Matches: {maxDistance[0]} km</Label>
            <Slider
              value={maxDistance}
              onValueChange={setMaxDistance}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>

          <Button 
            onClick={handleSaveLocationPrefs}
            disabled={loading}
            className="w-full"
          >
            Save Location Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Safety Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety & Security
          </CardTitle>
          <CardDescription>
            Configure safety features for meetups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Safety Check-ins</Label>
              <p className="text-sm text-muted-foreground">
                Automatic safety reminders during meetups
              </p>
            </div>
            <Switch
              checked={safetyEnabled}
              onCheckedChange={setSafetyEnabled}
            />
          </div>

          <div className="space-y-4">
            <Label>Emergency Contact</Label>
            <Input
              placeholder="Enter emergency contact number"
              type="tel"
            />
          </div>

          <div className="space-y-4">
            <Label>Preferred Meeting Times</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="time" defaultValue="12:00" />
              <Input type="time" defaultValue="19:00" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new matches and messages
              </p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Match Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Instant alerts when you get a match
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Message Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new chat messages
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Mobile App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Experience
          </CardTitle>
          <CardDescription>
            Optimize your mobile app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Haptic Feedback</Label>
              <p className="text-sm text-muted-foreground">
                Feel vibrations for matches and swipes
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto-brightness</Label>
              <p className="text-sm text-muted-foreground">
                Adjust screen brightness in restaurants
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Offline Mode</Label>
              <p className="text-sm text-muted-foreground">
                Cache content for offline viewing
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};