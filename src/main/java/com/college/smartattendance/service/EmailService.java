package com.college.smartattendance.service;

import com.college.smartattendance.model.EmailSetting;
import com.college.smartattendance.model.Notification;
import com.college.smartattendance.model.Student;
import com.college.smartattendance.repository.EmailSettingRepository;
import com.college.smartattendance.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * Service managing email notifications and dynamic SMTP sender configuration.
 *
 * Key Capabilities:
 * 1. Dynamic Sender Settings: The admin can update the Gmail address and App Password
 *    directly through the Admin Panel; settings take effect immediately without server restarts.
 * 2. Live Connection Testing: Admin can send test emails to verify SMTP credentials.
 * 3. Secure Storage: The 16-character App Password is saved securely on the backend and never exposed.
 * 4. Dual Absence Dispatch: Sends notifications to both absent students and their parents.
 * 5. Template-Based Emails: Uses custom email templates edited by Admin; falls back to built-in defaults.
 * 6. Resilient Demo Mode: If settings are unconfigured or invalid, attendance marking continues
 *    smoothly and simulated email previews are stored in the database.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailSettingRepository emailSettingRepository;

    // EmailTemplateService is injected lazily to avoid circular dependency issues
    // since EmailTemplateService does NOT depend on EmailService
    @Autowired
    private EmailTemplateService emailTemplateService;

    // Optional fallback credentials from application.properties / environment variables
    @Value("${spring.mail.username:}")
    private String fallbackMailUsername;

    @Value("${spring.mail.password:}")
    private String fallbackMailPassword;

    /**
     * DTO to return connection test results.
     */
    public static class TestResult {
        private final boolean success;
        private final String message;

        public TestResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public static TestResult success(String message) {
            return new TestResult(true, message);
        }

        public static TestResult error(String message) {
            return new TestResult(false, message);
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    /**
     * Retrieves the current EmailSetting from the database.
     * If none exists, creates a default one (seeding from properties if present).
     */
    public EmailSetting getEmailSetting() {
        EmailSetting setting = emailSettingRepository.findFirstByOrderByIdAsc().orElseGet(EmailSetting::new);

        // Seed non-secret defaults from environment variables. The app password is deliberately
        // NOT copied into the database; it is read from MAIL_PASSWORD when SMTP is used.
        if ((setting.getSenderEmail() == null || setting.getSenderEmail().trim().isEmpty())
                && fallbackMailUsername != null && !fallbackMailUsername.trim().isEmpty()) {
            setting.setSenderEmail(fallbackMailUsername.trim());
        }
        if (setting.getSenderName() == null || setting.getSenderName().trim().isEmpty()) {
            setting.setSenderName("Smart QR Based Attendance System");
        }
        if (!isConfigured(setting)) {
            setting.setConnectionStatus("NOT_CONFIGURED");
        }
        return emailSettingRepository.save(setting);
    }

    /**
     * Updates and saves the dynamic Email Settings from the Admin Panel.
     * Preserves the existing password if the new password field was left blank.
     */
    public EmailSetting updateEmailSetting(String senderEmail, String senderName, String appPassword) {
        EmailSetting setting = getEmailSetting();

        if (senderEmail != null) {
            setting.setSenderEmail(senderEmail.trim());
        }

        if (senderName != null && !senderName.trim().isEmpty()) {
            setting.setSenderName(senderName.trim());
        }

        // Only update password if a new one is provided and not the masked placeholder
        if (appPassword != null && !appPassword.trim().isEmpty() && !appPassword.contains("••••")) {
            // Remove any spaces that users frequently copy-paste from Google App Passwords
            setting.setAppPassword(appPassword.replaceAll("\\s+", ""));
            setting.setConnectionStatus("NOT_CONFIGURED"); // Needs re-testing
        }

        return emailSettingRepository.save(setting);
    }

    /**
     * Tests the SMTP connection by sending a real verification email.
     */
    public TestResult testEmailConnection(String testRecipient) {
        EmailSetting setting = getEmailSetting();

        if (!isConfigured(setting)) {
            return TestResult.error("Sender Email and Google App Password must both be filled before testing.");
        }

        String recipient = (testRecipient != null && !testRecipient.trim().isEmpty()) 
                ? testRecipient.trim() 
                : setting.getSenderEmail();

        try {
            JavaMailSender dynamicSender = buildDynamicMailSender(setting);

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(setting.getSenderEmail());
            mail.setTo(recipient);
            mail.setSubject("Smart Attendance System - SMTP Test Email");
            mail.setText("Hello,\n\n" +
                    "This is a test email sent from the Smart QR Attendance Admin Panel.\n\n" +
                    "Your Gmail SMTP settings are configured correctly!\n" +
                    "Sender: " + setting.getSenderEmail() + "\n" +
                    "Timestamp: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm:ss a")) + "\n\n" +
                    "All absence notifications to students and parents will be sent from this email address.\n\n" +
                    "Regards,\n" +
                    setting.getSenderName());

            dynamicSender.send(mail);

            // Update status on success
            setting.setConnectionStatus("CONNECTED");
            setting.setLastTestedAt(LocalDateTime.now());
            setting.setLastErrorMessage(null);
            emailSettingRepository.save(setting);

            logger.info("SMTP Test Email successfully delivered to: {}", recipient);
            return TestResult.success("Test email sent successfully to " + recipient + "! Connection is ACTIVE and working.");

        } catch (Exception ex) {
            String errorMsg = ex.getMessage();
            if (errorMsg != null && errorMsg.contains("AuthenticationFailedException")) {
                errorMsg = "Authentication failed. Please verify your 16-character Google App Password (ensure 2-Step Verification is active).";
            } else if (errorMsg != null && errorMsg.length() > 250) {
                errorMsg = errorMsg.substring(0, 250) + "...";
            }

            setting.setConnectionStatus("FAILED");
            setting.setLastTestedAt(LocalDateTime.now());
            setting.setLastErrorMessage(errorMsg);
            emailSettingRepository.save(setting);

            logger.error("SMTP Test Email failed: {}", ex.getMessage());
            return TestResult.error("Failed to connect to SMTP server: " + errorMsg);
        }
    }

    /**
     * Checks if the service is currently running in DEMO MODE.
     */
    public boolean isDemoMode() {
        EmailSetting setting = getEmailSetting();
        return !isConfigured(setting);
    }

    /**
     * Returns the active sender email address configured by the Admin.
     */
    public String getActiveSenderEmail() {
        EmailSetting setting = getEmailSetting();
        if (setting.getSenderEmail() != null && !setting.getSenderEmail().trim().isEmpty()) {
            return setting.getSenderEmail();
        }
        return "admin@smartattendance.local";
    }

    /** Checks DB settings first, then secure environment-variable fallbacks. */
    private boolean isConfigured(EmailSetting setting) {
        boolean hasEmail = (setting.getSenderEmail() != null && !setting.getSenderEmail().trim().isEmpty())
                || (fallbackMailUsername != null && !fallbackMailUsername.trim().isEmpty());
        boolean hasPassword = (setting.getAppPassword() != null && !setting.getAppPassword().trim().isEmpty())
                || (fallbackMailPassword != null && !fallbackMailPassword.trim().isEmpty());
        return hasEmail && hasPassword;
    }

    /**
     * Dynamically builds a JavaMailSender using admin settings, falling back to environment variables.
     */
    private JavaMailSender buildDynamicMailSender(EmailSetting setting) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(setting.getSmtpHost() != null ? setting.getSmtpHost() : "smtp.gmail.com");
        mailSender.setPort(setting.getSmtpPort() != null ? setting.getSmtpPort() : 587);
        String username = (setting.getSenderEmail() != null && !setting.getSenderEmail().trim().isEmpty())
                ? setting.getSenderEmail().trim() : fallbackMailUsername;
        String password = (setting.getAppPassword() != null && !setting.getAppPassword().trim().isEmpty())
                ? setting.getAppPassword().replaceAll("\\s+", "") : fallbackMailPassword;
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "8000");
        props.put("mail.smtp.timeout", "8000");
        props.put("mail.smtp.writetimeout", "8000");

        return mailSender;
    }

    /**
     * Main method to process absence notifications for a list of absent students.
     * Automatically dispatches emails to BOTH the absent student and their parent.
     */
    public List<Notification> sendAbsenceNotifications(List<Student> absentStudents, LocalDate date, String classSession) {
        String session = (classSession == null || classSession.trim().isEmpty()) ? "Regular" : classSession.trim();
        List<Notification> createdNotifications = new ArrayList<>();
        String formattedDate = date.format(DATE_FORMATTER);

        for (Student student : absentStudents) {
            // 1. Process Student Email
            if (student.getStudentEmail() != null && !student.getStudentEmail().trim().isEmpty()) {
                boolean studentAlreadyNotified = notificationRepository.existsByStudentAndDateAndRecipientTypeAndClassSession(
                        student, date, "STUDENT", session);

                if (!studentAlreadyNotified) {
                    // Use the Admin-customized template subject (fallback to default if not set)
                    String studentSubject = buildStudentEmailSubject(student, formattedDate);
                    String studentBody = buildStudentEmailBody(student, formattedDate);
                    Notification studentNotif = dispatchAndRecord(
                            student,
                            student.getStudentEmail().trim(),
                            "STUDENT",
                            studentSubject,
                            studentBody,
                            date,
                            session
                    );
                    createdNotifications.add(studentNotif);
                }
            }

            // 2. Process Parent Email
            if (student.getParentEmail() != null && !student.getParentEmail().trim().isEmpty()) {
                boolean parentAlreadyNotified = notificationRepository.existsByStudentAndDateAndRecipientTypeAndClassSession(
                        student, date, "PARENT", session);

                if (!parentAlreadyNotified) {
                    // Use the Admin-customized template subject (fallback to default if not set)
                    String parentSubject = buildParentEmailSubject(student, formattedDate);
                    String parentBody = buildParentEmailBody(student, formattedDate);
                    Notification parentNotif = dispatchAndRecord(
                            student,
                            student.getParentEmail().trim(),
                            "PARENT",
                            parentSubject,
                            parentBody,
                            date,
                            session
                    );
                    createdNotifications.add(parentNotif);
                }
            }
        }

        return createdNotifications;
    }

    /**
     * Dispatches an individual email using dynamic settings or simulates it in DEMO MODE.
     */
    private Notification dispatchAndRecord(Student student, String recipientEmail, String recipientType,
                                          String subject, String messageText, LocalDate date, String classSession) {
        EmailSetting setting = getEmailSetting();
        String status;

        if (!isConfigured(setting)) {
            // DEMO MODE: No real SMTP call is made
            status = "DEMO MODE";
            logger.info("================ EMAIL PREVIEW [DEMO MODE] ================");
            logger.info("From: {} (Configurable in Admin Panel -> Email Settings)", getActiveSenderEmail());
            logger.info("To: {}", recipientEmail);
            logger.info("Subject: {}", subject);
            logger.info("Recipient Type: {}", recipientType);
            logger.info("Status: DEMO MODE");
            logger.info("Body:\n{}", messageText);
            logger.info("==========================================================");
        } else {
            // REAL SMTP DISPATCH USING DYNAMIC SENDER
            try {
                JavaMailSender dynamicSender = buildDynamicMailSender(setting);

                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setFrom(setting.getSenderEmail());
                mailMessage.setTo(recipientEmail);
                mailMessage.setSubject(subject);
                mailMessage.setText(messageText);

                dynamicSender.send(mailMessage);
                status = "SENT";
                logger.info("Absence email successfully sent to {} from {}", recipientEmail, setting.getSenderEmail());
            } catch (Exception ex) {
                status = "FAILED";
                logger.error("Failed to send absence email to {}: {}", recipientEmail, ex.getMessage());
            }
        }

        // Save notification log in MySQL
        Notification notification = new Notification(
                student,
                recipientEmail,
                recipientType,
                subject,
                messageText,
                date,
                LocalTime.now(),
                status,
                classSession
        );
        return notificationRepository.save(notification);
    }

    /**
     * Builds the student absence email body using the Admin-customized template.
     * Falls back to the default built-in text if no custom template is saved.
     */
    private String buildStudentEmailBody(Student student, String formattedDate) {
        // Build placeholder values to substitute into the template
        Map<String, String> extra = new HashMap<>();
        extra.put("sender_name",  getEmailSetting().getSenderName());
        extra.put("college_name", "Smart College of Engineering");
        extra.put("date",         formattedDate);

        // Use template service to build body with placeholder substitution
        return emailTemplateService.buildBody(
                EmailTemplateService.STUDENT_ABSENCE,
                student,
                null,  // date already set in extra map as formatted string
                extra
        );
    }

    /**
     * Builds the parent absence email body using the Admin-customized template.
     * Falls back to the default built-in text if no custom template is saved.
     */
    private String buildParentEmailBody(Student student, String formattedDate) {
        // Build placeholder values to substitute into the template
        Map<String, String> extra = new HashMap<>();
        extra.put("sender_name",  getEmailSetting().getSenderName());
        extra.put("college_name", "Smart College of Engineering");
        extra.put("date",         formattedDate);

        // Use template service to build body with placeholder substitution
        return emailTemplateService.buildBody(
                EmailTemplateService.PARENT_ABSENCE,
                student,
                null,  // date already set in extra map as formatted string
                extra
        );
    }

    /**
     * Builds the student absence email subject using the Admin-customized template.
     */
    private String buildStudentEmailSubject(Student student, String formattedDate) {
        Map<String, String> extra = new HashMap<>();
        extra.put("date", formattedDate);
        return emailTemplateService.buildSubject(EmailTemplateService.STUDENT_ABSENCE, student, null, extra);
    }

    /**
     * Builds the parent absence email subject using the Admin-customized template.
     */
    private String buildParentEmailSubject(Student student, String formattedDate) {
        Map<String, String> extra = new HashMap<>();
        extra.put("date", formattedDate);
        return emailTemplateService.buildSubject(EmailTemplateService.PARENT_ABSENCE, student, null, extra);
    }

    /**
     * Sends a test email with a fully-rendered template (used from the Email Templates editor).
     * This allows Admin to verify how a specific template looks before it goes live.
     */
    public TestResult sendTemplateTestEmail(String recipient, String subject, String body, String templateType) {
        EmailSetting setting = getEmailSetting();

        if (!isConfigured(setting)) {
            return TestResult.error("Email SMTP is not configured. Please set up your Gmail address and App Password in Email Settings first.");
        }

        try {
            JavaMailSender dynamicSender = buildDynamicMailSender(setting);

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(setting.getSenderEmail());
            mail.setTo(recipient);
            mail.setSubject("[TEST] " + subject);
            mail.setText("=== THIS IS A TEST EMAIL (Template: " + templateType + ") ===\n\n" + body
                    + "\n\n--- Sent from Smart QR Attendance Admin Panel ---");

            dynamicSender.send(mail);

            logger.info("Template test email sent to {} for template type: {}", recipient, templateType);
            return TestResult.success("Test email sent successfully to " + recipient + "! Check your inbox.");

        } catch (Exception ex) {
            String errorMsg = ex.getMessage();
            if (errorMsg != null && errorMsg.length() > 200) {
                errorMsg = errorMsg.substring(0, 200) + "...";
            }
            logger.error("Template test email failed for {}: {}", templateType, ex.getMessage());
            return TestResult.error("Failed to send test email: " + errorMsg);
        }
    }

    public List<Notification> getRecentNotifications() {
        return notificationRepository.findTop10ByOrderByDateDescTimeDesc();
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByDateDescTimeDesc();
    }
}

