package com.shopping.repository;

import com.shopping.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 商品数据访问接口
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // 根据分类ID查询商品，使用EntityGraph避免N+1查询
    @EntityGraph(attributePaths = {"category"})
    List<Product> findByCategory_Id(Long categoryId);
    
    // 根据状态查询商品，使用EntityGraph避免N+1查询
    @EntityGraph(attributePaths = {"category"})
    List<Product> findByStatus(Integer status);
    
    // 根据名称模糊查询商品，使用EntityGraph避免N+1查询
    @EntityGraph(attributePaths = {"category"})
    List<Product> findByNameContaining(String name);
}