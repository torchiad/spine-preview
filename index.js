<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Pixi Spine Previewer</title>
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@6.5.9/dist/browser/pixi.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pixi-spine@3.1.2/dist/pixi-spine.js"></script>
  <style>
    html, body {
      background: #1b1b1b;
      color: white;
      margin: 0;
      height: 100%;
      font-family: system-ui;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    #controls {
      padding: 1rem;
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    canvas { background: #222; border-radius: 8px; }
  </style>
</head>
<body>
  <h2>🦴 Pixi Spine Previewer</h2>
  <div id="controls">
    <input type="file" id="fileInput" multiple />
    <select id="animationSelect"></select>
    <button id="playBtn">▶️ Play</button>
  </div>
  <div id="canvas-container"></div>

  <script>
    let app, spine, resources = {};

    app = new PIXI.Application({
      backgroundColor: 0x111111,
      width: 800,
      height: 600,
    });
    document.getElementById("canvas-container").appendChild(app.view);

    const input = document.getElementById("fileInput");
    const animSelect = document.getElementById("animationSelect");
    const playBtn = document.getElementById("playBtn");

    let jsonFile, atlasFile, imageFiles = {};

    input.addEventListener("change", (e) => {
      for (let f of e.target.files) {
        if (f.name.endsWith(".json")) jsonFile = f;
        else if (f.name.endsWith(".atlas")) atlasFile = f;
        else if (f.name.endsWith(".png")) imageFiles[f.name] = f;
      }
      if (jsonFile && atlasFile && Object.keys(imageFiles).length) loadSpine();
    });

    async function loadSpine() {
      const jsonText = await jsonFile.text();
      const atlasText = await atlasFile.text();

      const atlasImages = {};
      for (let [name, file] of Object.entries(imageFiles)) {
        atlasImages[name] = await createImageBitmap(await file.arrayBuffer());
      }

      const rawAtlas = new PIXI.spine.core.TextureAtlas(atlasText, (line, cb) => {
        const bmp = atlasImages[line];
        if (!bmp) return console.warn("Missing image", line);
        const baseTex = new PIXI.BaseTexture(bmp);
        cb(new PIXI.spine.core.Texture(baseTex));
      });

      const atlasLoader = new PIXI.spine.core.AtlasAttachmentLoader(rawAtlas);
      const jsonLoader = new PIXI.spine.core.SkeletonJson(atlasLoader);
      const skeletonData = jsonLoader.readSkeletonData(JSON.parse(jsonText));

      spine = new PIXI.spine.Spine(skeletonData);
      spine.x = app.screen.width / 2;
      spine.y = app.screen.height - 100;
      spine.scale.set(0.5);
      app.stage.removeChildren();
      app.stage.addChild(spine);

      // populate animation list
      animSelect.innerHTML = "";
      for (const anim of spine.spineData.animations) {
        const opt = document.createElement("option");
        opt.value = anim.name;
        opt.textContent = anim.name;
        animSelect.appendChild(opt);
      }
    }

    playBtn.addEventListener("click", () => {
      if (!spine) return;
      const anim = animSelect.value;
      spine.state.setAnimation(0, anim, true);
    });
  </script>
</body>
</html>
