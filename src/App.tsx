import OBR, { buildText, Image, Text } from "@owlbear-rodeo/sdk";
import { useCallback } from "react";
import { getPluginId } from "./getPluginId";
import { isPlainObject } from "./isPlainObject";

function App() {
  const addOne = useCallback(() => {
    (async () => {
      // get selection
      const selection = await OBR.player.getSelection();
      if (!selection) return;

      // get selected items
      const items = await OBR.scene.items.getItems<Image>(selection);
      if (!items) return;

      // get counters for all items
      const tokenCounters = await OBR.scene.items.getItems<Text>((item) => {
        const metadata = item.metadata[getPluginId("metadata")];
        return Boolean(isPlainObject(metadata) && metadata.enabled);
      });
      if (!tokenCounters) return;

      const dpi = await OBR.scene.grid.getDpi();

      for (const item of items) {
        // Find the counter attached to this item
        const attachedCounter = tokenCounters.filter(
          (tokenCounter) => tokenCounter.attachedTo === item.id
        )[0];

        if (!attachedCounter) {
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
            .plainText("1")
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
        } else {
          OBR.scene.items.updateItems([attachedCounter], (counterItems) => {
            const number = parseInt(attachedCounter.text.plainText);
            counterItems[0].text.plainText = `${number + 1}`;
          });
        }
      }
    })();
  }, []);

  const subtractOne = useCallback(() => {
    (async () => {
      const selection = await OBR.player.getSelection();
      if (!selection) return;

      const items = await OBR.scene.items.getItems<Image>(selection);
      if (!items) return;

      const tokenCounters = await OBR.scene.items.getItems<Text>((item) => {
        const metadata = item.metadata[getPluginId("metadata")];
        return Boolean(isPlainObject(metadata) && metadata.enabled);
      });
      if (!tokenCounters) return;

      for (const item of items) {
        // Find the counter attached to this item
        const attachedCounter = tokenCounters.filter(
          (tokenCounter) => tokenCounter.attachedTo === item.id
        )[0];

        if (!attachedCounter) {
          return;
        } else {
          const number = parseInt(attachedCounter.text.plainText);

          if (number == 1) {
            OBR.scene.items.deleteItems([attachedCounter.id]);
          } else {
            OBR.scene.items.updateItems([attachedCounter], (items) => {
              const number = parseInt(attachedCounter.text.plainText);
              items[0].text.plainText = `${number - 1}`;
            });
          }
        }
      }
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-20 text-white text-3xl">
      <div className="flex flex-row gap-2">
        <button
          className="bg-teal-500 w-10 h-10 rounded-sm active:bg-teal-700"
          onClick={() => subtractOne()}
        >
          -
        </button>
        <button
          className="bg-teal-500 w-10 h-10 rounded-sm active:bg-teal-700"
          onClick={() => addOne()}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default App;
