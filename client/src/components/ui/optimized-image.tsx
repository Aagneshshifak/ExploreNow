import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3C/svg%3E",
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder);
  const [isLoaded, setIsLoaded] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  const getOptimizedUrl = (url: string) => {
    // For Unsplash images, add optimization parameters
    if (url.includes("unsplash.com")) {
      const baseUrl = url.split("?")[0];
      const params = new URLSearchParams({
        w: width?.toString() || "800",
        h: height?.toString() || "600",
        fit: "crop",
        auto: "format",
        q: "75",
      });
      return `${baseUrl}?${params.toString()}`;
    }
    return url;
  };

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden bg-gray-100", className)}>
      <img
        src={getOptimizedUrl(imageSrc)}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          !isLoaded && "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        loading={priority ? "eager" : "lazy"}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
}