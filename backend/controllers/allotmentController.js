const RegisteredStudentProfile = require('../models/RegisteredStudentProfile');
const AllottedStudent = require('../models/AllottedStudent');
const baseHostelRoomsData = require('../data/kautilyaHallData.js'); // Load the base static data

// Helper function to calculate average SGPA
const calculateAverageSgpa = (sgpaOdd, sgpaEven) => {
    const odd = (typeof sgpaOdd === 'number' && sgpaOdd >= 0) ? sgpaOdd : 0;
    const even = (typeof sgpaEven === 'number' && sgpaEven >= 0) ? sgpaEven : 0;
    if (odd === 0 && even === 0) return 0;
    // Ensure that if one SGPA is present, it's treated as the average.
    if (odd > 0 && even === 0) return odd;
    if (even > 0 && odd === 0) return even;
    return (odd + even) / 2;
};

exports.allotRooms = async (req, res) => {
    console.log("--- Starting Allotment Process ---");
    // 1a. Create a deep copy of base hostel room data
    let currentHostelRoomsState = JSON.parse(JSON.stringify(baseHostelRoomsData));

    // Initialize currentOccupancy to 0 and clean beds for all rooms in the copy
    currentHostelRoomsState.forEach(room => {
        room.currentOccupancy = 0;
        room.beds.forEach(bed => {
            delete bed.studentId;
            delete bed.rollNumber;
            delete bed.sgpa;
        });
    });

    try {
        // 1b. Fetch ALL existing allotments to know which beds are ALREADY taken
        const allPreviouslyAllottedStudents = await AllottedStudent.find({})
            .populate('userId', 'name')
            .populate('studentProfileId', 'rollNumber');
        console.log(`Found ${allPreviouslyAllottedStudents.length} previously allotted students.`);

        // 1c. Update currentHostelRoomsState based on existing allotments
        allPreviouslyAllottedStudents.forEach(allottedStudent => {
            const roomInState = currentHostelRoomsState.find(r => r.roomNumber === allottedStudent.allottedRoomNumber && r.hostelType === allottedStudent.allottedHostelType);
            if (roomInState) {
                const bedInState = roomInState.beds.find(b => b.bedId === allottedStudent.allottedBedId);
                if (bedInState && !bedInState.studentId) {
                    if (!allottedStudent.userId || !allottedStudent.userId._id) {
                        console.warn(`Skipping occupancy mark for allotment ${allottedStudent._id} because userId is missing.`);
                        return;
                    }
                    bedInState.studentId = allottedStudent.userId._id.toString();
                    bedInState.rollNumber = allottedStudent.rollNumber;
                    roomInState.currentOccupancy++;
                }
            }
        });
        console.log("Updated currentHostelRoomsState with existing allotments.");

        const orphanedAllotments = allPreviouslyAllottedStudents.filter(a => !a.studentProfileId);
        if (orphanedAllotments.length > 0) {
            console.warn(`Found ${orphanedAllotments.length} allotted records without a linked studentProfileId. They will be ignored for exclusion.`);
            orphanedAllotments.forEach(orphan => {
                console.warn(`  - Orphan allotment ID: ${orphan._id}, userId: ${orphan.userId?._id || 'N/A'}, rollNumber: ${orphan.rollNumber || 'N/A'}`);
            });
        }

        const allottedProfileIds = allPreviouslyAllottedStudents
            .filter(a => a.studentProfileId && a.studentProfileId._id)
            .map(a => a.studentProfileId._id.toString());
        console.log("Previously Allotted Profile IDs (these will be excluded from new allotment):");
        allottedProfileIds.forEach(id => console.log(`  - ${id}`));

        // Log all students who are marked as eligible, BEFORE filtering out already allotted ones
        const allEligibleProfiles = await RegisteredStudentProfile.find({ isEligible: true }).populate('userId', 'name');
        console.log(`Found ${allEligibleProfiles.length} total profiles marked as isEligible: true in RegisteredStudentProfile collection:`);
        allEligibleProfiles.forEach(p => console.log(`  - Eligible Profile: ${p.userId.name}, Profile ID: ${p._id}, isEligible: ${p.isEligible}`));

        // 1d. Fetch all eligible students who are NOT YET allotted
        const newEligibleStudents = await RegisteredStudentProfile.find({
            isEligible: true,
            _id: { $nin: allottedProfileIds }
        }).populate('userId', 'gender name');
        console.log(`Found ${newEligibleStudents.length} new eligible students not yet allotted (after excluding previously allotted).`);

        if (!newEligibleStudents || newEligibleStudents.length === 0) {
            const availability = getRoomAvailabilityFromStaticData(currentHostelRoomsState);
            console.log("No new eligible students found. Current availability calculated.");
            return res.status(200).json({
                success: true,
                message: 'No new eligible students found for allotment at this time.',
                allottedCount: 0,
                allottedStudents: [],
                availability
            });
        }

        let studentsToProcess = newEligibleStudents
            .filter(student => student.userId && student.userId.gender && student.userId.gender.toLowerCase() === 'male')
            .map(student => ({
                ...student.toObject(),
                userId: student.userId.toObject ? student.userId.toObject() : student.userId,
                averageSgpa: calculateAverageSgpa(student.sgpaOdd, student.sgpaEven),
            }));
        console.log(`Filtered down to ${studentsToProcess.length} male students to process.`);
        studentsToProcess.forEach(s => console.log(`  - Eligible Student: ${s.userId.name}, Roll: ${s.rollNumber}, SGPA: ${s.averageSgpa}, Pref: ${s.roomPreference}, ID: ${s._id}`));

        studentsToProcess.sort((a, b) => b.averageSgpa - a.averageSgpa);
        console.log("Sorted male students by SGPA (descending).");

        let remainingBedsInHostel = 0;
        currentHostelRoomsState.forEach(room => {
            if (room.hostelType === 'boys') {
                remainingBedsInHostel += (room.capacity - room.currentOccupancy);
            }
        });
        console.log(`Calculated remaining beds in Kautilya Hall (boys): ${remainingBedsInHostel}`);

        if (studentsToProcess.length > remainingBedsInHostel) {
            console.log(`More eligible male students (${studentsToProcess.length}) than remaining available beds (${remainingBedsInHostel}). Slicing to top ${remainingBedsInHostel} by SGPA.`);
            studentsToProcess = studentsToProcess.slice(0, remainingBedsInHostel);
            console.log(`Students to process after slicing: ${studentsToProcess.length}`);
        }

        const newlyAllottedStudentsList = [];
        const dbUpdatePromises = [];

        const singlePreferenceStudents = studentsToProcess
            .filter(s => s.roomPreference === 'single')
            .sort((a, b) => b.averageSgpa - a.averageSgpa); // Already sorted by studentsToProcess, but re-sorting doesn't hurt

        let otherStudents = studentsToProcess
            .filter(s => s.roomPreference !== 'single')
            .sort((a, b) => b.averageSgpa - a.averageSgpa); // Already sorted, but re-sorting doesn't hurt

        console.log(`Initial singlePreferenceStudents: ${singlePreferenceStudents.length}`);
        singlePreferenceStudents.forEach(s => console.log(`  - SinglePref: ${s.userId.name}, SGPA: ${s.averageSgpa}`));
        console.log(`Initial otherStudents (non-single pref): ${otherStudents.length}`);
        otherStudents.forEach(s => console.log(`  - OtherPrefInit: ${s.userId.name}, SGPA: ${s.averageSgpa}`));

        let singleRoomsNewlyAllottedCount = 0;
        const totalSingleBedsAvailable = currentHostelRoomsState
            .filter(r => r.type === 'single' && r.hostelType === 'boys')
            .reduce((acc, room) => acc + (room.capacity - room.currentOccupancy), 0);
        console.log(`Total single beds available for new allotment: ${totalSingleBedsAvailable}`);

        const tempOtherStudentsFromSinglePref = []; // Students who preferred single but couldn't get it

        for (const student of singlePreferenceStudents) {
            if (newlyAllottedStudentsList.length >= remainingBedsInHostel) {
                console.log(`Overall bed limit reached during single pref processing for ${student.userId.name}. Adding to consider for other types.`);
                tempOtherStudentsFromSinglePref.push(student);
                continue; // Continue to add remaining singlePreferenceStudents to temp list
            }

            let allottedSingle = false;
            if (singleRoomsNewlyAllottedCount < totalSingleBedsAvailable) {
                const roomResult = findAndOccupyBed('single', student, currentHostelRoomsState);
                if (roomResult) {
                    const { room, bed } = roomResult;
                    console.log(`Allotting SINGLE room ${room.roomNumber}-${bed.bedId} to ${student.userId.name}`);
                    newlyAllottedStudentsList.push(createAllotmentEntry(student, room, bed, 'single', dbUpdatePromises));
                    singleRoomsNewlyAllottedCount++;
                    allottedSingle = true;
                }
            }

            if (!allottedSingle) {
                console.log(`Could not allot SINGLE room for ${student.userId.name} (Roll: ${student.rollNumber}) or no single rooms left/available. Adding to consider for other types.`);
                tempOtherStudentsFromSinglePref.push(student);
            }
        }

        // Add students who couldn't get their single preference to the main otherStudents list
        if (tempOtherStudentsFromSinglePref.length > 0) {
            otherStudents.push(...tempOtherStudentsFromSinglePref);
            console.log(`Added ${tempOtherStudentsFromSinglePref.length} students from single preference to otherStudents list.`);
        }

        // Re-sort otherStudents as it might have new additions from singlePreferenceStudents
        otherStudents.sort((a, b) => b.averageSgpa - a.averageSgpa);
        console.log(`Re-sorted otherStudents list. Now has ${otherStudents.length} students:`);
        otherStudents.forEach(s => console.log(`  -> Considering for Other/Triple: ${s.userId.name}, Roll: ${s.rollNumber}, SGPA: ${s.averageSgpa}, OriginalPref: ${s.roomPreference}, ID: ${s._id}`));

        for (const student of otherStudents) {
            if (newlyAllottedStudentsList.length >= remainingBedsInHostel) {
                console.log("Reached remainingBedsInHostel limit during otherStudents (triple) allotment.");
                break;
            }
            if (newlyAllottedStudentsList.some(as => as.studentProfileId.toString() === student._id.toString())) {
                console.log(`Student ${student.userId.name} (Roll: ${student.rollNumber}) already processed (likely got single). Skipping for triple.`);
                continue;
            }

            const roomResult = findAndOccupyBed('triple', student, currentHostelRoomsState);
            if (roomResult) {
                const { room, bed } = roomResult;
                console.log(`Allotting TRIPLE room ${room.roomNumber}-${bed.bedId} to ${student.userId.name}`);
                newlyAllottedStudentsList.push(createAllotmentEntry(student, room, bed, 'triple', dbUpdatePromises));
            } else {
                console.log(`Could not allot TRIPLE room for student ${student.userId.name} (Roll: ${student.rollNumber}) due to unavailability. All triple beds might be full.`);
            }
        }

        await Promise.all(dbUpdatePromises);
        console.log("Database updates for new allotments completed.");
        const finalAvailability = getRoomAvailabilityFromStaticData(currentHostelRoomsState);
        console.log("Final availability calculated.");
        console.log("--- Ending Allotment Process ---");

        res.status(200).json({
            success: true,
            message: `Room allotment process completed. ${newlyAllottedStudentsList.length} new students allotted.`,
            allottedCount: newlyAllottedStudentsList.length,
            allottedStudents: newlyAllottedStudentsList,
            availability: finalAvailability,
        });

    } catch (error) {
        console.error('Error during room allotment:', error);
        console.log("--- Ending Allotment Process With Error ---");
        res.status(500).json({
            success: false,
            message: 'Internal server error during allotment.',
            error: error.message
        });
    }
};

