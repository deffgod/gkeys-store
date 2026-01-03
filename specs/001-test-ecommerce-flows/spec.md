# Feature Specification: Test E-commerce Core Flows

**Feature Branch**: `001-test-ecommerce-flows`  
**Created**: 2024-12-30  
**Status**: Draft  
**Input**: User description: "Теперь проверь функции добавления в корзину добавления в избранное создание заказа и тд"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Items to Cart (Priority: P1)

A user should be able to add games to their shopping cart, whether they are authenticated or browsing as a guest. The cart should persist items, allow quantity updates, and calculate totals correctly.

**Why this priority**: Cart functionality is fundamental to the e-commerce experience. Without a working cart, users cannot proceed to purchase, making this the highest priority flow to verify.

**Independent Test**: Can be fully tested by adding a game to cart, verifying it appears with correct price and quantity, and confirming the total updates correctly. This delivers immediate value by enabling the purchase flow.

**Acceptance Scenarios**:

1. **Given** a user is browsing the game catalog, **When** they click "Add to Cart" on an available game, **Then** the game is added to their cart with quantity 1 and the cart total updates
2. **Given** a game is already in the cart, **When** the user adds the same game again, **Then** the quantity increases by 1 instead of creating a duplicate entry
3. **Given** a user has items in their cart, **When** they view the cart page, **Then** they see all items with correct prices, quantities, and calculated total
4. **Given** a user is not logged in (guest), **When** they add items to cart, **Then** items are stored in session and persist during their browsing session
5. **Given** a guest user adds items to cart, **When** they log in, **Then** their session cart items are migrated to their user account cart
6. **Given** a game is out of stock, **When** a user attempts to add it to cart, **Then** they receive an error message indicating the game is unavailable

---

### User Story 2 - Manage Wishlist (Priority: P1)

A user should be able to add games to their wishlist for later purchase, remove items, and check if games are already in their wishlist.

**Why this priority**: Wishlist functionality helps users save games for future purchase and is a key engagement feature. It works independently of cart and provides immediate value.

**Independent Test**: Can be fully tested by adding a game to wishlist, verifying it appears in the wishlist, checking if a game is in wishlist, and removing items. This delivers value by allowing users to save games without committing to purchase.

**Acceptance Scenarios**:

1. **Given** a user is viewing a game page, **When** they click "Add to Wishlist", **Then** the game is added to their wishlist and the button state updates
2. **Given** a game is already in the wishlist, **When** the user clicks "Add to Wishlist" again, **Then** no duplicate is created and the system handles it gracefully
3. **Given** a user has items in their wishlist, **When** they view the wishlist page, **Then** they see all saved games with correct information
4. **Given** a game is in the wishlist, **When** the user clicks "Remove from Wishlist", **Then** the game is removed and no longer appears in the wishlist
5. **Given** a user is not logged in (guest), **When** they add items to wishlist, **Then** items are stored in session and can be migrated after login
6. **Given** a guest user has items in wishlist, **When** they log in, **Then** their session wishlist items are migrated to their user account wishlist

---

### User Story 3 - Create Order from Cart (Priority: P1)

An authenticated user should be able to create an order from their cart items, with proper stock validation, payment processing, and order confirmation.

**Why this priority**: Order creation is the final step in the purchase flow and directly generates revenue. This must work correctly for the business to function.

**Independent Test**: Can be fully tested by adding items to cart, proceeding to checkout, creating an order, and verifying the order is created with correct items, totals, and status. This delivers value by completing the purchase transaction.

**Acceptance Scenarios**:

1. **Given** a user has items in their cart, **When** they proceed to checkout and create an order, **Then** an order is created with status PENDING and all cart items are included
2. **Given** a user creates an order, **When** the order is processed, **Then** their account balance is deducted by the order total and a transaction record is created
3. **Given** a user applies a valid promo code during checkout, **When** they create an order, **Then** the discount is applied correctly and reflected in the order total
4. **Given** a game in the cart becomes out of stock, **When** the user attempts to create an order, **Then** they receive an error message and the order is not created
5. **Given** a user has insufficient balance, **When** they attempt to create an order, **Then** they receive an error message indicating insufficient funds
6. **Given** an order is successfully created, **When** the user views their orders, **Then** they see the new order with correct status, items, and total
7. **Given** a user creates an order with G2A-sourced games, **When** the order is processed, **Then** game keys are retrieved from G2A and delivered to the user

