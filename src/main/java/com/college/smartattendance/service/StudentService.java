package com.college.smartattendance.service;

import com.college.smartattendance.model.Student;
import com.college.smartattendance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service class handling all business logic related to student management.
 * Provides operations to add, view, search, update, and delete students.
 */
@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    // Retrieve all students from the database
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    // Retrieve a single student by database ID
    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    // Retrieve a student by their unique Student ID (e.g., STU001)
    public Optional<Student> getStudentByStudentId(String studentId) {
        if (studentId == null) {
            return Optional.empty();
        }
        return studentRepository.findByStudentId(studentId.trim());
    }

    // Save a new student or update an existing one
    public Student saveStudent(Student student) {
        // Trim inputs to avoid unintended whitespace issues
        student.setStudentId(student.getStudentId().trim().toUpperCase());
        student.setName(student.getName().trim());
        student.setRollNo(student.getRollNo().trim());
        student.setClassName(student.getClassName().trim());
        student.setDivision(student.getDivision().trim().toUpperCase());
        student.setStudentEmail(student.getStudentEmail().trim());
        student.setParentName(student.getParentName().trim());
        student.setParentEmail(student.getParentEmail().trim());
        if (student.getStudentMobile() != null) {
            student.setStudentMobile(student.getStudentMobile().trim());
        }
        return studentRepository.save(student);
    }

    // Check if a student ID already exists
    public boolean existsByStudentId(String studentId) {
        return studentRepository.existsByStudentId(studentId.trim());
    }

    // Delete a student by ID
    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }

    // Search students across name, roll number, student ID, and class
    public List<Student> searchStudents(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllStudents();
        }
        return studentRepository.searchStudents(query.trim());
    }

    // Get list of distinct classes for filters
    public List<String> getDistinctClasses() {
        return studentRepository.findDistinctClasses();
    }

    // Get total number of registered students
    public long getTotalStudentsCount() {
        return studentRepository.count();
    }

    // Helper to generate the next suggested Student ID (e.g. STU001, STU002)
    public String getNextSuggestedStudentId() {
        long count = studentRepository.count() + 1;
        String suggested = String.format("STU%03d", count);
        // Ensure it doesn't already exist
        while (studentRepository.existsByStudentId(suggested)) {
            count++;
            suggested = String.format("STU%03d", count);
        }
        return suggested;
    }
}
