import SwiftUI
// NOTE: This is a conceptual example showing how Foundation Models framework SHOULD work
// The actual FoundationModels framework is not yet publicly available

// MARK: - @Generable Schema Definitions
// These define what we want the AI to generate

@Generable
struct StorySnapshot {
    @Guide("A compelling story title")
    var title: String?
    
    @Guide("Brief story synopsis, 2-3 sentences")
    var synopsis: String?
    
    @Guide("Main character details")
    var protagonist: CharacterInfo?
    
    @Guide("Story setting description")
    var setting: SettingInfo?
    
    @Guide("Opening scene content")
    var openingScene: String?
    
    @Guide("Current story content being written")
    var content: String?
    
    @Guide("Emotional tone", validValues: ["uplifting", "mysterious", "thrilling", "romantic", "comedic"])
    var tone: String?
    
    @Guide("Estimated completion percentage", validValues: 0...100)
    var completionPercentage: Int?
}

@Generable
struct CharacterInfo {
    @Guide("Character's full name")
    var name: String
    
    @Guide("Age in years", validValues: 1...120)
    var age: Int
    
    @Guide("Brief physical description")
    var appearance: String
    
    @Guide("Core personality traits, max 3")
    var traits: [String]
    
    @Guide("Character's main goal")
    var motivation: String
}

@Generable
struct SettingInfo {
    @Guide("Location name")
    var location: String
    
    @Guide("Time period or era")
    var timePeriod: String
    
    @Guide("Atmospheric description")
    var atmosphere: String
    
    @Guide("Unique features of this world")
    var uniqueElements: [String]
}

// MARK: - Streaming Story View Model
// This demonstrates the Foundation Models streaming pattern

@Observable
class FoundationModelsStoryModel {
    // The AI session (conceptual - would be SystemLanguageModel.Session)
    private var session: MockAISession?
    
    // Current story snapshot
    var currentSnapshot: StorySnapshot.PartiallyGenerated?
    
    // Generation state
    var isGenerating = false
    var error: Error?
    
    init() {
        Task {
            await setupSession()
        }
    }
    
    func setupSession() async {
        // In real implementation:
        // session = try await SystemLanguageModel.Session(
        //     instructions: "You are a creative storyteller. Generate engaging stories with rich characters and vivid settings."
        // )
        session = MockAISession()
    }
    
    func generateStory(from prompt: String) {
        guard let session = session else { return }
        
        isGenerating = true
        currentSnapshot = nil
        error = nil
        
        Task {
            do {
                // In real implementation, this would be:
                // for try await snapshot in session.streamResponse(prompt, responseType: StorySnapshot.self) {
                //     await MainActor.run {
                //         self.currentSnapshot = snapshot
                //     }
                // }
                
                // Simulated streaming with growing snapshots
                for try await snapshot in session.mockStreamResponse(prompt) {
                    await MainActor.run {
                        self.currentSnapshot = snapshot
                    }
                }
                
                await MainActor.run {
                    self.isGenerating = false
                }
            } catch {
                await MainActor.run {
                    self.error = error
                    self.isGenerating = false
                }
            }
        }
    }
}

// MARK: - Main View Showing Streaming UI Pattern

struct FoundationModelsExampleView: View {
    @State private var model = FoundationModelsStoryModel()
    @State private var prompt = "Write a story about a programmer who discovers their code can alter reality"
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Foundation Models Streaming")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Watch as AI generates a story through streaming snapshots")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.bottom)
                    
                    // Prompt Input
                    if !model.isGenerating {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Story Prompt")
                                .font(.headline)
                            
                            TextField("Enter your story idea...", text: $prompt, axis: .vertical)
                                .textFieldStyle(.roundedBorder)
                                .lineLimit(2...4)
                            
                            Button(action: { model.generateStory(from: prompt) }) {
                                Label("Generate Story", systemImage: "sparkles")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                        }
                    }
                    
                    // Streaming Content Display
                    if let snapshot = model.currentSnapshot {
                        StreamingStoryDisplay(snapshot: snapshot)
                    }
                    
                    // Generation Status
                    if model.isGenerating {
                        HStack {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("AI is generating...")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
                .padding()
            }
        }
    }
}

// MARK: - Streaming Story Display Component

