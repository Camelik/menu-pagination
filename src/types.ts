import { Context } from "./deps.deno.ts";

export type NestedArrayOrObject = (number[] | string[] | object[])[];

export interface SchemaOptions {
    [key: string]: () => Promise<Config | undefined>;
}

/** A value, or a promise of a value */
type MaybePromise<T> = T | Promise<T>;
/** A potentially async function that takes a context and returns a string */
type DynamicString<C extends Context> = (ctx: C) => MaybePromise<string>;
/** A potentially dynamic string */
type MaybeDynamicString<C extends Context> = string | DynamicString<C>;

/** An object containing text and payload */
interface TextAndPayload<C extends Context> {
    /** Text to display */
    text: MaybeDynamicString<C>;
    /** Optional payload */
    payload?: MaybeDynamicString<C>;
}

type ButtonType = "url" | "payment" | "webapp";

/** Pagination Option's Types*/
export type PaginationOptions = {
    dynamicData?: NestedArrayOrObject;
    /**
     * Static data to be passed to the pagination component.
     */
    staticData?: NestedArrayOrObject;
    /**
     * Specifies whether the user can navigate back to the previous menu.
     */
    allowBackToMenu?: boolean;
    /**
     * The schema that the pagination component should apply. It can be "default" or "numbers".
     */
    schema?: Schema;
    /**
     * The display type, which can be "text" or "buttons".
     */
    displayType?: "text" | "buttons";
    /**
     * A function that generates dynamic data for the pagination component.
     */
    dynamicDataFn?: (
        // deno-lint-ignore no-explicit-any
        page: number,
    ) => Promise<{ maxPage: number; data: any; type: ButtonType }>;
    /**
     * A function responsible for displaying data in the pagination component.
     */
    displayDataFn?: (
        // deno-lint-ignore no-explicit-any
        data: any,
        index: number,
    ) => TextAndPayload<Context> | MaybeDynamicString<Context>;
    // deno-lint-ignore no-explicit-any
    buttonFn?: (ctx: Context, data: any) => void;
};

export type Schema = "default" | "numbers";

export type Session = {
    currentUserPage?: number;
    // deno-lint-ignore no-explicit-any
    [key: string]: any;
};

export type Config = {
    template?: string[];
    // deno-lint-ignore no-explicit-any
    [key: string]: any;
};

export type DynamicObject = {
    // deno-lint-ignore no-explicit-any
    [key: string]: any;
};
