package com.college.smartattendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Entry Point for the Smart QR-Based Attendance & Parent Email Notification System.
 *
 * College Mini Project
 * Technology Stack:
 * - Java 17+ / Spring Boot 3
 * - Spring Data JPA (Hibernate)
 * - Spring Boot Starter Mail (JavaMailSender with Demo Mode fallback)
 * - ZXing (Zebra Crossing) for QR Code Generation
 * - MySQL / H2 Database
 * - Thymeleaf, Modern CSS & Vanilla JavaScript with html5-qrcode
 */
@SpringBootApplication
public class SmartAttendanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartAttendanceApplication.class, args);
        System.out.println("==================================================================");
        System.out.println("   SMART QR-BASED ATTENDANCE & PARENT NOTIFICATION SYSTEM");
        System.out.println("   Server is running successfully at: http://localhost:8080");
        System.out.println("   Default Teacher Login -> Username: admin | Password: admin123");
        System.out.println("==================================================================");
    }
}
