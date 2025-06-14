import SwiftUI

// MARK: - Main Streaming Story View
// This demonstrates reactive UI updates as content streams

struct StreamingStoryView: View {
    @State private var aiService = AIStreamingService()
    @State private var currentRequest = StoryGenerationRequest(
        prompt: "",
        length: "medium",
        audience: "all ages"
    )
    @State private var showingGenerationOptions = true
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [Color.blue.opacity(0.05), Color.purple.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // Main content
                VStack(spacing: 0) {
                    // Header
                    headerView
                    
                    if showingGenerationOptions && !aiService.isGenerating {
                        // Story request form
                        StoryRequestView(
                            request: $currentRequest,
                            onGenerate: startGeneration
                        )
                        .transition(.asymmetric(
                            insertion: .scale.combined(with: .opacity),
                            removal: .move(edge: .top).combined(with: .opacity)
                        ))
                    }
                    
                    if aiService.currentStory != nil || aiService.isGenerating {
                        // Tab selection
                        Picker("View", selection: $selectedTab) {
                            Text("Story").tag(0)
                            Text("Structure").tag(1)
                            Text("Visualization").tag(2)
                        }
                        .pickerStyle(.segmented)
                        .padding()
                        
                        // Content based on tab
                        TabView(selection: $selectedTab) {
                            StreamingContentView(
                                story: aiService.currentStory,
                                isGenerating: aiService.isGenerating,
                                phase: aiService.generationPhase
                            )
                            .tag(0)
                            
                            StoryStructureView(
                                story: aiService.currentStory
                            )
                            .tag(1)
                            
                            StoryVisualizationView(
                                story: aiService.currentStory
                            )
                            .tag(2)
                        }
                        #if os(iOS)
                        .tabViewStyle(.page(indexDisplayMode: .never))
                        #endif
                    }
                    
                    if let error = aiService.error {
                        ErrorView(error: error)
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
            }
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    if aiService.isGenerating {
                        ProgressView()
                            .scaleEffect(0.8)
                    } else if aiService.currentStory != nil {
                        Button("New Story") {
                            withAnimation(.spring()) {
                                resetForNewStory()
                            }
                        }
                    }
                }
            }
        }
    }
    
    var headerView: some View {
        VStack(spacing: 8) {
            Text("🎭 AI Story Generator")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Watch your story come to life through streaming AI")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
    
    func startGeneration() {
        withAnimation(.spring()) {
            showingGenerationOptions = false
        }
        aiService.generateStory(from: currentRequest)
    }
    
    func resetForNewStory() {
        showingGenerationOptions = true
        aiService.currentStory = nil
        currentRequest = StoryGenerationRequest(
            prompt: "",
            length: "medium",
            audience: "all ages"
        )
        selectedTab = 0
    }
}

// MARK: - Story Request View

struct StoryRequestView: View {
    @Binding var request: StoryGenerationRequest
    let onGenerate: () -> Void
    @State private var isPromptFocused: Bool = false
    @State private var fieldText: String = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Prompt input
                VStack(alignment: .leading, spacing: 8) {
                    Label("Story Idea", systemImage: "lightbulb")
                        .font(.headline)
                    
                    FocusedTextField(
                        text: $fieldText,
                        placeholder: "Click here and type your story idea...",
                        isFocused: $isPromptFocused
                    )
                    .frame(minHeight: 100)
                    .onAppear {
                        fieldText = request.prompt
                        isPromptFocused = true
                    }
                    .onChange(of: fieldText) { _, newValue in
                        request.prompt = newValue
                    }
                }
                
                // Genre selection
                VStack(alignment: .leading, spacing: 8) {
                    Label("Genre", systemImage: "books.vertical")
                        .font(.headline)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(["fantasy", "sci-fi", "mystery", "romance", "thriller", "comedy"], id: \.self) { genre in
                                GenreChip(
                                    genre: genre,
                                    isSelected: request.genre == genre,
                                    action: { request.genre = genre }
                                )
                            }
                        }
                    }
                }
                
                // Length and audience
                HStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Length", systemImage: "ruler")
                            .font(.headline)
                        
                        Picker("Length", selection: $request.length) {
                            Text("Flash").tag("flash")
                            Text("Short").tag("short")
                            Text("Medium").tag("medium")
                            Text("Long").tag("long")
                        }
                        .pickerStyle(.segmented)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Audience", systemImage: "person.2")
                            .font(.headline)
                        
                        Picker("Audience", selection: $request.audience) {
                            Text("Children").tag("children")
                            Text("YA").tag("young adult")
                            Text("Adult").tag("adult")
                            Text("All").tag("all ages")
                        }
                        .pickerStyle(.menu)
                    }
                }
                
                // Themes
                VStack(alignment: .leading, spacing: 8) {
                    Label("Themes (optional)", systemImage: "sparkles")
                        .font(.headline)
                    
                    HStack {
                        ForEach(["friendship", "courage", "discovery", "redemption", "love"], id: \.self) { theme in
                            ThemeChip(
                                theme: theme,
                                isSelected: request.themes?.contains(theme) ?? false,
                                action: { toggleTheme(theme) }
                            )
                        }
                    }
                }
                
                // Generate button
                Button(action: onGenerate) {
                    Label("Generate Story", systemImage: "sparkles")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(request.prompt.isEmpty)
            }
            .padding()
        }
    }
    
    func toggleTheme(_ theme: String) {
        if request.themes == nil {
            request.themes = []
        }
        
        if let index = request.themes?.firstIndex(of: theme) {
            request.themes?.remove(at: index)
        } else {
            request.themes?.append(theme)
        }
    }
}

