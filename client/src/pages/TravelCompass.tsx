import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { CalendarIcon, Plus, Trash2, MapPin, Users, DollarSign, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ItineraryDay {
  day: number
  title: string
  activities: string
}

interface TripPlanForm {
  tripName: string
  destination: string
  startDate: Date
  endDate: Date
  travelers: number
  budget: number
  preferences: string
  itinerary: ItineraryDay[]
}

export default function TravelCompass() {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { day: 1, title: '', activities: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TripPlanForm>()

  const addItineraryDay = () => {
    setItinerary(prev => [
      ...prev,
      { day: prev.length + 1, title: '', activities: '' }
    ])
  }

  const removeItineraryDay = (index: number) => {
    if (itinerary.length > 1) {
      setItinerary(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, day: i + 1 })))
    }
  }

  const updateItinerary = (index: number, field: 'title' | 'activities', value: string) => {
    setItinerary(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const onSubmit = async (data: TripPlanForm) => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing Dates",
        description: "Please select both start and end dates",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const tripPlan = {
        ...data,
        startDate,
        endDate,
        itinerary
      }
      
      console.log('Trip Plan Submitted:', tripPlan)
      
      toast({
        title: "Trip Plan Created!",
        description: "Your custom trip plan has been saved successfully.",
      })
      
      // Reset form
      reset()
      setStartDate(undefined)
      setEndDate(undefined)
      setItinerary([{ day: 1, title: '', activities: '' }])
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save trip plan. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your trip plan has been saved as a draft.",
    })
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-heading mb-4">Create Custom Trip Plan</h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Design your perfect journey with our comprehensive trip planning tool. 
            Customize every detail from destinations to daily itineraries.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-subheading mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Trip Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tripName">Trip Name</Label>
                <Input
                  id="tripName"
                  placeholder="My Amazing Adventure"
                  {...register('tripName', { required: 'Trip name is required' })}
                  className={cn(errors.tripName && "border-destructive")}
                />
                {errors.tripName && (
                  <p className="text-sm text-destructive">{errors.tripName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="Tokyo, Japan"
                  {...register('destination', { required: 'Destination is required' })}
                  className={cn(errors.destination && "border-destructive")}
                />
                {errors.destination && (
                  <p className="text-sm text-destructive">{errors.destination.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < (startDate || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelers">Number of Travelers</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="travelers"
                    type="number"
                    min="1"
                    placeholder="2"
                    className="pl-10"
                    {...register('travelers', { 
                      required: 'Number of travelers is required',
                      min: { value: 1, message: 'At least 1 traveler required' }
                    })}
                  />
                </div>
                {errors.travelers && (
                  <p className="text-sm text-destructive">{errors.travelers.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Estimated Budget (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    placeholder="2500"
                    className="pl-10"
                    {...register('budget', { 
                      required: 'Budget is required',
                      min: { value: 0, message: 'Budget must be positive' }
                    })}
                  />
                </div>
                {errors.budget && (
                  <p className="text-sm text-destructive">{errors.budget.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6">
            <h2 className="text-subheading mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preferences & Notes
            </h2>
            
            <div className="space-y-2">
              <Label htmlFor="preferences">
                Special preferences, dietary requirements, accessibility needs, etc.
              </Label>
              <Textarea
                id="preferences"
                placeholder="e.g., Vegetarian meals, wheelchair accessibility, cultural experiences, adventure activities..."
                rows={4}
                {...register('preferences')}
              />
            </div>
          </Card>

          {/* Dynamic Itinerary Builder */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-subheading flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Daily Itinerary
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItineraryDay}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Day
              </Button>
            </div>

            <div className="space-y-4">
              {itinerary.map((day, index) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Day {day.day}</h3>
                    {itinerary.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItineraryDay(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day Title</Label>
                      <Input
                        placeholder="e.g., Exploring Tokyo"
                        value={day.title}
                        onChange={(e) => updateItinerary(index, 'title', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-1">
                      <Label>Activities</Label>
                      <Textarea
                        placeholder="Morning: Visit temples, Afternoon: Shopping in Shibuya, Evening: Traditional dinner"
                        rows={3}
                        value={day.activities}
                        onChange={(e) => updateItinerary(index, 'activities', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-8"
            >
              Save Draft
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-8"
            >
              {isSubmitting ? 'Creating Plan...' : 'Submit Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}