---

### User Story 4 - Update and Remove Cart Items (Priority: P2)

A user should be able to modify quantities of items in their cart and remove items they no longer want.

**Why this priority**: While secondary to adding items, cart management is essential for user experience. Users need to adjust quantities and remove unwanted items before checkout.

**Independent Test**: Can be fully tested by updating item quantities, verifying totals recalculate, and removing items. This delivers value by giving users control over their cart contents.

**Acceptance Scenarios**:

1. **Given** a user has an item in cart with quantity 2, **When** they update the quantity to 3, **Then** the quantity updates and the total recalculates correctly
2. **Given** a user updates a cart item quantity to 0, **When** they save the change, **Then** the item is removed from the cart
3. **Given** a user has multiple items in cart, **When** they remove one item, **Then** only that item is removed and other items remain with correct totals
4. **Given** a user clears their entire cart, **When** they view the cart, **Then** the cart is empty and shows appropriate empty state message

---

### Edge Cases

**Edge Case 1 - Stock Depletion Between Cart and Checkout**:
- **Given** a game is in cart and in stock when added, **When** the game becomes out of stock before checkout, **Then** order creation fails with error message "One or more items are out of stock" and order is not created

**Edge Case 2 - Concurrent Cart Updates**:
- **Given** a user has items in cart, **When** multiple concurrent requests update the cart from different browser tabs, **Then** the system handles updates atomically and final cart state is consistent (last write wins or merge strategy)

**Edge Case 3 - Session Expiration with Cart Items**:
- **Given** a guest user has items in cart, **When** their session expires, **Then** cart items are lost (session-based storage) and user sees empty cart, or session is extended if user is active

**Edge Case 4 - G2A API Failure During Order Creation**:
- **Given** an order contains G2A-sourced games, **When** G2A API fails during order creation, **Then** order creation fails for G2A items with appropriate error, but non-G2A items can still be ordered if order contains mixed items, or entire order fails if all items are G2A-sourced

**Edge Case 5 - Exact Balance Match**:
- **Given** a user's balance exactly equals the order total, **When** they create an order, **Then** order creation succeeds and balance is deducted to zero

**Edge Case 6 - Duplicate Order Creation (Idempotency)**:
- **Given** a user attempts to create an order with the same items twice, **When** both requests are processed, **Then** system prevents duplicate orders (returns existing order or rejects duplicate based on idempotency key/check)

**Edge Case 7 - Promo Code Expiration**:
- **Given** a promo code is valid when added to cart, **When** the promo code expires between cart addition and checkout, **Then** order creation validates promo code at creation time and rejects expired codes with error message

**Edge Case 8 - Cart Migration with Existing User Cart**:
- **Given** a user already has items in their user cart, **When** they log in with session cart items, **Then** session cart items are merged with user cart (quantities combined for same games, new games added)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to add games to cart with specified quantity
- **FR-002**: System MUST prevent adding out-of-stock games to cart
- **FR-003**: System MUST update cart item quantity when the same game is added multiple times
- **FR-004**: System MUST calculate and display correct cart total including all items
- **FR-005**: System MUST persist cart items for guest users in session storage
- **FR-006**: System MUST migrate session cart to user cart when guest logs in
- **FR-007**: System MUST allow users to update cart item quantities
- **FR-008**: System MUST allow users to remove individual items from cart
- **FR-009**: System MUST allow users to clear entire cart
- **FR-010**: System MUST allow users to add games to wishlist
- **FR-011**: System MUST prevent duplicate entries when adding same game to wishlist multiple times
- **FR-012**: System MUST allow users to remove games from wishlist
- **FR-013**: System MUST allow users to check if a game is in their wishlist
- **FR-014**: System MUST persist wishlist items for guest users in session storage
- **FR-015**: System MUST migrate session wishlist to user wishlist when guest logs in
- **FR-016**: System MUST allow authenticated users to create orders from cart items
- **FR-017**: System MUST validate stock availability before order creation
- **FR-018**: System MUST validate user has sufficient balance before order creation
- **FR-019**: System MUST apply promo code discounts correctly when creating orders
- **FR-020**: System MUST deduct user balance when order is created
- **FR-021**: System MUST create transaction record for each order
- **FR-022**: System MUST prevent duplicate order creation (idempotency)
- **FR-023**: System MUST retrieve game keys from G2A for G2A-sourced games during order processing
- **FR-024**: System MUST send game keys to user via email after successful order processing
- **FR-025**: System MUST update order status appropriately (PENDING → PROCESSING → COMPLETED)
- **FR-026**: System MUST allow users to view their order history
- **FR-027**: System MUST allow users to view individual order details

