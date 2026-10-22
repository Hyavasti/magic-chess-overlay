import os
import re
import difflib
import easyocr
import cv2

ROSTER_NAMES = [
    "chou", "wanwan", "ling", "popolkupa", "popol", "luoyi", "fanny", "kagura", 
    "minotaur", "ruby", "guinevere", "gusion", "valir", "lancelot", "layla", 
    "zilong", "moskov", "angela", "nana", "franco", "luke", "lukas", "aamon",
    "tharz", "yuki", "eva", "buss", "connie", "dubi", "pao", "rya", 
    "saki", "remy", "eggie", "asta", "austus", "bersi", "brown", 
    "kaboom", "mavis", "abe", "benny", "harper", "ragnar"
]

# Look for available test images in folder
test_files = ["magic chess overlay.png", "last_scan.png"]
image_path = None
for f in test_files:
    if os.path.exists(f):
        image_path = f
        break

if not image_path:
    print("[ERROR] No image found to test! Put a screenshot named 'magic chess overlay.png' or run a scan to create 'last_scan.png'.")
    exit()

print(f"Loading EasyOCR and testing on: {image_path}...")
reader = easyocr.Reader(['en'], gpu=False)

img = cv2.imread(image_path)
results = reader.readtext(img)

print("\n--- ALL RAW OCR TOKENS DETECTED ---")
detected_placement = None
extracted_words = []

for bbox, text, conf in results:
    clean = text.strip()
    extracted_words.append(clean)
    print(f"Token: '{clean}' (conf: {conf:.2f})")

    if detected_placement is None:
        digit_match = re.search(r'\b([1-8])(?:st|nd|rd|th)?\b', clean)
        if digit_match and not clean.startswith(('+', '-')):
            detected_placement = int(digit_match.group(1))

# Commander text matching
detected_commander = "fanny"
for token in extracted_words:
    clean_token = re.sub(r'[^a-zA-Z]', '', token.lower())
    if len(clean_token) < 3:
        continue
    matches = difflib.get_close_matches(clean_token, ROSTER_NAMES, n=1, cutoff=0.7)
    if matches:
        detected_commander = matches[0]
        break

print("\n===============================")
print(f" PARSED PLACEMENT: #{detected_placement}")
print(f" PARSED COMMANDER: {detected_commander.upper()}")
print("===============================")
