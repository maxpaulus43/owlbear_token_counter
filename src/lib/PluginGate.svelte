<script lang="ts">
  import { onMount } from "svelte";
  import OBR from "@owlbear-rodeo/sdk";

  let ready = false;

  onMount(() => {
    if (OBR.isAvailable) {
      OBR.onReady(() => {
        ready = true;
      });
    }
  });
</script>

{#if ready}
  <slot />
{/if}
