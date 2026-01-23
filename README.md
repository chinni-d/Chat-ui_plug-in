# @dmanikanta17/chat-ui

A modern, highly customizable, and responsive Chat UI component for React applications. This plugin is designed to help you get started with an AI Agent Chatbot in minutes.

## 🚀 Features

- **Easy Integration**: Drop-in component for any React project.
- **Real-time Streaming**: Built-in support for streaming AI responses.
- **Markdown Support**: Renders Markdown content with syntax highlighting.
- **Responsive Design**: Works seamlessly on desktop and mobile configurations.
- **Customizable**: extensive props to match your brand's look and feel.
- **Interactive**: Notifications, sound effects, and smooth animations.

## 📦 Installation

Install the package via npm:

```bash
npm install @dmanikanta17/chat-ui
```

## 🛠️ Usage

### 1. Import necessary files

In your React component (e.g., `App.tsx` or `layout.tsx`), import the `ChatUI` component and the necessary CSS styles.

```tsx
import { ChatUI } from "@dmanikanta17/chat-ui";
import "@dmanikanta17/chat-ui/styles.css";
```

### 2. Add the Component

Add the `<ChatUI />` component to your application tree. The only required prop is `endpoint`, which points to your backend API.

```tsx
 "use client";
 import {ChatUI} from "@dmanikanta17/chat-ui"
 import "@dmanikanta17/chat-ui/styles.css"

 export function Rag(){
   return (
     <ChatUI endpoint="https://your-api-domain.com/api/chat" />
   )
 }
```

## ⚙️ Customization

The `ChatUI` component provides various props to customize the appearance and behavior of the chatbot.

### Available Props

| Prop | Type | Required | Default | Description |
|------|------|:--------:|---------|-------------|
| `endpoint` | `string` | ✅ | - | The backend API URL for sending chat requests. |
| `logoSrc` | `string` | ❌ | `DEFAULT_LOGO` | URL for the chatbot avatar/logo image. |
| `soundSrc` | `string` | ❌ | `DEFAULT_SOUND` | URL for the notification sound played when a message arrives. |
| `title` | `string` | ❌ | `"AI Assistant"` | The title displayed in the chat header. |
| `welcomeMessage` | `string` | ❌ | `"Welcome..."` | The initial greeting message shown in the notification bubble. |
| `description` | `string` | ❌ | `"I'm here..."` | A short description text under the welcome message. |
| `footerText` | `ReactNode` | ❌ | `Default Footer` | Custom text or JSX to display in the footer of the chat window. |
| `inputPlaceholder` | `string` | ❌ | `"Message"` | Placeholder text for the input text area. |
| `theme` | `"light" \| "dark"` | ❌ | `"light"` | The color theme of the chat UI. |

### Example with customizations

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


## 🧠 Configure RAG Pipeline

To make your chatbot intelligent and capable of answering questions based on your specific data (like your website content, personal pages, or documentation), you need to set up a RAG (Retrieval-Augmented Generation) pipeline.

This **Chat UI** handles the frontend experience. For the backend and to integrate your own data sources:

1.  **Visit**: [services.dmanikanta.me](https://services.dmanikanta.me)
2.  **Select Integration**: Choose the type of integration you need (Website, Personal Portfolio, Documentation, etc.).
3.  **Get Endpoint**: Once configured, you will receive a unique API endpoint.
4.  **Connect**: Pass that endpoint to the `<ChatUI />` component as shown in the usage section.

This service allows you to easily transform your static content into an interactive AI agent.

## 🤝 Support

For support or questions, please contact me at: **darapureddymanikanta8@gmail.com**

---
Made with 💛 by [Manikanta Darapureddy](https://www.dmanikanta.me)
