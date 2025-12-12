/**
 * Notification Service
 * 
 * Handles push notifications, in-app notifications, and notification triggers
 * Note: FCM requires Firebase project setup. This implementation provides
 * the structure and can work with mock notifications until Firebase is configured.
 */

interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: 'milestone' | 'alert' | 'insight' | 'reminder' | 'system';
    data?: Record<string, any>;
    read: boolean;
    createdAt: Date;
}

interface NotificationTrigger {
    type: 'portfolio_milestone' | 'fire_progress' | 'market_alert' | 'strategy_anniversary' | 'rebalance_reminder';
    threshold?: number;
    message: string;
}

// In-memory notification store (would be Supabase in production)
const notifications: Notification[] = [];

// Notification triggers configuration
const NOTIFICATION_TRIGGERS: NotificationTrigger[] = [
    {
        type: 'portfolio_milestone',
        threshold: 100000,
        message: 'Your portfolio has crossed ₹1 Lakh!',
    },
    {
        type: 'portfolio_milestone',
        threshold: 500000,
        message: 'Your portfolio has crossed ₹5 Lakhs!',
    },
    {
        type: 'portfolio_milestone',
        threshold: 1000000,
        message: 'Congratulations! Your portfolio has crossed ₹10 Lakhs!',
    },
    {
        type: 'fire_progress',
        threshold: 25,
        message: 'You\'ve reached 25% of your FIRE goal!',
    },
    {
        type: 'fire_progress',
        threshold: 50,
        message: 'Halfway there! 50% of your FIRE goal achieved!',
    },
    {
        type: 'fire_progress',
        threshold: 75,
        message: 'Amazing! 75% of your FIRE goal completed!',
    },
    {
        type: 'fire_progress',
        threshold: 100,
        message: '🎉 You\'ve achieved FIRE! Financial Independence reached!',
    },
    {
        type: 'rebalance_reminder',
        message: 'It\'s been 6 months since your last portfolio review. Consider rebalancing.',
    },
];

/**
 * Generate a unique notification ID
 */
function generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new notification
 */
export function createNotification(
    userId: string,
    title: string,
    body: string,
    type: Notification['type'],
    data?: Record<string, any>
): Notification {
    const notification: Notification = {
        id: generateId(),
        userId,
        title,
        body,
        type,
        data,
        read: false,
        createdAt: new Date(),
    };

    notifications.push(notification);
    return notification;
}

/**
 * Get all notifications for a user
 */
export function getUserNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
    return notifications
        .filter(n => n.userId === userId && (!unreadOnly || !n.read))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string): boolean {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        return true;
    }
    return false;
}

/**
 * Mark all notifications as read for a user
 */
export function markAllAsRead(userId: string): number {
    let count = 0;
    notifications.forEach(n => {
        if (n.userId === userId && !n.read) {
            n.read = true;
            count++;
        }
    });
    return count;
}

/**
 * Check and trigger portfolio milestone notifications
 */
export function checkPortfolioMilestones(
    userId: string,
    currentValue: number,
    previousValue: number
): Notification[] {
    const triggered: Notification[] = [];

    NOTIFICATION_TRIGGERS
        .filter(t => t.type === 'portfolio_milestone')
        .forEach(trigger => {
            if (trigger.threshold && previousValue < trigger.threshold && currentValue >= trigger.threshold) {
                const notification = createNotification(
                    userId,
                    '🎯 Portfolio Milestone!',
                    trigger.message,
                    'milestone',
                    { currentValue, threshold: trigger.threshold }
                );
                triggered.push(notification);
            }
        });

    return triggered;
}

/**
 * Check and trigger FIRE progress notifications
 */
export function checkFireProgress(
    userId: string,
    currentProgress: number,
    previousProgress: number
): Notification[] {
    const triggered: Notification[] = [];

    NOTIFICATION_TRIGGERS
        .filter(t => t.type === 'fire_progress')
        .forEach(trigger => {
            if (trigger.threshold && previousProgress < trigger.threshold && currentProgress >= trigger.threshold) {
                const notification = createNotification(
                    userId,
                    '🔥 FIRE Progress!',
                    trigger.message,
                    'milestone',
                    { currentProgress, threshold: trigger.threshold }
                );
                triggered.push(notification);
            }
        });

    return triggered;
}

/**
 * Create a market alert notification
 */
export function createMarketAlert(
    userId: string,
    symbol: string,
    priceChange: number,
    currentPrice: number
): Notification {
    const direction = priceChange >= 0 ? 'up' : 'down';
    const emoji = priceChange >= 0 ? '📈' : '📉';

    return createNotification(
        userId,
        `${emoji} ${symbol} Alert`,
        `${symbol} is ${direction} ${Math.abs(priceChange).toFixed(2)}% today. Current price: ₹${currentPrice.toLocaleString('en-IN')}`,
        'alert',
        { symbol, priceChange, currentPrice }
    );
}

/**
 * Create a strategy anniversary reminder
 */
export function createStrategyAnniversary(
    userId: string,
    strategyName: string,
    yearsCompleted: number
): Notification {
    return createNotification(
        userId,
        '📅 Strategy Anniversary',
        `Your "${strategyName}" strategy has completed ${yearsCompleted} year${yearsCompleted > 1 ? 's' : ''}! Review your progress.`,
        'reminder',
        { strategyName, yearsCompleted }
    );
}

/**
 * Get notification triggers configuration
 */
export function getTriggerConfig(): NotificationTrigger[] {
    return NOTIFICATION_TRIGGERS;
}

/**
 * Get unread notification count
 */
export function getUnreadCount(userId: string): number {
    return notifications.filter(n => n.userId === userId && !n.read).length;
}

export type { Notification, NotificationTrigger };
