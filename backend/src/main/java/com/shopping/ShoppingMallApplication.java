package com.shopping;

import com.shopping.config.AvailablePortInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class ShoppingMallApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(ShoppingMallApplication.class);
        application.addInitializers(new AvailablePortInitializer());
        application.run(args);
    }
}
