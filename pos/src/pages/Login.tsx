import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Email dan password harus diisi!", {
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

    try {
      // Call API login
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH_LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Store user data
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userId", result.data.id.toString());
        localStorage.setItem("username", result.data.name);
        localStorage.setItem("userEmail", result.data.email);
        
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
        toast.error(result.message || "Login gagal!", {
          style: {
            background: '#ef4444',
            color: 'white',
            border: 'none',
          },
          duration: 3000,
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Gagal terhubung ke server. Pastikan API berjalan.", {
        style: {
          background: '#ef4444',
          color: 'white',
          border: 'none',
        },
        duration: 3000,
      });
      setIsLoading(false);
    }
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
          <div>
            <CardTitle className="text-3xl font-bold">POS</CardTitle>
            <CardDescription className="text-base mt-2">
              Masuk untuk mengakses sistem kasir
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoComplete="email"
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