struct StreamingStoryDisplay: View {
    let snapshot: StorySnapshot.PartiallyGenerated
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Title - Appears first
            if let title = snapshot.title {
                Text(title)
                    .font(.title)
                    .fontWeight(.bold)
                    .transition(.asymmetric(
                        insertion: .push(from: .top).combined(with: .opacity),
                        removal: .identity
                    ))
            }
            
            // Synopsis - Appears second
            if let synopsis = snapshot.synopsis {
                Text(synopsis)
                    .font(.subheadline)
                    .italic()
                    .foregroundStyle(.secondary)
                    .transition(.asymmetric(
                        insertion: .slide.combined(with: .opacity),
                        removal: .identity
                    ))
            }
            
            // Tone indicator
            if let tone = snapshot.tone {
                Label(tone.capitalized, systemImage: "sparkles")
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.purple.opacity(0.1))
                    .clipShape(Capsule())
                    .transition(.scale.combined(with: .opacity))
            }
            
            // Character - Materializes third
            if let character = snapshot.protagonist {
                CharacterInfoView(character: character)
                    .transition(.asymmetric(
                        insertion: .move(edge: .leading).combined(with: .opacity),
                        removal: .identity
                    ))
            }
            
            // Setting - Builds fourth
            if let setting = snapshot.setting {
                SettingInfoView(setting: setting)
                    .transition(.asymmetric(
                        insertion: .scale(scale: 0.8).combined(with: .opacity),
                        removal: .identity
                    ))
            }
            
            // Story Content - Streams in progressively
            if let content = snapshot.content {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Story")
                            .font(.headline)
                        
                        if let percentage = snapshot.completionPercentage {
                            Text("\\(percentage)%")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    Text(content)
                        .font(.body)
                        .animation(.easeInOut(duration: 0.3), value: content)
                }
                .transition(.opacity)
            }
            
            // Progress visualization
            if let percentage = snapshot.completionPercentage {
                ProgressView(value: Double(percentage), total: 100)
                    .tint(.blue)
                    .animation(.spring(), value: percentage)
            }
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: snapshot)
    }
}

// MARK: - Component Views

struct CharacterInfoView: View {
    let character: CharacterInfo.PartiallyGenerated
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Protagonist")
                .font(.headline)
                .foregroundStyle(.secondary)
            
