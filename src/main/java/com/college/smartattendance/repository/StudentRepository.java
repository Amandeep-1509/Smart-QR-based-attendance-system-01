package com.college.smartattendance.repository;

import com.college.smartattendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for the Student entity.
 * Handles database queries such as searching students, checking unique IDs, and class filtering.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    // Find student by their unique student ID (used during QR code scan)
    Optional<Student> findByStudentId(String studentId);

    // Check if a student ID already exists to prevent duplicate entries
    boolean existsByStudentId(String studentId);

    // Find students by class and division (e.g. CSE - A)
    List<Student> findByClassNameAndDivision(String className, String division);

    // Search students by name, student ID, or roll number (case-insensitive)
    @Query("SELECT s FROM Student s WHERE " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.studentId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.rollNo) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.className) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Student> searchStudents(@Param("query") String query);

    // Get all distinct class names for filtering
    @Query("SELECT DISTINCT s.className FROM Student s ORDER BY s.className ASC")
    List<String> findDistinctClasses();
}
