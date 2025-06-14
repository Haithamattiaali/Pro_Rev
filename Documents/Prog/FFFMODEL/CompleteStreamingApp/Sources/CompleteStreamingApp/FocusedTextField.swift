import SwiftUI

#if os(macOS)
import AppKit

struct FocusedTextField: NSViewRepresentable {
    @Binding var text: String
    let placeholder: String
    @Binding var isFocused: Bool
    
    func makeNSView(context: Context) -> NSScrollView {
        let scrollView = NSScrollView()
        let textView = NSTextView()
        
        scrollView.documentView = textView
        scrollView.hasVerticalScroller = true
        scrollView.hasHorizontalScroller = false
        scrollView.autohidesScrollers = true
        scrollView.borderType = .bezelBorder
        
        textView.isEditable = true
        textView.isSelectable = true
        textView.allowsUndo = true
        textView.font = NSFont.systemFont(ofSize: 14)
        textView.textColor = NSColor.black
        textView.backgroundColor = NSColor.white
        textView.string = text
        textView.delegate = context.coordinator
        
        // Set placeholder
        if text.isEmpty {
            textView.string = placeholder
            textView.textColor = NSColor.placeholderTextColor
        }
        
        // Force focus
        DispatchQueue.main.async {
            textView.window?.makeFirstResponder(textView)
            textView.window?.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
        
        return scrollView
    }
    
    func updateNSView(_ nsView: NSScrollView, context: Context) {
        guard let textView = nsView.documentView as? NSTextView else { return }
        
        if textView.string != text {
            textView.string = text
        }
        
        if isFocused {
            DispatchQueue.main.async {
                textView.window?.makeFirstResponder(textView)
                NSApp.activate(ignoringOtherApps: true)
            }
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, NSTextViewDelegate {
        let parent: FocusedTextField
        
        init(_ parent: FocusedTextField) {
            self.parent = parent
        }
        
        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            
            // Handle placeholder
            if textView.textColor == NSColor.placeholderTextColor && !textView.string.isEmpty {
                textView.string = ""
                textView.textColor = NSColor.black
            }
            
            parent.text = textView.string
            parent.isFocused = true
        }
        
        func textDidBeginEditing(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            
            // Remove placeholder
            if textView.textColor == NSColor.placeholderTextColor {
                textView.string = ""
                textView.textColor = NSColor.black
            }
            
            parent.isFocused = true
            
            // Ensure window stays focused
            DispatchQueue.main.async {
                NSApp.activate(ignoringOtherApps: true)
                textView.window?.makeKeyAndOrderFront(nil)
            }
        }
        
        func textDidEndEditing(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            
            // Add placeholder if empty
            if textView.string.isEmpty {
                textView.string = parent.placeholder
                textView.textColor = NSColor.placeholderTextColor
            }
            
            parent.isFocused = false
        }
    }
}

#else
// iOS fallback
struct FocusedTextField: View {
    @Binding var text: String
    let placeholder: String
    @Binding var isFocused: Bool
    
    var body: some View {
        TextField(placeholder, text: $text, axis: .vertical)
            .textFieldStyle(.roundedBorder)
            .focused($isFocused)
    }
}
#endif