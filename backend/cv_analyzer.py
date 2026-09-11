import cv2
import numpy as np

VIDEO_SOURCE = "rd1.mp4"
ROI_TOP = 0.55
ROI_BOTTOM = 1.0
ROI_LEFT = 0.15
ROI_RIGHT = 0.85
BRIGHTNESS_THRESHOLD = 60
PERSISTENCE_FRAMES = 8
SMOOTHING_WINDOW = 5

def get_roi_config():
    """Return ROI configuration for frontend overlay"""
    return {
        "top": ROI_TOP,
        "bottom": ROI_BOTTOM,
        "left": ROI_LEFT,
        "right": ROI_RIGHT
    }

def process_frame(gray_frame, persistence, history):
    """Process a single frame and return choke data"""
    h, w = gray_frame.shape
    roi = gray_frame[int(h*ROI_TOP):int(h*ROI_BOTTOM),
              int(w*ROI_LEFT):int(w*ROI_RIGHT)]
    
    _, mask = cv2.threshold(roi, BRIGHTNESS_THRESHOLD, 255,
                            cv2.THRESH_BINARY)
    
    if persistence is None:
        persistence = np.zeros_like(mask, dtype=np.float32)
    
    persistence = np.clip(persistence + np.where(mask > 0, 1,
                                                 -1), 0, PERSISTENCE_FRAMES * 2)
    persistent_mask = (persistence >
                       PERSISTENCE_FRAMES).astype(np.uint8)
    
    raw_occupied = persistent_mask.sum()
    total_pixels = persistent_mask.size
    choke_percent = raw_occupied / total_pixels * 100
    
    history.append(choke_percent)
    if len(history) > SMOOTHING_WINDOW:
        history.pop(0)
    
    smoothed = sum(history) / len(history)
    
    return {
        "smoothed_choke_percent": smoothed,
        "raw_occupied_pixels": int(raw_occupied),
        "total_roi_pixels": int(total_pixels),
        "persistence": persistence,
        "history": history
    }

def run():
    cap = cv2.VideoCapture(VIDEO_SOURCE)
    persistence = None
    history = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        result = process_frame(gray, persistence, history)
        
        persistence = result["persistence"]
        history = result["history"]
        
        print(f"Choke %: {result['smoothed_choke_percent']:.1f}")
        
        # Reconstruct persistent mask for display
        h, w = gray.shape
        roi = gray[int(h*ROI_TOP):int(h*ROI_BOTTOM),
                  int(w*ROI_LEFT):int(w*ROI_RIGHT)]
        persistent_mask = (result["persistence"] > PERSISTENCE_FRAMES).astype(np.uint8)
        
        cv2.imshow("ROI Mask", persistent_mask * 255)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run()
