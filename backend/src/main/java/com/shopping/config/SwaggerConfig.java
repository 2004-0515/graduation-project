package com.shopping.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger 配置类，用于配置 API 文档
 */
@Configuration
public class SwaggerConfig {

    /**
     * 配置 OpenAPI 文档
     * @return OpenAPI 对象
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                // 设置服务器信息
                .servers(
                        List.of(
                                new Server().url("http://localhost:8080").description("开发环境")
                        )
                )
                // 添加安全要求
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                // 配置安全方案
                .components(
                        new io.swagger.v3.oas.models.Components()
                                .addSecuritySchemes("bearerAuth",
                                        new SecurityScheme()
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                                .in(SecurityScheme.In.HEADER)
                                                .name("Authorization")
                                )
                )
                // 设置 API 文档基本信息
                .info(
                        new Info()
                                .title("购物商城 API")
                                .description("购物商城系统的 RESTful API 文档，包括用户管理、商品管理、订单管理、购物车管理等功能")
                                .version("1.0.0")
                                .contact(
                                        new Contact()
                                                .name("开发团队")
                                                .email("dev@example.com")
                                                .url("http://example.com")
                                )
                                .license(
                                        new License()
                                                .name("Apache 2.0")
                                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")
                                )
                );
    }
}
