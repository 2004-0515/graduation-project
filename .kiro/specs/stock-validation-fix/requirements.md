# Requirements Document

## Introduction

Fix the stock validation behavior in the product detail page. Currently, when a product has insufficient stock, clicking "立即购买" (Buy Now) incorrectly redirects to the cart page, and clicking "加入购物车" (Add to Cart) shows no response or generic error messages.

## Glossary

- **Product_Detail_Page**: The page showing detailed information about a single product
- **Buy_Now_Button**: The button that allows users to immediately purchase a product
- **Add_To_Cart_Button**: The button that adds a product to the shopping cart
- **Stock**: The available quantity of a product
- **Quantity_Selector**: The input control that allows users to select how many items to purchase

## Requirements

### Requirement 1: Stock Validation for Add to Cart

**User Story:** As a user, I want to see a clear error message when I try to add more items than available in stock, so that I understand why the action failed.

#### Acceptance Criteria

1. WHEN a user clicks "加入购物车" with quantity exceeding stock THEN the system SHALL display the specific error message from the backend
2. WHEN the backend returns "商品库存不足" error THEN the system SHALL show this message to the user
3. WHEN stock validation fails THEN the system SHALL NOT add any items to the cart
4. WHEN stock validation fails THEN the system SHALL keep the user on the product detail page

### Requirement 2: Stock Validation for Buy Now

**User Story:** As a user, I want to be prevented from buying more items than available in stock, so that I don't encounter errors during checkout.

#### Acceptance Criteria

1. WHEN a user clicks "立即购买" with quantity exceeding stock THEN the system SHALL display an error message
2. WHEN stock validation fails for buy now THEN the system SHALL NOT navigate to the checkout page
3. WHEN stock validation fails for buy now THEN the system SHALL keep the user on the product detail page
4. WHEN quantity equals or is less than stock THEN the system SHALL proceed to checkout normally

### Requirement 3: Quantity Selector Constraints

**User Story:** As a user, I want the quantity selector to prevent me from selecting more than available stock, so that I don't waste time trying to purchase unavailable quantities.

#### Acceptance Criteria

1. WHEN a product has limited stock THEN the quantity selector maximum SHALL be set to the stock value
2. WHEN a user tries to manually enter a quantity exceeding stock THEN the system SHALL reset it to the maximum available
3. WHEN stock is 0 THEN the quantity selector SHALL be disabled
4. WHEN stock is 0 THEN both action buttons SHALL be disabled

### Requirement 4: Error Message Display

**User Story:** As a user, I want to see clear and specific error messages, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN an error occurs THEN the system SHALL display the error message using ElMessage
2. WHEN the error message contains "库存不足" THEN the system SHALL show it as a warning type message
3. WHEN the error is from the backend THEN the system SHALL extract and display the message field from the response
4. WHEN no specific error message is available THEN the system SHALL show a generic fallback message
