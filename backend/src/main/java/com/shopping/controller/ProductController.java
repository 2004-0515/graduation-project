package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Product;
import com.shopping.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 商品控制器，处理商品相关API请求
 */
@RestController
@RequestMapping("/products")
public class ProductController {
    
    @Autowired
    private ProductService productService;
    
    /**
     * 获取商品列表，支持分页
     * @param pageNo 页码（从0开始）
     * @param pageSize 每页记录数
     * @return 分页商品列表
     */
    @GetMapping
    public Response<Page<Product>> getProducts(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize) {
        Page<Product> products = productService.getProducts(pageNo, pageSize);
        return Response.success(products);
    }
    
    /**
     * 根据ID获取商品
     * @param id 商品ID
     * @return 商品信息
     */
    @GetMapping("/{id}")
    public Response<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        if (product != null) {
            return Response.success(product);
        } else {
            return Response.fail(404, "商品不存在");
        }
    }
    
    /**
     * 根据分类ID获取商品列表
     * @param categoryId 分类ID
     * @return 商品列表
     */
    @GetMapping("/category/{categoryId}")
    public Response<List<Product>> getProductsByCategoryId(@PathVariable Long categoryId) {
        List<Product> products = productService.getProductsByCategoryId(categoryId);
        return Response.success(products);
    }
    
    /**
     * 根据状态获取商品列表
     * @param status 商品状态
     * @return 商品列表
     */
    @GetMapping("/status/{status}")
    public Response<List<Product>> getProductsByStatus(@PathVariable Integer status) {
        List<Product> products = productService.getProductsByStatus(status);
        return Response.success(products);
    }
    
    /**
     * 根据名称搜索商品
     * @param name 商品名称
     * @return 商品列表
     */
    @GetMapping("/search")
    public Response<List<Product>> searchProductsByName(@RequestParam String name) {
        List<Product> products = productService.searchProductsByName(name);
        return Response.success(products);
    }
    
    /**
     * 创建商品
     * @param product 商品信息
     * @return 创建后的商品
     */
    @PostMapping
    public Response<Product> createProduct(@RequestBody Product product) {
        Product createdProduct = productService.saveProduct(product);
        return Response.success("商品创建成功", createdProduct);
    }
    
    /**
     * 更新商品
     * @param id 商品ID
     * @param product 商品信息
     * @return 更新后的商品
     */
    @PutMapping("/{id}")
    public Response<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        product.setId(id);
        Product updatedProduct = productService.saveProduct(product);
        return Response.success("商品更新成功", updatedProduct);
    }
    
    /**
     * 删除商品
     * @param id 商品ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return Response.success("商品删除成功");
    }
}