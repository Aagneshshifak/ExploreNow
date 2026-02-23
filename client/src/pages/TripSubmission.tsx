import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Plus, X, Plane } from "lucide-react";
import { insertTripSchema, type InsertTrip, type Hotel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function TripSubmission() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [includes, setIncludes] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newInclude, setNewInclude] = useState("");

  const form = useForm<InsertTrip>({
    resolver: zodResolver(insertTripSchema),
    defaultValues: {
      duration: 3,
      tags: [],
      includes: [],
    },
  });

  // Fetch hotels for selection
  const { data: hotels } = useQuery({
    queryKey: ["/api/hotels"],
  });

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              Only administrators can submit trips. Please log in as an admin.
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

  const createTripMutation = useMutation({
    mutationFn: (data: InsertTrip) => apiRequest("/api/trips", "POST", data),
    onSuccess: () => {
      toast({
        title: "Trip Created!",
        description: "The trip has been successfully added to the platform.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      navigate("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "There was an error creating the trip.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTrip) => {
    const tripData = {
      ...data,
      tags,
      includes,
    };
    createTripMutation.mutate(tripData);
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

  const addInclude = () => {
    if (newInclude.trim() && !includes.includes(newInclude.trim())) {
      setIncludes([...includes, newInclude.trim()]);
      setNewInclude("");
    }
  };

  const removeInclude = (includeToRemove: string) => {
    setIncludes(includes.filter(include => include !== includeToRemove));
  };

  // Predefined tag suggestions
  const commonTags = [
    "adventure", "beach", "mountain", "culture", "food", "nature", 
    "luxury", "budget", "family", "romance", "wildlife", "historical"
  ];

  const commonIncludes = [
    "Accommodation", "Meals", "Transport", "Guide", "Activities", 
    "Insurance", "Airport Transfer", "Sightseeing"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Create New Trip
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Add an exciting new travel destination for adventurers to explore
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Trip Information
            </CardTitle>
            <CardDescription>
              Fill in the details about the trip you want to create
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Amazing Bali Adventure" {...field} />
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
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="Bali, Indonesia" {...field} />
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
                          placeholder="Describe the trip, what travelers will experience, and what makes it special..."
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

                {/* Pricing and Duration */}
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Person ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="999.99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="30" 
                            placeholder="7" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
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
                        <FormLabel>Cover Image URL</FormLabel>
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
                  <FormLabel>Trip Tags</FormLabel>
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
                  
                  {/* Common tags */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quick add:</p>
                    <div className="flex flex-wrap gap-2">
                      {commonTags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => {
                            if (!tags.includes(tag)) {
                              setTags([...tags, tag]);
                            }
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
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

                {/* Includes */}
                <div className="space-y-3">
                  <FormLabel>What's Included</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="What's included in the trip..."
                      value={newInclude}
                      onChange={(e) => setNewInclude(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())}
                    />
                    <Button type="button" onClick={addInclude} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Common includes */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quick add:</p>
                    <div className="flex flex-wrap gap-2">
                      {commonIncludes.map((include) => (
                        <Badge 
                          key={include} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => {
                            if (!includes.includes(include)) {
                              setIncludes([...includes, include]);
                            }
                          }}
                        >
                          {include}
                        </Badge>
                      ))}
                    </div>
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

                {/* Trip Preview */}
                {form.watch("title") && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Trip Preview</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Title:</strong> {form.watch("title")}</p>
                      <p><strong>Location:</strong> {form.watch("location")}</p>
                      <p><strong>Duration:</strong> {form.watch("duration")} days</p>
                      <p><strong>Price:</strong> ${form.watch("price")}</p>
                      {tags.length > 0 && (
                        <p><strong>Tags:</strong> {tags.join(", ")}</p>
                      )}
                    </div>
                  </div>
                )}

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
                    disabled={createTripMutation.isPending}
                    className="flex-1"
                  >
                    {createTripMutation.isPending ? "Creating..." : "Create Trip"}
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