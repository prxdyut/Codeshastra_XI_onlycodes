export default function ContentWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex-1 overflow-y-auto min-h-screen">
            <div className="container mx-auto px-4 py-8">{children}</div>
        </div>
    );
}
