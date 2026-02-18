//
//  ContentView.swift
//  Sam
//
//  Main view with the floating orb
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var state: SamState
    @State private var isHovering = false
    
    var orbState: OrbState {
        if state.isSpeaking { return .speaking }
        if state.isThinking { return .thinking }
        if state.isListening { return .listening }
        return .idle
    }
    
    var body: some View {
        ZStack {
            // Transparent background
            Color.clear
            
            VStack(spacing: 0) {
                // Main orb area
                orbView
                    .frame(height: 280)
                
                // Chat area (expandable)
                if state.showChat || !state.messages.isEmpty {
                    chatView
                        .frame(maxHeight: 300)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                
                // Input area
                inputArea
                    .padding(.horizontal, 20)
                    .padding(.bottom, 16)
            }
        }
        .frame(width: 400)
        .frame(minHeight: 360, maxHeight: 700)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.15), radius: 20, y: 10)
        )
        .sheet(isPresented: $state.showAdmin) {
            AdminView()
                .environmentObject(state)
        }
        .sheet(isPresented: $state.showGarden) {
            GardenView()
                .environmentObject(state)
        }
    }
    
    // MARK: - Orb View
    
    var orbView: some View {
        VStack(spacing: 16) {
            Spacer()
            
            // The Orb
            ZStack {
                // Outer glow rings (for listening state)
                if orbState == .listening {
                    ForEach(0..<3) { i in
                        Circle()
                            .stroke(Color.samPink.opacity(0.3 - Double(i) * 0.1), lineWidth: 2)
                            .frame(width: 160 + CGFloat(i) * 30)
                            .scaleEffect(1 + state.audioAmplitude * 0.2)
                            .animation(.easeOut(duration: 0.5).delay(Double(i) * 0.1), value: orbState)
                    }
                }
                
                // Soft glow background
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.samPink.opacity(0.4),
                                Color.samPink.opacity(0.1),
                                Color.clear
                            ],
                            center: .center,
                            startRadius: 40,
                            endRadius: 100
                        )
                    )
                    .frame(width: 200, height: 200)
                    .blur(radius: 20)
                
                // Main orb
                Circle()
                    .fill(
                        RadialGradient(
                            colors: orbGradientColors,
                            center: UnitPoint(x: 0.35, y: 0.35),
                            startRadius: 0,
                            endRadius: 60
                        )
                    )
                    .frame(width: orbSize, height: orbSize)
                    .shadow(color: Color.samPink.opacity(0.5), radius: 20)
                    .scaleEffect(orbScale)
                    .animation(.easeInOut(duration: 0.3), value: orbState)
                    .animation(.easeInOut(duration: 0.1), value: state.audioAmplitude)
            }
            .onTapGesture {
                Task { await state.toggleListening() }
            }
            .onHover { hovering in
                withAnimation(.easeInOut(duration: 0.2)) {
                    isHovering = hovering
                }
            }
            
            // Status text
            Text(statusText)
                .font(.system(size: 11, weight: .medium))
                .tracking(2)
                .foregroundColor(.secondary)
                .textCase(.uppercase)
            
            Spacer()
        }
    }
    
    var orbGradientColors: [Color] {
        switch orbState {
        case .idle:
            return [.samPinkLight, .samPink, .samPinkDark]
        case .listening:
            return [.samPinkLighter, .samPinkLight, .samPink]
        case .thinking:
            return [.samPinkLighter, .samPinkLight, .samPink]
        case .speaking:
            return [.white.opacity(0.9), .samPinkLight, .samPink, .samPinkDark]
        }
    }
    
    var orbSize: CGFloat {
        let base: CGFloat = 100
        let amplitudeBoost = state.audioAmplitude * 20
        return base + amplitudeBoost
    }
    
    var orbScale: CGFloat {
        switch orbState {
        case .idle: return isHovering ? 1.05 : 1.0
        case .listening: return 1.1
        case .thinking: return 1.02
        case .speaking: return 1.05 + state.audioAmplitude * 0.1
        }
    }
    
    var statusText: String {
        switch orbState {
        case .idle: return "Hold Space · Click Orb"
        case .listening: return "Listening..."
        case .thinking: return "Thinking..."
        case .speaking: return "Click to Stop"
        }
    }
    
    // MARK: - Chat View
    
    var chatView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(state.messages.suffix(20)) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }
                    
                    if state.isThinking {
                        ThinkingIndicator()
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
            }
            .onChange(of: state.messages.count) { _ in
                if let lastId = state.messages.last?.id {
                    withAnimation {
                        proxy.scrollTo(lastId, anchor: .bottom)
                    }
                }
            }
        }
    }
    
    // MARK: - Input Area
    
    var inputArea: some View {
        HStack(spacing: 12) {
            // Mic button
            Button(action: {
                Task { await state.toggleListening() }
            }) {
                Image(systemName: state.isListening ? "mic.fill" : "mic")
                    .font(.system(size: 16))
                    .foregroundColor(state.isListening ? .samPink : .secondary)
                    .frame(width: 36, height: 36)
                    .background(
                        Circle()
                            .fill(state.isListening ? Color.samPink.opacity(0.15) : Color.clear)
                    )
            }
            .buttonStyle(.plain)
            
            // Text input
            TextField("Say something...", text: .constant(""))
                .textFieldStyle(.plain)
                .font(.system(size: 14))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.primary.opacity(0.05))
                )
                .onSubmit {
                    // Handle text input
                }
            
            // More options
            Menu {
                Button("Admin Portal") { state.showAdmin = true }
                Button("Memory Garden") { state.showGarden = true }
                Divider()
                Button("Settings...") { }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16))
                    .foregroundColor(.secondary)
                    .frame(width: 36, height: 36)
            }
            .menuStyle(.borderlessButton)
        }
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 60) }
            
            VStack(alignment: message.role == .sam ? .leading : .trailing, spacing: 4) {
                Text(message.content)
                    .font(.system(size: 13))
                    .foregroundColor(message.role == .sam ? .primary : .secondary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(message.role == .sam 
                                ? Color.clear 
                                : Color.primary.opacity(0.05))
                    )
                
                Text(message.timestamp, style: .time)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary.opacity(0.6))
            }
            
            if message.role == .sam { Spacer(minLength: 60) }
        }
    }
}

// MARK: - Thinking Indicator

struct ThinkingIndicator: View {
    @State private var animating = false
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color.samPink)
                    .frame(width: 6, height: 6)
                    .scaleEffect(animating ? 1 : 0.5)
                    .animation(
                        .easeInOut(duration: 0.6)
                        .repeatForever()
                        .delay(Double(i) * 0.2),
                        value: animating
                    )
            }
        }
        .padding(.vertical, 12)
        .onAppear { animating = true }
    }
}

// MARK: - Color Extensions

extension Color {
    static let samPink = Color(red: 1.0, green: 0.42, blue: 0.62)
    static let samPinkLight = Color(red: 1.0, green: 0.56, blue: 0.69)
    static let samPinkLighter = Color(red: 1.0, green: 0.71, blue: 0.76)
    static let samPinkDark = Color(red: 0.91, green: 0.29, blue: 0.54)
}

#Preview {
    ContentView()
        .environmentObject(SamState.shared)
}
