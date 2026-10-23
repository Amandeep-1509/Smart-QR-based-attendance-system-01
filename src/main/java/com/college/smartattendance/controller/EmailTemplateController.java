package com.college.smartattendance.controller;

import com.college.smartattendance.model.EmailTemplate;
import com.college.smartattendance.service.EmailService;
import com.college.smartattendance.service.EmailTemplateService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for the Email Templates & Editor Admin Panel.
 *
 * Allows the Administrator to:
 * - View, edit and save customized email templates for all 4 notification types
 * - Preview templates with sample data before saving
 * - Reset any template back to its original default text
 * - Send a test email using a specific template
 *
 * Access is restricted to users with the ADMIN role only.
 */
@Controller
@RequestMapping("/settings/templates")
public class EmailTemplateController {

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Autowired
    private EmailService emailService;

    // -----------------------------------------------------------------------
    // ADMIN ROLE CHECK
    // -----------------------------------------------------------------------

    /**
     * Helper to verify if the current session user has ADMIN role.
     */
    private boolean isAdmin(HttpSession session) {
        Object role = session.getAttribute("userRole");
        return role != null && "ADMIN".equalsIgnoreCase(role.toString());
    }

    // -----------------------------------------------------------------------
    // DISPLAY PAGE
    // -----------------------------------------------------------------------

    /**
     * Shows the Email Templates Editor page with all four template tabs.
     * Loads the current template from the database (or the default if not yet customized).
     */
    @GetMapping
    public String showTemplatesPage(HttpSession session, Model model, RedirectAttributes redirectAttributes) {
        // Only Admin can access this page
        if (!isAdmin(session)) {
            redirectAttributes.addFlashAttribute("errorMessage",
                    "Access Denied: Only Administrators can view or edit Email Templates.");
            return "redirect:/dashboard";
        }

        // Load all four templates (seeding defaults if not present)
        EmailTemplate studentTemplate  = emailTemplateService.getTemplate(EmailTemplateService.STUDENT_ABSENCE);
        EmailTemplate parentTemplate   = emailTemplateService.getTemplate(EmailTemplateService.PARENT_ABSENCE);
        EmailTemplate teacherAbsTemplate = emailTemplateService.getTemplate(EmailTemplateService.TEACHER_ABSENCE);
        EmailTemplate teacherAttTemplate = emailTemplateService.getTemplate(EmailTemplateService.TEACHER_ATTENDANCE);

        model.addAttribute("studentTemplate",      studentTemplate);
        model.addAttribute("parentTemplate",       parentTemplate);
        model.addAttribute("teacherAbsTemplate",   teacherAbsTemplate);
        model.addAttribute("teacherAttTemplate",   teacherAttTemplate);

        // Pass current email connection status to show banner
        model.addAttribute("emailConfigured", !emailService.isDemoMode());
        model.addAttribute("senderEmail", emailService.getActiveSenderEmail());

        return "email-templates";
    }

    // -----------------------------------------------------------------------
    // SAVE TEMPLATE
    // -----------------------------------------------------------------------

    /**
     * Saves an edited template (subject + body) for the specified template type.
     * Called via form POST when Admin clicks "Save Template".
     */
    @PostMapping("/save")
    public String saveTemplate(
            @RequestParam("templateType") String templateType,
            @RequestParam("subject") String subject,
            @RequestParam("bodyText") String bodyText,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!isAdmin(session)) {
            redirectAttributes.addFlashAttribute("errorMessage", "Access Denied: Admin authorization required.");
            return "redirect:/dashboard";
        }

        // Validate inputs
        if (subject == null || subject.trim().isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Subject cannot be empty.");
            redirectAttributes.addFlashAttribute("activeTab", templateType);
            return "redirect:/settings/templates";
        }

        if (bodyText == null || bodyText.trim().isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Message body cannot be empty.");
            redirectAttributes.addFlashAttribute("activeTab", templateType);
            return "redirect:/settings/templates";
        }

        // Save the customized template to the database
        emailTemplateService.saveTemplate(templateType, subject, bodyText);

        String label = EmailTemplateService.getDisplayLabel(templateType);
        redirectAttributes.addFlashAttribute("successMessage",
                "✓ Template saved successfully: " + label);
        redirectAttributes.addFlashAttribute("activeTab", templateType);

