package com.shopping.service;

import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.exception.ValidationException;
import com.shopping.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceMediaValidationTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private PriceHistoryService priceHistoryService;
    @Mock
    private PriceAlertService priceAlertService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private MediaGovernanceService mediaGovernanceService;

    @InjectMocks
    private ProductService productService;

    @Test
    void saveProduct_shouldPersistNormalizedImagesPayload() {
        Product product = buildProduct();
        product.setMainImage("/uploads/products/运动户外/2026/05/a.jpg");
        product.setImages("[\"/uploads/products/运动户外/2026/05/b.jpg\"]");

        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doAnswer(invocation -> {
            Product target = invocation.getArgument(0);
            target.setImages("[\"/uploads/products/运动户外/2026/05/a.jpg\",\"/uploads/products/运动户外/2026/05/b.jpg\"]");
            return null;
        }).when(mediaGovernanceService).normalizeProductMedia(any(Product.class));

        Product saved = productService.saveProduct(product);

        assertEquals(product.getMainImage(), saved.getMainImage());
        assertEquals("[\"/uploads/products/运动户外/2026/05/a.jpg\",\"/uploads/products/运动户外/2026/05/b.jpg\"]", saved.getImages());
    }

    @Test
    void saveProduct_shouldRejectMissingCategory() {
        Product product = buildProduct();
        product.setCategory(null);

        ValidationException error = assertThrows(ValidationException.class, () -> productService.saveProduct(product));
        assertEquals("Validation failed for field 'categoryId': 商品分类不能为空", error.getMessage());
    }

    private Product buildProduct() {
        Product product = new Product();
        product.setName("test");
        product.setPrice(new BigDecimal("12.00"));
        product.setStock(3);
        product.setSales(0);
        Category category = new Category();
        category.setId(1L);
        category.setName("运动户外");
        product.setCategory(category);
        return product;
    }
}
