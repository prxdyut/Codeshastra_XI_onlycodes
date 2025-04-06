import { NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/whatsapp-service";

export async function GET(request: Request) {
    const whatsapp = WhatsAppService.getInstance();

    if (!whatsapp.isClientReady()) {
        const qrCode = whatsapp.getQRCode();
        if (qrCode) {
            return NextResponse.json({ status: "waiting_for_scan", qrCode });
        }
        return NextResponse.json({ status: "initializing" });
    }

    return NextResponse.json({ status: "connected" });
}

export async function POST(request: Request) {
    try {
        const { action } = await request.json();
        const whatsapp = WhatsAppService.getInstance();

        switch (action) {
            case "initialize":
                await whatsapp.initialize();
                return NextResponse.json({ status: "initializing" });

            case "disconnect":
                await whatsapp.disconnect();
                return NextResponse.json({ status: "disconnected" });

            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("WhatsApp API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