            VStack(alignment: .leading, spacing: 8) {
                if let name = character.name, let age = character.age {
                    HStack {
                        Text(name)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        Text("• \\(age) years old")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                
                if let appearance = character.appearance {
                    Text(appearance)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                if let traits = character.traits, !traits.isEmpty {
                    HStack {
                        ForEach(traits, id: \\.self) { trait in
                            Text(trait)
                                .font(.caption2)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.blue.opacity(0.1))
                                .clipShape(Capsule())
                        }
                    }
                }
                
                if let motivation = character.motivation {
                    HStack {
                        Image(systemName: "target")
                            .font(.caption)
                            .foregroundStyle(.orange)
                        Text(motivation)
                            .font(.caption)
                            .italic()
                    }
                }
            }
            .padding()
            .background(Color.gray.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

struct SettingInfoView: View {
    let setting: SettingInfo.PartiallyGenerated
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Setting")
                .font(.headline)
                .foregroundStyle(.secondary)
            
            VStack(alignment: .leading, spacing: 8) {
                if let location = setting.location {
                    Label(location, systemImage: "location.fill")
                        .font(.subheadline)
                }
                
                if let timePeriod = setting.timePeriod {
                    Label(timePeriod, systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                if let atmosphere = setting.atmosphere {
                    Text(atmosphere)
                        .font(.caption)
                        .italic()
                        .foregroundStyle(.secondary)
                }
                
                if let elements = setting.uniqueElements, !elements.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Unique Elements:")
                            .font(.caption2)
                            .fontWeight(.semibold)
                        ForEach(elements, id: \\.self) { element in
                            HStack {
                                Image(systemName: "sparkle")
                                    .font(.caption2)
                                    .foregroundStyle(.purple)
                                Text(element)
                                    .font(.caption2)
                            }
                        }
                    }
                }
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [Color.green.opacity(0.05), Color.blue.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

// MARK: - Mock AI Session (Simulates Foundation Models behavior)

class MockAISession {
    func mockStreamResponse(_ prompt: String) -> AsyncThrowingStream<StorySnapshot.PartiallyGenerated, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    // Simulate progressive generation
                    
                    // 1. Title appears
                    try await Task.sleep(nanoseconds: 500_000_000)
                    var snapshot = StorySnapshot.PartiallyGenerated()
                    snapshot.title = "The Code Weaver"
                    snapshot.completionPercentage = 10
                    continuation.yield(snapshot)
                    
                    // 2. Synopsis emerges
                    try await Task.sleep(nanoseconds: 700_000_000)
                    snapshot.synopsis = "In a world where programming languages hold mystical power, a young developer discovers their code can literally reshape reality. But with great compiling comes great responsibility."
                    snapshot.completionPercentage = 20
                    continuation.yield(snapshot)
                    
                    // 3. Tone is determined
                    try await Task.sleep(nanoseconds: 300_000_000)
                    snapshot.tone = "mysterious"
                    snapshot.completionPercentage = 25
                    continuation.yield(snapshot)
                    
                    // 4. Character materializes
                    try await Task.sleep(nanoseconds: 800_000_000)
                    var character = CharacterInfo.PartiallyGenerated()
                    character.name = "Maya Chen"
                    character.age = 28
                    snapshot.protagonist = character
                    snapshot.completionPercentage = 35
                    continuation.yield(snapshot)
                    
                    // 5. Character details fill in
                    try await Task.sleep(nanoseconds: 600_000_000)
                    character.appearance = "Sharp eyes behind designer glasses, fingers that dance across holographic keyboards"
                    character.traits = ["brilliant", "curious", "compassionate"]
                    character.motivation = "To debug reality itself and fix the glitches threatening both worlds"
                    snapshot.protagonist = character
                    snapshot.completionPercentage = 45
                    continuation.yield(snapshot)
                    
                    // 6. Setting crystallizes
                    try await Task.sleep(nanoseconds: 700_000_000)
                    var setting = SettingInfo.PartiallyGenerated()
                    setting.location = "Neo San Francisco, The Compile District"
                    setting.timePeriod = "2045 - The Age of Quantum Computing"
                    setting.atmosphere = "A city where code literals float in the air like neon butterflies"
                    setting.uniqueElements = [
                        "Buildings that refactor themselves",
                        "AI familiars that debug your life",
                        "The Great Firewall - a literal wall of fire"
                    ]
                    snapshot.setting = setting
                    snapshot.completionPercentage = 60
                    continuation.yield(snapshot)
                    
                    // 7. Story begins streaming
                    let storyChunks = [
                        "Maya's fingers trembled as she typed the final semicolon. The code was elegant, almost beautiful in its simplicity, but she knew its power was anything but simple.",
                        "\\n\\nAround her, the walls of her apartment began to shimmer, pixels bleeding through the plaster like digital stigmata. She'd done it again—written code that the universe couldn't ignore.",
                        "\\n\\n\\"Not now,\\" she whispered, trying to comment out the reality-bending function. But the compiler of existence had already begun its work.",
                        "\\n\\nHer coffee mug flickered between states—ceramic, hologram, pure energy—before settling on something that defied physics but still held coffee perfectly."
                    ]
                    
                    snapshot.content = ""
                    for (index, chunk) in storyChunks.enumerated() {
                        try await Task.sleep(nanoseconds: 800_000_000)
                        snapshot.content = (snapshot.content ?? "") + chunk
                        snapshot.completionPercentage = 60 + (35 * (index + 1) / storyChunks.count)
                        continuation.yield(snapshot)
                    }
                    
                    // 8. Final completion
                    try await Task.sleep(nanoseconds: 500_000_000)
                    snapshot.completionPercentage = 100
                    continuation.yield(snapshot)
                    
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
}

// MARK: - Partially Generated Extensions
// These would be auto-generated by the Foundation Models framework

extension StorySnapshot {
    struct PartiallyGenerated {
        var title: String?
        var synopsis: String?
        var protagonist: CharacterInfo.PartiallyGenerated?
        var setting: SettingInfo.PartiallyGenerated?
        var openingScene: String?
        var content: String?
        var tone: String?
        var completionPercentage: Int?
    }
}

extension CharacterInfo {
    struct PartiallyGenerated {
        var name: String?
        var age: Int?
        var appearance: String?
        var traits: [String]?
        var motivation: String?
    }
}

extension SettingInfo {
    struct PartiallyGenerated {
        var location: String?
        var timePeriod: String?
        var atmosphere: String?
        var uniqueElements: [String]?
    }
}

// MARK: - App Entry Point

@main
struct FoundationModelsExampleApp: App {
    var body: some Scene {
        WindowGroup {
            FoundationModelsExampleView()
        }
    }
}