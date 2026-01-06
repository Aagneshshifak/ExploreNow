import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Languages, ArrowRightLeft, Copy, Volume2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("fr");
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const supportedLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
  ];

  const quickPhrases = [
    { en: "Hello, how are you?", category: "Greetings" },
    { en: "Where is the nearest hotel?", category: "Travel" },
    { en: "How much does this cost?", category: "Shopping" },
    { en: "Can you help me?", category: "Help" },
    { en: "I would like to book a trip", category: "Travel" },
    { en: "What time does it open?", category: "Information" },
    { en: "Thank you very much", category: "Greetings" },
    { en: "Excuse me", category: "Polite" },
  ];

  const translateText = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Enter Text",
        description: "Please enter text to translate.",
        variant: "destructive",
      });
      return;
    }

    if (sourceLang === targetLang) {
      toast({
        title: "Language Error",
        description: "Source and target languages cannot be the same.",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    try {
      const response = await apiRequest("/api/translate", "POST", {
        text: sourceText,
        sourceLang,
        targetLang,
      });
      
      setTranslatedText(response.translatedText || "Translation not available");
      
      toast({
        title: "Translation Complete",
        description: "Your text has been successfully translated.",
      });
    } catch (error: any) {
      toast({
        title: "Translation Failed",
        description: error.message || "Unable to translate text.",
        variant: "destructive",
      });
      setTranslatedText("");
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    const tempLang = sourceLang;
    const tempText = sourceText;
    
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Text copied to clipboard.",
      });
    });
  };

  const useQuickPhrase = (phrase: string) => {
    setSourceText(phrase);
  };

  const clearAll = () => {
    setSourceText("");
    setTranslatedText("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Languages className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              Multi-Language Translator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Translate text between 9 supported languages for your travels
          </p>
        </div>

        {/* Language Selection */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium mb-2 block">From</label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          {lang.flag} {lang.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={swapLanguages}
                className="mt-6"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium mb-2 block">To</label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          {lang.flag} {lang.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Phrases */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Quick Phrases</CardTitle>
                <CardDescription>
                  Click to use common travel phrases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quickPhrases.map((phrase, index) => (
                    <div key={index} className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full text-left h-auto p-3 justify-start"
                        onClick={() => useQuickPhrase(phrase.en)}
                      >
                        <div>
                          <div className="text-sm">{phrase.en}</div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {phrase.category}
                          </Badge>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Translation Interface */}
          <div className="lg:col-span-2">
            <div className="grid gap-6">
              {/* Source Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {supportedLanguages.find(l => l.code === sourceLang)?.flag}
                    {supportedLanguages.find(l => l.code === sourceLang)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter text to translate..."
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className="min-h-32 resize-none"
                    maxLength={5000}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-500">
                      {sourceText.length}/5000 characters
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearAll}>
                        Clear
                      </Button>
                      <Button 
                        onClick={translateText} 
                        disabled={isTranslating || !sourceText.trim()}
                      >
                        {isTranslating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Translating...
                          </>
                        ) : (
                          <>
                            <Languages className="h-4 w-4 mr-2" />
                            Translate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Translated Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {supportedLanguages.find(l => l.code === targetLang)?.flag}
                    {supportedLanguages.find(l => l.code === targetLang)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-32 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    {isTranslating ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : translatedText ? (
                      <div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                          {translatedText}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">
                        Translation will appear here...
                      </p>
                    )}
                  </div>
                  {translatedText && (
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(translatedText)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Powered by LibreTranslate
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Supported Languages Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Supported Languages</CardTitle>
            <CardDescription>
              Our translation service supports the following languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
              {supportedLanguages.map((lang) => (
                <div key={lang.code} className="text-center">
                  <div className="text-2xl mb-1">{lang.flag}</div>
                  <div className="text-sm font-medium">{lang.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{lang.code}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}