package com.college.smartattendance.controller;

import com.college.smartattendance.model.Notification;
import com.college.smartattendance.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Controller displaying email notification history sent to absent students and parents.
 * Shows delivery status (SENT / DEMO MODE / FAILED) and full email previews.
 */
@Controller
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private EmailService emailService;

    @GetMapping
    public String showNotificationsPage(Model model) {
        List<Notification> notifications = emailService.getAllNotifications();
        model.addAttribute("notifications", notifications);
        model.addAttribute("isDemoMode", emailService.isDemoMode());
        return "notifications";
    }
}
