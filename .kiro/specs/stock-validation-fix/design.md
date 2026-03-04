# Design Document

## Overview

This design addresses the stock validation issues in the ProductDetailView component. The solution involves adding proper stock checks before actions, improving error handling to display backend error messages, and constraining the quantity selector based on available stock.

## Architecture

The fix will be implemented entirely in the frontend ProductDetailView.vue component. No backend changes are required as the backend already correctly validates stock and returns appropriate error messages.

### Component Structure

```
ProductDetailView.vue
├── Stock Validation Logic
│   ├── validateStock() - Check if requested quantity is available
│   └── handleStockError() - Display appropriate error messages
├── Action Handlers
│   ├── addToCart() - Enhanced with stock validation
│   └── buyNow() - Enhanced with stock validation
└── Quantity Selector
    ├── max attribute bound to product.stock
    └── watch for manual input validation
```

## Components and Interfaces

### Enhanced Action Handlers

#### addToCart Function
```typescript
const addToCart = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  // Validate stock before attempting to add
  if (quantity.value > product.value.stock) {
    ElMessage.warning(`库存不足，当前库存仅剩 ${product.value.stock} 件`)
    return
  }
  
  if (product.value.stock === 0) {
    ElMessage.warning('商品已售罄')
    return
  }
  
  try {
    await cartStore.addToCart(userId.value, product.value.id, quantity.value)
  } catch (error: any) {
    // Extract error message from backend response
    const errorMsg = error?.response?.data?.message || error?.message || '加入购物车失败'
    ElMessage.error(errorMsg)
  }
}
```

#### buyNow Function
```typescript
const buyNow = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  // Validate stock before navigating to checkout
  if (quantity.value > product.value.stock) {
    ElMessage.warning(`库存不足，当前库存仅剩 ${product.value.stock} 件`)
    return
  }
  
  if (product.value.stock === 0) {
    ElMessage.warning('商品已售罄')
    return
  }
  
  router.push(`/checkout?productId=${product.value.id}&quantity=${quantity.value}`)
}
```

### Quantity Selector Enhancements

#### Template Changes
```vue
<input 
  type="number" 
  v-model.number="quantity" 
  min="1" 
  :max="product.stock"
  :disabled="product.stock === 0"
  @blur="validateQuantityInput"
/>
```

#### Validation Function
```typescript
const validateQuantityInput = () => {
  if (quantity.value > product.value.stock) {
    quantity.value = product.value.stock
    ElMessage.warning(`数量已调整为最大库存 ${product.value.stock} 件`)
  }
  if (quantity.value < 1) {
    quantity.value = 1
  }
}
```

### Button State Management

#### Computed Properties
```typescript
const canAddToCart = computed(() => {
  return product.value.stock > 0 && userStore.isLoggedIn
})

const canBuyNow = computed(() => {
  return product.value.stock > 0 && userStore.isLoggedIn
})
```

#### Template Changes
```vue
<button 
  class="btn btn-glass" 
  @click="addToCart"
  :disabled="!canAddToCart"
>
  加入购物车
</button>
<button 
  class="btn btn-primary" 
  @click="buyNow"
  :disabled="!canBuyNow"
>
  立即购买
</button>
```

## Data Models

No changes to data models are required. The component already has access to:
- `product.stock` - Current available stock
- `quantity` - User-selected quantity

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Stock Validation Before Cart Addition
*For any* product and quantity selection, when the user clicks "加入购物车", if quantity exceeds stock, the system should display an error message and NOT call the cart API.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Stock Validation Before Checkout
*For any* product and quantity selection, when the user clicks "立即购买", if quantity exceeds stock, the system should display an error message and NOT navigate to the checkout page.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Quantity Selector Maximum Constraint
*For any* product with stock value S, the quantity selector's maximum value should be S, and any manual input exceeding S should be reset to S.

**Validates: Requirements 3.1, 3.2**

### Property 4: Zero Stock Disables Actions
*For any* product with stock = 0, both the quantity selector and action buttons should be disabled.

**Validates: Requirements 3.3, 3.4**

### Property 5: Error Message Extraction
*For any* backend error response containing a message field, the system should extract and display that specific message to the user.

**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

### Error Types

1. **Stock Insufficient Error**
   - Trigger: quantity > stock
   - Display: "库存不足，当前库存仅剩 X 件"
   - Action: Stay on page, do not proceed

2. **Out of Stock Error**
   - Trigger: stock === 0
   - Display: "商品已售罄"
   - Action: Disable all purchase actions

3. **Backend API Error**
   - Trigger: API call fails
   - Display: Extract message from error.response.data.message
   - Fallback: Generic error message

### Error Display Strategy

- Use `ElMessage.warning()` for validation errors (user-correctable)
- Use `ElMessage.error()` for system errors (API failures)
- Always keep user on the product detail page when validation fails
- Provide specific, actionable error messages

## Testing Strategy

### Unit Tests

1. **Stock Validation Tests**
   - Test addToCart with quantity > stock
   - Test buyNow with quantity > stock
   - Test with stock = 0
   - Test with valid quantity

2. **Quantity Input Tests**
   - Test manual input exceeding stock
   - Test manual input below 1
   - Test input with stock = 0

3. **Error Message Tests**
   - Test error message extraction from backend response
   - Test fallback error messages
   - Test different error types (warning vs error)

### Integration Tests

1. **User Flow Tests**
   - Complete flow: select quantity → validate → add to cart
   - Complete flow: select quantity → validate → buy now
   - Error recovery: see error → adjust quantity → retry

### Manual Testing Checklist

- [ ] Try to add more than available stock to cart
- [ ] Try to buy more than available stock
- [ ] Try actions with stock = 0
- [ ] Manually enter quantity exceeding stock
- [ ] Verify error messages are clear and specific
- [ ] Verify buttons are disabled when stock = 0

## Implementation Notes

### Key Changes

1. Add stock validation before API calls in both `addToCart()` and `buyNow()`
2. Improve error handling to extract backend error messages
3. Add `:max` binding and `:disabled` binding to quantity input
4. Add `validateQuantityInput()` function for manual input validation
5. Add computed properties for button disabled states
6. Update button templates with `:disabled` bindings

### No Breaking Changes

This fix only adds validation logic and improves error handling. It does not change:
- API contracts
- Data structures
- Component props or events
- Routing behavior (except preventing invalid navigation)

### Performance Considerations

- All validations are synchronous and lightweight
- No additional API calls are introduced
- Error handling adds minimal overhead
