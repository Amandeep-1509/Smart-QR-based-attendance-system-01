package com.college.smartattendance.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Model class representing an Email Notification log entry.
 * Maps to the 'notifications' table in MySQL.
 * Stores email dispatch history for both absent students and their parents.
 */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Student associated with this absence notification
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id_fk", nullable = false)
    private Student student;

    // Recipient email address (either student email or parent email)
    @Column(name = "recipient_email", nullable = false, length = 100)
    private String recipientEmail;

    // Type of recipient: "STUDENT" or "PARENT"
    @Column(name = "recipient_type", nullable = false, length = 20)
    private String recipientType;

    // Subject line of the email
    @Column(nullable = false, length = 200)
    private String subject;

    // Full email body content
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // Date when notification was generated
    @Column(nullable = false)
    private LocalDate date;

    // Time when notification was generated
    @Column(nullable = false)
    private LocalTime time;

    // Delivery status: "SENT", "FAILED", or "DEMO MODE"
    @Column(nullable = false, length = 30)
    private String status;

    // Class session identifier
    @Column(name = "class_session", length = 50)
    private String classSession;

    // Default constructor for JPA
    public Notification() {
    }

    // Parameterized constructor
    public Notification(Student student, String recipientEmail, String recipientType,
                        String subject, String message, LocalDate date,
                        LocalTime time, String status, String classSession) {
        this.student = student;
        this.recipientEmail = recipientEmail;
        this.recipientType = recipientType;
        this.subject = subject;
        this.message = message;
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

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getRecipientType() {
        return recipientType;
    }

    public void setRecipientType(String recipientType) {
        this.recipientType = recipientType;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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
