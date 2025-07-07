# African Market API Documentation

**Base URL:** `https://your-domain.com/api`

## Authentication

Most endpoints require authentication via Bearer token in the `Authorization` header.

```
Authorization: Bearer <your-token>
```

---

## 🏪 Shop Endpoints

### GET /shop/near-me

Find shops near a location with filters.

**Query Parameters:**

```typescript
{
  latitude: number      // Required
  longitude: number     // Required
  distance?: number     // Search radius in km (default: 10)
  maxDistance?: number  // Max delivery distance in km (default: 25)
  shopType?: string     // Filter by shop type
  openNow?: boolean     // Only open shops
  feeMin?: number       // Min delivery fee
  feeMax?: number       // Max delivery fee
  rating?: number       // Min rating (1-5)
  sort?: "distance" | "rating" | "delivery_fee" | "newest"
}
```

**Response:**

```typescript
{
  success: boolean;
  data: {
    id: string;
    name: string;
    distance: number;
    isOpen: boolean;
    averageRating: number;
    deliveryFee: number;
    // ... more shop details
  }
  [];
  meta: {
    total: number;
    filters: object;
  }
}
```

### POST /shop/create

Create a new shop (requires auth).

**Body:**

```typescript
{
  name: string
  address: string
  latitude: number
  longitude: number
  shopType: string
  description?: string
  phoneNumber?: string
}
```

### GET /shop/:id

Get shop details by ID.

### PATCH /shop/:id

Update shop details (requires auth).

---

## 🛵 Rider Endpoints

### POST /rider/apply

Apply to become a rider.

**Body:**

```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  vehicleType: "BICYCLE" | "MOTORCYCLE" | "CAR";
  vehicleLicense: string;
}
```

### GET /rider/profile

Get rider profile (requires rider auth).

### PATCH /rider/status

Update rider availability status.

**Body:**

```typescript
{
  status: "AVAILABLE" | "BUSY" | "OFFLINE"
  latitude?: number
  longitude?: number
}
```

### GET /rider/orders/actives

Get active orders assigned to rider.

### GET /rider/orders/all

Get rider's order history.

### POST /rider/orders/:orderId/accept

Accept an order assignment.

### POST /rider/orders/:id/pickup

Mark order as picked up.

### POST /rider/orders/:id/deliver

Confirm delivery with confirmation code.

**Body:**

```typescript
{
  confirmationCode: number;
}
```

### GET /rider/banks

Get list of supported banks for payments.

### POST /rider/verify-account

Verify bank account details.

**Body:**

```typescript
{
  accountNumber: string;
  bankCode: string;
}
```

### POST /rider/payment-method

Add payment method.

**Body:**

```typescript
{
  type: "BANK_TRANSFER";
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}
```

---

## 📦 Order Endpoints

### POST /order/create

Create a new order.

**Body:**

```typescript
{
  shopId: string
  items: {
    menuItemId: string
    quantity: number
    options?: { optionId: string, quantity: number }[]
  }[]
  deliveryAddress: {
    latitude: number
    longitude: number
    addressName: string
  }
  paymentMethod: "CARD" | "WALLET" | "CASH"
  specialInstructions?: string
}
```

### GET /order/my-orders

Get user's order history.

### GET /order/:id

Get order details by ID.

### POST /order/:id/cancel

Cancel an order.

### POST /order/:id/rate

Rate an order.

**Body:**

```typescript
{
  rating: number // 1-5
  comment?: string
}
```

---

## 🍽️ Menu Endpoints

### GET /menu/shop/:shopId

Get menu items for a shop.

**Query Parameters:**

```typescript
{
  category?: string
  search?: string
  available?: boolean
}
```

### POST /menu/item

Create menu item (vendor auth required).

**Body:**

```typescript
{
  name: string
  description: string
  price: number
  categoryId: string
  imageUrl?: string
  available?: boolean
}
```

### PATCH /menu/item/:id

Update menu item.

### DELETE /menu/item/:id

Delete menu item.

---

## 🛒 Cart Endpoints

### GET /cart

