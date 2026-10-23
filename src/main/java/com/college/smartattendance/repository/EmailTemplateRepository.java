package com.college.smartattendance.repository;

import com.college.smartattendance.model.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for EmailTemplate.
 * Provides built-in save, findById, findAll, delete operations.
 */
@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    // Find a template by its type string (e.g. "STUDENT_ABSENCE")
    Optional<EmailTemplate> findByTemplateType(String templateType);
}
