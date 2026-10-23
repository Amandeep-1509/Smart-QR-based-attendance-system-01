package com.college.smartattendance.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Model class for storing customizable Email Templates in the database.
 *
 * Each template type has:
 * - A subject line (supports dynamic placeholders like {student_name})
 * - A message body (supports rich HTML and plain-text placeholders)
 * - A flag to indicate whether it's been customized or is still default
 *
 * Template Types:
 * - STUDENT_ABSENCE    : Email sent to the absent student
 * - PARENT_ABSENCE     : Email sent to the parent of the absent student
 * - TEACHER_ABSENCE    : Summary email sent to a teacher about absent students
 * - TEACHER_ATTENDANCE : Full attendance summary email sent to a teacher
 */
@Entity
@Table(name = "email_templates")
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Template type (e.g. STUDENT_ABSENCE, PARENT_ABSENCE, etc.)
    @Column(name = "template_type", nullable = false, length = 50, unique = true)
    private String templateType;

    // Display label for the Admin UI (e.g. "Student Absence Notification")
    @Column(name = "display_label", length = 100)
    private String displayLabel;

    // Email subject line – supports placeholders like {student_name}, {date}
    @Column(name = "subject", length = 300)
    private String subject;

    // Email message body – stored as text; can include HTML formatting
    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    // true = template has been customized by Admin; false = using default
    @Column(name = "is_customized")
    private boolean customized = false;

    // Timestamp of the last modification by Admin
    @Column(name = "last_modified")
    private LocalDateTime lastModified;

    // Default constructor required by JPA
    public EmailTemplate() {
    }

    // Constructor for creating a template with all fields
    public EmailTemplate(String templateType, String displayLabel, String subject, String bodyText) {
        this.templateType = templateType;
        this.displayLabel = displayLabel;
        this.subject = subject;
        this.bodyText = bodyText;
        this.customized = false;
        this.lastModified = LocalDateTime.now();
    }

    // --- Getters and Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTemplateType() { return templateType; }
    public void setTemplateType(String templateType) { this.templateType = templateType; }

    public String getDisplayLabel() { return displayLabel; }
    public void setDisplayLabel(String displayLabel) { this.displayLabel = displayLabel; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBodyText() { return bodyText; }
    public void setBodyText(String bodyText) { this.bodyText = bodyText; }

    public boolean isCustomized() { return customized; }
    public void setCustomized(boolean customized) { this.customized = customized; }

    public LocalDateTime getLastModified() { return lastModified; }
    public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }
}
