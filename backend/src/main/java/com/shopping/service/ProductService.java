package com.shopping.service;

import com.shopping.entity.Product;
import com.shopping.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
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
     * 获取商品列表，支持分页
     * @param pageNo 页码（从0开始）
     * @param pageSize 每页记录数
     * @return 分页商品列表
     */
    public Page<Product> getProducts(int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return productRepository.findAll(pageable);
    }
    
    /**
     * 根据ID获取商品
     * @param id 商品ID
     * @return 商品信息
     */
    @Cacheable(value = "products", key = "#id")
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }
    
    /**
     * 根据分类ID获取商品列表
     * @param categoryId 分类ID
     * @return 商品列表
     */
    @Cacheable(value = "products", key = "#categoryId + '_category'")
    public List<Product> getProductsByCategoryId(Long categoryId) {
        return productRepository.findByCategory_Id(categoryId);
    }
    
    /**
     * 根据状态获取商品列表
     * @param status 商品状态
     * @return 商品列表
     */
    @Cacheable(value = "products", key = "#status + '_status'")
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
    @CachePut(value = "products", key = "#product.id")
    @CacheEvict(value = "products", allEntries = true)
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
    
    /**
     * 删除商品
     * @param id 商品ID
     */
    @CacheEvict(value = "products", key = "#id", allEntries = true)
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
    
    /**
     * 更新商品库存
     * @param productId 商品ID
     * @param quantity 要更新的数量（正数增加，负数减少）
     * @return 是否更新成功
     */
    @CacheEvict(value = "products", key = "#productId", allEntries = true)
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
    @CacheEvict(value = "products", key = "#productId", allEntries = true)
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
    @CacheEvict(value = "products", key = "#productId", allEntries = true)
    public void increaseStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId).orElseThrow(
            () -> new com.shopping.exception.ResourceNotFoundException("商品", productId));

        product.setStock(product.getStock() + quantity);
        productRepository.save(product);
    }
}