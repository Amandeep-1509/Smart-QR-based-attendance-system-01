package com.college.smartattendance.repository;

import com.college.smartattendance.model.Notification;
import com.college.smartattendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Spring Data JPA repository for the Notification entity.
 * Handles querying and tracking sent emails to absent students and parents.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Retrieve recent notifications for dashboard display
    List<Notification> findTop10ByOrderByDateDescTimeDesc();

    // Retrieve all notifications sorted newest first
    List<Notification> findAllByOrderByDateDescTimeDesc();

    // Check if an email was already sent to avoid duplicate notifications on the same date and session
    boolean existsByStudentAndDateAndRecipientTypeAndClassSession(
            Student student, LocalDate date, String recipientType, String classSession);

    // Count notifications by date
    long countByDate(LocalDate date);
}
