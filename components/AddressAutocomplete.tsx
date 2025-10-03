"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  onSelect: (address: string, lat: number, lng: number) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  onSelect,
  value,
  onChange,
  placeholder = "Enter salon address",
  className,
  error,
  disabled,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.warn("Google Maps API key not configured");
          return;
        }

        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
        });

        await loader.load();

        if (!inputRef.current) return;

        // Create autocomplete
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "us" }, // Restrict to US
          fields: ["formatted_address", "geometry", "name"],
          types: ["address"],
        });

        autocompleteRef.current = autocomplete;

        // Listen for place selection
        autocomplete.addListener("place_changed", () => {
          setIsLoading(true);
          const place = autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            console.error("No location data for selected place");
            setIsLoading(false);
            return;
          }

          const address = place.formatted_address || place.name || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          onChange(address);
          onSelect(address, lat, lng);
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Autocomplete initialization error:", err);
      }
    };

    initAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onSelect, onChange]);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pl-10 ${error ? "border-red-500" : ""} ${className}`}
          disabled={disabled || isLoading}
          aria-label="Address"
          aria-invalid={!!error}
          aria-describedby={error ? "address-error" : undefined}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>
      {error && (
        <p id="address-error" className="text-sm text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}



