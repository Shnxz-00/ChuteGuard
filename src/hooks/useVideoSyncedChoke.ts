// useVideoSyncedChoke.ts
// Drop this in src/hooks/. Drives the gauge directly from the pre-extracted
// readings JSON, keyed to actual video playback time. No backend needed.

import { useEffect, useRef } from "react";
import { useStore } from "../lib/store"; // adjust path to your actual store

type Reading = { t: number; choke_percent: number; raw_label: string };

// Binary search for the reading closest to currentTime — fast even with
// hundreds of samples, and avoids scanning the whole array every tick.
function findNearest(readings: Reading[], t: number): Reading {
  let lo = 0, hi = readings.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (readings[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  return readings[lo];
}

export function useVideoSyncedChoke(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  readingsUrl: string, // e.g. "/chv1_readings.json"
) {
  const readingsRef = useRef<Reading[] | null>(null);
  const lastPhaseRef = useRef<string>("Normal");
  const updateFromSocket = useStore(state => state.updateFromSocket);

  // Load the readings JSON once
  useEffect(() => {
    fetch(readingsUrl)
      .then((r) => r.json())
      .then((data: Reading[]) => {
        readingsRef.current = data;
        console.log("Loaded readings:", data.length, "entries");
      })
      .catch(err => console.error("Failed to load readings:", err));
  }, [readingsUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const readings = readingsRef.current;
      if (!readings || readings.length === 0) return;

      const reading = findNearest(readings, video.currentTime);
      const pct = reading.choke_percent;

      // Map to your existing phase bands — adjust thresholds if different
      let phase = "Normal";
      if (pct >= 50) phase = "Max Choking — Alert";
      else if (pct >= 20) phase = "Minimal Choking";

      console.log("Video time:", video.currentTime, "Choke:", pct, "Phase:", phase);

      // Use the existing store update method
      updateFromSocket({
        timestamp: new Date().toISOString(),
        choke_percent: pct,
        phase: phase as any,
        alert: null,
        roi_box: undefined,
        raw_occupied_pixels: undefined,
        total_roi_pixels: undefined,
      });

      lastPhaseRef.current = phase;
    };

    const handleEnded = () => {
      // Freeze at last value — do NOT reset to 0
      console.log("Video ended, freezing at last value");
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoRef, updateFromSocket]);
}

/* ===== USAGE in your dashboard component ===== */
//
// const videoRef = useRef<HTMLVideoElement>(null);
// useVideoSyncedChoke(videoRef, "/chv1_readings.json");
//
// <video ref={videoRef} src="/chv1.mp4" controls />
//
// That's it — no play/pause wiring needed beyond this. The native <video>
// element's own timeupdate event only fires while playing, so the gauge
// automatically stops updating when paused, and holds its last value when
// the video ends (per handleEnded above, which intentionally does nothing).
