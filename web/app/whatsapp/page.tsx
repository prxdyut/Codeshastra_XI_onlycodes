import WhatsAppManager from "../components/WhatsAppManager";

export default function WhatsAppPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">WhatsApp Integration</h1>
            <p className="mb-4">
                Manage your WhatsApp connection and messages.
            </p>
            <WhatsAppManager />
        </div>
    );
}
