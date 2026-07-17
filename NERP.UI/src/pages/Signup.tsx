import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api";
import { toast } from "sonner";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [userRole, setUserRole] = useState("employee");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        role: role || "Associate",
        userRole,
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
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="bg-black/50 border border-white/30 text-white 
    placeholder:text-gray-200 pr-10
    focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 
    hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all"
  />
  <button
    type="button"
    onClick={() => setShowPassword((v) => !v)}
    aria-label={showPassword ? "Hide password" : "Show password"}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
  >
    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
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
  <button
    type="button"
    onClick={() => setShowConfirmPassword((v) => !v)}
    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
  >
    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
</div>

            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-400">Passwords do not match</p>
            )}

            {/* ROLE SELECTION */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-200">System Role (for testing hierarchy/workflows)</label>
              <select
                value={userRole}
                onChange={(e) => {
                  setUserRole(e.target.value);
                  if (e.target.value === "employee") setRole("Associate");
                  else if (e.target.value === "cu_manager") setRole("CU Lead");
                  else if (e.target.value === "bu_manager") setRole("BU Lead");
                  else if (e.target.value === "admin") setRole("HR/Admin");
                }}
                className="w-full rounded-md bg-black/50 border border-white/30 text-white px-3 py-2 text-sm
                focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 outline-none transition-all"
              >
                <option value="employee" className="bg-slate-900 text-white">Employee</option>
                <option value="cu_manager" className="bg-slate-900 text-white">CU Manager</option>
                <option value="bu_manager" className="bg-slate-900 text-white">BU Manager</option>
                <option value="admin" className="bg-slate-900 text-white">HR/Admin</option>
              </select>
            </div>

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

              <Input
                placeholder="Job Title"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-black/50 border border-white/30 text-white 
                placeholder:text-gray-200 
                hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all"
              />
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
  <Link to="/login"  className="text-blue-400 hover:text-blue-300 underline font-semibold transition">
    Sign in
  </Link>
</p>

        </CardContent>
      </Card>
    </div>
  );
}