/**
 * DayPlan JSON Schema for OpenAI Structured Outputs
 * Phase 1A: Formal schema definition for structured LLM outputs
 */
export const DAYPLAN_SCHEMA = {
    type: 'object',
    properties: {
        date: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Date in YYYY-MM-DD format',
        },
        summary: {
            type: 'string',
            minLength: 10,
            maxLength: 500,
            description: '2-3 sentences summarizing the day plan',
        },
        blocks: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    start: {
                        type: 'string',
                        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?([+-]\\d{2}:\\d{2})?$',
                        description: 'Start time in ISO 8601 format',
                    },
                    end: {
                        type: 'string',
                        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?([+-]\\d{2}:\\d{2})?$',
                        description: 'End time in ISO 8601 format',
                    },
                    label: {
                        type: 'string',
                        minLength: 3,
                        maxLength: 100,
                        description: 'Brief description of the time block',
                    },
                    type: {
                        type: 'string',
                        enum: ['meeting', 'focus', 'break', 'admin', 'commute', 'exercise', 'errand', 'sleep'],
                        description: 'Type of activity in this time block',
                    },
                    dependsOn: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'IDs of blocks this depends on',
                    },
                    linkedEvents: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Calendar event IDs linked to this block',
                    },
                    filesToOpen: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'File paths to open for this block (Phase 1A: read-only)',
                    },
                    commands: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Shell commands for this block (Phase 1A: none allowed)',
                    },
                    risk: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        description: 'Risk level for schedule conflicts',
                    },
                },
                required: ['start', 'end', 'label', 'type'],
                additionalProperties: false,
            },
            minItems: 1,
            description: 'Time blocks making up the day plan',
        },
        ambiguities: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    eventId: {
                        type: 'string',
                        description: 'Calendar event ID related to this ambiguity',
                    },
                    question: {
                        type: 'string',
                        minLength: 5,
                        maxLength: 200,
                        description: 'Specific question to clarify',
                    },
                    options: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Possible answer options',
                    },
                    required: {
                        type: 'boolean',
                        description: 'Whether this must be answered before proceeding',
                    },
                },
                required: ['question', 'required'],
                additionalProperties: false,
            },
            description: 'Questions that need clarification',
        },
        suggestions: {
            type: 'array',
            items: {
                type: 'string',
                minLength: 5,
                maxLength: 150,
            },
            description: 'Helpful suggestions for the day',
        },
    },
    required: ['date', 'summary', 'blocks'],
    additionalProperties: false,
};
/**
 * Validate a DayPlan object against the schema
 */
export function validateDayPlan(plan) {
    if (!plan || typeof plan !== 'object') {
        return false;
    }
    const p = plan;
    // Check required fields
    if (typeof p.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) {
        return false;
    }
    if (typeof p.summary !== 'string' || p.summary.length < 10 || p.summary.length > 500) {
        return false;
    }
    if (!Array.isArray(p.blocks) || p.blocks.length === 0) {
        return false;
    }
    // Validate each block
    for (const block of p.blocks) {
        if (!validatePlanBlock(block)) {
            return false;
        }
    }
    // Validate optional fields
    if (p.ambiguities !== undefined) {
        if (!Array.isArray(p.ambiguities)) {
            return false;
        }
        for (const ambiguity of p.ambiguities) {
            if (!validateAmbiguity(ambiguity)) {
                return false;
            }
        }
    }
    if (p.suggestions !== undefined) {
        if (!Array.isArray(p.suggestions)) {
            return false;
        }
        for (const suggestion of p.suggestions) {
            if (typeof suggestion !== 'string' || suggestion.length < 5 || suggestion.length > 150) {
                return false;
            }
        }
    }
    return true;
}
function validatePlanBlock(block) {
    if (!block || typeof block !== 'object') {
        return false;
    }
    const b = block;
    // Check required fields
    const isoTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?([+-]\d{2}:\d{2})?$/;
    if (typeof b.start !== 'string' || !isoTimePattern.test(b.start)) {
        return false;
    }
    if (typeof b.end !== 'string' || !isoTimePattern.test(b.end)) {
        return false;
    }
    if (typeof b.label !== 'string' || b.label.length < 3 || b.label.length > 100) {
        return false;
    }
    const validTypes = [
        'meeting',
        'focus',
        'break',
        'admin',
        'commute',
        'exercise',
        'errand',
        'sleep',
    ];
    if (typeof b.type !== 'string' || !validTypes.includes(b.type)) {
        return false;
    }
    // Check optional fields
    if (b.dependsOn !== undefined &&
        (!Array.isArray(b.dependsOn) || !b.dependsOn.every(d => typeof d === 'string'))) {
        return false;
    }
    if (b.linkedEvents !== undefined &&
        (!Array.isArray(b.linkedEvents) || !b.linkedEvents.every(e => typeof e === 'string'))) {
        return false;
    }
    if (b.filesToOpen !== undefined &&
        (!Array.isArray(b.filesToOpen) || !b.filesToOpen.every(f => typeof f === 'string'))) {
        return false;
    }
    if (b.commands !== undefined &&
        (!Array.isArray(b.commands) || !b.commands.every(c => typeof c === 'string'))) {
        return false;
    }
    const validRiskLevels = ['low', 'medium', 'high'];
    if (b.risk !== undefined && (typeof b.risk !== 'string' || !validRiskLevels.includes(b.risk))) {
        return false;
    }
    return true;
}
function validateAmbiguity(ambiguity) {
    if (!ambiguity || typeof ambiguity !== 'object') {
        return false;
    }
    const a = ambiguity;
    // Check required fields
    if (typeof a.question !== 'string' || a.question.length < 5 || a.question.length > 200) {
        return false;
    }
    if (typeof a.required !== 'boolean') {
        return false;
    }
    // Check optional fields
    if (a.eventId !== undefined && typeof a.eventId !== 'string') {
        return false;
    }
    if (a.options !== undefined &&
        (!Array.isArray(a.options) || !a.options.every(o => typeof o === 'string'))) {
        return false;
    }
    return true;
}
