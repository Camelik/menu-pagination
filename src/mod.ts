"use strict";
import { SessionFlavor } from "https://deno.land/x/grammy@v1.19.2/mod.ts";
import { MenuFlavor } from "https://deno.land/x/grammy_menu@v1.2.1/menu.ts";
import { Context, MenuRange } from "./deps.deno.ts";
import type {
    Config,
    DynamicObject,
    NestedArrayOrObject,
    PaginationOptions,
    Schema,
    Session,
} from "./types.ts";
import { loadJsonIfExist, loadSchema } from "./utils.ts";

interface CurrentPage {
    currentUserPage: number;
}

type ContextSessionMenu = Context & MenuFlavor & SessionFlavor<CurrentPage>;
type params = {
    maxPage: number;
    config: Config;
    session: Session;
    currentUserPage: number;
    menu: MenuRange<ContextSessionMenu>;
};

/**
 * Validates the inputs for pagination.
 *
 * @param {ContextSessionMenu} ctx - The ContextSessionMenu object.
 * @param {MenuRange<ContextSessionMenu>} menu - The menu range.
 * @param {PaginationOptions["staticData"]} staticData - The static data.
 * @param {PaginationOptions["dynamicDataFn"]} dynamicDataFn - The dynamic data function.
 * @param {PaginationOptions["displayDataFn"]} displayDataFn - The display data function.
 * @returns {boolean} - Returns `true` if the inputs are valid.
 * @throws {Error} - Throws an error if the inputs are invalid.
 *
 * @description
 * This function validates the inputs for pagination, including the ContextSessionMenu object, menu range, static data, dynamic data function, and display data function.
 * It checks if the required inputs are provided and throws an error if any of them are missing.
 */
function validateInputs(
    ctx: ContextSessionMenu,
    menu: MenuRange<ContextSessionMenu>,
    staticData: PaginationOptions["staticData"],
    dynamicDataFn: PaginationOptions["dynamicDataFn"],
    displayDataFn: PaginationOptions["displayDataFn"],
): boolean {
    if (!("session" in ctx)) {
        throw new Error("Cannot use pagination without session!");
    }

    if (!menu) {
        throw new Error("You have to pass menu range");
    }

    if (!staticData && !dynamicDataFn) {
        throw new Error("You have to pass staticData or dynamicDataFn!");
    }

    if (!displayDataFn) {
        throw new Error("You have to pass displayDataFn!");
    }
    return true;
}

export async function createPagination(
    menu: MenuRange<ContextSessionMenu>,
    ctx: ContextSessionMenu,
    options: Partial<PaginationOptions>,
) {
    const {
        staticData,
        allowBackToMenu = true,
        schema = "default",
        displayType = "text",
        dynamicDataFn,
        displayDataFn,
        buttonFn,
    } = options;

    validateInputs(ctx, menu, staticData, dynamicDataFn, displayDataFn);

    const session: Session = ctx.session as Session;

    if (staticData) {
        await handleStaticData(
            session,
            {
                staticData,
                displayType,
                allowBackToMenu,
                displayDataFn,
                buttonFn,
            },
            menu,
            schema,
        );
    }

    // deno-lint-ignore no-extra-boolean-cast
    if (!!dynamicDataFn) {
        const res = await memoizeData(
            session.currentUserPage || 0,
            session,
            dynamicDataFn,
        );

        if (displayType === "buttons" && !!buttonFn) {
            res.data.forEach((element: NestedArrayOrObject, i: number) => {
                menu.text(
                    `${displayDataFn?.(element, 0)}`,
                    (ctx: ContextSessionMenu) => {
                        buttonFn(ctx, res.data[i]);
                    },
                ).row();
            });
        }

        await handleDynamicData(
            session,
            res?.maxPage,
            {
                displayType,
                dynamicData: res?.data,
                allowBackToMenu,
                displayDataFn,
                dynamicDataFn,
            },
            menu,
            schema,
        );
    }
}

