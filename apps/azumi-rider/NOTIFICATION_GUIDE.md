# Expo Push Notifications Implementation

This document explains how the modern Expo push notification system is implemented in the Azumi Rider app.

## Architecture Overview

The notification system consists of three main components:

1. **Server-Side**: Expo push notification service and routes
2. **Client-Side**: Notification service and context providers
3. **Type-Safe API**: Hono client for type-safe communication

## Server Implementation

### Expo Push Service (`expo-push.service.ts`)

- Handles token registration and management
- Sends notifications via Expo's push API
- Logs notifications to database
- Validates token formats

### Expo Push Routes (`expo-push.route.ts`)

- `/expo-push/register-token` - Register device tokens
- `/expo-push/send-notification` - Send test notifications
- Includes authentication middleware

## Client Implementation

### Core Components

1. **NotificationService** (`lib/notification.ts`)

   - Manages Expo push tokens
   - Handles permission requests
   - Sets up notification listeners
   - Configures notification channels (Android)

2. **NotificationContext** (`lib/notification-context.tsx`)

   - Provides notification state across the app
   - Manages token registration
   - Handles badge counts and local notifications

3. **Hono Client** (`lib/hono-client.ts`)
   - Type-safe API communication
   - Automatic authentication handling
   - Platform-specific configurations

### Hooks

1. **useExpoPushNotifications**

   - Type-safe push notification operations
   - Token registration with error handling
   - Test notification sending

2. **useOrderNotifications**

   - Order-specific notification handling
   - Navigation integration
   - Different notification types (assignment, update, completed)

3. **useAutoNotificationSetup**
   - Automatic token registration on login
   - Background setup without user interaction

## Features

### Push Notifications

- ✅ Server-to-device messaging
- ✅ Rich notification data
- ✅ Sound and badge support
- ✅ Deep linking to specific screens

### Local Notifications

- ✅ Schedule notifications on device
- ✅ Immediate and delayed notifications
- ✅ Custom data payloads

### Badge Management

- ✅ Set custom badge counts
- ✅ Clear badges
- ✅ Automatic badge updates

### Order-Specific Features

- ✅ New order assignments
- ✅ Order status updates
- ✅ Delivery confirmations
- ✅ Automatic navigation to order details

## Configuration

### App.json Configuration

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/notification-icon.png",
        "color": "#ffffff",
        "defaultChannel": "default"
      }
    ]
  ]
}
```

### Required Permissions

- Notification permissions (automatically requested)
- Physical device required for push notifications

## Usage Examples

### Basic Setup

```typescript
// Automatic setup via NotificationSetup component
import { NotificationSetup } from "~/components/NotificationSetup";

// In your app layout
<NotificationSetup />
```

### Manual Token Registration

```typescript
const { registerToken } = useExpoPushNotifications();

const handleRegister = async () => {
  const deviceId = `${Device.osName}_${Device.modelName}`;
  await registerToken(deviceId);
};
```

### Sending Test Notifications

```typescript
const { sendTestNotification } = useExpoPushNotifications();

const handleTest = async () => {
  await sendTestNotification("Test Title", "Test Body", {
    customData: "value",
  });
};
```

### Order Notifications

```typescript
const { sendOrderNotification } = useOrderNotifications();

const handleOrderUpdate = async () => {
  await sendOrderNotification(
    "order_123",
    "Order Ready",
    "Your order is ready for pickup",
    "update"
  );
};
```

## Testing

Use the demo screen (`/notification-demo`) to test all notification features:

1. Check notification status and permissions
2. Register push tokens
3. Send push notifications
4. Schedule local notifications
5. Test order-specific notifications
6. Manage badge counts

## Troubleshooting

### Common Issues

1. **Notifications not working**

   - Ensure using a physical device (not simulator)
   - Check notification permissions
   - Verify user is logged in
   - Check server authentication

2. **Token registration fails**

   - Verify API endpoints are accessible
   - Check authentication status
   - Ensure proper network connectivity

3. **Local notifications not showing**
   - Check notification permissions
   - Verify trigger configuration
   - Test on physical device

### Debug Information

The system provides extensive logging:

- Token registration status
- Notification delivery confirmations
- Error messages and stack traces
- Device and permission information

## Integration with Rider Workflow

The notification system is integrated with the rider workflow:

1. **Login**: Automatic token registration
2. **Order Assignment**: Push notifications for new orders
3. **Order Updates**: Status change notifications
4. **Navigation**: Deep linking to order details
5. **Badge Updates**: Unread order count

## Security

- All endpoints require authentication
- Tokens are validated server-side
- User data is protected
- No sensitive information in notification payloads

## Future Enhancements

Potential improvements:

- Rich media notifications (images, actions)
- Silent notifications for background updates
- Notification categories and user preferences
- Push notification analytics
- Geofenced notifications
