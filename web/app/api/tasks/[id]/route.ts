import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { db } = await connectToDatabase();
        await db.collection("tasks").deleteOne({
            _id: params.id,
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: "Failed to delete task",
        });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { db } = await connectToDatabase();
        await db
            .collection("tasks")
            .updateOne({ _id: params.id }, { $set: body });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: "Failed to update task",
        });
    }
}
