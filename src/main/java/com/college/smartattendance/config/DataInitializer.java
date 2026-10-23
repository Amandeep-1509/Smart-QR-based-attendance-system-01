package com.college.smartattendance.config;

import com.college.smartattendance.model.Attendance;
import com.college.smartattendance.model.Notification;
import com.college.smartattendance.model.Student;
import com.college.smartattendance.model.User;
import com.college.smartattendance.repository.AttendanceRepository;
import com.college.smartattendance.repository.NotificationRepository;
import com.college.smartattendance.repository.StudentRepository;
import com.college.smartattendance.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

/**
 * Initializes default sample data on application startup.
 * Seeds default Administrator & Teacher credentials, sample college students, and test history.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public void run(String... args) {
        // 1. Seed or Upgrade Default Admin Account
        Optional<User> adminOpt = userRepository.findByUsername("admin");
        if (adminOpt.isPresent()) {
            User admin = adminOpt.get();
            if (!"ADMIN".equalsIgnoreCase(admin.getRole())) {
                admin.setRole("ADMIN");
                userRepository.save(admin);
                logger.info("Updated 'admin' account role to ADMIN.");
            }
        } else {
            User admin = new User("admin", "admin123", "System Administrator", "ADMIN");
            userRepository.save(admin);
            logger.info("Default administrator login created -> Username: admin | Password: admin123 (Role: ADMIN)");
        }

        // 2. Seed a separate Teacher Account to demonstrate role-based access control
        if (userRepository.findByUsername("teacher").isEmpty()) {
            User teacher = new User("teacher", "teacher123", "Prof. Rajesh Sharma", "TEACHER");
            userRepository.save(teacher);
            logger.info("Default teacher login created -> Username: teacher | Password: teacher123 (Role: TEACHER)");
        }

        // 3. Seed Sample College Students
        if (studentRepository.count() == 0) {
            Student s1 = new Student("STU001", "101", "Amandeep Singh", "CSE", "A",
                    "amandeep.singh@example.com", "Gurdeep Singh", "gurdeep.singh@example.com", "9876543210");
            Student s2 = new Student("STU002", "102", "Rahul Sharma", "CSE", "A",
                    "rahul.sharma@example.com", "Ramesh Sharma", "ramesh.sharma@example.com", "9876543211");
            Student s3 = new Student("STU003", "103", "Priya Patel", "CSE", "A",
                    "priya.patel@example.com", "Kirit Patel", "kirit.patel@example.com", "9876543212");
            Student s4 = new Student("STU004", "104", "Sneha Verma", "CSE", "A",
                    "sneha.verma@example.com", "Alok Verma", "alok.verma@example.com", "9876543213");
            Student s5 = new Student("STU005", "105", "Aniket Deshmukh", "CSE", "A",
                    "aniket.deshmukh@example.com", "Sanjay Deshmukh", "sanjay.deshmukh@example.com", "9876543214");
            Student s6 = new Student("STU006", "106", "Rohan Mehta", "CSE", "B",
                    "rohan.mehta@example.com", "Dinesh Mehta", "dinesh.mehta@example.com", "9876543215");
            Student s7 = new Student("STU007", "107", "Kavita Rao", "CSE", "B",
                    "kavita.rao@example.com", "Narasimha Rao", "narasimha.rao@example.com", "9876543216");
            Student s8 = new Student("STU008", "108", "Aditya Kulkarni", "IT", "A",
                    "aditya.kulkarni@example.com", "Prashant Kulkarni", "prashant.kulkarni@example.com", "9876543217");

            studentRepository.save(s1);
            studentRepository.save(s2);
            studentRepository.save(s3);
            studentRepository.save(s4);
            studentRepository.save(s5);
            studentRepository.save(s6);
            studentRepository.save(s7);
            studentRepository.save(s8);
            logger.info("Seeded 8 sample students across CSE and IT classes.");

            // 4. Seed Sample Attendance for yesterday
            LocalDate yesterday = LocalDate.now().minusDays(1);
            attendanceRepository.save(new Attendance(s1, yesterday, LocalTime.of(9, 15, 30), "PRESENT", "Regular"));
            attendanceRepository.save(new Attendance(s2, yesterday, LocalTime.of(9, 16, 45), "PRESENT", "Regular"));
            attendanceRepository.save(new Attendance(s3, yesterday, LocalTime.of(9, 18, 12), "PRESENT", "Regular"));
            attendanceRepository.save(new Attendance(s4, yesterday, LocalTime.of(9, 20, 0), "ABSENT", "Regular"));
            attendanceRepository.save(new Attendance(s5, yesterday, LocalTime.of(9, 21, 10), "PRESENT", "Regular"));

            // 5. Seed sample notification history
            Notification sampleNotif = new Notification(
                    s4,
                    s4.getParentEmail(),
                    "PARENT",
                    "Your Ward's Attendance Notification",
                    "Subject: Your Ward's Attendance Notification\n\nDear Alok Verma,\n\nYour ward Sneha Verma has been marked absent for today's class.\nDate: " + yesterday + "\n\nRegards,\nSmart Attendance System",
                    yesterday,
                    LocalTime.of(9, 45, 0),
                    "DEMO MODE",
                    "Regular"
            );
            notificationRepository.save(sampleNotif);
        }
    }
}
