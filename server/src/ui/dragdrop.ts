/**
 * Drag and Drop UI Component
 */

// Don't redeclare App or Blockly interfaces here - they're already declared in index.ts

export const DragDropUI = {
  init(): void {
    this.registerPaletteBlocks();
    this.setupDropTarget();
  },

  registerPaletteBlocks(): void {
    const palette = document.getElementById('blockPalette');
    if (!palette) return;

    const categories = [
      {
        title: '📊 Market',
        blocks: [{ type: 'market_settings', label: '🏦 Market Settings', class: 'bi-market' }]
      },
      {
        title: '⚙️ Execution',
        blocks: [{ type: 'execution_settings', label: '🎯 Execution Settings', class: 'bi-execution' }]
      },
      {
        title: '🔀 Conditions',
        blocks: [
          { type: 'condition_purchase', label: '📈 Purchase Condition', class: 'bi-condition' },
          { type: 'condition_sell', label: '📉 Sell Condition', class: 'bi-condition' }
        ]
      },
      {
        title: '🔄 Restart',
        blocks: [
          { type: 'restart_on_win', label: '🏆 Restart on Win', class: 'bi-restart' },
          { type: 'restart_on_loss', label: '💔 Restart on Loss', class: 'bi-restart' }
        ]
      },
      {
        title: '🧰 Utility',
        blocks: [{ type: 'set_variable', label: '📝 Set Variable', class: 'bi-utility' }]
      }
    ];

    palette.innerHTML = categories.map(cat => `
      <div class="block-category">
        <div class="block-category-title">${cat.title}</div>
        ${cat.blocks.map(block => `
          <div class="block-item ${block.class}" 
               draggable="true" 
               data-type="${block.type}" 
               ondragstart="window.DragDropUI.onDragStart(event)">
            ${block.label}
          </div>
        `).join('')}
      </div>
    `).join('');
  },

  setupDropTarget(): void {
    const wrapper = document.getElementById('workspaceWrapper');
    if (wrapper) {
      wrapper.addEventListener('dragover', (e) => e.preventDefault());
      wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        this.onDrop(e);
      });
    }
  },

  onDragStart(e: DragEvent): void {
    const target = e.currentTarget as HTMLElement;
    const blockType = target.dataset.type;
    if (blockType) {
      e.dataTransfer?.setData('text/plain', blockType);
      e.dataTransfer!.effectAllowed = 'copy';
    }
  },

  onDrop(e: DragEvent): void {
    const blockType = e.dataTransfer?.getData('text/plain');
    if (!blockType) return;

    const wrapper = document.getElementById('workspaceWrapper');
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left - 100;
    const y = e.clientY - rect.top - 50;

    // Call App.addBlock if available
    if (window.App && typeof (window.App as any).addBlock === 'function') {
      (window.App as any).addBlock(blockType, x, y);
    } else {
      console.warn('App.addBlock not available');
    }
    e.dataTransfer?.clearData();
  }
};

// Just extend window interface without redeclaring App or Blockly
declare global {
  interface Window {
    DragDropUI: typeof DragDropUI;
  }
}

window.DragDropUI = DragDropUI;