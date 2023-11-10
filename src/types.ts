import { Context } from "./deps.deno.ts";

export type NestedArrayOrObject = (number[] | string[] | object[])[];

export interface SchemaOptions {
    [key: string]: () => Promise<Config | undefined>;
}

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
    // deno-lint-ignore no-explicit-any
    dynamicDataFn?: (page: number) => Promise<{ maxPage: any; data: any }>;
    /**
     * A function responsible for displaying data in the pagination component.
     */
    // deno-lint-ignore no-explicit-any
    displayDataFn?: (data: any, index: number) => string;
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
