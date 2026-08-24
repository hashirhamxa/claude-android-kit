import SwiftUI
import ComposeApp

@Observable
@MainActor
final class AuthViewModelWrapper {
    private let viewModel: AuthViewModel
    var uiState: AuthUiState = AuthUiStateLoading()

    init(viewModel: AuthViewModel) {
        self.viewModel = viewModel
    }

    func startObserving() async {
        for await state in viewModel.uiState {
            self.uiState = state
        }
    }

    func onIntent(_ intent: AuthUiIntent) {
        viewModel.onIntent(intent: intent)
    }
}

struct ContentView: View {
    @State private var wrapper: AuthViewModelWrapper?

    var body: some View {
        NavigationStack {
            Group {
                if let wrapper = wrapper {
                    AuthContentView(wrapper: wrapper)
                } else {
                    ProgressView("Initializing...")
                }
            }
            .task {
                if wrapper == nil {
                    // Resolve AuthViewModel from Koin / shared factory
                    let repository = AuthRepositoryImpl()
                    let vm = AuthViewModel(repository: repository)
                    let newWrapper = AuthViewModelWrapper(viewModel: vm)
                    self.wrapper = newWrapper
                    await newWrapper.startObserving()
                }
            }
        }
    }
}

struct AuthContentView: View {
    let wrapper: AuthViewModelWrapper

    var body: some View {
        VStack(spacing: 20) {
            switch onEnum(of: wrapper.uiState) {
            case .loading:
                ProgressView("Loading auth state...")
            case .success(let successState):
                Text("Authenticated items: \(successState.items.count)")
                    .font(.headline)
                Button("Refresh") {
                    wrapper.onIntent(AuthUiIntentRefresh())
                }
                .buttonStyle(.borderedProminent)
            case .error(let errorState):
                Text("Error: \(errorState.message)")
                    .foregroundColor(.red)
            }
        }
        .padding()
        .navigationTitle("Claude Android Kit")
    }
}
