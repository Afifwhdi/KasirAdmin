import { API_CONFIG } from "@/config/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

class AuthService {
  private readonly TOKEN_KEY = "pos_auth_token";
  private readonly USER_KEY = "pos_auth_user";

  /**
   * Login user dan simpan token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const result = await response.json();


      if (result.status === "success" && result.data) {
        const user: AuthUser = {
          id: parseInt(result.data.id),
          email: result.data.email,
          name: result.data.name,
          role: result.data.role,
        };



        const fakeToken = btoa(
          JSON.stringify({ id: user.id, email: user.email, timestamp: Date.now() })
        );


        this.setToken(fakeToken);
        this.setUser(user);

        return {
          access_token: fakeToken,
          user,
        };
      }

      throw new Error(result.message || "Login failed");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Logout - clear token dan user data
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set auth token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get current user
   */
  getUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Set user data
   */
  private setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user;
  }

  /**
   * Verify token with server
   */
  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }
}

export const authService = new AuthService();
