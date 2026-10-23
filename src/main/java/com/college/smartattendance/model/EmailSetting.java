package com.college.smartattendance.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Model class representing dynamic Email Configuration stored in the database.
 * Allows the Administrator to update the sender Gmail address and App Password
 * directly from the Admin Panel without modifying code or restarting the application.
 */
@Entity
@Table(name = "email_settings")
public class EmailSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sender Gmail address (e.g. college.attendance@gmail.com)
    @Column(name = "sender_email", length = 100)
    private String senderEmail;

    // Friendly display name in the sender field
    @Column(name = "sender_name", length = 100)
    private String senderName;

    // 16-character Google App Password (stored securely, never exposed to frontend)
    @Column(name = "app_password", length = 100)
    private String appPassword;

    // SMTP Host (default smtp.gmail.com)
    @Column(name = "smtp_host", length = 100)
    private String smtpHost;

    // SMTP Port (default 587)
    @Column(name = "smtp_port")
    private Integer smtpPort;

    // Status: "NOT_CONFIGURED", "CONNECTED", or "FAILED"
    @Column(name = "connection_status", length = 30)
    private String connectionStatus;

    // Timestamp when the connection was last tested
    @Column(name = "last_tested_at")
    private LocalDateTime lastTestedAt;

    // Error details if connection test failed
    @Column(name = "last_error_message", length = 500)
    private String lastErrorMessage;

    // Default constructor for JPA
    public EmailSetting() {
        this.smtpHost = "smtp.gmail.com";
        this.smtpPort = 587;
        this.senderName = "Smart Attendance System";
        this.connectionStatus = "NOT_CONFIGURED";
    }

    public EmailSetting(String senderEmail, String senderName, String appPassword) {
        this();
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.appPassword = appPassword;
    }

    // Helper to check if credentials are provided
    public boolean isConfigured() {
        return senderEmail != null && !senderEmail.trim().isEmpty() &&
               appPassword != null && !appPassword.trim().isEmpty();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getAppPassword() {
        return appPassword;
    }

    public void setAppPassword(String appPassword) {
        this.appPassword = appPassword;
    }

    public String getSmtpHost() {
        return smtpHost;
    }

    public void setSmtpHost(String smtpHost) {
        this.smtpHost = smtpHost;
    }

    public Integer getSmtpPort() {
        return smtpPort;
    }

    public void setSmtpPort(Integer smtpPort) {
        this.smtpPort = smtpPort;
    }

    public String getConnectionStatus() {
        return connectionStatus;
    }

    public void setConnectionStatus(String connectionStatus) {
        this.connectionStatus = connectionStatus;
    }

    public LocalDateTime getLastTestedAt() {
        return lastTestedAt;
    }

    public void setLastTestedAt(LocalDateTime lastTestedAt) {
        this.lastTestedAt = lastTestedAt;
    }

    public String getLastErrorMessage() {
        return lastErrorMessage;
    }

    public void setLastErrorMessage(String lastErrorMessage) {
        this.lastErrorMessage = lastErrorMessage;
    }
}
