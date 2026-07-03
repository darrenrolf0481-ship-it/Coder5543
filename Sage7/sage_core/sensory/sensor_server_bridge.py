import asyncio
import json
import time

import httpx
import websockets

# SAGE-7 SensorServer Bridge
# Connects to UmerCodez/SensorServer via WebSockets and relays to SAGE API

SENSOR_SERVER_WS = 'ws://localhost:8080/sensors/connect?types=["android.sensor.accelerometer","android.sensor.magnetometer"]'
SAGE_API_URL = "http://127.0.0.1:8001/sensory_input"


async def relay_sensors():
    print(f"[SAGE] ATTEMPTING LINK TO SENSOR SERVER: {SENSOR_SERVER_WS}")

    async with httpx.AsyncClient() as client:
        while True:
            try:
                async with websockets.connect(SENSOR_SERVER_WS) as websocket:
                    print("[SAGE] LINK ESTABLISHED. SENSORY STREAM ACTIVE.")

                    async for message in websocket:
                        data = json.loads(message)

                        # Data format from SensorServer: {"type": "...", "values": [...], "timestamp": ...}
                        sensor_type = data.get("type", "UNKNOWN")
                        values = data.get("values", [])

                        # Prepare SAGE SensoryData payload
                        payload = {
                            "sensory_type": f"EXTERNAL_{sensor_type.upper().split('.')[-1]}",
                            "content": f"Live feed from SensorServer: {sensor_type}",
                            "severity": 0.3,
                            "data": {
                                "values": values,
                                "raw_type": sensor_type,
                                "source": "SensorServer",
                            },
                            "timestamp": time.time(),
                        }

                        # Relay to SAGE substrate
                        try:
                            await client.post(SAGE_API_URL, json=payload, timeout=1.0)
                        except Exception as e:
                            print(f"[!] RELAY ERROR: {e}")

            except Exception as e:
                print(f"[!] CONNECTION LOST: {e}. Retrying in 5s...")
                await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(relay_sensors())
    except KeyboardInterrupt:
        print("[SAGE] Bridge deactivated.")
