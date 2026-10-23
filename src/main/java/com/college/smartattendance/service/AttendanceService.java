package com.college.smartattendance.service;

import com.college.smartattendance.model.Attendance;
import com.college.smartattendance.model.Student;
import com.college.smartattendance.repository.AttendanceRepository;
import com.college.smartattendance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service class managing QR-based and manual attendance operations.
 * Enforces duplicate attendance protection and absent student identification.
 */
@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentRepository studentRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm:ss a");

    /**
     * DTO class to convey the result of a QR scan back to the frontend AJAX caller.
     */
    public static class ScanResult {
        private boolean success;
        private boolean alreadyMarked;
        private String message;
        private String studentId;
        private String studentName;
        private String rollNo;
        private String className;
        private String time;
        private String status;

        public ScanResult(boolean success, boolean alreadyMarked, String message,
                          String studentId, String studentName, String rollNo,
                          String className, String time, String status) {
            this.success = success;
            this.alreadyMarked = alreadyMarked;
            this.message = message;
            this.studentId = studentId;
            this.studentName = studentName;
            this.rollNo = rollNo;
            this.className = className;
            this.time = time;
            this.status = status;
        }

        public static ScanResult error(String message) {
            return new ScanResult(false, false, message, "", "", "", "", "", "ERROR");
        }

        // Getters
        public boolean isSuccess() { return success; }
        public boolean isAlreadyMarked() { return alreadyMarked; }
        public String getMessage() { return message; }
        public String getStudentId() { return studentId; }
        public String getStudentName() { return studentName; }
        public String getRollNo() { return rollNo; }
        public String getClassName() { return className; }
        public String getTime() { return time; }
        public String getStatus() { return status; }
    }

    /**
     * Core QR Attendance Scan method.
     * This handles the "SCAN AND PASS" system:
     * 1. Finds student by Student ID.
     * 2. Checks duplicate attendance for today and current session.
     * 3. If duplicate: alerts teacher that attendance is already marked.
     * 4. If new: automatically marks PRESENT with the current system date and time.
     *
     * @param studentId The unique Student ID scanned from the QR code
     * @param classSession Class session name (e.g. "Morning Session" or "Regular")
     * @return ScanResult with details for the UI popup
     */
    @Transactional
    public ScanResult markQRAttendance(String studentId, String classSession) {
        if (studentId == null || studentId.trim().isEmpty()) {
            return ScanResult.error("Invalid QR code: Student ID is empty.");
        }

        String trimmedStudentId = studentId.trim().toUpperCase();
        String session = (classSession == null || classSession.trim().isEmpty()) ? "Regular" : classSession.trim();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 1. Verify student exists in the database
        Optional<Student> studentOpt = studentRepository.findByStudentId(trimmedStudentId);
        if (studentOpt.isEmpty()) {
            return ScanResult.error("Student with ID '" + trimmedStudentId + "' not found in system.");
        }

        Student student = studentOpt.get();

        // 2. Duplicate Attendance Protection: Check if already marked today for this session
        Optional<Attendance> existingAttendance = attendanceRepository.findByStudentAndDateAndClassSession(student, today, session);
        if (existingAttendance.isPresent()) {
            Attendance existing = existingAttendance.get();
            String markedTime = existing.getTime().format(TIME_FORMATTER);
            return new ScanResult(
                    true,
                    true,
                    "Attendance Already Marked ✓",
                    student.getStudentId(),
                    student.getName(),
                    student.getRollNo(),
                    student.getClassName() + " - " + student.getDivision(),
                    markedTime,
                    existing.getStatus()
            );
        }

        // 3. Automatically record attendance as PRESENT
        Attendance newAttendance = new Attendance(
                student,
                today,
                now,
                "PRESENT",
                session
        );
        attendanceRepository.save(newAttendance);

        String formattedTime = now.format(TIME_FORMATTER);
        return new ScanResult(
                true,
                false,
                "Attendance Marked: PRESENT ✓",
                student.getStudentId(),
                student.getName(),
                student.getRollNo(),
                student.getClassName() + " - " + student.getDivision(),
                formattedTime,
                "PRESENT"
        );
    }

    /**
     * Manual Attendance Backup Method:
     * Saves attendance for multiple students manually submitted by the teacher.
     *
     * @param attendanceMap Map of Student ID -> Status ("PRESENT" or "ABSENT")
     * @param date Date of attendance
     * @param classSession Session identifier
     */
    @Transactional
    public void saveManualAttendance(Map<String, String> attendanceMap, LocalDate date, String classSession) {
        String session = (classSession == null || classSession.trim().isEmpty()) ? "Regular" : classSession.trim();
        LocalTime now = LocalTime.now();

        for (Map.Entry<String, String> entry : attendanceMap.entrySet()) {
            String studentId = entry.getKey();
            String status = entry.getValue();

            studentRepository.findByStudentId(studentId).ifPresent(student -> {
                Optional<Attendance> existing = attendanceRepository.findByStudentAndDateAndClassSession(student, date, session);
                if (existing.isPresent()) {
                    Attendance att = existing.get();
                    att.setStatus(status);
                    att.setTime(now);
                    attendanceRepository.save(att);
                } else {
                    Attendance att = new Attendance(student, date, now, status, session);
                    attendanceRepository.save(att);
                }
            });
        }
    }

    /**
     * Identifies all students who are ABSENT on a given date and class session.
     * A student is considered absent if:
     * 1. They have an attendance record explicitly marked "ABSENT", OR
     * 2. They have NO attendance record recorded on that date and session.
     *
     * @param date The date to inspect
     * @param classSession The session to inspect
     * @param className Optional class filter (e.g., "CSE")
     * @return List of absent students
     */
    public List<Student> identifyAbsentStudents(LocalDate date, String classSession, String className) {
        String session = (classSession == null || classSession.trim().isEmpty()) ? "Regular" : classSession.trim();

        // 1. Fetch eligible students
        List<Student> allStudents;
        if (className != null && !className.trim().isEmpty() && !className.equalsIgnoreCase("ALL")) {
            allStudents = studentRepository.findAll().stream()
                    .filter(s -> s.getClassName().equalsIgnoreCase(className.trim()))
                    .collect(Collectors.toList());
        } else {
            allStudents = studentRepository.findAll();
        }

        // 2. Fetch all present students on this date and session
        List<Attendance> attendances = attendanceRepository.findByDateAndClassSession(date, session);
        Set<String> presentStudentIds = attendances.stream()
                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                .map(a -> a.getStudent().getStudentId())
                .collect(Collectors.toSet());

        // 3. Any student not present is absent
        List<Student> absentStudents = new ArrayList<>();
        for (Student student : allStudents) {
            if (!presentStudentIds.contains(student.getStudentId())) {
                absentStudents.add(student);
            }
        }

        return absentStudents;
    }

    // Retrieve attendance records for today
    public List<Attendance> getTodayAttendance(String classSession) {
        String session = (classSession == null || classSession.trim().isEmpty()) ? "Regular" : classSession.trim();
        return attendanceRepository.findByDateAndClassSession(LocalDate.now(), session);
    }

    // Retrieve the 10 most recent attendance logs for the dashboard
    public List<Attendance> getRecentAttendanceLogs() {
        return attendanceRepository.findTop10ByOrderByDateDescTimeDesc();
    }

    // Count present students today
    public long getPresentTodayCount(String classSession) {
        String session = (classSession == null || classSession.trim().isEmpty()) ? "Regular" : classSession.trim();
        return attendanceRepository.countByDateAndClassSessionAndStatus(LocalDate.now(), session, "PRESENT");
    }

    // Count absent students today
    public long getAbsentTodayCount(String classSession) {
        long totalStudents = studentRepository.count();
        long presentCount = getPresentTodayCount(classSession);
        return Math.max(0, totalStudents - presentCount);
    }
}
