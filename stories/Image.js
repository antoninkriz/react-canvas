import React from "react";
import { storiesOf } from "@storybook/react";
import { Image, Surface } from "../src/index";

storiesOf("Image", module).add("hello-world", () => {
  const props = { size: { width: 400, height: 400 } };
  return (
    <div>
      <Surface
        top={0}
        left={0}
        width={props.size.width}
        height={props.size.height}
      >
        <Image
          style={{
            top: 50,
            width: 200,
            height: 200,
            left: 0
          }}
          src="https://i.imgur.com/U1p9DSP.png"
        />
      </Surface>
    </div>
  );
});
