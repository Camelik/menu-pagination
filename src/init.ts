#!/usr/bin/env node
import { existsSync, writeJson } from "./deps.deno.ts";

/**
 * Creates a pagination configuration file if it doesn't already exist.
 *
 * @async
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the configuration file was created, or `false` if it already exists.
 *
 * @description
 * This function checks if a pagination configuration file already exists.
 * If it does not exist, it creates a new configuration file with default values.
 * The function returns a promise that resolves to `true` if the configuration file was created, or `false` if it already exists.
 */
async function paginationConfig(): Promise<boolean> {
    const configFilePath = `../paginationConfig.json`;
    if (existsSync(configFilePath)) {
        console.log("paginationConfig.json already exists. Returning.");
        return false;
    }

    const configData = {
        maxBack: "<<",
        back: "<",
        displayedNumbers: "{page}/{maxPage}",
        next: ">",
        maxNext: ">>",
        backButton: "Back",
        template: [
            "maxBack",
            "back",
            "displayedNumbers",
            "next",
            "maxNext",
            "row",
            "backButton",
        ],
    };

    await writeJson(configFilePath, configData, { spaces: 2 });
    return true;
}

const userResult = confirm(
    "Do you want init @grammyjs/menu-pagination config file?",
);

if (userResult && await paginationConfig()) {
    alert("✔ Your Pagination Config File was created");
}
