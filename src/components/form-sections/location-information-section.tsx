"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { CountrySelector } from "@/components/ui/country-selector";
import { StudentFormData } from "../enhanced-student-dialog";

interface LocationInformationSectionProps {
  formData: StudentFormData;
  onFieldChange: (field: keyof StudentFormData, value: any) => void;
}

export default function LocationInformationSection({
  formData,
  onFieldChange
}: Readonly<LocationInformationSectionProps>) {
  const handleCountryChange = (country: any) => {
    if (country) {
      onFieldChange('country', country.value);
      onFieldChange('country_code', country.countryCode);
    } else {
      onFieldChange('country', '');
      onFieldChange('country_code', '');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location Information
        </CardTitle>
        <CardDescription className="text-xs">Where the student lives and studies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nationality" className="text-sm font-medium">Nationality</Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => onFieldChange('nationality', e.target.value)}
              placeholder="American"
            />
          </div>

          <div>
            <CountrySelector
              value={formData.country}
              onChange={handleCountryChange}
              placeholder="Search and select a country..."
              label="Country"
            />
          </div>

          <div>
            <Label htmlFor="city" className="text-sm font-medium">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onFieldChange('city', e.target.value)}
              placeholder="New York"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