// MARK: - Streaming Content View

struct StreamingContentView: View {
    let story: StorySnapshot?
    let isGenerating: Bool
    let phase: GenerationPhase
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Progress indicator
                if isGenerating {
                    PhaseProgressView(
                        phase: phase,
                        progress: story?.progress ?? 0
                    )
                }
                
                // Title - Fades in
                if let title = story?.title {
                    Text(title)
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .transition(.asymmetric(
                            insertion: .scale(scale: 0.8).combined(with: .opacity),
                            removal: .identity
                        ))
                }
                
                // Genre and tone badges
                HStack(spacing: 12) {
                    if let genre = story?.genre {
                        Badge(text: genre, color: .blue)
                            .transition(.scale.combined(with: .opacity))
                    }
                    
                    if let tone = story?.tone {
                        Badge(text: tone, color: .purple)
                            .transition(.scale.combined(with: .opacity))
                    }
                }
                
                // Synopsis - Slides in
                if let synopsis = story?.synopsis {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Synopsis", systemImage: "text.alignleft")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                        
                        Text(synopsis)
                            .font(.body)
                            .italic()
                    }
                    .transition(.asymmetric(
                        insertion: .move(edge: .leading).combined(with: .opacity),
                        removal: .identity
                    ))
                }
                
                // Setting - Pushes in
                if let setting = story?.setting {
                    SettingCard(setting: setting)
                        .transition(.asymmetric(
                            insertion: .push(from: .bottom).combined(with: .opacity),
                            removal: .identity
                        ))
                }
                
                // Characters - Scale in one by one
                if let characters = story?.characters, !characters.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Characters", systemImage: "person.3")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                        
                        ForEach(Array(characters.enumerated()), id: \.offset) { index, character in
                            CharacterCard(character: character)
                                .transition(.asymmetric(
                                    insertion: .scale(scale: 0.9)
                                        .combined(with: .opacity)
                                        .animation(.spring().delay(Double(index) * 0.1)),
                                    removal: .identity
                                ))
                        }
                    }
                }
                
                // Story content - Streams in
                if let content = story?.content, !content.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Label("Story", systemImage: "book")
                                .font(.headline)
                                .foregroundStyle(.secondary)
                            
                            Spacer()
                            
                            if let progress = story?.progress {
                                Text("\(progress)%")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        
                        Text(content)
                            .font(.body)
                            .animation(.easeIn(duration: 0.3), value: content)
                    }
                    .transition(.opacity)
                }
                
                // Theme
                if let theme = story?.theme {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Theme", systemImage: "sparkle")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                        
                        Text(theme)
                            .font(.callout)
                            .italic()
                            .padding()
                            .background(Color.yellow.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .transition(.scale.combined(with: .opacity))
                }
            }
            .padding()
            .animation(.spring(response: 0.5, dampingFraction: 0.8), value: story?.title)
        }
    }
}

// MARK: - Component Views

