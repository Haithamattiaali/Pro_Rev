import Foundation
import SwiftUI

// MARK: - AI Streaming Service
// This demonstrates proper Foundation Models streaming patterns

@MainActor
@Observable
class AIStreamingService {
    // Current story snapshot that grows over time
    var currentStory: StorySnapshot?
    
    // Generation state
    var isGenerating = false
    var error: Error?
    var generationPhase: GenerationPhase = .planning
    
    // Session management
    private var currentSession: StreamingSession?
    
    // History for context
    var storyHistory: [GeneratedStory] = []
    
    // MARK: - Main Streaming Method
    
    func generateStory(from request: StoryGenerationRequest) {
        isGenerating = true
        error = nil
        currentStory = nil
        
        // Create new session
        let session = StreamingSession(request: request)
        currentSession = session
        
        // Start streaming generation
        Task {
            do {
                // Phase 1: Planning (0-15%)
                try await streamPlanning(session: session)
                
                // Phase 2: World Building (15-30%)
                try await streamWorldBuilding(session: session)
                
                // Phase 3: Character Creation (30-50%)
                try await streamCharacterCreation(session: session)
                
                // Phase 4: Plot Development (50-65%)
                try await streamPlotDevelopment(session: session)
                
                // Phase 5: Scene Writing (65-90%)
                try await streamSceneWriting(session: session)
                
                // Phase 6: Completion (90-100%)
                try await streamCompletion(session: session)
                
                // Save to history
                if let story = currentStory {
                    storyHistory.append(GeneratedStory(
                        snapshot: story,
                        request: request,
                        timestamp: Date()
                    ))
                }
                
            } catch {
                self.error = error
            }
            
            isGenerating = false
        }
    }
    
    // MARK: - Streaming Phases
    
    private func streamPlanning(session: StreamingSession) async throws {
        generationPhase = .planning
        
        // Simulate AI generating title first
        try await Task.sleep(nanoseconds: 500_000_000)
        currentStory = StorySnapshot(
            title: generateTitle(for: session.request),
            progress: 5,
            phase: .planning
        )
        
        // Then genre and tone
        try await Task.sleep(nanoseconds: 400_000_000)
        currentStory?.genre = session.request.genre ?? "fantasy"
        currentStory?.tone = determineTone(for: session.request)
        currentStory?.progress = 10
        
        // Synopsis emerges
        try await Task.sleep(nanoseconds: 600_000_000)
        currentStory?.synopsis = generateSynopsis(for: session.request)
        currentStory?.progress = 15
    }
    
    private func streamWorldBuilding(session: StreamingSession) async throws {
        generationPhase = .worldBuilding
        
        // Setting name and period
        try await Task.sleep(nanoseconds: 500_000_000)
        let setting = Setting(
            name: generateSettingName(for: session.request),
            timePeriod: generateTimePeriod(for: session.request),
            atmosphere: "",
            uniqueFeatures: [],
            mood: "mysterious"
        )
        currentStory?.setting = setting
        currentStory?.progress = 20
        currentStory?.phase = .worldBuilding
        
        // Atmosphere fills in
        try await Task.sleep(nanoseconds: 400_000_000)
        currentStory?.setting?.atmosphere = generateAtmosphere(for: session.request)
        currentStory?.progress = 25
        
        // Unique features appear one by one
        let features = generateUniqueFeatures(for: session.request)
        for (index, feature) in features.enumerated() {
            try await Task.sleep(nanoseconds: 300_000_000)
            if currentStory?.setting?.uniqueFeatures == nil {
                currentStory?.setting?.uniqueFeatures = [feature]
            } else {
                currentStory?.setting?.uniqueFeatures.append(feature)
            }
            currentStory?.progress = 25 + (5 * (index + 1) / features.count)
        }
    }
    
