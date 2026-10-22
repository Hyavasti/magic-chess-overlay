import os
import re
import time
import requests
import numpy as np
import cv2
from PIL import ImageGrab
import easyocr
from pynput import keyboard
import win32gui
import difflib

# ==========================================
# CONFIGURATION
# ==========================================
SUPABASE_URL = "https://hjasxlveijbrhdzulzsc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYXN4bHZlaWpicmhkenVsenNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NDY4OTksImV4cCI6MjEwODIyMjg5OX0.dUhJwaDW5vOb6QbOZZ5GEGxxNtExTYHavOZtpkuPtZE"
STREAMER_ID = "default_streamer"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Official Star Ladder table
PLACEMENT_STAR_MAP = {
    1: 4,
    2: 3,
    3: 2,
    4: 1,
    5: -1,
    6: -2,
    7: -3,
    8: -4
}

# Complete Magic Chess & MCGG Commander Roster Names for OCR cross-referencing
ROSTER_NAMES = [
    # Hero Commanders
    "chou", "wanwan", "ling", "popolkupa", "popol", "luoyi", "fanny", "kagura", 
    "minotaur", "ruby", "guinevere", "gusion", "valir", "lancelot", "layla", 
    "zilong", "moskov", "angela", "nana", "franco", "luke", "lukas", "aamon",
    # Classic Little Commanders
    "tharz", "yuki", "eva", "buss", "connie", "dubi", "pao", "rya", 
    "saki", "remy", "eggie", "asta", "austus", "bersi", "brown", 
    "kaboom", "mavis", "abe", "benny", "harper", "ragnar"
]

print("Initializing EasyOCR model...")
reader = easyocr.Reader(['en'], gpu=False)
print("Ready!")

def capture_game_window():
    """Captures whichever window is currently active / focused on your screen"""
    hwnd = win32gui.GetForegroundWindow()
    title = win32gui.GetWindowText(hwnd)
    print(f"[FOCUSED WINDOW] Capturing: {title}")

    try:
        rect = win32gui.GetWindowRect(hwnd)
        x1, y1, x2, y2 = rect
        w = x2 - x1
        h = y2 - y1

        if w > 200 and h > 200:
            img = ImageGrab.grab(bbox=(x1, y1, x2, y2), all_screens=True)
            img_np = np.array(img)
            # Save debug preview
            cv2.imwrite("last_scan.png", cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR))
            return img_np
    except Exception as e:
        print(f"[WINDOW ERROR] {e}")

    # Fallback to full screen
    print("[FALLBACK] Grabbing full desktop screen...")
    img = ImageGrab.grab(all_screens=True)
    img_np = np.array(img)
    cv2.imwrite("last_scan.png", cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR))
    return img_np

def match_commander_by_text(ocr_tokens):
    """
    Scans OCR tokens using fuzzy matching against the roster.
    Works with any equipped skin since text names remain identical.
    """
    for token in ocr_tokens:
        clean = re.sub(r'[^a-zA-Z]', '', token.lower())
        if len(clean) < 3:
            continue
            
        # Exact check
        if clean in ROSTER_NAMES:
            if clean in ["popol", "popolkupa"]:
                return "popolkupa"
            if clean in ["luke", "lukas"]:
                return "luke"
            return clean

        # Fuzzy check (similarity > 75%)
        matches = difflib.get_close_matches(clean, ROSTER_NAMES, n=1, cutoff=0.75)
        if matches:
            matched = matches[0]
            if matched in ["popol", "popolkupa"]:
                return "popolkupa"
            if matched in ["luke", "lukas"]:
                return "luke"
            return matched

    return None

