from datetime import datetime
import pytz

def convert_timezone_logic(time_str, from_tz, to_tz):
    try:
        # Parse the input time string
        naive_dt = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")

        # Convert to source timezone
        from_timezone = pytz.timezone(from_tz)
        localized_dt = from_timezone.localize(naive_dt)

        # Convert to target timezone
        to_timezone = pytz.timezone(to_tz)
        converted_dt = localized_dt.astimezone(to_timezone)

        return {"converted_time": converted_dt.strftime("%Y-%m-%d %H:%M:%S")}
    except Exception as e:
        return {"error": str(e)}


def list_timezones():
    return {"timezones": pytz.all_timezones}
