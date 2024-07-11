/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-10 14:49:54
 * @FilePath     : /src/libs/dialog.ts
 * @LastEditTime : 2024-07-11 15:04:33
 * @Description  : 
 */
import { Dialog } from "siyuan";

export const simpleDialog = (args: {
    title: string, ele: HTMLElement | DocumentFragment,
    width?: string, height?: string
}) => {
    const dialog = new Dialog({
        title: args.title,
        content: `<div class="fn__flex-1 fn__flex dialog-content"/>`,
        width: args.width,
        height: args.height
    });
    dialog.element.querySelector(".dialog-content").appendChild(args.ele);
    return dialog;
}