def log_match_to_supabase(placement, commander_id):
    """Sends detected match directly to Supabase and updates star counts"""
    # 1. Insert Match Row
    match_url = f"{SUPABASE_URL}/rest/v1/stream_matches"
    payload = {
        "streamer_id": STREAMER_ID,
        "placement": int(placement),
        "commander_id": commander_id
    }
    
    try:
        res = requests.post(match_url, json=payload, headers=headers)
        if res.status_code in [200, 201, 204]:
            print(f"\n[SUCCESS] Match Logged! Placement: #{placement} | Commander: {commander_id.upper()}")
        else:
            print(f"[ERROR] Match insert failed: {res.text}")
            return
    except Exception as e:
        print(f"[ERROR] Network error: {e}")
        return

    # 2. Automatically Calculate & Update Stars
    star_delta = PLACEMENT_STAR_MAP.get(int(placement), 0)
    profile_url = f"{SUPABASE_URL}/rest/v1/streamer_profiles?streamer_id=eq.{STREAMER_ID}&select=*"
    
    try:
        profile_res = requests.get(profile_url, headers=headers)
        if profile_res.status_code == 200 and profile_res.json():
            curr_data = profile_res.json()[0]
            current_stars = curr_data.get("rank_points", 0) or 0
            session_delta = curr_data.get("star_delta", 0) or 0

            new_stars = max(0, current_stars + star_delta)
            new_session_delta = session_delta + star_delta

            patch_url = f"{SUPABASE_URL}/rest/v1/streamer_profiles?streamer_id=eq.{STREAMER_ID}"
            patch_payload = {
                "rank_points": new_stars,
                "star_delta": new_session_delta,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            patch_res = requests.patch(patch_url, json=patch_payload, headers=headers)
            if patch_res.status_code in [200, 204]:
                sign = f"+{star_delta}" if star_delta > 0 else f"{star_delta}"
                print(f"[STARS UPDATED] Change: {sign} ⭐ | Total: ⭐ {new_stars} | Session: {new_session_delta:+d} ⭐")
    except Exception as e:
        print(f"[WARNING] Could not update profile stars: {e}")

def parse_screen():
    print("\n[SCAN TRIGGERED] Reading screen...")
    screen_np = capture_game_window()
    h, w, _ = screen_np.shape

    # Focus OCR on the left 45% of the screen where medals and commander names appear
    left_crop = screen_np[:, :int(w * 0.45)]
    results = reader.readtext(left_crop)

    detected_placement = None
    detected_commander = None
    all_extracted_words = []

    # Sort results vertically (Y-axis) to focus on the top row first
    results_sorted = sorted(results, key=lambda item: item[0][0][1])

    for bbox, text, conf in results_sorted:
        clean = text.strip()
        all_extracted_words.append(clean)

        # Skip MMR numbers like +45 or -25
        if clean.startswith('+') or clean.startswith('-'):
            continue

        # Look for placement digits 1 to 8
        digit_match = re.search(r'\b([1-8])(?:st|nd|rd|th)?\b', clean)
        if digit_match and detected_placement is None:
            detected_placement = int(digit_match.group(1))

    # Match commander name from the collected text words
    detected_commander = match_commander_by_text(all_extracted_words)

    # Fallback to fanny if name was obscured by a banner
    if not detected_commander:
        detected_commander = "fanny"

    if detected_placement:
        print(f"-> Placement Found: #{detected_placement}")
        print(f"-> Commander Identified by Name: {detected_commander.upper()}")
        log_match_to_supabase(detected_placement, detected_commander)
    else:
        print("[WARNING] Could not find placement digit.")

# ==========================================
# PYNPUT GLOBAL BACKGROUND KEY LISTENER
# ==========================================
def on_press(key):
    try:
        # 1. Check for character keys like ']' or '-' or 'x'
        if hasattr(key, 'char') and key.char:
            if key.char == ']':  # <--- Press the Right Bracket key ]
                print("\n[KEY TRIGGERED] ']' Pressed! Scanning screen...")
                parse_screen()
            elif key.char == '-':  # Alternate trigger: Minus key
                print("\n[KEY TRIGGERED] '-' Pressed! Scanning screen...")
                parse_screen()

        # 2. Check for Escape key to exit
        if key == keyboard.Key.esc:
            print("Exiting feeder.")
            return False
            
    except Exception as e:
        print(f"Error in key press: {e}")

if __name__ == "__main__":
    print("==================================================")
    print("  MCGG ACCURATE FEEDER ACTIVE (PYNPUT ENGINE)")
    print("  Press [ ] ] (Right Bracket) to log match")
    print("  Press [ - ] (Minus key) to log match")
    print("  Press [Esc] to exit")
    print("==================================================")

    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()