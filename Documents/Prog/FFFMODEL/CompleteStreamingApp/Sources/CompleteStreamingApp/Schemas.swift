import Foundation

// MARK: - Core Streaming Schemas
// These demonstrate the Foundation Models pattern with Codable types
// (Note: // @Generable attributes are conceptual - using comments for demonstration)

// Main story structure that streams progressively
struct StorySnapshot: Codable, Equatable {
    // // @Guide("Compelling story title")
    var title: String?
    
    // // @Guide("Brief genre classification", validValues: ["fantasy", "sci-fi", "mystery", "romance", "thriller", "comedy"])
    var genre: String?
    
    // // @Guide("Overall story tone", validValues: ["dark", "uplifting", "mysterious", "comedic", "dramatic", "adventurous"])
    var tone: String?
    
    // // @Guide("2-3 sentence story synopsis")
    var synopsis: String?
    
    // // @Guide("Main characters in the story")
    var characters: [Character]?
    
    // // @Guide("Story setting details")
    var setting: Setting?
    
    // // @Guide("Story plot structure")
    var plot: Plot?
    
    // // @Guide("Central theme or message")
    var theme: String?
    
    // // @Guide("Current story content being written")
    var content: String?
    
    // // @Guide("Story generation progress", validValues: 0...100)
    var progress: Int?
    
    // // @Guide("Current generation phase")
    var phase: GenerationPhase?
}

struct Character: Codable, Equatable {
    // // @Guide("Character's full name")
    var name: String
    
    // // @Guide("Role in the story", validValues: ["protagonist", "antagonist", "mentor", "sidekick", "love interest", "comic relief"])
    var role: String
    
    // // @Guide("Brief physical description")
    var appearance: String
    
    // // @Guide("3-5 personality traits")
    var traits: [String]
    
    // // @Guide("Character's primary motivation")
    var motivation: String
    
    // // @Guide("Character's backstory in 1-2 sentences")
    var backstory: String?
    
    // // @Guide("Special abilities or skills")
    var abilities: [String]?
}

struct Setting: Codable, Equatable {
    // @Guide("Location name")
    var name: String
    
    // @Guide("Time period or era")
    var timePeriod: String
    
    // @Guide("Atmospheric description")
    var atmosphere: String
    
    // @Guide("Key locations in the setting")
    var locations: [Location]?
    
    // @Guide("Unique world features")
    var uniqueFeatures: [String]
    
    // @Guide("Prevailing mood", validValues: ["mysterious", "ominous", "peaceful", "chaotic", "magical", "technological"])
    var mood: String
}

struct Location: Codable, Equatable {
    // @Guide("Location name")
    var name: String
    
    // @Guide("Brief description")
    var description: String
    
    // @Guide("Significance to the story")
    var significance: String?
}

struct Plot: Codable, Equatable {
    // @Guide("Three-act structure")
    var acts: [Act]
    
    // @Guide("Major plot points")
    var keyEvents: [PlotEvent]
    
    // @Guide("Central conflict description")
    var conflict: String
    
    // @Guide("Story climax description")
    var climax: String?
    
    // @Guide("Resolution description")
    var resolution: String?
}

struct Act: Codable, Equatable {
    // @Guide("Act number", validValues: 1...3)
    var number: Int
    
    // @Guide("Act title")
    var title: String
    
    // @Guide("Act summary")
    var summary: String
    
    // @Guide("Scenes in this act")
    var scenes: [Scene]
}

struct Scene: Codable, Equatable {
    // @Guide("Scene title")
    var title: String
    
    // @Guide("Scene location")
    var location: String
    
    // @Guide("Characters present")
    var characters: [String]
    
    // @Guide("Scene description")
    var description: String
    
    // @Guide("Scene content/dialogue")
    var content: String?
}

struct PlotEvent: Codable, Equatable {
    // @Guide("Event name")
    var name: String
    
    // @Guide("When it occurs in the story")
    var timing: String
    
    // @Guide("Impact on the story", validValues: ["minor", "moderate", "major", "critical"])
    var impact: String
    
    // @Guide("Event description")
    var description: String
}

// MARK: - Supporting Types

enum GenerationPhase: String, CaseIterable, Codable {
    case planning = "Planning"
    case worldBuilding = "Building World"
    case characterCreation = "Creating Characters"
    case plotDevelopment = "Developing Plot"
    case sceneWriting = "Writing Scenes"
    case dialogueGeneration = "Generating Dialogue"
    case revision = "Revising"
    case completion = "Completing"
}

// MARK: - Streaming Enhancement Schemas

struct CharacterEnhancement: Codable, Equatable {
    // @Guide("Original character name")
    var characterName: String
    
    // @Guide("Deeper personality insights")
    var personalityDepth: String
    
