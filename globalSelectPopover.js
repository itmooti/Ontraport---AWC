function loadToolbar() {
(function () {
    const popoverForSelect = document.createElement('div');
    popoverForSelect.id = 'popoverForSelect';
    popoverForSelect.className = 'fixed z-[9999] hidden gap-2 bg-cyan-700 text-white px-3 py-2 text-sm rounded flex';
   popoverForSelect.style.display = 'none';

    const baseButtons = [
        { action: 'bold', icon: '𝐁', classes: 'font-bold' },
        { action: 'italic', icon: '𝐼', classes: 'italic' },
        { action: 'underline', icon: 'U̲', classes: 'underline' }
    ];

    const linkButton = { action: 'link', icon: '🔗' };
    const unlinkButton = { action: 'unlink', icon: '🔗🚫' };

    let activeEditable = null;
    let savedSelection = null;
    let currentIsLink = false;
    let toolbars = new Map();

    function getTooltipLabel(action) {
        switch (action) {
            case 'bold': return 'Bold';
            case 'italic': return 'Italic';
            case 'underline': return 'Underline';
            case 'link': return 'Add Link';
            case 'unlink': return 'Remove Link';
            default: return '';
        }
    }

    function renderPopover() {
        popoverForSelect.innerHTML = '';
        [...baseButtons, currentIsLink ? unlinkButton : linkButton].forEach(({ action, icon, classes = '' }) => {
            const btn = document.createElement('button');
            btn.innerHTML = icon;
            btn.className = `bg-cyan-900 hover:bg-cyan-800 px-2 py-1 rounded ${classes}`;
            btn.title = getTooltipLabel(action);
            btn.onclick = () => actionHandler(action);
            popoverForSelect.appendChild(btn);
        });
    }

    function renderToolbar(toolbarEl) {
        toolbarEl.innerHTML = '';
        [...baseButtons, currentIsLink ? unlinkButton : linkButton].forEach(({ action, icon, classes = '' }) => {
            const btn = document.createElement('button');
            btn.innerHTML = icon;
            btn.className = 'px-2 py-1 rounded hover:bg-gray-200';
            btn.title = getTooltipLabel(action);
            btn.onclick = () => actionHandler(action);
            toolbarEl.appendChild(btn);
        });
    }

    document.body.appendChild(popoverForSelect);

    function saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            savedSelection = sel.getRangeAt(0);
            let container = sel.anchorNode;
            if (container.nodeType !== 1) container = container.parentElement;
            currentIsLink = container.closest('a') ? true : false;
        }
    }

    function restoreSelection() {
        if (savedSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
        }
    }

    function hidePopover() {
        popoverForSelect.classList.add('hidden');
        popoverForSelect.style.visibility = 'hidden';
        activeEditable = null;
    }

    async function actionHandler(action) {
        if (!activeEditable) return;
        restoreSelection();

        if (['bold', 'italic', 'underline'].includes(action)) {
            document.execCommand(action);
        }

        if (action === 'link') {
            const url = prompt('Enter URL:');
            if (url) {
                const selectedText = window.getSelection().toString();
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.textContent = selectedText;
                anchor.style.color = '#007C8F';
                anchor.style.textDecoration = 'underline';

                const range = window.getSelection().getRangeAt(0);
                range.deleteContents();
                range.insertNode(anchor);
            }
        }

        if (action === 'unlink') {
            document.execCommand('unlink');
        }

        setTimeout(() => {
            saveSelection();
            renderPopover();
            if (activeEditable && toolbars.has(activeEditable)) {
                renderToolbar(toolbars.get(activeEditable));
            }
            hidePopover();
            window.getSelection().removeAllRanges();
        }, 0);
    }

    function initializeMentionable(editableArea) {
        if (toolbars.has(editableArea)) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'flex flex-wrap items-center gap-2 bg-white border border-gray-300 rounded p-2 shadow';

        toolbars.set(editableArea, toolbar);
        renderToolbar(toolbar);

        let containerForToolbar = null;
        let node = editableArea;
        while (node) {
            if (node.previousElementSibling && node.previousElementSibling.classList.contains('containerForToolbar')) {
                containerForToolbar = node.previousElementSibling;
                break;
            }
            node = node.parentElement;
        }

        if (containerForToolbar) {
            containerForToolbar.appendChild(toolbar);
        } else {
            console.warn('No containerForToolbar found for mentionable!');
        }

        editableArea.addEventListener('keyup', saveSelection);
        editableArea.addEventListener('mouseup', saveSelection);
    }

    const mentionables = document.querySelectorAll('.mentionable');
    mentionables.forEach((editableArea) => initializeMentionable(editableArea));

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.classList.contains('mentionable')) {
                        initializeMentionable(node);
                    }
                    node.querySelectorAll?.('.mentionable')?.forEach(inner => initializeMentionable(inner));
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('mouseup', () => {
        setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            if (selectedText.length > 0 && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let container = range.commonAncestorContainer;
                if (container.nodeType !== 1) container = container.parentElement;

                const mentionable = container.closest('.mentionable');
                if (!mentionable) return hidePopover();

                saveSelection();
                renderPopover();
                renderToolbar(toolbars.get(mentionable));

                const rect = range.getBoundingClientRect();
                popoverForSelect.style.position = 'fixed';
                popoverForSelect.style.visibility = 'hidden';
                popoverForSelect.classList.remove('hidden');
                popoverForSelect.style.display = 'none';

                const left = rect.left + (rect.width / 2) - (popoverForSelect.offsetWidth / 2);
                const top = rect.bottom + 8;

                popoverForSelect.style.left = `${left}px`;
                popoverForSelect.style.top = `${top}px`;
                popoverForSelect.style.visibility = 'visible';

                activeEditable = mentionable;
            } else {
                hidePopover();
            }
        }, 0);
    });

    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
            hidePopover();
        }
    });

    document.addEventListener('click', (e) => {
        if (!popoverForSelect.contains(e.target) && !e.target.closest('.mentionable')) {
            hidePopover();
        }
    });

})();
}

document.addEventListener('DOMContentLoaded', function() {
    loadToolbar();
});

