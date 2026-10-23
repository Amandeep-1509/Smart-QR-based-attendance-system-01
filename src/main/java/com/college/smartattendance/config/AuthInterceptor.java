package com.college.smartattendance.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Simple HTTP Interceptor to ensure that only logged-in teachers/admins can access
 * internal pages such as dashboard, student management, and attendance scanner.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);

        // Check if user session exists
        if (session == null || session.getAttribute("loggedInUser") == null) {
            // For API requests, return 401 Unauthorized
            if (request.getRequestURI().startsWith("/api/")) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return false;
            }
            // For regular web requests, redirect to login page
            response.sendRedirect(request.getContextPath() + "/login");
            return false;
        }

        return true;
    }
}
