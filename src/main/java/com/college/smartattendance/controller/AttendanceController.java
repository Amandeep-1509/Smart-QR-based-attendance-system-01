package com.college.smartattendance.controller;

import com.college.smartattendance.model.Attendance;
import com.college.smartattendance.model.Notification;
import com.college.smartattendance.model.Student;
import com.college.smartattendance.service.AttendanceService;
import com.college.smartattendance.service.EmailService;
import com.college.smartattendance.service.StudentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.*;

/**
 * Controller handling both QR-Based "Scan & Pass" attendance and Manual Attendance backup.
 * Also handles attendance completion and automatic email dispatch to absent students & parents.
 */
@Controller
@RequestMapping("/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private StudentService studentService;

    @Autowired
    private EmailService emailService;

    // View QR Attendance Scanner page
    @GetMapping("/qr")
    public String showQRScannerPage(@RequestParam(value = "session", defaultValue = "Regular") String classSession,
                                    Model model) {
        List<Attendance> todayRecords = attendanceService.getTodayAttendance(classSession);
        model.addAttribute("classSession", classSession);
        model.addAttribute("todayRecords", todayRecords);
        model.addAttribute("totalScanned", todayRecords.size());
        model.addAttribute("availableClasses", studentService.getDistinctClasses());
        return "qr-scanner";
    }

    /**
     * REST API endpoint called automatically by JavaScript when the camera detects a QR code.
     * ZERO BUTTON CLICKS: Automatically records attendance and returns status to the scanner.
     */
    @PostMapping("/api/scan")
    @ResponseBody
    public ResponseEntity<AttendanceService.ScanResult> handleQRScan(
            @RequestParam("studentId") String studentId,
            @RequestParam(value = "classSession", defaultValue = "Regular") String classSession) {

        AttendanceService.ScanResult result = attendanceService.markQRAttendance(studentId, classSession);
        return ResponseEntity.ok(result);
    }

    // View Manual Attendance backup page
    @GetMapping("/manual")
    public String showManualAttendancePage(
            @RequestParam(value = "date", required = false) String dateStr,
            @RequestParam(value = "session", defaultValue = "Regular") String classSession,
            @RequestParam(value = "className", required = false) String className,
            Model model) {

        LocalDate date = (dateStr != null && !dateStr.isEmpty()) ? LocalDate.parse(dateStr) : LocalDate.now();

        List<Student> students = studentService.getAllStudents();
        if (className != null && !className.isEmpty() && !className.equalsIgnoreCase("ALL")) {
            students = students.stream().filter(s -> s.getClassName().equalsIgnoreCase(className)).toList();
        }

        // Fetch existing attendance records for pre-populating radio buttons
        List<Attendance> existing = attendanceService.getTodayAttendance(classSession);
        Map<String, String> statusMap = new HashMap<>();
        for (Attendance a : existing) {
            statusMap.put(a.getStudent().getStudentId(), a.getStatus());
        }

        model.addAttribute("students", students);
        model.addAttribute("statusMap", statusMap);
        model.addAttribute("selectedDate", date);
        model.addAttribute("classSession", classSession);
        model.addAttribute("selectedClass", className != null ? className : "ALL");
        model.addAttribute("availableClasses", studentService.getDistinctClasses());

        return "manual-attendance";
    }

    // Save Manual Attendance backup
    @PostMapping("/manual/save")
    public String saveManualAttendance(HttpServletRequest request,
                                       @RequestParam("date") String dateStr,
                                       @RequestParam(value = "session", defaultValue = "Regular") String classSession,
                                       RedirectAttributes redirectAttributes) {

        LocalDate date = LocalDate.parse(dateStr);
        List<Student> allStudents = studentService.getAllStudents();
        Map<String, String> attendanceMap = new HashMap<>();

        for (Student student : allStudents) {
            String statusParam = request.getParameter("status_" + student.getStudentId());
            if (statusParam != null) {
                attendanceMap.put(student.getStudentId(), statusParam);
            }
        }

        attendanceService.saveManualAttendance(attendanceMap, date, classSession);
        redirectAttributes.addFlashAttribute("successMessage",
                "Manual attendance successfully recorded for " + attendanceMap.size() + " students.");

        return "redirect:/attendance/manual?date=" + dateStr + "&session=" + classSession;
    }

    /**
     * Attendance Completed Action:
     * 1. Identifies absent students for the session.
     * 2. Automatically sends email notifications to BOTH absent students and their parents.
     * 3. Prevents duplicate emails if already notified today.
     * 4. Saves notification history in MySQL.
     */
    @PostMapping("/complete")
    public String completeAttendanceAndNotifyAbsentees(
            @RequestParam(value = "session", defaultValue = "Regular") String classSession,
            @RequestParam(value = "className", required = false) String className,
            RedirectAttributes redirectAttributes) {

        LocalDate today = LocalDate.now();

        // 1. Identify all students who are absent
        List<Student> absentStudents = attendanceService.identifyAbsentStudents(today, classSession, className);

        if (absentStudents.isEmpty()) {
            redirectAttributes.addFlashAttribute("infoMessage",
                    "All students are marked PRESENT! No absence notifications needed.");
            return "redirect:/dashboard";
        }

        // 2. Automatically dispatch emails to both students and parents
        List<Notification> createdNotifications = emailService.sendAbsenceNotifications(absentStudents, today, classSession);

        String modeText = emailService.isDemoMode() ? " (DEMO MODE: Simulated preview saved)" : " via SMTP";
        redirectAttributes.addFlashAttribute("successMessage",
                "Attendance Completed! Identified " + absentStudents.size() + " absent student(s). " +
                createdNotifications.size() + " notification email(s) recorded" + modeText + ".");

        return "redirect:/notifications";
    }
}
