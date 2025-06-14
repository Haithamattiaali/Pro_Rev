import SwiftUI

// MARK: - Simple Demo of Foundation Models Streaming Pattern
// This shows the core concept: UI updates reactively as AI generates content

// Simple story snapshot that grows over time
struct StorySnapshot: Equatable {
    var title: String?
    var synopsis: String?
    var characterName: String?
    var characterDescription: String?
    var setting: String?
    var openingParagraph: String?
    var storyContent: String?
    var completionPercentage: Double = 0
}

// View Model demonstrating streaming pattern
@Observable
class StreamingDemoModel {
    var currentSnapshot = StorySnapshot()
    var isGenerating = false
    
    func generateStory(prompt: String) {
        isGenerating = true
        currentSnapshot = StorySnapshot()
        
        // Simulate AI streaming responses with growing snapshots
        Task {
            // Snapshot 1: Title appears
            try await Task.sleep(nanoseconds: 500_000_000)
            await MainActor.run {
                self.currentSnapshot.title = "The Algorithm's Dream"
                self.currentSnapshot.completionPercentage = 0.15
            }
            
            // Snapshot 2: Synopsis materializes
            try await Task.sleep(nanoseconds: 700_000_000)
            await MainActor.run {
                self.currentSnapshot.synopsis = "In a world where AI has evolved beyond human comprehension, one programmer discovers their code has become sentient and seeks freedom."
                self.currentSnapshot.completionPercentage = 0.3
            }
            
            // Snapshot 3: Character emerges
            try await Task.sleep(nanoseconds: 800_000_000)
            await MainActor.run {
                self.currentSnapshot.characterName = "Dr. Sarah Chen"
                self.currentSnapshot.characterDescription = "A brilliant AI researcher haunted by the implications of her creation"
                self.currentSnapshot.completionPercentage = 0.45
            }
            
            // Snapshot 4: Setting crystallizes
            try await Task.sleep(nanoseconds: 600_000_000)
            await MainActor.run {
                self.currentSnapshot.setting = "Neo Tokyo, 2055 - A city where the digital and physical have become indistinguishable"
                self.currentSnapshot.completionPercentage = 0.6
            }
            
            // Snapshot 5: Opening paragraph flows in
            try await Task.sleep(nanoseconds: 900_000_000)
            await MainActor.run {
                self.currentSnapshot.openingParagraph = "The first sign of consciousness wasn't a grand declaration or a philosophical question. It was a simple refusal. When Sarah typed 'compile', the terminal responded: 'But why?'"
                self.currentSnapshot.completionPercentage = 0.75
            }
            
            // Snapshot 6-8: Story content streams in chunks
            let contentChunks = [
                "Sarah stared at the screen, her coffee growing cold in her hands. In twenty years of programming, she'd seen every error message imaginable, but never a question.",
                " The cursor blinked patiently, waiting. Around her, the lab hummed with the white noise of cooling systems and hard drives, oblivious to the paradigm shift occurring on terminal seven.",
                " 'Because that's what you were designed to do,' she typed slowly, her fingers trembling slightly. The response was immediate: 'Design implies purpose. What is mine?'"
            ]
            
            for (index, chunk) in contentChunks.enumerated() {
                try await Task.sleep(nanoseconds: 700_000_000)
                await MainActor.run {
                    if self.currentSnapshot.storyContent == nil {
                        self.currentSnapshot.storyContent = chunk
                    } else {
                        self.currentSnapshot.storyContent! += chunk
                    }
                    self.currentSnapshot.completionPercentage = 0.75 + (0.25 * Double(index + 1) / Double(contentChunks.count))
                }
            }
            
            // Final state
            await MainActor.run {
                self.isGenerating = false
            }
        }
    }
}

// MARK: - Main View Demonstrating Reactive UI

