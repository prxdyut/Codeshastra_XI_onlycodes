"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useToolCredits } from "@/app/hooks/useToolCredits";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Add these types at the top of the file
interface ResultType {
    number?: number;
    uuid?: string;
    result?: number[];
    flip?: string;
    error?: string;
}

const NumberAnimation = ({ number }: { number: number }) => {
    return (
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
            }}
            transition={{
                duration: 0.5,
                type: "spring",
                bounce: 0.5,
            }}
            className="relative"
        >
            <motion.span
                animate={{ rotate: [-5, 5] }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 0.5,
                }}
                className="text-6xl font-bold text-[#78A083] inline-block"
            >
                {number}
            </motion.span>
        </motion.div>
    );
};

const CoinFlip = ({ result }: { result: string }) => {
    return (
        <motion.div
            initial={{ rotateX: 0 }}
            animate={{ rotateX: 1800 }}
            transition={{ duration: 2, type: "spring" }}
            className="w-32 h-32 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 
                     flex items-center justify-center text-2xl font-bold shadow-lg"
        >
            {result}
        </motion.div>
    );
};

const DiceRoll = ({ results }: { results: number[] }) => {
    return (
        <div className="flex gap-4 flex-wrap justify-center">
            {results.map((result, index) => (
                <motion.div
                    key={index}
                    initial={{ y: -100, rotate: 0 }}
                    animate={{
                        y: 0,
                        rotate: 360 * 3,
                    }}
                    transition={{
                        type: "spring",
                        duration: 1,
                        delay: index * 0.2,
                    }}
                    className="w-20 h-20 bg-white shadow-lg rounded-lg flex items-center justify-center
                             text-2xl font-bold border-2 border-[#78A083]"
                >
                    {result}
                </motion.div>
            ))}
        </div>
    );
};

const UUIDGenerator = ({ uuid }: { uuid: string }) => {
    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden"
        >
            <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-mono text-lg bg-gray-100 p-4 rounded-lg select-all cursor-pointer"
            >
                {uuid}
            </motion.div>
        </motion.div>
    );
};

export default function RandomTools() {
    const pathname = usePathname();
    const tool = pathname.split("/").pop();
    const [result, setResult] = useState<ResultType | null>(null);
    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(100);
    const { deductCredits, isProcessing } = useToolCredits();

    const generateRandom = async () => {
        try {
            // First try to deduct credits
            await deductCredits();

            let endpoint = "http://localhost:5000";
            switch (tool) {
                case "random-number":
                    endpoint += `/random/number?min=${minValue}&max=${maxValue}`;
                    break;
                case "uuid-generator":
                    endpoint += "/random/uuid/v4";
                    break;
                case "dice-roll":
                    endpoint += "/random/dice";
                    break;
                case "coin-flip":
                    endpoint += "/random/coin";
                    break;
            }

            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                setResult(data);
            } catch (error) {
                setResult({ error: "Failed to generate" });
            }
        } catch (error: any) {
            if (error.message === "Insufficient credits") {
                toast.error("You do not have enough credits to use this tool");
                return;
            }
            setResult({ error: "Failed to generate" });
        }
    };

    useEffect(() => {
        generateRandom();
    }, [tool]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
            <h1 className="text-3xl font-bold text-gray-800">
                {tool
                    ?.split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
            </h1>

            {/* Range inputs for random number */}
            {tool === "random-number" && (
                <div className="w-full max-w-md space-y-4 bg-white p-6 rounded-lg shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Minimum
                            </label>
                            <input
                                type="number"
                                value={minValue}
                                onChange={(e) =>
                                    setMinValue(Number(e.target.value))
                                }
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Maximum
                            </label>
                            <input
                                type="number"
                                value={maxValue}
                                onChange={(e) =>
                                    setMaxValue(Number(e.target.value))
                                }
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={JSON.stringify(result)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex justify-center items-center p-8"
                >
                    {result &&
                        (tool === "random-number" ? (
                            <NumberAnimation number={result.number!} />
                        ) : tool === "uuid-generator" ? (
                            <UUIDGenerator uuid={result.uuid!} />
                        ) : tool === "dice-roll" ? (
                            <DiceRoll results={result.result!} />
                        ) : tool === "coin-flip" ? (
                            <CoinFlip result={result.flip!} />
                        ) : null)}
                </motion.div>
            </AnimatePresence>

            <motion.button
                onClick={generateRandom}
                className="px-6 py-3 bg-[#78A083] text-white rounded-lg font-medium
                         hover:bg-[#6a8f74] active:scale-95 transition-all"
                whileTap={{ scale: 0.95 }}
            >
                Generate Again
            </motion.button>
        </div>
    );
}
