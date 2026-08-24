import SwiftUI
import ComposeApp

@main
struct iosApp: App {
    init() {
        AppModuleKt.doInitKoin { _ in }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
