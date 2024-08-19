/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-10 14:49:54
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-08-19 14:54:21
 * @Description  : 
 */
import {
    Plugin,
    showMessage,
    openTab,
    App,
    ICommandOption,
} from "siyuan";
import "@/index.scss";
import { load, unload } from './doc-context';
import { getActiveDoc, getParentDocument, listChildDocs, getSibling } from "./utils";
import { getBlockByID } from "./api";
import { SettingUtils } from "./libs/setting-utils";


const useCommand = (plugin: DocContextPlugin) => {
    let app: App = plugin.app;
    let i18n = plugin.i18n;

    let lastTriggered: Date = new Date();
    let timeDuration = 1000;

    let doSpeedControl = true;

    const KeymapConfig = window.siyuan.config.keymap;
    const KeyCollapse = KeymapConfig.editor.general.collapse;
    const KeyExpand = KeymapConfig.editor.general.expand;

    const KeyCollapseDefault = KeyCollapse.custom || KeyCollapse.default;
    const KeyExpandDefault = KeyExpand.custom || KeyExpand.default;

    /**
     * 控制时间，如果 Action 间隔太短，就关掉中键的文档
     * @returns 
     */
    const speedControl = () => {
        let closeCurrentDoc = () => { };

        if (!doSpeedControl) return closeCurrentDoc;

        let now = new Date();

        if ((now.getTime() - lastTriggered.getTime()) <= timeDuration) {
            let tab = document.querySelector("div.layout__wnd--active ul.layout-tab-bar>li.item--focus");
            let closeEle = tab.querySelector('span.item__close') as HTMLSpanElement;
            closeCurrentDoc = () => closeEle.click();
        }
        lastTriggered = now;
        return closeCurrentDoc;
    }

    const goToSibling = async (delta: -1 | 1) => {
        let docId = getActiveDoc();
        if (!docId) return
        let doc = await getBlockByID(docId);
        let { path, box } = doc;

        let siblings: { id: string, path: string }[] = await getSibling(path, box);
        let index = siblings.findIndex(sibling => sibling.path === path);
        if ((delta < 0 && index == 0) || (delta > 0 && index == siblings.length - 1)) {
            showMessage(delta < 0 ? i18n.messages.jumpToLastDoc : i18n.messages.jumpToFirstDoc);
        }

        let postAction = speedControl();

        let newIndex = (index + delta + siblings.length) % siblings.length;
        openTab({
            app: app,
            doc: {
                id: siblings[newIndex].id
            }
        });
        postAction();
    }

    const goToParent = async () => {
        let docId = getActiveDoc();
        if (!docId) return
        let doc = await getBlockByID(docId);
        let parent = await getParentDocument(doc.path);
        if (!parent) {
            showMessage(i18n.messages.noParentDoc);
            return;
        }

        let postAction = speedControl();
        openTab({
            app: app,
            doc: {
                id: parent.id
            }
        });
        postAction();
    }

    const goToChild = async () => {
        let docId = getActiveDoc();
        if (!docId) return;

        let doc = await getBlockByID(docId);
        let children = await listChildDocs(doc);
        if (children.length === 0) {
            showMessage(i18n.messages.noChildDoc);
            return;
        }

        let postAction = speedControl();
        openTab({
            app: app,
            doc: {
                id: children[0].id
            }
        });
        postAction();
    }

    return {
        goToSibling,
        goToParent,
        goToChild,
        updateDuration: (duration: number) => {
            timeDuration = duration;
        },
        toggleSpeedControl: (enable: boolean) => {
            doSpeedControl = enable;
        },
        toggleParentChildCommand: (enable: boolean) => {
            if (enable) {
                plugin.addCommandV2({
                    langKey: 'fmisc::parent-doc',
                    langText: 'Parent Document',
                    hotkey: '⌘↑',
                    callback: async () => goToParent()
                });
                plugin.addCommandV2({
                    langKey: 'fmisc::child-doc',
                    langText: 'Child Document',
                    hotkey: '⌘↓',
                    callback: async () => goToChild()
                });
                KeyCollapse.custom = '';
                KeyExpand.custom = '';
            } else {
                plugin.delCommand('fmisc::parent-doc');
                plugin.delCommand('fmisc::child-doc');
                KeyCollapse.custom = KeyCollapseDefault;
                KeyExpand.custom = KeyExpandDefault;
            }
        },
        toggleSiblingCommand: (enable: boolean) => {
            if (enable) {
                plugin.addCommandV2({
                    langKey: 'fmisc::last-doc',
                    langText: 'Last Document',
                    hotkey: '⌘←',
                    callback: async () => goToSibling(-1)
                });
                plugin.addCommandV2({
                    langKey: 'fmisc::next-doc',
                    langText: 'Next Document',
                    hotkey: '⌘→',
                    callback: async () => goToSibling(1)
                });
            } else {
                plugin.delCommand('fmisc::last-doc');
                plugin.delCommand('fmisc::next-doc');
            }
        }
    }
}


export default class DocContextPlugin extends Plugin {

    commandHook: ReturnType<typeof useCommand>;
    utils: SettingUtils;

    async onload() {
        load(this);
        this.commandHook = useCommand(this);

        this.utils = new SettingUtils({
            plugin: this,
            name: 'doc-context',
            callback: (data) => {
                this.updateState(data);
            },
            height: '600px'
        });

        let i18n = this.i18n;

        this.utils.addItem({
            title: i18n.setting.parentChildCommand.title,
            description: i18n.setting.parentChildCommand.description,
            type: 'checkbox',
            key: 'parentChildCommand',
            value: false
        });
        this.utils.addItem({
            title: i18n.setting.siblingCommand.title,
            description: i18n.setting.siblingCommand.description,
            type: 'checkbox',
            key: 'siblingCommand',
            value: false
        });
        this.utils.addItem({
            title: i18n.setting.speedControl.title,
            description: i18n.setting.speedControl.description,
            type: 'checkbox',
            key: 'speedControl',
            value: false
        });
        this.utils.addItem({
            title: i18n.setting.duration.title,
            description: i18n.setting.duration.description,
            type: 'number',
            key: 'duration',
            value: 1000
        });

        await this.utils.load();
        let data = this.utils.dump();
        this.updateState(data);
    }

    private updateState(data) {
        this.commandHook.updateDuration(data.duration);
        this.commandHook.toggleSpeedControl(data.speedControl);
        this.commandHook.toggleParentChildCommand(data.parentChildCommand);
        this.commandHook.toggleSiblingCommand(data.siblingCommand);
    }

    onunload(): void {
        unload(this);
    }

    addCommandV2(options: ICommandOption): void {
        if (this.commands.find(command => command.langKey === options.langKey)) {
            return;
        }
        this.addCommand(options);
    }

    delCommand(id: string) {
        this.commands = this.commands.filter((command) => command.langKey !== id);
    }

}
