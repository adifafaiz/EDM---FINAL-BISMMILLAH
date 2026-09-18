<script>
  /** @type {{ class?: string, children: import('svelte').Snippet }} */
  let { class: className = '', children } = $props()
</script>

<div class="panel-glow {className}">
  <article class="panel liquidGlass-wrapper">
    <div class="liquidGlass-effect"></div>
    <div class="liquidGlass-tint"></div>
    <div class="liquidGlass-shine"></div>
    <div class="panel-card">
      {@render children()}
    </div>
  </article>
</div>

<style>
  .panel-glow {
    min-width: 0;
    min-height: 0;
    display: flex;
  }

  .panel {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 10px;
    border-radius: 28px;
    overflow: hidden;
    isolation: isolate;
    color: #1a1a1a;
    background: transparent;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  }

  .liquidGlass-wrapper {
    position: relative;
    display: flex;
    overflow: hidden;
    isolation: isolate;
  }

  .liquidGlass-effect {
    position: absolute;
    z-index: 0;
    inset: 0;
    border-radius: inherit;
    background: rgba(255, 255, 255, 0.42);
    pointer-events: none;
  }

  .liquidGlass-tint {
    z-index: 1;
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(255, 255, 255, 0.28);
    pointer-events: none;
  }

  .liquidGlass-shine {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    pointer-events: none;
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.55),
      inset -1px -1px 0 rgba(255, 255, 255, 0.28);
  }

  .panel-card {
    position: relative;
    z-index: 3;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow:
      inset 2px 2px 1px 0 rgba(255, 255, 255, 0.45),
      inset -1px -1px 1px 1px rgba(255, 255, 255, 0.3);
    padding: 12px 14px;
  }

  :global(.panel-glow.fill) {
    flex: 1;
  }

  :global(.panel-glow.fill .panel),
  :global(.panel-glow.fill .panel-card) {
    height: 100%;
  }
</style>
