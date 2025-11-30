import React from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

/**
 * Reusable modal shell for dashboard flows. Handles overlay, header, and close controls
 * while leaving the body/footers to the caller.
 */
const ModalLayout = ({
  isOpen,
  onClose,
  icon = null,
  iconBackgroundClassName = "flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600",
  title,
  description,
  children,
  footer,
  size = "lg",
  showCloseButton = true,
  className = "",
}) => {
  if (!isOpen) {
    return null;
  }

  const sizeClass = getSizeClass(size);
  const iconNode = resolveIcon(icon);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />

      <div
        className={`relative z-10 w-full ${sizeClass} rounded-3xl bg-white p-6 shadow-2xl ${className}`}
      >
        {(title || description || iconNode) && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {iconNode ? (
                <span className={iconBackgroundClassName}>{iconNode}</span>
              ) : null}
              <div>
                {title ? (
                  <h2 className="text-xl font-semibold text-gray-900">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="mt-1 text-sm text-gray-600">{description}</p>
                ) : null}
              </div>
            </div>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            ) : null}
          </div>
        )}

        <div className={title || description || iconNode ? "mt-6" : ""}>
          {children}
        </div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
};

const getSizeClass = (value) => {
  switch (value) {
    case "sm":
      return "max-w-md";
    case "md":
      return "max-w-xl";
    case "full":
      return "max-w-5xl";
    case "lg":
    default:
      return "max-w-3xl";
  }
};

const resolveIcon = (icon) => {
  if (!icon) {
    return null;
  }

  if (React.isValidElement(icon)) {
    return icon;
  }

  if (typeof icon === "function") {
    const IconComponent = icon;
    return <IconComponent size={20} />;
  }

  return null;
};

export default ModalLayout;
