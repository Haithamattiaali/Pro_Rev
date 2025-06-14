import SwiftUI

// MARK: - Story Visualization View
// Shows character networks, timeline, and emotional arcs

struct StoryVisualizationView: View {
    let story: StorySnapshot?
    @State private var selectedVisualization = 0
    
    var body: some View {
        VStack(spacing: 0) {
            if story != nil {
                // Visualization type picker
                Picker("Visualization", selection: $selectedVisualization) {
                    Text("Characters").tag(0)
                    Text("Timeline").tag(1)
                    Text("Emotional Arc").tag(2)
                }
                .pickerStyle(.segmented)
                .padding()
                
                // Visualization content
                TabView(selection: $selectedVisualization) {
                    CharacterNetworkView(story: story)
                        .tag(0)
                    
                    StoryTimelineVisualization(story: story)
                        .tag(1)
                    
                    EmotionalArcView(story: story)
                        .tag(2)
                }
                #if os(iOS)
                .tabViewStyle(.page(indexDisplayMode: .never))
                #endif
            } else {
                VisualizationPlaceholderView()
            }
        }
    }
}

// MARK: - Character Network View

struct CharacterNetworkView: View {
    let story: StorySnapshot?
    @State private var selectedCharacter: String?
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let characters = story?.characters, !characters.isEmpty {
                    // Network diagram
                    VStack(alignment: .leading, spacing: 16) {
                        Label("Character Network", systemImage: "person.3.sequence")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                        
                        // Simple network visualization
                        CharacterNetworkDiagram(
                            characters: characters,
                            selectedCharacter: $selectedCharacter
                        )
                    }
                    
                    // Character details
                    if let selectedCharacter = selectedCharacter,
                       let character = characters.first(where: { $0.name == selectedCharacter }) {
                        CharacterDetailCard(character: character)
                            .transition(.asymmetric(
                                insertion: .scale.combined(with: .opacity),
                                removal: .identity
                            ))
                    }
                    
                    // Relationship matrix
                    if characters.count > 1 {
                        RelationshipMatrix(characters: characters)
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                } else {
                    NetworkPlaceholderView()
                }
            }
            .padding()
            .animation(.spring(response: 0.5, dampingFraction: 0.8), value: selectedCharacter)
        }
    }
}

struct CharacterNetworkDiagram: View {
    let characters: [Character]
    @Binding var selectedCharacter: String?
    
    var body: some View {
        GeometryReader { geometry in
            let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
            let radius = min(geometry.size.width, geometry.size.height) / 3
            
            ZStack {
                // Connection lines
                ForEach(Array(characters.enumerated()), id: \.offset) { index, character in
                    ForEach(Array(characters.enumerated()), id: \.offset) { otherIndex, otherCharacter in
                        if index != otherIndex {
                            ConnectionLine(
                                from: positionForCharacter(index: index, total: characters.count, center: center, radius: radius),
                                to: positionForCharacter(index: otherIndex, total: characters.count, center: center, radius: radius),
                                strength: relationshipStrength(character, otherCharacter)
                            )
                        }
                    }
                }
                
                // Character nodes
                ForEach(Array(characters.enumerated()), id: \.offset) { index, character in
                    CharacterNode(
                        character: character,
                        position: positionForCharacter(index: index, total: characters.count, center: center, radius: radius),
                        isSelected: selectedCharacter == character.name,
                        onTap: {
                            withAnimation(.spring()) {
                                selectedCharacter = selectedCharacter == character.name ? nil : character.name
                            }
                        }
                    )
                }
            }
        }
        .frame(height: 300)
        .background(Color.gray.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    func positionForCharacter(index: Int, total: Int, center: CGPoint, radius: CGFloat) -> CGPoint {
        let angle = (2 * .pi / Double(total)) * Double(index) - .pi / 2
        return CGPoint(
            x: center.x + radius * CGFloat(cos(angle)),
            y: center.y + radius * CGFloat(sin(angle))
        )
    }
    
    func relationshipStrength(_ char1: Character, _ char2: Character) -> Double {
        // Simple heuristic based on role relationships
        switch (char1.role, char2.role) {
        case ("protagonist", "antagonist"), ("antagonist", "protagonist"):
            return 0.9
        case ("protagonist", "sidekick"), ("sidekick", "protagonist"):
            return 0.8
        case ("protagonist", "mentor"), ("mentor", "protagonist"):
            return 0.7
        default:
            return 0.3
        }
    }
}

struct CharacterNode: View {
    let character: Character
    let position: CGPoint
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                Circle()
                    .fill(roleColor.gradient)
                    .frame(width: isSelected ? 50 : 40, height: isSelected ? 50 : 40)
                    .overlay(
                        Text(String(character.name.prefix(1)))
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                    )
                    .overlay(
                        Circle()
                            .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 3)
                    )
                
                Text(character.name.components(separatedBy: " ").first ?? character.name)
                    .font(.caption2)
                    .fontWeight(isSelected ? .semibold : .medium)
                    .foregroundStyle(isSelected ? .blue : .primary)
            }
        }
        .position(position)
        .scaleEffect(isSelected ? 1.1 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
    }
    
    var roleColor: Color {
        switch character.role {
        case "protagonist": return .blue
        case "antagonist": return .red
        case "mentor": return .purple
        case "sidekick": return .green
        case "love interest": return .pink
        default: return .orange
        }
    }
}

