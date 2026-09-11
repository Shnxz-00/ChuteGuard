"""
Quick test script for the CV estimator integration.
Tests the estimator standalone before full WebSocket integration.
"""

import sys
import time
import os
from pathlib import Path
from cv_estimator_wrapper import create_estimator

def test_estimator():
    print("[test] Testing CV estimator standalone...")
    
    # Get the backend directory path
    backend_dir = Path(__file__).parent
    
    try:
        estimator = create_estimator(
            video_source=str(backend_dir / "chute_video1.mp4"),
            reference_image=str(backend_dir / "open_reference_minimal.jpg"),
            config_path=str(backend_dir / "chute_config_wall_only_video1.json"),
        )
        print("[test] CV estimator initialized successfully")
        
        print("[test] Processing 10 frames...")
        for i in range(10):
            reading = estimator.process_frame()
            print(f"[test] Frame {i+1}: {reading}")
            time.sleep(0.1)
        
        print("[test] Test completed successfully")
        estimator.close()
        
    except Exception as e:
        print(f"[test] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_estimator()