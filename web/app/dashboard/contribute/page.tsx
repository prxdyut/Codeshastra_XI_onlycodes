"use client";

import { useState } from "react";

const THEME = {
    primary: "#2D3A3A",
    secondary: "#78A083",
    accent: "#B4C7AE",
    background: "#F5F9F3",
    text: "#2D3A3A",
    border: "#E0E6E3",
    muted: "#5E5F6E",
};

export default function ContributePage() {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        problem: "",
        solution: "",
        impact: "",
        requirements: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log(formData);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#2D3A3A] mb-3">
                        Share Your Innovation
                    </h1>
                    <p className="text-[#5E5F6E] max-w-2xl mx-auto">
                        Help us grow by contributing your ideas and solutions to
                        make our platform better
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E0E6E3]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#2D3A3A]">
                                Project Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your project title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        title: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2 rounded-lg border border-[#E0E6E3] focus:outline-none focus:ring-2 focus:ring-[#78A083] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#2D3A3A]">
                                Project Description
                            </label>
                            <textarea
                                placeholder="Describe your project idea in detail"
                                className="w-full px-4 py-2 rounded-lg border border-[#E0E6E3] focus:outline-none focus:ring-2 focus:ring-[#78A083] focus:border-transparent min-h-[100px] resize-y"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[#2D3A3A]">
                                    Problem Statement
                                </label>
                                <textarea
                                    placeholder="What problem does your project solve?"
                                    className="w-full px-4 py-2 rounded-lg border border-[#E0E6E3] focus:outline-none focus:ring-2 focus:ring-[#78A083] focus:border-transparent min-h-[150px] resize-y"
                                    value={formData.problem}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            problem: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-[#2D3A3A]">
                                    Proposed Solution
                                </label>
                                <textarea
                                    placeholder="How does your solution work?"
                                    className="w-full px-4 py-2 rounded-lg border border-[#E0E6E3] focus:outline-none focus:ring-2 focus:ring-[#78A083] focus:border-transparent min-h-[150px] resize-y"
                                    value={formData.solution}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            solution: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#2D3A3A]">
                                Expected Impact
                            </label>
                            <textarea
                                placeholder="What impact will your project have?"
                                className="w-full px-4 py-2 rounded-lg border border-[#E0E6E3] focus:outline-none focus:ring-2 focus:ring-[#78A083] focus:border-transparent resize-y"
                                value={formData.impact}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        impact: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#2D3A3A]">
                                Technical Requirements
                            </label>
                            <textarea
                                placeholder="List any technical requirements or resources needed"
                                className="w-full px-4 py-2 rounded-lg border border-[#E0E6E3] focus:outline-none focus:ring-2 focus:ring-[#78A083] focus:border-transparent resize-y"
                                value={formData.requirements}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        requirements: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-[#78A083] hover:bg-[#2D3A3A] text-white font-semibold rounded-lg transition-colors"
                            >
                                Submit Contribution
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 bg-[#F5F9F3] rounded-xl p-6 border border-[#E0E6E3]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl">
                            💡
                        </div>
                        <h3 className="font-semibold text-[#2D3A3A]">
                            Contribution Guidelines
                        </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-[#5E5F6E]">
                        <li>• Be clear and specific in your descriptions</li>
                        <li>
                            • Provide detailed technical requirements if
                            applicable
                        </li>
                        <li>• Explain the problem and solution thoroughly</li>
                        <li>
                            • Consider the impact and feasibility of your idea
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
