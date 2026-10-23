package com.college.smartattendance.controller;

import com.college.smartattendance.model.Attendance;
import com.college.smartattendance.model.EmailSetting;
import com.college.smartattendance.model.Notification;
import com.college.smartattendance.service.AttendanceService;
import com.college.smartattendance.service.EmailService;
import com.college.smartattendance.service.ReportService;
import com.college.smartattendance.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Controller for the Main Dashboard.
 * Displays statistics cards, quick action buttons, recent attendance, and email logs.
 */
@Controller
public class DashboardController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ReportService reportService;

    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy");

    @GetMapping({"/", "/dashboard"})
    public String showDashboard(@RequestParam(value = "session", defaultValue = "Regular") String classSession,
                                Model model) {
        long totalStudents = studentService.getTotalStudentsCount();
        long presentToday = attendanceService.getPresentTodayCount(classSession);
        long absentToday = Math.max(0, totalStudents - presentToday);

        double percentage = (totalStudents > 0) ? ((double) presentToday / totalStudents) * 100.0 : 0.0;
        percentage = Math.round(percentage * 10.0) / 10.0;

        List<Attendance> recentAttendance = attendanceService.getRecentAttendanceLogs();
        List<Notification> recentNotifications = emailService.getRecentNotifications();
        EmailSetting emailSetting = emailService.getEmailSetting();

        model.addAttribute("totalStudents", totalStudents);
        model.addAttribute("presentToday", presentToday);
        model.addAttribute("absentToday", absentToday);
        model.addAttribute("attendancePercentage", percentage);
        model.addAttribute("currentDate", LocalDate.now().format(DISPLAY_DATE));
        model.addAttribute("currentSession", classSession);
        model.addAttribute("recentAttendance", recentAttendance);
        model.addAttribute("recentNotifications", recentNotifications);
        model.addAttribute("isEmailDemoMode", emailService.isDemoMode());
        model.addAttribute("emailSetting", emailSetting);
        model.addAttribute("senderEmail", emailService.getActiveSenderEmail());
        model.addAttribute("emailStatus", emailSetting.getConnectionStatus());

        return "dashboard";
    }
}
