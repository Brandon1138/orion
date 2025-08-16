/**
 * DayPlan JSON Schema for OpenAI Structured Outputs
 * Phase 1A: Formal schema definition for structured LLM outputs
 */
export declare const DAYPLAN_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly date: {
            readonly type: "string";
            readonly pattern: "^\\d{4}-\\d{2}-\\d{2}$";
            readonly description: "Date in YYYY-MM-DD format";
        };
        readonly summary: {
            readonly type: "string";
            readonly minLength: 10;
            readonly maxLength: 500;
            readonly description: "2-3 sentences summarizing the day plan";
        };
        readonly blocks: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly start: {
                        readonly type: "string";
                        readonly pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?([+-]\\d{2}:\\d{2})?$";
                        readonly description: "Start time in ISO 8601 format";
                    };
                    readonly end: {
                        readonly type: "string";
                        readonly pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?([+-]\\d{2}:\\d{2})?$";
                        readonly description: "End time in ISO 8601 format";
                    };
                    readonly label: {
                        readonly type: "string";
                        readonly minLength: 3;
                        readonly maxLength: 100;
                        readonly description: "Brief description of the time block";
                    };
                    readonly type: {
                        readonly type: "string";
                        readonly enum: readonly ["meeting", "focus", "break", "admin", "commute", "exercise", "errand", "sleep"];
                        readonly description: "Type of activity in this time block";
                    };
                    readonly dependsOn: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "IDs of blocks this depends on";
                    };
                    readonly linkedEvents: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "Calendar event IDs linked to this block";
                    };
                    readonly filesToOpen: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "File paths to open for this block (Phase 1A: read-only)";
                    };
                    readonly commands: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "Shell commands for this block (Phase 1A: none allowed)";
                    };
                    readonly risk: {
                        readonly type: "string";
                        readonly enum: readonly ["low", "medium", "high"];
                        readonly description: "Risk level for schedule conflicts";
                    };
                };
                readonly required: readonly ["start", "end", "label", "type"];
                readonly additionalProperties: false;
            };
            readonly minItems: 1;
            readonly description: "Time blocks making up the day plan";
        };
        readonly ambiguities: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly eventId: {
                        readonly type: "string";
                        readonly description: "Calendar event ID related to this ambiguity";
                    };
                    readonly question: {
                        readonly type: "string";
                        readonly minLength: 5;
                        readonly maxLength: 200;
                        readonly description: "Specific question to clarify";
                    };
                    readonly options: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "Possible answer options";
                    };
                    readonly required: {
                        readonly type: "boolean";
                        readonly description: "Whether this must be answered before proceeding";
                    };
                };
                readonly required: readonly ["question", "required"];
                readonly additionalProperties: false;
            };
            readonly description: "Questions that need clarification";
        };
        readonly suggestions: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
                readonly minLength: 5;
                readonly maxLength: 150;
            };
            readonly description: "Helpful suggestions for the day";
        };
    };
    readonly required: readonly ["date", "summary", "blocks"];
    readonly additionalProperties: false;
};
/**
 * Type definition derived from the schema
 */
export type DayPlanSchema = {
    date: string;
    summary: string;
    blocks: Array<{
        start: string;
        end: string;
        label: string;
        type: 'meeting' | 'focus' | 'break' | 'admin' | 'commute' | 'exercise' | 'errand' | 'sleep';
        dependsOn?: string[];
        linkedEvents?: string[];
        filesToOpen?: string[];
        commands?: string[];
        risk?: 'low' | 'medium' | 'high';
    }>;
    ambiguities?: Array<{
        eventId?: string;
        question: string;
        options?: string[];
        required: boolean;
    }>;
    suggestions?: string[];
};
/**
 * Validate a DayPlan object against the schema
 */
export declare function validateDayPlan(plan: unknown): plan is DayPlanSchema;
