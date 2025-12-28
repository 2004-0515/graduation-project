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
    
    // 根据审核状态查询商品
    @EntityGraph(attributePaths = {"category"})
    List<Product> findByAuditStatus(Integer auditStatus);
    
    // 根据卖家ID查询商品
    @EntityGraph(attributePaths = {"category"})
    List<Product> findBySellerId(Long sellerId);
    
    // 根据卖家ID和审核状态查询商品
    @EntityGraph(attributePaths = {"category"})
    List<Product> findBySellerIdAndAuditStatus(Long sellerId, Integer auditStatus);
    
    // 查询已审核通过且上架的商品（前台展示用）
    @EntityGraph(attributePaths = {"category"})
    List<Product> findByAuditStatusAndStatus(Integer auditStatus, Integer status);
    
    // 根据分类查询已审核通过且上架的商品
    @EntityGraph(attributePaths = {"category"})
    List<Product> findByCategory_IdAndAuditStatusAndStatus(Long categoryId, Integer auditStatus, Integer status);
    
    // 统计待审核商品数量
    long countByAuditStatus(Integer auditStatus);
}