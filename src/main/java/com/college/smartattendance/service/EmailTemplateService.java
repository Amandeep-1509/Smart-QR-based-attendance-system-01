package com.college.smartattendance.service;

import com.college.smartattendance.model.EmailTemplate;
import com.college.smartattendance.model.Student;
import com.college.smartattendance.repository.EmailTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service managing Email Templates.
 *
 * Key Capabilities:
 * 1. Loads default templates for all four types if none exist in the database.
 * 2. Allows Admin to save customized subject and body for each template type.
 * 3. Provides reset-to-default functionality to restore original template text.
 * 4. Replaces dynamic placeholders like {student_name}, {date}, etc. with real values.
 * 5. Returns processed (ready-to-send) subject and body for EmailService to use.
 *
 * Supported Template Types:
 *   STUDENT_ABSENCE    – Email sent to the absent student
 *   PARENT_ABSENCE     – Email sent to the student's parent
 *   TEACHER_ABSENCE    – Summary email sent to teacher about absent students
 *   TEACHER_ATTENDANCE – Full attendance summary email sent to teacher
 */
@Service
public class EmailTemplateService {

    // Template type constants – used consistently across Service and Controller
    public static final String STUDENT_ABSENCE    = "STUDENT_ABSENCE";
    public static final String PARENT_ABSENCE     = "PARENT_ABSENCE";
    public static final String TEACHER_ABSENCE    = "TEACHER_ABSENCE";
    public static final String TEACHER_ATTENDANCE = "TEACHER_ATTENDANCE";

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    @Autowired
    private EmailTemplateRepository emailTemplateRepository;

    // -----------------------------------------------------------------------
    // DEFAULT TEMPLATE DEFINITIONS
    // -----------------------------------------------------------------------

    /**
     * Returns the default subject for each template type.
     * Called when resetting a template to its original text.
     */
    public static String getDefaultSubject(String type) {
        return switch (type) {
            case STUDENT_ABSENCE    -> "Attendance Notification – You Were Marked Absent Today";
            case PARENT_ABSENCE     -> "Your Ward's Attendance Notification – {student_name} Was Absent";
            case TEACHER_ABSENCE    -> "Attendance Summary – Absent Students List for {date}";
            case TEACHER_ATTENDANCE -> "Attendance Report – {class_name} on {date}";
            default -> "Smart Attendance Notification";
        };
    }

    /**
     * Returns the default message body for each template type.
     * Placeholders in {curly_braces} are replaced with real values before sending.
     */
    public static String getDefaultBody(String type) {
        return switch (type) {
            case STUDENT_ABSENCE -> """
Dear {student_name},

This is to inform you that you have been marked ABSENT for today's class.

Details:
  Date       : {date}
  Class      : {class_name} – {division}
  Roll No    : {roll_no}
  Status     : {attendance_status}

If you believe this is an error, please contact your class teacher immediately.

Regards,
{sender_name}
{college_name}
""";
            case PARENT_ABSENCE -> """
Dear {parent_name},

This is to inform you that your ward {student_name} (Roll No: {roll_no}) has been marked ABSENT for today's class.

Details:
  Date       : {date}
  Class      : {class_name} – {division}
  Status     : {attendance_status}

Please ensure your ward is attending classes regularly. Contact the class teacher for any queries.

Regards,
{sender_name}
{college_name}
""";
            case TEACHER_ABSENCE -> """
Dear {teacher_name},

The following students were marked ABSENT in today's session:

  Date       : {date}
  Class      : {class_name}
  Absent List: {absent_students_list}

Kindly review and take appropriate action.

Regards,
{sender_name}
{college_name}
""";
            case TEACHER_ATTENDANCE -> """
Dear {teacher_name},

Here is the attendance summary for today's class session:

  Date           : {date}
  Class          : {class_name}
  Total Students : {total_students}
  Present        : {present_count}
  Absent         : {absent_count}
  Attendance %   : {attendance_percentage}%

Regards,
{sender_name}
{college_name}
""";
            default -> "Smart Attendance Notification";
        };
    }

    /**
     * Returns the display-friendly label for each template type.
     */
    public static String getDisplayLabel(String type) {
        return switch (type) {
            case STUDENT_ABSENCE    -> "Student Absence Notification";
            case PARENT_ABSENCE     -> "Parent Absence Notification";
            case TEACHER_ABSENCE    -> "Teacher – Absent Students Summary";
            case TEACHER_ATTENDANCE -> "Teacher – Attendance Report Summary";
            default -> type;
        };
    }

    // -----------------------------------------------------------------------
    // CRUD OPERATIONS
    // -----------------------------------------------------------------------

