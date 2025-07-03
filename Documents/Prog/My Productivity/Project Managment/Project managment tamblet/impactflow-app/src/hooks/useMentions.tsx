import { useState, useCallback, useRef, useEffect } from 'react';
import { User } from '@/types/auth';

interface UseMentionsProps {
  users: User[];
  onMention?: (user: User) => void;
}

interface MentionSuggestion {
  user: User;
  startIndex: number;
  endIndex: number;
  query: string;
}

export function useMentions({ users, onMention }: UseMentionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentMention, setCurrentMention] = useState<MentionSuggestion | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  // Parse text for mentions
  const parseMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }, []);

  // Get caret position
  const getCaretPosition = useCallback(() => {
    if (!inputRef.current) return 0;
    return inputRef.current.selectionStart || 0;
  }, []);

  // Handle text change
  const handleTextChange = useCallback((text: string, caretPosition?: number) => {
    const position = caretPosition ?? getCaretPosition();
    
    // Check if we're in a mention context
    let mentionStart = -1;
    let mentionQuery = '';
    
    // Look backwards from caret position for @
    for (let i = position - 1; i >= 0; i--) {
      const char = text[i];
      
      if (char === '@') {
        mentionStart = i;
        mentionQuery = text.substring(i + 1, position);
        break;
      } else if (char === ' ' || char === '\n') {
        // Stop if we hit whitespace before finding @
        break;
      }
    }
    
    if (mentionStart !== -1 && mentionQuery !== undefined) {
      // Filter users based on query
      const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(mentionQuery.toLowerCase())
      );
      
      setSuggestions(filteredUsers);
      setShowSuggestions(filteredUsers.length > 0);
      setSelectedIndex(0);
      
      // Calculate position for suggestions dropdown
      if (inputRef.current) {
        // This is a simplified position calculation
        // In a real implementation, you'd calculate based on text metrics
        setMentionPosition({
          top: 30, // Below the input
          left: 0,
        });
      }
      
      setCurrentMention({
        user: filteredUsers[0],
        startIndex: mentionStart,
        endIndex: position,
        query: mentionQuery,
      });
    } else {
      setShowSuggestions(false);
      setCurrentMention(null);
    }
  }, [users, getCaretPosition]);

  // Insert mention
  const insertMention = useCallback((user: User) => {
    if (!inputRef.current || !currentMention) return;
    
    const text = inputRef.current.value;
    const before = text.substring(0, currentMention.startIndex);
    const after = text.substring(currentMention.endIndex);
    const mention = `@${user.name.replace(/\s+/g, '_')}`;
    
    const newText = before + mention + ' ' + after;
    const newCaretPosition = currentMention.startIndex + mention.length + 1;
    
    // Update input value
    inputRef.current.value = newText;
    
    // Set caret position
    inputRef.current.setSelectionRange(newCaretPosition, newCaretPosition);
    
    // Trigger change event
    const event = new Event('input', { bubbles: true });
    inputRef.current.dispatchEvent(event);
    
    // Hide suggestions
    setShowSuggestions(false);
    setCurrentMention(null);
    
    // Callback
    if (onMention) {
      onMention(user);
    }
  }, [currentMention, onMention]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
        
      case 'Enter':
      case 'Tab':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, insertMention]);

  // Set input ref
  const setInputRef = useCallback((ref: HTMLTextAreaElement | HTMLInputElement | null) => {
    inputRef.current = ref;
  }, []);

  // Get mentioned users from text
  const getMentionedUsers = useCallback((text: string): User[] => {
    const mentionNames = parseMentions(text);
    return mentionNames
      .map(name => users.find(u => u.name.replace(/\s+/g, '_') === name))
      .filter(Boolean) as User[];
  }, [users, parseMentions]);

  // Format text with mention highlights
  const formatTextWithMentions = useCallback((text: string): React.ReactNode[] => {
    const mentionRegex = /@(\w+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add mention
      const mentionName = match[1];
      const user = users.find(u => u.name.replace(/\s+/g, '_') === mentionName);
      
      if (user) {
        parts.push(
          <span key={match.index} className="text-blue-600 font-medium">
            @{user.name}
          </span>
        );
      } else {
        parts.push(match[0]);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts;
  }, [users]);

  return {
    // State
    showSuggestions,
    suggestions,
    selectedIndex,
    mentionPosition,
    
    // Methods
    handleTextChange,
    handleKeyDown,
    insertMention,
    setInputRef,
    getMentionedUsers,
    formatTextWithMentions,
    parseMentions,
  };
}

// Mention suggestions component
interface MentionSuggestionsProps {
  suggestions: User[];
  selectedIndex: number;
  position: { top: number; left: number } | null;
  onSelect: (user: User) => void;
}

export function MentionSuggestions({
  suggestions,
  selectedIndex,
  position,
  onSelect,
}: MentionSuggestionsProps) {
  if (!position || suggestions.length === 0) return null;
  
  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '200px',
      }}
    >
      {suggestions.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={`
            w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100
            ${index === selectedIndex ? 'bg-blue-50' : ''}
          `}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </button>
      ))}
    </div>
  );
}