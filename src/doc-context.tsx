/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-10 14:55:35
 * @FilePath     : /src/doc-context.tsx
 * @LastEditTime : 2024-12-15 12:25:45
 * @Description  : 
 */
import { createSignal, For, JSXElement, onMount, Show } from 'solid-js';
import { render } from 'solid-js/web';
import { type Plugin, type Dialog, openTab, confirm } from "siyuan";

import { simpleDialog } from "@/libs/dialog";
import { getBlockByID, createDocWithMd, request } from "@/api";
import { getActiveDoc, getNotebook, getParentDocument, isMobile, listChildDocs } from "@/utils";

import type DocContextPlugin from './index';


let I18n: any = {
    name: '文档上下文',
    focus: '跳转聚焦到文档',
    parent: '上级文档',
    children: '子文档',
    siblings: '同级文档',
    no: '无',
    NewDoc: '新建文档'
}


const createContext = async () => {
    let docId = getActiveDoc();
    if (!docId) {
        return null;
    }
    let doc = await getBlockByID(docId);
    let parent = await getParentDocument(doc.path);
    let childrenPromise = listChildDocs(doc);
    parent = parent ?? {
        box: doc.box,
        path: '/',
        hpath: ''
    } as Block;
    let siblingsPromise = listChildDocs(parent);
    let _ = await Promise.all([childrenPromise, siblingsPromise]);
    let children = _[0];
    let siblings = _[1];

    let hpaths = doc.hpath.slice(1).split('/');
    let paths = doc.path.slice(1).split('/');
    //将 hpaths 和 paths 做 zip 操作
    let docPaths = hpaths.map((title, index) => {
        return {
            title: title,
            id: paths[index],
        }
    });

    return { doc, parent, children, siblings, docPaths };
}


const A = (props: { id: string, hightlight?: boolean, children: any, dialog: Dialog, actions?: any }) => {

    const open = () => {
        openTab({
            app: plugin_?.app,
            doc: {
                id: props.id,
                action: props.actions
            }
        });
        props.dialog.destroy();
        const ele = document.querySelector(`div[data-node-id="${props.id}"]`);
        if (ele) {
            ele.scrollIntoView();
        }
    }

    return (
        <>
            <span class="anchor" data-id={props.id} onClick={open} style={{
                outline: props?.hightlight ? 'solid var(--b3-theme-primary-light)' : 0,
                'font-weight': props?.hightlight ? 'bold' : 'inherit',
            }}>
                {props.children}
            </span>
        </>
    )
}

const OutlineComponent = (props: { docId: string, dialog: Dialog }) => {
    const [outline, setOutline] = createSignal([]);

    // 转换数据结构，保留层级关系
    const iterate = (data) => {
        return data.map(item => ({
            depth: item.depth,
            name: item.name || item.content,
            id: item.id,
            children: item.count > 0 ? iterate(item.blocks ?? item.children) : []
        }));
    }

    // 递归渲染组件
    const RenderItem = (propsRi: { items: any[] }) => {
        return (
            <ul>
                <For each={propsRi.items}>
                    {(item) => (
                        <li>
                            <A id={item.id} dialog={props.dialog}>
                                <span innerHTML={item.name} />
                            </A>
                            <Show when={item.children.length > 0}>
                                <RenderItem items={item.children} />
                            </Show>
                        </li>
                    )}
                </For>
            </ul>
        );
    }

    onMount(async () => {
        let ans = await request('/api/outline/getDocOutline', {
            id: props.docId
        });
        setOutline(iterate(ans));
    });

    return (
        <Show when={outline().length > 0} fallback={<p>{I18n.no}</p>}>
            <div class="outline-container">
                <RenderItem items={outline()} />
            </div>
        </Show>
    );
}


