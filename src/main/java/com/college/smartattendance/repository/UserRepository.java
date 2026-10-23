package com.college.smartattendance.repository;

import com.college.smartattendance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the User entity.
 * Handles database operations for admin/teacher login.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find a user by their unique username
    Optional<User> findByUsername(String username);

    // Verify user credentials (username and password match)
    Optional<User> findByUsernameAndPassword(String username, String password);
}
