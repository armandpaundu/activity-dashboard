import { ActivityRecord } from "./types";

export type DerivedCategory =
    | "Meeting"
    | "Presentation"
    | "Development"
    | "Analysis"
    | "Documentation"
    | "Internal"
    | "Other";

const KEYWORDS: Record<DerivedCategory, string[]> = {
    Meeting: ["meeting", "sync", "standup", "call", "catchup", "check-in", "1:1", "planning"],
    Presentation: ["deck", "slide", "presentation", "demo", "showcase"],
    Development: ["code", "script", "pipeline", "etl", "debug", "fix", "implement", "deploy", "pr review"],
    Analysis: ["analysis", "investigate", "insight", "research", "audit", "explore"],
    Documentation: ["doc", "documentation", "spec", "wiki", "readme", "guide"],
    Internal: ["follow up", "alignment", "admin", "email", "slack", "chat", "prep"],
    Other: []
};

// Strategic rules (examples):
// - Development, Analysis, Documentation -> Strategic
// - Meeting, Internal -> Operational (unless "Brainstorming" etc. - keep it simple for now)
const STRATEGIC_CATEGORIES = new Set<DerivedCategory>([
    "Development",
    "Analysis",
    "Documentation",
    "Presentation"
]);

export function classifyActivity(description: string): DerivedCategory {
    const lowerDesc = description.toLowerCase();

    for (const [cat, keywords] of Object.entries(KEYWORDS)) {
        if (keywords.some(k => lowerDesc.includes(k))) {
            return cat as DerivedCategory;
        }
    }

    return "Other";
}

export function isStrategic(category: DerivedCategory): boolean {
    return STRATEGIC_CATEGORIES.has(category);
}

export function isPlanned(description: string, project: string): boolean {
    const lowerDesc = description.toLowerCase();
    const unplannedKeywords = ["ad-hoc", "urgent", "broken", "incident", "fire", "quick fix"];

    if (unplannedKeywords.some(k => lowerDesc.includes(k))) return false;

    // Tasks in "Support" project usually unplanned?
    if (project.toLowerCase().includes("support")) return false;

    return true;
}
