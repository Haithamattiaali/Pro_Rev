'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AtSign, Paperclip, Smile } from 'lucide-react';
import { User } from '@/types/auth';
import { Task } from '@/types/project';
import { useMentions, MentionSuggestions } from '@/hooks/useMentions';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface CommentBoxProps {
  task: Task;
  users: User[];
  onSubmit: (comment: string, mentions: string[]) => Promise<void>;
  placeholder?: string;
}

export function CommentBox({ 
  task, 
  users, 
  onSubmit, 
  placeholder = 'Add a comment... Use @ to mention someone' 
}: CommentBoxProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user: currentUser } = useAuth();

  const {
    showSuggestions,
    suggestions,
    selectedIndex,
    mentionPosition,
    handleTextChange,
    handleKeyDown,
    insertMention,
    setInputRef,
    getMentionedUsers,
    parseMentions,
  } = useMentions({
    users,
    onMention: (user) => {
      console.log('Mentioned user:', user.name);
    },
  });

  // Handle comment change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setComment(newValue);
    handleTextChange(newValue);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting || !currentUser) return;

    try {
      setIsSubmitting(true);

      // Get mentioned users
      const mentionedUsernames = parseMentions(comment);
      
      // Submit the comment
      await onSubmit(comment, mentionedUsernames);

      // Send mention notifications
      if (mentionedUsernames.length > 0) {
        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await notificationService.notifyMentions(
          comment,
          commentId,
          task,
          currentUser
        );
      }

      // Clear the comment
      setComment('');
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }

      toast.success('Comment posted');
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (user: User) => {
    insertMention(user);
    setComment(textareaRef.current?.value || '');
  };

  // Auto-resize textarea
  const handleTextareaResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="relative">
      <div className="bg-gray-50 rounded-lg border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <textarea
          ref={(ref) => {
            textareaRef.current = ref;
            setInputRef(ref);
          }}
          value={comment}
          onChange={handleCommentChange}
          onKeyDown={(e) => {
            handleKeyDown(e);
            
            // Submit on Enter (without Shift)
            if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          onInput={handleTextareaResize}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-transparent resize-none outline-none text-sm"
          rows={1}
          disabled={isSubmitting}
        />
        
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (textareaRef.current) {
                  const currentValue = textareaRef.current.value;
                  const caretPos = textareaRef.current.selectionStart || 0;
                  const newValue = 
                    currentValue.slice(0, caretPos) + '@' + currentValue.slice(caretPos);
                  
                  textareaRef.current.value = newValue;
                  textareaRef.current.setSelectionRange(caretPos + 1, caretPos + 1);
                  setComment(newValue);
                  handleTextChange(newValue, caretPos + 1);
                  textareaRef.current.focus();
                }
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Mention someone"
            >
              <AtSign className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {comment.length > 0 && `${comment.length} characters`}
            </span>
            
            <button
              onClick={handleSubmit}
              disabled={!comment.trim() || isSubmitting}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${comment.trim() && !isSubmitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mention Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <MentionSuggestions
              suggestions={suggestions}
              selectedIndex={selectedIndex}
              position={mentionPosition}
              onSelect={handleMentionSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mentioned Users Preview */}
      {comment && parseMentions(comment).length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <AtSign className="w-3 h-3" />
          <span>Mentioning: </span>
          <div className="flex items-center gap-1">
            {getMentionedUsers(comment).map((user) => (
              <span
                key={user.id}
                className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
              >
                {user.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}