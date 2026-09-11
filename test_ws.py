import asyncio
import websockets

async def test_connection():
    uri = "ws://localhost:8000/ws/data"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to Mock Server WebSocket!")
            response = await websocket.recv()
            print(f"Received data tick: {response}")
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(test_connection())
