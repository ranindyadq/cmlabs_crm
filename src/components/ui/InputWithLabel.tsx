"use client";
import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useTheme } from "@/lib/context/ThemeContext";

interface InputWithLabelProps {
  label: string;
  type?: string;
  placeholder?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  isError?: boolean;
}

export default function InputWithLabel({
  label,
  type = "text",
  placeholder,
  name,
  value,
  onChange,
  required = false,
  isError = false, 
}: InputWithLabelProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="relative">
      <label
        htmlFor={name}
        className={`block mb-1 text-sm font-medium ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={isPassword && showPassword ? "text" : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required} 
        className={`w-full border border-gray-300 rounded-lg px-3 py-1.5  text-sm placeholder:text-xs 
    focus:ring-2 focus:outline-none transition duration-200 ease-in-out 
    ${ isError
            ? "border-red-500 focus:border-red-500 focus:ring-red-200" 
            : "border-gray-300 focus:border-[#5A4FB5] focus:ring-[#5A4FB5]"
        }
    ${ isDark
        ? "bg-[#4C4790] text-white placeholder-[#D1CCF1]"
        : "bg-white text-black placeholder-gray-400"
        }`}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-black"
        >
          {showPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      )}
    </div>
  );
}
