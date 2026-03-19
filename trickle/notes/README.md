# CodeGen AI

A ChatGPT-like code generator application built with React and Tailwind CSS, featuring multi-language support (English, Tamil, Russian, Japanese) and database persistence.

## Features
- **Code Generation**: Uses AI to generate code snippets based on user prompts.
- **Multi-language**: UI and AI response support for English, Tamil, Russian, and Japanese.
- **Smart Context**: AI remembers previous messages in the conversation to provide better responses.
- **Resilient AI**: Built-in retry mechanism for stable API calls.
- **Syntax Highlighting**: Custom implementation for clean code block display.
- **Responsive Design**: Mobile-friendly sidebar and chat interface.
- **Dark Mode**: Built with a developer-friendly dark theme.
- **Chat History**: Persistent storage of chat sessions and messages using Trickle Database.

## Architecture
- `index.html`: Entry point, Tailwind theme, and global script imports.
- `app.js`: Main application logic, state management, and routing logic.
- `components/`: 
  - `Sidebar.js`: Navigation and chat history list.
  - `ChatInterface.js`: Main chat area with message input and display.
  - `MessageItem.js`: Individual message component with code rendering.
- `utils/`: 
  - `db.js`: Database interaction layer with pagination support.
  - `helpers.js`: Text parsing utilities.
  - `i18n.js`: Translation dictionaries for supported languages.

## Maintenance
- When updating the app, ensure `utils/i18n.js` is updated if new text elements are added to keep the multilingual support consistent.