package com.shopping.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT配置属性类
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    /**
     * JWT密钥
     */
    private String secret;
    
    /**
     * JWT过期时间（毫秒）
     */
    private long expiration;
    
    /**
     * JWT请求头
     */
    private String header;
}