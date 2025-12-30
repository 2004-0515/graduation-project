package com.shopping.service;

import com.shopping.entity.Product;
import com.shopping.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 商品服务类，处理商品相关业务逻辑
 */
@Service
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    /**
     * 获取商品列表，支持分页（只返回已审核通过的商品）
     * @param pageNo 页码（从0开始）
     * @param pageSize 每页记录数
     * @return 分页商品列表
     */
    public Page<Product> getProducts(int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return productRepository.findAll(pageable);
    }
    
    /**
     * 获取前台展示的商品（已审核通过且上架）
     */
    public List<Product> getApprovedProducts() {
        return productRepository.findByAuditStatusAndStatus(1, 1);
    }
    
    /**
     * 根据分类获取前台展示的商品
     */
    public List<Product> getApprovedProductsByCategory(Long categoryId) {
        return productRepository.findByCategory_IdAndAuditStatusAndStatus(categoryId, 1, 1);
    }
    
    /**
     * 根据ID获取商品
     * @param id 商品ID
     * @return 商品信息
     */
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }
    
    /**
     * 根据ID获取商品（别名方法）
     */
    public Product findById(Long id) {
        return getProductById(id);
    }
    
    /**
     * 根据分类ID获取商品列表
     * @param categoryId 分类ID
     * @return 商品列表
     */
    public List<Product> getProductsByCategoryId(Long categoryId) {
        return productRepository.findByCategory_Id(categoryId);
    }
    
    /**
     * 根据状态获取商品列表
     * @param status 商品状态
     * @return 商品列表
     */
    public List<Product> getProductsByStatus(Integer status) {
        return productRepository.findByStatus(status);
    }
    
    /**
     * 根据名称搜索商品
     * @param name 商品名称
     * @return 商品列表
     */
    public List<Product> searchProductsByName(String name) {
        return productRepository.findByNameContaining(name);
    }
    
    /**
     * 保存商品
     * @param product 商品信息
     * @return 保存后的商品信息
     */
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
    
    /**
     * 删除商品
     * @param id 商品ID
     */
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
    
    /**
     * 获取卖家的商品列表
     */
    public List<Product> getProductsBySellerId(Long sellerId) {
        return productRepository.findBySellerId(sellerId);
    }
    
    /**
     * 获取待审核的商品列表
     */
    public List<Product> getPendingProducts() {
        return productRepository.findByAuditStatus(0);
    }
    
    /**
     * 统计待审核商品数量
     */
    public long countPendingProducts() {
        return productRepository.countByAuditStatus(0);
    }
    
    /**
     * 审核商品
     * @param productId 商品ID
     * @param auditStatus 审核状态 1=通过 2=拒绝
     * @param remark 审核备注
     */
    public Product auditProduct(Long productId, Integer auditStatus, String remark) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new com.shopping.exception.ResourceNotFoundException("商品", productId));
        product.setAuditStatus(auditStatus);
        product.setAuditRemark(remark);
        product.setAuditTime(java.time.LocalDateTime.now());
        return productRepository.save(product);
    }
    
    /**
     * 更新商品库存
     * @param productId 商品ID
     * @param quantity 要更新的数量（正数增加，负数减少）
     * @return 是否更新成功
     */
    public boolean updateProductStock(Long productId, Integer quantity) {
        Product product = getProductById(productId);
        if (product == null) {
            return false;
        }
        int newStock = product.getStock() + quantity;
        if (newStock < 0) {
            return false;
        }
        product.setStock(newStock);
        productRepository.save(product);
        return true;
    }

    /**
     * 减少商品库存
     * @param productId 商品ID
     * @param quantity 减少的数量
     * @throws com.shopping.exception.ValidationException 如果库存不足
     */
    public void reduceStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId).orElseThrow(
            () -> new com.shopping.exception.ResourceNotFoundException("商品", productId));

        if (product.getStock() < quantity) {
            throw new com.shopping.exception.ValidationException("商品库存不足");
        }

        product.setStock(product.getStock() - quantity);
        productRepository.save(product);
    }

    /**
     * 增加商品库存
     * @param productId 商品ID
     * @param quantity 增加的数量
     */
    public void increaseStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId).orElseThrow(
            () -> new com.shopping.exception.ResourceNotFoundException("商品", productId));

        product.setStock(product.getStock() + quantity);
        productRepository.save(product);
    }
    
    /**
     * 增加商品销量
     * @param productId 商品ID
     * @param quantity 增加的数量
     */
    public void increaseSales(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId).orElseThrow(
            () -> new com.shopping.exception.ResourceNotFoundException("商品", productId));

        int currentSales = product.getSales() != null ? product.getSales() : 0;
        product.setSales(currentSales + quantity);
        productRepository.save(product);
    }
    
    /**
     * 批量更新所有商品状态
     * @param status 状态 1=上架 0=下架
     */
    public void updateAllProductsStatus(Integer status) {
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            product.setStatus(status);
        }
        productRepository.saveAll(products);
    }
}