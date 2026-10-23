package com.college.smartattendance.controller;

import com.college.smartattendance.model.Student;
import com.college.smartattendance.service.QRCodeService;
import com.college.smartattendance.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Optional;

/**
 * Controller managing Student records:
 * Adding, editing, deleting, searching, viewing ID cards, and downloading QR codes.
 */
@Controller
@RequestMapping("/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private QRCodeService qrCodeService;

    // Display student list with search and class filtering
    @GetMapping
    public String listStudents(@RequestParam(value = "search", required = false) String search,
                               Model model) {
        List<Student> students = studentService.searchStudents(search);
        model.addAttribute("students", students);
        model.addAttribute("searchQuery", search != null ? search : "");
        model.addAttribute("totalStudents", students.size());
        return "students";
    }

    // Show form to add a new student
    @GetMapping("/new")
    public String showAddStudentForm(Model model) {
        Student student = new Student();
        student.setStudentId(studentService.getNextSuggestedStudentId());
        model.addAttribute("student", student);
        model.addAttribute("isEdit", false);
        return "student-form";
    }

    // Show form to edit an existing student
    @GetMapping("/edit/{id}")
    public String showEditStudentForm(@PathVariable("id") Long id, Model model, RedirectAttributes redirectAttributes) {
        Optional<Student> studentOpt = studentService.getStudentById(id);
        if (studentOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Student not found with ID: " + id);
            return "redirect:/students";
        }

        model.addAttribute("student", studentOpt.get());
        model.addAttribute("isEdit", true);
        return "student-form";
    }

    // Save student (handles both Add and Edit)
    @PostMapping("/save")
    public String saveStudent(@ModelAttribute("student") Student student,
                              @RequestParam(value = "isEdit", defaultValue = "false") boolean isEdit,
                              RedirectAttributes redirectAttributes,
                              Model model) {
        // Validate uniqueness of student ID for new registrations
        if (!isEdit && studentService.existsByStudentId(student.getStudentId())) {
            model.addAttribute("errorMessage", "Student ID '" + student.getStudentId() + "' already exists! Please enter a unique ID.");
            model.addAttribute("student", student);
            model.addAttribute("isEdit", isEdit);
            return "student-form";
        }

        studentService.saveStudent(student);
        redirectAttributes.addFlashAttribute("successMessage",
                "Student '" + student.getName() + "' (" + student.getStudentId() + ") saved successfully!");
        return "redirect:/students";
    }

    // Delete a student record
    @GetMapping("/delete/{id}")
    public String deleteStudent(@PathVariable("id") Long id, RedirectAttributes redirectAttributes) {
        try {
            studentService.deleteStudent(id);
            redirectAttributes.addFlashAttribute("successMessage", "Student deleted successfully.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete student: attendance or notification records exist.");
        }
        return "redirect:/students";
    }

    // Display student printable ID card with embedded QR Code
    @GetMapping("/{id}/card")
    public String viewStudentCard(@PathVariable("id") Long id, Model model, RedirectAttributes redirectAttributes) {
        Optional<Student> studentOpt = studentService.getStudentById(id);
        if (studentOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Student not found.");
            return "redirect:/students";
        }

        Student student = studentOpt.get();
        String qrBase64 = qrCodeService.generateQRCodeBase64(student.getStudentId());

        model.addAttribute("student", student);
        model.addAttribute("qrCodeBase64", qrBase64);
        return "student-card";
    }

    // Download QR Code as a PNG image file
    @GetMapping("/{id}/qr-download")
    @ResponseBody
    public ResponseEntity<byte[]> downloadQRCode(@PathVariable("id") Long id) {
        Optional<Student> studentOpt = studentService.getStudentById(id);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Student student = studentOpt.get();
        byte[] qrBytes = qrCodeService.generateQRCodeImage(student.getStudentId(), 300, 300);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"QR_" + student.getStudentId() + ".png\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(qrBytes);
    }
}
