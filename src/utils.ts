"use strict";
import { existsSync, readJson } from "./deps.deno.ts";
import { Config, SchameOptions, Schema } from "./types.ts";

const configFilePaths: Record<string, string> = {
    "default": "./src/schemas/default.json",
    "numbers": "./src/schemas/numbers.json",
    "config": "./paginationConfig.json",
};
/**
 * Loads the JSON from the specified configuration file if it exists.
 *
 * @param {string} type - The type of configuration file.
 * @returns {Promise<any>} - A promise that resolves to the loaded JSON, or undefined if the file does not exist.
 *
 * @description
 * This function checks if the configuration file specified by the type exists.
 * If the file exists, it reads and returns the JSON from the file.
 * If the file does not exist, it returns undefined.
 * The function returns a promise that resolves to the loaded JSON or undefined.
 */
export async function loadJsonIfExist(
    type: string,
): Promise<Config | undefined> {
    const configFilePath = configFilePaths[type];

    if (!(existsSync(configFilePath))) {
        return undefined;
    }

    return await readJson(configFilePath) as Config;
}

export const SchemaOptions: SchameOptions = {
    "default": async () => {
        return await loadJsonIfExist("default");
    },
    "numbers": async () => {
        return await loadJsonIfExist("numbers");
    },
};

/**
 * Loads the schema based on the provided schema type.
 *
 * @param {Schema} schema - The schema type.
 * @returns {Promise<any>} - A promise that resolves to the loaded schema.
 *
 * @description
 * This function loads the schema based on the provided schema type by accessing the corresponding function from the `SchemaOptions` object.
 * It returns a promise that resolves to the loaded schema.
 */
export async function loadSchema(schema: Schema) {
    return await SchemaOptions[schema]();
}
/**
 * Parses an array into chunks of objects.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} arr - The array to be parsed.
 * @param {number} chunkSize - The size of each chunk.
 * @returns {T[][]} - An array of chunks, where each chunk is an array of objects.
 *
 * @description
 * This function takes an array and divides it into chunks of a specified size.
 * Each chunk is represented as an array of objects.
 * The function returns an array of these chunks.
 *
 * // Example 1:
 * const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * const chunkSize = 3;
 * const result = parseArrayIntoObjects(arr, chunkSize);
 * // result: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
 *
 * @example
 * // Example 2:
 * const arr = ['a', 'b', 'c', 'd', 'e'];
 * const chunkSize = 2;
 * const result = parseArrayIntoObjects(arr, chunkSize);
 * // result: [['a', 'b'], ['c', 'd'], ['e']]
 */
export function parseArrayIntoObjects<T>(arr: T[], chunkSize: number): T[][] {
    return Array.from(
        { length: Math.ceil(arr.length / chunkSize) },
        (_, i) => arr.slice(i * chunkSize, i * chunkSize + chunkSize),
    );
}