struct ConnectionLine: View {
    let from: CGPoint
    let to: CGPoint
    let strength: Double
    
    var body: some View {
        Path { path in
            path.move(to: from)
            path.addLine(to: to)
        }
        .stroke(
            Color.blue.opacity(0.2 + strength * 0.6),
            lineWidth: 1 + CGFloat(strength * 3)
        )
    }
}

// MARK: - Timeline Visualization

struct StoryTimelineVisualization: View {
    let story: StorySnapshot?
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let plot = story?.plot {
                    Label("Story Timeline", systemImage: "timeline.selection")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                    
                    // Act progression
                    ActProgressionView(acts: plot.acts)
                    
                    // Key events timeline
                    if !plot.keyEvents.isEmpty {
                        KeyEventsTimeline(events: plot.keyEvents)
                    }
                    
                    // Story arc visualization
                    StoryArcChart(plot: plot)
                } else {
                    TimelinePlaceholderView()
                }
            }
            .padding()
        }
    }
}

struct ActProgressionView: View {
    let acts: [Act]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Three-Act Structure")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
            
            HStack(alignment: .top, spacing: 12) {
                ForEach(acts, id: \.number) { act in
                    VStack(alignment: .leading, spacing: 8) {
                        // Act header
                        HStack {
                            Circle()
                                .fill(actColor(act.number).gradient)
                                .frame(width: 20, height: 20)
                                .overlay(
                                    Text("\(act.number)")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundStyle(.white)
                                )
                            
                            Text(act.title)
                                .font(.headline)
                                .foregroundStyle(actColor(act.number))
                        }
                        
                        // Act content
                        Text(act.summary)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                        
                        // Scene count
                        Label("\(act.scenes.count) scenes", systemImage: "video")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(actColor(act.number).opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
    }
    
    func actColor(_ number: Int) -> Color {
        switch number {
        case 1: return .blue
        case 2: return .orange
        case 3: return .green
        default: return .gray
        }
    }
}

struct KeyEventsTimeline: View {
    let events: [PlotEvent]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Key Events")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
            
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(events.enumerated()), id: \.offset) { index, event in
                    HStack(alignment: .top, spacing: 12) {
                        // Timeline indicator
                        VStack {
                            Circle()
                                .fill(impactColor(event.impact))
                                .frame(width: 12, height: 12)
                            
                            if index < events.count - 1 {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 2, height: 30)
                            }
                        }
                        
                        // Event details
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(event.name)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                Spacer()
                                
                                Text(event.timing)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            
                            Text(event.description)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            
                            HStack {
                                Image(systemName: impactIcon(event.impact))
                                    .font(.caption)
                                    .foregroundStyle(impactColor(event.impact))
                                
                                Text("Impact: \(event.impact)")
                                    .font(.caption)
                                    .foregroundStyle(impactColor(event.impact))
                            }
                        }
                    }
                    .transition(.asymmetric(
                        insertion: .move(edge: .leading).combined(with: .opacity),
                        removal: .identity
                    ))
                }
            }
            .padding()
            .background(Color.gray.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
    
    func impactColor(_ impact: String) -> Color {
        switch impact {
        case "critical": return .red
        case "major": return .orange
        case "moderate": return .yellow
        case "minor": return .blue
        default: return .gray
        }
    }
    
    func impactIcon(_ impact: String) -> String {
        switch impact {
        case "critical": return "exclamationmark.triangle.fill"
        case "major": return "exclamationmark.circle.fill"
        case "moderate": return "info.circle.fill"
        case "minor": return "circle.fill"
        default: return "circle"
        }
    }
}

