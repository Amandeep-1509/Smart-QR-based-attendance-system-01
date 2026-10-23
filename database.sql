-- ===================================================================
-- SMART QR-BASED ATTENDANCE & PARENT EMAIL NOTIFICATION SYSTEM
-- Database Creation & Schema Script for MySQL
-- ===================================================================

-- Create database if not already created
CREATE DATABASE IF NOT EXISTS smart_attendance_db;
USE smart_attendance_db;

-- -------------------------------------------------------------------
-- 1. Table: users (Stores Admin & Teacher credentials)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'TEACHER'
);

-- Default Admin Login (ADMIN role has access to Email Settings)
INSERT INTO users (username, password, full_name, role)
VALUES ('admin', 'admin123', 'Prof. Rajesh Sharma', 'ADMIN')
ON DUPLICATE KEY UPDATE role='ADMIN';

-- Default Teacher Login
INSERT INTO users (username, password, full_name, role)
VALUES ('teacher', 'teacher123', 'Prof. Anil Kumar', 'TEACHER')
ON DUPLICATE KEY UPDATE id=id;

-- -------------------------------------------------------------------
-- 2. Table: students (Stores student and parent contact details)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(30) NOT NULL UNIQUE,
    roll_no VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    division VARCHAR(20) NOT NULL,
    student_email VARCHAR(100) NOT NULL,
    parent_name VARCHAR(100) NOT NULL,
    parent_email VARCHAR(100) NOT NULL,
    student_mobile VARCHAR(20)
);

-- Sample Students
INSERT INTO students (student_id, roll_no, name, class_name, division, student_email, parent_name, parent_email, student_mobile)
VALUES 
('STU001', '101', 'Amandeep Singh', 'CSE', 'A', 'amandeep.singh@example.com', 'Gurdeep Singh', 'gurdeep.singh@example.com', '9876543210'),
('STU002', '102', 'Rahul Sharma', 'CSE', 'A', 'rahul.sharma@example.com', 'Ramesh Sharma', 'ramesh.sharma@example.com', '9876543211'),
('STU003', '103', 'Priya Patel', 'CSE', 'A', 'priya.patel@example.com', 'Kirit Patel', 'kirit.patel@example.com', '9876543212'),
('STU004', '104', 'Sneha Verma', 'CSE', 'A', 'sneha.verma@example.com', 'Alok Verma', 'alok.verma@example.com', '9876543213'),
('STU005', '105', 'Aniket Deshmukh', 'CSE', 'A', 'aniket.deshmukh@example.com', 'Sanjay Deshmukh', 'sanjay.deshmukh@example.com', '9876543214'),
('STU006', '106', 'Rohan Mehta', 'CSE', 'B', 'rohan.mehta@example.com', 'Dinesh Mehta', 'dinesh.mehta@example.com', '9876543215'),
('STU007', '107', 'Kavita Rao', 'CSE', 'B', 'kavita.rao@example.com', 'Narasimha Rao', 'narasimha.rao@example.com', '9876543216'),
('STU008', '108', 'Aditya Kulkarni', 'IT', 'A', 'aditya.kulkarni@example.com', 'Prashant Kulkarni', 'prashant.kulkarni@example.com', '9876543217')
ON DUPLICATE KEY UPDATE id=id;

-- -------------------------------------------------------------------
-- 3. Table: attendance (Stores QR-scanned and manual attendance)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id_fk BIGINT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(15) NOT NULL,
    class_session VARCHAR(50) NOT NULL,
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id_fk) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT uk_student_date_session UNIQUE (student_id_fk, date, class_session)
);

-- -------------------------------------------------------------------
-- 4. Table: notifications (Stores absence notification email history)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id_fk BIGINT NOT NULL,
    recipient_email VARCHAR(100) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(30) NOT NULL,
    class_session VARCHAR(50),
    CONSTRAINT fk_notification_student FOREIGN KEY (student_id_fk) REFERENCES students(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------
-- 5. Table: email_settings (Stores Admin-configurable sender email)
-- -------------------------------------------------------------------
-- This table stores the Gmail address and App Password used to send
-- absence notifications to students and parents. Admin can update
-- these from the Admin Panel without touching any source code files.
CREATE TABLE IF NOT EXISTS email_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_email VARCHAR(100),
    sender_name VARCHAR(100) DEFAULT 'Smart Attendance System',
    app_password VARCHAR(100),
    smtp_host VARCHAR(100) DEFAULT 'smtp.gmail.com',
    smtp_port INT DEFAULT 587,
    connection_status VARCHAR(30) DEFAULT 'NOT_CONFIGURED',
    last_tested_at DATETIME,
    last_error_message VARCHAR(500)
);

-- -------------------------------------------------------------------
-- 6. Table: email_templates (Stores Admin-customized notification templates)
-- -------------------------------------------------------------------
-- Each row stores a customizable email template for one notification type.
-- The four template types are:
--   STUDENT_ABSENCE    -> Email sent to the absent student
--   PARENT_ABSENCE     -> Email sent to the student's parent
--   TEACHER_ABSENCE    -> Daily absent-students summary sent to teacher
--   TEACHER_ATTENDANCE -> Full attendance statistics summary sent to teacher
CREATE TABLE IF NOT EXISTS email_templates (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_type   VARCHAR(50) NOT NULL UNIQUE,
    display_label   VARCHAR(100),
    subject         VARCHAR(300),
    body_text       TEXT,
    is_customized   BOOLEAN DEFAULT FALSE,
    last_modified   DATETIME
);
