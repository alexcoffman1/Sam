//
//  SamApp.swift
//  Sam - A warm, curious AI companion
//
//  Native macOS app inspired by Her (2013)
//

import SwiftUI
import AppKit

@main
struct SamApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var samState = SamState.shared
    
    var body: some Scene {
        // Main floating orb window
        WindowGroup {
            ContentView()
                .environmentObject(samState)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultPosition(.center)
        .commands {
            CommandGroup(replacing: .newItem) {}
            CommandMenu("Sam") {
                Button("Admin Portal") {
                    samState.showAdmin.toggle()
                }
                .keyboardShortcut("a", modifiers: [.command, .shift])
                
                Button("Memory Garden") {
                    samState.showGarden.toggle()
                }
                .keyboardShortcut("g", modifiers: [.command, .shift])
                
                Divider()
                
                Button("Clear Conversation") {
                    Task { await samState.clearConversation() }
                }
                .keyboardShortcut(.delete, modifiers: [.command])
            }
        }
        
        // Settings window
        Settings {
            SettingsView()
                .environmentObject(samState)
        }
    }
}

@MainActor
class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Setup menu bar icon
        setupMenuBar()
        
        // Make the app a floating panel-style app
        if let window = NSApp.windows.first {
            window.level = .floating
            window.isOpaque = false
            window.backgroundColor = .clear
            window.hasShadow = true
            window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        }
        
        // Setup global hotkey for Space
        NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { event in
            if event.keyCode == 49 { // Space key
                NotificationCenter.default.post(name: .spaceKeyPressed, object: nil)
            }
        }
        
        NSEvent.addGlobalMonitorForEvents(matching: .keyUp) { event in
            if event.keyCode == 49 { // Space key
                NotificationCenter.default.post(name: .spaceKeyReleased, object: nil)
            }
        }
    }
    
    func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "circle.fill", accessibilityDescription: "Sam")
            button.image?.isTemplate = false
            
            // Tint the image pink
            if let image = button.image {
                let tinted = image.copy() as! NSImage
                tinted.lockFocus()
                NSColor(red: 1.0, green: 0.42, blue: 0.62, alpha: 1.0).set()
                let rect = NSRect(origin: .zero, size: tinted.size)
                rect.fill(using: .sourceAtop)
                tinted.unlockFocus()
                button.image = tinted
            }
        }
        
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Show Sam", action: #selector(showMainWindow), keyEquivalent: "s"))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Admin Portal", action: #selector(showAdmin), keyEquivalent: "a"))
        menu.addItem(NSMenuItem(title: "Memory Garden", action: #selector(showGarden), keyEquivalent: "g"))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit Sam", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        statusItem?.menu = menu
    }
    
    @objc func showMainWindow() {
        NSApp.activate(ignoringOtherApps: true)
        NSApp.windows.first?.makeKeyAndOrderFront(nil)
    }
    
    @objc func showAdmin() {
        SamState.shared.showAdmin = true
        showMainWindow()
    }
    
    @objc func showGarden() {
        SamState.shared.showGarden = true
        showMainWindow()
    }
}

extension Notification.Name {
    static let spaceKeyPressed = Notification.Name("spaceKeyPressed")
    static let spaceKeyReleased = Notification.Name("spaceKeyReleased")
}
