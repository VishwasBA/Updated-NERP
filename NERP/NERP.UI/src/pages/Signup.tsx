import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api";
import { toast } from "sonner";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("employee");
  const [submitting, setSubmitting] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match ❌");
      return;
    }

    setSubmitting(true);

    try {
      const res = await authApi.register({
        email,
        password,
        name,
        department,
        role,
      });

      login(res.token, res.user);
      toast.success("Account created successfully! 🎉");
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
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
        className="w-full max-w-lg rounded-2xl 
        bg-gradient-to-br from-black/80 via-black/60 to-gray-800/40 
        backdrop-blur-2xl border border-white/10 
        shadow-[0_25px_70px_rgba(0,0,0,1)] px-8 py-10"
      >
        <CardContent className="space-y-5">

          {/* LOGO */}
          <div className="flex justify-center">
            <img src="/nexerlogo.png" alt="Nexer" className="h-14 object-contain" />
          </div>

          <h2 className="text-center text-white text-xl font-semibold">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* NAME */}
            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/50 border border-white/30 text-white 
              placeholder:text-gray-200 placeholder:opacity-100
              focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 
              hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all"
              required
            />

            {/* EMAIL */}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/50 border border-white/30 text-white 
              placeholder:text-gray-200 placeholder:opacity-100
              focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 
              hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all"
              required
            />

            {/* PASSWORD */}
            <div className="relative">
  <Input
    type="password"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="bg-black/50 border border-white/30 text-white 
    placeholder:text-gray-200 pr-10
    focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 
    hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all"
  />
</div>

            {/* CONFIRM PASSWORD */}
  <div className="relative">
  <Input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="bg-black/50 border border-white/30 text-white 
    placeholder:text-gray-200 pr-10
    focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 
    hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all"
  />

</div>

            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-400">Passwords do not match</p>
            )}

            {/* DEPARTMENT + ROLE */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-black/50 border border-white/30 text-white 
                placeholder:text-gray-200 
                hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all"
                required
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-black/50 border border-white/30 text-white px-3 rounded-md 
                hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] 
                focus:outline-none focus:border-blue-400"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200 font-medium shadow-md"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Account"}
            </Button>
          </form>

          {/* LOGIN LINK */}
      <p className="text-center text-base text-gray-200 mt-3">
  Already have an account?{" "}
  <Link to="/login"  className="text-blue-400 hover:text-black-300 underline font-semibold transition">
    Sign in
  </Link>
</p>

        </CardContent>
      </Card>
    </div>
  );
}