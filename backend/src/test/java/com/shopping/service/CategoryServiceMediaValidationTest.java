package com.shopping.service;

import com.shopping.entity.Category;
import com.shopping.exception.ValidationException;
import com.shopping.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceMediaValidationTest {

    @Mock
    private CategoryRepository categoryRepository;
    @Spy
    private MediaGovernanceService mediaGovernanceService = new MediaGovernanceService();

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void saveCategory_shouldPersistNormalizedCategoryIcon() {
        Category category = buildCategory();
        category.setIcon("/uploads/categories/2026/05/icon.jpg");

        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Category saved = categoryService.saveCategory(category);

        assertEquals("/uploads/categories/2026/05/icon.jpg", saved.getIcon());
    }

    @Test
    void saveCategory_shouldNormalizeBlankIconToNull() {
        Category category = buildCategory();
        category.setIcon("   ");

        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Category saved = categoryService.saveCategory(category);

        assertNull(saved.getIcon());
    }

    @Test
    void saveCategory_shouldRejectNonCategoryIconPath() {
        Category category = buildCategory();
        category.setIcon("/uploads/products/潮流穿搭/2026/05/icon.jpg");

        ValidationException error = assertThrows(ValidationException.class, () -> categoryService.saveCategory(category));

        assertEquals("Validation failed for field 'icon': 分类图片路径必须位于 /uploads/categories 下", error.getMessage());
    }

    private Category buildCategory() {
        Category category = new Category();
        category.setName("分类A");
        category.setSortOrder(1);
        category.setStatus(1);
        category.setParentId(0L);
        return category;
    }
}
