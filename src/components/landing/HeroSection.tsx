"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-white to-[#CAA9FF]/20">
      <div className="container mx-auto px-8 py-16 md:py-26">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* TEKS */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-gray-900">
              Manage Your <span className="text-primary">Customer Relationships</span> Effortlessly
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto md:mx-0">
              Unify your sales, marketing, and customer service data in one
              intuitive platform built for your business.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block bg-primary text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-primary-hover transition-all duration-300 hover:scale-105"
            >
              Start Your 14-Day Free Trial
            </Link>
          </motion.div>

          {/* GAMBAR */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <Image
              src="/demo.gif"
              alt="Dashboard Demo Animation"
              width={1200}
              height={900}
              unoptimized
              className="rounded-lg shadow-xl border border-gray-200 hover:scale-105 transition-transform duration-300"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
