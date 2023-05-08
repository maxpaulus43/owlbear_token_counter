<script lang="ts">
  import OBR from "@owlbear-rodeo/sdk";
  import { onMount } from "svelte";

  let fill = "white";

  onMount(async () => {
    fill = (await OBR.theme.getTheme()).mode === "DARK" ? "white" : "black";
  });
</script>

<svg
  class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv"
  focusable="false"
  aria-hidden="true"
  viewBox="0 0 24 24"
  data-testid="VisibilityRoundedIcon"
>
  <path
    {fill}
    d="M12 4C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
  />
</svg>
