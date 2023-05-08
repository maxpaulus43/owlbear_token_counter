<script lang="ts">
  import OBR, { buildText } from "@owlbear-rodeo/sdk";
  import type { Image, Text } from "@owlbear-rodeo/sdk";
  import { getPluginId } from "./getPluginId";
  import { isPlainObject } from "./isPlainObject";
  import { onMount } from "svelte";
  import Eye from "../assets/eye.svelte";
  import CrossEye from "../assets/cross-eye.svelte";

  let numberInputValue: number = 0;
  let isVisible = true;
  let hasToggleVisibilityPermission = false;

  onMount(async () => {
    const role = await OBR.player.getRole();
    hasToggleVisibilityPermission = role === "GM";
    const itemsAndCounters = await getSelectedItemsAndCounters();
    let visibleCount = 0;
    let itemCount = 0;
    for (const { item, counter } of itemsAndCounters) {
      if (!counter) continue;
      if (item.visible) itemCount++;
      const numberFromCounter = parseInt(counter.text.plainText);
      numberInputValue = numberFromCounter;
      if (counter.visible) visibleCount++;
    }
    isVisible = visibleCount > itemCount / 2;
  });

  async function getSelectedItemsAndCounters(): Promise<
    { item: Image; counter: Text }[]
  > {
    let result: { item: Image; counter: Text }[] = [];

    // get selection
    const selection = await OBR.player.getSelection();
    if (!selection) return result;

    // get selected items
    const items = await OBR.scene.items.getItems<Image>(selection);
    if (!items) return result;

    // get counters for all items
    const tokenCounters = await OBR.scene.items.getItems<Text>((item) => {
      const metadata = item.metadata[getPluginId("metadata")];
      return Boolean(isPlainObject(metadata) && metadata.enabled);
    });

    return items.map((item) => {
      return {
        item,
        counter: tokenCounters.find((c) => c.attachedTo === item.id),
      };
    });
  }

  async function attachCounterToItemWithNumber(item: Image, number: number) {
    const dpi = await OBR.scene.grid.getDpi();

    const dpiScale = dpi / item.grid.dpi;
    const width = item.image.width * dpiScale;
    const height = item.image.height * dpiScale;
    const offsetX =
      (item.grid.offset.x / item.image.width) * item.scale.x * width;
    const offsetY =
      (item.grid.offset.y / item.image.height) * item.scale.y * height;
    // Apply offset so the text origin is the top left
    const position = {
      x: item.position.x - offsetX,
      y: item.position.y - offsetY,
    };

    const txt = buildText()
      .textType("PLAIN")
      .plainText(`${number}`)
      .fontSize(52)
      .scale({ x: item.scale.x, y: item.scale.y })
      .position(position)
      .fillColor("red")
      .strokeColor("white")
      .strokeWidth(1)
      .strokeOpacity(1)
      .attachedTo(item.id)
      .locked(true)
      .name("Token Counter")
      .metadata({ [getPluginId("metadata")]: { enabled: true } })
      .layer("NOTE")
      .disableHit(true)
      .build();

    OBR.scene.items.addItems([txt]);
  }

  async function addOne() {
    const itemsAndCounters = await getSelectedItemsAndCounters();
    numberInputValue += 1;

    for (const { item, counter } of itemsAndCounters) {
      // Find the counter attached to this item
      if (!counter) {
        attachCounterToItemWithNumber(item, 1);
      } else {
        OBR.scene.items.updateItems([counter], (counterItems) => {
          const number = parseInt(counter.text.plainText);
          counterItems[0].text.plainText = `${number + 1}`;
        });
      }
    }
  }

  async function subtractOne() {
    const itemsAndCounters = await getSelectedItemsAndCounters();
    numberInputValue -= 1;

    for (const { counter } of itemsAndCounters) {
      if (!counter) {
        continue;
      } else {
        const number = parseInt(counter.text.plainText);

        if (number == 1) {
          console.log("deleting");
          OBR.scene.items.deleteItems([counter.id]);
        } else {
          OBR.scene.items.updateItems([counter], (items) => {
            const number = parseInt(counter.text.plainText);
            items[0].text.plainText = `${number - 1}`;
          });
        }
      }
    }
  }

  type Color = "red" | "orange" | "yellow" | "green" | "blue" | "purple";

  async function setColor(color: Color) {
    const itemsAndCounters = await getSelectedItemsAndCounters();
    for (const { counter } of itemsAndCounters) {
      if (!counter) {
        continue;
      } else {
        OBR.scene.items.updateItems([counter], (items) => {
          items[0].text.style.fillColor = color;
          items[0].text.style.strokeColor =
            color === "yellow" ? "black" : "white";
        });
      }
    }
  }

  async function toggleVisibility() {
    const itemsAndCounters = await getSelectedItemsAndCounters();
    let atLeastOneItemChanged = false;
    for (const { item, counter } of itemsAndCounters) {
      if (!item.visible || !counter) continue;
      atLeastOneItemChanged = true;
      OBR.scene.items.updateItems([counter], (items) => {
        items[0].visible = !isVisible;
      });
    }
    if (atLeastOneItemChanged) {
      isVisible = !isVisible;
    }
  }

  function isBad(n: number) {
    return isNaN(n) || `${n}`.includes("e");
  }

  async function onInput(e: Event) {
    const inputValue = parseInt((e.target as HTMLInputElement).value);

    const itemsAndCounters = await getSelectedItemsAndCounters();
    for (const { item, counter } of itemsAndCounters) {
      if (!counter) {
        if (!isBad(inputValue) && inputValue !== 0) {
          attachCounterToItemWithNumber(item, inputValue);
        }
      } else {
        if (isBad(inputValue) || inputValue === 0) {
          numberInputValue = 0;
          OBR.scene.items.deleteItems([counter.id]);
        } else {
          numberInputValue = inputValue;
          OBR.scene.items.updateItems([counter], (items) => {
            items[0].text.plainText = `${inputValue}`;
          });
        }
      }
    }
  }

  function onFocus(e: Event) {
    (e.target as HTMLInputElement).select();
  }
