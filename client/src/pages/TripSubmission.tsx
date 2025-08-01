import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Compass, MapPin, DollarSign, Calendar, Tag, FileText, User } from 'lucide-react';

const TripSubmission = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    tripTitle: '',
    destination: '',
    duration: '',
    price: '',
    category: '',
    inclusions: '',
    summary: '',
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const tripCategories = [
    'Family',
    'Solo',
    'Adventure',
    'Romantic',
    'Business',
    'Luxury',
    'Budget',
    'Cultural',
    'Nature',
    'Beach',
    'Mountain',
    'City Break'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.tripTitle.trim()) newErrors.tripTitle = 'Trip title is required';
    if (!formData.destination.trim()) newErrors.destination = 'Destination is required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.inclusions.trim()) newErrors.inclusions = 'Inclusions are required';
    if (!formData.summary.trim()) newErrors.summary = 'Summary is required';
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
        title: "Trip Package Created Successfully!",
        description: "Your trip package has been submitted for review. We'll notify you once it's approved.",
      });
      
      // Reset form
      setFormData({
        tripTitle: '',
        destination: '',
        duration: '',
        price: '',
        category: '',
        inclusions: '',
        summary: '',
      });
      setImages([]);
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error creating your trip package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tripTitle: '',
      destination: '',
      duration: '',
      price: '',
      category: '',
      inclusions: '',
      summary: '',
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
            <Compass className="h-6 w-6" />
            <h1 className="text-heading">Upload Trip Package</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Compass className="h-8 w-8" />
              Trip Package Submission Form
            </CardTitle>
            <CardDescription>
              Create and submit your trip package for listing on ExploreNow. All packages are reviewed before going live.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Current User Info */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Creating trip package as: <strong className="text-foreground">user@example.com</strong></span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Title */}
              <div className="space-y-2">
                <Label htmlFor="tripTitle" className="text-sm font-medium flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  Trip Title *
                </Label>
                <Input
                  id="tripTitle"
                  name="tripTitle"
                  value={formData.tripTitle}
                  onChange={handleInputChange}
                  placeholder="Amazing 5-Day Paris Adventure"
                  className={errors.tripTitle ? "border-destructive" : ""}
                />
                {errors.tripTitle && (
                  <p className="text-sm text-destructive">{errors.tripTitle}</p>
                )}
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Destination *
                </Label>
                <Input
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="Paris, France"
                  className={errors.destination ? "border-destructive" : ""}
                />
                {errors.destination && (
                  <p className="text-sm text-destructive">{errors.destination}</p>
                )}
              </div>

              {/* Duration and Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Duration *
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="5 Days"
                    className={errors.duration ? "border-destructive" : ""}
                  />
                  {errors.duration && (
                    <p className="text-sm text-destructive">{errors.duration}</p>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price (USD) *
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="1299.00"
                    className={errors.price ? "border-destructive" : ""}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category *
                </Label>
                <Select onValueChange={handleSelectChange} value={formData.category}>
                  <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select trip category" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Inclusions */}
              <div className="space-y-2">
                <Label htmlFor="inclusions" className="text-sm font-medium">
                  Inclusions *
                </Label>
                <Textarea
                  id="inclusions"
                  name="inclusions"
                  value={formData.inclusions}
                  onChange={handleInputChange}
                  placeholder="• 4-star hotel accommodation&#10;• Daily breakfast&#10;• Airport transfers&#10;• City tour guide&#10;• Museum tickets"
                  rows={4}
                  className={errors.inclusions ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  List what's included in the package (accommodation, meals, transfers, activities, etc.)
                </p>
                {errors.inclusions && (
                  <p className="text-sm text-destructive">{errors.inclusions}</p>
                )}
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Cover Images * ({images.length}/5)
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
                    Drag & drop cover images here, or click to select
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

              {/* Summary/Highlights */}
              <div className="space-y-2">
                <Label htmlFor="summary" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Trip Summary & Highlights *
                </Label>
                <Textarea
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="Experience the magic of Paris with this carefully curated 5-day adventure. Visit iconic landmarks like the Eiffel Tower and Louvre Museum, enjoy authentic French cuisine, and explore charming neighborhoods..."
                  rows={5}
                  className={errors.summary ? "border-destructive" : ""}
                />
                {errors.summary && (
                  <p className="text-sm text-destructive">{errors.summary}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                >
                  {isSubmitting ? 'Creating Trip...' : 'Create Trip Package'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="sm:w-auto"
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TripSubmission;