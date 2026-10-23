package com.college.smartattendance.controller;

import com.college.smartattendance.model.User;
import com.college.smartattendance.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

/**
 * Controller handling Admin / Teacher authentication and session management.
 * Simple, beginner-friendly login without complex security frameworks.
 */
@Controller
public class LoginController {

    @Autowired
    private UserRepository userRepository;

    // Display the login page
    @GetMapping("/login")
    public String showLoginPage(@RequestParam(value = "error", required = false) String error,
                                @RequestParam(value = "logout", required = false) String logout,
                                Model model,
                                HttpSession session) {
        // If already logged in, redirect straight to the dashboard
        if (session.getAttribute("loggedInUser") != null) {
            return "redirect:/dashboard";
        }

        if (error != null) {
            model.addAttribute("errorMessage", "Invalid Username or Password! Please try again.");
        }
        if (logout != null) {
            model.addAttribute("successMessage", "You have been successfully logged out.");
        }
        return "login";
    }

    // Process login credentials
    @PostMapping("/login")
    public String processLogin(@RequestParam("username") String username,
                               @RequestParam("password") String password,
                               HttpSession session,
                               Model model) {
        Optional<User> userOpt = userRepository.findByUsernameAndPassword(username.trim(), password.trim());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Store user info in HTTP session
            session.setAttribute("loggedInUser", user);
            session.setAttribute("userName", user.getFullName());
            session.setAttribute("userRole", user.getRole());
            return "redirect:/dashboard";
        } else {
            return "redirect:/login?error=true";
        }
    }

    // Process logout and clear session
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login?logout=true";
    }
}
