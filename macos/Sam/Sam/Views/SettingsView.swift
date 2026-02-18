//
//  SettingsView.swift
//  Sam
//
//  App settings and configuration
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var state: SamState
    @AppStorage("sam-api-url") private var apiURL = "http://localhost:8001/api"
    @AppStorage("sam-voice-enabled") private var voiceEnabled = true
    @AppStorage("sam-launch-at-login") private var launchAtLogin = false
    @AppStorage("sam-show-in-dock") private var showInDock = true
    @AppStorage("sam-global-hotkey") private var globalHotkey = true
    
    var body: some View {
        TabView {
            // General
            Form {
                Section {
                    Toggle("Launch at Login", isOn: $launchAtLogin)
                    Toggle("Show in Dock", isOn: $showInDock)
                    Toggle("Global Space Hotkey", isOn: $globalHotkey)
                } header: {
                    Text("General")
                }
                
                Section {
                    Toggle("Voice Enabled", isOn: $voiceEnabled)
                } header: {
                    Text("Voice")
                }
            }
            .tabItem {
                Label("General", systemImage: "gear")
            }
            .padding()
            
            // Connection
            Form {
                Section {
                    TextField("Backend URL", text: $apiURL)
                        .textFieldStyle(.roundedBorder)
                    
                    HStack {
                        Circle()
                            .fill(state.connectionStatus == .connected ? .green : .red)
                            .frame(width: 8, height: 8)
                        Text(connectionStatusText)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Button("Test Connection") {
                        Task { await state.loadInitialData() }
                    }
                } header: {
                    Text("Backend Connection")
                }
                
                Section {
                    LabeledContent("Session ID", value: state.sessionId)
                        .font(.caption)
                } header: {
                    Text("Session")
                }
            }
            .tabItem {
                Label("Connection", systemImage: "network")
            }
            .padding()
            
            // About
            VStack(spacing: 16) {
                // Orb
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [.samPinkLight, .samPink, .samPinkDark],
                            center: UnitPoint(x: 0.35, y: 0.35),
                            startRadius: 0,
                            endRadius: 40
                        )
                    )
                    .frame(width: 80, height: 80)
                    .shadow(color: .samPink.opacity(0.5), radius: 15)
                
                Text("Sam")
                    .font(.title.bold())
                
                Text("A warm, curious AI companion")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text("Version 1.0.0")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Divider()
                    .padding(.vertical)
                
                Text("Inspired by Her (2013)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Link("GitHub", destination: URL(string: "https://github.com/alexcoffman1/Sam")!)
                    .font(.caption)
            }
            .tabItem {
                Label("About", systemImage: "info.circle")
            }
            .padding(40)
        }
        .frame(width: 450, height: 300)
    }
    
    var connectionStatusText: String {
        switch state.connectionStatus {
        case .disconnected: return "Disconnected"
        case .connecting: return "Connecting..."
        case .connected: return "Connected"
        case .error(let msg): return "Error: \(msg)"
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(SamState.shared)
}
