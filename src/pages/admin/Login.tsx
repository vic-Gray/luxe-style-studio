import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (token) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Invalid login credentials");
      }

      const data = await res.json();
      localStorage.setItem("admin-token", data.accessToken);
      navigate("/admin/dashboard", { replace: true });
    } catch (err: unknown) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card border-border">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="font-brand text-2xl font-semibold tracking-[0.1em]">
              ADMIN LOGIN
            </CardTitle>
            <p className="text-sm text-muted-foreground font-body">
              Enter your credentials to access the admin panel
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body text-sm uppercase tracking-[0.1em]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@matteekay.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-body"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-body text-sm uppercase tracking-[0.1em]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-body"
                  required
                  autoComplete="off"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive font-body">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full font-body uppercase tracking-[0.1em]"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground font-body text-center">
                Use your admin email and password registered in the backend.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;