Get user's cart.

### POST /cart/add

Add item to cart.

**Body:**

```typescript
{
  menuItemId: string
  quantity: number
  options?: { optionId: string, quantity: number }[]
}
```

### PATCH /cart/item/:id

Update cart item quantity.

**Body:**

```typescript
{
  quantity: number;
}
```

### DELETE /cart/item/:id

Remove item from cart.

### DELETE /cart/clear

Clear entire cart.

---

## 👤 User Endpoints

### GET /user/profile

Get user profile.

### PATCH /user/profile

Update user profile.

**Body:**

```typescript
{
  name?: string
  phoneNumber?: string
  avatarUrl?: string
}
```

### GET /user/addresses

Get user's saved addresses.

### POST /user/addresses

Add new address.

**Body:**

```typescript
{
  name: string
  latitude: number
  longitude: number
  addressName: string
  isDefault?: boolean
}
```

---

## 🏪 Vendor Endpoints

### GET /vendor/shop

Get vendor's shop details.

### GET /vendor/orders

Get vendor's orders.

**Query Parameters:**

```typescript
{
  status?: "PENDING" | "CONFIRMED" | "READY" | "RIDER_ASSIGNED" | "IN_TRANSIT" | "DELIVERED"
  page?: number
  limit?: number
}
```

### PATCH /vendor/orders/:id/status

Update order status.

**Body:**

```typescript
{
  status: "CONFIRMED" | "READY" | "CANCELLED"
  estimatedReadyTime?: number // minutes
}
```

### GET /vendor/analytics

Get vendor analytics and stats.

---

## 📍 Address & Location Endpoints

### GET /delivery-fee

Calculate delivery fee.

**Query Parameters:**

```typescript
{
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}
```

### POST /address/geocode

Convert address to coordinates.

**Body:**

```typescript
{
  address: string;
}
```

---

## 🔔 Push Notification Endpoints

### POST /push-notifications/register

Register device for push notifications.

**Body:**

```typescript
{
  token: string;
  platform: "ios" | "android" | "web";
}
```

---

## 💳 Payment Endpoints

### POST /webhook/paystack

Paystack webhook for payment confirmations (system use only).

---

## 🎯 Promotion Endpoints

### GET /promotions/active

Get active promotions.

### GET /promotions/shop/:shopId

Get promotions for a specific shop.

---

## 🔧 Admin Endpoints

All admin endpoints require admin authentication.

### GET /admin/dashboard/stats

Get admin dashboard statistics.

### GET /admin/vendors

Get all vendors with filters.

### PATCH /admin/vendors/:id/status

Update vendor status.

### GET /admin/riders

Get all riders with filters.

### PATCH /admin/riders/:id/status

Update rider application status.

### GET /admin/orders

Get all orders with filters.

---

## 📱 WebSocket Endpoints

### /ws/rider

WebSocket connection for real-time rider dispatch.

### /ws/orders

WebSocket connection for real-time order updates.

---

## Error Responses

All endpoints return errors in this format:

```typescript
{
  error: string
  message?: string
  details?: any
}
```

**Common HTTP Status Codes:**

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Rate Limiting

- Most endpoints: 100 requests/minute
- Auth endpoints: 10 requests/minute
- Search endpoints: 50 requests/minute

---

## Data Types

### Shop Status

```typescript
"DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
```

### Order Status

```typescript
"PENDING" |
  "CONFIRMED" |
  "READY" |
  "RIDER_ASSIGNED" |
  "IN_TRANSIT" |
  "DELIVERED" |
  "CANCELLED";
```

### Rider Status

```typescript
"AVAILABLE" | "BUSY" | "OFFLINE";
```

### Vehicle Types

```typescript
"BICYCLE" | "MOTORCYCLE" | "CAR";
```

### Payment Methods

```typescript
"CARD" | "WALLET" | "CASH" | "BANK_TRANSFER";
```

---

## Environment

**Staging:** `https://staging-api.africanmarket.com/api`
**Production:** `https://api.africanmarket.com/api`

---

_Last updated: July 2025_
