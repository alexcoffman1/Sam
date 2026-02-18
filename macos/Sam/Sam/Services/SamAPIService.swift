//
//  SamAPIService.swift
//  Sam
//
//  API service for communicating with Sam's backend
//

import Foundation
import Alamofire

class SamAPIService {
    static let shared = SamAPIService()
    
    // Configure this to your backend URL
    private let baseURL: String
    
    private init() {
        // Default to localhost, can be configured in Settings
        baseURL = UserDefaults.standard.string(forKey: "sam-api-url") 
            ?? "http://localhost:8001/api"
    }
    
    // MARK: - Chat
    
    struct ChatRequest: Encodable {
        let session_id: String
        let message: String
    }
    
    struct ChatResponse: Decodable {
        let id: String
        let session_id: String
        let response: String
        let emotion: String?
        let timestamp: String
    }
    
    func chat(sessionId: String, message: String) async throws -> ChatResponse {
        let request = ChatRequest(session_id: sessionId, message: message)
        
        return try await AF.request(
            "\(baseURL)/chat",
            method: .post,
            parameters: request,
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingDecodable(ChatResponse.self)
        .value
    }
    
    // MARK: - Messages
    
    struct MessageResponse: Decodable {
        let id: String?
        let session_id: String
        let role: String
        let content: String
        let emotion: String?
        let timestamp: String
    }
    
    func getMessages(sessionId: String, limit: Int = 50) async throws -> [ChatMessage] {
        let response: [MessageResponse] = try await AF.request(
            "\(baseURL)/messages/\(sessionId)",
            parameters: ["limit": limit]
        )
        .validate()
        .serializingDecodable([MessageResponse].self)
        .value
        
        return response.map { msg in
            ChatMessage(
                id: msg.id ?? UUID().uuidString,
                sessionId: msg.session_id,
                role: msg.role == "sam" ? .sam : .user,
                content: msg.content,
                emotion: Emotion(rawValue: msg.emotion ?? "neutral"),
                timestamp: ISO8601DateFormatter().date(from: msg.timestamp) ?? Date()
            )
        }
    }
    
    // MARK: - Memories
    
    struct MemoryResponse: Decodable {
        let id: String
        let content: String
        let category: String
        let sentiment: String
        let timestamp: String
    }
    
    func getMemories(sessionId: String) async throws -> [Memory] {
        let response: [MemoryResponse] = try await AF.request(
            "\(baseURL)/memories/\(sessionId)"
        )
        .validate()
        .serializingDecodable([MemoryResponse].self)
        .value
        
        return response.map { mem in
            Memory(
                id: mem.id,
                content: mem.content,
                category: mem.category,
                sentiment: mem.sentiment,
                timestamp: ISO8601DateFormatter().date(from: mem.timestamp) ?? Date()
            )
        }
    }
    
    // MARK: - Stats
    
    struct StatsResponse: Decodable {
        let total_messages: Int
        let total_memories: Int
        let total_sessions: Int
        let sam_online: Bool
    }
    
    func getStats() async throws -> SamStats {
        let response: StatsResponse = try await AF.request("\(baseURL)/stats")
            .validate()
            .serializingDecodable(StatsResponse.self)
            .value
        
        return SamStats(
            totalMessages: response.total_messages,
            totalMemories: response.total_memories,
            totalSessions: response.total_sessions,
            samOnline: response.sam_online
        )
    }
    
    // MARK: - Text to Speech
    
    func textToSpeech(text: String, emotion: String) async throws -> Data {
        let response = try await AF.request(
            "\(baseURL)/tts",
            method: .post,
            parameters: ["text": text, "emotion": emotion],
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingData()
        .value
        
        return response
    }
    
    // MARK: - Speech to Text (Whisper)
    
    func transcribeAudio(_ audioData: Data) async throws -> String {
        // For now, use a simple implementation
        // In production, you'd send to your backend's transcription endpoint
        
        let response = try await AF.upload(
            multipartFormData: { formData in
                formData.append(audioData, withName: "audio", fileName: "recording.wav", mimeType: "audio/wav")
            },
            to: "\(baseURL)/transcribe"
        )
        .validate()
        .serializingDecodable(TranscribeResponse.self)
        .value
        
        return response.text
    }
    
    struct TranscribeResponse: Decodable {
        let text: String
    }
    
    // MARK: - Voices
    
    struct Voice: Decodable, Identifiable {
        let voice_id: String
        let name: String
        
        var id: String { voice_id }
    }
    
    func getVoices() async throws -> [Voice] {
        return try await AF.request("\(baseURL)/voices")
            .validate()
            .serializingDecodable([Voice].self)
            .value
    }
}
