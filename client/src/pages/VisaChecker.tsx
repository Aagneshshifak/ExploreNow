import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, FileText, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VisaRequirement {
  required: boolean;
  type: string;
  processingTime: string;
  documents: string[];
  fees: string;
  additionalInfo?: string;
}

export default function VisaChecker() {
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [requirement, setRequirement] = useState<VisaRequirement | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'South Korea',
    'China', 'India', 'Brazil', 'Mexico', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Sweden',
    'Norway', 'Denmark', 'Finland', 'Russia', 'Turkey', 'Egypt', 'South Africa', 'Thailand', 'Vietnam',
    'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'New Zealand', 'Ireland', 'Belgium', 'Austria'
  ];

  const checkVisa = () => {
    if (!nationality || !destination) return;

    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock data based on common visa requirements
      const mockRequirements: { [key: string]: VisaRequirement } = {
        'default_required': {
          required: true,
          type: 'Tourist Visa',
          processingTime: '5-10 business days',
          documents: [
            'Valid passport (6+ months validity)',
            'Completed visa application form',
            'Recent passport-sized photographs',
            'Proof of accommodation',
            'Return flight tickets',
            'Bank statements (last 3 months)',
            'Travel insurance'
          ],
          fees: '$60 - $150',
          additionalInfo: 'Visa approval is subject to embassy discretion and individual circumstances.'
        },
        'default_not_required': {
          required: false,
          type: 'Visa-free entry',
          processingTime: 'Immediate',
          documents: [
            'Valid passport (6+ months validity)',
            'Return flight tickets',
            'Proof of sufficient funds'
          ],
          fees: 'Free',
          additionalInfo: 'Stay period typically limited to 30-90 days for tourism purposes.'
        },
        'default_visa_on_arrival': {
          required: true,
          type: 'Visa on Arrival',
          processingTime: '30-60 minutes at airport',
          documents: [
            'Valid passport (6+ months validity)',
            'Return flight tickets',
            'Passport-sized photographs',
            'Proof of accommodation',
            'Cash for visa fee'
          ],
          fees: '$25 - $100',
          additionalInfo: 'Available at major international airports and border crossings.'
        }
      };

      // Simple logic to determine visa requirement
      const sameCountry = nationality === destination;
      const random = Math.random();
      
      let result: VisaRequirement;
      if (sameCountry) {
        result = {
          required: false,
          type: 'Domestic travel',
          processingTime: 'No visa required',
          documents: ['Valid government-issued ID'],
          fees: 'Free',
          additionalInfo: 'No visa required for domestic travel within your country.'
        };
      } else if (random < 0.3) {
        result = mockRequirements.default_not_required;
      } else if (random < 0.6) {
        result = mockRequirements.default_visa_on_arrival;
      } else {
        result = mockRequirements.default_required;
      }

      setRequirement(result);
      setIsChecking(false);
    }, 1500);
  };

  const getStatusIcon = () => {
    if (!requirement) return null;
    
    if (!requirement.required) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (requirement.type === 'Visa on Arrival') {
      return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    } else {
      return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!requirement) return 'bg-muted/50';
    
    if (!requirement.required) {
      return 'bg-green-500/10 dark:bg-green-500/20 border-green-500/20';
    } else if (requirement.type === 'Visa on Arrival') {
      return 'bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/20';
    } else {
      return 'bg-red-500/10 dark:bg-red-500/20 border-red-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-display mb-4">Visa Requirement Checker</h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Check visa requirements, processing times, and required documents for your travel destination.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="shadow-elegant-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Travel Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Nationality</label>
                  <Select onValueChange={setNationality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination Country</label>
                  <Select onValueChange={setDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  onClick={checkVisa}
                  disabled={!nationality || !destination || isChecking}
                  className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Check visa requirements for selected countries"
                >
                  {isChecking ? 'Checking Requirements...' : 'Check Visa'}
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-elegant-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Visa Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requirement ? (
                  <div className="space-y-6">
                    {/* Status Header */}
                    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon()}
                        <div>
                          <h3 className="font-semibold text-lg">{requirement.type}</h3>
                          <p className="text-sm text-muted-foreground">
                            {requirement.required ? 'Visa required' : 'No visa required'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Processing Time */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Processing Time</span>
                      </h4>
                      <p className="text-muted-foreground">{requirement.processingTime}</p>
                    </div>

                    {/* Fees */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Visa Fees</h4>
                      <p className="text-muted-foreground">{requirement.fees}</p>
                    </div>

                    {/* Required Documents */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Required Documents</h4>
                      <ul className="space-y-1">
                        {requirement.documents.map((doc, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Additional Info */}
                    {requirement.additionalInfo && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Important:</strong> {requirement.additionalInfo}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select your nationality and destination to check visa requirements
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}