    // @Guide("Character relationships")
    var relationships: [Relationship]
    
    // @Guide("Character arc description")
    var characterArc: String
    
    // @Guide("Internal conflicts")
    var internalConflicts: [String]
}

// @Generable
struct Relationship: Codable, Equatable {
    // @Guide("Other character's name")
    var withCharacter: String
    
    // @Guide("Relationship type", validValues: ["ally", "enemy", "romantic", "family", "mentor", "rival"])
    var type: String
    
    // @Guide("Relationship dynamics")
    var dynamics: String
}

// @Generable
struct WorldBuildingDetails: Codable, Equatable {
    // @Guide("Setting name reference")
    var settingName: String
    
    // @Guide("Historical context")
    var history: String
    
    // @Guide("Cultural elements")
    var culture: [CulturalElement]
    
    // @Guide("Technology or magic level")
    var technologyLevel: String
    
    // @Guide("Societal structure")
    var society: String
    
    // @Guide("Economic system")
    var economy: String?
}

// @Generable
struct CulturalElement: Codable, Equatable {
    // @Guide("Element name")
    var name: String
    
    // @Guide("Description")
    var description: String
    
    // @Guide("Importance to story", validValues: ["background", "minor", "significant", "central"])
    var importance: String
}

// MARK: - Interactive Generation Requests

// @Generable
struct StoryGenerationRequest: Codable, Equatable {
    // @Guide("Story prompt or idea")
    var prompt: String
    
    // @Guide("Desired genre")
    var genre: String?
    
    // @Guide("Target length", validValues: ["flash", "short", "medium", "long"])
    var length: String
    
    // @Guide("Target audience", validValues: ["children", "young adult", "adult", "all ages"])
    var audience: String
    
    // @Guide("Specific themes to include")
    var themes: [String]?
    
    // @Guide("Mood preference")
    var mood: String?
    
    // @Guide("Include these elements")
    var mustInclude: [String]?
}

// @Generable
struct StoryFeedback: Codable, Equatable {
    // @Guide("What the user liked")
    var liked: [String]
    
    // @Guide("What needs improvement")
    var improvements: [String]
    
    // @Guide("Specific revision requests")
    var revisionRequests: [String]?
    
    // @Guide("Overall satisfaction", validValues: 1...5)
    var rating: Int
}

// MARK: - Visualization Data

// @Generable
struct StoryVisualization: Codable, Equatable {
    // @Guide("Character relationship network")
    var characterNetwork: CharacterNetwork
    
    // @Guide("Story timeline")
    var timeline: StoryTimeline
    
    // @Guide("Emotional arc")
    var emotionalArc: [EmotionalBeat]
    
    // @Guide("Pacing analysis")
    var pacing: PacingAnalysis
}

// @Generable
struct CharacterNetwork: Codable, Equatable {
    // @Guide("Network nodes (characters)")
    var nodes: [NetworkNode]
    
    // @Guide("Connections between characters")
    var edges: [NetworkEdge]
}

// @Generable
struct NetworkNode: Codable, Equatable {
    // @Guide("Character name")
    var name: String
    
    // @Guide("Importance score", validValues: 0...100)
    var importance: Int
    
    // @Guide("Character group/faction")
    var group: String?
}

// @Generable
struct NetworkEdge: Codable, Equatable {
    // @Guide("First character")
    var from: String
    
    // @Guide("Second character")
    var to: String
    
    // @Guide("Relationship strength", validValues: 0...100)
    var strength: Int
    
    // @Guide("Relationship type")
    var type: String
}

// @Generable
struct StoryTimeline: Codable, Equatable {
    // @Guide("Timeline events")
    var events: [TimelineEvent]
    
    // @Guide("Story duration description")
    var duration: String
}

// @Generable
struct TimelineEvent: Codable, Equatable {
    // @Guide("Event name")
    var name: String
    
    // @Guide("When it occurs (relative)")
    var timing: String
    
    // @Guide("Event importance", validValues: 0...100)
    var importance: Int
    
    // @Guide("Characters involved")
    var characters: [String]
}

// @Generable
struct EmotionalBeat: Codable, Equatable {
    // @Guide("Story point")
    var point: String
    
    // @Guide("Emotional intensity", validValues: -100...100)
    var intensity: Int
    
    // @Guide("Primary emotion")
    var emotion: String
}

// @Generable
struct PacingAnalysis: Codable, Equatable {
    // @Guide("Overall pacing", validValues: ["slow", "steady", "fast", "varied"])
    var overall: String
    
    // @Guide("Action scenes count")
    var actionScenes: Int
    
    // @Guide("Dialogue scenes count")
    var dialogueScenes: Int
    
    // @Guide("Description scenes count")
    var descriptionScenes: Int
    
    // @Guide("Pacing recommendations")
    var recommendations: [String]
}