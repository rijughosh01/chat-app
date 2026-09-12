import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessagesSquare,
  User,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) signup(formData);
  };

  return (
    <div className="min-h-[100dvh] pt-16 sm:pt-20 grid lg:grid-cols-2 bg-base-200/30">
      <div className="flex flex-col justify-center items-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-md space-y-7 bg-base-100/90 backdrop-blur-xl p-6 sm:p-9 rounded-3xl border border-base-content/10 shadow-xl">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mb-1">
              <MessagesSquare className="size-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
              Create Account
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60">
              Get started with your free NexChat account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-base-content/70">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                  <User className="size-4.5" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-base-200/60 focus:bg-base-100 border border-base-content/10 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl outline-none transition-all"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-base-content/70">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                  <Mail className="size-4.5" />
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-base-200/60 focus:bg-base-100 border border-base-content/10 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl outline-none transition-all"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-base-content/70">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                  <Lock className="size-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-base-200/60 focus:bg-base-100 border border-base-content/10 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl outline-none transition-all"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-content/40 hover:text-base-content cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4.5" />
                  ) : (
                    <Eye className="size-4.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-4.5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-1 border-t border-base-content/10">
            <p className="text-xs text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </div>
  );
};
export default SignUpPage;
