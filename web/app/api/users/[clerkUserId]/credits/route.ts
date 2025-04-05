// app/api/users/[clerkUserId]/credits/route.js
import { User } from "@/app/models/User";
import connectDB from "@/app/lib/mongoose";

export async function GET(
    request: Request,
    { params }: { params: { clerkUserId: string } }
) {
    await connectDB();

    try {
        console.log(
            "Fetching user credits for clerkUserId:",
            (await params).clerkUserId
        );
        // Find user by clerkUserId
        const user = await User.findOne({
            clerkUserId: (await params).clerkUserId,
        });
        console.log("User found:", user, await User.findOne());
        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        // Return just the credits
        return Response.json({
            clerkUserId: (await params).clerkUserId,
            credits: user.credits || 0,
        });
    } catch (error) {
        console.error("Error fetching user credits:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
