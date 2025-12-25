package com.shopping.config;

import com.shopping.filter.JwtAuthenticationFilter;
import com.shopping.filter.RateLimiterFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Autowired
    private RateLimiterFilter rateLimiterFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // 启用CORS，使用自定义配置
            .csrf(csrf -> csrf.disable()) // 前后端分离，禁用CSRF
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // 无状态会话
            )
            .authorizeHttpRequests(authorize -> authorize
                // 允许匿名访问的API - 使用相对路径，因为context-path已经在application.properties中配置
                .requestMatchers("/auth/login", "/auth/register", "/auth/captcha", "/auth/validate-captcha", "/auth/test-password-match", "/categories/**", "/products/**").permitAll()
                // 密码修改API需要认证访问
                .requestMatchers("/auth/change-password").authenticated()
                // 地址相关API需要认证访问
                .requestMatchers("/addresses/**").authenticated()
                // 购物车相关API需要认证访问
                .requestMatchers("/cart/**").authenticated()
                // 其他API需要认证访问
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimiterFilter, UsernamePasswordAuthenticationFilter.class) // 添加速率限制过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 允许的来源，根据实际部署环境配置
        configuration.addAllowedOriginPattern("http://localhost:5174");
        configuration.addAllowedOriginPattern("http://127.0.0.1:5174");
        configuration.addAllowedOriginPattern("https://*.example.com"); // 替换为实际的生产域名
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}