</script>

<div
  class="grid grid-cols-6 grid-rows-2 text-white h-[80px] gap-1 text-2xl p-1"
>
  <button
    class="bg-teal-500 rounded-sm active:bg-teal-700"
    on:click={() => subtractOne()}
  >
    -
  </button>
  <input
    type="number"
    inputmode="numeric"
    min="0"
    class="col-span-3 text-black text-center"
    class:col-span-4={!hasToggleVisibilityPermission}
    value={numberInputValue}
    on:input={onInput}
    on:focus={onFocus}
    on:keydown={(e) => ["e", "E", "+"].includes(e.key) && e.preventDefault()}
  />
  <button
    class="bg-teal-500 rounded-sm active:bg-teal-700"
    on:click={() => addOne()}
  >
    +
  </button>
  {#if hasToggleVisibilityPermission}
    <button on:click={toggleVisibility}>
      {#if isVisible}
        <Eye />
      {:else}
        <CrossEye />
      {/if}
    </button>
  {/if}
  <button
    class="bg-red-500 swatch"
    on:click={() => setColor("red")}
    aria-label="red"
  />
  <button
    class="bg-orange-500 swatch"
    on:click={() => setColor("orange")}
    aria-label="orange"
  />
  <button
    class="bg-yellow-500 swatch"
    on:click={() => setColor("yellow")}
    aria-label="yellow"
  />
  <button
    class="bg-green-500 swatch"
    on:click={() => setColor("green")}
    aria-label="green"
  />
  <button
    class="bg-blue-500 swatch"
    on:click={() => setColor("blue")}
    aria-label="blue"
  />
  <button
    class="bg-purple-500 swatch"
    on:click={() => setColor("purple")}
    aria-label="purple"
  />
</div>

<style lang="postcss">
  .swatch {
    @apply rounded-full w-5 h-5 self-center justify-self-center active:opacity-50;
  }
</style>
