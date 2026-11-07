export const WHATSAPP_NUMBER = "923008615743"; // Replace with your actual WhatsApp Business Number

export function formatWhatsAppMessage(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  items: Array<{ name: string; variant?: string; quantity: number; price: number }>;
  total: number;
}) {
  let text = `*NEW ORDER PLACED - Jannat Ihram Ghar*\n`;
  text += `--------------------------------------\n`;
  text += `*Order ID:* ${order.orderNumber}\n`;
  text += `*Customer:* ${order.customerName}\n`;
  text += `*Phone:* ${order.customerPhone}\n`;
  text += `*Address:* ${order.deliveryAddress}, ${order.city}\n\n`;
  text += `*Ordered Items:*\n`;

  order.items.forEach((item, i) => {
    const varText = item.variant ? ` (${item.variant})` : '';
    text += `${i + 1}. ${item.name}${varText} x ${item.quantity} = PKR ${item.price * item.quantity}\n`;
  });

  text += `\n*Total Payable:* PKR ${order.total.toLocaleString()} (Cash on Delivery)\n`;
  text += `--------------------------------------\n`;
  text += `Thank you for shopping with Jannat Ihram Ghar!`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}