const DocContextComponent = (props: {
    doc: Block, parent: Block, children: Block[], siblings: Block[], docPaths: any[], dialog: Dialog
}) => {
    const { doc, parent, children, siblings, docPaths } = props;

    const focus = () => {
        let dock = document.querySelector(`.dock__items>span[data-type="file"]`) as HTMLElement;
        let ele = document.querySelector('div.file-tree span[data-type="focus"]') as HTMLElement;
        if (!dock && !ele) return;
        if (dock && !dock.classList.contains('dock__item--active')) {
            dock.click();
        }
        if (ele) {
            ele.click();
        }
        props.dialog.destroy();
    }

    const newDoc = (hpath: string) => {
        confirm('Confirm?', `${I18n.NewDoc}: ${hpath}`, async () => {
            let docId = await createDocWithMd(doc.box, hpath, '');
            openTab({
                app: plugin_?.app,
                doc: {
                    id: docId
                }
            });
            props.dialog.destroy();
        });
    }

    const newChild = () => {
        let newPath = `${doc.hpath}/Untitled`;
        console.log(newPath);
        newDoc(newPath);
    }

    const newSibling = () => {
        let newPath = `${parent.hpath}/Untitled`;
        console.log(newPath);
        newDoc(newPath);
    }

    const HR = () => (
        <hr
            style={{
                margin: '5px 0'
            }}
        />
    );

    const DocList = (p: { docs: Block[] }) => (
        <Show when={p.docs.length > 0} fallback={<p>{I18n.no}</p>}>
            <ol data-is-mobile={isMobile} style={{
                '--column': p.docs.length >= 3? '3' : '2',
            }}>
                <For each={p.docs}>
                    {(item) => {
                        let hightlight = item.id === doc.id;
                        return (
                            <li>
                                <A hightlight={hightlight} id={item.id} dialog={props.dialog}>
                                    {item.name.replace('.sy', '')}
                                </A>
                            </li>
                        );
                    }}
                </For>
            </ol>
        </Show>
    );

    const NewDocBtn = (props: { children: JSXElement, onClick: () => void }) => (
        <div
            style={{
                "text-align": "right", "font-size": "15px",
                display: 'flex', flex: 1,
            }}
        >
            <button
                class="b3-button"
                onclick={props.onClick}
                style={{
                    "margin-left": '10px',
                    'line-height': '17px'
                }}
            >
                {props.children}
            </button>
        </div>
    );

    return (
        <section class="doc-context item__readme b3-typography fn__flex-1" style="margin: 1em;">
            <p>🍞
                [{getNotebook(doc.box).name}]
                {docPaths.map((d) => {
                    return (<> / <A id={d.id.replace('.sy', '')} dialog={props.dialog}>{d.title}</A></>);
                })}
            </p>
            <p class="btn-focus" onClick={focus} style={{
                'display': isMobile ? 'none' : ''
            }}>
                🎯 {I18n.focus}
            </p>

            <HR />

            <div style={{ display: 'flex', 'align-items': 'center' }}>
                <h5 style={{ flex: 2 }}>⬆️ {I18n.parent}</h5>
                <div style={{ flex: 1, 'margin-left': '10px' }}>
                    <Show when={parent} fallback={<p>{I18n.no}</p>}>
                        <p><A id={parent.id} dialog={props.dialog}>{parent.content}</A></p>
                    </Show>
                </div>
            </div>

            <HR />

            <div style={{ display: 'flex', 'align-items': 'center' }}>
                <h5 style={{ flex: 2 }}>↔️ {I18n.siblings}</h5>
                <NewDocBtn onClick={newSibling}>📬 {I18n.NewDoc}</NewDocBtn>
            </div>
            <DocList docs={siblings} />

            <HR />

            <div style={{ display: 'flex', 'align-items': 'center' }}>
                <h5 style={{ flex: 2 }}>⬇️ {I18n.children}</h5>
                <NewDocBtn onClick={newChild}>📬 {I18n.NewDoc}</NewDocBtn>
            </div>
            <DocList docs={children} />

            <div style={{ display: 'flex', 'align-items': 'center' }}>
                <h5>📇 {I18n.Outline}</h5>
            </div>
            <OutlineComponent docId={doc.id} dialog={props.dialog} />

        </section>
    );
};


let plugin_: Plugin;
// const keymapTag = window.siyuan.config.keymap.general.tag;
const Keymap = '⌥S';

export let name = "DocContext";
export let enabled = false;
export const load = (plugin: DocContextPlugin) => {
    if (enabled) return;
    enabled = true;
    plugin_ = plugin;
    I18n = plugin.i18n;
    plugin.addCommandV2({
        langKey: 'DocContext',
        langText: `${I18n.name}`,
        hotkey: Keymap,
        callback: async () => {
            if (document.querySelector('.doc-context')) return;
            let context = await createContext();
            if (!context) {
                return;
            }

            let element = document.createElement('div');
            element.style.display = 'contents';
            let dialog = simpleDialog({
                title: I18n.name,
                ele: element,
                width: "900px",
            });
            render(() => DocContextComponent({ ...context, dialog }), element);
            let container = dialog.element.querySelector('.b3-dialog__container') as HTMLElement;
            container.style.setProperty('max-width', '80%');
            container.style.setProperty('min-width', '40%');
            container.style.setProperty('max-height', '75%');
        }
    });
}
