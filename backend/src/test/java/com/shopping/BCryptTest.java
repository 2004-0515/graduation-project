package com.shopping;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BCryptTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "test123";
        String hashedPassword = "$2a$10$iQM44Zo4zPDLHeERJBJKAeutxPb7Yv3VHFSCAQrZfJ0ohmSaxm87C";
        
        System.out.println("Password: " + password);
        System.out.println("Hashed Password: " + hashedPassword);
        System.out.println("Match: " + encoder.matches(password, hashedPassword));
    }
}