#!/usr/bin/env python3
"""
Live chute choking estimator.

This is a camera-specific baseline for a fixed camera looking at a chute.
It estimates persistent, stationary material buildup on a configured wall
polygon by comparing frames with an open/clean reference and rejecting pixels
with motion different from the dominant camera motion. Flowing particles and
out-of-wall pixels are excluded. The reported percentage is the blocked
fraction of the wall polygon, not a volumetric blockage measure.

Example:
  python3 chute_choke_estimator.py --source 0 --reference open.jpg --config chute_config.json
  python3 chute_choke_estimator.py --source chute_video.mp4 --reference open.jpg --config chute_config.json --output result.mp4

Press q or ESC to stop live display.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from collections import deque
from pathlib import Path
from typing import Any

import cv2
import numpy as np


class LiveAlarmSound:
    """Starts/stops a repeating local alarm process when threshold is crossed."""
    def __init__(self, sound_path: str, enabled: bool = True):
        self.sound_path = str(Path(sound_path).resolve())
        self.enabled = enabled
        self.process = None
        self.stop_file = Path(tempfile.gettempdir()) / f"chute_alarm_stop_{os.getpid()}.flag"
        self.stop_file.unlink(missing_ok=True)

    def start(self):
        if not self.enabled or self.process is not None:
            return
        if not Path(self.sound_path).exists():
            print(json.dumps({"warning": "Alarm sound file not found", "sound": self.sound_path}), flush=True)
            return
        self.stop_file.unlink(missing_ok=True)
        player_available = sys.platform.startswith('win') or any(shutil.which(x) for x in ('aplay', 'paplay', 'ffplay'))
        if not player_available:
            print(json.dumps({"warning": "No local audio backend found; use the browser alarm or install aplay/paplay/ffplay"}), flush=True)
        self.process = subprocess.Popen(
            [sys.executable, str(Path(__file__).with_name('play_alarm.py')), '--sound', self.sound_path, '--stop-file', str(self.stop_file)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    def stop(self):
        if self.process is None:
            return
        self.stop_file.touch()
        try:
            self.process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            self.process.terminate()
        self.process = None
        self.stop_file.unlink(missing_ok=True)


DEFAULTS = {
    "roi_polygon": [[0.05, 0.05], [0.95, 0.05], [0.95, 0.95], [0.05, 0.95]],
    "pixel_difference_threshold": 28,
    "persistence_fraction": 0.65,
    "history_length": 12,
    "min_component_area": 80,
    "blur_kernel": 5,
    "morph_kernel": 7,
    "ema_alpha": 0.25,
    "alarm_percent": 20.0,
    "critical_percent": 35.0,
    "stationary_motion_threshold": 1.8,
}


def load_config(path: str | None) -> dict[str, Any]:
    cfg = dict(DEFAULTS)
    if path:
        with open(path, "r", encoding="utf-8") as f:
            user_cfg = json.load(f)
        cfg.update(user_cfg)
    return cfg


def open_capture(source: str) -> cv2.VideoCapture:
    try:
        source_value: int | str = int(source)
    except ValueError:
        source_value = source
    cap = cv2.VideoCapture(source_value)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video source: {source}")
    return cap


def read_reference(path: str, target_size: tuple[int, int]) -> np.ndarray:
    ref = cv2.imread(path)
    if ref is None:
        raise RuntimeError(f"Could not read reference image: {path}")
    width, height = target_size
    return cv2.resize(ref, (width, height), interpolation=cv2.INTER_AREA)


def polygon_mask(points: list[list[float]], width: int, height: int) -> np.ndarray:
    pts = np.array([[round(x * width), round(y * height)] for x, y in points], dtype=np.int32)
    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillPoly(mask, [pts], 255)
    return mask


def robust_difference(reference: np.ndarray, frame: np.ndarray, blur_kernel: int) -> np.ndarray:
    """Return a lighting-tolerant difference image in 0..255."""
    if blur_kernel > 1:
        reference = cv2.GaussianBlur(reference, (blur_kernel | 1, blur_kernel | 1), 0)
        frame = cv2.GaussianBlur(frame, (blur_kernel | 1, blur_kernel | 1), 0)

    ref_lab = cv2.cvtColor(reference, cv2.COLOR_BGR2LAB).astype(np.int16)
    frm_lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB).astype(np.int16)
    delta = np.abs(frm_lab - ref_lab)
    # Luminance changes are weighted lower than chroma/texture changes.
    score = 0.35 * delta[:, :, 0] + 0.8 * delta[:, :, 1] + 0.8 * delta[:, :, 2]
    return np.clip(score, 0, 255).astype(np.uint8)


def learned_feature(image: np.ndarray) -> np.ndarray:
    """Feature extraction shared with train_chute_model_v3.py."""
    h, w = image.shape[:2]
    scale = min(96 / w, 96 / h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    resized = cv2.resize(image, (nw, nh), interpolation=cv2.INTER_AREA)
    boxed = np.zeros((96, 96, 3), dtype=np.uint8)
    y, x = (96 - nh) // 2, (96 - nw) // 2
    boxed[y:y + nh, x:x + nw] = resized
    gray = cv2.cvtColor(boxed, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(boxed, cv2.COLOR_BGR2HSV)
    gray_small = cv2.resize(gray, (48, 48), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    lower = cv2.resize(gray[48:, :], (48, 24), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    h_hist = cv2.calcHist([hsv], [0], None, [24], [0, 180]).flatten()
    s_hist = cv2.calcHist([hsv], [1], None, [24], [0, 256]).flatten()
    v_hist = cv2.calcHist([hsv], [2], None, [24], [0, 256]).flatten()
    for hist in (h_hist, s_hist, v_hist):
        hist /= max(float(hist.sum()), 1.0)
    edges = cv2.Canny(gray, 50, 130)
    edge_small = cv2.resize(edges, (24, 24), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    return np.concatenate([gray_small.flatten(), lower.flatten(), h_hist, s_hist, v_hist, edge_small.flatten()]).astype(np.float32)


def load_learned_model(path: str | None):
    if not path:
        return None
    data = np.load(path)
    return {"weights": data["weights"], "bias": float(data["bias"]), "mean": data["mean"], "scale": data["scale"]}


def learned_probability(model, frame: np.ndarray) -> float | None:
    if model is None:
        return None
    x = learned_feature(frame)
    z = float(((x - model["mean"]) / model["scale"]) @ model["weights"] + model["bias"])
    return float(1.0 / (1.0 + np.exp(-np.clip(z, -40, 40))))


def estimate_camera_motion(previous: np.ndarray | None, current: np.ndarray) -> float:
    """Return median feature displacement in pixels; high values mean camera motion."""
    if previous is None:
        return 0.0
    prev_gray = cv2.cvtColor(previous, cv2.COLOR_BGR2GRAY)
    curr_gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
    points = cv2.goodFeaturesToTrack(prev_gray, maxCorners=80, qualityLevel=0.01, minDistance=12)
    if points is None or len(points) < 8:
        return 0.0
    next_points, status, _ = cv2.calcOpticalFlowPyrLK(prev_gray, curr_gray, points, None)
    if next_points is None or status is None:
        return 0.0
    good_old = points[status.ravel() == 1]
    good_new = next_points[status.ravel() == 1]
    if len(good_old) < 8:
        return 0.0
    displacement = np.linalg.norm(good_new - good_old, axis=1)
    return float(np.median(displacement))


def remove_small_components(binary: np.ndarray, min_area: int) -> np.ndarray:
    n, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8)
    out = np.zeros_like(binary)
    for label in range(1, n):
        if stats[label, cv2.CC_STAT_AREA] >= min_area:
            out[labels == label] = 255
    return out


def stationary_motion_mask(previous: np.ndarray | None, current: np.ndarray, wall: np.ndarray, threshold: float) -> np.ndarray:
    """Keep pixels attached to the wall after removing dominant camera motion.

    Flowing particles have motion residuals different from the dominant camera
    displacement; stationary buildup attached to the wall remains low-residual.
    """
    if previous is None:
        return wall.copy()
    g0=cv2.cvtColor(previous, cv2.COLOR_BGR2GRAY)
    g1=cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
    small0=cv2.resize(g0,(0,0),fx=0.5,fy=0.5)
    small1=cv2.resize(g1,(0,0),fx=0.5,fy=0.5)
    flow=cv2.calcOpticalFlowFarneback(small0,small1,None,0.5,3,15,3,5,1.2,0)
    ys,xs=np.where(cv2.resize(wall,(flow.shape[1],flow.shape[0]),interpolation=cv2.INTER_NEAREST)>0)
    vec=flow[ys,xs] if len(xs) else flow.reshape(-1,2)
    dominant=np.median(vec,axis=0)
    residual=np.linalg.norm(flow-dominant[None,None,:],axis=2)
    residual=cv2.resize(residual,(wall.shape[1],wall.shape[0]),interpolation=cv2.INTER_LINEAR)
    return ((residual<=float(threshold)) & (wall>0)).astype(np.uint8)*255


def estimate_mask(
    reference: np.ndarray,
    frame: np.ndarray,
    roi: np.ndarray,
    history: deque[np.ndarray],
    cfg: dict[str, Any],
    stationary: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    diff = robust_difference(reference, frame, int(cfg["blur_kernel"]))
    raw = ((diff >= int(cfg["pixel_difference_threshold"])) & (roi > 0)).astype(np.uint8) * 255
    if stationary is not None:
        raw = cv2.bitwise_and(raw, stationary)
    kernel_size = max(3, int(cfg["morph_kernel"]) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    raw = cv2.morphologyEx(raw, cv2.MORPH_OPEN, kernel)
    raw = cv2.morphologyEx(raw, cv2.MORPH_CLOSE, kernel)
    raw = remove_small_components(raw, int(cfg["min_component_area"]))

    history.append(raw)
    stack = np.stack(list(history), axis=0)
    persistence = np.mean(stack > 0, axis=0)
    persistent = ((persistence >= float(cfg["persistence_fraction"])) & (roi > 0)).astype(np.uint8) * 255
    persistent = cv2.morphologyEx(persistent, cv2.MORPH_CLOSE, kernel)
    persistent = remove_small_components(persistent, int(cfg["min_component_area"]))
    return persistent, diff


def percent_blocked(mask: np.ndarray, roi: np.ndarray) -> float:
    roi_pixels = int(np.count_nonzero(roi))
    if roi_pixels == 0:
        return 0.0
    blocked = int(np.count_nonzero((mask > 0) & (roi > 0)))
    return 100.0 * blocked / roi_pixels


def draw_overlay(frame: np.ndarray, roi: np.ndarray, blocked: np.ndarray, percent: float, fps: float, cfg: dict[str, Any], model_prob: float | None = None, alarm_active: bool = False, camera_stable: bool = True, motion_px: float = 0.0) -> np.ndarray:
    out = frame.copy()
    tint = np.zeros_like(out)
    tint[:, :, 2] = 190
    out = np.where(blocked[:, :, None] > 0, cv2.addWeighted(out, 0.35, tint, 0.65, 0), out)
    critical = percent >= float(cfg["critical_percent"])
    alarm = alarm_active or percent >= float(cfg["alarm_percent"])
    color = (0, 0, 255) if (critical or alarm_active) else ((0, 165, 255) if alarm else (0, 200, 0))
    label = "CAMERA MOVING" if not camera_stable else ("CHOKE ALARM" if alarm_active else ("CRITICAL" if critical else ("ALARM" if alarm else "NORMAL")))
    if not camera_stable:
        color = (0, 165, 255)
    cv2.rectangle(out, (10, 10), (455, 132), (0, 0, 0), -1)
    cv2.putText(out, f"CHOKING: {percent:5.1f}%", (22, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2, cv2.LINE_AA)
    cv2.putText(out, f"{label}  |  {fps:4.1f} FPS", (22, 72), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2, cv2.LINE_AA)
    if model_prob is not None:
        cv2.putText(out, f"AI blocked confidence: {100.0 * model_prob:4.1f}%", (22, 104), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (230, 230, 230), 1, cv2.LINE_AA)
    cv2.putText(out, f"camera motion: {motion_px:4.1f}px", (22, 124), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (210, 210, 210), 1, cv2.LINE_AA)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="webcam index such as 0, or a video path")
    ap.add_argument("--reference", required=True, help="clean/open-chute reference image from the same camera")
    ap.add_argument("--config", default=None, help="JSON configuration with ROI and thresholds")
    ap.add_argument("--output", default=None, help="optional annotated output video")
    ap.add_argument("--model", default=None, help="optional trained .npz blockage classifier")
    ap.add_argument("--alarm-threshold", type=float, default=65.0, help="choking percentage that activates the alarm")
    ap.add_argument("--alarm-consecutive", type=int, default=1, help="compatibility option; immediate threshold mode uses 1")
    ap.add_argument("--alarm-release", type=float, default=65.0, help="compatibility option; immediate threshold mode releases below threshold")
    ap.add_argument("--alarm-log", default=None, help="optional JSONL file for alarm events")
    ap.add_argument("--reading-log", default=None, help="optional JSONL file receiving one live detection reading per second")
    ap.add_argument("--motion-threshold", type=float, default=4.0, help="median camera motion in pixels above which estimates are suspended")
    ap.add_argument("--alarm-sound", default=str(Path(__file__).with_name("chute_alarm.wav")), help="repeating WAV alarm sound")
    ap.add_argument("--no-sound", action="store_true", help="disable local alarm audio")
    ap.add_argument("--no-display", action="store_true", help="process without a GUI window")
    args = ap.parse_args()

    cfg = load_config(args.config)
    cfg["alarm_percent"] = args.alarm_threshold
    cap = open_capture(args.source)
    ok, frame = cap.read()
    if not ok:
        raise RuntimeError("Could not read first frame")

    h, w = frame.shape[:2]
    reference = read_reference(args.reference, (w, h))
    wall_polygons = cfg.get("wall_polygons")
    if wall_polygons:
        roi = np.zeros((h, w), dtype=np.uint8)
        for points in wall_polygons:
            roi = cv2.bitwise_or(roi, polygon_mask(points, w, h))
    else:
        roi = polygon_mask(cfg.get("wall_polygon", cfg["roi_polygon"]), w, h)
    model = load_learned_model(args.model)
    history: deque[np.ndarray] = deque(maxlen=max(2, int(cfg["history_length"])))
    alarm_active = False
    alarm_count = 0
    release_count = 0
    alarm_events = 0
    alarm_log = open(args.alarm_log, "a", encoding="utf-8") if args.alarm_log else None
    reading_log = open(args.reading_log, "a", encoding="utf-8") if args.reading_log else None
    alarm_sound = LiveAlarmSound(args.alarm_sound, enabled=not args.no_sound)
    previous_frame = None
    writer = None
    if args.output:
        fps = cap.get(cv2.CAP_PROP_FPS) or 20.0
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(args.output, fourcc, fps, (w, h))

    ema = None
    frames = 0
    start = time.time()
    next_reading_time = 0.0
    source_fps = cap.get(cv2.CAP_PROP_FPS) or 20.0
    source_is_camera = str(args.source).strip().isdigit()
    while ok:
        motion_px = estimate_camera_motion(previous_frame, frame)
        camera_stable = motion_px <= args.motion_threshold
        prior_frame = previous_frame
        if camera_stable:
            stationary = stationary_motion_mask(prior_frame, frame, roi, float(cfg.get("stationary_motion_threshold", 1.8)))
            blocked, _ = estimate_mask(reference, frame, roi, history, cfg, stationary)
            current = percent_blocked(blocked, roi)
        else:
            history.clear()
            blocked = np.zeros_like(roi)
            current = 0.0
        previous_frame = frame.copy()
        alpha = float(cfg["ema_alpha"])
        ema = current if ema is None else alpha * current + (1 - alpha) * ema
        if not camera_stable:
            ema = min(ema, 0.0)
        model_prob = learned_probability(model, frame)

        # Immediate alarm mode: the only alarm criterion is the current percentage.
        if ema >= args.alarm_threshold and not alarm_active:
            alarm_active = True
            alarm_sound.start()
            alarm_events += 1
            event = {"event": "CHUTE_CHOKING_ALARM", "frame": frames, "choking_percent": round(float(ema), 2), "threshold_percent": args.alarm_threshold, "model_blocked_confidence": None if model_prob is None else round(100.0 * model_prob, 2), "time_epoch": time.time()}
            print("\a" + json.dumps(event), flush=True)
            if alarm_log:
                alarm_log.write(json.dumps(event) + "\n")
                alarm_log.flush()
        elif ema < args.alarm_threshold and alarm_active:
            alarm_active = False
            alarm_sound.stop()

        elapsed = max(0.001, time.time() - start)
        if source_is_camera:
            source_time = elapsed
        else:
            source_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            if not np.isfinite(source_time) or source_time < 0.0:
                source_time = frames / float(source_fps)
        # Emit a machine-readable live reading at one-second cadence while the
        # estimator still processes every available frame internally.
        if source_time + 1e-9 >= next_reading_time:
            reading = {"event": "CHUTE_READING", "time_sec": round(float(source_time), 3), "frame": frames, "choking_percent": round(float(ema or 0.0), 2), "wall_coverage_percent": round(float(current), 2), "camera_stable": bool(camera_stable), "motion_px": round(float(motion_px), 3), "alarm_active": bool(alarm_active), "threshold_percent": float(args.alarm_threshold), "model_blocked_confidence": None if model_prob is None else round(100.0 * model_prob, 2)}
            print(json.dumps(reading), flush=True)
            if reading_log:
                reading_log.write(json.dumps(reading) + "\n")
                reading_log.flush()
            while next_reading_time <= source_time:
                next_reading_time += 1.0
        display = draw_overlay(frame, roi, blocked, ema, frames / elapsed, cfg, model_prob, alarm_active, camera_stable, motion_px)
        if writer:
            writer.write(display)
        if not args.no_display:
            cv2.imshow("Chute choking estimator", display)
            key = cv2.waitKey(1) & 0xFF
            if key in (27, ord("q")):
                break
        frames += 1
        ok, frame = cap.read()

    cap.release()
    if writer:
        writer.release()
    alarm_sound.stop()
    if alarm_log:
        alarm_log.close()
    if reading_log:
        reading_log.close()
    if not args.no_display:
        cv2.destroyAllWindows()
    print(json.dumps({"frames_processed": frames, "last_smoothed_choking_percent": round(float(ema or 0), 2), "alarm_threshold_percent": args.alarm_threshold, "alarm_active": alarm_active, "alarm_events": alarm_events, "wall_only_stationary_filter": True, "learned_model_loaded": model is not None, "alarm_sound_enabled": not args.no_sound, "alarm_sound": args.alarm_sound, "reading_cadence_seconds": 1.0, "reading_log": args.reading_log}))


if __name__ == "__main__":
    main()
