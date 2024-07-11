import {
    Plugin,
} from "siyuan";
import "@/index.scss";
import { load, unload } from './doc-context';


export default class DocContextPlugin extends Plugin {

    onload() {
        load(this);
    }

    onunload(): void {
        unload(this);
    }

}
