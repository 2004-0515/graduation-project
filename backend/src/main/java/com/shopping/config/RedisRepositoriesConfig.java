package com.shopping.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;

@Configuration
@ConditionalOnProperty(name = "spring.data.redis.repositories.enabled", havingValue = "true")
@EnableRedisRepositories(basePackages = "com.shopping.repository")
public class RedisRepositoriesConfig {
}
