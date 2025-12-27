package com.shopping;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BCryptValidator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "test123";
        String hashedPassword = "$2a$10$iQM44Zo4zPDLHeERJBJKAeutxPb7Yv3VHFSCAQrZfJ0ohmSaxm87C";
        
        System.out.println("Password: " + password);
        System.out.println("Hashed Password: " + hashedPassword);
        System.out.println("Match: " + encoder.matches(password, hashedPassword));
        
        // 测试其他密码
        System.out.println("\nTesting other passwords:");
        System.out.println("test: " + encoder.matches("test", hashedPassword));
        System.out.println("test1234: " + encoder.matches("test1234", hashedPassword));
        System.out.println("admin123: " + encoder.matches("admin123", hashedPassword));
    }
}