
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";

const VisaWizard = () => {
  const [passportCountry, setPassportCountry] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const countries = [
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "TH", name: "Thailand", flag: "🇹🇭" },
    { code: "SG", name: "Singapore", flag: "🇸🇬" }
  ];

  const visaData = {
    "IN-US": {
      required: true,
      type: "Tourist Visa (B1/B2)",
      processingTime: "3-5 weeks",
      documents: ["Valid passport", "DS-160 form", "Photo", "Financial documents", "Travel itinerary"],
      fees: "$160"
    },
    "IN-UK": {
      required: true,
      type: "Standard Visitor Visa",
      processingTime: "3 weeks",
      documents: ["Valid passport", "Application form", "Photo", "Financial documents", "Travel plans"],
      fees: "£100"
    },
    "IN-TH": {
      required: false,
      type: "Visa on Arrival",
      processingTime: "On arrival",
      documents: ["Valid passport", "Return ticket", "Hotel booking"],
      fees: "Free for 30 days"
    },
    "IN-SG": {
      required: false,
      type: "Visa-free entry",
      processingTime: "N/A",
      documents: ["Valid passport", "Return ticket"],
      fees: "Free for 30 days"
    }
  };

  const handleCheck = () => {
    if (!passportCountry || !destination) return;
    
    setLoading(true);
    setTimeout(() => {
      const key = `${passportCountry}-${destination}`;
      const data = visaData[key] || {
        required: true,
        type: "Tourist Visa",
        processingTime: "2-4 weeks",
        documents: ["Valid passport", "Application form", "Photo", "Financial documents"],
        fees: "Varies"
      };
      
      setResult(data);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Your Passport Country</Label>
          <Select onValueChange={setPassportCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center space-x-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Destination Country</Label>
          <Select onValueChange={setDestination}>
            <SelectTrigger>
              <SelectValue placeholder="Where are you traveling?" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center space-x-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleCheck} 
          className="w-full"
          disabled={!passportCountry || !destination || loading}
        >
          {loading ? "Checking..." : "Check Visa Requirements"}
        </Button>
      </div>

      {result && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Visa Requirements</h3>
              <Badge variant={result.required ? "destructive" : "default"} className="flex items-center space-x-1">
                {result.required ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span>{result.required ? "Visa Required" : "No Visa Required"}</span>
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Visa Type</span>
                </div>
                <p className="text-muted-foreground">{result.type}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Processing Time</span>
                </div>
                <p className="text-muted-foreground">{result.processingTime}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Required Documents</h4>
                <ul className="space-y-1">
                  {result.documents.map((doc, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-medium">Visa Fees</span>
                <span className="text-lg font-semibold text-primary">{result.fees}</span>
              </div>

              {result.required && (
                <Button className="w-full mt-4" variant="outline">
                  Get Help with Visa Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VisaWizard;