// MARK: - Emotional Arc View

struct EmotionalArcView: View {
    let story: StorySnapshot?
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let story = story {
                    Label("Emotional Journey", systemImage: "heart.text.square")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                    
                    // Character emotional arcs
                    if let characters = story.characters {
                        ForEach(characters, id: \.name) { character in
                            CharacterEmotionalArc(character: character)
                        }
                    }
                    
                    // Overall story mood
                    StoryMoodCard(story: story)
                } else {
                    EmotionalPlaceholderView()
                }
            }
            .padding()
        }
    }
}

struct CharacterEmotionalArc: View {
    let character: Character
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button(action: { withAnimation { isExpanded.toggle() } }) {
                HStack {
                    Text(character.name)
                        .font(.headline)
                    
                    Spacer()
                    
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundStyle(.secondary)
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            // Emotional traits visualization
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                ForEach(character.traits, id: \.self) { trait in
                    Text(trait)
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(emotionalColor(trait).opacity(0.2))
                        .foregroundStyle(emotionalColor(trait))
                        .clipShape(Capsule())
                }
            }
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Motivation")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Text(character.motivation)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    if let backstory = character.backstory {
                        Text("Backstory")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        Text(backstory)
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
    
    func emotionalColor(_ trait: String) -> Color {
        switch trait.lowercased() {
        case "happy", "optimistic", "cheerful", "joyful": return .yellow
        case "sad", "melancholy", "sorrowful": return .blue
        case "angry", "furious", "rage": return .red
        case "calm", "peaceful", "serene": return .green
        case "mysterious", "enigmatic": return .purple
        case "brave", "courageous", "determined": return .orange
        default: return .gray
        }
    }
}

// MARK: - Supporting Views

struct StoryArcChart: View {
    let plot: Plot
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Story Arc")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
            
