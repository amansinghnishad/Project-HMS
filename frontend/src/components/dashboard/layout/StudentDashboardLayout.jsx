import React from "react";
import { FaExclamationTriangle, FaSpinner } from "react-icons/fa";

/**
 * Generic layout for student dashboard pages that share the same shell:
 * - hero header with icon, title, description, and primary action
 * - secondary section with filters + history list that handles loading/error/empty states
 *
 * Provide render props/React nodes for the variable parts so individual pages only
 * focus on domain-specific logic and pass data down to this layout.
 */
const StudentDashboardLayout = ({
  backgroundClass = "min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6",
  containerClass = "mx-auto flex max-w-6xl flex-col gap-6",
  headerIcon = null,
  headerIconClassName = "flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600",
  title,
  description,
  meta,
  primaryAction,
  headerExtras,
  sectionTitle,
  sectionDescription,
  filters,
  isLoading = false,
  loadingText = "Loading data…",
  loadingNode,
  errorMessage,
  errorDetails,
  hasContent = false,
  emptyState,
  children,
  afterContent,
}) => {
  const renderHeaderIcon = () => {
    if (!headerIcon) {
      return null;
    }

    if (React.isValidElement(headerIcon)) {
      return headerIcon;
    }

    const IconComponent = headerIcon;
    return IconComponent ? <IconComponent size={24} /> : null;
  };

  const primaryActionClassName =
    primaryAction?.className ||
    "inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const loadingFallback = loadingNode || (
    <div className="flex items-center justify-center py-12 text-sm text-gray-600">
      <FaSpinner className="mr-2 animate-spin" />
      {loadingText}
    </div>
  );

  const emptyStateContent = emptyState ? (
    <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-10 text-center text-sm text-gray-600">
      {emptyState.title ? (
        <p className="text-base font-semibold text-gray-700">
          {emptyState.title}
        </p>
      ) : null}
      {emptyState.description ? (
        <p className="mt-2 text-sm text-gray-500">{emptyState.description}</p>
      ) : null}
      {emptyState.action ? (
        <div className="mt-4 inline-flex items-center gap-2">
          {emptyState.action}
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={backgroundClass}>
      <div className={containerClass}>
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              {headerIcon ? (
                <span className={headerIconClassName}>
                  {renderHeaderIcon()}
                </span>
              ) : null}
              <div>
                {title ? (
                  <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                    {title}
                  </h1>
                ) : null}
                {description ? (
                  <p className="mt-1 text-sm text-gray-600">{description}</p>
                ) : null}
                {meta ? (
                  <div className="mt-2 text-xs text-gray-500">{meta}</div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  className={primaryActionClassName}
                >
                  {primaryAction.icon ? (
                    <span>{primaryAction.icon}</span>
                  ) : null}
                  <span>{primaryAction.label}</span>
                </button>
              ) : null}
              {headerExtras}
            </div>
          </header>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              {sectionTitle ? (
                <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
                  {sectionTitle}
                </h2>
              ) : null}
              {sectionDescription ? (
                <p className="mt-1 text-sm text-gray-600">
                  {sectionDescription}
                </p>
              ) : null}
            </div>
            {filters ? (
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                {filters}
              </div>
            ) : null}
          </header>

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle />
                <span>{errorMessage}</span>
              </div>
              {errorDetails ? (
                <p className="mt-2 text-xs text-red-600">{errorDetails}</p>
              ) : null}
            </div>
          ) : null}

          {isLoading ? (
            loadingFallback
          ) : hasContent ? (
            <div className="mt-6">{children}</div>
          ) : (
            <div className="mt-6">{emptyStateContent}</div>
          )}

          {afterContent ? <div className="mt-6">{afterContent}</div> : null}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboardLayout;
