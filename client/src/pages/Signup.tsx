import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, User, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false
  });

  const handleSubmit = (e: React.FormEvent, userType: string) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    console.log("Signup attempt:", { ...formData, userType });
    // Handle signup logic here
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: "Weak", color: "text-red-500" };
      case 2:
        return { text: "Fair", color: "text-orange-500" };
      case 3:
        return { text: "Good", color: "text-blue-500" };
      case 4:
        return { text: "Strong", color: "text-green-500" };
      default:
        return { text: "", color: "" };
    }
  };

  const strength = passwordStrength(formData.password);
  const strengthInfo = getPasswordStrengthText(strength);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">E</span>
            </div>
            <span className="text-2xl font-bold text-foreground">ExploreNow</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join thousands of travelers exploring India</p>
        </div>

        <Card className="shadow-elegant border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Choose your account type to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="user" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Traveler</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Hotel Admin</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="user">
                <form onSubmit={(e) => handleSubmit(e, "user")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="h-12 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`w-2 h-2 rounded-full ${
                                level <= strength ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={strengthInfo.color}>{strengthInfo.text}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="h-12 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <div className="flex items-center space-x-1 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        <span>Passwords match</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      required
                      className="mt-1 rounded"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-muted-foreground leading-5">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary hover:bg-primary-glow text-primary-foreground font-semibold"
                    disabled={!formData.agreeToTerms}
                  >
                    Create Traveler Account
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={(e) => handleSubmit(e, "admin")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Hotel/Business Name</Label>
                    <Input
                      id="admin-name"
                      name="name"
                      type="text"
                      placeholder="Enter hotel/business name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Business Email</Label>
                    <Input
                      id="admin-email"
                      name="email"
                      type="email"
                      placeholder="Enter business email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-phone">Business Phone</Label>
                    <Input
                      id="admin-phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter business phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create admin password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="h-12 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-2">Admin Account Benefits:</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Manage hotel listings and availability</li>
                      <li>• Track bookings and revenue</li>
                      <li>• Create promotional offers</li>
                      <li>• Analytics dashboard access</li>
                    </ul>
                  </div>
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="adminAgreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      required
                      className="mt-1 rounded"
                    />
                    <label htmlFor="adminAgreeToTerms" className="text-sm text-muted-foreground leading-5">
                      I agree to the Business{" "}
                      <Link to="/business-terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and confirm I have authorization to register this business
                    </label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                    disabled={!formData.agreeToTerms}
                  >
                    Create Admin Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;