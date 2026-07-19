import type { Rule } from "../types/Rule";

export abstract class BaseSchema {
    // abstract readonly type: SchemaType;

    protected readonly rules: Rule[] = [];

    protected addRule<V>(
        type: Rule["type"],
        value?: V,
        message?: string
    ): this {
        this.rules.push({
            type,
            value,
            message,
        });

        return this;
    }

    getRules(): readonly Rule[] {
        return this.rules;
    }
}