
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useCSRF } from '@/components/CSRFProtection';
import { SECURITY_CONFIG } from '@/config/security';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { monitorFailedLoginAttempts, logSecurityEvent, validateAndSanitizeInput } = useSecurityMonitoring();
  const { token: csrfToken } = useCSRF();
  const failedLoginMonitor = monitorFailedLoginAttempts();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/planner');
    }
  }, [user, navigate]);

  const handleInputChange = (value: string, field: string, setter: (value: string) => void) => {
    const { sanitized, isValid, errors } = validateAndSanitizeInput(value, field);
    
    if (!isValid && errors.length > 0) {
      console.warn(`Security validation failed for ${field}:`, errors);
    }
    
    setter(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account is temporarily blocked
    if (failedLoginMonitor.isBlocked()) {
      toast({
        title: "Account Temporarily Locked",
        description: "Too many failed attempts. Please try again later.",
        variant: "destructive"
      });
      return;
    }
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    if (isSignUp && !fullName) {
      toast({
        title: "Missing Information",
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Password strength validation for sign up
    if (isSignUp && password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      toast({
        title: "Weak Password",
        description: `Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let error;
      
      if (isSignUp) {
        logSecurityEvent({
          event_type: 'USER_SIGNUP_ATTEMPT',
          severity: '***',
          details: {
            email: email.substring(0, email.indexOf('@')) + '@***',
            hasFullName: !!fullName,
            csrfToken: csrfToken ? 'present' : 'missing'
          }
        });

        const result = await signUp(email, password, fullName);
        error = result.error;
        
        if (!error) {
          toast({
            title: "Account Created",
            description: "Please check your email to verify your account.",
          });
          
          logSecurityEvent({
            event_type: 'USER_SIGNUP_SUCCESS',
            severity: 'low',
            details: { email: email.substring(0, email.indexOf('@')) + '@***' }
          });
        }
      } else {
        logSecurityEvent({
          event_type: 'USER_LOGIN_ATTEMPT',
          severity: 'low',
          details: {
            email: email.substring(0, email.indexOf('@')) + '@***',
            csrfToken: csrfToken ? 'present' : 'missing'
          }
        });

        const result = await signIn(email, password);
        error = result.error;
        
        if (!error) {
          toast({
            title: "Welcome Back",
            description: "You have successfully signed in.",
          });
          
          failedLoginMonitor.resetAttempts();
          
          logSecurityEvent({
            event_type: 'USER_LOGIN_SUCCESS',
            severity: 'low',
            details: { email: email.substring(0, email.indexOf('@')) + '@***' }
          });
          
          navigate('/planner');
        } else {
          // Record failed login attempt
          const isBlocked = failedLoginMonitor.recordFailedAttempt();
          
          logSecurityEvent({
            event_type: 'USER_LOGIN_FAILED',
            severity: isBlocked ? 'high' : 'medium',
            details: {
              email: email.substring(0, email.indexOf('@')) + '@***',
              error: error.message,
              isBlocked
            }
          });
        }
      }

      if (error) {
        let errorMessage = "An error occurred during authentication.";
        
        // Provide user-friendly error messages without exposing system details
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password.";
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = "Please check your email and click the confirmation link.";
        } else if (error.message?.includes('Password should be at least')) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message?.includes('User already registered')) {
          errorMessage = "An account with this email already exists.";
        }

        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (err) {
      logSecurityEvent({
        event_type: 'AUTH_SYSTEM_ERROR',
        severity: 'medium',
        details: {
          error: err instanceof Error ? err.message : 'Unknown error',
          action: isSignUp ? 'signup' : 'signin'
        }
      });

      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Route Ready</span>
          </div>
          <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Create your account to start planning trips' 
              : 'Sign in to access your travel planner'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failedLoginMonitor.isBlocked() && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Account temporarily locked due to multiple failed attempts. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CSRF Token */}
            {csrfToken && (
              <input type="hidden" name="csrf_token" value={csrfToken} />
            )}

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => handleInputChange(e.target.value, 'fullName', setFullName)}
                  required={isSignUp}
                  maxLength={SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH}
                  autoComplete="name"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => handleInputChange(e.target.value, 'email', setEmail)}
                required
                maxLength={SECURITY_CONFIG.MAX_EMAIL_LENGTH}
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? SECURITY_CONFIG.MIN_PASSWORD_LENGTH : 1}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
              {isSignUp && (
                <p className="text-xs text-gray-600">
                  Password must be at least {SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || failedLoginMonitor.isBlocked()}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-800 text-sm"
              disabled={failedLoginMonitor.isBlocked()}
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
