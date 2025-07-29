import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PhotoUpload } from "@/components/PhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, MapPin } from "lucide-react";

export const ProfileSetup = () => {
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    city: "",
    availability: "both" as "lunch" | "dinner" | "both",
    food_preferences: [] as string[],
    allergies: [] as string[],
    profile_picture_url: ""
  });
  const [newPreference, setNewPreference] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setProfile({
          name: data.name || "",
          bio: data.bio || "",
          city: data.city || "",
          availability: data.availability || "both",
          food_preferences: data.food_preferences || [],
          allergies: data.allergies || [],
          profile_picture_url: data.profile_picture_url || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const addPreference = () => {
    if (newPreference.trim() && !profile.food_preferences.includes(newPreference.trim())) {
      setProfile({
        ...profile,
        food_preferences: [...profile.food_preferences, newPreference.trim()]
      });
      setNewPreference("");
    }
  };

  const removePreference = (preference: string) => {
    setProfile({
      ...profile,
      food_preferences: profile.food_preferences.filter(p => p !== preference)
    });
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !profile.allergies.includes(newAllergy.trim())) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, newAllergy.trim()]
      });
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter(a => a !== allergy)
    });
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection.",
        variant: "destructive",
      });
      return;
    }

    setDetectingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false
        });
      });

      // Simple city detection - in production, use a proper geocoding service
      const { latitude, longitude } = position.coords;
      
      // For demo purposes, we'll just ask the user to confirm their city
      toast({
        title: "Location detected",
        description: "Please confirm your city in the form below.",
      });
      
      // In a real app, you'd reverse geocode these coordinates to get the city
      console.log('Detected location:', { latitude, longitude });
      
    } catch (error) {
      console.error('Location detection failed:', error);
      toast({
        title: "Location detection failed",
        description: "Please enter your city manually.",
        variant: "destructive",
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira o seu nome.",
        variant: "destructive",
      });
      return;
    }

    // Auto-set city to Lisboa if not provided (for testing)
    const cityToSave = profile.city.trim() || "Lisboa";

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profile.name.trim(),
          bio: profile.bio.trim(),
          city: cityToSave,
          availability: profile.availability,
          food_preferences: profile.food_preferences,
          allergies: profile.allergies,
          profile_picture_url: profile.profile_picture_url
        });

      if (error) throw error;

      toast({
        title: "Profile saved!",
        description: "You're all set to start swiping.",
      });

      navigate("/");
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="pt-safe-top p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Set Up Your Profile
            </h1>
            <p className="text-white/80">
              Let's create your food connection profile
            </p>
          </div>

          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <div className="text-center">
                <label className="text-sm font-medium mb-4 block">Profile Photo</label>
                <PhotoUpload
                  currentPhotoUrl={profile.profile_picture_url}
                  onPhotoUploaded={(url) => setProfile({ ...profile, profile_picture_url: url })}
                />
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium mb-2 block">Name *</label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your first name"
                  maxLength={50}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Bio <span className="text-muted-foreground">({profile.bio.length}/120)</span>
                </label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us a bit about yourself..."
                  maxLength={120}
                  rows={3}
                />
              </div>

              {/* City */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Cidade <span className="text-muted-foreground">(opcional - assumimos Lisboa)</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="Lisboa (padrão)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={detectLocation}
                    disabled={detectingLocation}
                    className="flex items-center gap-2 px-3"
                  >
                    <MapPin className="h-4 w-4" />
                    {detectingLocation ? "Detecting..." : "Detect"}
                  </Button>
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="text-sm font-medium mb-2 block">Availability</label>
                <Select value={profile.availability} onValueChange={(value: any) => setProfile({ ...profile, availability: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lunch">Lunch only</SelectItem>
                    <SelectItem value="dinner">Dinner only</SelectItem>
                    <SelectItem value="both">Both lunch & dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Food Preferences */}
              <div>
                <label className="text-sm font-medium mb-2 block">Food Preferences</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value)}
                    placeholder="e.g., Vegetarian, Spicy food"
                    onKeyPress={(e) => e.key === 'Enter' && addPreference()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addPreference}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.food_preferences.map((preference, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {preference}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removePreference(preference)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="text-sm font-medium mb-2 block">Allergies</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="e.g., Nuts, Dairy"
                    onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addAllergy}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="flex items-center gap-1">
                      {allergy}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeAllergy(allergy)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="food-button-primary w-full py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Start Swiping"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};