const RegisteredStudentProfile = require('../models/RegisteredStudentProfile');
const AllottedStudent = require('../models/AllottedStudent');
const baseHostelRoomsData = require('../data/kautilyaHallData.js');

const HOSTEL_KEY = 'boys';

const calculateAverageSgpa = (sgpaOdd, sgpaEven) => {
    const odd = (typeof sgpaOdd === 'number' && sgpaOdd >= 0) ? sgpaOdd : 0;
    const even = (typeof sgpaEven === 'number' && sgpaEven >= 0) ? sgpaEven : 0;
    if (!odd && !even) return 0;
    if (odd && !even) return odd;
    if (even && !odd) return even;
    return (odd + even) / 2;
};

const cloneHostelLayout = () => {
    const rooms = baseHostelRoomsData.map((room) => ({
        ...room,
        hostelName: room.hostelName || 'Kautilya Hall',
        currentOccupancy: 0,
        beds: room.beds.map((bed) => ({
            ...bed,
            studentId: null,
            rollNumber: null,
            sgpa: null,
        })),
    }));

    const roomKeyMap = new Map();
    const buckets = {};

    rooms.forEach((room) => {
        const key = `${room.hostelType}:${room.roomNumber}`;
        roomKeyMap.set(key, room);

        if (!buckets[room.hostelType]) {
            buckets[room.hostelType] = { single: [], triple: [] };
        }
        if (!buckets[room.hostelType][room.type]) {
            buckets[room.hostelType][room.type] = [];
        }
        buckets[room.hostelType][room.type].push(room);
    });

    return { rooms, roomKeyMap, buckets };
};

const markExistingAllotments = (roomKeyMap, allotments) => {
    allotments.forEach((allotment) => {
        const key = `${allotment.allottedHostelType}:${allotment.allottedRoomNumber}`;
        const room = roomKeyMap.get(key);
        if (!room) {
            return;
        }

        const bed = room.beds.find((b) => b.bedId === allotment.allottedBedId);
        if (!bed || bed.studentId) {
            return;
        }

        bed.studentId = allotment.userId?.toString?.() || allotment.userId;
        bed.rollNumber = allotment.rollNumber || null;
        bed.sgpa = typeof allotment.averageSgpa === 'number' ? allotment.averageSgpa : null;
        room.currentOccupancy = Math.min(room.capacity, (room.currentOccupancy || 0) + 1);
    });
};

const calculateAvailability = (rooms) => {
    const availability = {};

    rooms.forEach((room) => {
        if (!availability[room.hostelType]) {
            availability[room.hostelType] = {
                singleTotalBeds: 0,
                singleOccupiedBeds: 0,
                singleAvailableBeds: 0,
                tripleTotalBeds: 0,
                tripleOccupiedBeds: 0,
                tripleAvailableBeds: 0,
            };
        }

        const stats = availability[room.hostelType];
        if (room.type === 'single') {
            stats.singleTotalBeds += room.capacity;
            stats.singleOccupiedBeds += room.currentOccupancy;
        } else if (room.type === 'triple') {
            stats.tripleTotalBeds += room.capacity;
            stats.tripleOccupiedBeds += room.currentOccupancy;
        }
    });

    Object.values(availability).forEach((stats) => {
        stats.singleAvailableBeds = stats.singleTotalBeds - stats.singleOccupiedBeds;
        stats.tripleAvailableBeds = stats.tripleTotalBeds - stats.tripleOccupiedBeds;
    });

    return availability;
};

const getRemainingBeds = (buckets, hostelType) => {
    const hostelBuckets = buckets[hostelType] || {};
    return Object.values(hostelBuckets).reduce((total, rooms = []) => (
        total + rooms.reduce((sum, room) => sum + (room.capacity - room.currentOccupancy), 0)
    ), 0);
};

const findAndOccupyBed = (rooms = [], student) => {
    for (const room of rooms) {
        if (room.currentOccupancy >= room.capacity) continue;
        for (const bed of room.beds) {
            if (bed.studentId) continue;
            bed.studentId = student.userId._id.toString();
            bed.rollNumber = student.rollNumber;
            bed.sgpa = student.averageSgpa;
            room.currentOccupancy += 1;
            return { room, bed };
        }
    }
    return null;
};

const buildAllotmentDocument = (student, room, bed, allottedRoomType) => ({
    studentProfileId: student._id,
    userId: student.userId._id,
    name: student.userId.name,
    rollNumber: student.rollNumber,
    courseName: student.courseName,
    semester: student.semester,
    sgpaOdd: student.sgpaOdd,
    sgpaEven: student.sgpaEven,
    averageSgpa: student.averageSgpa,
    roomPreference: student.roomPreference,
    allottedRoomType,
    allottedRoomNumber: room.roomNumber,
    allottedBedId: bed.bedId,
    allottedHostelType: room.hostelType,
    hostelName: room.hostelName,
    floor: room.floor,
    allotmentDate: new Date(),
});

const buildProfileUpdateOperation = (studentId, room, bed) => ({
    updateOne: {
        filter: { _id: studentId },
        update: {
            roomNumber: room.roomNumber,
            bedId: bed.bedId,
            allottedHostelName: room.hostelName,
            isAllotted: true,
        },
    },
});

