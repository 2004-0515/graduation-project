package com.shopping.config;

import com.shopping.filter.JwtAuthenticationFilter;
import com.shopping.filter.RateLimiterFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Autowired
    private RateLimiterFilter rateLimiterFilter;

    @Value("${spring.web.cors.allowed-origins}")
    private String allowedOrigins;

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
                .requestMatchers(POST, "/contact-messages").permitAll()
                .requestMatchers(GET, "/price/history/**", "/price/stats/**").permitAll()
                // 允许访问上传的文件
                .requestMatchers("/uploads/**").permitAll()
                // 允许匿名查看商品评价
                .requestMatchers(GET, "/reviews/product/**").permitAll()
                // 优惠券公开信息允许匿名查看；领取请求放行到控制器，由控制器统一返回中文登录提示
                .requestMatchers(GET, "/coupons", "/coupons/*").permitAll()
                .requestMatchers(POST, "/coupons/*/claim").permitAll()
                // 搜索相关API - 建议和热词允许匿名访问，历史记录需要登录
                .requestMatchers("/search/suggestions", "/search/hot-keywords", "/search/stats").permitAll()
                .requestMatchers("/search/history/**").authenticated()
                // 音乐播放器 - 允许匿名访问启用的音乐列表
                .requestMatchers("/music/enabled").permitAll()
                // 用户信息API需要认证访问
                .requestMatchers("/auth/me", "/auth/change-password").authenticated()
                // 文件上传需要认证
                .requestMatchers("/files/**").authenticated()
                // 地址相关API需要认证访问
                .requestMatchers("/addresses/**").authenticated()
                // 购物车相关API需要认证访问
                .requestMatchers("/cart/**").authenticated()
                // 其他API需要认证访问
                .anyRequest().authenticated()
            )
            // .addFilterBefore(rateLimiterFilter, UsernamePasswordAuthenticationFilter.class) // 暂时禁用速率限制
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 统一从 Spring 配置读取，避免环境变量和额外 CORS Bean 产生双重语义。
        for (String origin : allowedOrigins.split(",")) {
            String trimmedOrigin = origin.trim();
            if (!trimmedOrigin.isEmpty()) {
                configuration.addAllowedOriginPattern(trimmedOrigin);
            }
        }
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
