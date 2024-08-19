## Document Context Plugin

This plugin provides the functionality to quickly display the contextual information of a document within the document tree. Users can trigger this plugin by using the shortcut Alt+S.

![](preview.png)

- Display Document Path: Shows the path of the current document within the document tree.
- Focus Navigation: Provides a quick way to navigate to the location of the document within the document tree.
- Display Parent Document: Shows the parent document of the current document.
- Display Child Documents: Lists the child documents of the current document.
- Display Sibling Documents: Lists other documents at the same level as the current document.

### Shortcut Navigation

> Disabled by default; enable it in settings

- **Parent-Child Document Shortcuts**: Use `Ctrl+↑` to jump to the parent document and `Ctrl+↓` to jump to the child document (overrides the default SiYuan Expand/Collapse shortcuts).
- **Sibling Document Shortcuts**: Use `Ctrl+←` to jump to the previous document and `Ctrl+→` to jump to the next document.
- **Speed Control**: When enabled, automatically closes the previously opened document if the interval between document switches is too short, preventing the opening of too many documents during rapid shortcut usage.