async function handleStaticData(
    session: Session,
    options: Partial<PaginationOptions>,
    menu: MenuRange<ContextSessionMenu>,
    schema: Schema,
) {
    const {
        staticData,
        displayType,
        allowBackToMenu,
        displayDataFn,
        buttonFn,
    } = options;
    if (staticData) {
        /** Calculate the maximum number of pages based on the length of 'staticData'. */
        const maxPage = staticData.length;
        /** Assign 'currentUserPage' to 0 if it's not already set in the 'session'. */
        session.currentUserPage ??= 0;

        const { currentUserPage } = session;

        if (displayType === "buttons" && !!buttonFn) {
            staticData[currentUserPage].forEach(
                (element: number | string | object, i: number) => {
                    menu.text(
                        `${displayDataFn?.(element, 0)}`,
                        (ctx: ContextSessionMenu) => {
                            buttonFn(ctx, staticData[currentUserPage][i]);
                        },
                    ).row();
                },
            );
        }

        /** Try to load a configuration object from a JSON file named "config." If it fails, use the 'schema' as a fallback. */
        const config: Config = (await loadJsonIfExist("config")) as Config ||
            (await loadSchema(schema)) as Config;
        /** Get the pagination display strategy based on 'currentUserPage' and 'maxPage'. */
        const strategy = getDisplayStrategy(currentUserPage, maxPage);

        displayPagination(
            config.template as string[],
            strategy,
            {
                maxPage,
                config,
                session,
                currentUserPage,
                menu,
                staticData,
                displayType,
                allowBackToMenu,
                displayDataFn,
            },
        );
    }
}

const MAX_PAGES = 5;
// deno-lint-ignore no-explicit-any
const memoizedData = new Map<number, any>();

/**
 * Memoize data for pagination and retrieve it when available.
 *
 * @param page - The page number for which data should be memoized.
 * @param session - The session information.
 * @param fn - The function to fetch dynamic data for pagination.
 * @returns A promise that resolves to the memoized data for the specified page.
 */
async function memoizeData(
    page: number,
    session: Session,
    fn: PaginationOptions["dynamicDataFn"],
): Promise<any> {
    if (memoizedData.has(page)) {
        return memoizedData.get(page);
    } else {
        if (memoizedData.size >= MAX_PAGES) {
            const firstKey = memoizedData.keys().next().value;
            memoizedData.delete(firstKey);
        }

        const res = await fn?.(
            session.currentUserPage || 0,
        );

        memoizedData.set(page, res);
        return res;
    }
}

async function handleDynamicData(
    session: Session,
    maxPage: number,
    options: Partial<PaginationOptions>,
    menu: MenuRange<ContextSessionMenu>,
    schema: Schema,
) {
    const {
        displayType,
        dynamicData,
        allowBackToMenu,
        displayDataFn,
        dynamicDataFn,
    } = options;
    if (dynamicData) {
        /** Assign 'currentUserPage' to 0 if it's not already set in the 'session'. */
        session.currentUserPage ??= 0;

        const { currentUserPage } = session;
        /** Try to load a configuration object from a JSON file named "config." If it fails, use the 'schema' as a fallback. */
        const config: Config = (await loadJsonIfExist("config")) as Config ||
            (await loadSchema(schema)) as Config;
        /** Get the pagination display strategy based on 'currentUserPage' and 'maxPage'. */
        const strategy = getDisplayStrategy(currentUserPage, maxPage);

        displayPagination(
            config?.template as string[],
            strategy,
            {
                maxPage,
                config,
                session,
                currentUserPage,
                menu,
                dynamicData,
                displayType,
                allowBackToMenu,
                displayDataFn,
                dynamicDataFn,
            },
        );
    }
}

/**
 * Determines the display strategy based on the given page and maxPage values.
 * @param {number} page - The current page number.
 * @param {number} maxPage - The maximum page number.
 * @returns {string} - The display strategy. Possible values are:
 * - "onlyDisplayNumber": Indicates that only the number should be displayed.
 * - "removeBackButtons": Indicates that the back buttons should be removed.
 * - "removeNextButtons": Indicates that the next buttons should be removed.
 * - "displayAll": Indicates that all elements should be displayed.
 */
function getDisplayStrategy(page: number, maxPage: number): string {
    if (maxPage <= 1) {
        return "onlyDisplayNumber";
    }
    if (page === 0) {
        return "removeBackButtons";
    }
    if (page === (maxPage - 1)) {
        return "removeNextButtons";
    }
    if (page > 0 && page < maxPage) {
        return "displayAll";
    }
    return "displayAll";
}

function displayPagination(
    template: string[],
    strategy: string,
    handleItemParams: Partial<PaginationOptions> & params,
) {
    const {
        maxPage,
        config,
        session,
        currentUserPage,
        menu,
        dynamicData,
        staticData,
        displayType,
        allowBackToMenu,
        displayDataFn,
        dynamicDataFn,
    } = handleItemParams;

    const handleItemWithParams = (item: string) =>
        handleItem(item, maxPage, config, session, currentUserPage, {
            dynamicData,
            staticData,
            displayType,
            allowBackToMenu,
            displayDataFn,
            dynamicDataFn,
        }, menu);

    if (strategy === "displayAll") {
        return template.forEach((item: string) => handleItemWithParams(item));
    }

    if (strategy === "removeBackButtons") {
        return template.forEach((item: string) => {
            if ((item === "back") || (item === "maxBack")) {
                handleItemWithParams("blank");
            } else {
                handleItemWithParams(item);
            }
        });
    }

    if (strategy === "removeNextButtons") {
        return template.forEach((item: string) => {
            if ((item === "next") || (item === "maxNext")) {
                handleItemWithParams("blank");
            } else {
                handleItemWithParams(item);
            }
        });
    }
    if (strategy === "onlyDisplayNumber") {
        return template.forEach((item: string) => {
            if (
                ["displayedNumbers", "row", "backButton"].includes(item)
            ) {
                return handleItemWithParams(item);
            }
            return handleItemWithParams("blank");
        });
    }
}

