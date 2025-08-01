import { useState } from 'react';
import { Globe, Copy, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'tr', name: 'Turkish' }
];

const TextTranslator = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [fromLanguage, setFromLanguage] = useState('en');
  const [toLanguage, setToLanguage] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to translate.",
        variant: "destructive"
      });
      return;
    }

    setIsTranslating(true);
    
    // Simulate translation API call
    setTimeout(() => {
      // Mock translation for demo purposes
      const translations: { [key: string]: string } = {
        'hello': 'hola',
        'thank you': 'gracias',
        'good morning': 'buenos días',
        'where is the bathroom': 'dónde está el baño',
        'how much does this cost': 'cuánto cuesta esto',
        'i need help': 'necesito ayuda',
        'excuse me': 'disculpe',
        'do you speak english': 'hablas inglés'
      };
      
      const mockResult = translations[inputText.toLowerCase()] || 
        `[Translated: ${inputText}]`;
      
      setOutputText(mockResult);
      setIsTranslating(false);
    }, 1500);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Translation copied to clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Globe className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Text Translator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Instantly translate words or phrases into your preferred language — perfect for travelers on the go.
          </p>
        </div>

        {/* Main Translation Interface */}
        <div className="max-w-4xl mx-auto">
          <Card className="border border-border bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-card-foreground">Quick Translation</CardTitle>
              <CardDescription>
                Enter your text and select languages to get instant translations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="from-language">
                    From
                  </label>
                  <Select value={fromLanguage} onValueChange={setFromLanguage}>
                    <SelectTrigger id="from-language" aria-label="Select source language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="to-language">
                    To
                  </label>
                  <Select value={toLanguage} onValueChange={setToLanguage}>
                    <SelectTrigger id="to-language" aria-label="Select target language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Input Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="input-text">
                  Enter text to translate
                </label>
                <Textarea
                  id="input-text"
                  placeholder="Enter text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[120px] resize-none"
                  aria-label="Text to translate"
                />
              </div>

              {/* Translate Button */}
              <Button
                onClick={handleTranslate}
                disabled={isTranslating || !inputText.trim()}
                className="w-full bg-foreground text-background hover:opacity-90 font-semibold"
                aria-label="Translate text"
              >
                {isTranslating ? "Translating..." : "Translate"}
              </Button>

              {/* Output Section */}
              {outputText && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Translation
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2"
                      aria-label="Copy translation"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <Textarea
                    value={outputText}
                    readOnly
                    className="min-h-[120px] resize-none bg-muted"
                    aria-label="Translated text"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Phrases Section */}
          <Card className="mt-8 border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-card-foreground">Common Travel Phrases</CardTitle>
              <CardDescription>
                Click any phrase to translate it quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Hello",
                  "Thank you",
                  "Excuse me",
                  "Where is the bathroom?",
                  "How much does this cost?",
                  "Do you speak English?",
                  "I need help",
                  "Good morning"
                ].map((phrase) => (
                  <Button
                    key={phrase}
                    variant="outline"
                    className="text-left justify-start"
                    onClick={() => setInputText(phrase)}
                    aria-label={`Set phrase: ${phrase}`}
                  >
                    {phrase}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TextTranslator;