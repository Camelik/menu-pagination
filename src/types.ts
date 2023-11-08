import { Context } from "./deps.deno.ts";

export type NestedArrayOrObject = (number[] | string[] | object)[];

export interface SchameOptions {
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
    dynamicDataFn?: (page: number) => Promise<{ maxPage: any; data: any }>;
    /**
     * A function responsible for displaying data in the pagination component.
     */
    displayDataFn?: (data: any, index: number) => string;
    buttonFn?: (ctx: Context, data: any) => void;
};

export type Schema = "default" | "numbers";

export type Session = {
    currentUserPage?: number;
    [key: string]: any;
};

export type Config = {
    template?: string[];
    [key: string]: any;
};

export type DynamicObject = {
    [key: string]: any;
};
