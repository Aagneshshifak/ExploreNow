import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Hotel, MapPin, DollarSign, Star, FileText } from 'lucide-react';

const HotelSubmission = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    hotelName: '',
    location: '',
    pricePerNight: '',
    amenities: '',
    description: '',
    userId: '', // Hidden field - could be populated from auth context
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.hotelName.trim()) newErrors.hotelName = 'Hotel name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.pricePerNight || parseFloat(formData.pricePerNight) <= 0) {
      newErrors.pricePerNight = 'Valid price is required';
    }
    if (!formData.amenities.trim()) newErrors.amenities = 'Amenities are required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (images.length === 0) newErrors.images = 'At least one image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (fileList: File[]) => {
    const newImages = fileList.slice(0, 5 - images.length);
    const validImages = newImages.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isImage && isValidSize;
    });
    
    setImages(prev => [...prev, ...validImages].slice(0, 5));
    
    if (validImages.length !== newImages.length) {
      toast({
        title: "Invalid files",
        description: "Only images under 10MB are allowed",
        variant: "destructive",
      });
    }
    
    // Clear image error if files are added
    if (validImages.length > 0 && errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Hotel Submitted Successfully!",
        description: "Your hotel has been submitted for review. We'll notify you once it's approved.",
      });
      
      // Reset form
      setFormData({
        hotelName: '',
        location: '',
        pricePerNight: '',
        amenities: '',
        description: '',
        userId: '',
      });
      setImages([]);
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your hotel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      hotelName: '',
      location: '',
      pricePerNight: '',
      amenities: '',
      description: '',
      userId: '',
    });
    setImages([]);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Hotel className="h-6 w-6" />
            <h1 className="text-heading">Upload Hotel</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Hotel className="h-8 w-8" />
              Hotel Submission Form
            </CardTitle>
            <CardDescription>
              Submit your hotel for listing on ExploreNow. All submissions are reviewed before going live.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hotel Name */}
              <div className="space-y-2">
                <Label htmlFor="hotelName" className="text-sm font-medium flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  Hotel Name *
                </Label>
                <Input
                  id="hotelName"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  placeholder="Enter hotel name"
                  className={errors.hotelName ? "border-destructive" : ""}
                />
                {errors.hotelName && (
                  <p className="text-sm text-destructive">{errors.hotelName}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className={errors.location ? "border-destructive" : ""}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
              </div>

              {/* Price per Night */}
              <div className="space-y-2">
                <Label htmlFor="pricePerNight" className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price per Night (USD) *
                </Label>
                <Input
                  id="pricePerNight"
                  name="pricePerNight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerNight}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={errors.pricePerNight ? "border-destructive" : ""}
                />
                {errors.pricePerNight && (
                  <p className="text-sm text-destructive">{errors.pricePerNight}</p>
                )}
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label htmlFor="amenities" className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Amenities *
                </Label>
                <Input
                  id="amenities"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleInputChange}
                  placeholder="WiFi, Pool, Gym, Spa, Restaurant (separate by commas)"
                  className={errors.amenities ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Separate amenities by commas
                </p>
                {errors.amenities && (
                  <p className="text-sm text-destructive">{errors.amenities}</p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Hotel Images * ({images.length}/5)
                </Label>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : errors.images 
                        ? 'border-destructive' 
                        : 'border-border hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">
                    Drag & drop images here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Max 5 images, 10MB each. JPG, PNG supported.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= 5}
                  >
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                </div>
                
                {errors.images && (
                  <p className="text-sm text-destructive">{errors.images}</p>
                )}

                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your hotel, its unique features, location highlights..."
                  rows={4}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="sm:w-auto"
                >
                  Reset Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HotelSubmission;