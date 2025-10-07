# Chat Mode Transformation Feature

## Overview
The landing page now transforms into a full-featured chat interface after the user selects a scenario and sends their first message. This provides a seamless onboarding experience that transitions from landing page to interactive chat.

## Key Features

### 1. **Auto-Resizing Textarea**
- The input textarea automatically grows and shrinks based on content
- Maximum height of 200px with scrolling for longer messages
- Resets to single line after sending
- Press Enter to send, Shift+Enter for new line

### 2. **Chat Mode Transformation**
When the user clicks a scenario and sends their first message:
- Landing page sections fade out (title, quick actions, features, etc.)
- Chat box expands to full height (calc(100vh - 120px))
- Interface transitions smoothly with CSS animations (500ms duration)
- Message history becomes scrollable
- Placeholder text changes from "Describe what you'd like to set up..." to "Type your message..."

### 3. **Full Chat Interface Features**
- **Auto-scroll**: Automatically scrolls to the latest message
- **Message History**: All messages are preserved and displayed
- **Continuous Conversation**: Users can send multiple messages
- **Mock Responses**: Assistant provides simulated responses (1 second delay)
- **Visual Feedback**: Messages styled differently for user vs assistant

### 4. **React Portal Dropdown**
- Prompt library dropdown uses React Portal to escape overflow constraints
- Positioned dynamically based on button location
- Closes on click outside
- Updates position on scroll

## Implementation Details

### State Management
```typescript
const [isChatMode, setIsChatMode] = useState(false);
const [messages, setMessages] = useState<ChatMessage[]>([]);
const textareaRef = useRef<HTMLTextAreaElement>(null);
const messagesEndRef = useRef<HTMLDivElement>(null);
```

### Key Functions
- **handleInputChange**: Auto-resizes textarea on input
- **handleSend**: 
  - In landing mode: transitions to chat mode with first message
  - In chat mode: adds message to conversation
- **Auto-scroll Effect**: Scrolls to bottom when new messages arrive

### Styling Approach
- Uses Tailwind CSS with conditional classes
- `cn()` utility for dynamic class names
- CSS transitions for smooth state changes
- Responsive design maintained in both modes

## User Flow

1. **Landing Page State**
   - User sees hero section, quick action buttons
   - Clicks a scenario button (visualize, protect, or monitor)
   - Template fills the textarea
   
2. **First Message**
   - User edits template or types custom message
   - Clicks send or presses Enter
   - Page transforms into chat mode
   
3. **Chat Mode**
   - All landing page sections hidden
   - Chat box fills available space
   - User can continue conversation
   - Textarea auto-resizes with each message
   - Automatic scroll to latest message

## Technical Notes

### Performance
- Smooth 500ms CSS transitions
- Efficient re-renders with React hooks
- Portal rendering for dropdowns prevents z-index issues

### Accessibility
- Keyboard navigation (Enter to send, Shift+Enter for newline)
- Proper focus management
- Semantic HTML structure maintained

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard React patterns
- CSS calc() for responsive heights
- Flexbox for layout

## Future Enhancements
- Real API integration instead of mock responses
- Message streaming/typing indicators
- File attachments
- Message editing/deletion
- Conversation persistence
- Export chat history
