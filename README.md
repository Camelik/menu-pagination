# Pagination Addon for Menu Plugin

---

This plugin extends the capabilities of the [menu plugin](https://github.com/grammyjs/menu) by adding pagination support.

It provides functions to create paginated menus, handle page changes, and display data in various formats.

---

## Main Function createPagination(menuRange, ...options)

Function createPagination is main core of pagination on menu. There we are define how all have to work.

| ...options      | type                  | description                                                                         | default   |
| --------------- | --------------------- | ----------------------------------------------------------------------------------- | --------- |
| allowBackToMenu | boolean               | Determines whether the user can go back to an previous menu                         | true      |
| displayType     | string                | Determines how the data is to be displayed, ("text" or "buttons")                   | "text"    |
| schema          | string                | Schema how pagination is to be displayed                                            | "default" |
| staticData      | NestedObject          | Static data on which pagination is to work                                          | undefined |
| dynamicDataFn   | function(page)        | Function from which the data are taken on which pagination is to work               | undefined |
| displayDataFn   | function(data, index) | Function by which we define how the data are to be displayed                        | undefined |
| buttonFn        | function(ctx, data)   | Function to be executed when the button is pressed (only for displayType "buttons") | undefined |

## Usage

Static data

```js
import { Bot, session } from "@grammyjs";
import { Menu } from "@grammyjs/menu";
import {
    createPagination,
    parseArrayIntoObject,
} from "@grammyjs/menu-pagination";

const bot = new Bot("");

bot.use(session({
    initial() {
        return {};
    },
}));

const someMenu = new Menu();

const myData = [{ name: "a", dsc: "b" }, { name: "c", dsc: "d" }, {
    name: "e",
    dsc: "f",
}];

const elementsPerPage = 2;

const parsedData = parseArrayIntoObject(myData, elementsPerPage);

someMenu.dynamic((ctx, range) => {
    createPagination(someMenu, ctx, {
        allowBackToMenu: false,
        staticData: parsedData,
        displayDataFn: (data, index) => {
            return `${data.name}, ${data.dsc}`;
        },
        displayType: "buttons",
    });
});

bot.command(
    "pagination",
    (ctx) =>
        ctx.reply("Check this crazy pagination!", { reply_markup: someMenu }),
);

bot.start();
```

You can find more examples and documentation on [the plugin page on the website](https://grammy.dev/plugins/menu-pagination).

---

## Todos 🧰

- [ ] Add a middleware that extends ctx with ctx.replyWithPagination, so that you can display the first page of pagination without developer integration ( only for displayType "text")
- [ ] Add more advanced(optimized) logic for memoization dynamicData
- [ ] Add "numbers" schema
