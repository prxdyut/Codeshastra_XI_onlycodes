import { useState, useEffect } from "react";

export function useClientTime() {
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        setTime(new Date().toLocaleString());
    }, []);

    return time;
}
