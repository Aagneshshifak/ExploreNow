import { useState } from 'react';
import { Upload, Package, Building, Plus, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface UploadForm {
  name: string;
  description: string;
  price: string;
  duration: string;
  image: File | null;
  location?: string;
  amenities?: string;
}

const AdminUploadDashboard = () => {
  const [tripForm, setTripForm] = useState<UploadForm>({
    name: '',
    description: '',
    price: '',
    duration: '',
    image: null,
    location: ''
  });

  const [hotelForm, setHotelForm] = useState<UploadForm>({
    name: '',
    description: '',
    price: '',
    duration: '',
    image: null,
    location: '',
    amenities: ''
  });

  const [dragOver, setDragOver] = useState<'trip' | 'hotel' | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent, type: 'trip' | 'hotel') => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'trip' | 'hotel') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      if (type === 'trip') {
        setTripForm(prev => ({ ...prev, image: imageFile }));
      } else {
        setHotelForm(prev => ({ ...prev, image: imageFile }));
      }
      toast({
        title: "Image Added",
        description: `${imageFile.name} has been added to ${type} upload.`
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'trip' | 'hotel') => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (type === 'trip') {
        setTripForm(prev => ({ ...prev, image: file }));
      } else {
        setHotelForm(prev => ({ ...prev, image: file }));
      }
      toast({
        title: "Image Selected",
        description: `${file.name} has been selected for ${type} upload.`
      });
    }
  };

  const handleSubmit = async (type: 'trip' | 'hotel') => {
    const form = type === 'trip' ? tripForm : hotelForm;
    
    if (!form.name || !form.description || !form.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Upload Successful",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} "${form.name}" has been uploaded successfully.`
      });

      // Reset form
      const resetForm = {
        name: '',
        description: '',
        price: '',
        duration: '',
        image: null,
        location: '',
        amenities: ''
      };

      if (type === 'trip') {
        setTripForm(resetForm);
      } else {
        setHotelForm(resetForm);
      }
    }, 2000);
  };

  const updateForm = (type: 'trip' | 'hotel', field: keyof UploadForm, value: string) => {
    if (type === 'trip') {
      setTripForm(prev => ({ ...prev, [field]: value }));
    } else {
      setHotelForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const renderUploadForm = (type: 'trip' | 'hotel') => {
    const form = type === 'trip' ? tripForm : hotelForm;
    const icon = type === 'trip' ? Package : Building;
    const IconComponent = icon;

    return (
      <Card className="border border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl text-card-foreground">
                Upload {type.charAt(0).toUpperCase() + type.slice(1)}
              </CardTitle>
              <CardDescription>
                Add a new {type} to the platform
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${type}-name`} className="text-sm font-medium text-foreground">
                {type.charAt(0).toUpperCase() + type.slice(1)} Name *
              </Label>
              <Input
                id={`${type}-name`}
                placeholder={`Enter ${type} name`}
                value={form.name}
                onChange={(e) => updateForm(type, 'name', e.target.value)}
                aria-label={`${type} name`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${type}-price`} className="text-sm font-medium text-foreground">
                Price (₹) *
              </Label>
              <Input
                id={`${type}-price`}
                type="number"
                placeholder="Enter price"
                value={form.price}
                onChange={(e) => updateForm(type, 'price', e.target.value)}
                aria-label={`${type} price`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${type}-location`} className="text-sm font-medium text-foreground">
                Location
              </Label>
              <Input
                id={`${type}-location`}
                placeholder="Enter location"
                value={form.location || ''}
                onChange={(e) => updateForm(type, 'location', e.target.value)}
                aria-label={`${type} location`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${type}-duration`} className="text-sm font-medium text-foreground">
                Duration
              </Label>
              <Input
                id={`${type}-duration`}
                placeholder={type === 'trip' ? 'e.g., 5 days' : 'e.g., per night'}
                value={form.duration}
                onChange={(e) => updateForm(type, 'duration', e.target.value)}
                aria-label={`${type} duration`}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor={`${type}-description`} className="text-sm font-medium text-foreground">
              Description *
            </Label>
            <Textarea
              id={`${type}-description`}
              placeholder={`Describe the ${type}...`}
              value={form.description}
              onChange={(e) => updateForm(type, 'description', e.target.value)}
              className="min-h-[100px]"
              aria-label={`${type} description`}
            />
          </div>

          {/* Hotel-specific fields */}
          {type === 'hotel' && (
            <div className="space-y-2">
              <Label htmlFor="hotel-amenities" className="text-sm font-medium text-foreground">
                Amenities
              </Label>
              <Textarea
                id="hotel-amenities"
                placeholder="List amenities (e.g., WiFi, Pool, Gym, Spa...)"
                value={form.amenities || ''}
                onChange={(e) => updateForm(type, 'amenities', e.target.value)}
                className="min-h-[80px]"
                aria-label="Hotel amenities"
              />
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Upload Image
            </Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver === type
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={(e) => handleDragOver(e, type)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, type)}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {form.image ? (
                  <span className="flex items-center justify-center gap-2 text-foreground">
                    <Check className="w-4 h-4" />
                    {form.image.name}
                  </span>
                ) : (
                  'Drag and drop an image here, or click to select'
                )}
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, type)}
                className="hidden"
                id={`${type}-file-input`}
              />
              <Label
                htmlFor={`${type}-file-input`}
                className="inline-block cursor-pointer"
              >
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => handleSubmit(type)}
            disabled={isUploading}
            className="w-full bg-foreground text-background hover:opacity-90 font-semibold"
            aria-label={`Submit ${type} upload`}
          >
            {isUploading ? (
              `Uploading ${type.charAt(0).toUpperCase() + type.slice(1)}...`
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Submit {type.charAt(0).toUpperCase() + type.slice(1)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Admin Upload Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload and manage trips and hotels on the platform with ease.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="trip" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="trip" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Upload Trip
              </TabsTrigger>
              <TabsTrigger value="hotel" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Upload Hotel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trip">
              {renderUploadForm('trip')}
            </TabsContent>

            <TabsContent value="hotel">
              {renderUploadForm('hotel')}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminUploadDashboard;