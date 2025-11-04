<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>🦴 Pixi Spine Previewer</title>
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@6.5.9/dist/browser/pixi.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pixi-spine@3.1.2/dist/pixi-spine.js"></script>
  <style>
    html, body {
      background: #1b1b1b;
      color: white;
      margin: 0;
      height: 100%;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    h2 {
      margin: 1rem 0 0.5rem;
    }

    #controls {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
    }

    input[type="file"] {
      color: white;
      background: #333;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
    }

    select, button {
      background: #333;
      color: white;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 0.4rem 0.6rem;
      cursor: pointer;
    }

    button:hover {
      background: #444;
    }

    #canvas-container {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      max-width: 900px;
    }

    canvas {
      background: #222;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
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

    // Create Pixi app
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

      // Load bitmaps for all PNGs
      const atlasImages = {};
      for (let [name, file] of Object.entries(imageFiles)) {
        atlasImages[name] = await createImageBitmap(await file.arrayBuffer());
      }

      // Create atlas
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

      // Populate animation dropdown
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
