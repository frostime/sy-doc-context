import { Dialog } from "siyuan";

export const simpleDialog = (args: {
    title: string, ele: HTMLElement | DocumentFragment,
    width?: string, height?: string
}) => {
    const dialog = new Dialog({
        title: args.title,
        content: `<div class="fn__flex fn__flex dialog-content"/>`,
        width: args.width,
        height: args.height
    });
    dialog.element.querySelector(".dialog-content").appendChild(args.ele);
    return dialog;
}
