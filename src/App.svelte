<script lang="ts">
  import PluginGate from "./lib/PluginGate.svelte";
  import TokenCounter from "./lib/TokenCounter.svelte";
</script>

<PluginGate>
  <TokenCounter />
</PluginGate>