function handleItem(
    item: string,
    maxPage: number,
    config: Config,
    session: Session,
    currentUserPage: number,
    options: PaginationOptions,
    menu: MenuRange<ContextSessionMenu>,
) {
    const {
        dynamicData,
        staticData,
        displayType,
        allowBackToMenu,
        displayDataFn,
        dynamicDataFn,
    } = options;

    if (staticData) {
        switch (item) {
            case "maxBack":
                return menu.text(
                    config.maxBack,
                    async (ctx: ContextSessionMenu) => {
                        await handlePageChange(
                            ctx,
                            staticData[0] as [],
                            0,
                            displayDataFn,
                            session,
                            maxPage,
                            -currentUserPage,
                            displayType,
                        );
                    },
                );
            case "back":
                return menu.text(
                    config.back,
                    async (ctx: ContextSessionMenu) => {
                        await handlePageChange(
                            ctx,
                            staticData[currentUserPage - 1] as [],
                            0,
                            displayDataFn,
                            session,
                            maxPage,
                            -1,
                            displayType,
                        );
                    },
                );
            case "displayedNumbers":
                return menu.text(
                    `${
                        config.displayedNumbers.replace(
                            "{page}",
                            currentUserPage + 1,
                        )
                            .replace(
                                "{maxPage}",
                                maxPage,
                            )
                    }`,
                );
            case "next":
                return menu.text(
                    config.next,
                    async (ctx: ContextSessionMenu) => {
                        await handlePageChange(
                            ctx,
                            staticData[currentUserPage + 1] as [],
                            0,
                            displayDataFn,
                            session,
                            maxPage,
                            1,
                            displayType,
                        );
                    },
                );
            case "maxNext":
                return menu.text(
                    config.maxNext,
                    async (ctx: ContextSessionMenu) => {
                        await handlePageChange(
                            ctx,
                            staticData[
                                currentUserPage +
                                (maxPage - currentUserPage - 1)
                            ] as [],
                            0,
                            displayDataFn,
                            session,
                            maxPage,
                            maxPage - currentUserPage,
                            displayType,
                        );
                    },
                );
            case "backButton":
                return allowBackToMenu ? menu.text(config.backButton) : null;
            case "row":
                return menu.row();
            case "blank":
                return menu.text("­");
        }
    }

    if (dynamicData) {
        switch (item) {
            case "maxBack":
                return menu.text(
                    config.maxBack,
                    async (ctx: ContextSessionMenu) => {
                        handlePage(session.currentUserPage as number, maxPage)(
                            ctx,
                            -currentUserPage,
                        );

                        const actualData = await memoizeData(
                            session.currentUserPage as number,
                            session,
                            dynamicDataFn,
                        );

                        await handleDisplayTextDataFn(
                            ctx,
                            actualData.data,
                            0,
                            displayDataFn,
                            displayType,
                        );
                    },
                );
            case "back":
                return menu.text(
                    config.back,
                    async (ctx: ContextSessionMenu) => {
                        handlePage(session.currentUserPage as number, maxPage)(
                            ctx,
                            -1,
                        );

                        const actualData = await memoizeData(
                            session.currentUserPage as number,
                            session,
                            dynamicDataFn,
                        );

                        await handleDisplayTextDataFn(
                            ctx,
                            actualData.data,
                            0,
                            displayDataFn,
                            displayType,
                        );
                    },
                );
            case "displayedNumbers":
                return menu.text(
                    `${
                        config.displayedNumbers.replace(
                            "{page}",
                            currentUserPage + 1,
                        )
                            .replace(
                                "{maxPage}",
                                maxPage,
                            )
                    }`,
                );
            case "next":
                return menu.text(
                    config.next,
                    async (ctx: ContextSessionMenu) => {
                        handlePage(session.currentUserPage as number, maxPage)(
                            ctx,
                            1,
                        );

                        const actualData = await memoizeData(
                            session.currentUserPage as number,
                            session,
                            dynamicDataFn,
                        );

                        await handleDisplayTextDataFn(
                            ctx,
                            actualData.data,
                            0,
                            displayDataFn,
                            displayType,
                        );
                    },
                );
            case "maxNext":
                return menu.text(
                    config.maxNext,
                    async (ctx: ContextSessionMenu) => {
                        handlePage(session.currentUserPage as number, maxPage)(
                            ctx,
                            maxPage - currentUserPage,
                        );

                        const actualData = await memoizeData(
                            session.currentUserPage as number,
                            session,
                            dynamicDataFn,
                        );

                        await handleDisplayTextDataFn(
                            ctx,
                            actualData.data,
                            0,
                            displayDataFn,
                            displayType,
                        );
                    },
                );
            case "backButton":
                return allowBackToMenu ? menu.text(config.backButton) : null;
            case "row":
                return menu.row();
            case "blank":
                return menu.text("­");
        }
    }
}

