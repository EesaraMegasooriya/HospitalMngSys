import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  Check,
  AlertCircle,
  Clock,
  Utensils,
  ClipboardList,
  HeartPulse,
} from "lucide-react";
import HospitalImg from "../../../frontend/public/Hospital-bg.jpg";

// ── Main Login Component ─────────────────────────────────────────────────────

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Minimum 6 characters required.";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setStatus("loading");
      const res = await axios.post("http://localhost:5050/api/auth/login", form);
      const { token, user } = res.data;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      setStatus("success");
      setTimeout(() => { window.location.href = "/dashboard"; }, 500);
    } catch (err) {
      setStatus("idle");
      setErrors({ general: err.response?.data?.message || "Invalid email or password." });
    }
  };

  const fieldClass = (field) =>
    `w-full pl-11 pr-4 py-[13px] text-[15px] bg-white rounded-xl border outline-none
     transition-all duration-200 placeholder:text-gray-1000 text-gray-1000
     ${errors[field]
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-400 focus:border-[#2d6a4e] focus:ring-2 focus:ring-[#2d6a4e]/10"
    }`;

  return (
    <div className="min-h-screen flex bg-[#f5f7f5]">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:block lg:w-[50%] relative overflow-hidden">

        {/* Hospital background image */}
        <img
          src={HospitalImg}
          alt="District General Hospital Gampaha"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Multi-layer overlay for depth + text legibility */}
        {/* Bottom-up dark fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a10]/95 via-[#0d2b1f]/60 to-transparent" />
        {/* Left-to-right green tint */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2218]/50 to-transparent" />
        {/* Subtle green color cast */}
        <div className="absolute inset-0 bg-[#0f3320]/25" />

        {/* Content sits on top of all overlays */}
        <div className="absolute inset-0 flex flex-col justify-between p-10">

          {/* ── TOP: Logo ── */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/12 border border-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-white text-[14.5px] font-semibold leading-tight drop-shadow">
                District General Hospital
              </p>
              <p className="text-white/45 text-[10.5px] uppercase tracking-[2px]">
                Gampaha
              </p>
            </div>
          </div>

          {/* ── BOTTOM: Main content area ── */}
          <div>
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-3.5 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse block flex-shrink-0" />
              <span className="text-white/75 text-[11px] font-semibold uppercase tracking-[2px]">
                System Online
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-white text-[2.6rem] font-bold leading-[1.15] mb-4 drop-shadow-md">
              Meal Management
              <br />
              <span className="text-emerald-400">System</span>
            </h1>

            <p className="text-white/55 text-[14.5px] leading-relaxed max-w-[320px] mb-8">
              A unified platform coordinating patient nutrition across wards, dietitians, and kitchen teams.
            </p>

            {/* Feature list */}
            <div className="flex flex-col gap-3 mb-8">
              {[
                { icon: <Utensils className="w-3.5 h-3.5" strokeWidth={1.8} />, label: "Real-time meal tracking per ward" },
                { icon: <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.8} />, label: "Dietitian diet plan management" },
                { icon: <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />, label: "Kitchen-to-ward coordination" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/25 backdrop-blur-sm flex items-center justify-center text-emerald-400 flex-shrink-0">
                    {icon}
                  </div>
                  <span className="text-white/65 text-[13.5px]">{label}</span>
                </div>
              ))}
            </div>

            
            <p className="text-white/20 text-[11px] mt-5">
               DGH Gampaha &nbsp;·&nbsp; 
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-[#f5f7f5]">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-[#2d6a4e] flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-[#1a4030] text-[17px] font-semibold">DGH Gampaha</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-[#2d6a4e] text-[11px] font-bold tracking-[2.5px] uppercase mb-2">
              Staff Portal
            </p>
            <h2 className="text-gray-900 text-[1.9rem] font-bold mb-2 leading-tight">
              Welcome 
            </h2>
            <p className="text-gray-400 text-[14.5px] leading-relaxed">
              Sign in to access the meal management dashboard.
            </p>
          </div>

          {/* Error banner */}
          {errors.general && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p className="text-red-600 text-[13.5px] leading-snug">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
                  ${errors.email ? "text-red-400" : form.email ? "text-[#2d6a4e]" : "text-gray-600"}`}>
                  <User className="w-4 h-4" strokeWidth={1.8} />
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@hospital.lk"
                  autoComplete="username"
                  className={fieldClass("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
                  ${errors.password ? "text-red-400" : form.password ? "text-[#2d6a4e]" : "text-gray-600"}`}>
                  <Lock className="w-4 h-4" strokeWidth={1.8} />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`${fieldClass("password")} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#2d6a4e] transition-colors duration-200 p-0.5"
                >
                  {showPass
                    ? <EyeOff className="w-4 h-4" strokeWidth={1.8} />
                    : <Eye className="w-4 h-4" strokeWidth={1.8} />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setRemember((v) => !v)}
                  className={`w-[18px] h-[18px] rounded-md border-[1.5px] flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0
                    ${remember ? "bg-[#2d6a4e] border-[#2d6a4e]" : "bg-white border-gray-300 hover:border-[#2d6a4e]"}`}
                >
                  {remember && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-[13.5px] text-gray-500">Keep me signed in</span>
              </label>

              <button
                type="button"
                className="text-[13.5px] font-semibold text-[#2d6a4e] hover:text-[#1a4030] transition-colors duration-200"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className={`w-full py-[13px] rounded-xl text-white font-semibold text-[15.5px]
                  flex items-center justify-center gap-2 transition-all duration-200
                  ${status === "success"
                    ? "bg-emerald-600 cursor-default"
                    : status === "loading"
                      ? "bg-[#2d6a4e] opacity-70 cursor-wait"
                      : "bg-[#2d6a4e] hover:bg-[#245a40] active:scale-[0.99] shadow-sm hover:shadow-lg hover:shadow-[#2d6a4e]/20"
                  }`}
              >
                {status === "loading" && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {status === "success" && <Check className="w-4 h-4" strokeWidth={2.5} />}
                {status === "loading"
                  ? "Signing in…"
                  : status === "success"
                    ? "Welcome back!"
                    : <><span>Sign In</span><ArrowRight className="w-4 h-4" strokeWidth={2} /></>
                }
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[13px] text-gray-400">
            <Shield className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
            <span>
              Need access?{" "}
              <a
                href="#"
                className="font-semibold text-[#2d6a4e] hover:text-[#1a4030] transition-colors duration-200"
              >
                Contact IT Support
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;