        return "redirect:/settings/templates";
    }

    // -----------------------------------------------------------------------
    // RESET TO DEFAULT
    // -----------------------------------------------------------------------

    /**
     * Resets a specific template back to the built-in default text.
     * Called via POST when Admin clicks "Reset to Default".
     */
    @PostMapping("/reset")
    public String resetTemplate(
            @RequestParam("templateType") String templateType,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!isAdmin(session)) {
            redirectAttributes.addFlashAttribute("errorMessage", "Access Denied: Admin authorization required.");
            return "redirect:/dashboard";
        }

        // Restore default subject and body
        emailTemplateService.resetToDefault(templateType);

        String label = EmailTemplateService.getDisplayLabel(templateType);
        redirectAttributes.addFlashAttribute("successMessage",
                "↩ Template reset to default: " + label);
        redirectAttributes.addFlashAttribute("activeTab", templateType);

        return "redirect:/settings/templates";
    }

    // -----------------------------------------------------------------------
    // AJAX: GET DEFAULT TEXT (for Live Preview of default)
    // -----------------------------------------------------------------------

    /**
     * REST API to fetch the default subject and body for a template type.
     * Called by JavaScript when the Admin clicks "Reset to Default" to preview
     * the original text before actually saving.
     */
    @GetMapping("/api/default/{templateType}")
    @ResponseBody
    public ResponseEntity<Map<String, String>> getDefaultTemplate(
            @PathVariable("templateType") String templateType,
            HttpSession session) {

        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
        }

        Map<String, String> response = new HashMap<>();
        response.put("subject",  EmailTemplateService.getDefaultSubject(templateType));
        response.put("bodyText", EmailTemplateService.getDefaultBody(templateType));
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // AJAX: SEND TEST EMAIL USING A SPECIFIC TEMPLATE
    // -----------------------------------------------------------------------

    /**
     * REST API to send a test email using a specific template.
     * Replaces placeholders with sample/demo data before sending.
     * Called by JavaScript when Admin clicks "Send Test Email" in the editor.
     */
    @PostMapping("/api/test")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> sendTestEmail(
            @RequestParam("templateType") String templateType,
            @RequestParam(value = "testRecipient", required = false) String testRecipient,
            HttpSession session) {

        Map<String, Object> response = new HashMap<>();

        if (!isAdmin(session)) {
            response.put("success", false);
            response.put("message", "Unauthorized access.");
            return ResponseEntity.status(403).body(response);
        }

        // Check that email SMTP is configured
        if (emailService.isDemoMode()) {
            response.put("success", false);
            response.put("message", "Email SMTP is not configured yet. Please set up your Gmail address and App Password in Email Settings first.");
            return ResponseEntity.ok(response);
        }

        // Build sample placeholder values for the test email
        Map<String, String> sampleValues = buildSamplePlaceholderValues();

        // Resolve recipient – default to sender email if not provided
        String recipient = (testRecipient != null && !testRecipient.trim().isEmpty())
                ? testRecipient.trim()
                : emailService.getActiveSenderEmail();

        // Build subject and body using the template + sample values
        String subject = emailTemplateService.buildSubject(templateType, null, java.time.LocalDate.now(), sampleValues);
        String body    = emailTemplateService.buildBody(templateType, null, java.time.LocalDate.now(), sampleValues);

        // Attempt to send via EmailService
        EmailService.TestResult result = emailService.sendTemplateTestEmail(recipient, subject, body, templateType);

        response.put("success", result.isSuccess());
        response.put("message", result.getMessage());
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // PRIVATE HELPER: Sample placeholder values for test emails
    // -----------------------------------------------------------------------

    /**
     * Creates a map of sample/demo values for all supported placeholders.
     * Used when Admin sends a test email from the template editor.
     */
    private Map<String, String> buildSamplePlaceholderValues() {
        Map<String, String> values = new HashMap<>();
        values.put("student_name",           "Amandeep Singh");
        values.put("parent_name",            "Gurdeep Singh");
        values.put("roll_no",                "101");
        values.put("class_name",             "CSE");
        values.put("division",               "A");
        values.put("attendance_status",      "ABSENT");
        values.put("teacher_name",           "Prof. Rajesh Sharma");
        values.put("absent_students_list",   "101 - Amandeep Singh, 103 - Priya Patel");
        values.put("total_students",         "8");
        values.put("present_count",          "6");
        values.put("absent_count",           "2");
        values.put("attendance_percentage",  "75.00");
        values.put("college_name",           "Smart College of Engineering");
        values.put("sender_name",            emailService.getActiveSenderEmail());
        return values;
    }
}
