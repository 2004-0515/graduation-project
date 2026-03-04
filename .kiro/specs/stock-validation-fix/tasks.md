# Implementation Plan: Stock Validation Fix

## Overview

Fix stock validation issues in ProductDetailView by adding proper validation before actions, improving error handling, and constraining the quantity selector.

## Tasks

- [x] 1. Add stock validation to addToCart function
  - Add check for quantity > stock before calling cart API
  - Add check for stock === 0
  - Display specific warning messages for each case
  - Improve error handling to extract backend error messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Add stock validation to buyNow function
  - Add check for quantity > stock before navigation
  - Add check for stock === 0
  - Display specific warning messages for each case
  - Prevent navigation when validation fails
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Enhance quantity selector with stock constraints
  - Add :max binding to product.stock
  - Add :disabled binding for stock === 0
  - Create validateQuantityInput function
  - Add @blur event handler to validate manual input
  - Reset quantity to max stock if exceeded
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Add computed properties for button states
  - Create canAddToCart computed property
  - Create canBuyNow computed property
  - Add :disabled bindings to both action buttons
  - _Requirements: 3.4_

- [x] 5. Test the implementation
  - Test adding to cart with insufficient stock
  - Test buying with insufficient stock
  - Test with zero stock
  - Test manual quantity input validation
  - Test error message display
  - Verify buttons are disabled when appropriate
  - _Requirements: All_

## Notes

- All changes are in frontend/src/views/ProductDetailView.vue
- No backend changes required
- No breaking changes to existing functionality
- Focus on improving user experience with clear error messages
