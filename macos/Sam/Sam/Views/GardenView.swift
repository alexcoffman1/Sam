//
//  GardenView.swift
//  Sam
//
//  Memory Garden visualization
//

import SwiftUI

struct GardenView: View {
    @EnvironmentObject var state: SamState
    @Environment(\.dismiss) var dismiss
    @State private var selectedCategory: String? = nil
    @State private var selectedMemory: Memory? = nil
    @State private var searchText = ""
    
    let categories = [
        ("feeling", "💭", Color.samPink),
        ("person", "👤", Color.purple),
        ("place", "📍", Color.blue),
        ("event", "📅", Color.orange),
        ("idea", "💡", Color.yellow),
        ("preference", "⭐", Color.green)
    ]
    
    var filteredMemories: [Memory] {
        var memories = state.memories
        
        if let cat = selectedCategory {
            memories = memories.filter { $0.category == cat }
        }
        
        if !searchText.isEmpty {
            memories = memories.filter { 
                $0.content.localizedCaseInsensitiveContains(searchText) 
            }
        }
        
        return memories
    }
    
    var body: some View {
        NavigationSplitView {
            VStack(alignment: .leading, spacing: 16) {
                // Header
                Text("Memory Garden")
                    .font(.title2.bold())
                    .padding(.horizontal)
                
                // Category filters
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        CategoryPill(
                            label: "All",
                            emoji: "🌸",
                            color: .gray,
                            isSelected: selectedCategory == nil
                        ) {
                            selectedCategory = nil
                        }
                        
                        ForEach(categories, id: \.0) { cat in
                            CategoryPill(
                                label: cat.0.capitalized,
                                emoji: cat.1,
                                color: cat.2,
                                isSelected: selectedCategory == cat.0
                            ) {
                                selectedCategory = selectedCategory == cat.0 ? nil : cat.0
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Search
                TextField("Search memories...", text: $searchText)
                    .textFieldStyle(.roundedBorder)
                    .padding(.horizontal)
                
                // Memory list
                List(filteredMemories, selection: $selectedMemory) { memory in
                    MemoryListRow(memory: memory)
                        .tag(memory)
                }
                .listStyle(.sidebar)
            }
            .frame(minWidth: 280)
        } detail: {
            if let memory = selectedMemory {
                MemoryDetail(memory: memory)
            } else {
                // Garden visualization
                GardenCanvas(memories: filteredMemories)
            }
        }
        .frame(width: 900, height: 600)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Close") { dismiss() }
            }
            ToolbarItem(placement: .primaryAction) {
                Button {
                    Task { await state.refreshMemories() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
    }
}

// MARK: - Category Pill

struct CategoryPill: View {
    let label: String
    let emoji: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(emoji)
                    .font(.caption)
                Text(label)
                    .font(.caption)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(isSelected ? color.opacity(0.2) : Color.clear)
            )
            .overlay(
                Capsule()
                    .stroke(isSelected ? color : Color.secondary.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .foregroundColor(isSelected ? color : .secondary)
    }
}

// MARK: - Memory List Row

struct MemoryListRow: View {
    let memory: Memory
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(categoryEmoji)
                Text(memory.category.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(memory.timestamp, style: .date)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Text(memory.content)
                .font(.callout)
                .lineLimit(2)
        }
        .padding(.vertical, 4)
    }
    
    var categoryEmoji: String {
        switch memory.category {
        case "feeling": return "💭"
        case "person": return "👤"
        case "place": return "📍"
        case "event": return "📅"
        case "idea": return "💡"
        case "preference": return "⭐"
        default: return "🌸"
        }
    }
}

// MARK: - Memory Detail

struct MemoryDetail: View {
    let memory: Memory
    
    var body: some View {
        VStack(spacing: 24) {
            // Category badge
            HStack {
                Text(categoryEmoji)
                    .font(.largeTitle)
                Text(memory.category.capitalized)
                    .font(.title3)
                    .foregroundColor(.secondary)
            }
            
            // Content
            Text(memory.content)
                .font(.title3)
                .multilineTextAlignment(.center)
                .padding()
            
            // Metadata
            VStack(spacing: 8) {
                HStack {
                    Text("Sentiment")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(memory.sentiment)
                        .foregroundColor(sentimentColor)
                }
                
                HStack {
                    Text("Recorded")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(memory.timestamp, style: .date)
                }
            }
            .font(.caption)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.primary.opacity(0.05))
            )
            .padding(.horizontal, 40)
            
            Spacer()
        }
        .padding()
    }
    
    var categoryEmoji: String {
        switch memory.category {
        case "feeling": return "💭"
        case "person": return "👤"
        case "place": return "📍"
        case "event": return "📅"
        case "idea": return "💡"
        case "preference": return "⭐"
        default: return "🌸"
        }
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

// MARK: - Garden Canvas (Flower Visualization)

struct GardenCanvas: View {
    let memories: [Memory]
    @State private var nodes: [FlowerNode] = []
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Background
                Color.white.opacity(0.02)
                
                // Flowers
                ForEach(nodes) { node in
                    FlowerView(node: node)
                        .position(node.position)
                }
            }
            .onAppear {
                generateNodes(in: geo.size)
            }
            .onChange(of: memories.count) { _ in
                generateNodes(in: geo.size)
            }
        }
    }
    
    func generateNodes(in size: CGSize) {
        nodes = memories.enumerated().map { index, memory in
            let angle = Double(index) * 0.618033988749895 * .pi * 2
            let radius = sqrt(Double(index + 1)) * 40
            let x = size.width / 2 + CGFloat(cos(angle) * radius)
            let y = size.height / 2 + CGFloat(sin(angle) * radius)
            
            return FlowerNode(
                id: memory.id,
                position: CGPoint(x: x, y: y),
                category: memory.category,
                sentiment: memory.sentiment,
                content: memory.content
            )
        }
    }
}

struct FlowerNode: Identifiable {
    let id: String
    let position: CGPoint
    let category: String
    let sentiment: String
    let content: String
}

struct FlowerView: View {
    let node: FlowerNode
    @State private var isHovered = false
    
    var body: some View {
        ZStack {
            // Glow
            Circle()
                .fill(color.opacity(0.3))
                .frame(width: 30, height: 30)
                .blur(radius: 8)
            
            // Flower
            Circle()
                .fill(
                    RadialGradient(
                        colors: [color.opacity(0.8), color],
                        center: .center,
                        startRadius: 0,
                        endRadius: 10
                    )
                )
                .frame(width: isHovered ? 20 : 14, height: isHovered ? 20 : 14)
        }
        .onHover { hovering in
            withAnimation(.easeOut(duration: 0.2)) {
                isHovered = hovering
            }
        }
        .help(node.content)
    }
    
    var color: Color {
        switch node.sentiment {
        case "love": return .samPink
        case "joy": return .orange
        case "curiosity": return .purple
        case "sadness": return .blue
        case "excitement": return .green
        default: return .gray
        }
    }
}

#Preview {
    GardenView()
        .environmentObject(SamState.shared)
}
