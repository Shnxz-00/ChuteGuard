"""
ChuteGuard FastAPI Backend — CV Estimator Integration.

Reads live chute blockage percentage from the CV estimator
and broadcasts structured JSON to all connected WebSocket clients.

CV Estimator: chute_choke_estimator.py with threshold alignment to app's 50/70 scale
Video source: chute_video1.mp4 with open_reference_minimal.jpg
Config: chute_config_wall_only_video1.json

Run: python backend/main.py
"""

import sys
import traceback
import asyncio
import json
import smtplib
import os
from datetime import datetime
from email.mime.text import MIMEText

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# CV Estimator integration
from cv_estimator_wrapper import create_estimator

# ── Show active Python env on startup (debugging aid) ────────────────────────
print(f"[main] Python executable: {sys.executable}")

# ── Load optional .env for email credentials ──────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
    print("[main] .env loaded")
except ImportError:
    print("[main] python-dotenv not installed — email alerts disabled")

EMAIL_SENDER    = os.getenv("EMAIL_SENDER", "")
EMAIL_RECIPIENT = os.getenv("EMAIL_RECIPIENT", "")
EMAIL_PASSWORD  = os.getenv("EMAIL_APP_PASSWORD", "")
EMAIL_ENABLED   = bool(EMAIL_SENDER and EMAIL_RECIPIENT and EMAIL_PASSWORD)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="ChuteGuard SCADA Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Email alert helper ────────────────────────────────────────────────────────
def send_alert_email(choke_percent: float):
    if not EMAIL_ENABLED:
        print(f"[email] Alert suppressed (no .env config): choke={choke_percent}%")
        return
    try:
        body = (
            f"ChuteGuard Alert\n\n"
            f"Chute CH-01 escalated to manual intervention.\n"
            f"Choke %     : {choke_percent}\n"
            f"Time (UTC)  : {datetime.utcnow().isoformat()}Z\n\n"
            f"Action required: inspect chute and clear blockage manually."
        )
        msg = MIMEText(body)
        msg["Subject"] = f"[ChuteGuard] Escalation Alert — {choke_percent}%"
        msg["From"]    = EMAIL_SENDER
        msg["To"]      = EMAIL_RECIPIENT

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"[email] Alert sent: choke={choke_percent}%")
    except Exception as e:
        print(f"[email] Failed to send alert: {e}")


# ── Helpers ───────────────────────────────────────────────────────────────────
def derive_phase(choke: float, last_choke: float, was_escalated: bool):
    if choke >= 70.0:
        return "Escalated — Manual Intervention Required"
    if choke >= 50.0:
        if last_choke - choke > 8.0:
            return "Vibro-Assist Active"
        return "Buildup Forming"
    return "Normal Flow"


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@app.websocket("/ws/data")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"[ws] Client connected: {websocket.client}")

    # Initialize CV estimator
    try:
        import os
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        estimator = create_estimator(
            video_source=os.path.join(backend_dir, "chute_video1.mp4"),
            reference_image=os.path.join(backend_dir, "open_reference_minimal.jpg"),
            config_path=os.path.join(backend_dir, "chute_config_wall_only_video1.json"),
        )
        print("[ws] CV estimator initialized successfully")
    except Exception as e:
        print(f"[ws] Failed to initialize CV estimator: {e}")
        import traceback
        traceback.print_exc()
        await websocket.close()
        return

    last_choke = 0.0
    was_escalated = False

    try:
        while True:
            # Get next reading from CV estimator
            reading = estimator.process_frame()
            
            if "error" in reading:
                print(f"[ws] CV estimator error: {reading['error']}")
                await asyncio.sleep(1)
                continue

            choke_combined = reading["choking_percent"]
            
            # Create sensor data for compatibility (single source, split for display)
            sensors = {
                "left": choke_combined,
                "right": choke_combined,
            }
            
            # Lead tally for compatibility (distribute between left/right)
            lead_tally = {
                "left": 1 if choke_combined >= 50 else 0,
                "right": 1 if choke_combined >= 50 else 0,
            }
            
            lead_sensor = "left" if choke_combined >= 50 else "right"

            phase = derive_phase(choke_combined, last_choke, was_escalated)
            current_escalated = phase == "Escalated — Manual Intervention Required"

            alert = None
            if current_escalated and not was_escalated:
                alert = {"fired": True, "action": "Escalated to Manual", "choke_at_trigger": round(choke_combined, 1)}
                # Fire email on transition into escalation (not every tick)
                send_alert_email(round(choke_combined, 1))
            elif choke_combined >= 50 and last_choke - choke_combined > 8.0:
                alert = {"fired": True, "action": "Vibro-Assist Pulse", "choke_at_trigger": round(choke_combined, 1)}
            elif was_escalated and not current_escalated:
                alert = {"fired": True, "action": "Escalation Cleared", "choke_at_trigger": round(choke_combined, 1)}

            was_escalated = current_escalated
            last_choke = choke_combined

            # Handle optional manual pulse from UI
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=0.05)
                msg = json.loads(raw)
                if msg.get("type") == "MANUAL_PULSE" and not current_escalated:
                    phase = "Vibro-Assist Active"
                    alert = {"fired": True, "action": "Manual Vibro-Assist Pulse", "choke_at_trigger": round(choke_combined, 1)}
            except asyncio.TimeoutError:
                pass

            payload = {
                "timestamp":    datetime.utcnow().isoformat() + "Z",
                "choke_percent": round(choke_combined, 1),
                "phase":         phase,
                "sensors":      sensors,
                "lead_sensor":  lead_sensor,
                "lead_tally":   lead_tally,
                "alert":        alert,
                "roi_box":      None,  # CV estimator handles ROI internally
                "raw_occupied_pixels": None,
                "total_roi_pixels": None,
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        print("[ws] Client disconnected")
    except Exception:
        traceback.print_exc()
    finally:
        estimator.close()


# ── Entrypoint ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        import uvicorn
        print("[main] Starting Uvicorn on 0.0.0.0:8000 with CV estimator integration …")
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception:
        traceback.print_exc()
        sys.exit(1)