/**
 * Handles a page change by displaying text data and updating the current page.
 * @param {ContextSessionMenu} ctx - The context object.
 * @param {NestedArrayOrObject} data - The data to be displayed.
 * @param {number} index - The index of the data.
 * @param {PaginationOptions["displayDataFn"]} displayDataFn - The function to retrieve the display data for each element.
 * @param {Record<string, any>} session - The session object.
 * @param {number} maxPage - The maximum page number.
 * @param {number} change - The change in the current page.
 * @param {PaginationOptions["displayType"]} displayType - The type of display.
 * @returns {Promise<void>} - A promise that resolves when the page change is handled.
 */
async function handlePageChange(
    ctx: ContextSessionMenu,
    data: NestedArrayOrObject,
    index: number,
    displayDataFn: PaginationOptions["displayDataFn"],
    // deno-lint-ignore no-explicit-any
    session: Record<string, any>,
    maxPage: number,
    change: number,
    displayType: PaginationOptions["displayType"],
): Promise<void> {
    await handleDisplayTextDataFn(ctx, data, index, displayDataFn, displayType);
    handlePage(session.currentUserPage, maxPage)(ctx, change);
}

/**
 * Handles displaying text data only when displayType === "text".
 * It concatenates the result of the displayDataFn for each element in the data array.
 * Then it edits the message text using the concatenated result.
 * @param {ContextSessionMenu} ctx - The context object.
 * @param {NestedArrayOrObject} data - The data to be displayed.
 * @param {number} index - The index of the data.
 * @param {PaginationOptions["displayDataFn"]} displayDataFn - The function to retrieve the display data for each element.
 * @param {PaginationOptions["displayType"]} displayType - The type of display.
 * @returns {Promise<void>} - A promise that resolves when the message text is edited.
 */
async function handleDisplayTextDataFn(
    ctx: ContextSessionMenu,
    data: NestedArrayOrObject,
    index: number,
    displayDataFn: PaginationOptions["displayDataFn"],
    displayType: PaginationOptions["displayType"],
): Promise<void> {
    if (displayType === "text") {
        const textToEdit = data.reduce(
            (acc: string, e: DynamicObject) =>
                acc + (displayDataFn?.(e, index) || ""),
            "",
        );

        await ctx.editMessageText(textToEdit);
    }
}

/**
 * Handles the page based on the current page and maximum page.
 * @param {number} currentPage - The current page number.
 * @param {number} maxPage - The maximum page number.
 * @returns {ReturnType<typeof createPaginationHandler>} - The result of the createPaginationHandler function.
 */
function handlePage(
    currentPage: number,
    maxPage: number,
): ReturnType<typeof createPaginationHandler> {
    return createPaginationHandler(currentPage, maxPage);
}

/**
 * Creates a pagination handler function.
 *
 * @param {number} currentPage - The current page number.
 * @param {number} maxPage - The maximum page number.
 * @returns {(ctx: ContextSessionMenu, pageToSet: number) => void} - The pagination handler function.
 *
 * @description
 * This function creates a pagination handler function that updates the current user's page in the session and triggers a menu update.
 * The pagination handler function takes a ContextSessionMenu object and a pageToSet number as parameters.
 * It calculates the new page based on the current page and the pageToSet value, ensuring it stays within the valid range.
 * The new page is then assigned to the currentUserPage property in the session object.
 * Finally, the menu is updated to reflect the new page.
 */
function createPaginationHandler(
    currentPage: number,
    maxPage: number,
): (ctx: ContextSessionMenu, pageToSet: number) => void {
    return (ctx: ContextSessionMenu, pageToSet: number) => {
        const page = currentPage || 0;
        const newPage = Math.min(Math.max(0, page + pageToSet), maxPage - 1);
        ctx.session.currentUserPage = newPage;
        ctx.menu.update();
    };
}
