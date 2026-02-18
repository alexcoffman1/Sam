// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Sam",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "Sam", targets: ["Sam"])
    ],
    dependencies: [
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
        .package(url: "https://github.com/daltoniam/Starscream.git", from: "4.0.0")
    ],
    targets: [
        .executableTarget(
            name: "Sam",
            dependencies: ["Alamofire", "Starscream"],
            path: "Sam",
            resources: [
                .process("Resources")
            ]
        )
    ]
)