### Key Entities *(include if feature involves data)*

- **Cart Item**: Represents a game added to cart with quantity, linked to user or session, includes game details and price
- **Wishlist Item**: Represents a game saved to wishlist, linked to user or session, includes timestamp when added
- **Order**: Represents a completed purchase transaction, includes items, totals, status, payment information, and links to user
- **Order Item**: Represents individual game in an order with quantity and price at time of purchase
- **Transaction**: Represents financial transaction record for balance changes, linked to order and user

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Performance Measurement Methodology**: All performance criteria are measured from API request start to response completion, excluding network latency. Tests should measure server-side processing time using test instrumentation.

**Success Rate Measurement Methodology**: Success rate criteria are measured over a minimum of 100 test runs with varied test data to ensure statistical significance.

- **SC-001**: Users can add a game to cart in under 2 seconds from clicking the button (measured from API request start to response completion)
- **SC-002**: Cart total calculation is accurate 100% of the time across all scenarios
- **SC-003**: 95% of users successfully add items to cart on first attempt without errors (measured over 100+ test runs)
- **SC-004**: Users can add a game to wishlist in under 2 seconds from clicking the button (measured from API request start to response completion)
- **SC-005**: Wishlist operations (add/remove/check) complete successfully 99% of the time (measured over 100+ test runs)
- **SC-006**: Users can create an order from cart in under 30 seconds from checkout page load (measured from API request start to response completion)
- **SC-007**: Order creation succeeds 98% of the time when user has sufficient balance and items are in stock (measured over 100+ test runs)
- **SC-008**: Stock validation prevents out-of-stock purchases 100% of the time
- **SC-009**: Balance validation prevents insufficient fund purchases 100% of the time
- **SC-010**: Cart migration from session to user account succeeds 100% of the time during login
- **SC-011**: Wishlist migration from session to user account succeeds 100% of the time during login
- **SC-012**: Users receive game keys via email within 5 minutes of successful order completion
- **SC-013**: Order status updates reflect current processing state accurately 100% of the time
- **SC-014**: System handles G2A API failures gracefully without blocking order creation for non-G2A items

## Assumptions

- Users understand they need to be authenticated to create orders (cart and wishlist work for guests)
- Stock validation includes both local database stock status and G2A stock status for G2A-sourced games
- Cart and wishlist use session storage for guest users and database storage for authenticated users
- Order creation requires sufficient account balance (payment via balance, not external payment gateways in this flow)
- Promo codes are validated at order creation time, not at cart addition time
- G2A integration is optional - orders can be created for non-G2A games even if G2A API is unavailable
- Email delivery of game keys happens asynchronously after order creation
- Order status transitions are handled by background jobs or API callbacks

## Dependencies

- User authentication system must be functional
- Session management must be working for guest users
- Database must have game inventory data
- G2A API integration must be configured (optional for non-G2A games)
- Email service must be configured for key delivery
- Account balance system must be functional
- Promo code validation system must be functional

## Out of Scope

- External payment gateway integration (credit cards, PayPal, etc.)
- Order cancellation and refund processing
- Order modification after creation
- Bulk operations on cart or wishlist
- Cart or wishlist sharing between users
- Order history export functionality
- Advanced cart features like save for later
- Wishlist notifications for price drops
