import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Building, Plus, X } from "lucide-react";
import { insertHotelSchema, type InsertHotel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function HotelSubmission() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [includes, setIncludes] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [newInclude, setNewInclude] = useState("");

  const form = useForm<InsertHotel>({
    resolver: zodResolver(insertHotelSchema),
    defaultValues: {
      rating: "4.0",
      tags: [],
      amenities: [],
      includes: [],
    },
  });

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              Only administrators can submit hotels. Please log in as an admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/login")} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createHotelMutation = useMutation({
    mutationFn: (data: InsertHotel) => apiRequest("/api/hotels", "POST", data),
    onSuccess: () => {
      toast({
        title: "Hotel Created!",
        description: "The hotel has been successfully added to the platform.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      navigate("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "There was an error creating the hotel.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertHotel) => {
    const hotelData = {
      ...data,
      tags,
      amenities,
      includes,
    };
    createHotelMutation.mutate(hotelData);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const removeAmenity = (amenityToRemove: string) => {
    setAmenities(amenities.filter(amenity => amenity !== amenityToRemove));
  };

  const addInclude = () => {
    if (newInclude.trim() && !includes.includes(newInclude.trim())) {
      setIncludes([...includes, newInclude.trim()]);
      setNewInclude("");
    }
  };

  const removeInclude = (includeToRemove: string) => {
    setIncludes(includes.filter(include => include !== includeToRemove));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Add New Hotel
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create a new hotel listing for travelers to discover
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Hotel Information
            </CardTitle>
            <CardDescription>
              Fill in the details about the hotel you want to add
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hotel Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Grand Palace Hotel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="New York, USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the hotel, its features, and what makes it special..."
                          className="resize-none"
                          rows={4}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pricing and Rating */}
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Night ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="199.99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating (1-5)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            min="1" 
                            max="5" 
                            placeholder="4.5" 
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <FormLabel>Tags</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer">
                        {tag}
                        <X 
                          className="h-3 w-3 ml-1" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <FormLabel>Amenities</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an amenity..."
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                    />
                    <Button type="button" onClick={addAmenity} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="cursor-pointer">
                        {amenity}
                        <X 
                          className="h-3 w-3 ml-1" 
                          onClick={() => removeAmenity(amenity)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Includes */}
                <div className="space-y-3">
                  <FormLabel>What's Included</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="What's included in the stay..."
                      value={newInclude}
                      onChange={(e) => setNewInclude(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())}
                    />
                    <Button type="button" onClick={addInclude} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {includes.map((include) => (
                      <Badge key={include} variant="default" className="cursor-pointer">
                        {include}
                        <X 
                          className="h-3 w-3 ml-1" 
                          onClick={() => removeInclude(include)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/admin")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createHotelMutation.isPending}
                    className="flex-1"
                  >
                    {createHotelMutation.isPending ? "Creating..." : "Create Hotel"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}