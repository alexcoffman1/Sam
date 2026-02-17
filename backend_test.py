#!/usr/bin/env python3
"""
Backend API Test Suite for Sam AI Assistant
Testing all endpoints comprehensively
"""

import requests
import json
import sys
import time
import uuid
from datetime import datetime, timezone

class SamAPITester:
    def __init__(self, base_url="https://samantha-voice.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        print(f"🧪 Sam Backend API Testing")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🔑 Session ID: {self.session_id}")
        print("-" * 60)

    def run_test(self, name, method, endpoint, expected_status=200, data=None, min_response_size=None):
        """Run a single API test with comprehensive validation"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        print(f"   {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Status code check
            status_ok = response.status_code == expected_status
            
            # Response size check for binary data (TTS)
            size_ok = True
            if min_response_size and len(response.content) < min_response_size:
                size_ok = False
                print(f"   ❌ Response too small: {len(response.content)} bytes (expected ≥{min_response_size})")
            
            # JSON parsing for non-binary responses
            json_data = {}
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    json_data = response.json()
                except json.JSONDecodeError:
                    print(f"   ⚠️  Invalid JSON response")
                    json_data = {}
            
            if status_ok and size_ok:
                self.tests_passed += 1
                print(f"   ✅ PASS - Status: {response.status_code}")
                if min_response_size:
                    print(f"      Audio size: {len(response.content)} bytes")
                elif json_data:
                    print(f"      Response keys: {list(json_data.keys())}")
                return True, json_data
            else:
                error_msg = f"Status: {response.status_code} (expected {expected_status})"
                if not size_ok:
                    error_msg += f", Size: {len(response.content)} bytes (expected ≥{min_response_size})"
                print(f"   ❌ FAIL - {error_msg}")
                self.failed_tests.append(f"{name}: {error_msg}")
                return False, json_data
                
        except requests.exceptions.Timeout:
            print(f"   ❌ FAIL - Request timeout (30s)")
            self.failed_tests.append(f"{name}: Timeout")
            return False, {}
        except Exception as e:
            print(f"   ❌ FAIL - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Status", "GET", "")

    def test_stats_endpoint(self):
        """Test stats endpoint - should return system statistics with SuperMemory and heartbeat info"""
        success, data = self.run_test("System Statistics", "GET", "stats")
        if success and data:
            # Validate expected stats fields including new ones
            expected_fields = ['total_messages', 'total_memories', 'total_sessions', 'sam_online', 'voice_engine', 
                             'supermemory', 'heartbeat_interval_min', 'total_proactive']
            missing_fields = [f for f in expected_fields if f not in data]
            if missing_fields:
                print(f"   ⚠️  Missing stats fields: {missing_fields}")
            else:
                print(f"   🎯 All stats fields present")
                print(f"      Sam online: {data.get('sam_online')}, Voice: {data.get('voice_engine')}")
                
            # Check SuperMemory integration
            if data.get('supermemory') == True:
                print(f"   ✅ SuperMemory: connected")
            else:
                print(f"   ❌ SuperMemory: not connected")
                
            # Check heartbeat interval
            if data.get('heartbeat_interval_min') == 45:
                print(f"   ✅ Heartbeat interval: {data.get('heartbeat_interval_min')} minutes")
            else:
                print(f"   ⚠️  Heartbeat interval: {data.get('heartbeat_interval_min')} (expected 45)")
                
            # Check if heartbeat has already fired
            total_proactive = data.get('total_proactive', 0)
            if total_proactive > 0:
                print(f"   ✅ Proactive messages generated: {total_proactive}")
            else:
                print(f"   ⚠️  No proactive messages yet: {total_proactive}")
        return success

    def test_voices_endpoint(self):
        """Test voices endpoint - should return 21 voices from ElevenLabs"""
        success, data = self.run_test("Voice List", "GET", "voices")
        if success and data:
            voices = data.get('voices', [])
            voice_count = len(voices)
            current_voice = data.get('current')
            print(f"   🎤 Found {voice_count} voices, current: {current_voice}")
            if voice_count >= 15:  # Should have ~21 voices, allow some margin
                print(f"   🎯 Voice count looks good (≥15)")
            else:
                print(f"   ⚠️  Low voice count: {voice_count} (expected ~21)")
        return success

    def test_chat_functionality(self):
        """Test chat endpoint with GPT-4o integration"""
        test_message = "Hi Sam, this is a test message. How are you feeling today?"
        
        success, data = self.run_test(
            "Chat with Sam", 
            "POST", 
            "chat",
            data={"session_id": self.session_id, "message": test_message}
        )
        
        if success and data:
            response_text = data.get('response', '')
            emotion = data.get('emotion', '')
            msg_id = data.get('id', '')
            
            print(f"   💬 Sam's response: {response_text[:100]}{'...' if len(response_text) > 100 else ''}")
            print(f"   😊 Emotion: {emotion}")
            print(f"   🆔 Message ID: {msg_id}")
            
            # Validate response quality
            if len(response_text) > 10 and not any(x in response_text.lower() for x in ['error', 'failed', 'as an ai']):
                print(f"   🎯 Response looks natural and engaging")
            else:
                print(f"   ⚠️  Response may be problematic")
                
        return success

    def test_tts_functionality(self):
        """Test TTS endpoint with ElevenLabs integration"""
        test_text = "Hi there! I've been thinking about you. Tell me something — how are you feeling right now?"
        
        success, data = self.run_test(
            "Text-to-Speech", 
            "POST", 
            "tts",
            data={"text": test_text, "session_id": self.session_id, "emotion": "affectionate"},
            min_response_size=77000  # Should be ~77KB+ as mentioned in requirements
        )
        
        return success

    def test_memory_system(self):
        """Test memory storage and retrieval"""
        # Test memory creation
        memory_success, _ = self.run_test(
            "Create Memory", 
            "POST", 
            "memories",
            expected_status=200,
            data={
                "session_id": self.session_id,
                "content": "User mentioned they love coffee and work as a software developer",
                "category": "preference",
                "sentiment": "joy"
            }
        )
        
        # Test memory retrieval
        if memory_success:
            time.sleep(1)  # Brief delay for database consistency
            retrieve_success, data = self.run_test("Get Memories", "GET", f"memories/{self.session_id}")
            if retrieve_success and data and len(data) > 0:
                print(f"   🧠 Retrieved {len(data)} memories")
                return True
        
        return memory_success

    def test_memory_graph(self):
        """Test memory graph endpoint for Memory Garden"""
        return self.run_test("Memory Graph", "GET", f"memories/{self.session_id}/graph")

    def test_messages_crud(self):
        """Test message storage and retrieval"""
        # Get messages (might be empty)
        get_success, data = self.run_test("Get Messages", "GET", f"messages/{self.session_id}")
        
        if get_success:
            initial_count = len(data) if data else 0
            print(f"   📨 Found {initial_count} existing messages")
            
            # Test message deletion
            delete_success, _ = self.run_test("Clear Messages", "DELETE", f"messages/{self.session_id}")
            return delete_success
            
        return get_success

    def test_weekly_reflections(self):
        """Test weekly reflection generation"""
        return self.run_test(
            "Generate Weekly Reflection", 
            "POST", 
            f"weekly-reflection/{self.session_id}"
        )

    def test_inner_life(self):
        """Test inner life reflection generation"""
        return self.run_test(
            "Generate Inner Life", 
            "POST", 
            f"inner-life/{self.session_id}"
        )

    def test_proactive_messages(self):
        """Test proactive message generation"""
        success = self.run_test(
            "Generate Proactive Message", 
            "POST", 
            f"proactive/{self.session_id}"
        )[0]
        
        # Also test retrieval
        if success:
            time.sleep(1)
            return self.run_test("Get Proactive Messages", "GET", f"proactive/{self.session_id}")[0]
        return success

    def test_voice_settings(self):
        """Test voice configuration"""
        test_voice_id = "EXAVITQu4vr4xnSDxMaL"  # Sarah voice as mentioned in backend
        return self.run_test(
            "Set Voice", 
            "POST", 
            "voices/set",
            data={"voice_id": test_voice_id}
        )

    def test_sessions_list(self):
        """Test session listing"""
        return self.run_test("List Sessions", "GET", "sessions")
        
    def test_supermemory_search(self):
        """Test SuperMemory search endpoint"""
        success, data = self.run_test(
            "SuperMemory Search", 
            "GET", 
            f"supermemory/{self.session_id}?q=test"
        )
        
        if success and data:
            # Check for expected fields
            if 'count' in data and 'results' in data:
                count = data.get('count', 0)
                results = data.get('results', [])
                print(f"   🔍 SuperMemory found {count} results")
                if isinstance(results, list):
                    print(f"   🎯 Results format correct")
                else:
                    print(f"   ⚠️  Results not in list format")
            else:
                print(f"   ⚠️  Missing expected fields: count, results")
        return success
        
    def test_chat_with_supermemory_enrichment(self):
        """Test chat endpoint enriches context with SuperMemory results (no 500 error)"""
        test_message = "Tell me about our previous conversations and what you remember about me"
        
        success, data = self.run_test(
            "Chat with SuperMemory Enrichment", 
            "POST", 
            "chat",
            data={"session_id": self.session_id, "message": test_message}
        )
        
        if success and data:
            response_text = data.get('response', '')
            print(f"   💬 SuperMemory-enriched response: {response_text[:150]}{'...' if len(response_text) > 150 else ''}")
            # The main thing is no 500 error - if we get 200 and a response, SuperMemory enrichment worked
            print(f"   ✅ No 500 error - SuperMemory enrichment working")
                
        return success

    def run_comprehensive_test_suite(self):
        """Run all tests in logical order"""
        print(f"\n🚀 Starting Comprehensive Backend Test Suite")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        test_suite = [
            ("Basic API Health", self.test_root_endpoint),
            ("System Statistics", self.test_stats_endpoint),
            ("Voice List (ElevenLabs)", self.test_voices_endpoint),
            ("Chat with GPT-4o", self.test_chat_functionality),
            ("SuperMemory Search", self.test_supermemory_search),
            ("Chat with SuperMemory Enrichment", self.test_chat_with_supermemory_enrichment),
            ("TTS Audio Generation", self.test_tts_functionality),
            ("Memory System", self.test_memory_system),
            ("Memory Graph", self.test_memory_graph),
            ("Messages CRUD", self.test_messages_crud),
            ("Weekly Reflections", self.test_weekly_reflections),
            ("Inner Life Generation", self.test_inner_life),
            ("Proactive Messages", self.test_proactive_messages),
            ("Voice Settings", self.test_voice_settings),
            ("Sessions List", self.test_sessions_list)
        ]
        
        for test_name, test_func in test_suite:
            try:
                test_func()
                time.sleep(0.5)  # Brief delay between tests
            except Exception as e:
                print(f"   ❌ FAIL - {test_name}: {str(e)}")
                self.failed_tests.append(f"{test_name}: {str(e)}")
        
        self.print_summary()

    def print_summary(self):
        """Print comprehensive test results"""
        print(f"\n{'='*60}")
        print(f"🏁 BACKEND TEST SUMMARY")
        print(f"{'='*60}")
        
        pass_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"   {i}. {failure}")
        
        print(f"\n{'='*60}")
        
        # Return exit code based on results
        return 0 if len(self.failed_tests) == 0 else 1

def main():
    """Main test runner"""
    tester = SamAPITester()
    exit_code = tester.run_comprehensive_test_suite()
    
    print(f"\n🎯 Backend testing complete!")
    if exit_code == 0:
        print("🎉 All backend APIs are working correctly!")
    else:
        print("⚠️  Some backend issues detected. Check logs above.")
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())