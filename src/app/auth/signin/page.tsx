"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InputWithLabel from "@/components/ui/InputWithLabel";
import AuthLayout from "@/components/layouts/AuthLayout";
import { FcGoogle } from "react-icons/fc";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";
import apiClient from "@/lib/apiClient";

export default function SignInPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  // 🧠 state untuk input form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 💥 fungsi login ke backend
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.post("/auth/login", { 
        email, 
        password 
      });

      // Data ada di res.data (Axios style)
      const data = res.data;

      // ✅ Berhasil
      console.log("Login success:", data);

      // Simpan Token & Role
      localStorage.setItem("token", data.token);
      if (data.role) localStorage.setItem("role", data.role);

      setSuccess("Login successful! Redirecting...");
      
      // Redirect ke Dashboard
      setTimeout(() => {
         window.location.href = "/dashboard";
      }, 1000);

    } catch (err: any) {
      console.error(err);
      // Axios error object structure
      const errorMessage = err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Header + toggle */}
      <div className="mb-3">
  <div className="flex items-center justify-between mb-2">
    <h2 className="text-3xl font-semibold text-[#5A4FB5] dark:text-[#9083F5]">Login</h2>
    
    {/* 🔆🌙 Toggle Theme */}
    <div className="flex border border-gray-300 rounded-full overflow-hidden">
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
  
  <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>
    Enter your email and password to access your account
  </p>
</div>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputWithLabel
          label="Email"
          type="email"
          placeholder="example@gmail.com"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <InputWithLabel
          label="Password"
          type="password"
          placeholder="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-xs">{error}</p>}
        {success && <p className="text-green-500 text-xs">{success}</p>}

        <div
          className={`flex items-center justify-between text-xs ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          <label className="flex items-center gap-2">
            <input type="checkbox" /> Remember Me
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-[#5A4FB5] dark:text-[#9083F5] font-light hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6A5FDB] hover:bg-[#7E72E5] transition-all text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>

      {/* Google button */}
      <button
      type="button"
      onClick={() => window.location.href = "/api/auth/google"}
      className={`w-full mt-3 flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 text-sm font-medium transition-all ${
        isDark ? "text-white hover:bg-[#5A4FB5]" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <FcGoogle className="w-5 h-5" /> Continue with Google
    </button>

      <p
        className={`text-xs mt-4 text-center ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        Don’t have an account yet?{" "}
        <Link
          href="/auth/signup"
          className="text-[#5A4FB5] dark:text-[#9083F5] font-light hover:underline"
        >
          Sign up now
        </Link>
      </p>
    </AuthLayout>
  );
}
