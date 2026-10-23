package com.college.smartattendance.model;

import jakarta.persistence.*;

/**
 * Model class representing a Student.
 * Maps to the 'students' table in the MySQL database.
 * Each student has a unique Student ID (used to generate their QR Code).
 */
@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Unique Student ID (e.g., STU001, STU002) - encoded inside the QR Code
    @Column(name = "student_id", nullable = false, unique = true, length = 30)
    private String studentId;

    // College Roll Number (e.g., 101, 102)
    @Column(name = "roll_no", nullable = false, length = 30)
    private String rollNo;

    // Full name of the student
    @Column(nullable = false, length = 100)
    private String name;

    // Class / Branch (e.g., CSE, IT, MECH)
    @Column(name = "class_name", nullable = false, length = 50)
    private String className;

    // Division / Section (e.g., A, B)
    @Column(nullable = false, length = 20)
    private String division;

    // Email address of the student for absence notifications
    @Column(name = "student_email", nullable = false, length = 100)
    private String studentEmail;

    // Name of the parent or guardian
    @Column(name = "parent_name", nullable = false, length = 100)
    private String parentName;

    // Email address of the parent for absence notifications
    @Column(name = "parent_email", nullable = false, length = 100)
    private String parentEmail;

    // Contact mobile number of the student (optional)
    @Column(name = "student_mobile", length = 20)
    private String studentMobile;

    // Default constructor for JPA
    public Student() {
    }

    // Parameterized constructor
    public Student(String studentId, String rollNo, String name, String className,
                   String division, String studentEmail, String parentName,
                   String parentEmail, String studentMobile) {
        this.studentId = studentId;
        this.rollNo = rollNo;
        this.name = name;
        this.className = className;
        this.division = division;
        this.studentEmail = studentEmail;
        this.parentName = parentName;
        this.parentEmail = parentEmail;
        this.studentMobile = studentMobile;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getRollNo() {
        return rollNo;
    }

    public void setRollNo(String rollNo) {
        this.rollNo = rollNo;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getDivision() {
        return division;
    }

    public void setDivision(String division) {
        this.division = division;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getParentName() {
        return parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public String getParentEmail() {
        return parentEmail;
    }

    public void setParentEmail(String parentEmail) {
        this.parentEmail = parentEmail;
    }

    public String getStudentMobile() {
        return studentMobile;
    }

    public void setStudentMobile(String studentMobile) {
        this.studentMobile = studentMobile;
    }
}
