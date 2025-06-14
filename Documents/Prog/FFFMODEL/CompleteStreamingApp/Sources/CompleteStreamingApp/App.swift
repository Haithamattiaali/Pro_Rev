import SwiftUI

@main
struct CompleteStreamingApp: App {
    var body: some SwiftUI.Scene {
        WindowGroup {
            ContentView()
        }
        #if os(macOS)
        .windowStyle(.titleBar)
        .windowResizability(.contentSize)
        .defaultPosition(.center)
        .defaultSize(width: 900, height: 700)
        #endif
    }
}

struct ContentView: View {
    var body: some View {
        ZStack {
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture {
                    // Ensure window stays focused when clicking anywhere
                    #if os(macOS)
                    NSApp.windows.first?.makeKeyAndOrderFront(nil)
                    #endif
                }
            
            StreamingStoryView()
        }
        .frame(minWidth: 800, minHeight: 600)
        .onAppear {
            #if os(macOS)
            // Force the window to be key and focused
            DispatchQueue.main.async {
                NSApp.activate(ignoringOtherApps: true)
                if let window = NSApp.windows.first {
                    window.orderFrontRegardless()
                    window.makeKeyAndOrderFront(nil)
                    window.makeFirstResponder(window.contentView)
                    // Keep the app in foreground
                    NSApp.setActivationPolicy(.regular)
                }
            }
            #endif
        }
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in
            #if os(macOS)
            // Ensure window stays key when app becomes active
            NSApp.windows.first?.makeKeyAndOrderFront(nil)
            #endif
        }
    }
}