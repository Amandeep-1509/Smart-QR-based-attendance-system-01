package com.college.smartattendance.controller;

import com.college.smartattendance.model.EmailSetting;
import com.college.smartattendance.service.EmailService;
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
 * Controller managing Admin Sender Email Settings.
 * Restricts configuration access strictly to users with the 'ADMIN' role.
 */
@Controller
@RequestMapping("/settings/email")
public class EmailSettingsController {

    @Autowired
    private EmailService emailService;

    /**
     * Helper to verify if the currently logged-in user has ADMIN privileges.
     */
    private boolean isAdmin(HttpSession session) {
        Object role = session.getAttribute("userRole");
        return role != null && "ADMIN".equalsIgnoreCase(role.toString());
    }

    // Display the Email Settings page
    @GetMapping
    public String showEmailSettingsPage(HttpSession session, Model model, RedirectAttributes redirectAttributes) {
        if (!isAdmin(session)) {
            redirectAttributes.addFlashAttribute("errorMessage",
                    "Access Denied: Only Administrators are authorized to view or configure Sender Email Settings.");
            return "redirect:/dashboard";
        }

        EmailSetting setting = emailService.getEmailSetting();

        model.addAttribute("senderEmail", setting.getSenderEmail() != null ? setting.getSenderEmail() : "");
        model.addAttribute("senderName", setting.getSenderName() != null ? setting.getSenderName() : "Smart Attendance System");
        model.addAttribute("hasPassword", setting.getAppPassword() != null && !setting.getAppPassword().isEmpty());
        model.addAttribute("connectionStatus", setting.getConnectionStatus());
        model.addAttribute("lastTestedAt", setting.getLastTestedAt());
        model.addAttribute("lastErrorMessage", setting.getLastErrorMessage());

        return "email-settings";
    }

    // Save or update Sender Email and Google App Password
    @PostMapping("/save")
    public String saveEmailSettings(
            @RequestParam("senderEmail") String senderEmail,
            @RequestParam(value = "senderName", required = false) String senderName,
            @RequestParam(value = "appPassword", required = false) String appPassword,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!isAdmin(session)) {
            redirectAttributes.addFlashAttribute("errorMessage", "Access Denied: Admin authorization required.");
            return "redirect:/dashboard";
        }

        if (senderEmail == null || senderEmail.trim().isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Sender Email Address cannot be blank.");
            return "redirect:/settings/email";
        }

        emailService.updateEmailSetting(senderEmail, senderName, appPassword);
        redirectAttributes.addFlashAttribute("successMessage",
                "Email Settings saved successfully! Use the 'Test Email' button below to verify your connection.");

        return "redirect:/settings/email";
    }

    // Test connection action (supports form POST)
    @PostMapping("/test")
    public String testEmailConnection(
            @RequestParam(value = "testRecipient", required = false) String testRecipient,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!isAdmin(session)) {
            redirectAttributes.addFlashAttribute("errorMessage", "Access Denied: Admin authorization required.");
            return "redirect:/dashboard";
        }

        EmailService.TestResult result = emailService.testEmailConnection(testRecipient);

        if (result.isSuccess()) {
            redirectAttributes.addFlashAttribute("successMessage", result.getMessage());
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", result.getMessage());
        }

        return "redirect:/settings/email";
    }

    // AJAX API to test email asynchronously without page reload
    @PostMapping("/api/test")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> testEmailApi(
            @RequestParam(value = "testRecipient", required = false) String testRecipient,
            HttpSession session) {

        Map<String, Object> response = new HashMap<>();

        if (!isAdmin(session)) {
            response.put("success", false);
            response.put("message", "Unauthorized access.");
            return ResponseEntity.status(403).body(response);
        }

        EmailService.TestResult result = emailService.testEmailConnection(testRecipient);
        response.put("success", result.isSuccess());
        response.put("message", result.getMessage());
        response.put("status", emailService.getEmailSetting().getConnectionStatus());

        return ResponseEntity.ok(response);
    }
}
