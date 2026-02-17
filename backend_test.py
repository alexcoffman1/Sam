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
        """Test stats endpoint - should return system statistics"""
        success, data = self.run_test("System Statistics", "GET", "stats")
        if success and data:
            # Validate expected stats fields
            expected_fields = ['total_messages', 'total_memories', 'total_sessions', 'sam_online', 'voice_engine']
            missing_fields = [f for f in expected_fields if f not in data]
            if missing_fields:
                print(f"   ⚠️  Missing stats fields: {missing_fields}")
            else:
                print(f"   🎯 All stats fields present")
                print(f"      Sam online: {data.get('sam_online')}, Voice: {data.get('voice_engine')}")
        return success
                    details = f"Stats: {data}"
            else:
                details = f"Status: {response.status_code}"
            return self.log_test("Stats Endpoint", success, details)
        except Exception as e:
            return self.log_test("Stats Endpoint", False, f"Error: {str(e)}")

    def test_sessions_endpoint(self):
        """Test /api/sessions endpoint"""
        try:
            response = requests.get(f"{self.base_url}/sessions", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Sessions: {len(data) if isinstance(data, list) else 'N/A'}"
            return self.log_test("Sessions Endpoint", success, details)
        except Exception as e:
            return self.log_test("Sessions Endpoint", False, f"Error: {str(e)}")

    def test_chat_endpoint(self):
        """Test /api/chat endpoint with GPT-4o"""
        try:
            payload = {
                "session_id": self.session_id,
                "message": "Hi Sam! This is a test message. Please respond briefly.",
                "user_name": "TestUser"
            }
            response = requests.post(f"{self.base_url}/chat", json=payload, timeout=30)
            success = response.status_code == 200
            if success:
                data = response.json()
                required_fields = ['id', 'session_id', 'response', 'emotion', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details = f"Missing fields: {missing_fields}"
                else:
                    details = f"Response: {data['response'][:100]}..., Emotion: {data['emotion']}"
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code}, Error: {error_data}"
                except:
                    details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            return self.log_test("Chat with GPT-4o", success, details)
        except Exception as e:
            return self.log_test("Chat with GPT-4o", False, f"Error: {str(e)}")

    def test_messages_retrieval(self):
        """Test /api/messages/{session_id} endpoint"""
        try:
            response = requests.get(f"{self.base_url}/messages/{self.session_id}?limit=50", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Retrieved {len(data)} messages"
            else:
                details = f"Status: {response.status_code}"
            return self.log_test("Messages Retrieval", success, details)
        except Exception as e:
            return self.log_test("Messages Retrieval", False, f"Error: {str(e)}")

    def test_tts_endpoint(self):
        """Test /api/tts endpoint for voice generation"""
        try:
            payload = {
                "text": "Hello, this is a TTS test.",
                "session_id": self.session_id
            }
            response = requests.post(f"{self.base_url}/tts", json=payload, timeout=15)
            success = response.status_code == 200
            if success:
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                details = f"Audio generated: {content_length} bytes, Type: {content_type}"
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code}, Error: {error_data}"
                except:
                    details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            return self.log_test("TTS Voice Generation", success, details)
        except Exception as e:
            return self.log_test("TTS Voice Generation", False, f"Error: {str(e)}")

    def test_memory_endpoints(self):
        """Test memory-related endpoints"""
        try:
            # Get memories
            response = requests.get(f"{self.base_url}/memories/{self.session_id}", timeout=10)
            success = response.status_code == 200
            if success:
                memories = response.json()
                details = f"Retrieved {len(memories)} memories"
            else:
                details = f"Status: {response.status_code}"
            return self.log_test("Memory Retrieval", success, details)
        except Exception as e:
            return self.log_test("Memory Retrieval", False, f"Error: {str(e)}")

    def test_memory_graph(self):
        """Test /api/memories/{session_id}/graph endpoint"""
        try:
            response = requests.get(f"{self.base_url}/memories/{self.session_id}/graph", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                nodes_count = len(data.get('nodes', []))
                links_count = len(data.get('links', []))
                details = f"Graph: {nodes_count} nodes, {links_count} links"
            else:
                details = f"Status: {response.status_code}"
            return self.log_test("Memory Graph", success, details)
        except Exception as e:
            return self.log_test("Memory Graph", False, f"Error: {str(e)}")

    def test_inner_life(self):
        """Test /api/inner-life/{session_id} endpoint"""
        try:
            response = requests.post(f"{self.base_url}/inner-life/{self.session_id}", timeout=20)
            success = response.status_code == 200
            if success:
                data = response.json()
                reflection = data.get('reflection', '')
                details = f"Reflection generated: {reflection[:100]}..."
            else:
                try:
                    error_data = response.json()
                    details = f"Status: {response.status_code}, Error: {error_data}"
                except:
                    details = f"Status: {response.status_code}"
            return self.log_test("Inner Life Reflection", success, details)
        except Exception as e:
            return self.log_test("Inner Life Reflection", False, f"Error: {str(e)}")

    def test_clear_conversation(self):
        """Test conversation clearing functionality"""
        try:
            response = requests.delete(f"{self.base_url}/messages/{self.session_id}", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                deleted_count = data.get('deleted', 0)
                details = f"Cleared {deleted_count} messages"
            else:
                details = f"Status: {response.status_code}"
            return self.log_test("Clear Conversation", success, details)
        except Exception as e:
            return self.log_test("Clear Conversation", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run comprehensive backend test suite"""
        print("🧪 Starting Sam AI Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Test Session ID: {self.session_id}")
        print("=" * 60)

        # Basic connectivity tests
        self.test_api_root()
        self.test_stats_endpoint()
        self.test_sessions_endpoint()

        # Core functionality tests
        self.test_chat_endpoint()  # This should create messages
        self.test_messages_retrieval()
        self.test_memory_endpoints()
        self.test_memory_graph()

        # AI features
        self.test_tts_endpoint()
        self.test_inner_life()

        # Admin functions
        self.test_clear_conversation()

        # Final results
        print("\n" + "=" * 60)
        print(f"📊 FINAL RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests PASSED - Backend is fully functional!")
            return 0
        else:
            print("⚠️  Some tests FAILED - Issues need attention")
            return 1

def main():
    tester = SamAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())