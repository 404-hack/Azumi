# African Market Monorepo - Technical Specification

## 1. Project Overview

African Market Monorepo is a comprehensive e-commerce platform specifically designed for African vendors and customers. The platform allows vendors to set up online shops, manage menus/products, process orders, and connect with riders for delivery. Customers can browse shops, order food or products, and track their deliveries.

## 2. Architecture

### 2.1 Monorepo Structure

The project is organized as a monorepo using Turborepo, containing multiple applications and packages:

```
african-martket-monorepo/
├── apps/
│   ├── docs/          # Documentation site built with Next.js
│   ├── server/        # Backend API built with Hono & Cloudflare Workers
│   └── web/           # Frontend application built with SvelteKit
├── packages/
│   ├── eslint-config/ # Shared ESLint configurations
│   ├── server/        # Shared server utilities
│   ├── types/         # Shared TypeScript types
│   ├── typescript-config/ # Shared TypeScript configurations
│   └── ui/            # Shared React UI components
```

### 2.2 Technology Stack

#### Backend (Server)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite-compatible)
- **ORM**: Drizzle ORM
- **Authentication**: better-auth
- **Storage**: Cloudflare R2
- **Validation**: Zod

#### Frontend (Web)
- **Framework**: SvelteKit 2.0 (Svelte 5) with Cloudflare Pages
- **UI Components**: Custom shadcn-style components
- **Styling**: TailwindCSS
- **Forms**: SvelteKit Superforms
- **State Management**: Svelte Runes and stores
- **Authentication**: better-auth client

#### Build and Development Tools
- **Package Manager**: PNPM
- **Build System**: Turborepo
- **TypeScript**: Project-wide
- **Linting**: ESLint
- **Formatting**: Prettier

### 2.3 Infrastructure

The application is deployed on Cloudflare's infrastructure:
- **Backend**: Cloudflare Workers
- **Frontend**: Cloudflare Pages
- **Database**: Cloudflare D1
- **Storage**: Cloudflare R2
- **Analytics**: Built-in Cloudflare analytics

## 3. Data Models

### 3.1 User & Authentication