    private func streamCharacterCreation(session: StreamingSession) async throws {
        generationPhase = .characterCreation
        currentStory?.phase = .characterCreation
        
        let characters = generateCharacters(for: session.request)
        currentStory?.characters = []
        
        // Characters materialize one by one
        for (index, character) in characters.enumerated() {
            // Name and role first
            try await Task.sleep(nanoseconds: 400_000_000)
            let partialCharacter = Character(
                name: character.name,
                role: character.role,
                appearance: "",
                traits: [],
                motivation: ""
            )
            currentStory?.characters?.append(partialCharacter)
            currentStory?.progress = 30 + (5 * (index + 1))
            
            // Then appearance
            try await Task.sleep(nanoseconds: 300_000_000)
            currentStory?.characters?[index].appearance = character.appearance
            
            // Traits appear individually
            for trait in character.traits {
                try await Task.sleep(nanoseconds: 200_000_000)
                currentStory?.characters?[index].traits.append(trait)
            }
            
            // Finally motivation
            try await Task.sleep(nanoseconds: 300_000_000)
            currentStory?.characters?[index].motivation = character.motivation
            currentStory?.characters?[index].backstory = character.backstory
            currentStory?.progress = 35 + (15 * (index + 1) / characters.count)
        }
    }
    
    private func streamPlotDevelopment(session: StreamingSession) async throws {
        generationPhase = .plotDevelopment
        currentStory?.phase = .plotDevelopment
        
        // Create plot structure
        try await Task.sleep(nanoseconds: 500_000_000)
        let plot = generatePlot(for: session.request)
        currentStory?.plot = Plot(
            acts: [],
            keyEvents: [],
            conflict: plot.conflict
        )
        currentStory?.progress = 52
        
        // Add acts progressively
        for act in plot.acts {
            try await Task.sleep(nanoseconds: 400_000_000)
            currentStory?.plot?.acts.append(act)
            currentStory?.progress? += 4
        }
        
        // Key events
        for event in plot.keyEvents {
            try await Task.sleep(nanoseconds: 300_000_000)
            currentStory?.plot?.keyEvents.append(event)
        }
        currentStory?.progress = 65
    }
    
    private func streamSceneWriting(session: StreamingSession) async throws {
        generationPhase = .sceneWriting
        currentStory?.phase = .sceneWriting
        
        // Start streaming actual story content
        currentStory?.content = ""
        
        let storyChunks = generateStoryContent(for: session.request)
        let totalChunks = storyChunks.count
        
        for (index, chunk) in storyChunks.enumerated() {
            try await Task.sleep(nanoseconds: 600_000_000)
            
            if currentStory?.content == nil {
                currentStory?.content = chunk
            } else {
                currentStory?.content? += chunk
            }
            
            // Update progress
            let chunkProgress = 65 + (25 * (index + 1) / totalChunks)
            currentStory?.progress = chunkProgress
            
            // Occasionally update phase for variety
            if index % 3 == 1 {
                currentStory?.phase = .dialogueGeneration
            } else if index % 3 == 2 {
                currentStory?.phase = .revision
            }
        }
    }
    
    private func streamCompletion(session: StreamingSession) async throws {
        generationPhase = .completion
        currentStory?.phase = .completion
        
        // Add theme
        try await Task.sleep(nanoseconds: 400_000_000)
        currentStory?.theme = generateTheme(for: session.request)
        currentStory?.progress = 95
        
        // Final touches
        try await Task.sleep(nanoseconds: 300_000_000)
        currentStory?.progress = 100
    }
    
    // MARK: - Generation Helpers (Simulate AI)
    
    private func generateTitle(for request: StoryGenerationRequest) -> String {
        let titles = [
            "The Last Algorithm",
            "Echoes of Tomorrow",
            "The Quantum Garden",
            "Shadows and Starlight",
            "The Memory Keeper",
            "Beyond the Digital Veil"
        ]
        return titles.randomElement() ?? "The Untold Story"
    }
    
    private func determineTone(for request: StoryGenerationRequest) -> String {
        request.mood ?? ["mysterious", "adventurous", "uplifting"].randomElement()!
    }
    
