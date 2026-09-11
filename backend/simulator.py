"""
Modbus TCP Simulator — simulates the plant-side PLC.

Register map (all Holding Registers, 1-indexed):
  Sensor Left Slant  : regs  1– 6  (ultrasonic, load_cell, vibration, motor_current, temp, choke×10)
  Sensor Right Slant : regs  7–12
  Lead Tally         : regs 13–14  (left_leads, right_leads — rolling 20-cycle count)

Run standalone: python backend/simulator.py
"""

import sys
import asyncio
import random
from datetime import datetime

from pymodbus.server import StartAsyncTcpServer
from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext, ModbusSequentialDataBlock

# ── Shared register block (1-indexed, 40 slots) ──────────────────────────────
HR_BLOCK = ModbusSequentialDataBlock(1, [0] * 40)

# ── Humidity multiplier from real IMD Raipur historic data ───────────────────
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from humidity_data import get_humidity_multiplier

HUMIDITY_MULT = get_humidity_multiplier()
print(f"[simulator] Month {datetime.now().month}: humidity multiplier = {HUMIDITY_MULT}x "
      f"(buildup rates scaled by real Chhattisgarh RH data)")


class SensorSimulation:
    """
    Independent state machine for one physical sensor mount point.
    Slightly different timing per sensor so they don't move in lockstep.
    """
    SENSORS = {
        "left":   {"buildup_rate": (4, 9),  "clear_rate": (12, 22), "threshold": 60},
        "right":  {"buildup_rate": (2, 6),  "clear_rate": (10, 18), "threshold": 58},
    }

    def __init__(self, name: str):
        self.name = name
        cfg = self.SENSORS[name]
        self.buildup_lo, self.buildup_hi = cfg["buildup_rate"]
        self.clear_lo, self.clear_hi = cfg["clear_rate"]
        self.threshold = cfg["threshold"]

        self.state = 0          # 0=normal, 1=buildup, 2=vibro, 3=escalated
        self.choke = random.uniform(6, 12)
        self.cycle_count = 0
        self.first_warned_this_cycle = False

    def step(self, humidity_mult: float, lead_log: list) -> dict:
        """Advance state machine one tick and return sensor reading dict."""
        if self.state == 0:
            self.choke += random.uniform(-1.5, 1.5)
            self.choke = max(5.0, min(14.0, self.choke))
            self.first_warned_this_cycle = False
            if random.random() < 0.12:
                self.state = 1

        elif self.state == 1:
            increment = random.uniform(self.buildup_lo, self.buildup_hi) * humidity_mult
            self.choke += increment

            # Log who crosses warning threshold first
            if self.choke >= 50 and not self.first_warned_this_cycle:
                self.first_warned_this_cycle = True
                lead_log.append(self.name)          # logged centrally

            if self.choke >= self.threshold:
                self.cycle_count += 1
                self.state = 3 if self.cycle_count % 3 == 0 else 2

        elif self.state == 2:
            self.choke -= random.uniform(self.clear_lo, self.clear_hi)
            if self.choke <= 14.0:
                self.choke = 14.0
                self.state = 0

        elif self.state == 3:
            self.choke += random.uniform(-0.5, 1.5)
            self.choke = min(84.0, self.choke)
            if random.random() < 0.07:
                self.state = 0
                self.choke = 14.0

        choke = round(self.choke, 1)
        ultrasonic    = max(100, int(1500 - choke * 10))
        load_cell     = int(choke * 25 + random.uniform(-40, 40))
        vibration     = 82 if self.state == 2 else int(4 + choke * 0.1 + random.uniform(0, 4))
        motor_current = 24000 if self.state == 2 else 1200 + int(random.uniform(-60, 60))
        temperature   = 350 + int(choke)
        choke_reg     = int(choke * 10)

        return [ultrasonic, load_cell, vibration, motor_current, temperature, choke_reg]


class PlantSimulation:
    REGISTER_OFFSETS = {"left": 1, "right": 7}  # Modbus address (1-indexed) for writes
    TALLY_OFFSET = 13  # regs 13-14
    ROLLING = 20

    def __init__(self):
        self.sensors = {name: SensorSimulation(name) for name in ("left", "right")}
        self.lead_log = []

    def _tally(self) -> dict:
        recent = self.lead_log[-self.ROLLING:]
        return {
            "left":   recent.count("left"),
            "right":  recent.count("right"),
        }

    async def run(self):
        from pymodbus.client import AsyncModbusTcpClient
        
        client = AsyncModbusTcpClient("localhost", port=5020)
        
        # Wait until the server is up
        while True:
            if await client.connect():
                print("[simulator] Internal client connected to own server.")
                break
            await asyncio.sleep(1)

        try:
            while True:
                for name, sensor in self.sensors.items():
                    regs = sensor.step(HUMIDITY_MULT, self.lead_log)
                    offset = self.REGISTER_OFFSETS[name]
                    # Write multiple registers to local server
                    await client.write_registers(offset, regs)

                tally = self._tally()
                await client.write_registers(self.TALLY_OFFSET, [
                    tally["left"], tally["right"], tally["middle"]
                ])

                await asyncio.sleep(1.0)
        except Exception as e:
            print(f"[simulator] Error in simulation loop: {e}")
        finally:
            client.close()


async def run_server():
    # Setup legacy context with plenty of space (40 registers), 0 initialized
    # so they exist and can be written to by our internal client loop.
    device  = ModbusSlaveContext(hr=ModbusSequentialDataBlock(1, [0]*40))
    context = ModbusServerContext(slaves=device, single=True)

    sim = PlantSimulation()
    asyncio.create_task(sim.run())

    print("Modbus TCP Simulator listening on localhost:5020 …")
    await StartAsyncTcpServer(context=context, address=("localhost", 5020))


if __name__ == "__main__":
    asyncio.run(run_server())