#### User
```typescript
// userTable schema
{
  id: string (primary key),
  name: string,
  email: string (unique),
  emailVerified: boolean,
  image: string (optional),
  tokens: number (optional),
  credits: number (optional),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Session
```typescript
// session schema
{
  id: string (primary key),
  expiresAt: timestamp,
  token: string (unique),
  createdAt: timestamp,
  updatedAt: timestamp,
  ipAddress: string (optional),
  userAgent: string (optional),
  userId: string (references user.id),
  activeOrganizationId: string (optional)
}
```

#### Account
```typescript
// account schema
{
  id: string (primary key),
  accountId: string,
  providerId: string,
  userId: string (references user.id),
  accessToken: string (optional),
  refreshToken: string (optional),
  idToken: string (optional),
  accessTokenExpiresAt: timestamp (optional),
  refreshTokenExpiresAt: timestamp (optional),
  scope: string (optional),
  password: string (optional),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Verification
```typescript
// verification schema
{
  id: string (primary key),
  identifier: string,
  value: string,
  expiresAt: timestamp,
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

### 3.2 Shop & Vendor

#### Shop Type
```typescript
// shopTypeTable schema
{
  id: string (primary key),
  name: string,
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

#### Shop
```typescript
// shopTable schema
{
  id: string (primary key),
  slug: string (unique, optional),
  name: string,
  email: string (optional),
  shopType: string (references shopTypeTable.id, optional),
  metadata: JSON (optional),
  phoneNumber: string (optional),
  address: string (optional),
  latitude: string,
  longitude: string,
  commission: number (default: 10),
  minimumOrderAmount: number (default: 0),
  active: boolean (default: false),
  logo: string (optional),
  coverImage: string (optional),
  location: JSON (optional),
  averageRating: number (optional),
  totalRatings: number (default: 0),
  featuredPosition: number (optional),
  tags: JSON (optional),
  bankInfo: JSON (optional),
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

#### Shop Operating Hours
```typescript
// shopOperatingHoursTable schema
{
  id: string (primary key),
  shopId: string (references shopTable.id),
  day: enum (monday, tuesday, wednesday, thursday, friday, saturday, sunday),
  openTime: timestamp_ms,
  closeTime: timestamp_ms,
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

#### Member & Organization Roles
```typescript
// member schema
{
  id: string (primary key),
  organizationId: string (references shopTable.id),
  userId: string (references userTable.id),
  role: string,
  createdAt: timestamp
}
```

#### Invitation
```typescript
// invitation schema
{
  id: string (primary key),
  organizationId: string (references shopTable.id),
  email: string,
  role: string (optional),
  status: string,
  expiresAt: timestamp,
  inviterId: string (references userTable.id)
}
```

### 3.3 Menu & Food Items

#### Menu Category
```typescript
// menuCategoryTable schema
{
  id: string (primary key),
  name: string,
  description: string (optional),
  shopId: string (references shopTable.id),
  active: boolean (default: false),
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

#### Menu Item
```typescript
// menuTable schema
{
  id: string (primary key),
  name: string,
  description: string (optional),
  price: number,
  priceDescription: string (optional),
  inStock: boolean (default: true),
  shopId: string (references shopTable.id),
  categoryId: string (references menuCategoryTable.id),
  packId: string (optional, references packTable.id),
  optionGroupId: string (optional, references optionGroupTable.id),
  active: boolean (default: false),
  image: string (optional),
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

#### Menu Pack
```typescript
// packTable schema
{
  id: string (primary key),
  name: string,
  description: string,
  price: number,
  shopId: string (references shopTable.id),
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

#### Menu Option Group
```typescript
// optionGroupTable schema
{
  id: string (primary key),
  name: string,
  description: string,
  required: boolean (default: false),
  multiSelect: boolean (default: false),
  minSelections: number (default: 0),
  maxSelections: number (optional),
  shopId: string (references shopTable.id),
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

#### Menu Option
```typescript
// optionTable schema
{
  id: string (primary key),
  name: string,
  price: number,
  groupId: string (references optionGroupTable.id),
  createdAt: timestamp (optional),
  updatedAt: timestamp (optional)
}
```

### 3.4 Cart & Order

#### Cart
```typescript
// carts schema
{
  id: string (primary key),
  customerId: string (references userTable.id, optional),
  restaurantId: string (references shopTable.id, optional),
  status: enum ("active", "abandoned", "converted") (default: "active"),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Cart Item
```typescript
// cartItems schema
{
  id: string (primary key),
  cartId: string (references carts.id),
  menuItemId: string (references menuItemTable.id),
  quantity: number (default: 1),
  specialInstructions: string (optional),
  totalPrice: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Cart Item Options
```typescript
// cartItemOptions schema
{
  id: string (primary key),
  cartItemId: string (references cartItems.id),
  optionId: string (references optionTable.id),
  optionGroupId: string (references optionGroupTable.id),
  quantity: number (default: 1),
  price: number
}
```

#### Order
```typescript
// orderTable schema
{
  id: string (primary key),
  code: string,
  customerId: string (references userTable.id, optional),
  vendorId: string (references vendorTable.id),
  riderId: string (references userTable.id, optional),
  status: enum ("new", "ready", "completed", "cancelled"),
  
  // Delivery information
  deliveryAddressId: string (optional),
  deliveryNotes: string (optional),
  contactPhone: string (optional),
  isScheduled: boolean (default: false),
  scheduledFor: string (optional),
  
  // Payment information
  paymentMethod: enum ("card", "cash", "wallet", "bank_transfer", "mobile_money"),
  paymentStatus: enum ("pending", "paid", "failed", "refunded", "partially_refunded"),
  paymentTransactionId: string (optional),
  
  // Pricing
  subtotal: number,
  deliveryFee: number (default: 0),
  serviceFee: number (default: 0),
  tip: number (default: 0),
  discount: number (default: 0),
  tax: number (default: 0),
  total: number,
  
  // Timestamps for order progress
  acceptedAt: string (optional),
  preparedAt: string (optional),
  pickedUpAt: string (optional),
  deliveredAt: string (optional),
  canceledAt: string (optional),
  cancelReason: string (optional),
  
  // Refund information
  refundAmount: number (default: 0),
  refundReason: string (optional),
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Order Item
```typescript
// orderItemTable schema
{
  id: string (primary key),
  orderId: string (references orderTable.id),
  menuItemId: string (references menuItemTable.id, optional),
  menuItemName: string,
  quantity: number (default: 1),
  unitPrice: number,
  totalPrice: number,
  notes: string (optional),
  customizations: string (optional), // JSON string of customizations
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3.5 Address

```typescript
// addresses schema
{
  id: string (primary key),
  userId: string (references userTable.id, optional),
  addressLine1: string,
  addressLine2: string (optional),
  city: string,
  state: string,
  country: string,
  postalCode: string,
  latitude: string,
  longitude: string,
  isDefault: boolean (default: false),
  label: string (optional),
  phone: string (optional),
  deliveryInstructions: string (optional)
}
```

## 4. API Endpoints

### 4.1 Authentication

- `POST /auth/register`: Register a new user
- `POST /auth/login`: Log in a user
- `POST /auth/logout`: Log out a user
- `POST /auth/reset-password`: Request password reset
- `POST /auth/verify-email`: Verify user email

### 4.2 Shop & Vendor Management

- `POST /shop/create`: Create a new shop
- `GET /shop/:id`: Get shop details
- `PATCH /shop/:id`: Update shop details
- `GET /shop/:id/operating-hours`: Get shop operating hours
- `POST /shop/:id/operating-hours`: Create/update shop operating hours
- `DELETE /shop/:id`: Delete a shop
- `POST /shop/invitation`: Invite a user to a shop
- `PATCH /shop/invitation/:id/accept`: Accept shop invitation
- `PATCH /shop/invitation/:id/decline`: Decline shop invitation

### 4.3 Menu Management

- `POST /menu/create`: Create a new menu item
- `GET /menu/:id`: Get menu item details
- `PATCH /menu/:id`: Update menu item
- `DELETE /menu/:id`: Delete menu item
- `GET /menuCategoryWithItem/:shopId`: Get menu categories with items for a shop
- `POST /menu/category/create`: Create a new menu category
- `GET /category/:id`: Get category details
- `GET /categories/:shopId`: Get all categories for a shop
- `PATCH /category/:id`: Update menu category
- `DELETE /category/:id`: Delete menu category

### 4.4 Menu Option Management

- `GET /menu-option/groups/:shopId`: Get all option groups for a shop
- `GET /menu-option/group/:id`: Get option group details
- `POST /menu-option/group/create`: Create a new option group with options
- `DELETE /menu-option/group/:id`: Delete an option group and its options
- `PATCH /menu-option/group/:id/options`: Update options in a group

### 4.5 Menu Pack Management

- `GET /menu-pack/list/:shopId`: Get all packs for a shop
- `GET /menu-pack/:id`: Get pack details
- `POST /menu-pack/create`: Create a new menu pack
- `PATCH /menu-pack/:id`: Update menu pack
- `DELETE /menu-pack/:id`: Delete menu pack

### 4.6 Order Management

- `POST /order/create`: Create a new order
- `GET /order/:id`: Get order details
- `PATCH /order/:id/status`: Update order status
- `GET /orders/vendor/:vendorId`: Get vendor orders
- `GET /orders/customer/:customerId`: Get customer orders
- `GET /orders/rider/:riderId`: Get rider's assigned orders

### 4.7 Cart Management

- `POST /cart/create`: Create a new cart
- `GET /cart/:id`: Get cart details
- `POST /cart/:id/item`: Add item to cart
- `DELETE /cart/:id/item/:itemId`: Remove item from cart
- `PATCH /cart/:id/item/:itemId`: Update cart item
- `DELETE /cart/:id`: Delete cart

## 5. Frontend Components

### 5.1 Layouts

- `BaseLayout`: The main layout with navigation and footer
- `VendorDashboardLayout`: Layout for vendor management pages
- `CustomerLayout`: Layout for customer-facing pages
- `RiderLayout`: Layout for rider-facing pages

### 5.2 Pages

#### Authentication
- Login
- Register
- Password Reset
- Account Verification

#### Vendor
- Dashboard
- Menu Management 
- Orders Management
- Settings
- Analytics
- Staff Management
- Operating Hours
- Order Details

#### Customer
- Home/Discovery
- Shop/Restaurant Details
- Menu Browsing
- Cart
- Checkout
- Order Tracking
- Order History
- Account Settings

#### Rider
- Dashboard
- Available Deliveries
- Current Delivery
- Delivery History
- Account Settings

### 5.3 UI Components

The project uses a custom implementation of shadcn-style components for Svelte, including:

- `Button`: Primary, secondary, destructive, outline, ghost, link variants
- `Card`: Card container, header, content, footer
- `Dialog/Modal`: Dialog and modal windows
- `Form`: Form components with validation
- `Input`: Text input fields
- `Select`: Dropdown selection
- `Checkbox`: Checkbox input
- `RadioGroup`: Radio button groups
- `Sidebar`: Navigation sidebar
- `Table`: Data tables
- `Tabs`: Tabbed interface
- `Toast`: Notification toasts
- `Dropdown`: Dropdown menus

### 5.4 Forms

Forms are built using SvelteKit Superforms with Zod validation. Key form schemas include:

- Registration/Login forms
- Shop creation form
- Menu item creation form
- Menu category creation form 
- Menu option group creation form
- Order status update form
- Checkout form

## 6. Authentication & Authorization

### 6.1 Authentication

Authentication is implemented using better-auth, providing:
- Email/password authentication
- Email verification
- Password reset functionality
- Session management
- Organization/multi-tenant support

### 6.2 Authorization

Role-based access control is implemented, with roles including:
- Super Admin: Access to all system features
- Shop Admin: Full access to a specific shop/vendor
- Staff: Limited access to shop management
- Customer: Access to ordering and account features
- Rider: Access to delivery management features

## 7. Data Storage

### 7.1 Database

Cloudflare D1 (SQLite-compatible) with Drizzle ORM for:
- User data
- Shop/vendor data
- Menu and product data
- Order and delivery data

### 7.2 File Storage

Cloudflare R2 for:
- Product/menu images
- Shop logos and cover images
- User profile pictures
- Other document uploads

## 8. Deployment

The application is deployed on Cloudflare infrastructure:

### 8.1 Backend

- Cloudflare Workers for API endpoints
- Configured via wrangler.toml

### 8.2 Frontend

- Cloudflare Pages for the SvelteKit application

### 8.3 Database Migrations

- Drizzle Kit for database schema migrations
- Migration workflows defined in package.json scripts

## 9. Development Workflow

### 9.1 Local Development

- `pnpm dev`: Start development servers for all apps
- `pnpm build`: Build all applications
- `pnpm lint`: Run linting on all applications
- `pnpm check-types`: Run TypeScript type checking

### 9.2 Database Management

- `pnpm db:studio`: Launch Drizzle studio for database management
- `pnpm db:push`: Push schema changes to the database
- `pnpm db:generate`: Generate migration files
- `pnpm db:migrate`: Run migrations

## 10. Future Enhancements

### 10.1 Planned Features

- Real-time order tracking
- Advanced analytics for vendors
- Customer loyalty program
- Mobile applications (using Capacitor)
- Multi-language support
- Payment gateway integrations
- Rating and review system
- Advanced search functionality
- Push notifications

### 10.2 Scalability Considerations

- Database sharding for multi-region support
- CDN optimization for static assets
- Queue-based processing for high-load operations
- Caching strategies for frequently accessed data

## 11. Security Considerations

- HTTPS enforcement
- CSRF protection
- Input validation and sanitization
- Rate limiting
- Data encryption
- Regular security audits
- Secure payment processing

## 12. Monitoring and Analytics

- Error tracking and logging
- Performance monitoring
- User analytics
- Business metrics tracking
- Health checks and alerts