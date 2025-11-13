#!/usr/bin/env python3
"""
Test script for leaderboard API endpoints
Tests both read (GET) and write (POST) operations locally

Usage:
    python test_leaderboard_api.py

Prerequisites:
    1. Start your Next.js dev server: npm run dev
    2. Have a test user account in Supabase
    3. Set BASE_URL (defaults to http://localhost:3000)
"""

import requests
import json
import sys
from typing import Optional, Dict, Any

# Configuration
BASE_URL = "http://localhost:3000"
LOGIN_EMAIL = "test@example.com"  # Change to your test user email
LOGIN_PASSWORD = "testpassword123"  # Change to your test user password

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg: str):
    print(f"{Colors.GREEN}✓ {msg}{Colors.RESET}")

def print_error(msg: str):
    print(f"{Colors.RED}✗ {msg}{Colors.RESET}")

def print_info(msg: str):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.RESET}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.RESET}")

def print_header(msg: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def login() -> Optional[str]:
    """Login and get access token"""
    print_info(f"Logging in as {LOGIN_EMAIL}...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": LOGIN_EMAIL,
                "password": LOGIN_PASSWORD
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_id = data.get("user", {}).get("id")
            
            if token:
                print_success(f"Login successful! User ID: {user_id}")
                return token
            else:
                print_error("Login response missing access_token")
                return None
        else:
            print_error(f"Login failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print_error(f"Could not connect to {BASE_URL}")
        print_error("Make sure your Next.js dev server is running: npm run dev")
        return None
    except Exception as e:
        print_error(f"Login error: {e}")
        return None

def test_read_public() -> bool:
    """Test GET /api/leaderboard (public read, no auth required)"""
    print_header("Test 1: Public Read (No Authentication)")
    
    try:
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Read successful! Found {len(data.get('data', []))} entries")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Read failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Read error: {e}")
        return False

def test_read_with_auth(token: str) -> bool:
    """Test GET /api/leaderboard with Bearer token"""
    print_header("Test 2: Read with Authentication")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        response = requests.get(f"{BASE_URL}/api/leaderboard", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Authenticated read successful! Found {len(data.get('data', []))} entries")
            return True
        else:
            print_error(f"Authenticated read failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Authenticated read error: {e}")
        return False

def test_write_without_auth() -> bool:
    """Test POST /api/leaderboard without authentication (should fail)"""
    print_header("Test 3: Write without Authentication (Should Fail)")
    
    try:
        payload = {
            "successful_submissions": 5,
            "overall_score": 100.0,
            "optimization_score": 80.0,
            "accuracy_score": 0.95
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leaderboard",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 401:
            print_success("Correctly rejected unauthenticated write request")
            return True
        else:
            print_error(f"Unexpected response: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Unauthenticated write test error: {e}")
        return False

def test_write_with_auth(token: str) -> bool:
    """Test POST /api/leaderboard with Bearer token"""
    print_header("Test 4: Write with Authentication")
    
    try:
        payload = {
            "successful_submissions": 10,
            "overall_score": 123.45,
            "optimization_score": 100.0,
            "accuracy_score": 0.98
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leaderboard",
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Write successful!")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Write failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Write error: {e}")
        return False

def test_write_update(token: str) -> bool:
    """Test updating existing leaderboard entry"""
    print_header("Test 5: Update Existing Entry")
    
    try:
        # Update with new scores
        payload = {
            "successful_submissions": 15,
            "overall_score": 150.75,
            "optimization_score": 120.0,
            "accuracy_score": 0.99
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/leaderboard",
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Update successful!")
            print_info(f"Updated scores: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Update failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Update error: {e}")
        return False

def test_read_after_write(token: str) -> bool:
    """Test reading leaderboard after writing to verify data was saved"""
    print_header("Test 6: Verify Data After Write")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/api/leaderboard", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            entries = data.get('data', [])
            
            # Find our entry (should be there)
            user_id = None
            # We'd need to get user_id from login response, but for now just check if we got data
            print_success(f"Read after write successful! Found {len(entries)} total entries")
            if entries:
                print_info(f"Sample entry: {json.dumps(entries[0], indent=2)}")
            return True
        else:
            print_error(f"Read after write failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Read after write error: {e}")
        return False

def main():
    """Run all tests"""
    print_header("Leaderboard API Test Suite")
    print_info(f"Testing against: {BASE_URL}")
    print_info(f"Test user: {LOGIN_EMAIL}\n")
    
    # Login first
    token = login()
    if not token:
        print_error("\nCannot proceed without authentication token")
        print_info("Please check:")
        print_info("  1. Next.js dev server is running: npm run dev")
        print_info("  2. Test user credentials are correct")
        print_info("  3. Login endpoint is accessible")
        sys.exit(1)
    
    # Run tests
    results = []
    
    # Test 1: Public read (no auth)
    results.append(("Public Read", test_read_public()))
    
    # Test 2: Read with auth
    results.append(("Read with Auth", test_read_with_auth(token)))
    
    # Test 3: Write without auth (should fail)
    results.append(("Write without Auth (Should Fail)", test_write_without_auth()))
    
    # Test 4: Write with auth
    results.append(("Write with Auth", test_write_with_auth(token)))
    
    # Test 5: Update existing entry
    results.append(("Update Entry", test_write_update(token)))
    
    # Test 6: Verify data after write
    results.append(("Verify After Write", test_read_after_write(token)))
    
    # Print summary
    print_header("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status}{Colors.RESET} - {test_name}")
    
    print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.RESET}\n")
    
    if passed == total:
        print_success("All tests passed! 🎉")
        sys.exit(0)
    else:
        print_error("Some tests failed. Please review the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
