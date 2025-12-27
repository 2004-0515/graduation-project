package com.shopping.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.shopping.repository")
@EnableRedisRepositories(basePackages = "com.shopping.repository")
public class AppConfig {
}