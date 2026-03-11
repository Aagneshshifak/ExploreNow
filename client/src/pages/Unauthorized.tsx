import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-linear flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md text-center"
      >
        <Card className="border-0 shadow-elegant-lg">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            
            <h1 className="text-heading mb-4">Access Denied</h1>
            <p className="text-body text-muted-foreground mb-8">
              You don't have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
            
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}