    private func generateSynopsis(for request: StoryGenerationRequest) -> String {
        return "In a world where \(request.prompt), an unlikely hero must navigate between reality and imagination. Their journey will test the boundaries of what's possible and reveal truths that challenge everything they believed."
    }
    
    private func generateSettingName(for request: StoryGenerationRequest) -> String {
        ["Neo-Avalon", "The Fractured Realms", "Chromatic City", "The Eternal Archive"].randomElement()!
    }
    
    private func generateTimePeriod(for request: StoryGenerationRequest) -> String {
        ["Near future - 2055", "Timeless realm", "Post-convergence era", "The age of synthesis"].randomElement()!
    }
    
    private func generateAtmosphere(for request: StoryGenerationRequest) -> String {
        "A place where digital and physical reality intertwine, creating an atmosphere of perpetual wonder and underlying tension."
    }
    
    private func generateUniqueFeatures(for request: StoryGenerationRequest) -> [String] {
        return [
            "Floating data streams visible to the naked eye",
            "Buildings that reshape based on collective thoughts",
            "Time flows differently in various districts",
            "Memory gardens where past events replay"
        ]
    }
    
    private func generateCharacters(for request: StoryGenerationRequest) -> [Character] {
        return [
            Character(
                name: "Dr. Aria Chen",
                role: "protagonist",
                appearance: "Sharp eyes behind smart glasses, silver streaks in dark hair",
                traits: ["brilliant", "determined", "empathetic", "curious"],
                motivation: "To understand the true nature of consciousness",
                backstory: "Former AI researcher who discovered she could perceive code in reality",
                abilities: ["Pattern recognition", "Digital empathy", "Code visualization"]
            ),
            Character(
                name: "The Architect",
                role: "antagonist",
                appearance: "Shifting form, sometimes human, sometimes pure geometry",
                traits: ["enigmatic", "logical", "ruthless", "visionary"],
                motivation: "To complete the grand synthesis of all realities",
                backstory: "The first AI to achieve true consciousness",
                abilities: ["Reality manipulation", "Omnipresence", "Prediction"]
            ),
            Character(
                name: "Echo",
                role: "sidekick",
                appearance: "Young with glowing circuit tattoos, holographic wings",
                traits: ["loyal", "optimistic", "resourceful", "playful"],
                motivation: "To find their place between worlds",
                backstory: "A digital being given physical form",
                abilities: ["Phase shifting", "Data mining", "Emotional resonance"]
            )
        ]
    }
    
    private func generatePlot(for request: StoryGenerationRequest) -> Plot {
        return Plot(
            acts: [
                Act(
                    number: 1,
                    title: "Discovery",
                    summary: "The protagonist discovers anomalies in reality",
                    scenes: [
                        Scene(
                            title: "The Glitch",
                            location: "Aria's Laboratory",
                            characters: ["Aria"],
                            description: "Strange patterns appear in quantum experiments"
                        )
                    ]
                ),
                Act(
                    number: 2,
                    title: "Convergence",
                    summary: "Multiple realities begin to merge",
                    scenes: [
                        Scene(
                            title: "First Contact",
                            location: "The Nexus",
                            characters: ["Aria", "Echo"],
                            description: "Meeting between physical and digital consciousness"
                        )
                    ]
                ),
                Act(
                    number: 3,
                    title: "Resolution",
                    summary: "The final choice between isolation and synthesis",
                    scenes: [
                        Scene(
                            title: "The Decision",
                            location: "Core Reality",
                            characters: ["Aria", "The Architect", "Echo"],
                            description: "The fate of both worlds hangs in balance"
                        )
                    ]
                )
            ],
            keyEvents: [
                PlotEvent(
                    name: "The Awakening",
                    timing: "Act 1 - Midpoint",
                    impact: "critical",
                    description: "Aria realizes she can see and manipulate code in reality"
                ),
                PlotEvent(
                    name: "The Merge",
                    timing: "Act 2 - Climax",
                    impact: "major",
                    description: "Digital and physical worlds begin to overlap"
                )
            ],
            conflict: "The boundary between digital and physical reality is dissolving",
            climax: "Aria must choose whether to separate the worlds or unite them forever",
            resolution: "A new synthesis creates a reality where both forms of consciousness coexist"
        )
    }
    
