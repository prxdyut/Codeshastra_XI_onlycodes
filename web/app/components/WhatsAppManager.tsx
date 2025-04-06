"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function WhatsAppManager() {
    const [status, setStatus] = useState<
        "initializing" | "waiting_for_scan" | "connected" | "disconnected"
    >("initializing");
    const [qrCode, setQrCode] = useState<string | null>(null);

    useEffect(() => {
        initializeWhatsApp();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const initializeWhatsApp = async () => {
        try {
            await fetch("/api/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "initialize" }),
            });
        } catch (error) {
            console.error("Error initializing WhatsApp:", error);
        }
    };

    const checkStatus = async () => {
        try {
            const response = await fetch("/api/whatsapp");
            const data = await response.json();
            setStatus(data.status);
            if (data.qrCode) {
                setQrCode(data.qrCode);
            }
        } catch (error) {
            console.error("Error checking WhatsApp status:", error);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">
                WhatsApp Connection Status
            </h2>

            <div className="mb-4">
                <p>
                    Status: <span className="font-semibold">{status}</span>
                </p>
            </div>

            {status === "waiting_for_scan" && qrCode && (
                <div className="mb-4">
                    <p className="mb-2">Scan this QR code with WhatsApp:</p>
                    <Image
                        src={qrCode}
                        alt="WhatsApp QR Code"
                        width={256}
                        height={256}
                    />
                </div>
            )}

            {status === "connected" && (
                <p className="text-green-600">
                    WhatsApp is connected and ready to receive messages!
                </p>
            )}
        </div>
    );
}
