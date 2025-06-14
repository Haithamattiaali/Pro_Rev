// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CompleteStreamingApp",
    platforms: [
        .macOS(.v14),
        .iOS(.v17)
    ],
    products: [
        .executable(
            name: "CompleteStreamingApp",
            targets: ["CompleteStreamingApp"]
        )
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "CompleteStreamingApp",
            dependencies: []
        )
    ]
)