//
//  AudioService.swift
//  Sam
//
//  Handles audio recording and playback
//

import Foundation
import AVFoundation
import Combine

class AudioService: NSObject, ObservableObject {
    static let shared = AudioService()
    
    @Published var amplitude: CGFloat = 0
    @Published var isRecording = false
    @Published var isPlaying = false
    
    private var audioRecorder: AVAudioRecorder?
    private var audioPlayer: AVAudioPlayer?
    private var recordingURL: URL?
    private var amplitudeTimer: Timer?
    private var playbackCompletion: (() -> Void)?
    
    private override init() {
        super.init()
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        // Request microphone permission
        AVCaptureDevice.requestAccess(for: .audio) { granted in
            if granted {
                print("Microphone access granted")
            } else {
                print("Microphone access denied")
            }
        }
    }
    
    // MARK: - Recording
    
    func startRecording() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        recordingURL = documentsPath.appendingPathComponent("sam_recording.wav")
        
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 16000.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        do {
            audioRecorder = try AVAudioRecorder(url: recordingURL!, settings: settings)
            audioRecorder?.isMeteringEnabled = true
            audioRecorder?.record()
            isRecording = true
            
            // Start amplitude monitoring
            amplitudeTimer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in
                self?.updateAmplitude()
            }
            
        } catch {
            print("Recording failed: \(error)")
        }
    }
    
    func stopRecording() -> Data? {
        amplitudeTimer?.invalidate()
        amplitudeTimer = nil
        amplitude = 0
        
        guard let recorder = audioRecorder, recorder.isRecording else {
            return nil
        }
        
        recorder.stop()
        isRecording = false
        
        // Read the recorded data
        guard let url = recordingURL else { return nil }
        
        do {
            let data = try Data(contentsOf: url)
            // Clean up file
            try? FileManager.default.removeItem(at: url)
            return data
        } catch {
            print("Failed to read recording: \(error)")
            return nil
        }
    }
    
    private func updateAmplitude() {
        audioRecorder?.updateMeters()
        
        if let power = audioRecorder?.averagePower(forChannel: 0) {
            // Convert dB to linear scale (0-1)
            let linear = pow(10, power / 20)
            DispatchQueue.main.async {
                self.amplitude = CGFloat(min(1, max(0, linear * 2)))
            }
        }
    }
    
    // MARK: - Playback
    
    func play(_ data: Data, completion: (() -> Void)? = nil) {
        playbackCompletion = completion
        
        do {
            audioPlayer = try AVAudioPlayer(data: data)
            audioPlayer?.delegate = self
            audioPlayer?.isMeteringEnabled = true
            audioPlayer?.play()
            isPlaying = true
            
            // Monitor playback amplitude
            amplitudeTimer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in
                self?.updatePlaybackAmplitude()
            }
            
        } catch {
            print("Playback failed: \(error)")
            completion?()
        }
    }
    
    func stopPlayback() {
        amplitudeTimer?.invalidate()
        amplitudeTimer = nil
        amplitude = 0
        
        audioPlayer?.stop()
        isPlaying = false
    }
    
    private func updatePlaybackAmplitude() {
        audioPlayer?.updateMeters()
        
        if let power = audioPlayer?.averagePower(forChannel: 0) {
            let linear = pow(10, power / 20)
            DispatchQueue.main.async {
                self.amplitude = CGFloat(min(1, max(0, linear * 2)))
            }
        }
    }
}

extension AudioService: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        DispatchQueue.main.async {
            self.amplitudeTimer?.invalidate()
            self.amplitudeTimer = nil
            self.amplitude = 0
            self.isPlaying = false
            self.playbackCompletion?()
        }
    }
}
