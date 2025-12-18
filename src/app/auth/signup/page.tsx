"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InputWithLabel from "@/components/ui/InputWithLabel";
import AuthLayout from "@/components/layouts/AuthLayout";
import { FcGoogle } from "react-icons/fc";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";
import apiClient from "@/lib/apiClient";

export default function SignUpPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // ... (State hooks Anda tidak perlu diubah)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/signup", {
        fullName,
        email,
        password
      });

      // Data ada di res.data (Axios style)
      const data = res.data;

      // Sukses
      setSuccess("Registration successful! Please sign in.");

      // Redirect ke Sign In
      setTimeout(() => {
        router.push("/auth/signin"); // Sesuaikan path login Anda (/auth/signin atau /auth/login)
      }, 2000);

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || "Registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
  <AuthLayout reverse>
    <div className="flex flex-col h-full">
  {/* HEADER */}
  <div className="mb-1">
    <div className="flex items-center justify-between mb-1">
      <h2 className="text-3xl font-semibold text-[#5A4FB5] dark:text-[#9083F5]">
              Sign Up
            </h2>
      {/* 🔆🌙 Toggle Theme */}
      <div className="flex border rounded-full overflow-hidden">
        <button
          onClick={() => theme !== "light" && toggleTheme()}
          className={`w-7 h-7 flex items-center justify-center transition-colors ${
            theme === "light"
              ? "bg-[#5A4FB5] text-white"
              : "bg-transparent text-gray-500 hover:text-white"
          }`}
        >
          <Sun size={14} />
        </button>
        <button
          onClick={() => theme !== "dark" && toggleTheme()}
          className={`w-7 h-7 flex items-center justify-center transition-colors ${
            theme === "dark"
              ? "bg-[#5A4FB5] text-white"
              : "bg-transparent text-gray-500 hover:text-white"
          }`}
        >
          <Moon size={14} />
        </button>
      </div>
    </div>
  </div>

      {/* FORM */}
      <div className="flex-grow overflow-y-auto px-1">
        <form className="space-y-1" onSubmit={handleSubmit}>
          <InputWithLabel
            label="Full Name"
            placeholder="Enter your full name"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <InputWithLabel
            label="Email"
            type="email"
            placeholder="Enter your email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputWithLabel
            label="Password"
            type="password"
            placeholder="Enter your password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <InputWithLabel
            label="Confirm Password"
            type="password"
            placeholder="Enter your confirm password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-500 text-xs">{success}</p>}

          <label
            className={`flex items-center text-xs space-x-2 ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            <input type="checkbox" required />
            <span>
              I agree to CRM{" "}
              <Link href="#" className="text-[#5A4FB5] dark:text-[#9083F5]">Terms of Service</Link> and{" "}
              <Link href="#" className="text-[#5A4FB5] dark:text-[#9083F5]">Privacy Policy</Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6A5FDB] hover:bg-[#7E72E5] transition-all text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"

          >
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>
      </div>

      {/* FOOTER */}
      <div className="pt-2">
        <p
          className={`text-xs text-center ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-[#5A4FB5] dark:text-[#9083F5] font-light hover:underline">
            Sign in
          </Link>
        </p>

        <button
        type="button"
        onClick={() => window.location.href = "/api/auth/google"}
        className={`w-full mt-3 flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 text-sm font-medium transition-all ${
          isDark ? "text-white hover:bg-[#5A4FB5]" : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <FcGoogle className="w-5 h-5" /> Continue with Google
      </button>
      </div>
    </div>
  </AuthLayout>
);
}