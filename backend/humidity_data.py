"""
Historical monthly relative humidity (%) for Raipur, Chhattisgarh.
Source: India Meteorological Department (IMD) station data for Raipur.
Used to modulate buildup rates in the simulator — higher humidity → 
faster material adhesion and choke buildup, reflecting the documented
link between moisture content and coal/limestone lumping in discharge chutes.
"""

# Monthly average relative humidity (%) — Raipur, CG (IMD long-period average)
# Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
MONTHLY_HUMIDITY = [
    50,  # January   — cool, dry post-monsoon
    38,  # February  — driest month
    28,  # March     — hot and dry
    22,  # April     — peak summer, very dry
    32,  # May       — pre-monsoon, occasional humidity
    72,  # June      — monsoon onset
    88,  # July      — peak monsoon
    86,  # August    — peak monsoon
    80,  # September — retreating monsoon
    62,  # October   — post-monsoon, still humid
    52,  # November  — transitioning dry
    50,  # December  — dry season begins
]


def get_humidity_multiplier(month: int | None = None) -> float:
    """
    Return a buildup-rate multiplier based on the given month (1–12).
    Defaults to the current calendar month.
    
    Scale: 1.0 at 40% RH (mid-season baseline), up to ~2.5 at peak monsoon.
    Formula: multiplier = 1.0 + (humidity - 40) / 40, clamped to [0.7, 2.5]
    """
    if month is None:
        from datetime import datetime
        month = datetime.now().month

    rh = MONTHLY_HUMIDITY[month - 1]
    multiplier = 1.0 + (rh - 40) / 40.0
    return max(0.7, min(2.5, round(multiplier, 2)))


def get_current_humidity() -> int:
    """Return the current month's average humidity %."""
    from datetime import datetime
    return MONTHLY_HUMIDITY[datetime.now().month - 1]