    /**
     * Returns a template from the database.
     * If none exists yet, seeds the default and returns it.
     */
    public EmailTemplate getTemplate(String templateType) {
        return emailTemplateRepository.findByTemplateType(templateType)
                .orElseGet(() -> seedDefault(templateType));
    }

    /**
     * Returns all four templates (seeding missing ones automatically).
     */
    public List<EmailTemplate> getAllTemplates() {
        // Ensure all four types exist in the database
        for (String type : new String[]{STUDENT_ABSENCE, PARENT_ABSENCE, TEACHER_ABSENCE, TEACHER_ATTENDANCE}) {
            emailTemplateRepository.findByTemplateType(type).orElseGet(() -> seedDefault(type));
        }
        return emailTemplateRepository.findAll();
    }

    /**
     * Saves (creates or updates) an Admin-edited template to the database.
     */
    public EmailTemplate saveTemplate(String templateType, String subject, String bodyText) {
        EmailTemplate template = getTemplate(templateType);
        template.setSubject(subject != null ? subject.trim() : getDefaultSubject(templateType));
        template.setBodyText(bodyText != null ? bodyText : getDefaultBody(templateType));
        template.setCustomized(true);
        template.setLastModified(LocalDateTime.now());
        return emailTemplateRepository.save(template);
    }

    /**
     * Resets a template back to its original default subject and body.
     */
    public EmailTemplate resetToDefault(String templateType) {
        EmailTemplate template = getTemplate(templateType);
        template.setSubject(getDefaultSubject(templateType));
        template.setBodyText(getDefaultBody(templateType));
        template.setCustomized(false);
        template.setLastModified(LocalDateTime.now());
        return emailTemplateRepository.save(template);
    }

    // -----------------------------------------------------------------------
    // PLACEHOLDER SUBSTITUTION – Used by EmailService to build final emails
    // -----------------------------------------------------------------------

    /**
     * Builds the final email subject by replacing placeholders with real values.
     * @param templateType  Type of template (e.g., STUDENT_ABSENCE)
     * @param student       The student object (may be null for teacher templates)
     * @param date          The attendance date
     * @param extraValues   Map of additional values like teacher_name, class_name, etc.
     * @return Processed subject string with all placeholders filled in
     */
    public String buildSubject(String templateType, Student student, LocalDate date,
                               Map<String, String> extraValues) {
        String subject = getTemplate(templateType).getSubject();
        return replacePlaceholders(subject, student, date, extraValues);
    }

    /**
     * Builds the final email body by replacing placeholders with real values.
     * @param templateType  Type of template (e.g., PARENT_ABSENCE)
     * @param student       The student object (may be null for teacher templates)
     * @param date          The attendance date
     * @param extraValues   Map of additional values like teacher_name, absent_students_list, etc.
     * @return Processed body string with all placeholders filled in
     */
    public String buildBody(String templateType, Student student, LocalDate date,
                            Map<String, String> extraValues) {
        String body = getTemplate(templateType).getBodyText();
        return replacePlaceholders(body, student, date, extraValues);
    }

    /**
     * Core placeholder replacement logic.
     * Substitutes all {placeholder} tokens in a template string with real values.
     */
    private String replacePlaceholders(String text, Student student, LocalDate date,
                                       Map<String, String> extra) {
        if (text == null) return "";

        // Build substitution map
        Map<String, String> values = new HashMap<>();

        // Date placeholder
        if (date != null) {
            values.put("date", date.format(DATE_FMT));
        }

        // Student-related placeholders (only if student is provided)
        if (student != null) {
            values.put("student_name",    nvl(student.getName()));
            values.put("roll_no",         nvl(student.getRollNo()));
            values.put("class_name",      nvl(student.getClassName()));
            values.put("division",        nvl(student.getDivision()));
            values.put("parent_name",     nvl(student.getParentName()));
            values.put("student_email",   nvl(student.getStudentEmail()));
            values.put("parent_email",    nvl(student.getParentEmail()));
            values.put("attendance_status", "ABSENT");
        }

        // Merge extra values (teacher_name, absent_students_list, sender_name, etc.)
        if (extra != null) {
            values.putAll(extra);
        }

        // Replace each {key} with its value
        String result = text;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", entry.getValue());
        }

        return result;
    }

    /**
     * Helper to avoid null pointer exceptions when getting string values.
     */
    private String nvl(String value) {
        return value != null ? value : "";
    }

    // -----------------------------------------------------------------------
    // PRIVATE HELPERS
    // -----------------------------------------------------------------------

    /**
     * Creates and saves a default template record if none exists in the database.
     */
    private EmailTemplate seedDefault(String templateType) {
        EmailTemplate template = new EmailTemplate(
                templateType,
                getDisplayLabel(templateType),
                getDefaultSubject(templateType),
                getDefaultBody(templateType)
        );
        return emailTemplateRepository.save(template);
    }
}
