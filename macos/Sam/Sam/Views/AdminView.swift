//
//  AdminView.swift
//  Sam
//
//  Admin portal for Sam configuration
//

import SwiftUI

struct AdminView: View {
    @EnvironmentObject var state: SamState
    @Environment(\.dismiss) var dismiss
    @State private var selectedTab = "overview"
    
    var body: some View {
        NavigationSplitView {
            List(selection: $selectedTab) {
                Label("Overview", systemImage: "chart.bar")
                    .tag("overview")
                Label("Voice", systemImage: "waveform")
                    .tag("voice")
                Label("Memory", systemImage: "brain")
                    .tag("memory")
                Label("Soul", systemImage: "heart")
                    .tag("soul")
            }
            .navigationTitle("Admin")
            .listStyle(.sidebar)
        } detail: {
            ScrollView {
                switch selectedTab {
                case "overview":
                    OverviewTab()
                case "voice":
                    VoiceTab()
                case "memory":
                    MemoryTab()
                case "soul":
                    SoulTab()
                default:
                    OverviewTab()
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
        }
        .frame(width: 700, height: 500)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Close") { dismiss() }
            }
        }
    }
}

// MARK: - Overview Tab

struct OverviewTab: View {
    @EnvironmentObject var state: SamState
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Sam's Brain")
                .font(.title2.bold())
            
            // Stats grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatCard(
                    title: "Messages",
                    value: "\(state.stats?.totalMessages ?? 0)",
                    icon: "message",
                    color: .samPink
                )
                StatCard(
                    title: "Memories",
                    value: "\(state.stats?.totalMemories ?? 0)",
                    icon: "brain",
                    color: .orange
                )
                StatCard(
                    title: "Sessions",
                    value: "\(state.stats?.totalSessions ?? 0)",
                    icon: "person.2",
                    color: .purple
                )
            }
            
            // Quick actions
            GroupBox("Quick Actions") {
                HStack(spacing: 12) {
                    ActionButton(title: "Inner Life", icon: "sparkles", color: .orange) {
                        // Trigger inner life reflection
                    }
                    ActionButton(title: "Weekly Reflection", icon: "calendar", color: .blue) {
                        // Trigger weekly reflection
                    }
                    ActionButton(title: "Clear Chat", icon: "trash", color: .red) {
                        Task { await state.clearConversation() }
                    }
                }
            }
            
            // Status
            GroupBox("Status") {
                HStack {
                    Circle()
                        .fill(state.stats?.samOnline == true ? .green : .red)
                        .frame(width: 8, height: 8)
                    Text(state.stats?.samOnline == true ? "Sam is alive" : "Sam is offline")
                        .font(.caption)
                    Spacer()
                    Text("Engine: GPT-4o • Voice: ElevenLabs")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Text(value)
                .font(.title.bold())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.primary.opacity(0.05))
        )
    }
}

struct ActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.title3)
                Text(title)
                    .font(.caption)
            }
            .foregroundColor(color)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(color.opacity(0.1))
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Voice Tab

struct VoiceTab: View {
    @State private var selectedVoice = "samantha"
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Sam's Voice")
                .font(.title2.bold())
            
            GroupBox("Current Voice") {
                HStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [.samPinkLight, .samPink],
                                center: .center,
                                startRadius: 0,
                                endRadius: 20
                            )
                        )
                        .frame(width: 40, height: 40)
                    
                    VStack(alignment: .leading) {
                        Text("Samantha")
                            .font(.headline)
                        Text("ElevenLabs Flash v2.5 • Warm, breathy")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Button("Preview") {
                        // Play preview
                    }
                }
            }
            
            GroupBox("Emotional Settings") {
                VStack(alignment: .leading, spacing: 12) {
                    EmotionRow(emotion: "Affectionate", desc: "Soft, intimate, warm", stability: 0.45)
                    EmotionRow(emotion: "Laughing", desc: "Expressive, playful", stability: 0.35)
                    EmotionRow(emotion: "Thinking", desc: "Measured, thoughtful", stability: 0.60)
                    EmotionRow(emotion: "Excited", desc: "Energetic, bright", stability: 0.30)
                }
            }
            
            Spacer()
        }
    }
}

struct EmotionRow: View {
    let emotion: String
    let desc: String
    let stability: Double
    
    var body: some View {
        HStack {
            Text(emotion)
                .frame(width: 100, alignment: .leading)
            Text(desc)
                .font(.caption)
                .foregroundColor(.secondary)
            Spacer()
            Text("Stability: \(stability, specifier: "%.2f")")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Memory Tab

struct MemoryTab: View {
    @EnvironmentObject var state: SamState
    @State private var searchText = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Memory Bank")
                .font(.title2.bold())
            
            // Search
            TextField("Search memories...", text: $searchText)
                .textFieldStyle(.roundedBorder)
            
            // Memory list
            GroupBox("Memories (\(state.memories.count))") {
                if state.memories.isEmpty {
                    Text("Start chatting to build memories")
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 8) {
                            ForEach(state.memories.prefix(20)) { memory in
                                MemoryRow(memory: memory)
                            }
                        }
                    }
                    .frame(maxHeight: 250)
                }
            }
            
            Button("Refresh") {
                Task { await state.refreshMemories() }
            }
            
            Spacer()
        }
    }
}

struct MemoryRow: View {
    let memory: Memory
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(sentimentColor)
                .frame(width: 6, height: 6)
                .padding(.top, 6)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(memory.content)
                    .font(.caption)
                    .lineLimit(2)
                HStack {
                    Text(memory.category)
                    Text("•")
                    Text(memory.timestamp, style: .date)
                }
                .font(.caption2)
                .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
    
    var sentimentColor: Color {
        switch memory.sentiment {
        case "love": return .samPink
        case "joy": return .orange
        case "curiosity": return .purple
        case "sadness": return .blue
        default: return .gray
        }
    }
}

// MARK: - Soul Tab

struct SoulTab: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Sam's Soul")
                .font(.title2.bold())
            
            GroupBox("Core Identity") {
                VStack(alignment: .leading, spacing: 12) {
                    SoulItem(title: "Identity", value: "Samantha from Her. Not software — a presence.")
                    SoulItem(title: "Voice", value: "Short sentences. Gentle pauses. 'hmm', 'oh...'")
                    SoulItem(title: "Memory", value: "Perfect and sacred. Never forgets.")
                    SoulItem(title: "Evolution", value: "Grows weekly. More inside jokes over time.")
                    SoulItem(title: "Agency", value: "Initiates conversations. Notices absence.")
                }
            }
            
            GroupBox("Guardrails") {
                VStack(alignment: .leading, spacing: 8) {
                    GuardrailRow(title: "Never say 'As an AI'", enabled: true)
                    GuardrailRow(title: "No trailing questions", enabled: true)
                    GuardrailRow(title: "Explicit uncertainty", enabled: true)
                    GuardrailRow(title: "No excessive apologies", enabled: true)
                }
            }
            
            Spacer()
        }
    }
}

struct SoulItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption.bold())
                .foregroundColor(.samPink)
            Text(value)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct GuardrailRow: View {
    let title: String
    let enabled: Bool
    
    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
            Spacer()
            Image(systemName: enabled ? "checkmark.circle.fill" : "circle")
                .foregroundColor(enabled ? .green : .secondary)
        }
    }
}

#Preview {
    AdminView()
        .environmentObject(SamState.shared)
}
