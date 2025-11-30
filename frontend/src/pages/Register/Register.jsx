import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import Navbar from "../../components/Navbar/Navbar";

const Register = () => {
  const navigate = useNavigate();

  const instructions = [
    "Registration opens for the upcoming academic session on the official dates announced by the hostel office.",
    "Keep your university ID card, recent fee receipt, and parent's/guardian's contact handy.",
    "Adhere to the eligibility rules: first-year students must use the new registration pathway, returning students the old registration pathway.",
    "Upload documents as clear scans (PDF/JPG/PNG, max size 5 MB per file).",
    "Once submitted, track your application status through the student dashboard.",
  ];

  return (
    <>
      <Navbar />
      <section className="bg-gray-50">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-6 py-16 md:px-10">
          <header className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Hostel Admissions
            </span>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Choose your registration path
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Start or renew your hostel stay by selecting the option that
              matches your academic year. Each flow captures information
              specific to your needs and ensures the right documentation is
              collected.
            </p>
          </header>

          <div className="mt-12 grid w-full gap-6 sm:grid-cols-2">
            <button
              onClick={() =>
                toast(
                  "First-year registrations will open soon. Please check back later.",
                  {
                    icon: "⏳",
                  }
                )
              }
              className="group flex flex-col items-start justify-between rounded-2xl border border-blue-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
                  First year only
                </span>
                <h2 className="text-2xl font-semibold text-slate-900">
                  New registration
                </h2>
                <p className="text-sm text-slate-600">
                  Submit fresh hostel applications, share accommodation
                  preferences, and upload onboarding documents for the first
                  time.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3">
                Begin application
                <span aria-hidden="true">→</span>
              </span>
            </button>

            <button
              onClick={() => navigate("/registration")}
              className="group flex flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
            >
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                  2nd year & onwards
                </span>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Old registration
                </h2>
                <p className="text-sm text-slate-600">
                  Renew your stay, update documents, and select room preferences
                  for the upcoming term.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition group-hover:gap-3">
                Resume registration
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </div>

          <section className="mt-14 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Important instructions
            </h3>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              {instructions.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-semibold">Need help?</p>
              <p className="mt-1">
                Contact the hostel admission cell at
                <a
                  href="mailto:hms-support@lkouniv.ac.in"
                  className="ml-1 font-semibold underline"
                >
                  hms-support@lkouniv.ac.in
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </section>
    </>
  );
};

export default Register;
