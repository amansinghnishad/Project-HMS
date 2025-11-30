import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { allotmentService } from "../../services/api/allotmentService";

const HostelAllotment = () => {
  const [students, setStudents] = useState([]);
  const [allotmentComplete, setAllotmentComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomAvailability, setRoomAvailability] = useState(null);

  // Fetch initial room availability
  useEffect(() => {
    const fetchAvailability = async () => {
      console.log("[HostelAllotment] Fetching initial room availability...");
      const result = await allotmentService.fetchRoomAvailability();
      console.log(
        "[HostelAllotment] Initial room availability result:",
        result
      );
      if (result?.availability) {
        setRoomAvailability(result.availability);
      }
    };
    fetchAvailability();
  }, []);

  // Function to fetch allotted students
  const fetchAllottedStudents = async () => {
    console.log("[HostelAllotment] Fetching allotted students...");
    setIsLoading(true);
    const result = await allotmentService.fetchAllottedStudents();
    console.log("[HostelAllotment] Fetch allotted students result:", result);
    if (result && result.success && result.data) {
      const formattedStudents = result.data.map((student) => ({
        Name: student.name,
        RollNo: student.rollNumber,
        Course: student.courseName,
        // Gender: student.studentProfileId?.userId?.gender || 'N/A', // Assuming gender is on User via StudentProfile. Let's get this from studentProfileId directly if populated
        Gender: student.studentProfileId?.gender || "N/A", // Check if gender is directly on studentProfileId after populate
        RoomPreference: student.roomPreference,
        HostelName:
          student.allottedHostelType === "boys"
            ? "Kautilya Hall"
            : "Other Hostel", // Adjust as needed
        // HostelId: student.allottedRoomNumber, // This was likely meant to be a static ID, using room number for now
        AllottedRoom: student.allottedRoomNumber,
        AllottedBed: student.allottedBedId,
        Floor: student.floor,
      }));
      console.log("[HostelAllotment] Formatted students:", formattedStudents);
      setStudents(formattedStudents);
      setAllotmentComplete(true);
    } else {
      console.log(
        "[HostelAllotment] No allotted students found or error fetching them."
      );
      setStudents([]);
      setAllotmentComplete(true); // Still set to true to show the "no students" message if applicable
    }
    setIsLoading(false);
  };

  // Load allotted students when component mounts
  useEffect(() => {
    fetchAllottedStudents();
  }, []);

  const handleInitiateAllotment = async () => {
    console.log("[HostelAllotment] handleInitiateAllotment called");
    setIsLoading(true);
    const result = await allotmentService.triggerAllotment();
    console.log("[HostelAllotment] allotHostelRooms API call result:", result);

    if (result && result.success) {
      toast.success(
        result.message || "Allotment process completed successfully!"
      );
      console.log(
        "[HostelAllotment] Allotment successful, now fetching updated student list and availability..."
      );
      await fetchAllottedStudents(); // Refresh the list of allotted students
      const updatedAvailability =
        await allotmentService.fetchRoomAvailability(); // Refresh availability
      console.log(
        "[HostelAllotment] Updated room availability result:",
        updatedAvailability
      );
      if (updatedAvailability && updatedAvailability.success) {
        setRoomAvailability(updatedAvailability.availability);
      }
    } else {
      toast.error(
        result?.message ||
          "Allotment process failed. Check console for details."
      );
      console.error(
        "[HostelAllotment] Allotment process failed. API response:",
        result
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-full sm:max-w-4xl min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-blue-700">
        Hostel Allotment System (Kautilya Hall)
      </h1>{" "}
      <div className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
          Allotment Control
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
          Click the button below to initiate the automated room allotment
          process for Kautilya Hall (Boys' Hostel).
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={handleInitiateAllotment}
            disabled={isLoading}
            className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 disabled:bg-gray-400 text-sm sm:text-base transition-all duration-200 font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {isLoading
              ? "Processing Allotment..."
              : "Initiate Kautilya Hall Allotment"}
          </button>
          {students.length > 0 && (
            <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-md">
              <span className="font-medium">{students.length}</span> students
              currently allotted
            </div>
          )}
        </div>
      </div>{" "}
      {roomAvailability && (
        <div className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            Kautilya Hall Room Availability
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Single Rooms
              </h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Beds:</span>
                  <span className="font-semibold text-gray-900">
                    {roomAvailability.boys?.singleTotalBeds || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Occupied:</span>
                  <span className="font-semibold text-red-600">
                    {roomAvailability.boys?.singleOccupiedBeds || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Available:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {roomAvailability.boys?.singleAvailableBeds || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-medium text-green-800 mb-3 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Triple Rooms
              </h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Beds:</span>
                  <span className="font-semibold text-gray-900">
                    {roomAvailability.boys?.tripleTotalBeds || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Occupied:</span>
                  <span className="font-semibold text-red-600">
                    {roomAvailability.boys?.tripleOccupiedBeds || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Available:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {roomAvailability.boys?.tripleAvailableBeds || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {isLoading && (
        <p className="text-center text-blue-500 py-4 text-sm sm:text-base">
          Loading allotment data...
        </p>
      )}
      {allotmentComplete && students.length > 0 && (
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
            Hostel Allotment Results
          </h2>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto mb-4">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Preference
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Hostel
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Room No
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Bed ID
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Floor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr
                    key={student.RollNo || index}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition-colors duration-150`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-900">
                      {student.Name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {student.RollNo}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {student.Course}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.RoomPreference}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {student.HostelName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-green-600">
                      {student.AllottedRoom}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {student.AllottedBed}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {student.Floor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet Table View */}
          <div className="hidden md:block lg:hidden overflow-x-auto mb-4">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Preference
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">
                    Floor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr
                    key={student.RollNo || index}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition-colors duration-150`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-900">
                      {student.Name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {student.RollNo}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.RoomPreference}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-green-600">
                      {student.AllottedRoom}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {student.Floor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 mb-4">
            {students.map((student, index) => (
              <div
                key={student.RollNo || index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {student.Name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Room {student.AllottedRoom}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Roll No:</span>
                    <span className="font-medium">{student.RollNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium">{student.Course}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preference:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {student.RoomPreference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hostel:</span>
                    <span className="font-medium">{student.HostelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bed ID:</span>
                    <span className="font-medium">{student.AllottedBed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-medium">{student.Floor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Total Allotted Students: {students.length}
            </p>
          </div>
        </div>
      )}
      {allotmentComplete && students.length === 0 && !isLoading && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            No students are currently allotted to Kautilya Hall, or the
            allotment process has not been run yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default HostelAllotment;
