import React from "react";
import { FaEnvelope, FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Hostels", href: "/hostels" },
  { label: "Rules & Regulations", href: "/rules" },
  { label: "Contact Us", href: "/contact" },
];

const socialLinks = [
  {
    icon: <FaFacebookF />,
    href: "https://www.facebook.com/universityoflucknow",
    label: "Facebook",
  },
  {
    icon: <FaTwitter />,
    href: "https://twitter.com/universityoflucknow",
    label: "Twitter",
  },
  {
    icon: <FaYoutube />,
    href: "https://www.youtube.com/universityoflucknow",
    label: "YouTube",
  },
  {
    icon: <FaEnvelope />,
    href: "mailto:hostel.management@lkouniv.ac.in",
    label: "Email",
  },
];

const contactPeople = [
  "Dr. Khushboo Verma - 7991200535",
  "Dr. Rachana Pathak - 9044375304",
  "Dr. Savya Sachi - 9811746901",
  "Dr. R. P. Singh - 8090196096",
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/universitylogo.png"
              alt="University of Lucknow"
              className="h-14 w-14 rounded-2xl bg-white/10 p-2"
            />
            <div>
              <h2 className="text-xl font-semibold text-white">
                University of Lucknow
              </h2>
              <p className="text-sm text-slate-400">Hostel Management System</p>
            </div>
          </div>
          <p className="max-w-sm text-sm text-slate-400">
            Helping students manage their hostel life smoothly with quick access
            to essential information and support contacts.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Quick links
          </h3>
          <nav className="grid w-full grid-cols-2 gap-3 text-sm text-slate-300 sm:max-w-xs">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Hostel contacts
          </h3>
          <p className="text-sm text-slate-400">
            Reach out to the hostel administration team for quick assistance.
          </p>
          <ul className="space-y-2 text-sm text-blue-300">
            {contactPeople.map((person) => (
              <li key={person} className="transition hover:text-blue-200">
                {person}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {currentYear} University of Lucknow. All rights reserved.
          </p>
          <p>
            For technical support email{" "}
            <a
              href="mailto:hostel.support@lkouniv.ac.in"
              className="text-blue-300 transition hover:text-blue-200"
            >
              hostel.support@lkouniv.ac.in
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
