package com.shopping.service;

import com.shopping.entity.Category;
import com.shopping.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 商品分类服务类，处理商品分类相关业务逻辑
 */
@Service
public class CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    /**
     * 获取所有商品分类
     * @return 商品分类列表
     */
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
    
    /**
     * 根据ID获取商品分类
     * @param id 分类ID
     * @return 商品分类信息
     */
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id).orElse(null);
    }
    
    /**
     * 根据父分类ID获取子分类
     * @param parentId 父分类ID
     * @return 子分类列表
     */
    public List<Category> getCategoriesByParentId(Long parentId) {
        return categoryRepository.findByParentId(parentId);
    }
    
    /**
     * 保存商品分类
     * @param category 商品分类信息
     * @return 保存后的商品分类信息
     */
    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }
    
    /**
     * 删除商品分类
     * @param id 分类ID
     */
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
    
    /**
     * 根据状态获取商品分类
     * @param status 状态
     * @return 商品分类列表
     */
    public List<Category> getCategoriesByStatus(Integer status) {
        return categoryRepository.findByStatus(status);
    }
}