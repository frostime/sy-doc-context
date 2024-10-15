/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-10 14:57:19
 * @FilePath     : /src/utils.ts
 * @LastEditTime : 2024-10-15 21:42:11
 * @Description  : 
 */
import { getFrontend } from "siyuan";
import { getBlockByID, listDocsByPath } from "./api";

const frontend = getFrontend();
export const isMobile = frontend === 'mobile';

export const getNotebook = (boxId: string): Notebook => {
    let notebooks: Notebook[] = window.siyuan.notebooks;
    for (let notebook of notebooks) {
        if (notebook.id === boxId) {
            return notebook;
        }
    }
}


const getActiveDocOnDesktop = () => {
    let tab = document.querySelector("div.layout__wnd--active ul.layout-tab-bar>li.item--focus");
    let dataId: string = tab?.getAttribute("data-id");
    if (!dataId) {
        return null;
    }
    const activeTab: HTMLDivElement = document.querySelector(
        `.layout-tab-container.fn__flex-1>div.protyle[data-id="${dataId}"]`
    ) as HTMLDivElement;
    if (!activeTab) {
        return;
    }
    const eleTitle = activeTab.querySelector(".protyle-title");
    let docId = eleTitle?.getAttribute("data-node-id");
    return docId;
}

const getActiveDocOnMobile = () => {
    const editor = document.querySelector("#editor");
    if (!editor) {
        return;
    }
    const eleTitle = editor.querySelector(".protyle-content .protyle-title");
    let docId = eleTitle?.getAttribute("data-node-id");
    return docId;
}

export function getActiveDoc() {
    const frontend = getFrontend();
    if (frontend === 'mobile') {
        return getActiveDocOnMobile();
    } else {
        return getActiveDocOnDesktop();
    }
}

export const html2ele = (html: string): DocumentFragment => {
    let template = document.createElement('template');
    template.innerHTML = html.trim();
    let ele = document.importNode(template.content, true);
    return ele;
}

export const getParentDocument = async (path: string) => {
    let pathArr = path.split("/").filter((item) => item != "");
    pathArr.pop();
    if (pathArr.length == 0) {
        return null;
    } else {
        let id = pathArr[pathArr.length - 1];
        return getBlockByID(id);
    }
}

export const listChildDocs = async (doc: any) => {
    let data = await listDocsByPath(doc.box, doc.path);
    // console.log(data);
    return data?.files;
}

export const getSibling = async (path: string, box: string) => {
    path = path.replace('.sy', '');
    const parts = path.split('/');

    if (parts.length > 0) {
        parts.pop();
    }

    let parentPath = parts.join('/');
    parentPath = parentPath || '/';

    let siblings = await listChildDocs({ path: parentPath, box });
    return siblings;
}