import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error("Username dan password harus diisi!", {
        style: {
          background: '#ef4444',
          color: 'white',
          border: 'none',
        },
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Simple auth check (in production, this should call your API)
      if (formData.username === "admin" && formData.password === "admin") {
        // Store auth token/session
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", formData.username);
        
        toast.success("Login berhasil!", {
          icon: "✓",
          style: {
            background: '#10b981',
            color: 'white',
            border: 'none',
          },
          duration: 2000,
        });

        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        toast.error("Username atau password salah!", {
          style: {
            background: '#ef4444',
            color: 'white',
            border: 'none',
          },
          duration: 3000,
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          {/* Logo/Icon */}
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-2">
            <ShoppingCart className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <div>
            <CardTitle className="text-3xl font-bold">Warung POS</CardTitle>
            <CardDescription className="text-base mt-2">
              Masuk untuk mengakses sistem kasir
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>

            {/* Demo Credentials Info */}
            <div className="mt-6 p-3 bg-secondary/50 rounded-lg text-sm">
              <p className="font-medium mb-1">Demo Login:</p>
              <p className="text-muted-foreground">
                Username: <span className="font-mono font-semibold">admin</span>
              </p>
              <p className="text-muted-foreground">
                Password: <span className="font-mono font-semibold">admin</span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