struct PhaseProgressView: View {
    let phase: GenerationPhase
    let progress: Int
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: phaseIcon)
                    .foregroundStyle(phaseColor)
                
                Text(phase.rawValue)
                    .font(.headline)
                
                Spacer()
                
                Text("\(progress)%")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            ProgressView(value: Double(progress), total: 100)
                .tint(phaseColor)
            
            if let description = phaseDescription {
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(phaseColor.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    var phaseIcon: String {
        switch phase {
        case .planning: return "brain"
        case .worldBuilding: return "globe"
        case .characterCreation: return "person.3"
        case .plotDevelopment: return "chart.line.uptrend.xyaxis"
        case .sceneWriting: return "pencil"
        case .dialogueGeneration: return "bubble.left.and.bubble.right"
        case .revision: return "pencil.and.outline"
        case .completion: return "checkmark.circle"
        }
    }
    
    var phaseColor: Color {
        switch phase {
        case .planning: return .blue
        case .worldBuilding: return .green
        case .characterCreation: return .purple
        case .plotDevelopment: return .orange
        case .sceneWriting: return .pink
        case .dialogueGeneration: return .indigo
        case .revision: return .yellow
        case .completion: return .mint
        }
    }
    
    var phaseDescription: String? {
        switch phase {
        case .planning: return "Setting up story structure..."
        case .worldBuilding: return "Creating the world..."
        case .characterCreation: return "Bringing characters to life..."
        case .plotDevelopment: return "Weaving the narrative..."
        case .sceneWriting: return "Writing scenes..."
        case .dialogueGeneration: return "Crafting conversations..."
        case .revision: return "Polishing the story..."
        case .completion: return "Finalizing..."
        }
    }
}

struct CharacterCard: View {
    let character: Character
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(character.name)
                        .font(.headline)
                    
                    Text(character.role.capitalized)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Button(action: { withAnimation { isExpanded.toggle() } }) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundStyle(.secondary)
                }
            }
            
            if !character.appearance.isEmpty {
                Text(character.appearance)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            // Traits
            if !character.traits.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(character.traits, id: \.self) { trait in
                            Text(trait)
                                .font(.caption2)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.blue.opacity(0.1))
                                .clipShape(Capsule())
                        }
                    }
                }
            }
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    if !character.motivation.isEmpty {
                        Label(character.motivation, systemImage: "target")
                            .font(.caption)
                    }
                    
                    if let backstory = character.backstory {
                        Label(backstory, systemImage: "clock.arrow.circlepath")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    
                    if let abilities = character.abilities, !abilities.isEmpty {
                        Label("Abilities: \(abilities.joined(separator: ", "))", systemImage: "sparkles")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct SettingCard: View {
    let setting: Setting
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Setting", systemImage: "globe")
                .font(.headline)
                .foregroundStyle(.secondary)
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "location.fill")
                        .foregroundStyle(.blue)
                    Text(setting.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                
                HStack {
                    Image(systemName: "clock")
                        .foregroundStyle(.orange)
                    Text(setting.timePeriod)
                        .font(.caption)
                }
                
                if !setting.atmosphere.isEmpty {
                    Text(setting.atmosphere)
                        .font(.caption)
                        .italic()
                        .foregroundStyle(.secondary)
                }
                
                if !setting.uniqueFeatures.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Unique Features:")
                            .font(.caption2)
                            .fontWeight(.semibold)
                        
                        ForEach(setting.uniqueFeatures, id: \.self) { feature in
                            HStack(alignment: .top, spacing: 4) {
                                Text("•")
                                Text(feature)
                            }
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        }
                    }
                }
                
                HStack {
                    Image(systemName: "sparkles")
                        .foregroundStyle(.purple)
                    Text("Mood: \(setting.mood)")
                        .font(.caption)
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

// MARK: - Helper Views

struct GenreChip: View {
    let genre: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(genre.capitalized)
                .font(.caption)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color.gray.opacity(0.2))
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(Capsule())
        }
    }
}

struct ThemeChip: View {
    let theme: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Label(theme.capitalized, systemImage: isSelected ? "checkmark.circle.fill" : "circle")
                .font(.caption)
                .foregroundStyle(isSelected ? .blue : .secondary)
        }
    }
}

struct Badge: View {
    let text: String
    let color: Color
    
    var body: some View {
        Text(text.capitalized)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(color.opacity(0.2))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}

struct ErrorView: View {
    let error: Error
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.largeTitle)
                .foregroundStyle(.red)
            
            Text("Generation Error")
                .font(.headline)
            
            Text(error.localizedDescription)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.red.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding()
    }
}