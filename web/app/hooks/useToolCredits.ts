import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export const useToolCredits = () => {
    const { user } = useUser();
    const [isProcessing, setIsProcessing] = useState(false);

    const deductCredits = async () => {
        if (!user || isProcessing) return;

        try {
            setIsProcessing(true);
            const response = await fetch(`/api/users/decrease-credits?clerkUserId=${user.id}&amount=1`);
            const data = await response.json();

            if (!response.ok) {
                if (data.error === 'Insufficient credits') {
                    throw new Error('Insufficient credits');
                }
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    return { deductCredits, isProcessing };
}; 