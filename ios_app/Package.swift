// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AIDashboardApp",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .executable(name: "AIDashboardApp", targets: ["AIDashboardApp"])
    ],
    targets: [
        .executableTarget(
            name: "AIDashboardApp",
            path: "Sources/AIDashboardApp"
        )
    ]
)
