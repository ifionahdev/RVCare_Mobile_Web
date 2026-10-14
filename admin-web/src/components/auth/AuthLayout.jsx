
import React from "react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex min-h-screen">

        {/* LEFT SIDE - BRANDING (DESKTOP ONLY) */}
        <div className="relative hidden min-h-screen w-1/2 flex-col items-center justify-center overflow-hidden bg-[#102A43] px-12 text-center lg:flex">

          {/* Background Decorations */}
          <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#5EE6FE]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-28 h-96 w-96 rounded-full bg-[#5EE6FE]/10 blur-3xl" />

          {/* Branding Content */}
          <div className="relative z-10 flex flex-col items-center">

            {/* Logo with White Circular Background */}
            <div className="mb-8 flex h-44 w-44 items-center justify-center rounded-full bg-white shadow-xl xl:h-52 xl:w-52">
              <img
                src="/assets/raphacare-logo.png"
                alt="RaphaCare Logo"
                className="h-full w-full object-contain"
              />
            </div>

            {/* System Name */}
            <h1 className="text-4xl font-bold tracking-tight text-white xl:text-5xl">
              RaphaVets Pet Clinic
            </h1>

            {/* System Description */}
            <p className="mt-4 max-w-sm text-base font-medium leading-relaxed text-slate-300 xl:text-lg">
              Veterinary Clinic Management System
            </p>

          </div>

          {/* Footer */}
          <div className="absolute bottom-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} RaphaCare. All rights reserved.
          </div>

        </div>

        {/* RIGHT SIDE - LOGIN / FORGOT PASSWORD */}
        <div className="flex min-h-screen w-full items-center justify-center bg-[#F8FAFC] px-5 py-10 sm:px-8 lg:w-1/2 lg:px-12 xl:px-20">

          <div className="w-full max-w-md">
            {children}
          </div>

        </div>

      </div>
    </div>
  );
}
