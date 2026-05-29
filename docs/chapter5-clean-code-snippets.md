# 第5章每图两段代码

复制到 Word 时建议使用 `Consolas` 字体，字号 9.5-10.5。以下每个模块只保留两个核心代码片段。

## 5.1 系统总体功能说明

```java
// 配置接口访问权限和JWT认证过滤器
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authorize -> authorize
                    .requestMatchers("/auth/login", "/auth/register").permitAll()
                    .requestMatchers("/categories/**", "/products/**").permitAll()
                    .requestMatchers("/cart/**", "/orders/**").authenticated()
                    .requestMatchers("/admin/**").authenticated()
                    .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
```

```ts
// 根据路由元信息判断用户是否需要登录或具备管理员权限
router.beforeEach(async (to, _from, next) => {
    const userStore = useUserStore();

    if (!to.meta.requiresAuth) {
        next();
        return;
    }

    if (!userStore.token) {
        next({ name: "login", query: { redirect: to.fullPath } });
        return;
    }

    if (!userStore.userInfo || !userStore.userInfo.role) {
        await userStore.fetchCurrentUser();
    }

    if (to.meta.requiresAdmin && !isAdminUser(userStore.userInfo)) {
        next({ name: "home" });
        return;
    }

    next();
});
```

## 5.2.1 首页模块

```java
// 获取首页轮播图内容
@GetMapping("/content/banners")
public Response<List<ShowcaseBanner>> getPublicBanners(@RequestParam String placement) {
    List<ShowcaseBanner> banners = showcaseBannerService.getPublicBanners(placement);
    return Response.success(banners);
}
```

```java
// 获取首页商品分页列表
@GetMapping
public Response<Map<String, Object>> getProducts(
        @RequestParam(defaultValue = "0") int pageNo,
        @RequestParam(defaultValue = "12") int pageSize,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) String keyword) {

    // 首页只查询面向用户公开展示的商品
    Page<Product> page = productService.searchProducts(
            false,
            Math.max(pageNo, 0),
            Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE),
            categoryId,
            keyword,
            null,
            null,
            null,
            null,
            null
    );

    Map<String, Object> result = new HashMap<>();
    result.put("content", page.getContent());
    result.put("totalElements", page.getTotalElements());
    result.put("totalPages", page.getTotalPages());

    return Response.success(result);
}
```

## 5.2.2 商品详情与价格提醒模块

```java
// 根据商品ID获取商品详情
@GetMapping("/{id}")
public Response<Product> getProductById(@PathVariable Long id) {
    Product product = productService.getProductById(id);

    // 商品不存在时返回错误信息
    if (product == null) {
        return Response.fail(404, "商品不存在");
    }

    return Response.success(product);
}
```

```java
// 设置商品降价提醒
@PostMapping("/alert")
public Response<PriceAlert> createAlert(@RequestBody Map<String, Object> params) {
    Optional<Long> userId = getCurrentUserId();

    // 未登录用户不能设置提醒
    if (userId.isEmpty()) {
        return unauthorized();
    }

    Long productId = parseRequiredLong(params, "productId");
    BigDecimal targetPrice = parseRequiredBigDecimal(params, "targetPrice");
    PriceAlert alert = priceAlertService.createAlert(userId.get(), productId, targetPrice);

    return Response.success("降价提醒设置成功", alert);
}
```

```java
// 获取商品价格统计信息
@GetMapping("/stats/{productId}")
public Response<Map<String, Object>> getPriceStats(@PathVariable Long productId) {
    // 返回最低价、最高价和平均价格等统计数据
    Map<String, Object> stats = priceHistoryService.getPriceStats(productId);
    return Response.success(stats);
}
```

## 5.2.3 购物车管理模块

```java
// 获取当前用户的购物车列表
@GetMapping
public Response<List<CartDto>> getCurrentUserCart() {
    String username = SecurityUtils.getCurrentUsername();
    List<CartDto> cartItems = cartService.getUserCartDto(username);
    return Response.success("获取购物车成功", cartItems);
}
```

```java
// 修改购物车中商品的数量或选中状态
@PutMapping("/{id}")
public Response<CartDto> updateCartItem(
        @PathVariable Long id,
        @RequestBody @Valid UpdateCartRequest request) {

    String username = SecurityUtils.getCurrentUsername();
    Optional<CartDto> updatedItem = cartService.updateCartItem(username, id, request);

    // 商品失效或数量为0时返回空结果
    if (updatedItem.isEmpty()) {
        return Response.success("购物车商品已删除", null);
    }

    return Response.success("购物车更新成功", updatedItem.get());
}
```

## 5.2.4 后台商品管理模块

```java
// 管理员获取待审核商品列表
@GetMapping("/pending")
public Response<List<Product>> getPendingProducts() {
    AdminUtils.requireAdmin();
    List<Product> products = productService.getPendingProducts();
    return Response.success(products);
}
```

```java
// 管理员审核商品
@PostMapping("/{id}/audit")
public Response<Product> auditProduct(
        @PathVariable Long id,
        @RequestBody Map<String, Object> data) {

    AdminUtils.requireAdmin();

    Integer auditStatus = Integer.parseInt(data.get("auditStatus").toString());
    String remark = (String) data.getOrDefault("remark", "");
    Product product = productService.auditProduct(id, auditStatus, remark);

    // 根据审核结果返回对应提示
    String message = auditStatus == 1 ? "商品审核通过" : "商品审核已拒绝";
    return Response.success(message, product);
}
```

## 5.2.5 理性消费助手模块

```java
// 设置用户月度消费预算
@PostMapping("/budget")
public Response<?> setBudget(@RequestBody Map<String, Object> params) {
    String username = currentUsernameOrNull();
    if (username == null) {
        return unauthorized();
    }

    // 读取预算金额和提醒阈值
    BigDecimal amount = new BigDecimal(params.get("amount").toString());
    Integer alertThreshold = params.get("alertThreshold") == null
            ? null
            : Integer.parseInt(params.get("alertThreshold").toString());

    // 预算金额必须大于0
    if (amount.compareTo(BigDecimal.ZERO) <= 0) {
        return Response.fail(422, "预算金额必须大于0");
    }

    // 保存当前用户的月度预算设置
    ConsumptionBudget budget = rationalConsumptionService.setBudget(
            username,
            amount,
            alertThreshold
    );
    return Response.success(budget);
}
```

```java
// 将商品加入想要清单，并设置冷静期
@PostMapping("/wishlist")
public Response<?> addToWishlist(@RequestBody Map<String, Object> params) {
    String username = currentUsernameOrNull();
    if (username == null) {
        return unauthorized();
    }

    // 获取商品ID、冷静期天数和加入原因
    Long productId = Long.parseLong(params.get("productId").toString());
    Integer coolingDays = params.get("coolingDays") == null
            ? 3
            : Integer.parseInt(params.get("coolingDays").toString());
    String reason = params.get("reason") == null ? null : params.get("reason").toString();

    // 生成想要清单记录
    rationalConsumptionService.addToWishlist(username, productId, coolingDays, reason);
    return Response.success("已添加到想要清单");
}
```

```java
// 获取想要清单统计
@GetMapping("/wishlist/stats")
public Response<?> getWishlistStats() {
    String username = currentUsernameOrNull();
    if (username == null) {
        return unauthorized();
    }

    Map<String, Object> stats = rationalConsumptionService.getWishlistStats(username);
    return Response.success(stats);
}
```
