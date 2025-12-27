package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Category;
import com.shopping.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 商品分类控制器，处理商品分类相关API请求
 */
@RestController
@RequestMapping("/categories")
public class CategoryController {
    
    @Autowired
    private CategoryService categoryService;
    
    /**
     * 获取所有商品分类
     * @return 商品分类列表
     */
    @GetMapping
    public Response<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return Response.success(categories);
    }
    
    /**
     * 根据ID获取商品分类
     * @param id 分类ID
     * @return 商品分类信息
     */
    @GetMapping("/{id}")
    public Response<Category> getCategoryById(@PathVariable Long id) {
        Category category = categoryService.getCategoryById(id);
        if (category != null) {
            return Response.success(category);
        } else {
            return Response.fail(404, "分类不存在");
        }
    }
    
    /**
     * 根据父分类ID获取子分类
     * @param parentId 父分类ID
     * @return 子分类列表
     */
    @GetMapping("/parent/{parentId}")
    public Response<List<Category>> getCategoriesByParentId(@PathVariable Long parentId) {
        List<Category> categories = categoryService.getCategoriesByParentId(parentId);
        return Response.success(categories);
    }
    
    /**
     * 创建商品分类
     * @param category 商品分类信息
     * @return 创建后的商品分类
     */
    @PostMapping
    public Response<Category> createCategory(@RequestBody Category category) {
        Category createdCategory = categoryService.saveCategory(category);
        return Response.success("分类创建成功", createdCategory);
    }
    
    /**
     * 更新商品分类
     * @param id 分类ID
     * @param category 商品分类信息
     * @return 更新后的商品分类
     */
    @PutMapping("/{id}")
    public Response<Category> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        category.setId(id);
        Category updatedCategory = categoryService.saveCategory(category);
        return Response.success("分类更新成功", updatedCategory);
    }
    
    /**
     * 删除商品分类
     * @param id 分类ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return Response.success("分类删除成功");
    }
}