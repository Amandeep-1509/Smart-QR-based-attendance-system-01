package com.college.smartattendance.controller;

import com.college.smartattendance.model.Student;
import com.college.smartattendance.service.ReportService;
import com.college.smartattendance.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller generating Attendance Reports:
 * 1. Daily Attendance Report (Present, Absent, Attendance Percentage).
 * 2. Individual Student Attendance Report with full historical records.
 * 3. Date-wise attendance query and printable attendance sheet.
 */
@Controller
@RequestMapping("/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private StudentService studentService;

    @GetMapping
    public String showReportsPage(
            @RequestParam(value = "date", required = false) String dateStr,
            @RequestParam(value = "studentId", required = false) Long studentId,
            Model model) {

        LocalDate date = (dateStr != null && !dateStr.isEmpty()) ? LocalDate.parse(dateStr) : LocalDate.now();
        List<Student> allStudents = studentService.getAllStudents();

        // 1. Daily Report Summary
        ReportService.DailyReportSummary dailySummary = reportService.generateDailyReport(date);

        // 2. Individual Student Report (if selected)
        ReportService.StudentReportSummary studentSummary = null;
        if (studentId != null) {
            Optional<ReportService.StudentReportSummary> summaryOpt = reportService.generateStudentReport(studentId);
            if (summaryOpt.isPresent()) {
                studentSummary = summaryOpt.get();
            }
        }

        model.addAttribute("dailySummary", dailySummary);
        model.addAttribute("selectedDate", date);
        model.addAttribute("allStudents", allStudents);
        model.addAttribute("selectedStudentId", studentId);
        model.addAttribute("studentSummary", studentSummary);

        return "reports";
    }

    // Printable daily attendance report (ready for browser Save as PDF / Print)
    @GetMapping("/print")
    public String printDailyReport(
            @RequestParam(value = "date", required = false) String dateStr,
            Model model) {
        LocalDate date = (dateStr != null && !dateStr.isEmpty()) ? LocalDate.parse(dateStr) : LocalDate.now();
        ReportService.DailyReportSummary dailySummary = reportService.generateDailyReport(date);

        model.addAttribute("dailySummary", dailySummary);
        model.addAttribute("selectedDate", date);
        return "report-print";
    }

    // Chart.js data API for weekly attendance visual graph
    @GetMapping("/api/chart-data")
    @ResponseBody
    public Map<String, Object> getChartData() {
        return reportService.getWeeklyAttendanceChartData();
    }
}
