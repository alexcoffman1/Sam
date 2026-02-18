//
//  SamState.swift
//  Sam
//
//  Central state management for the app
//

import SwiftUI
import Combine

@MainActor
class SamState: ObservableObject {
    static let shared = SamState()
    
    // MARK: - Published Properties
    @Published var messages: [ChatMessage] = []
    @Published var isListening = false
    @Published var isSpeaking = false
    @Published var isThinking = false
    @Published var currentEmotion: Emotion = .neutral
    @Published var showAdmin = false
    @Published var showGarden = false
    @Published var showChat = false
    @Published var audioAmplitude: CGFloat = 0
    @Published var connectionStatus: ConnectionStatus = .disconnected
    @Published var memories: [Memory] = []
    @Published var stats: SamStats?
    
    // MARK: - Services
    private let api = SamAPIService.shared
    private let audio = AudioService.shared
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Session
    let sessionId: String
    
    private init() {
        // Generate or retrieve session ID
        if let stored = UserDefaults.standard.string(forKey: "sam-session-id") {
            sessionId = stored
        } else {
            sessionId = "mac-\(UUID().uuidString.prefix(8))"
            UserDefaults.standard.set(sessionId, forKey: "sam-session-id")
        }
        
        setupBindings()
        
        Task {
            await loadInitialData()
        }
    }
    
    private func setupBindings() {
        // Audio amplitude binding
        audio.$amplitude
            .receive(on: DispatchQueue.main)
            .assign(to: &$audioAmplitude)
        
        // Space key notifications
        NotificationCenter.default.publisher(for: .spaceKeyPressed)
            .sink { [weak self] _ in
                Task { await self?.startListening() }
            }
            .store(in: &cancellables)
        
        NotificationCenter.default.publisher(for: .spaceKeyReleased)
            .sink { [weak self] _ in
                Task { await self?.stopListening() }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Data Loading
    func loadInitialData() async {
        connectionStatus = .connecting
        
        do {
            // Load messages
            messages = try await api.getMessages(sessionId: sessionId)
            
            // Load memories
            memories = try await api.getMemories(sessionId: sessionId)
            
            // Load stats
            stats = try await api.getStats()
            
            connectionStatus = .connected
        } catch {
            print("Failed to load initial data: \(error)")
            connectionStatus = .error(error.localizedDescription)
        }
    }
    
    // MARK: - Voice Interaction
    func startListening() async {
        guard !isListening && !isSpeaking else { return }
        
        isListening = true
        audio.startRecording()
    }
    
    func stopListening() async {
        guard isListening else { return }
        
        isListening = false
        
        if let audioData = audio.stopRecording() {
            isThinking = true
            
            do {
                // Transcribe audio
                let transcript = try await api.transcribeAudio(audioData)
                
                if !transcript.isEmpty {
                    await sendMessage(transcript)
                }
            } catch {
                print("Transcription failed: \(error)")
            }
            
            isThinking = false
        }
    }
    
    func toggleListening() async {
        if isListening {
            await stopListening()
        } else if isSpeaking {
            stopSpeaking()
        } else {
            await startListening()
        }
    }
    
    func stopSpeaking() {
        audio.stopPlayback()
        isSpeaking = false
    }
    
    // MARK: - Chat
    func sendMessage(_ text: String) async {
        let userMessage = ChatMessage(
            id: UUID().uuidString,
            sessionId: sessionId,
            role: .user,
            content: text,
            emotion: nil,
            timestamp: Date()
        )
        
        messages.append(userMessage)
        isThinking = true
        
        do {
            let response = try await api.chat(sessionId: sessionId, message: text)
            
            let samMessage = ChatMessage(
                id: response.id,
                sessionId: sessionId,
                role: .sam,
                content: response.response,
                emotion: Emotion(rawValue: response.emotion ?? "neutral"),
                timestamp: Date()
            )
            
            messages.append(samMessage)
            currentEmotion = samMessage.emotion ?? .neutral
            
            // Speak the response
            await speakResponse(response.response)
            
        } catch {
            print("Chat failed: \(error)")
        }
        
        isThinking = false
    }
    
    private func speakResponse(_ text: String) async {
        isSpeaking = true
        
        do {
            let audioData = try await api.textToSpeech(text: text, emotion: currentEmotion.rawValue)
            audio.play(audioData) { [weak self] in
                DispatchQueue.main.async {
                    self?.isSpeaking = false
                }
            }
        } catch {
            print("TTS failed: \(error)")
            isSpeaking = false
        }
    }
    
    // MARK: - Actions
    func clearConversation() async {
        messages.removeAll()
        // Could also call API to clear server-side
    }
    
    func refreshMemories() async {
        do {
            memories = try await api.getMemories(sessionId: sessionId)
        } catch {
            print("Failed to refresh memories: \(error)")
        }
    }
}

// MARK: - Supporting Types

enum OrbState {
    case idle
    case listening
    case thinking
    case speaking
}

enum Emotion: String, CaseIterable {
    case neutral
    case affectionate
    case laughing
    case thinking
    case excited
    case tender
    case curious
    case playful
}

enum ConnectionStatus: Equatable {
    case disconnected
    case connecting
    case connected
    case error(String)
}

struct ChatMessage: Identifiable, Equatable {
    let id: String
    let sessionId: String
    let role: MessageRole
    let content: String
    let emotion: Emotion?
    let timestamp: Date
}

enum MessageRole: String {
    case user
    case sam
}

struct Memory: Identifiable, Hashable {
    let id: String
    let content: String
    let category: String
    let sentiment: String
    let timestamp: Date
}

struct SamStats {
    let totalMessages: Int
    let totalMemories: Int
    let totalSessions: Int
    let samOnline: Bool
}
