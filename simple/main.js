import * as PIXI from "pixi.js";
import { Spine, TextureAtlas, AtlasAttachmentLoader, SkeletonJson } from "@pixi-spine/all-4.1";

// --- PIXI App setup ---
const app = new PIXI.Application({ width: 800, height: 600, backgroundAlpha: 0 });
document.getElementById("canvas-container").appendChild(app.view);

// --- UI elements ---
const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const animSelect = document.getElementById("animationSelect");
const playBtn = document.getElementById("playBtn");
const clearBtn = document.getElementById("clearBtn");

let jsonFile, atlasFile, imageFiles = {}, spine;

// --- Drag & drop ---
uploadArea.addEventListener("dragover", e => { e.preventDefault(); uploadArea.classList.add("dragover"); });
uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
uploadArea.addEventListener("drop", e => { e.preventDefault(); uploadArea.classList.remove("dragover"); handleFiles(e.dataTransfer.files); });
fileInput.addEventListener("change", e => handleFiles(e.target.files));
clearBtn.addEventListener("click", reset);
playBtn.addEventListener("click", playSelected);

function handleFiles(files) {
  for (const f of files) {
    if (f.name.endsWith(".json")) jsonFile = f;
    else if (f.name.endsWith(".atlas")) atlasFile = f;
    else if (f.name.endsWith(".png")) imageFiles[f.name] = f;
  }
  if (jsonFile && atlasFile && Object.keys(imageFiles).length) loadSpine();
}

async function loadSpine() {
  const jsonText = await jsonFile.text();
  const atlasText = await atlasFile.text();

  const atlasImages = {};
  for (const [name, file] of Object.entries(imageFiles)) {
    const blob = new Blob([await file.arrayBuffer()]);
    atlasImages[name] = await createImageBitmap(blob);
  }

  const atlas = new TextureAtlas(atlasText, (line, cb) => {
    const bmp = atlasImages[line];
    if (!bmp) return cb(null);
    const baseTex = new PIXI.BaseTexture(bmp);
    cb(new PIXI.Texture(baseTex));
  });

  const atlasLoader = new AtlasAttachmentLoader(atlas);
  const jsonLoader = new SkeletonJson(atlasLoader);
  const skeletonData = jsonLoader.readSkeletonData(JSON.parse(jsonText));

  spine = new Spine(skeletonData);
  spine.x = app.screen.width / 2;
  spine.y = app.screen.height - 100;
  spine.scale.set(0.5);

  app.stage.removeChildren();
  app.stage.addChild(spine);

  animSelect.innerHTML = "";
  for (const anim of spine.spineData.animations) {
    const opt = document.createElement("option");
    opt.value = anim.name;
    opt.textContent = anim.name;
    animSelect.appendChild(opt);
  }

  if (spine.spineData.animations.length) {
    animSelect.value = spine.spineData.animations[0].name;
    playSelected();
  }
}

function playSelected() {
  if (!spine) return;
  spine.state.setAnimation(0, animSelect.value, true);
}

function reset() {
  jsonFile = atlasFile = spine = null;
  imageFiles = {};
  animSelect.innerHTML = "";
  app.stage.removeChildren();
}
