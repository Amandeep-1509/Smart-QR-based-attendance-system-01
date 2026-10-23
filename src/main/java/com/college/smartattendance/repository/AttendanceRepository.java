package com.college.smartattendance.repository;

import com.college.smartattendance.model.Attendance;
import com.college.smartattendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for the Attendance entity.
 * Handles duplicate checks, daily logs, student attendance histories, and statistical counts.
 */
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // Find attendance of a specific student on a given date and class session
    Optional<Attendance> findByStudentAndDateAndClassSession(Student student, LocalDate date, String classSession);

    // Quick duplicate check: returns true if student already has attendance on that date and session
    boolean existsByStudentAndDateAndClassSession(Student student, LocalDate date, String classSession);

    // Retrieve all attendance records for a specific date
    List<Attendance> findByDate(LocalDate date);

    // Retrieve attendance records for a specific date and class session
    List<Attendance> findByDateAndClassSession(LocalDate date, String classSession);

    // Retrieve complete attendance history for a single student
    List<Attendance> findByStudentOrderByDateDescTimeDesc(Student student);

    // Count present or absent students for a specific date
    long countByDateAndStatus(LocalDate date, String status);

    // Count present or absent students for a specific date and session
    long countByDateAndClassSessionAndStatus(LocalDate date, String classSession, String status);

    // Fetch the 10 most recent attendance records for the dashboard
    List<Attendance> findTop10ByOrderByDateDescTimeDesc();

    // Count total classes attended as PRESENT for an individual student
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student = :student AND a.status = 'PRESENT'")
    long countPresentByStudent(@Param("student") Student student);

    // Count total attendance records for an individual student
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student = :student")
    long countTotalByStudent(@Param("student") Student student);

    // Find distinct dates where attendance was recorded
    @Query("SELECT DISTINCT a.date FROM Attendance a ORDER BY a.date DESC")
    List<LocalDate> findDistinctAttendanceDates();
}
