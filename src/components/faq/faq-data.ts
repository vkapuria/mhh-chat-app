export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const customerFAQs: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I track my orders?',
    answer: 'Navigate to the "Orders" page from the main menu. Here you can see all your orders with their current status (Pending, Assigned, In Progress, Completed). Click on any order to view detailed information including deadline, amount, and expert details.',
  },
  {
    category: 'Getting Started',
    question: 'How do I know when my order is assigned to an expert?',
    answer: 'You will receive an email notification as soon as an expert is assigned to your order. You can also check the "Orders" page where the status will change from "Pending" to "Assigned". The expert\'s name and details will be visible on the order card.',
  },
  {
    category: 'Getting Started',
    question: 'What do the different order statuses mean?',
    answer: 'Pending: Your order is waiting to be assigned to an expert. Assigned: An expert has been assigned and is working on your task. In Progress: Work is actively underway. Completed: Your work has been delivered. You can now download files and provide feedback.',
  },

  // Chat & Communication
  {
    category: 'Chat & Communication',
    question: 'How do I chat with my assigned expert?',
    answer: 'Go to the "Messages" page to see all your conversations. Click on any order to open the chat window. You can send text messages and the expert will be notified. Active chats are highlighted in green at the top of the list.',
  },
  {
    category: 'Chat & Communication',
    question: 'Can I see if the expert is online?',
    answer: 'Yes! When you open a chat, you\'ll see a status bar at the top showing "Expert Online" (green) or "Expert Offline" (red). You can also see typing indicators when the expert is composing a message.',
  },
  {
    category: 'Chat & Communication',
    question: 'How does the automatic notification system work?',
    answer: 'When you send a message and the expert is offline, the first message automatically sends an email notification. After that, there\'s a 1-hour cooldown before another email can be sent. During this time, your messages are queued and can be sent as a batch notification after the cooldown period.',
  },
  {
    category: 'Chat & Communication',
    question: 'What does "Emailed" status mean on my messages?',
    answer: 'Messages show different statuses: "Sent" means delivered to the chat, "Read" means the expert has seen it, and "Emailed" means the expert received an email notification about your message. Emailed status takes priority over the others.',
  },
  {
    category: 'Chat & Communication',
    question: 'Why do I see a notification banner in the chat?',
    answer: 'When the expert is offline and you\'ve already sent an email notification, a banner appears showing how many new messages you\'ve sent and when you can send another batch notification (after 1 hour). This prevents notification spam while ensuring the expert sees all your messages.',
  },
  {
    category: 'Chat & Communication',
    question: 'Can I send multiple messages before the expert responds?',
    answer: 'Yes! Send as many messages as needed. All messages are delivered to the chat immediately. If the expert is offline, your first message sends an email notification automatically. Additional messages will be counted and can be sent as a batch notification after the 1-hour cooldown.',
  },
  {
    category: 'Chat & Communication',
    question: 'Why do I see a privacy reminder in my chat?',
    answer: 'We show a privacy reminder to protect you. Click it anytime to review guidelines about not sharing personal information (full names, emails, phone numbers, addresses) in chat. All conversations are monitored in real-time for safety.',
  },
  {
    category: 'Chat & Communication',
    question: 'When does a chat close?',
    answer: 'Chats automatically close 48 hours after your order is marked as Completed. Once closed, you can still view the conversation history but cannot send new messages. If you need further assistance, you can create a support ticket.',
  },

  // Privacy & Safety
  {
    category: 'Privacy & Safety',
    question: 'Why does a privacy notice appear when I open chat?',
    answer: 'The first time each day you open the Messages page, a privacy notice reminds you of chat safety guidelines. This ensures you\'re aware of best practices for protecting your personal information during conversations.',
  },
  {
    category: 'Privacy & Safety',
    question: 'What information should I avoid sharing in chat?',
    answer: 'Never share: full names, email addresses, phone numbers, physical addresses, precise locations, or payment details outside the platform. Use display names only and keep all payments within our secure system.',
  },
  {
    category: 'Privacy & Safety',
    question: 'Are my chat conversations monitored?',
    answer: 'Yes, all conversations are monitored in real-time by our team to ensure safety, professionalism, and compliance with guidelines. This protects both customers and experts from inappropriate behavior or policy violations.',
  },
  {
    category: 'Privacy & Safety',
    question: 'What happens if I violate chat guidelines?',
    answer: 'Violations of chat guidelines (sharing personal info, offensive language, requesting outside payments) may result in warnings, chat restrictions, or account suspension depending on severity. Our monitoring team reviews all flagged conversations.',
  },

  // Support & Help
  {
    category: 'Support & Help',
    question: 'How do I get help if I have an issue?',
    answer: 'Click on "Support" in the main menu and then "Create Support Ticket". Select your order, choose the issue type (Quality, Deadline, Payment, Revision, or General), describe your problem, and submit. Our support team will respond within 24 hours.',
  },
  {
    category: 'Support & Help',
    question: 'What are the different support ticket types?',
    answer: 'Quality Concern: Issues with work quality. Deadline Issue: Late delivery or deadline concerns. Payment Question: Billing or payment queries. Revision Request: Need changes to completed work. General Inquiry: Any other questions or concerns.',
  },
  {
    category: 'Support & Help',
    question: 'How do I track my support tickets?',
    answer: 'All your tickets are listed on the Support page. Submitted tickets are in yellow, In Progress tickets are in blue, and Resolved tickets are in green. Click on any ticket to view the conversation with support staff and add replies.',
  },
  {
    category: 'Support & Help',
    question: 'Can I reopen a resolved ticket?',
    answer: 'Yes! If you reply to a resolved ticket, it will automatically reopen and change status to "In Progress". The support team will be notified of your new message.',
  },

  // Payments & Feedback
  {
    category: 'Payments & Feedback',
    question: 'How do I provide feedback on completed work?',
    answer: 'After your order is completed, you\'ll receive an email with a feedback link. You can also access it from the Orders page - completed orders will show a "Provide Feedback" prompt. Rate the expert on expertise, timeliness, and overall experience.',
  },
  {
    category: 'Payments & Feedback',
    question: 'Is my payment information secure?',
    answer: 'Yes, all payment information is processed through secure, encrypted channels. We never store your complete credit card details. All transactions comply with industry-standard security protocols.',
  },
];

