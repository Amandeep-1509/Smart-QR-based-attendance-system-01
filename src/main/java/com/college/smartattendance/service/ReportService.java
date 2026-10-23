package com.college.smartattendance.service;

import com.college.smartattendance.model.Attendance;
import com.college.smartattendance.model.Student;
import com.college.smartattendance.repository.AttendanceRepository;
import com.college.smartattendance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

/**
 * Service providing statistical reports and analytics for attendance.
 * Generates Daily Reports, Individual Student Reports, and Date-wise Summaries.
 */
@Service
public class ReportService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentRepository studentRepository;

    /**
     * DTO containing summary numbers for a daily attendance report.
     */
    public static class DailyReportSummary {
        private LocalDate date;
        private long totalStudents;
        private long presentCount;
        private long absentCount;
        private double attendancePercentage;
        private List<Attendance> attendanceRecords;

        public DailyReportSummary(LocalDate date, long totalStudents, long presentCount,
                                  long absentCount, double attendancePercentage,
                                  List<Attendance> attendanceRecords) {
            this.date = date;
            this.totalStudents = totalStudents;
            this.presentCount = presentCount;
            this.absentCount = absentCount;
            this.attendancePercentage = attendancePercentage;
            this.attendanceRecords = attendanceRecords;
        }

        public LocalDate getDate() { return date; }
        public long getTotalStudents() { return totalStudents; }
        public long getPresentCount() { return presentCount; }
        public long getAbsentCount() { return absentCount; }
        public double getAttendancePercentage() { return attendancePercentage; }
        public List<Attendance> getAttendanceRecords() { return attendanceRecords; }
    }

    /**
     * DTO containing attendance analytics for an individual student.
     */
    public static class StudentReportSummary {
        private Student student;
        private long totalClasses;
        private long presentClasses;
        private long absentClasses;
        private double attendancePercentage;
        private List<Attendance> history;

        public StudentReportSummary(Student student, long totalClasses, long presentClasses,
                                    long absentClasses, double attendancePercentage,
                                    List<Attendance> history) {
            this.student = student;
            this.totalClasses = totalClasses;
            this.presentClasses = presentClasses;
            this.absentClasses = absentClasses;
            this.attendancePercentage = attendancePercentage;
            this.history = history;
        }

        public Student getStudent() { return student; }
        public long getTotalClasses() { return totalClasses; }
        public long getPresentClasses() { return presentClasses; }
        public long getAbsentClasses() { return absentClasses; }
        public double getAttendancePercentage() { return attendancePercentage; }
        public List<Attendance> getHistory() { return history; }
    }

    /**
     * Generates a daily attendance report for the specified date.
     */
    public DailyReportSummary generateDailyReport(LocalDate date) {
        long totalStudents = studentRepository.count();
        List<Attendance> records = attendanceRepository.findByDate(date);

        long presentCount = records.stream()
                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                .count();

        long absentCount = Math.max(0, totalStudents - presentCount);
        double percentage = (totalStudents > 0) ? ((double) presentCount / totalStudents) * 100.0 : 0.0;
        // Round to 1 decimal place
        percentage = Math.round(percentage * 10.0) / 10.0;

        return new DailyReportSummary(date, totalStudents, presentCount, absentCount, percentage, records);
    }

    /**
     * Generates an attendance report for an individual student.
     */
    public Optional<StudentReportSummary> generateStudentReport(Long studentId) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return Optional.empty();
        }

        Student student = studentOpt.get();
        List<Attendance> history = attendanceRepository.findByStudentOrderByDateDescTimeDesc(student);

        long presentCount = history.stream()
                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                .count();

        long totalClasses = history.size();
        long absentCount = totalClasses - presentCount;
        double percentage = (totalClasses > 0) ? ((double) presentCount / totalClasses) * 100.0 : 0.0;
        percentage = Math.round(percentage * 10.0) / 10.0;

        return Optional.of(new StudentReportSummary(student, totalClasses, presentCount, absentCount, percentage, history));
    }

    /**
     * Generates weekly trend data (past 7 days) for dashboard charting.
     */
    public Map<String, Object> getWeeklyAttendanceChartData() {
        List<String> labels = new ArrayList<>();
        List<Long> presentData = new ArrayList<>();
        List<Long> absentData = new ArrayList<>();
        long totalStudents = studentRepository.count();

        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            labels.add(day.getDayOfWeek().name().substring(0, 3) + " " + day.getDayOfMonth());

            long present = attendanceRepository.countByDateAndStatus(day, "PRESENT");
            long absent = Math.max(0, totalStudents - present);

            presentData.add(present);
            absentData.add(absent);
        }

        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", labels);
        chartData.put("present", presentData);
        chartData.put("absent", absentData);
        return chartData;
    }
}
