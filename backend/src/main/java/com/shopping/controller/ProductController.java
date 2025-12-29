package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Product;
import com.shopping.entity.Category;
import com.shopping.entity.User;
import com.shopping.service.ProductService;
import com.shopping.service.UserService;
import com.shopping.repository.CategoryRepository;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 商品控制器，处理商品相关API请求
 */
@RestController
@RequestMapping("/products")
public class ProductController {
    
    @Autowired
    private ProductService productService;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private UserService userService;
    
    /**
     * 获取商品列表，支持分页和筛选
     * @param pageNo 页码（从0开始）
     * @param pageSize 每页记录数
     * @param categoryId 分类ID（可选）
     * @param keyword 关键词（可选）
     * @param minPrice 最低价格（可选）
     * @param maxPrice 最高价格（可选）
     * @param sort 排序方式（可选）
     * @param status 商品状态筛选（管理后台用）
     * @param admin 是否管理后台请求（可选）
     * @param lowStock 库存预警阈值（可选）
     * @return 分页商品列表
     */
    @GetMapping
    public Response<Map<String, Object>> getProducts(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "12") int pageSize,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Boolean admin,
            @RequestParam(required = false) Integer lowStock) {
        
        List<Product> allProducts;
        
        // 管理后台请求返回所有商品，前台只返回已审核通过且上架的商品
        String username = null;
        try {
            username = SecurityUtils.getCurrentUsername();
        } catch (Exception e) {
            // 未登录用户
        }
        boolean isAdmin = "admin".equals(username) && Boolean.TRUE.equals(admin);
        
        if (isAdmin) {
            // 管理后台：获取所有商品
            Page<Product> page = productService.getProducts(0, 10000);
            allProducts = new java.util.ArrayList<>(page.getContent());
            
            // 状态筛选
            if (status != null) {
                allProducts = allProducts.stream()
                    .filter(p -> status.equals(p.getStatus()))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            // 库存预警筛选
            if (lowStock != null && lowStock > 0) {
                allProducts = allProducts.stream()
                    .filter(p -> p.getStock() != null && p.getStock() < lowStock)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else {
            // 前台：只获取已审核通过且上架的商品
            allProducts = productService.getApprovedProducts();
        }
        
        // 分类筛选
        if (categoryId != null) {
            allProducts = allProducts.stream()
                .filter(p -> p.getCategory() != null && categoryId.equals(p.getCategory().getId()))
                .collect(java.util.stream.Collectors.toList());
        }
        
        // 关键词搜索
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.toLowerCase();
            allProducts = allProducts.stream()
                .filter(p -> p.getName().toLowerCase().contains(kw) || 
                            (p.getDescription() != null && p.getDescription().toLowerCase().contains(kw)))
                .collect(java.util.stream.Collectors.toList());
        }
        
        // 价格筛选
        if (minPrice != null) {
            allProducts = allProducts.stream()
                .filter(p -> p.getPrice().doubleValue() >= minPrice)
                .collect(java.util.stream.Collectors.toList());
        }
        if (maxPrice != null) {
            allProducts = allProducts.stream()
                .filter(p -> p.getPrice().doubleValue() <= maxPrice)
                .collect(java.util.stream.Collectors.toList());
        }
        
        // 排序
        if ("sales".equals(sort)) {
            allProducts.sort((a, b) -> (b.getSales() != null ? b.getSales() : 0) - (a.getSales() != null ? a.getSales() : 0));
        } else if ("price".equals(sort)) {
            allProducts.sort((a, b) -> a.getPrice().compareTo(b.getPrice()));
        } else if ("price_desc".equals(sort)) {
            allProducts.sort((a, b) -> b.getPrice().compareTo(a.getPrice()));
        } else if ("newest".equals(sort) || "new".equals(sort)) {
            // 按创建时间倒序（最新的在前）
            allProducts.sort((a, b) -> {
                if (b.getCreatedTime() == null && a.getCreatedTime() == null) return 0;
                if (b.getCreatedTime() == null) return -1;
                if (a.getCreatedTime() == null) return 1;
                return b.getCreatedTime().compareTo(a.getCreatedTime());
            });
        } else {
            // 默认按ID倒序（最新添加的在前）
            allProducts.sort((a, b) -> b.getId().compareTo(a.getId()));
        }
        
        // 分页
        int total = allProducts.size();
        int start = pageNo * pageSize;
        int end = Math.min(start + pageSize, total);
        List<Product> pageContent = start < total ? allProducts.subList(start, end) : List.of();
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("content", pageContent);
        result.put("totalElements", total);
        result.put("totalPages", (int) Math.ceil((double) total / pageSize));
        result.put("number", pageNo);
        result.put("size", pageSize);
        
        return Response.success(result);
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
    public Response<Product> createProduct(@RequestBody Map<String, Object> data) {
        String username = null;
        try {
            username = SecurityUtils.getCurrentUsername();
        } catch (Exception e) {
            return Response.fail(401, "用户未登录");
        }
        
        System.out.println("Creating product, user: " + username + ", data: " + data);
        
        Product product = new Product();
        product.setName((String) data.get("name"));
        product.setDescription((String) data.get("description"));
        
        if (data.get("price") != null) {
            product.setPrice(new java.math.BigDecimal(data.get("price").toString()));
        }
        if (data.get("originalPrice") != null) {
            product.setOriginalPrice(new java.math.BigDecimal(data.get("originalPrice").toString()));
        }
        if (data.get("stock") != null) {
            product.setStock(Integer.parseInt(data.get("stock").toString()));
        }
        product.setMainImage((String) data.get("mainImage"));
        product.setImages((String) data.get("images"));
        product.setSales(0); // 新商品销量为0
        
        // 设置状态
        if (data.get("status") != null) {
            product.setStatus(Integer.parseInt(data.get("status").toString()));
        } else {
            product.setStatus(1); // 默认上架
        }
        
        // 设置分类
        if (data.get("categoryId") != null) {
            Long categoryId = Long.parseLong(data.get("categoryId").toString());
            Category category = categoryRepository.findById(categoryId).orElse(null);
            product.setCategory(category);
        }
        
        // 管理员创建的商品自动通过审核
        if ("admin".equals(username)) {
            product.setAuditStatus(1);
            product.setAuditTime(java.time.LocalDateTime.now());
        } else {
            product.setAuditStatus(0);
        }
        
        Product createdProduct = productService.saveProduct(product);
        System.out.println("Product created with ID: " + createdProduct.getId());
        return Response.success("商品创建成功", createdProduct);
    }
    
    /**
     * 更新商品
     * @param id 商品ID
     * @param data 商品信息
     * @return 更新后的商品
     */
    @PutMapping("/{id}")
    public Response<Product> updateProduct(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Product product = productService.getProductById(id);
        if (product == null) {
            return Response.fail(404, "商品不存在");
        }
        
        if (data.get("name") != null) {
            product.setName((String) data.get("name"));
        }
        if (data.get("description") != null) {
            product.setDescription((String) data.get("description"));
        }
        if (data.get("price") != null) {
            product.setPrice(new java.math.BigDecimal(data.get("price").toString()));
        }
        if (data.get("originalPrice") != null) {
            product.setOriginalPrice(new java.math.BigDecimal(data.get("originalPrice").toString()));
        }
        if (data.get("stock") != null) {
            product.setStock(Integer.parseInt(data.get("stock").toString()));
        }
        if (data.get("mainImage") != null) {
            product.setMainImage((String) data.get("mainImage"));
        }
        if (data.get("images") != null) {
            product.setImages((String) data.get("images"));
        }
        if (data.get("status") != null) {
            product.setStatus(Integer.parseInt(data.get("status").toString()));
        }
        if (data.get("categoryId") != null) {
            Long categoryId = Long.parseLong(data.get("categoryId").toString());
            Category category = categoryRepository.findById(categoryId).orElse(null);
            product.setCategory(category);
        }
        
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
    
    // ========== 用户商品上传相关接口 ==========
    
    /**
     * 用户提交商品（需要审核）
     */
    @PostMapping("/submit")
    public Response<Product> submitProduct(@RequestBody Map<String, Object> data) {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        if (user == null) {
            return Response.fail(401, "用户未登录");
        }
        
        Product product = new Product();
        product.setName((String) data.get("name"));
        product.setDescription((String) data.get("description"));
        product.setPrice(new java.math.BigDecimal(data.get("price").toString()));
        if (data.get("originalPrice") != null) {
            product.setOriginalPrice(new java.math.BigDecimal(data.get("originalPrice").toString()));
        }
        product.setStock(Integer.parseInt(data.get("stock").toString()));
        product.setMainImage((String) data.get("mainImage"));
        product.setImages((String) data.get("images"));
        product.setSellerId(user.getId());
        product.setSellerName(username);
        product.setSales(0);
        product.setStatus(1); // 默认上架
        
        // 设置分类
        Long categoryId = Long.parseLong(data.get("categoryId").toString());
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new com.shopping.exception.ResourceNotFoundException("分类", categoryId));
        product.setCategory(category);
        
        // 管理员直接通过，普通用户需要审核
        if ("admin".equals(username)) {
            product.setAuditStatus(1); // 已通过
            product.setAuditTime(java.time.LocalDateTime.now());
        } else {
            product.setAuditStatus(0); // 待审核
        }
        
        Product saved = productService.saveProduct(product);
        return Response.success("admin".equals(username) ? "商品发布成功" : "商品提交成功，等待管理员审核", saved);
    }
    
    /**
     * 获取当前用户的商品列表
     */
    @GetMapping("/my")
    public Response<List<Product>> getMyProducts() {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        if (user == null) {
            return Response.fail(401, "用户未登录");
        }
        List<Product> products = productService.getProductsBySellerId(user.getId());
        return Response.success(products);
    }
    
    /**
     * 获取待审核商品列表（管理员）
     */
    @GetMapping("/pending")
    public Response<List<Product>> getPendingProducts() {
        List<Product> products = productService.getPendingProducts();
        return Response.success(products);
    }
    
    /**
     * 获取待审核商品数量
     */
    @GetMapping("/pending/count")
    public Response<Long> getPendingCount() {
        long count = productService.countPendingProducts();
        return Response.success(count);
    }
    
    /**
     * 审核商品（管理员）
     */
    @PostMapping("/{id}/audit")
    public Response<Product> auditProduct(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Integer auditStatus = Integer.parseInt(data.get("auditStatus").toString());
        String remark = (String) data.getOrDefault("remark", "");
        
        Product product = productService.auditProduct(id, auditStatus, remark);
        String msg = auditStatus == 1 ? "商品审核通过" : "商品审核已拒绝";
        return Response.success(msg, product);
    }
    
    /**
     * 批量更新所有商品状态（管理员）
     */
    @PutMapping("/batch-status")
    public Response<Void> batchUpdateAllStatus(@RequestBody Map<String, Object> data) {
        Integer status = Integer.parseInt(data.get("status").toString());
        productService.updateAllProductsStatus(status);
        String msg = status == 1 ? "全部商品已上架" : "全部商品已下架";
        return Response.success(msg);
    }
}