            // Simple arc visualization
            GeometryReader { geometry in
                Path { path in
                    let width = geometry.size.width
                    let height = geometry.size.height
                    
                    // Rising action
                    path.move(to: CGPoint(x: 0, y: height))
                    path.addCurve(
                        to: CGPoint(x: width * 0.7, y: height * 0.2),
                        control1: CGPoint(x: width * 0.3, y: height * 0.8),
                        control2: CGPoint(x: width * 0.5, y: height * 0.4)
                    )
                    
                    // Falling action
                    path.addCurve(
                        to: CGPoint(x: width, y: height * 0.7),
                        control1: CGPoint(x: width * 0.8, y: height * 0.1),
                        control2: CGPoint(x: width * 0.9, y: height * 0.4)
                    )
                }
                .stroke(Color.blue, lineWidth: 3)
                
                // Climax point
                Circle()
                    .fill(Color.red)
                    .frame(width: 8, height: 8)
                    .position(x: geometry.size.width * 0.7, y: geometry.size.height * 0.2)
            }
            .frame(height: 100)
            .background(Color.gray.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

struct StoryMoodCard: View {
    let story: StorySnapshot
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Overall Mood", systemImage: "theatermasks")
                .font(.headline)
                .foregroundStyle(.secondary)
            
            HStack {
                if let tone = story.tone {
                    Text(tone.capitalized)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(moodColor(tone))
                }
                
                Spacer()
                
                if let setting = story.setting {
                    Text(setting.mood.capitalized)
                        .font(.callout)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(moodColor(setting.mood).opacity(0.2))
                        .foregroundStyle(moodColor(setting.mood))
                        .clipShape(Capsule())
                }
            }
            
            if let theme = story.theme {
                Text(theme)
                    .font(.callout)
                    .italic()
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.purple.opacity(0.1), Color.blue.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    func moodColor(_ mood: String) -> Color {
        switch mood.lowercased() {
        case "dark": return .black
        case "uplifting": return .yellow
        case "mysterious": return .purple
        case "comedic": return .orange
        case "dramatic": return .red
        case "adventurous": return .green
        default: return .blue
        }
    }
}

// MARK: - Placeholder Views

struct VisualizationPlaceholderView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.xyaxis.line")
                .font(.system(size: 60))
                .foregroundStyle(.gray.opacity(0.5))
            
            VStack(spacing: 8) {
                Text("Story Visualization")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                Text("Character networks and story analysis will appear here")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct NetworkPlaceholderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.3.sequence")
                .font(.system(size: 40))
                .foregroundStyle(.gray.opacity(0.5))
            
            Text("Character network will appear as characters are created")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
    }
}

struct TimelinePlaceholderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "timeline.selection")
                .font(.system(size: 40))
                .foregroundStyle(.gray.opacity(0.5))
            
            Text("Story timeline will show plot progression")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
    }
}

struct EmotionalPlaceholderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.text.square")
                .font(.system(size: 40))
                .foregroundStyle(.gray.opacity(0.5))
            
            Text("Emotional arcs and character development will be visualized here")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
    }
}

// MARK: - Helper Views

struct RelationshipMatrix: View {
    let characters: [Character]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Character Relationships")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: characters.count + 1), spacing: 8) {
                // Header row
                Text("")
                    .font(.caption2)
                
                ForEach(characters, id: \.name) { character in
                    Text(character.name.prefix(3))
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)
                }
                
                // Matrix rows
                ForEach(characters, id: \.name) { rowChar in
                    Text(rowChar.name.prefix(3))
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)
                    
                    ForEach(characters, id: \.name) { colChar in
                        Circle()
                            .fill(relationshipColor(rowChar, colChar))
                            .frame(width: 20, height: 20)
                    }
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    func relationshipColor(_ char1: Character, _ char2: Character) -> Color {
        if char1.name == char2.name {
            return .clear
        }
        
        switch (char1.role, char2.role) {
        case ("protagonist", "antagonist"), ("antagonist", "protagonist"):
            return .red.opacity(0.7)
        case ("protagonist", "sidekick"), ("sidekick", "protagonist"):
            return .green.opacity(0.7)
        case ("protagonist", "mentor"), ("mentor", "protagonist"):
            return .blue.opacity(0.7)
        default:
            return .gray.opacity(0.3)
        }
    }
}

struct CharacterDetailCard: View {
    let character: Character
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(character.name)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
                
                Text(character.role.capitalized)
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(roleColor.opacity(0.2))
                    .foregroundStyle(roleColor)
                    .clipShape(Capsule())
            }
            
            Text(character.appearance)
                .font(.callout)
                .foregroundStyle(.secondary)
            
            Text(character.motivation)
                .font(.callout)
                .italic()
            
            if let abilities = character.abilities, !abilities.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Abilities")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                        ForEach(abilities, id: \.self) { ability in
                            Text(ability)
                                .font(.caption)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.purple.opacity(0.1))
                                .foregroundStyle(.purple)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
        }
        .padding()
        .background(roleColor.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(roleColor.opacity(0.3), lineWidth: 1)
        )
    }
    
    var roleColor: Color {
        switch character.role {
        case "protagonist": return .blue
        case "antagonist": return .red
        case "mentor": return .purple
        case "sidekick": return .green
        case "love interest": return .pink
        default: return .orange
        }
    }
}