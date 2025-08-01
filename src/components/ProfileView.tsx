import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChangePasswordModal } from './ChangePasswordModal';
import { FoodPhotoUpload } from './FoodPhotoUpload';
import { Camera, Edit3, Settings, Heart, MapPin, Star, Calendar, LogOut, Lock, Loader2, Plus, X } from 'lucide-react';

interface Profile {
  name: string;
  bio: string;
  city: string;
  availability: "lunch" | "dinner" | "both";
  food_preferences: string[];
  allergies: string[];
  profile_picture_url: string;
}

export const ProfileView = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: '',
    bio: '',
    city: '',
    availability: 'both' as "lunch" | "dinner" | "both",
    food_preferences: [],
    allergies: [],
    profile_picture_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [foodPhotos, setFoodPhotos] = useState<Array<{id?: string, image_url: string, caption: string, tags: string[]}>>([]);
  const [newPreference, setNewPreference] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
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
          availability: (data.availability || "both") as "lunch" | "dinner" | "both",
          food_preferences: data.food_preferences || [],
          allergies: data.allergies || [],
          profile_picture_url: data.profile_picture_url || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profile.name.trim(),
          bio: profile.bio.trim(),
          city: profile.city.trim() || "Lisbon",
          availability: profile.availability,
          food_preferences: profile.food_preferences,
          allergies: profile.allergies,
          profile_picture_url: profile.profile_picture_url
        });

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pt-safe pb-24">
      {/* Header */}
      <div className="p-4">
        <div className="glass-card p-6 rounded-2xl text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={profile.profile_picture_url} alt={profile.name} />
              <AvatarFallback className="text-xl">{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button
                size="icon"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full ios-button"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="text-center font-bold text-lg rounded-xl"
                placeholder="Your name"
              />
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                className="text-center text-sm rounded-xl"
                maxLength={120}
                rows={3}
              />
              <Input
                value={profile.city}
                onChange={(e) => setProfile({...profile, city: e.target.value})}
                placeholder="Your city"
                className="text-center rounded-xl"
              />
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleSaveProfile} 
                  size="sm" 
                  className="ios-button"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button 
                  onClick={() => setIsEditing(false)} 
                  size="sm" 
                  variant="outline" 
                  className="rounded-xl"
                  disabled={saving}
                >
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4">
        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass-card p-1 rounded-xl mb-6">
            <TabsTrigger value="preferences" className="rounded-lg text-xs">Preferences</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg text-xs">Settings</TabsTrigger>
          </TabsList>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-4">
            {/* Food Photos Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Your Food Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <FoodPhotoUpload
                  photos={foodPhotos}
                  onPhotosChange={setFoodPhotos}
                />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Food Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Food Preferences</label>
                  {isEditing && (
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
                  )}
                  <div className="flex flex-wrap gap-2">
                    {profile.food_preferences.map((preference, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {preference}
                        {isEditing && (
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removePreference(preference)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Allergies</label>
                  {isEditing && (
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
                  )}
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="flex items-center gap-1">
                        {allergy}
                        {isEditing && (
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeAllergy(allergy)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Availability</label>
                  <Badge variant="secondary">{profile.availability}</Badge>
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
            
            <div className="space-y-3">
              <Button 
                className="w-full ios-button-secondary"
                onClick={() => setShowChangePassword(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ChangePasswordModal 
        open={showChangePassword} 
        onOpenChange={setShowChangePassword} 
      />
    </div>
  );
};