export const expertFAQs: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I view my assigned orders?',
    answer: 'Navigate to the "Orders" page to see all tasks assigned to you. Orders are organized by status: Active (Assigned/In Progress), Pending, and Completed. Use the filter buttons at the top to quickly find specific orders.',
  },
  {
    category: 'Getting Started',
    question: 'What do I do when I receive a new assignment?',
    answer: 'You\'ll receive an email notification when assigned to an order. Review the order details including deadline, requirements, and customer notes. If you accept, start working and update the customer via chat. If you cannot complete it, contact support immediately.',
  },
  {
    category: 'Getting Started',
    question: 'How do I update my order status?',
    answer: 'Order statuses are managed by the admin team. Focus on delivering quality work on time and communicating with customers via chat. Once you upload the completed work to the system, admin will mark it as complete.',
  },

  // Chat & Communication
  {
    category: 'Chat & Communication',
    question: 'How do I communicate with customers?',
    answer: 'Go to "Messages" to see all your conversations. Click on any order to open the chat. You can send messages, and customers will be notified. Active chats appear at the top in green. Use the "Notify" button to send urgent messages via email.',
  },
  {
    category: 'Chat & Communication',
    question: 'Can I see if the customer is online?',
    answer: 'Yes! The chat window shows "Customer Online" (green bar) or "Customer Offline" (black bar with red dot) at the top. You\'ll also see typing indicators when they\'re composing a message.',
  },
  {
    category: 'Chat & Communication',
    question: 'How do automatic email notifications work for customers?',
    answer: 'When you send a message and the customer is offline, your first message automatically sends them an email notification. This ensures they see your message even when not actively using the platform. Additional messages are queued for batch notification.',
  },
  {
    category: 'Chat & Communication',
    question: 'What is the notification cooldown period?',
    answer: 'After sending an email notification to a customer, there\'s a 1-hour cooldown before another email can be sent. This prevents notification spam while ensuring customers receive important updates. Messages sent during cooldown are queued for batch notification.',
  },
  {
    category: 'Chat & Communication',
    question: 'How does batch notification work?',
    answer: 'If you send multiple messages while the customer is offline during the cooldown period, all unread messages will be bundled into one email notification once the cooldown expires. You\'ll see a banner with a "Send Notification" button when ready.',
  },
  {
    category: 'Chat & Communication',
    question: 'Why can\'t I send another email notification immediately?',
    answer: 'The 1-hour cooldown prevents overwhelming customers with multiple emails. Continue sending messages in chat - they\'ll receive everything when they come online, or as a batch notification after the cooldown. The banner shows your countdown timer.',
  },
  {
    category: 'Chat & Communication',
    question: 'What do the different message statuses mean?',
    answer: 'Messages show "Sent" (delivered to chat), "Read" (customer viewed it), or "Emailed" (customer received email notification). If a message was emailed, that status takes priority. This helps you track which messages definitely reached the customer.',
  },
  {
    category: 'Chat & Communication',
    question: 'When does the notification cooldown reset?',
    answer: 'The cooldown resets in two ways: 1) One hour passes since the last email notification, or 2) The customer comes online. When they\'re online, you can send a new notification immediately if they go offline again.',
  },
  {
    category: 'Chat & Communication',
    question: 'What happens to chat after order completion?',
    answer: 'Chats remain open for 48 hours after completion to handle any immediate questions. After that, they automatically close. You can still view chat history, but new messages cannot be sent.',
  },

  // Privacy & Safety
  {
    category: 'Privacy & Safety',
    question: 'What are the chat privacy guidelines?',
    answer: 'Never share or request: full names, email addresses, phone numbers, physical addresses, or precise locations. Do not ask for or offer payments outside the platform. Keep all communication professional, on-topic, and within our secure system.',
  },
  {
    category: 'Privacy & Safety',
    question: 'Why is there a privacy reminder in every chat?',
    answer: 'The privacy reminder in the chat header protects both you and customers. Click it anytime to review the complete guidelines. Following these rules ensures your account remains in good standing and protects everyone\'s safety.',
  },
  {
    category: 'Privacy & Safety',
    question: 'Are expert conversations monitored?',
    answer: 'Yes, all chat conversations are monitored in real-time by our compliance team. This protects both experts and customers from inappropriate behavior, policy violations, and ensures professional standards are maintained across the platform.',
  },
  {
    category: 'Privacy & Safety',
    question: 'What happens if I share personal information in chat?',
    answer: 'Sharing personal contact information violates our guidelines and may result in warnings, payment holds, or account suspension. All work and payments must remain within the platform to protect both parties and maintain quality standards.',
  },
  {
    category: 'Privacy & Safety',
    question: 'Can I contact customers outside the platform?',
    answer: 'No, all communication must happen within our chat system. This protects you legally, ensures proper record-keeping, maintains quality standards, and guarantees you receive payment for completed work. Outside communication violates our terms of service.',
  },

  // Earnings & Payments
  {
    category: 'Earnings & Payments',
    question: 'How do I check my earnings?',
    answer: 'Visit the "Earnings" page to see your complete payment history. View total earnings, pending payments, and completed payments. Each entry shows the order ID, amount, date, and payment status.',
  },
  {
    category: 'Earnings & Payments',
    question: 'When will I receive payment for completed work?',
    answer: 'Payments are processed according to the schedule communicated to you during onboarding. Completed orders move from "Pending" to "Paid" status once payment is transferred. Check your Earnings page for exact dates and amounts.',
  },
  {
    category: 'Earnings & Payments',
    question: 'Where can I see my fee for each order?',
    answer: 'Your expert fee is shown on each order card in the Orders page (displayed in green). You can also see it in the order details and in your Earnings page once the order is completed.',
  },

  // Support & Issues
  {
    category: 'Support & Issues',
    question: 'What if I cannot meet a deadline?',
    answer: 'Contact support IMMEDIATELY via the Support page. Create a ticket, select "Deadline Issue", and explain the situation. The earlier you notify us, the better we can help find a solution or reassign if necessary.',
  },
  {
    category: 'Support & Issues',
    question: 'How do I handle revision requests?',
    answer: 'If a customer requests revisions through support, you\'ll be notified. Review the revision request carefully, and complete it within the specified timeframe. Communicate progress via chat. Quality revisions are expected for customer satisfaction.',
  },
  {
    category: 'Support & Issues',
    question: 'What if I have a question about an order?',
    answer: 'First, try messaging the customer directly via chat for clarifications. For administrative issues, payment questions, or conflicts, create a support ticket. Select the relevant order and issue type, and our team will assist you.',
  },

  // Best Practices
  {
    category: 'Best Practices',
    question: 'How can I maintain good communication with customers?',
    answer: 'Respond promptly to messages, provide regular updates on progress, use the Notify button for important updates, clarify requirements early, and inform customers of any potential delays immediately. Good communication leads to better ratings and repeat assignments.',
  },
  {
    category: 'Best Practices',
    question: 'What should I do if requirements are unclear?',
    answer: 'Message the customer via chat immediately with specific questions. Don\'t assume or guess - clear requirements prevent revisions and ensure customer satisfaction. Use the Notify button to ensure they see your questions quickly.',
  },
];

// Group FAQs by category
export function groupByCategory(faqs: FAQItem[]) {
  const grouped = new Map<string, FAQItem[]>();
  
  faqs.forEach((faq) => {
    if (!grouped.has(faq.category)) {
      grouped.set(faq.category, []);
    }
    grouped.get(faq.category)!.push(faq);
  });
  
  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}