
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    showTooltip?: boolean;
    formatValue?: (value: number) => string;
  }
>(({ className, showTooltip = false, formatValue, ...props }, ref) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [hoveredThumb, setHoveredThumb] = React.useState<number | null>(null);

  const handleValueChange = (value: number[]) => {
    if (props.onValueChange) {
      props.onValueChange(value);
    }
  };

  const formatTooltipValue = (value: number) => {
    if (formatValue) return formatValue(value);
    return `₹${value.toLocaleString()}`;
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center group",
        "transition-all duration-200",
        className
      )}
      onValueChange={handleValueChange}
      onPointerDown={() => setIsDragging(true)}
      onPointerUp={() => setIsDragging(false)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary/60 transition-colors duration-200 group-hover:bg-secondary/80">
        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300 ease-out" />
      </SliderPrimitive.Track>
      
      {props.value?.map((value, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className={cn(
            "relative block h-6 w-6 rounded-full border-3 border-white bg-primary shadow-lg ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            "hover:scale-110 hover:shadow-xl hover:border-primary-glow",
            "active:scale-95",
            isDragging && "scale-110 shadow-xl border-primary-glow"
          )}
          onMouseEnter={() => setHoveredThumb(index)}
          onMouseLeave={() => setHoveredThumb(null)}
        >
          {/* Tooltip */}
          {showTooltip && (hoveredThumb === index || isDragging) && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="bg-foreground text-background px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                {formatTooltipValue(value)}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
              </div>
            </div>
          )}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
