import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import {
  FaUserGraduate,
  FaUserTie,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import Footer from "../../components/Footer/Footer";

const loginOptions = [
  {
    to: "/login/student-login",
    title: "Student portal",
    description:
      "Check allotments, request leaves, and stay updated with notices.",
    icon: FaUserGraduate,
    badge: "Students",
  },
  {
    to: "/login/chief-provost-login",
    title: "Chief Provost console",
    description:
      "Oversee escalations, policies, and hostel-wide communication.",
    icon: FaUserTie,
    badge: "Leadership",
  },
  {
    to: "/login/provost-login",
    title: "Provost workspace",
    description:
      "Track maintenance, guest entries, and activity logs centrally.",
    icon: FaUserShield,
    badge: "Administration",
  },
  {
    to: "/login/other-login",
    title: "Team member access",
    description:
      "Facilities and support teams can collaborate and share updates.",
    icon: FaUsers,
    badge: "Staff",
  },
];

const Login = () => {
  return (
    <>
      <Navbar />
      <section className="bg-gray-50">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-16 md:px-10 lg:flex-row lg:items-center">
          <header className="w-full max-w-xl text-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Choose your access
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              One platform for every role
            </h1>
            <p className="mt-4 text-base text-slate-600">
              Select the login that matches your responsibility. Each workspace
              keeps information focused and permissions aligned with university
              policy.
            </p>
            <ul className="mt-8 space-y-2 text-sm text-slate-600">
              <li>• Consistent experience across student and admin journeys</li>
              <li>• OTP-enabled recovery and session protection</li>
              <li>• Built to mirror the rest of the HMS interface</li>
            </ul>
          </header>

          <div className="w-full max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {loginOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Link
                    key={option.to}
                    to={option.to}
                    className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                        {option.badge}
                      </span>
                      <div className="rounded-full bg-slate-100 p-3 text-lg text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                        <Icon />
                      </div>
                    </div>
                    <h2 className="mt-6 text-xl font-semibold text-slate-900">
                      {option.title}
                    </h2>
                    <p className="mt-3 text-sm text-slate-600">
                      {option.description}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3">
                      Continue
                      <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <p>
                Need an account? Request access from your hostel administrator.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Login;
