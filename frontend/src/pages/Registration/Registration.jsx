import React, { useState, useEffect } from "react";
import StepIndicator from "./StepIndicator";
import PersonalInformation from "./PersonalInformation";
import EmailMobileVerification from "./EmailMobileVerification";
import HostelSelection from "./HostelSelection";
import Preview from "./Preview";
import Submit from "./Submit";
import { authService } from "../../services/api/authService";

import RegHeader from "./RegHeader";
import RegFooter from "./RegFooter";

const MultiStepForm = () => {
  const [category, setCategory] = useState("");
  const [step, setStep] = useState(1);
  const [isEligible, setIsEligible] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [formData, setFormData] = useState({
    course: "",
    courseName: "",
    semester: "",
    examType: "",
    rollno: "",
    dateOfBirth: "",
    subject: "",
    studentName: "",
    fatherName: "",
    motherName: "",
    sgpaOdd: "",
    sgpaEven: "",
    email: "",
    mobile: "",
    otp: "",
    password: "",
    confirmPassword: "",
    gender: "",
    roomPreference: "",
  });

  const [stepCompletion, setStepCompletion] = useState({
    1: false,
    2: false,
    3: false,
    4: true,
  });

  const handleOtpVerified = (verified) => {
    setIsOtpVerified(verified);
  };

  const isStepComplete = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return (
          formData.course &&
          formData.semester &&
          formData.examType &&
          formData.rollno &&
          formData.dateOfBirth &&
          isEligible
        );
      case 2:
        return (
          formData.email &&
          formData.mobile &&
          formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          isOtpVerified
        );
      case 3:
        return formData.gender && formData.roomPreference;
      case 4:
        return true;
      default:
        return false;
    }
  };

  useEffect(() => {
    setStepCompletion((prevCompletion) => ({
      ...prevCompletion,
      [step]: isStepComplete(step),
    }));
  }, [formData, step, isEligible, isOtpVerified]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEligibilityCheck = (eligible, studentDetails) => {
    setIsEligible(eligible);
    if (eligible && studentDetails) {
      setFormData((prevData) => ({
        ...prevData,
        studentName: studentDetails.name,
        fatherName: studentDetails.fatherName,
        sgpaOdd: studentDetails.sgpaOdd,
        sgpaEven: studentDetails.sgpaEven,
        motherName: studentDetails.motherName,
        courseName: studentDetails.courseName,
      }));
    }
  };

  const nextStep = async () => {
    if (stepCompletion[step]) {
      if (step === 2) {
        // On EmailMobileVerification step, do email verification
        try {
          await authService.emailVerification({
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            otp: formData.otp,
            mobile: formData.mobile,
            studentName: formData.studentName || formData.name || "",
            gender: formData.gender || "",
          });
          setStep((prevStep) => Math.min(prevStep + 1, 5));
        } catch (error) {
          alert(
            error.message || error?.payload?.message || "Registration failed."
          );
        }
      } else {
        setStep((prevStep) => Math.min(prevStep + 1, 5));
      }
    } else {
      alert("Please complete all required fields before proceeding.");
    }
  };

  const prevStep = () => {
    setStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
  const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 hover:border-slate-400 hover:bg-slate-50";

  return (
    <>
      <RegHeader />
      <main className="bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
        <section className="mx-auto w-full max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <StepIndicator currentStep={step} />

              <div className="space-y-8">
                {step === 1 && (
                  <PersonalInformation
                    formData={formData}
                    handleChange={handleChange}
                    onEligibilityCheck={handleEligibilityCheck}
                  />
                )}
                {step === 2 && (
                  <EmailMobileVerification
                    formData={formData}
                    handleChange={handleChange}
                    onOtpVerified={handleOtpVerified}
                  />
                )}
                {step === 3 && (
                  <HostelSelection
                    formData={formData}
                    handleChange={handleChange}
                  />
                )}
                {step === 4 && <Preview formData={formData} />}
                {step === 5 && <Submit formData={formData} />}
              </div>

              {step < 5 && (
                <div className="mt-10 flex items-center justify-between gap-4">
                  {step > 1 ? (
                    <button className={secondaryButtonClass} onClick={prevStep}>
                      Previous
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    className={`${primaryButtonClass} ${
                      stepCompletion[step]
                        ? "bg-sky-600 hover:bg-sky-700"
                        : "cursor-not-allowed bg-slate-300"
                    }`}
                    onClick={nextStep}
                    disabled={!stepCompletion[step]}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <RegFooter />
    </>
  );
};

export default MultiStepForm;
