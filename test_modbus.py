import asyncio
from pymodbus.client import AsyncModbusTcpClient

async def test():
    c = AsyncModbusTcpClient('localhost', port=5020)
    await c.connect()
    r = await c.read_holding_registers(1, count=6)
    print('Registers:', r.registers)
    c.close()

asyncio.run(test())
