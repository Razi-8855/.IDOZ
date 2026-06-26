"""
Extract frames from the bee landing video as compressed WebP images
for Apple-style scroll-scrubbing on an HTML5 Canvas.
"""

import cv2
import os
import sys

# Configuration
VIDEO_PATH = os.path.join(os.path.dirname(__file__), '..', 'assets', 'Bee_lands_on_embroidered_bee_202606181208.mp4')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'frames')
TARGET_WIDTH = 1280
TARGET_HEIGHT = 720
WEBP_QUALITY = 80

def extract_frames():
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print(f"ERROR: Could not open video: {VIDEO_PATH}")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    print(f"Source: {width}x{height} @ {fps}fps, {total_frames} frames")
    print(f"Output: {TARGET_WIDTH}x{TARGET_HEIGHT} WebP (quality {WEBP_QUALITY})")
    print(f"Extracting to: {OUTPUT_DIR}")
    print()

    total_size = 0
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Resize with high-quality interpolation
        resized = cv2.resize(frame, (TARGET_WIDTH, TARGET_HEIGHT), interpolation=cv2.INTER_AREA)

        # Save as WebP
        filename = f"frame_{frame_idx + 1:04d}.webp"
        filepath = os.path.join(OUTPUT_DIR, filename)
        cv2.imwrite(filepath, resized, [cv2.IMWRITE_WEBP_QUALITY, WEBP_QUALITY])

        file_size = os.path.getsize(filepath)
        total_size += file_size

        frame_idx += 1
        if frame_idx % 30 == 0:
            print(f"  Extracted {frame_idx}/{total_frames} frames...")

    cap.release()

    print()
    print(f"Done! Extracted {frame_idx} frames")
    print(f"Total size: {total_size / (1024 * 1024):.1f} MB")
    print(f"Average per frame: {total_size / frame_idx / 1024:.1f} KB")

if __name__ == '__main__':
    extract_frames()