// Helper to find an available bed in a specific room type and mark it occupied
function findAndOccupyBed(roomType, student, currentRoomsData) {
    for (const room of currentRoomsData) {
        if (room.hostelType === 'boys' && room.type === roomType && room.currentOccupancy < room.capacity) {
            for (const bed of room.beds) {
                if (!bed.studentId) {
                    bed.studentId = student.userId._id.toString();
                    bed.rollNumber = student.rollNumber;
                    bed.sgpa = student.averageSgpa;
                    // bed.studentName = student.userId.name; // Optional for debugging state
                    room.currentOccupancy++;
                    return { room, bed };
                }
            }
        }
    }
    return null;
}

// Helper to create allotment DB entry and update student profile
function createAllotmentEntry(student, room, bed, allottedRoomType, dbUpdatePromises) {
    const allotmentData = {
        studentProfileId: student._id,
        userId: student.userId._id,
        name: student.userId.name, // Name from populated User model
        rollNumber: student.rollNumber,
        courseName: student.courseName,
        semester: student.semester,
        sgpaOdd: student.sgpaOdd,
        sgpaEven: student.sgpaEven,
        averageSgpa: student.averageSgpa,
        roomPreference: student.roomPreference,
        allottedRoomType: allottedRoomType,
        allottedRoomNumber: room.roomNumber,
        allottedBedId: bed.bedId,
        allottedHostelType: 'boys', // Kautilya Hall specific
        hostelName: room.hostelName || "Kautilya Hall", // Add hostel name
        floor: room.floor,
        allotmentDate: new Date(),
    };

    const newAllotment = new AllottedStudent(allotmentData);
    dbUpdatePromises.push(newAllotment.save());
    dbUpdatePromises.push(
        RegisteredStudentProfile.findByIdAndUpdate(student._id, {
            roomNumber: room.roomNumber,
            bedId: bed.bedId,
            allottedHostelName: room.hostelName || "Kautilya Hall",
            isAllotted: true // Mark student as allotted in their profile
        })
    );
    return newAllotment.toObject();
}