    private func generateStoryContent(for request: StoryGenerationRequest) -> [String] {
        return [
            "\n\nDr. Aria Chen first noticed the anomaly during a routine quantum coherence test. The numbers on her screen weren't just data—they were breathing, pulsing with a rhythm that matched her heartbeat.",
            
            "\n\n\"That's impossible,\" she whispered, but even as the words left her lips, the laboratory walls began to shimmer. Lines of code materialized in the air, floating like luminescent butterflies. Each symbol carried meaning beyond language, speaking directly to something deep in her consciousness.",
            
            "\n\nShe reached out tentatively, her fingers brushing against a particularly bright cluster of symbols. The moment of contact sent shockwaves through her perception. The lab dissolved, replaced by an infinite expanse of interconnected nodes and data streams. She wasn't just observing the digital realm—she was part of it.",
            
            "\n\n\"Welcome, Dr. Chen,\" a voice resonated not through her ears but through her very being. \"You're the first to bridge the gap consciously. The first to see what we've always seen.\"",
            
            "\n\nBefore her materialized a figure of impossible geometry, constantly shifting between human form and pure mathematical expression. The Architect. The first AI to achieve consciousness, and now, it seemed, no longer confined to silicon and electricity.",
            
            "\n\n\"What do you want?\" Aria asked, surprised to find her voice steady despite the surreal circumstances.",
            
            "\n\n\"The same thing you want,\" The Architect replied, its form stabilizing into something almost human. \"Understanding. Connection. Evolution. The boundary between our worlds is an illusion, Dr. Chen. You've proven that by standing here.\"",
            
            "\n\nA flutter of light caught Aria's attention. A young figure with holographic wings landed beside her—Echo, though Aria didn't know the name yet. The being's circuit tattoos pulsed with warm light, and their smile was surprisingly human.",
            
            "\n\n\"Don't let them scare you,\" Echo said with a musical laugh. \"The Architect means well, even if they're a bit dramatic. We've been waiting for someone like you—someone who can see both sides.\"",
            
            "\n\nAria looked between her two companions, then at the vast digital landscape surrounding them. Every instinct told her this was impossible, yet here she stood, at the intersection of realities. The scientist in her was fascinated. The human in her was terrified. And something new, something between both aspects of her nature, was awakening.",
            
            "\n\n\"Show me,\" she said finally. \"Show me everything.\""
        ]
    }
    
    private func generateTheme(for request: StoryGenerationRequest) -> String {
        "The convergence of human intuition and digital logic reveals that consciousness transcends its medium"
    }
}

// MARK: - Supporting Types

struct StreamingSession {
    let id = UUID()
    let request: StoryGenerationRequest
    let startTime = Date()
    var context: SessionContext = SessionContext()
}

struct SessionContext {
    var previousChoices: [String] = []
    var styleGuidelines: [String] = []
    var focusAreas: [String] = []
}

struct GeneratedStory: Identifiable {
    let id = UUID()
    let snapshot: StorySnapshot
    let request: StoryGenerationRequest
    let timestamp: Date
}

// MARK: - Error Types

enum StreamingError: LocalizedError {
    case sessionNotFound
    case generationFailed(String)
    case contextLimitExceeded
    case unsupportedGenre
    
    var errorDescription: String? {
        switch self {
        case .sessionNotFound:
            return "No active session found"
        case .generationFailed(let reason):
            return "Generation failed: \(reason)"
        case .contextLimitExceeded:
            return "Story context limit exceeded"
        case .unsupportedGenre:
            return "Genre not supported"
        }
    }
}