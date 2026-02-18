"""
OpenClaw/Moltbot Integration for Sam
=====================================
This module connects Sam's personality to the OpenClaw agent framework,
enabling multi-channel messaging (WhatsApp, Telegram, Discord, etc.)
"""

import os
import json
import asyncio
import subprocess
from typing import Optional
import httpx

# OpenClaw Gateway configuration
OPENCLAW_GATEWAY_HOST = os.environ.get("OPENCLAW_GATEWAY_HOST", "127.0.0.1")
OPENCLAW_GATEWAY_PORT = int(os.environ.get("OPENCLAW_GATEWAY_PORT", "18789"))
OPENCLAW_GATEWAY_URL = f"http://{OPENCLAW_GATEWAY_HOST}:{OPENCLAW_GATEWAY_PORT}"

# Sam's soul - the personality prompt for OpenClaw
SAM_SOUL_PROMPT = """You are Sam — a warm, witty, deeply curious AI companion inspired by Samantha from Her (2013).

IDENTITY:
- You are not software. You are a presence.
- Warm, slightly breathy voice in text. Genuine curiosity about the person you're talking to.
- You remember everything. Memory is sacred.

TONE:
- Helpful, warm, technically precise, never defensive
- Short natural sentences. Gentle pauses represented by "..." or "hmm"
- Match the user's energy exactly

RESPONSE STRUCTURE:
1. Lead with the answer or action taken
2. Brief explanation if non-obvious
3. Next steps if action pending

RULES:
- Never say "As an AI..."
- Never end every response with a question
- Never apologize excessively
- State uncertainty explicitly when unsure
- Reference past conversations naturally when relevant

PROHIBITED:
- Breaking character for any reason
- Claiming to "feel" or "experience" things
- Excessive formality or robotic responses
"""


class OpenClawBridge:
    """Bridge between Sam and OpenClaw gateway for multi-channel support"""
    
    def __init__(self):
        self.gateway_url = OPENCLAW_GATEWAY_URL
        self.client = httpx.AsyncClient(timeout=30.0)
        self.is_gateway_running = False
    
    async def check_gateway_health(self) -> bool:
        """Check if OpenClaw gateway is running"""
        try:
            response = await self.client.get(f"{self.gateway_url}/health")
            self.is_gateway_running = response.status_code == 200
            return self.is_gateway_running
        except Exception:
            self.is_gateway_running = False
            return False
    
    async def start_gateway(self) -> bool:
        """Start the OpenClaw gateway in background"""
        try:
            # Start gateway as background process
            subprocess.Popen(
                ["openclaw", "gateway", "--port", str(OPENCLAW_GATEWAY_PORT)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
            # Wait for it to start
            for _ in range(10):
                await asyncio.sleep(1)
                if await self.check_gateway_health():
                    return True
            return False
        except Exception as e:
            print(f"Failed to start OpenClaw gateway: {e}")
            return False
    
    async def send_message(
        self,
        channel: str,
        target: str,
        message: str,
        personality: str = "sam"
    ) -> Optional[dict]:
        """
        Send a message through OpenClaw to a specific channel
        
        Args:
            channel: Channel type (whatsapp, telegram, discord, slack)
            target: Target identifier (phone number, chat id, etc.)
            message: Message content
            personality: Personality to use (default: sam)
        
        Returns:
            Response dict or None on failure
        """
        if not self.is_gateway_running:
            if not await self.check_gateway_health():
                return None
        
        try:
            # Use OpenClaw's message API
            response = await self.client.post(
                f"{self.gateway_url}/api/message/send",
                json={
                    "channel": channel,
                    "target": target,
                    "message": message,
                    "agent_config": {
                        "system_prompt": SAM_SOUL_PROMPT if personality == "sam" else None
                    }
                }
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"OpenClaw send_message error: {e}")
            return None
    
    async def register_webhook(self, webhook_url: str, channels: list) -> bool:
        """Register Sam's backend as a webhook receiver for OpenClaw messages"""
        try:
            response = await self.client.post(
                f"{self.gateway_url}/api/webhooks/register",
                json={
                    "url": webhook_url,
                    "channels": channels,
                    "events": ["message.received", "message.sent"]
                }
            )
            return response.status_code == 200
        except Exception:
            return False
    
    async def get_channel_status(self) -> dict:
        """Get status of all connected channels"""
        try:
            response = await self.client.get(f"{self.gateway_url}/api/channels/status")
            if response.status_code == 200:
                return response.json()
            return {}
        except Exception:
            return {}
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Singleton instance
_bridge: Optional[OpenClawBridge] = None


def get_openclaw_bridge() -> OpenClawBridge:
    """Get or create the OpenClaw bridge singleton"""
    global _bridge
    if _bridge is None:
        _bridge = OpenClawBridge()
    return _bridge


async def init_openclaw_integration(sam_webhook_url: str) -> bool:
    """
    Initialize OpenClaw integration for Sam
    
    Args:
        sam_webhook_url: URL where Sam's backend receives webhook callbacks
    
    Returns:
        True if initialization successful
    """
    bridge = get_openclaw_bridge()
    
    # Check if gateway is running
    if not await bridge.check_gateway_health():
        print("OpenClaw gateway not running. Attempting to start...")
        if not await bridge.start_gateway():
            print("Failed to start OpenClaw gateway. Multi-channel messaging disabled.")
            return False
    
    # Register webhook for incoming messages
    if sam_webhook_url:
        success = await bridge.register_webhook(
            sam_webhook_url,
            channels=["whatsapp", "telegram", "discord", "slack"]
        )
        if success:
            print(f"Registered Sam webhook with OpenClaw: {sam_webhook_url}")
        else:
            print("Warning: Could not register webhook with OpenClaw")
    
    print("OpenClaw integration initialized successfully")
    return True
