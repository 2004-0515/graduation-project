package com.shopping.repository;

import com.shopping.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 商品分类数据访问接口
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    // 根据父分类ID查询子分类
    List<Category> findByParentId(Long parentId);
    
    // 根据状态查询分类
    List<Category> findByStatus(Integer status);
}