// Helper function to get room availability counts from the static hostelRoomsData (or its current state copy)
const getRoomAvailabilityFromStaticData = (roomsData) => {
    let availability = {
        boys: {
            singleTotalBeds: 0,
            singleOccupiedBeds: 0,
            singleAvailableBeds: 0,
            tripleTotalBeds: 0,
            tripleOccupiedBeds: 0,
            tripleAvailableBeds: 0
        }
    };

    roomsData.forEach(room => {
        if (room.hostelType === 'boys') {
            if (room.type === 'single') {
                availability.boys.singleTotalBeds += room.capacity;
                availability.boys.singleOccupiedBeds += room.currentOccupancy; // This is now correctly updated
            } else if (room.type === 'triple') {
                availability.boys.tripleTotalBeds += room.capacity;
                availability.boys.tripleOccupiedBeds += room.currentOccupancy; // This is now correctly updated
            }
        }
    });

    availability.boys.singleAvailableBeds = availability.boys.singleTotalBeds - availability.boys.singleOccupiedBeds;
    availability.boys.tripleAvailableBeds = availability.boys.tripleTotalBeds - availability.boys.tripleOccupiedBeds;

    return availability;
};

// Endpoint to get current room availability (reflects the initial state of hostelRoomData.js)
// This helper should reflect the current state of roomsData passed to it.
exports.getRoomAvailability = async (req, res) => {
    try {
        // To show real-time availability, we need to simulate an allotment dry run or query DB
        // For now, this reflects the base static data's capacity, not live DB occupancy.
        // To get live availability, this function would need to:
        // 1. Load baseHostelRoomsData
        // 2. Query AllottedStudent collection
        // 3. Mark occupied beds in a copy of baseHostelRoomsData
        // 4. Then calculate availability using the modified copy.
        // The `allotRooms` function now does this internally before allotment.
        // This endpoint can be enhanced to do the same for just viewing.

        // Simplified: For now, let's make it reflect the base capacity.
        // Or, for a more accurate view, it should do what allotRooms does at the beginning:
        let currentHostelRoomsState = JSON.parse(JSON.stringify(baseHostelRoomsData));
        currentHostelRoomsState.forEach(room => {
            room.currentOccupancy = 0; // Reset
            room.beds.forEach(bed => { delete bed.studentId; delete bed.rollNumber; delete bed.sgpa; });
        });
        const allPreviouslyAllottedStudents = await AllottedStudent.find({});
        allPreviouslyAllottedStudents.forEach(allottedStudent => {
            const roomInState = currentHostelRoomsState.find(r => r.roomNumber === allottedStudent.allottedRoomNumber && r.hostelType === allottedStudent.allottedHostelType);
            if (roomInState) {
                const bedInState = roomInState.beds.find(b => b.bedId === allottedStudent.allottedBedId);
                if (bedInState && !bedInState.studentId) {
                    bedInState.studentId = allottedStudent.userId.toString();
                    roomInState.currentOccupancy++;
                }
            }
        });
        const availability = getRoomAvailabilityFromStaticData(currentHostelRoomsState);

        res.status(200).json({ success: true, availability });
    } catch (error) {
        console.error('Error in getRoomAvailability endpoint:', error);
        res.status(500).json({ success: false, message: 'Server error fetching availability.' });
    }
};

