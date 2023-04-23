<script lang="ts">
  import OBR, { buildText } from "@owlbear-rodeo/sdk";
  import type { Image, Text } from "@owlbear-rodeo/sdk";
  import { getPluginId } from "./getPluginId";
  import { isPlainObject } from "./isPlainObject";
  import { onMount } from "svelte";

  let numberInputValue: number = 0;

  onMount(async () => {
    const [items, tokenCounters] = await getSelectedItemsAndTokens();

    for (const item of items) {
      // Find the counter attached to this item
      const attachedCounter = tokenCounters.filter(
        (tokenCounter) => tokenCounter.attachedTo === item.id
      )[0];

      if (!attachedCounter) {
        continue;
      } else {
        const numberFromCounter = parseInt(attachedCounter.text.plainText);
        numberInputValue = numberFromCounter;
      }
    }
  });

  async function getSelectedItemsAndTokens(): Promise<[Image[], Text[]]> {
    let result: [Image[], Text[]] = [[], []];
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
    if (!tokenCounters) return result;
    return [items, tokenCounters];
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
    const [items, tokenCounters] = await getSelectedItemsAndTokens();
    numberInputValue += 1;

    for (const item of items) {
      // Find the counter attached to this item
      const attachedCounter = tokenCounters.filter(
        (tokenCounter) => tokenCounter.attachedTo === item.id
      )[0];

      if (!attachedCounter) {
        attachCounterToItemWithNumber(item, 1);
      } else {
        OBR.scene.items.updateItems([attachedCounter], (counterItems) => {
          const number = parseInt(attachedCounter.text.plainText);
          counterItems[0].text.plainText = `${number + 1}`;
        });
      }
    }
  }

  async function subtractOne() {
    const [items, tokenCounters] = await getSelectedItemsAndTokens();
    numberInputValue -= 1;

    for (const item of items) {
      // Find the counter attached to this item
      const attachedCounter = tokenCounters.filter(
        (tokenCounter) => tokenCounter.attachedTo === item.id
      )[0];

      if (!attachedCounter) {
        continue;
      } else {
        const number = parseInt(attachedCounter.text.plainText);

        if (number == 1) {
          console.log("deleting");
          OBR.scene.items.deleteItems([attachedCounter.id]);
        } else {
          OBR.scene.items.updateItems([attachedCounter], (items) => {
            const number = parseInt(attachedCounter.text.plainText);
            items[0].text.plainText = `${number - 1}`;
          });
        }
      }
    }
  }

  type Color = "red" | "orange" | "yellow" | "green" | "blue" | "purple";

  async function setColor(color: Color) {
    const [items, tokenCounters] = await getSelectedItemsAndTokens();

    for (const item of items) {
      // Find the counter attached to this item
      const attachedCounter = tokenCounters.filter(
        (tokenCounter) => tokenCounter.attachedTo === item.id
      )[0];

      if (!attachedCounter) {
        continue;
      } else {
        OBR.scene.items.updateItems([attachedCounter], (items) => {
          items[0].text.style.fillColor = color;
          items[0].text.style.strokeColor =
            color === "yellow" ? "black" : "white";
        });
      }
    }
  }

  function isBad(n: number) {
    return isNaN(n) || `${n}`.includes("e");
  }

  async function onInput(e: Event) {
    const inputValue = parseInt((e.target as HTMLInputElement).value);

    const [items, tokenCounters] = await getSelectedItemsAndTokens();

    for (const item of items) {
      // Find the counter attached to this item
      const attachedCounter = tokenCounters.filter(
        (tokenCounter) => tokenCounter.attachedTo === item.id
      )[0];

      if (!attachedCounter) {
        if (!isBad(inputValue) && inputValue !== 0) {
          attachCounterToItemWithNumber(item, inputValue);
        }
      } else {
        if (isBad(inputValue) || inputValue === 0) {
          OBR.scene.items.deleteItems([attachedCounter.id]);
        } else {
          numberInputValue = inputValue;
          OBR.scene.items.updateItems([attachedCounter], (items) => {
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

<div class="grid grid-cols-6 grid-rows-2 text-white h-[80px] gap-1 text-2xl">
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
    class="col-span-4 text-black text-center"
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
  <button class="bg-red-500 swatch" on:click={() => setColor("red")} />
  <button class="bg-orange-500 swatch" on:click={() => setColor("orange")} />
  <button class="bg-yellow-500 swatch" on:click={() => setColor("yellow")} />
  <button class="bg-green-500 swatch" on:click={() => setColor("green")} />
  <button class="bg-blue-500 swatch" on:click={() => setColor("blue")} />
  <button class="bg-purple-500 swatch" on:click={() => setColor("purple")} />
</div>

<style lang="postcss">
  .swatch {
    @apply rounded-full w-5 h-5 self-center justify-self-center active:opacity-50;
  }
</style>
