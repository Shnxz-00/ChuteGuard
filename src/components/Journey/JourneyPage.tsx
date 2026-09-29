import { Card, CardContent } from "../ui/card"
import { ArrowRight, Zap, Camera, CheckCircle, User } from "lucide-react"

export function JourneyPage() {
    const milestones = [
        {
            icon: Zap,
            title: "Initial Concept",
            description: "Started with a vibratory-mechanism + sensor-fusion concept for automated chute clearing",
            color: "var(--color-status-warning)"
        },
        {
            icon: Camera,
            title: "Pivot to CV-Based Detection",
            description: "Pivoted to camera-based computer vision per mentor guidance for more accurate detection",
            color: "var(--color-status-normal)"
        },
        {
            icon: CheckCircle,
            title: "Model Validation",
            description: "Built and validated a trained detection model on real plant footage with high accuracy",
            color: "var(--color-status-normal)"
        },
        {
            icon: User,
            title: "Human-in-the-Loop System",
            description: "Simplified to a pure detect-and-alert system with human-in-the-loop clearing for safety",
            color: "var(--color-status-danger)"
        }
    ]

    return (
        <div className="h-full w-full p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white tracking-tight mb-2">Our Journey</h1>
                <p className="text-sm text-[var(--color-text-muted)]">
                    The evolution of ChuteGuard from concept to a human-centered safety system
                </p>
            </div>

            <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)]">
                <CardContent className="p-8">
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--color-border-color)]" />
                        
                        {/* Timeline items */}
                        <div className="space-y-8">
                            {milestones.map((milestone, index) => (
                                <div key={index} className="relative flex gap-6">
                                    {/* Icon marker */}
                                    <div className="relative z-10 flex-shrink-0">
                                        <div 
                                            className="w-12 h-12 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: `${milestone.color}20`, border: `2px solid ${milestone.color}` }}
                                        >
                                            <milestone.icon className="w-6 h-6" style={{ color: milestone.color }} />
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 pt-2">
                                        <h3 className="text-lg font-heading font-semibold text-white mb-2">
                                            {milestone.title}
                                        </h3>
                                        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                                            {milestone.description}
                                        </p>
                                    </div>

                                    {/* Arrow for next item */}
                                    {index < milestones.length - 1 && (
                                        <div className="absolute left-6 top-12 transform -translate-x-1/2">
                                            <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-12 p-6 bg-[var(--color-background)] rounded-lg border border-[var(--color-border-color)]">
                        <h3 className="text-lg font-heading font-semibold text-white mb-3">Key Learnings</h3>
                        <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                            <li className="flex items-start gap-2">
                                <span className="text-[var(--color-status-normal)] mt-1">•</span>
                                <span>Computer vision provides more accurate and reliable detection than mechanical sensors</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[var(--color-status-normal)] mt-1">•</span>
                                <span>Human-in-the-loop systems are safer for industrial environments than fully automated solutions</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[var(--color-status-normal)] mt-1">•</span>
                                <span>Real-world validation on plant footage is essential for building reliable detection models</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[var(--color-status-normal)] mt-1">•</span>
                                <span>Simplification often leads to more robust and maintainable systems</span>
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}