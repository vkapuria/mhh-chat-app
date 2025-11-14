import { DriveStep } from 'driver.js';

export const expertTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to MyHomeworkHelp! 👋',
      description: 'Let\'s take a quick 2-minute tour to get you started. You can skip this anytime.',
    },
  },
  {
    element: '[data-tour="edit-profile"]',
    popover: {
      title: '⭐ Step 1: Set Up Your Profile',
      description: '<p class="mb-2">First things first! Click here to set up your profile.</p><p class="text-sm text-amber-600 font-medium">⚠️ Important: You can only change your avatar and display name once every 30 days, so choose carefully!</p>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="my-tasks"]',
    popover: {
      title: '📋 Step 2: View Your Tasks',
      description: 'Here you\'ll find all orders assigned to you. Click on any task to view requirements and details.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="messages"]',
    popover: {
      title: '💬 Step 3: Chat with Customers',
      description: '<p class="mb-2">This is where you communicate with customers about their orders.</p><p class="text-sm">When they\'re online, you\'ll see a green indicator next to their name!</p>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="earnings"]',
    popover: {
      title: '💰 Step 4: Track Your Earnings',
      description: 'View your completed tasks, earnings breakdown, and payment history here.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="support"]',
    popover: {
      title: '🎫 Step 5: Get Support',
      description: '<p class="mb-2">Need help from our team? Create a support ticket here.</p><p class="text-sm">All your requests are tracked in one place with status updates.</p>',
      side: 'right',
      align: 'start',
    },
  },
  {
    popover: {
      title: '🎉 You\'re All Set!',
      description: '<p class="mb-2">You\'re ready to start working on tasks and chatting with customers.</p><p class="text-sm text-gray-600">You can replay this tour anytime from your profile menu.</p>',
    },
  },
];

export const customerTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to MyHomeworkHelp! 👋',
      description: 'Let\'s take a quick 2-minute tour to show you around. You can skip this anytime.',
    },
  },
  {
    element: '[data-tour="edit-profile"]',
    popover: {
      title: '⭐ Step 1: Set Up Your Profile',
      description: '<p class="mb-2">Start by setting up your profile with an avatar and display name.</p><p class="text-sm text-amber-600 font-medium">⚠️ You can only change these once every 30 days, so choose carefully!</p>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="orders"]',
    popover: {
      title: '📦 Step 2: View Your Orders',
      description: 'All your homework orders are listed here. You can see status, deadlines, and assigned experts.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="messages"]',
    popover: {
      title: '💬 Step 3: Chat with Your Expert',
      description: '<p class="mb-2">Communicate directly with your assigned expert here.</p><p class="text-sm">Ask questions, share files, and get updates in real-time!</p>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="support"]',
    popover: {
      title: '🎫 Step 4: Contact Support',
      description: '<p class="mb-2">Need help from our support team? Create a ticket here.</p><p class="text-sm">Track all your support requests with status updates.</p>',
      side: 'right',
      align: 'start',
    },
  },
  {
    popover: {
      title: '🎉 You\'re Ready!',
      description: '<p class="mb-2">Start chatting with your expert and tracking your orders.</p><p class="text-sm text-gray-600">You can replay this tour anytime from your profile.</p>',
    },
  },
];