// New controller function to get all allotted students
exports.getAllAllottedStudents = async (req, res) => {
    try {
        const allottedStudents = await AllottedStudent.find({})
            .populate({
                path: 'studentProfileId',
                select: 'name rollNumber courseName semester sgpaOdd sgpaEven roomPreference gender department contactNumber fatherName motherName',
                populate: {
                    path: 'userId',
                    select: 'name email gender'
                }
            })
            .populate('userId', 'name email gender'); // Also populate user details directly

        if (!allottedStudents || allottedStudents.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No students have been allotted rooms yet.",
                data: [],
                count: 0
            });
        }        // Enhance the data to ensure all necessary fields are available
        const enhancedData = allottedStudents.map(student => {
            const studentObj = student.toObject();

            // If studentProfileId data is missing, use data from the AllottedStudent record itself
            if (studentObj.studentProfileId) {
                // Use the name from the nested User model if available, otherwise from the profile or AllottedStudent
                studentObj.studentProfileId.name = studentObj.studentProfileId.name ||
                    studentObj.studentProfileId.userId?.name ||
                    studentObj.name;

                // Ensure other fields are populated from the AllottedStudent record if missing
                studentObj.studentProfileId.rollNumber = studentObj.studentProfileId.rollNumber || studentObj.rollNumber;
                studentObj.studentProfileId.courseName = studentObj.studentProfileId.courseName || studentObj.courseName;
                studentObj.studentProfileId.email = studentObj.studentProfileId.userId?.email || studentObj.userId?.email;
                studentObj.studentProfileId.gender = studentObj.studentProfileId.gender || studentObj.studentProfileId.userId?.gender;
            }

            // Ensure hostelName is populated - if missing, set default based on hostel type
            if (!studentObj.hostelName) {
                studentObj.hostelName = studentObj.allottedHostelType === 'boys' ? 'Kautilya Hall' : 'Other Hostel';
            }

            return studentObj;
        });

        res.status(200).json({
            success: true,
            message: "Successfully retrieved allotted students.",
            data: enhancedData,
            count: enhancedData.length
        });

    } catch (error) {
        console.error('Error fetching allotted students:', error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve allotted students.",
            error: error.message
        });
    }
};

