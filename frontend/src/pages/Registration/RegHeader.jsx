import React from "react";
import Navbar from "../../components/Navbar/Navbar";

const RegHeader = () => {
  return (
    <div className="bg-white">
      <header className="border-b border-slate-200">
        <Navbar />
      </header>
      <section className="bg-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Hostel Registration 2025
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            University of Lucknow Hostel Management System
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Applications are now open online for hostel accommodation. Eligible
            full-time students can submit their registration through this
            portal. Please review your academic details carefully before moving
            forward.
          </p>
          <a
            href="#"
            className="inline-flex items-center text-sm font-medium text-sky-600 transition-colors hover:text-sky-700"
          >
            Student hostel facilities overview
          </a>
        </div>
      </section>
    </div>
  );
};

export default RegHeader;
