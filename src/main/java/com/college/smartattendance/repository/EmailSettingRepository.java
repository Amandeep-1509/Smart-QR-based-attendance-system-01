package com.college.smartattendance.repository;

import com.college.smartattendance.model.EmailSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for dynamic Email Configuration.
 */
@Repository
public interface EmailSettingRepository extends JpaRepository<EmailSetting, Long> {

    // Retrieve the active email configuration
    Optional<EmailSetting> findFirstByOrderByIdAsc();
}
