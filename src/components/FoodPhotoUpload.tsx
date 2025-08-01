import { useState, useRef } from "react";
import { Camera, Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FoodPhoto {
  id?: string;
  image_url: string;
  caption: string;
  tags: string[];
}

interface FoodPhotoUploadProps {
  photos: FoodPhoto[];
  onPhotosChange: (photos: FoodPhoto[]) => void;
  maxPhotos?: number;
}

export const FoodPhotoUpload = ({ photos, onPhotosChange, maxPhotos = 5 }: FoodPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadPhoto = async (file: File, index: number) => {
    try {
      setUploading(true);

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image must be less than 5MB');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/food-photo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('food-photos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('food-photos')
        .getPublicUrl(fileName);

      const photoUrl = data.publicUrl;
      
      // Update photos array
      const newPhotos = [...photos];
      newPhotos[index] = {
        ...newPhotos[index],
        image_url: photoUrl
      };
      onPhotosChange(newPhotos);

      toast({
        title: "Photo uploaded! 📸",
        description: "Your food photo has been added.",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file, index);
    }
  };

  const updateCaption = (index: number, caption: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], caption };
    onPhotosChange(newPhotos);
  };

  const addTag = (index: number) => {
    if (!newTag.trim()) return;
    
    const newPhotos = [...photos];
    const currentTags = newPhotos[index]?.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      newPhotos[index] = {
        ...newPhotos[index],
        tags: [...currentTags, newTag.trim()]
      };
      onPhotosChange(newPhotos);
    }
    setNewTag("");
  };

  const removeTag = (index: number, tagToRemove: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = {
      ...newPhotos[index],
      tags: newPhotos[index]?.tags?.filter(tag => tag !== tagToRemove) || []
    };
    onPhotosChange(newPhotos);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = { image_url: "", caption: "", tags: [] };
    onPhotosChange(newPhotos);
  };

  // Initialize empty photos array if needed
  const photosToShow = Array.from({ length: maxPhotos }, (_, i) => 
    photos[i] || { image_url: "", caption: "", tags: [] }
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Your Food Photos (up to {maxPhotos})</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your favorite food photos. Others will swipe on these without knowing who posted them!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {photosToShow.map((photo, index) => (
          <div key={index} className="glass-card p-4 space-y-3">
            {/* Photo Upload Area */}
            <div className="relative">
              <div className="w-full h-48 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {photo.image_url ? (
                  <img
                    src={photo.image_url}
                    alt={`Food photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm">Add Food Photo {index + 1}</span>
                  </div>
                )}
              </div>

              {/* Remove button */}
              {photo.image_url && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, index)}
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : photo.image_url ? 'Change Photo' : 'Upload Photo'}
            </Button>

            {/* Caption Input */}
            <Input
              placeholder="Caption (optional)"
              value={photo.caption}
              onChange={(e) => updateCaption(index, e.target.value)}
              className="w-full"
            />

            {/* Tags */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag (e.g., Sushi, Comfort, Vegan)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag(index)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => addTag(index)}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {photo.tags && photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {photo.tags.map((tag, tagIndex) => (
                    <Badge
                      key={tagIndex}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeTag(index, tag)}
                    >
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Upload clear, appetizing photos of your food. Others will see these anonymously and swipe to match!
      </p>
    </div>
  );
};