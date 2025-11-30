import React, { useState, useEffect } from "react";
import NoticeViewer from "../NoticeViewer/NoticeViewer";
import { publicNoticeService } from "../../services/api/publicNoticeService";

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  useEffect(() => {
    fetchPublishedNotices();

    // Listen for refresh events from the publish notice functionality
    const handleRefresh = () => {
      console.log("NoticeBoard: Received refresh event, refetching notices...");
      fetchPublishedNotices();
    };

    window.addEventListener("refreshNoticeBoard", handleRefresh);
    return () => {
      window.removeEventListener("refreshNoticeBoard", handleRefresh);
    };
  }, []);

  useEffect(() => {
    fetchPublishedNotices();
  }, [showAll]);

  const fetchPublishedNotices = async () => {
    console.log("NoticeBoard: Fetching published notices...");
    try {
      const result = await publicNoticeService.fetchPublishedNotices({
        limit: showAll ? 20 : 5,
      });
      console.log("NoticeBoard: API result:", result);
      if (result?.notices) {
        console.log("NoticeBoard: Setting notices:", result.notices);
        setNotices(result.notices);
      }
    } catch (error) {
      console.error("NoticeBoard: Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleViewAll = () => {
    setShowAll(!showAll);
  };

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isNoticeActive = (notice) => {
    if (!notice.effectiveDate) return true;
    const now = new Date();
    const effectiveDate = new Date(notice.effectiveDate);
    const expiryDate = notice.expiryDate ? new Date(notice.expiryDate) : null;

    return effectiveDate <= now && (!expiryDate || expiryDate >= now);
  };
  const getNoticeStatusBadge = (notice) => {
    const now = new Date();
    const effectiveDate = notice.effectiveDate
      ? new Date(notice.effectiveDate)
      : null;
    const expiryDate = notice.expiryDate ? new Date(notice.expiryDate) : null;

    if (expiryDate && expiryDate < now) {
      return (
        <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded text-center">
          EXPIRED
        </span>
      );
    }
    if (effectiveDate && effectiveDate > now) {
      return (
        <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-center">
          UPCOMING
        </span>
      );
    }
    if (isNoticeActive(notice)) {
      return (
        <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded text-center">
          ACTIVE
        </span>
      );
    }
    return null;
  };
  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
  };

  const handleCloseNoticeViewer = () => {
    setSelectedNotice(null);
  };
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-red-50 rounded-lg shadow-md border border-red-200">
        <h3 className="text-lg lg:text-xl font-bold text-red-800 border-b-2 border-red-700 p-3 pb-2">
          Notice Board
        </h3>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="h-full flex flex-col bg-red-50 rounded-lg shadow-md border border-red-200">
        <div className="flex items-center justify-between p-3 pb-2 border-b-2 border-red-700">
          <h3 className="text-lg lg:text-xl font-bold text-red-800">
            Notice Board
          </h3>
          <button
            onClick={() => {
              setLoading(true);
              fetchPublishedNotices();
            }}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Refresh notices"
          >
            <svg
              className="w-4 h-4 lg:w-5 lg:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-3">
          {notices.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <p className="text-sm text-center">No notices available.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-gray-100">
                <ul className="space-y-3">
                  {notices
                    .slice(0, showAll ? notices.length : 3)
                    .map((notice) => (
                      <li
                        key={notice._id}
                        className="text-xs lg:text-sm text-gray-700 hover:text-red-700 cursor-pointer border-b border-red-100 pb-2 last:border-b-0"
                        onClick={() => handleNoticeClick(notice)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {notice.isImportant && (
                              <span className="font-semibold text-red-600 text-xs">
                                IMPORTANT:{" "}
                              </span>
                            )}
                            <span className="font-medium text-xs lg:text-sm block truncate">
                              {notice.title}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(
                                notice.publishedAt || notice.createdAt
                              )}{" "}
                              • {notice.category}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {truncateText(notice.content, 80)}
                              {notice.content.length > 80 && (
                                <span className="text-red-600 font-medium ml-1 cursor-pointer hover:underline">
                                  Read more...
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex flex-col gap-1">
                            {getNoticeStatusBadge(notice)}
                            {notice.pdfPath ? (
                              <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded text-center">
                                PDF
                              </span>
                            ) : (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-center">
                                VIEW
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}

                  {notices.length > 3 && !showAll && (
                    <li className="text-xs text-gray-500 text-center py-2">
                      ... and {notices.length - 3} more notices
                    </li>
                  )}
                </ul>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  onClick={handleViewAll}
                  className="w-full bg-red-700 text-white py-2 rounded-md hover:bg-red-800 transition-colors text-xs lg:text-sm font-medium"
                  disabled={notices.length === 0}
                >
                  {showAll ? "Show Less" : "View All Notices"}
                </button>

                {notices.length > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Showing{" "}
                      {Math.min(showAll ? notices.length : 3, notices.length)}{" "}
                      of {notices.length} notices
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notice Viewer Modal */}
      {selectedNotice && (
        <NoticeViewer
          notice={selectedNotice}
          onClose={handleCloseNoticeViewer}
        />
      )}
    </>
  );
};

export default NoticeBoard;
