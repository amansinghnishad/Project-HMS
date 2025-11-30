import React from "react";

const RegFooter = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-sm text-slate-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>© 2025 Lucknow University</div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href="#" className="transition-colors hover:text-slate-900">
            Privacy Policy
          </a>
          <a href="#" className="transition-colors hover:text-slate-900">
            Refund Policy
          </a>
          <a href="#" className="transition-colors hover:text-slate-900">
            Terms &amp; Conditions
          </a>
          <a href="#" className="transition-colors hover:text-slate-900">
            Contact Us
          </a>
        </nav>
        <div className="text-slate-400">
          Powered by
          <a
            href="https://www.sritechnocrat.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-sky-600 hover:text-sky-700"
          >
            Team Silent Killers
          </a>
        </div>
      </div>
    </footer>
  );
};

export default RegFooter;
