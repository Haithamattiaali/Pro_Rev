import SwiftUI

// MARK: - Story Structure View
// Shows the plot structure and narrative analysis

struct StoryStructureView: View {
    let story: StorySnapshot?
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                if let plot = story?.plot {
                    // Three-act structure
                    VStack(alignment: .leading, spacing: 16) {
                        Label("Three-Act Structure", systemImage: "chart.line.uptrend.xyaxis")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                        
                        ForEach(plot.acts, id: \.number) { act in
                            ActCard(act: act)
                                .transition(.asymmetric(
                                    insertion: .scale(scale: 0.9).combined(with: .opacity),
                                    removal: .identity
                                ))
                        }
                    }
                    
                    // Central conflict
                    if !plot.conflict.isEmpty {
                        ConflictCard(conflict: plot.conflict)
                            .transition(.move(edge: .leading).combined(with: .opacity))
                    }
                    
                    // Key events timeline
                    if !plot.keyEvents.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            Label("Key Events", systemImage: "timeline.selection")
                                .font(.headline)
                                .foregroundStyle(.secondary)
                            
                            TimelineView(events: plot.keyEvents)
                        }
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                    }
                    
                    // Climax and resolution
                    if let climax = plot.climax {
                        StoryBeatCard(
                            title: "Climax",
                            content: climax,
                            icon: "burst",
                            color: .red
                        )
                        .transition(.scale.combined(with: .opacity))
                    }
                    
                    if let resolution = plot.resolution {
                        StoryBeatCard(
                            title: "Resolution",
                            content: resolution,
                            icon: "checkmark.seal",
                            color: .green
                        )
                        .transition(.scale.combined(with: .opacity))
                    }
                } else {
                    // Placeholder when no plot available
                    PlotPlaceholderView()
                }
            }
            .padding()
            .animation(.spring(response: 0.5, dampingFraction: 0.8), value: story?.plot?.conflict)
        }
    }
}

// MARK: - Component Views

struct ActCard: View {
    let act: Act
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button(action: { withAnimation { isExpanded.toggle() } }) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("Act \(act.number)")
                                .font(.headline)
                                .foregroundStyle(actColor)
                            
                            Text(act.title)
                                .font(.headline)
                        }
                        
                        Text(act.summary)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                    }
                    
                    Spacer()
                    
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundStyle(.secondary)
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            if isExpanded && !act.scenes.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Scenes")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)
                    
                    ForEach(Array(act.scenes.enumerated()), id: \.offset) { index, scene in
                        SceneCard(scene: scene)
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }
                }
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .padding()
        .background(actColor.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(actColor.opacity(0.3), lineWidth: 1)
        )
    }
    
    var actColor: Color {
        switch act.number {
        case 1: return .blue
        case 2: return .orange
        case 3: return .green
        default: return .gray
        }
    }
}

struct SceneCard: View {
    let scene: Scene
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "video")
                    .foregroundStyle(.blue)
                
                Text(scene.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Spacer()
                
                Text(scene.location)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Text(scene.description)
                .font(.caption)
                .foregroundStyle(.secondary)
            
            if !scene.characters.isEmpty {
                HStack {
                    Image(systemName: "person.2")
                        .font(.caption)
                        .foregroundStyle(.purple)
                    
                    Text(scene.characters.joined(separator: ", "))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct ConflictCard: View {
    let conflict: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Central Conflict", systemImage: "bolt")
                .font(.headline)
                .foregroundStyle(.red)
            
            Text(conflict)
                .font(.body)
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
    }
}

struct TimelineView: View {
    let events: [PlotEvent]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(Array(events.enumerated()), id: \.offset) { index, event in
                HStack(alignment: .top, spacing: 12) {
                    // Timeline dot
                    VStack {
                        Circle()
                            .fill(impactColor(event.impact))
                            .frame(width: 12, height: 12)
                        
                        if index < events.count - 1 {
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 2, height: 40)
                        }
                    }
                    
                    // Event content
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

struct StoryBeatCard: View {
    let title: String
    let content: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundStyle(color)
            
            Text(content)
                .font(.body)
        }
        .padding()
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
    }
}

struct PlotPlaceholderView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.line.uptrend.xyaxis.circle")
                .font(.system(size: 60))
                .foregroundStyle(.gray.opacity(0.5))
            
            VStack(spacing: 8) {
                Text("Plot Structure")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                Text("The story's plot structure will appear here as it's generated")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}