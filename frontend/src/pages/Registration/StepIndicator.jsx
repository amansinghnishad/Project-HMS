import React from "react";

const steps = ["Personal", "Verification", "Hostel", "Preview", "Submit"];

const StepIndicator = ({ currentStep }) => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="relative mb-8">
      <div className="absolute left-2 right-2 top-[22px] h-px bg-slate-200 sm:left-0 sm:right-0">
        <div
          className="h-full rounded-full bg-sky-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="relative z-10 flex items-start justify-between gap-2 sm:gap-4">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep >= stepNumber;
          return (
            <li key={label} className="flex flex-col items-center text-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors duration-300 ${
                  isCompleted
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-slate-300 bg-white text-slate-500"
                }`}
              >
                {stepNumber}
              </span>
              <span
                className={`mt-2 text-xs font-medium uppercase tracking-wide ${
                  isCompleted ? "text-slate-900" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default StepIndicator;
