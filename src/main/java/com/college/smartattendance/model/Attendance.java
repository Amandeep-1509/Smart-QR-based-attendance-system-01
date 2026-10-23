package com.college.smartattendance.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Model class representing an Attendance record.
 * Maps to the 'attendance' table in MySQL.
 * Contains a unique constraint on (student, date, classSession) to prevent duplicate attendance on the same day.
 */
@Entity
@Table(
    name = "attendance",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_student_date_session",
            columnNames = {"student_id_fk", "date", "class_session"}
        )
    }
)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many attendance records belong to one student
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id_fk", nullable = false)
    private Student student;

    // Date when attendance was recorded
    @Column(nullable = false)
    private LocalDate date;

    // Exact time when QR code was scanned or manual attendance was submitted
    @Column(nullable = false)
    private LocalTime time;

    // Status: "PRESENT" or "ABSENT"
    @Column(nullable = false, length = 15)
    private String status;

    // Class session identifier (e.g. "Regular", "Morning Session", "CSE-A")
    @Column(name = "class_session", nullable = false, length = 50)
    private String classSession;

    // Default constructor for JPA
    public Attendance() {
    }

    // Parameterized constructor
    public Attendance(Student student, LocalDate date, LocalTime time, String status, String classSession) {
        this.student = student;
        this.date = date;
        this.time = time;
        this.status = status;
        this.classSession = classSession;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getClassSession() {
        return classSession;
    }

    public void setClassSession(String classSession) {
        this.classSession = classSession;
    }
}
