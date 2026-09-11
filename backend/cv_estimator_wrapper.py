"""
CV Estimator wrapper for integration with ChuteGuard main.py

Extracts the core estimation logic from chute_choke_estimator.py and provides
a generator-based interface for per-frame readings in the WebSocket loop.
"""

import json
from collections import deque
from pathlib import Path
from typing import Any, Generator, Optional
import cv2
import numpy as np

# Import core functions from the estimator
from chute_choke_estimator import (
    open_capture,
    read_reference,
    polygon_mask,
    robust_difference,
    load_config,
    estimate_mask,
    percent_blocked,
    estimate_camera_motion,
    stationary_motion_mask,
    remove_small_components,
)


class CVEstimator:
    """Wrapper class for the CV estimator that provides per-frame readings."""
    
    def __init__(
        self,
        video_source: str,
        reference_image: str,
        config_path: Optional[str] = None,
        alarm_threshold: float = 50.0,  # Use app's 50% warning threshold
        critical_threshold: float = 70.0,  # Use app's 70% action threshold
    ):
        self.video_source = video_source
        self.reference_image = reference_image
        self.config_path = config_path
        self.alarm_threshold = alarm_threshold
        self.critical_threshold = critical_threshold
        
        # Load configuration
        self.cfg = load_config(config_path)
        
        # Override thresholds to match app's existing scale
        self.cfg["alarm_percent"] = alarm_threshold
        self.cfg["critical_percent"] = critical_threshold
        
        # Initialize video capture
        self.cap = open_capture(video_source)
        
        # Read first frame to get dimensions
        ok, frame = self.cap.read()
        if not ok:
            raise RuntimeError("Could not read first frame from video")
        
        self.h, self.w = frame.shape[:2]
        self.reference = read_reference(reference_image, (self.w, self.h))
        
        # Create ROI mask
        wall_polygons = self.cfg.get("wall_polygons")
        if wall_polygons:
            self.roi = np.zeros((self.h, self.w), dtype=np.uint8)
            for points in wall_polygons:
                self.roi = cv2.bitwise_or(self.roi, polygon_mask(points, self.w, self.h))
        else:
            self.roi = polygon_mask(
                self.cfg.get("wall_polygon", self.cfg["roi_polygon"]), 
                self.w, self.h
            )
        
        # Initialize history for persistence
        self.history: deque[np.ndarray] = deque(
            maxlen=max(2, int(self.cfg["history_length"]))
        )
        
        # Frame tracking
        self.previous_frame = None
        self.ema = None
        self.frame_count = 0
        
        # Release the first frame so we start fresh
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    def process_frame(self) -> dict[str, Any]:
        """Process one frame and return estimation results."""
        ok, frame = self.cap.read()
        if not ok:
            # Loop the video for continuous demo
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok, frame = self.cap.read()
            if not ok:
                return {"choking_percent": 0.0, "error": "Video read failed"}
        
        # Estimate camera motion
        motion_px = estimate_camera_motion(self.previous_frame, frame)
        camera_stable = motion_px <= 4.0  # Default motion threshold
        
        if camera_stable:
            # Create stationary motion mask
            stationary = stationary_motion_mask(
                self.previous_frame, 
                frame, 
                self.roi, 
                float(self.cfg.get("stationary_motion_threshold", 1.8))
            )
            
            # Estimate the blocked mask
            blocked, _ = estimate_mask(
                self.reference, 
                frame, 
                self.roi, 
                self.history, 
                self.cfg, 
                stationary
            )
            
            # Calculate percentage
            current = percent_blocked(blocked, self.roi)
        else:
            # Camera moving - clear history and return 0
            self.history.clear()
            blocked = np.zeros_like(self.roi)
            current = 0.0
        
        # Update previous frame
        self.previous_frame = frame.copy()
        
        # Apply EMA smoothing
        alpha = float(self.cfg["ema_alpha"])
        self.ema = current if self.ema is None else alpha * current + (1 - alpha) * self.ema
        if not camera_stable:
            self.ema = min(self.ema, 0.0)
        
        self.frame_count += 1
        
        return {
            "choking_percent": float(self.ema or 0.0),
            "wall_coverage_percent": float(current),
            "camera_stable": bool(camera_stable),
            "motion_px": float(motion_px),
            "frame": self.frame_count,
        }
    
    def readings_generator(self) -> Generator[dict[str, Any], None, None]:
        """Generator that yields one reading per call for WebSocket integration."""
        while True:
            yield self.process_frame()
    
    def close(self):
        """Clean up resources."""
        if self.cap:
            self.cap.release()
        self.cap = None


def create_estimator(
    video_source: str,
    reference_image: str,
    config_path: Optional[str] = None,
) -> CVEstimator:
    """Factory function to create a CV estimator instance."""
    return CVEstimator(
        video_source=video_source,
        reference_image=reference_image,
        config_path=config_path,
    )
