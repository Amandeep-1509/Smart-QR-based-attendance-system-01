package com.college.smartattendance.model;

import jakarta.persistence.*;

/**
 * Model class representing a User (Admin / Teacher) in the system.
 * This class maps to the 'users' table in MySQL.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Username used for logging into the attendance portal
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    // Password for user authentication
    @Column(nullable = false, length = 100)
    private String password;

    // Full name of the teacher or administrator
    @Column(nullable = false, length = 100)
    private String fullName;

    // Role such as ADMIN or TEACHER
    @Column(nullable = false, length = 20)
    private String role;

    // Default constructor required by JPA
    public User() {
    }

    // Parameterized constructor for easy object creation
    public User(String username, String password, String fullName, String role) {
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
