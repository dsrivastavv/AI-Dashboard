// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AIDashboardMacApp",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "AIDashboardMacApp", targets: ["AIDashboardMacApp"])
    ],
    targets: [
        .executableTarget(
            name: "AIDashboardMacApp",
            path: "Sources/AIDashboardMacApp"
        )
    ]
)
