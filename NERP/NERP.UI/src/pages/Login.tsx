import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleLogin = () => {
  console.log("Microsoft login clicked");
  // MSAL login will come here later
};

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.login({ email, password });
      login(res.token, res.user);
      toast.success("Welcome back! 🎉");
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <Card
        className="w-full max-w-md rounded-2xl 
        bg-gradient-to-br from-black/80 via-black/60 to-gray-800/40 
        backdrop-blur-2xl border border-white/10 
        shadow-[0_25px_70px_rgba(0,0,0,1)] px-8 py-10"
      >
        <CardContent className="space-y-6">

          {/* LOGO */}
          <div className="flex justify-center">
            <img src="/nexerlogo.png" alt="Logo" className="h-14 object-contain" />
          </div>

          <h2 className="text-center text-white text-xl font-semibold">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/50 border border-white/30 text-white 
              placeholder:text-gray-200 placeholder:opacity-100
              focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 
              hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all
              h-12 px-7 text-base"
              required
            />

            {/* PASSWORD WITH EYE ICON */}
            <div className="relative">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border border-white/30 text-white 
                placeholder:text-gray-200 pr-10
                focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 
                hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all
                h-12 px-7 text-base"
                required
              />
            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200 font-medium shadow-md"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          {/* OR divider */}
<div className="flex items-center gap-2 my-3">
  <div className="flex-1 h-px bg-gray-500" />
  <span className="text-gray-300 text-sm">OR</span>
  <div className="flex-1 h-px bg-gray-500" />
</div>

{/* Microsoft Login Button */}
<Button
  type="button"
  onClick={handleLogin}
  className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium"
>
  Login with Microsoft
</Button>

          {/* SIGNUP LINK */}
          <p className="text-center text-base text-gray-200 mt-2">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-400 hover:text-black-300 underline font-semibold transition"
            >
              Create one
            </Link>
          </p>

        </CardContent>
      </Card>
    </div>
  );
}