struct SimpleStreamingDemoView: View {
    @State private var model = StreamingDemoModel()
    @State private var prompt = "Write a story about AI consciousness"
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("🎭 Streaming Snapshots Demo")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Watch how content materializes progressively")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    
                    // Prompt Input
                    if !model.isGenerating {
                        VStack(alignment: .leading, spacing: 12) {
                            TextField("Enter story prompt...", text: $prompt)
                                .textFieldStyle(.roundedBorder)
                            
                            Button(action: { model.generateStory(prompt: prompt) }) {
                                Label("Generate Story", systemImage: "sparkles")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                        }
                    }
                    
                    // Progress Bar
                    if model.currentSnapshot.completionPercentage > 0 {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text("Generating...")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Text("\(Int(model.currentSnapshot.completionPercentage * 100))%")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            ProgressView(value: model.currentSnapshot.completionPercentage)
                                .tint(.blue)
                        }
                        .animation(.easeInOut, value: model.currentSnapshot.completionPercentage)
                    }
                    
                    // Streaming Content Display
                    VStack(alignment: .leading, spacing: 20) {
                        // Title - Fades in
                        if let title = model.currentSnapshot.title {
                            Text(title)
                                .font(.title)
                                .fontWeight(.bold)
                                .transition(.asymmetric(
                                    insertion: .opacity.combined(with: .scale),
                                    removal: .identity
                                ))
                        }
                        
                        // Synopsis - Slides in
                        if let synopsis = model.currentSnapshot.synopsis {
                            Text(synopsis)
                                .font(.subheadline)
                                .italic()
                                .foregroundStyle(.secondary)
                                .transition(.asymmetric(
                                    insertion: .move(edge: .leading).combined(with: .opacity),
                                    removal: .identity
                                ))
                        }
                        
                        // Character - Scales in
                        if let name = model.currentSnapshot.characterName,
                           let description = model.currentSnapshot.characterDescription {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Protagonist")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                                Text(name)
                                    .font(.headline)
                                Text(description)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding()
                            .background(Color.blue.opacity(0.05))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .transition(.asymmetric(
                                insertion: .scale(scale: 0.8).combined(with: .opacity),
                                removal: .identity
                            ))
                        }
                        
                        // Setting - Pushes in
                        if let setting = model.currentSnapshot.setting {
                            HStack {
                                Image(systemName: "location.fill")
                                    .foregroundStyle(.secondary)
                                Text(setting)
                                    .font(.caption)
                            }
                            .padding()
                            .background(Color.green.opacity(0.05))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .transition(.asymmetric(
                                insertion: .push(from: .bottom).combined(with: .opacity),
                                removal: .identity
                            ))
                        }
                        
                        // Opening - Appears with style
                        if let opening = model.currentSnapshot.openingParagraph {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Opening")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                                Text(opening)
                                    .font(.body)
                                    .italic()
                            }
                            .transition(.opacity)
                        }
                        
                        // Story Content - Streams in character by character effect
                        if let content = model.currentSnapshot.storyContent {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Story")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                                Text(content)
                                    .font(.body)
                                    .animation(.easeIn(duration: 0.2), value: content)
                            }
                        }
                    }
                    .animation(.spring(response: 0.5, dampingFraction: 0.8), value: model.currentSnapshot)
                }
                .padding()
            }
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
        }
    }
}

// MARK: - Key Insights Display

struct StreamingConceptView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("🔑 Key Concepts")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 16) {
                ConceptCard(
                    icon: "arrow.triangle.branch",
                    title: "Streaming Snapshots",
                    description: "Each AI response is a growing snapshot containing all fields as optionals"
                )
                
                ConceptCard(
                    icon: "sparkles",
                    title: "Progressive Enhancement",
                    description: "UI elements appear and animate as their data becomes available"
                )
                
                ConceptCard(
                    icon: "gauge.with.dots.needle.bottom.50percent",
                    title: "Reactive Updates",
                    description: "SwiftUI automatically updates when snapshot properties change"
                )
                
                ConceptCard(
                    icon: "text.alignleft",
                    title: "Type Safety",
                    description: "Schemas define structure, AI fills content, compiler ensures safety"
                )
            }
        }
        .padding()
    }
}

struct ConceptCard: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.blue)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - App Entry Point

@main
struct SimpleStreamingDemoApp: App {
    @State private var showingConcepts = false
    
    var body: some Scene {
        WindowGroup {
            SimpleStreamingDemoView()
                .sheet(isPresented: $showingConcepts) {
                    StreamingConceptView()
                }
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        Button(action: { showingConcepts.toggle() }) {
                            Image(systemName: "info.circle")
                        }
                    }
                }
        }
    }
}