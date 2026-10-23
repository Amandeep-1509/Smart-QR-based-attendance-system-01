package com.college.smartattendance.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

/**
 * Service to generate QR codes for students using Google's ZXing library.
 * The QR code contains the student's unique Student ID (e.g., STU001).
 */
@Service
public class QRCodeService {

    /**
     * Generates a QR code image as a byte array in PNG format.
     *
     * @param text The content to encode inside the QR code (Student ID)
     * @param width Width of the generated QR code in pixels
     * @param height Height of the generated QR code in pixels
     * @return PNG image byte array
     */
    public byte[] generateQRCodeImage(String text, int width, int height) {
        try {
            // Initialize ZXing QRCodeWriter
            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            // Encode the text into a 2D bit matrix
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);

            // Convert bit matrix to PNG output stream
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating QR code for text: " + text, e);
        }
    }

    /**
     * Generates a Base64-encoded Data URL string for displaying directly in HTML <img> tags.
     * Example output: "data:image/png;base64,iVBORw0KGgo..."
     *
     * @param text The Student ID to encode
     * @return Base64 data URL string
     */
    public String generateQRCodeBase64(String text) {
        byte[] imageBytes = generateQRCodeImage(text, 250, 250);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
    }
}
