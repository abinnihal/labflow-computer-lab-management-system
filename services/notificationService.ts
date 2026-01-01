
import { Notification, NotificationLog } from '../types';

// Pub/Sub Mechanism for Real-time Updates
type Listener = (notifications: Notification[]) => void;
let listeners: Listener[] = [];

export const subscribe = (listener: Listener) => {
  listeners.push(listener);
  // Initial callback with current state
  listener([...NOTIFICATIONS]); 
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const notifySubscribers = () => {
  listeners.forEach(l => l([...NOTIFICATIONS]));
};

// Empty for reset
let NOTIFICATIONS: Notification[] = [];
let NOTIFICATION_HISTORY: NotificationLog[] = [];

export const sendNotification = (senderId: string, recipientId: string | 'ALL' | 'CLASS' | 'ADMIN_GROUP', message: string, type: 'REMINDER' | 'ALERT' | 'INFO'): void => {
  const actualRecipient = recipientId === 'ADMIN_GROUP' ? 'a-demo' : recipientId;
  
  const newNotification: Notification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipientId: actualRecipient, 
    senderId,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  NOTIFICATIONS.unshift(newNotification);
  notifySubscribers(); // Trigger real-time update
  console.log('Notification Sent:', newNotification);
};

export const sendWhatsAppMessage = async (phone: string, content: string): Promise<boolean> => {
  console.log(`[WhatsApp API] Sending to ${phone}: ${content}`);
  return new Promise(resolve => setTimeout(() => resolve(true), 500));
};

export const sendBroadcast = (
  senderName: string,
  targetGroup: string,
  title: string,
  message: string,
  type: 'REMINDER' | 'ALERT' | 'INFO',
  channels: { email: boolean; whatsapp: boolean } = { email: false, whatsapp: false }
): void => {
  const estimatedDelivery = targetGroup === 'ALL_USERS' ? 120 : 
                            targetGroup.includes('ALL') ? 60 : 30;
  
  const simulatedReads = Math.floor(Math.random() * (estimatedDelivery * 0.4));

  const newLog: NotificationLog = {
    id: `log-${Date.now()}`,
    targetGroup,
    title,
    message,
    type,
    sentAt: new Date().toISOString(),
    sentBy: senderName,
    deliveryCount: estimatedDelivery,
    readCount: simulatedReads
  };
  NOTIFICATION_HISTORY.unshift(newLog);

  // Broadcast to 'ALL' for demo visibility
  let internalRecipient = 'ALL';
  // If targeted specifically, we map it to ALL for the demo so the current user sees it
  
  sendNotification('ADMIN', internalRecipient, `${title}: ${message}`, type);

  if (channels.email) {
      console.log(`[Mock Email Service] Sending batch email to ${targetGroup}: ${title}`);
  }
  if (channels.whatsapp) {
      console.log(`[Mock WhatsApp API] Broadcasting to ${targetGroup}: ${message}`);
  }
};

export const getNotificationsForUser = (userId: string): Notification[] => {
  return NOTIFICATIONS.filter(n => n.recipientId === userId || n.recipientId === 'ALL').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const markAsRead = (notificationId: string): void => {
  const notif = NOTIFICATIONS.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    notifySubscribers(); // Trigger update
  }
};

export const markAllAsRead = (userId: string): void => {
  let updated = false;
  NOTIFICATIONS.forEach(n => {
    if ((n.recipientId === userId || n.recipientId === 'ALL') && !n.read) {
      n.read = true;
      updated = true;
    }
  });
  if (updated) notifySubscribers();
};

export const getNotificationHistory = (): NotificationLog[] => {
  return NOTIFICATION_HISTORY;
};