exports.allotRooms = async (req, res) => {
    try {
        const { rooms, roomKeyMap, buckets } = cloneHostelLayout();

        const existingAllotments = await AllottedStudent.find({}, 'studentProfileId userId allottedRoomNumber allottedHostelType allottedBedId rollNumber averageSgpa')
            .lean();

        markExistingAllotments(roomKeyMap, existingAllotments);

        const alreadyAllottedProfileIds = Array.from(new Set(
            existingAllotments
                .map((entry) => entry.studentProfileId)
                .filter((id) => !!id)
                .map((id) => id.toString())
        ));

        const eligibleStudents = await RegisteredStudentProfile.find({
            isEligible: true,
            _id: { $nin: alreadyAllottedProfileIds },
        })
            .populate('userId', 'gender name')
            .lean();

        const maleStudents = eligibleStudents
            .filter((student) => student.userId?.gender?.toLowerCase() === 'male' && student.userId?._id)
            .map((student) => ({
                ...student,
                userId: {
                    _id: student.userId._id,
                    name: student.userId.name,
                    gender: student.userId.gender,
                },
                averageSgpa: calculateAverageSgpa(student.sgpaOdd, student.sgpaEven),
            }));

        if (!maleStudents.length) {
            return res.status(200).json({
                success: true,
                message: 'No new eligible students found for allotment at this time.',
                allottedCount: 0,
                allottedStudents: [],
                availability: calculateAvailability(rooms),
            });
        }

        maleStudents.sort((a, b) => b.averageSgpa - a.averageSgpa);

        const remainingBeds = getRemainingBeds(buckets, HOSTEL_KEY);
        if (!remainingBeds) {
            return res.status(200).json({
                success: true,
                message: 'No beds available for allotment.',
                allottedCount: 0,
                allottedStudents: [],
                availability: calculateAvailability(rooms),
            });
        }

        const studentsToProcess = maleStudents.slice(0, remainingBeds);

        const singlePreference = studentsToProcess.filter((student) => student.roomPreference === 'single');
        const flexibleStudents = studentsToProcess.filter((student) => student.roomPreference !== 'single');

        const allotmentDocs = [];
        const profileUpdates = [];

        const singleRooms = buckets[HOSTEL_KEY]?.single || [];
        const tripleRooms = buckets[HOSTEL_KEY]?.triple || [];

        const fallbackPool = [];
        for (const student of singlePreference) {
            const result = findAndOccupyBed(singleRooms, student);
            if (!result) {
                fallbackPool.push(student);
                continue;
            }
            const allotmentDoc = buildAllotmentDocument(student, result.room, result.bed, 'single');
            allotmentDocs.push(allotmentDoc);
            profileUpdates.push(buildProfileUpdateOperation(student._id, result.room, result.bed));
        }

        const combinedFlexPool = [...flexibleStudents, ...fallbackPool];
        combinedFlexPool.sort((a, b) => b.averageSgpa - a.averageSgpa);

        const alreadyAllottedProfiles = new Set(allotmentDocs.map((doc) => doc.studentProfileId.toString()));

        for (const student of combinedFlexPool) {
            if (alreadyAllottedProfiles.has(student._id.toString())) {
                continue;
            }

            const result = findAndOccupyBed(tripleRooms, student);
            if (!result) {
                continue;
            }

            const allotmentDoc = buildAllotmentDocument(student, result.room, result.bed, 'triple');
            allotmentDocs.push(allotmentDoc);
            alreadyAllottedProfiles.add(student._id.toString());
            profileUpdates.push(buildProfileUpdateOperation(student._id, result.room, result.bed));

            if (allotmentDocs.length >= remainingBeds) {
                break;
            }
        }

        if (!allotmentDocs.length) {
            return res.status(200).json({
                success: true,
                message: 'No rooms available for the current batch of eligible students.',
                allottedCount: 0,
                allottedStudents: [],
                availability: calculateAvailability(rooms),
            });
        }

        const insertedAllotments = await AllottedStudent.insertMany(allotmentDocs, { ordered: false });
        if (profileUpdates.length) {
            await RegisteredStudentProfile.bulkWrite(profileUpdates, { ordered: false });
        }

        const responseAllotments = insertedAllotments.map((doc) => doc.toObject());

        res.status(200).json({
            success: true,
            message: `Room allotment process completed. ${responseAllotments.length} new students allotted.`,
            allottedCount: responseAllotments.length,
            allottedStudents: responseAllotments,
            availability: calculateAvailability(rooms),
        });

    } catch (error) {
        console.error('Error during room allotment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during allotment.',
            error: error.message,
        });
    }
};

exports.getRoomAvailability = async (req, res) => {
    try {
        const { rooms, roomKeyMap } = cloneHostelLayout();
        const existingAllotments = await AllottedStudent.find({}, 'allottedRoomNumber allottedHostelType allottedBedId userId rollNumber averageSgpa')
            .lean();
        markExistingAllotments(roomKeyMap, existingAllotments);
        const availability = calculateAvailability(rooms);
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
            .populate('userId', 'name email gender')
            .lean();

        if (!allottedStudents || allottedStudents.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No students have been allotted rooms yet.",
                data: [],
                count: 0
            });
        }

        const enhancedData = allottedStudents.map((student) => {
            const record = { ...student };

            if (record.studentProfileId) {
                record.studentProfileId = { ...record.studentProfileId };
                const profile = record.studentProfileId;
                const nestedUser = profile.userId;

                profile.name = profile.name || nestedUser?.name || record.name;
                profile.rollNumber = profile.rollNumber || record.rollNumber;
                profile.courseName = profile.courseName || record.courseName;
                profile.email = nestedUser?.email || record.userId?.email;
                profile.gender = profile.gender || nestedUser?.gender;
            }

            if (!record.hostelName) {
                record.hostelName = record.allottedHostelType === 'boys' ? 'Kautilya Hall' : 'Other Hostel';
            }

            return record;
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

