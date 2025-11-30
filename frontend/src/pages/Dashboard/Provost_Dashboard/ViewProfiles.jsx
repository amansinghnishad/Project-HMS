import React, { useEffect, useMemo, useState } from "react";
import {
  FaBed,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaUser,
  FaUserGraduate,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { apiConnector } from "../../../services/apiconnector";
import Pagination from "../../../components/common/Pagination";

const ViewProfiles = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  const fetchProfiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const { data } = await apiConnector(
        "GET",
        "/allotment/allotted-students",
        null,
        { Authorization: `Bearer ${token}` }
      );

      const results = data?.data || [];
      setStudents(results);
      setFilteredStudents(results);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to load profiles.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let result = [...students];

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      result = result.filter((item) => {
        const profile = item.studentProfileId || {};
        return [
          profile.name,
          profile.rollNumber,
          profile.email,
          profile.courseName,
          item.allottedRoomNumber,
        ]
          .map((value) => (value ? String(value).toLowerCase() : ""))
          .some((value) => value.includes(query));
      });
    }

    if (genderFilter !== "all") {
      result = result.filter(
        (item) =>
          (item.studentProfileId?.gender || "").toLowerCase() === genderFilter
      );
    }

    if (courseFilter) {
      result = result.filter(
        (item) => item.studentProfileId?.courseName === courseFilter
      );
    }

    setFilteredStudents(result);
  }, [students, searchTerm, genderFilter, courseFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter, courseFilter]);

  const courseOptions = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((item) => item.studentProfileId?.courseName)
          .filter(Boolean)
      )
    ).sort();
  }, [students]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / PAGE_SIZE)
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!selectedStudent) {
      return;
    }
    const stillVisible = filteredStudents.some(
      (item) => item._id === selectedStudent._id
    );
    if (!stillVisible) {
      setSelectedStudent(null);
    }
  }, [filteredStudents, selectedStudent]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-emerald-100 bg-white">
        <div className="flex items-center gap-3 text-emerald-700">
          <span className="h-3 w-3 animate-ping rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">Loading student profiles…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <p className="text-base font-semibold">Unable to load profiles</p>
        <p className="mt-2 text-sm opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, roll number, course, or room"
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 py-2.5 pl-10 pr-3 text-sm text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-3 py-2.5 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All courses</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
        {filteredStudents.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-emerald-600">
            <FaUserGraduate className="h-10 w-10 text-emerald-300" />
            <p className="text-sm font-medium">No matching profiles</p>
            <p className="text-xs opacity-70">
              Adjust your search or filters to see results.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-emerald-50 text-sm text-emerald-900">
            <thead className="bg-emerald-50/60 text-left text-xs font-semibold uppercase tracking-wide text-emerald-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Room</th>
                <th className="hidden px-4 py-3 md:table-cell">Email</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {paginatedStudents.map((item, index) => (
                <StudentRow
                  key={item._id}
                  index={startIndex + index}
                  student={item}
                  onSelect={setSelectedStudent}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Pagination
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredStudents.length}
        onPageChange={setCurrentPage}
      />

      {selectedStudent ? (
        <ProfileDrawer
          student={selectedStudent}
          onDismiss={() => setSelectedStudent(null)}
        />
      ) : null}
    </div>
  );
};

const StudentRow = ({ index, student, onSelect }) => {
  const profile = student.studentProfileId || {};

  return (
    <tr className="hover:bg-emerald-50/40">
      <td className="px-4 py-3 text-xs font-semibold text-emerald-500">
        {index + 1}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <FaUser />
          </div>
          <div>
            <p className="font-medium">{profile.name || "Not available"}</p>
            <p className="text-xs text-emerald-500">
              {profile.rollNumber || "Roll not available"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-sm">{profile.courseName || "—"}</p>
        <p className="text-xs text-emerald-500">
          Semester {profile.semester || "—"}
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <FaBed className="text-emerald-400" />
          <span>{student.allottedRoomNumber || "—"}</span>
        </div>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <p className="flex items-center gap-2 text-xs text-emerald-600">
          <FaEnvelope className="text-emerald-400" />
          <span className="truncate">{profile.email || "—"}</span>
        </p>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onSelect(student)}
          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          View
        </button>
      </td>
    </tr>
  );
};

const ProfileDrawer = ({ student, onDismiss }) => {
  const profile = student.studentProfileId || {};
  const name = profile.name || "Not available";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-6 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-emerald-100 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-emerald-50 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              Student profile
            </p>
            <h2 className="mt-1 text-xl font-semibold text-emerald-900">
              {name}
            </h2>
            <p className="text-xs text-emerald-600">
              {profile.rollNumber || "Roll not available"}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 p-6 text-sm text-emerald-900">
          <Detail
            label="Email"
            icon={<FaEnvelope className="text-emerald-400" />}
          >
            {profile.email || "—"}
          </Detail>
          <Detail
            label="Contact"
            icon={<FaPhone className="text-emerald-400" />}
          >
            {profile.contactNumber || student.userId?.mobile || "—"}
          </Detail>
          <Detail
            label="Course"
            icon={<FaUserGraduate className="text-emerald-400" />}
          >
            {profile.courseName || "—"} · Semester {profile.semester || "—"}
          </Detail>
          <Detail label="Room preference">
            {profile.roomPreference || "—"}
          </Detail>
          <Detail
            label="Allotted room"
            icon={<FaBed className="text-emerald-400" />}
          >
            {student.hostelName || "Hostel —"}, Room{" "}
            {student.allottedRoomNumber || "—"}
          </Detail>
        </div>

        <div className="flex justify-end gap-3 border-t border-emerald-50 p-4">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, icon, children }) => (
  <div className="flex items-start gap-3 rounded-xl bg-emerald-50/40 p-3">
    {icon ? (
      <div className="mt-0.5 flex h-6 w-6 items-center justify-center text-emerald-500">
        {icon}
      </div>
    ) : null}
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-emerald-900">{children}</p>
    </div>
  </div>
);

export default ViewProfiles;
