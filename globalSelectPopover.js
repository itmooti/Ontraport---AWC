    (function () {
        const popoverForSelect = document.createElement('div');
        popoverForSelect.id = 'popoverForSelect';
        popoverForSelect.className = 'fixed z-[9999] hidden flex gap-2 bg-cyan-700 text-white px-3 py-2 text-sm rounded shadow-lg';

        const buttons = [
            { action: 'copy', icon: '📋' },
            { action: 'paste', icon: '📥' },
            { action: 'bold', icon: '𝐁', classes: 'font-bold' },
            { action: 'italic', icon: '𝐼', classes: 'italic' },
            { action: 'underline', icon: 'U̲', classes: 'underline' }
        ];

        buttons.forEach(({ action, icon, classes = '' }) => {
            const btn = document.createElement('button');
            btn.innerHTML = icon;
            btn.className = `bg-cyan-900 hover:bg-cyan-800 px-2 py-1 rounded ${classes}`;
            btn.onclick = () => actionHandler(action);
            popoverForSelect.appendChild(btn);
        });

        document.body.appendChild(popoverForSelect);
        let activeEditable = null;

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

                    const rect = range.getBoundingClientRect();

                    popoverForSelect.style.position = 'fixed';
                    popoverForSelect.style.visibility = 'hidden';
                    popoverForSelect.classList.remove('hidden');
                    popoverForSelect.style.display = 'flex';

                    const popoverRect = popoverForSelect.getBoundingClientRect();
                    const left = rect.left + (rect.width / 2) - (popoverRect.width / 2);
                    const top = rect.top - popoverRect.height - 8;

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
            if (
                !popoverForSelect.contains(e.target) &&
                !e.target.closest('.mentionable')
            ) {
                hidePopover();
            }
        });

        function hidePopover() {
            popoverForSelect.classList.add('hidden');
            popoverForSelect.style.visibility = 'hidden';
            activeEditable = null;
        }

        async function actionHandler(action) {
            if (!activeEditable) return;

            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const selectedText = selection.toString();

            if (action === 'copy') {
                await navigator.clipboard.writeText(selectedText);
            }

            if (action === 'paste') {
                const pasteText = await navigator.clipboard.readText();
                range.deleteContents();
                range.insertNode(document.createTextNode(pasteText));
            }

            if (['bold', 'italic', 'underline'].includes(action)) {
                const tag = action === 'bold' ? 'STRONG' : action === 'italic' ? 'EM' : 'U';
                const wrapper = action === 'bold' ? 'strong' : action === 'italic' ? 'em' : 'u';

                let ancestor = selection.anchorNode;
                if (ancestor.nodeType !== 1) ancestor = ancestor.parentElement;

                const formatTag = ancestor.closest(wrapper);

                if (formatTag) {
                    const parent = formatTag.parentNode;
                    while (formatTag.firstChild) parent.insertBefore(formatTag.firstChild, formatTag);
                    parent.removeChild(formatTag);
                } else {
                    const el = document.createElement(wrapper);
                    el.textContent = selectedText;
                    range.deleteContents();
                    range.insertNode(el);
                }
            }

            setTimeout(() => {
                hidePopover();
                selection.removeAllRanges();
            }, 0);
        }
    })();
