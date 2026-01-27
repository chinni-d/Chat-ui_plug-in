# @dmanikanta17/chat-ui

A modern, highly customizable, and responsive Chat UI component for React applications. This plugin is designed to help you get started with an AI Agent Chatbot in minutes.

**Now with support for vanilla HTML websites!**

## 🚀 Features

- **Easy Integration**: Drop-in component for React or plain HTML.
- **Real-time Streaming**: Built-in support for streaming AI responses.
- **Markdown Support**: Renders Markdown content with syntax highlighting.
- **Responsive Design**: Works seamlessly on desktop and mobile configurations.
- **Customizable**: Extensive options to match your brand's look and feel.
- **Interactive**: Notifications, sound effects, and smooth animations.
- **Voice Input**: Integrated speech-to-text for hands-free messaging.
- **Smart Controls**: Stop generation and feedback system.

---

## 📦 Installation & Usage

You can use this package in a **React** application or directly in an **HTML** website.

### Option 1: React Application

#### 1. Install via npm
```bash
npm install @dmanikanta17/chat-ui
```

#### 2. Import styles
In your root layout or component (e.g., `App.tsx`, `layout.tsx`):
```tsx
import "@dmanikanta17/chat-ui/styles.css";
```

#### 3. Add the Component
Import and use the `ChatUI` component. The only required prop is `endpoint`.

```tsx
"use client";
import { ChatUI } from "@dmanikanta17/chat-ui";

export function AIWidget() {
  return (
    <ChatUI 
      endpoint="https://your-api-domain.com/api/chat"
      title="Support Assistant"
    />
  );
}
```

---

### Option 2: HTML Website

You can adds this chat widget to any static HTML website using our CDN.

**[Live Preview Here](https://dmanikanta-ai-plugin.vercel.app/)**

#### 1. Add CSS
Add this line inside the `<head>` tag:
```html
<link rel="stylesheet" href="https://dmanikanta-ai-plugin.vercel.app/chat-ui-widget.css">
```

#### 2. Add Container
Add an empty container where the widget should be mounted (usually at the end of `<body>`):
```html
<div id="chat-widget"></div>
```

#### 3. Add Script
Add the script tag at the end of your `<body>`:
```html
<script src="https://dmanikanta-ai-plugin.vercel.app/chat-ui-widget.js"></script>
```

#### 4. Initialize
Initialize the widget with your configuration:
```html
<script>
  window.mountChatUI('chat-widget', {
    endpoint: 'https://your-api-endpoint.com/chat',
    title: 'Support Chat',
    welcomeMessage: 'Hello! How can we help you today?',
    description: 'We typically reply in a few minutes.',
    logoSrc: 'https://cdn-icons-png.flaticon.com/512/6134/6134346.png',
    theme: 'light', // 'dark' or 'auto'
    footerText: 'Powered by Custom RAG'
  });
</script>
```

---

## ⚙️ Configuration

These options work for both the **React Component props** and the **HTML Widget config object**.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `endpoint` | `string` | **Required** | The backend API URL for chat requests. |
| `title` | `string` | `"AI Assistant"` | Title displayed in the chat header. |
| `welcomeMessage` | `string` | `"Welcome..."` | Initial greeting in the notification bubble. |
| `description` | `string` | `"I'm here..."` | Subtitle text under the welcome message. |
| `inputPlaceholder` | `string` | `"Message"` | Placeholder text for the input area. |
| `logoSrc` | `string` | `Default Logo` | URL for the chatbot avatar. |
| `soundSrc` | `string` | `Default Sound` | URL for the notification sound. |
| `theme` | `"light" \| "dark" \| "auto"` | `"light"` | Color theme of the interface. |
| `position` | `"right" \| "left"` | `"right"` | Position of the chat widget on screen. |
| `footerText` | `ReactNode` | `Default Footer` | Text to display in the footer. |

### React Example with Full Customization
```tsx
<ChatUI 
  endpoint="https://api.myapp.com/api/chat"
  title="Support Bot"
  welcomeMessage="Hi there! Need help?"
  description="Ask me anything about our products."
  inputPlaceholder="Type your question..."
  logoSrc="/assets/bot-avatar.png"
  theme="dark"
/>
```

---

## 🧠 Configure RAG Pipeline

To make your chatbot intelligent and capable of answering questions based on your specific data (like your website content, personal pages, or documentation), you need to set up a RAG (Retrieval-Augmented Generation) pipeline.

This **Chat UI** handles the frontend. For the backend:

1.  **Visit**: [services.dmanikanta.me](https://services.dmanikanta.me)
2.  **Select Integration**: Choose your data source (Website, Portfolio, Documentation, etc.).
3.  **Get Endpoint**: Receive your unique API endpoint.
4.  **Connect**: Pass that endpoint to the `ChatUI` component (or HTML widget).

This service transforms your static content into an interactive AI agent.

---

## 🤝 Support

For support or questions, please contact me at: **darapureddymanikanta8@gmail.com**

---
Made with 💛 by [Manikanta Darapureddy](https://www.dmanikanta.me)
