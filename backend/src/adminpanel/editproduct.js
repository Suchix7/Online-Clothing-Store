const url = new URL(window.location.href);

let isFormDirty = false;

// Detect changes in any input, select, textarea, or checkbox
document.addEventListener("input", (e) => {
  if (
    e.target.matches("input, select, textarea") ||
    e.target.type === "checkbox" ||
    e.target.type === "radio"
  ) {
    isFormDirty = true;
  }
});

// Listen for leaving the page
window.addEventListener("beforeunload", (e) => {
  if (isFormDirty) {
    e.preventDefault();
    e.returnValue = ""; // Required for Chrome
    return ""; // For older browsers
  }
});

document.querySelector(".video-upload").addEventListener("click", () => {
  document.querySelector(".video-input").click();
});

document.querySelector(".video-input").addEventListener("change", function (e) {
  const preview = document.querySelector(".video-upload-container");
  preview.innerHTML = "";

  const file = e.target.files[0];
  if (!file.type.match("video.*")) {
    alert("Please select a video file");
    return;
  }

  const videoElement = document.createElement("video");
  videoElement.setAttribute("width", "100%");
  videoElement.setAttribute("height", "100%");
  videoElement.style = "object-fit: cover";
  videoElement.controls = true;
  videoElement.src = URL.createObjectURL(file);
  preview.appendChild(videoElement);
});

document.getElementById("subDown")?.addEventListener("change", () => {
  // Read currently checked models before reloading (if you want to persist across brand changes)
  const currentlyChecked = Array.from(
    document.querySelectorAll('input[name="models[]"]:checked')
  ).map((el) => el.value.trim());

  handleCovermodel(currentlyChecked);
});

function getImagesArray(url) {
  try {
    const imagesParam = url.searchParams.get("images");
    if (!imagesParam) return []; // Handle missing parameter

    const decoded = decodeURIComponent(imagesParam);
    return JSON.parse(decoded) || []; // Handle null/undefined parse result
  } catch (error) {
    console.error("Failed to parse images array:", error);
    return []; // Fallback to empty array
  }
}

// Function to setup image input event listeners
function setupImageInputListeners() {
  const imageInputs = document.querySelectorAll(".images");
  const imagesInputs = document.querySelectorAll(".image-input");

  // First remove any existing event listeners
  imageInputs.forEach((item, index) => {
    item.removeEventListener("click", handleImageClick);
    item.addEventListener("click", handleImageClick);
  });

  imagesInputs.forEach((item, index) => {
    item.removeEventListener("change", handleImageChange);
    item.addEventListener("change", handleImageChange);
  });
}

// Click handler for image containers
function handleImageClick(e) {
  const index = Array.from(document.querySelectorAll(".images")).indexOf(
    e.currentTarget
  );
  console.log("Upload-item", index);
  document.querySelectorAll(".image-input")[index].click();
}

// Change handler for file inputs
function handleImageChange(e) {
  const index = Array.from(document.querySelectorAll(".image-input")).indexOf(
    e.currentTarget
  );
  console.log("Image-input: ", index);
  const preview = document.querySelectorAll(".images")[index];
  preview.innerHTML = "";

  const files = e.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.match("image.*")) continue;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.setAttribute("width", "100%");
      img.setAttribute("height", "100%");
      img.style = "object-fit: cover";
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

function handleColorImageChange(e) {
  const index = Array.from(document.querySelectorAll(".color-image")).indexOf(
    e.currentTarget
  );
  console.log("Color-image-input: ", index);
  const preview = document.querySelectorAll(".preview-container")[index];
  preview.innerHTML = "";

  const files = e.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.match("image.*")) continue;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.setAttribute("width", "100%");
      img.setAttribute("height", "100%");
      img.style = "object-fit: cover";
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

const number = document.querySelector("#colorsNumber");
number.addEventListener("change", () => {
  const count = number.value;
  if (count > 5) {
    alert("You cannot put more than 5 colors");
    return;
  }
  const input = document.querySelector(".colorInput");
  input.style =
    "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
  input.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h2>Color ${i}:</h2>
                  <button type="button" onclick="deleteColor(${i})" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    <i class="fa-solid fa-trash"></i> Delete
                  </button>
                </div>
                <label for="color${i}">
                <i class="fa-solid fa-palette"></i>
                <input
                  type="text"
                  name="color${i}"
                  id="color${i}"
                  placeholder="Enter color ${i}"
                  required
                />
                </label>
                <label for="color-image${i}">
                <input type="file" id="color-image${i}" name="color-image${i}" accept="image/*" required/>
                </label>
              </div>`;
    input.innerHTML += code;
  }
});

const input = document.querySelector(".colorInput");
input.style =
  "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
input.innerHTML = "";
function loadColors(color) {
  for (let i = 1; i <= color.length; i++) {
    const code = `
                 <div style="display:flex;flex-direction:column;gap:10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>Color ${i}:</h2>
                    <button type="button" onclick="deleteColor(${i})" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                      <i class="fa-solid fa-trash"></i> Delete
                    </button>
                  </div>

                  <!-- Color Name Input -->
                  <div class="input-group" for="color${i}">
                    <i class="fa-solid fa-palette"></i>
                    <input
                      type="text"
                      name="color${i}"
                      id="color${i}"
                      placeholder="Enter color ${i}"
                      value="${color[i - 1].colorName}"
                      required
                    />
                  </div>

                  <!-- Color Image Input (separate label) -->
                  <label for="color-image${i}">
                    Upload Color Image:
                  </label>
                  <label for="preview">
                      <div class="preview-container">
                <img src="${
                  color[i - 1].image
                }" alt="product-image" width="100%" height="100%" style="object-fit: contain"/>
              </div>
            </label>
                  <input
                    type="file"
                    id="color-image${i}"
                    name="color-image${i}"
                    class="color-image"
                    accept="image/*"
                    required
                  />
                </div>
`;
    input.innerHTML += code;
  }
  const addBtn = document.createElement("button");
  addBtn.id = "addColor";
  addBtn.textContent = "Click to add a new color";
  addBtn.addEventListener("click", addColor);
  input.appendChild(addBtn);
}

function addColor(e) {
  e.preventDefault();
  const input = document.querySelector(".colorInput");

  // Count how many color fields already exist
  const i = input.querySelectorAll("input[type='text']").length + 1;

  if (i > 5) {
    alert("You cannot put more than 5 colors");
    return;
  }

  const code = `
    <div style="display: flex;flex-direction:column;gap:10px;">
      <h2>Color ${i}:</h2>
      <label for="color${i}">
        <i class="fa-solid fa-palette"></i>
        <input
          type="text"
          name="color${i}"
          id="color${i}"
          placeholder="Enter color ${i}"
          required
        />
      </label>
      <label for="color-image${i}">
        <input type="file" id="color-image${i}" name="color-image${i}" accept="image/*" required/>
      </label>
    </div>`;

  // Remove old button
  input.querySelector("#addColor").remove();

  // Append new color block
  input.insertAdjacentHTML("beforeend", code);

  // Re-add the button
  const newBtn = document.createElement("button");
  newBtn.id = "addColor";
  newBtn.textContent = "Click to add a new color";
  newBtn.addEventListener("click", addColor);
  input.appendChild(newBtn);
}

const numbers = document.querySelector("#sizes");
numbers.addEventListener("change", () => {
  const count = number.value;
  if (count > 8) {
    alert("You cannot put more than 8 sizes");
    return;
  }
  const input = document.querySelector(".sizesInput");
  input.style =
    "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
  input.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h2>Size ${i}:</h2>
                  <button type="button" onclick="deleteSize(${i})" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    <i class="fa-solid fa-trash"></i> Delete
                  </button>
                </div>
                <label for="size${i}">
                <i class="fa-solid fa-palette"></i>
                <input
                  type="text"
                  name="size${i}"
                  id="size${i}"
                  placeholder="Enter size ${i}"
                  required
                />
                </label>
              </div>`;
    input.innerHTML += code;
  }
});

const inputs = document.querySelector(".sizesInput");
inputs.style =
  "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
inputs.innerHTML = "";
function loadSizes(size) {
  const input = document.querySelector(".sizesInput");
  input.style =
    "display:flex;flex-direction:column;gap:10px;border-radius:20px;border:2px solid white;padding:20px;";
  input.innerHTML = "";

  for (let i = 1; i <= size.length; i++) {
    const code = `
      <div class="size-row" data-index="${i}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2>Size ${i}:</h2>
          <button type="button" onclick="deleteSize(${i})"
            style="background:#ff4444;color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
        <div class="input-group">
          <i class="fa-solid fa-shirt"></i>
          <input
            type="text"
            name="size${i}"
            id="size${i}"
            placeholder="Enter size ${i}"
            value="${size[i - 1]?.sizeName ?? ""}"
            required
          />
        </div>
      </div>`;
    input.innerHTML += code;
  }

  // Add “Add Size” button
  const addBtn = document.createElement("button");
  addBtn.id = "addSize";
  addBtn.textContent = "Click to add a new size";
  addBtn.addEventListener("click", addSize);
  input.appendChild(addBtn);
}

function addSize(e) {
  e.preventDefault();
  const input = document.querySelector(".sizesInput");
  const current = input.querySelectorAll(".size-row").length + 1;

  if (current > 8) {
    alert("You cannot put more than 8 sizes");
    return;
  }

  // remove button to append after the new block
  input.querySelector("#addSize")?.remove();

  const code = `
    <div class="size-row" data-index="${current}">
      <h2>Size ${current}:</h2>
      <label for="size${current}">
        <i class="fa-solid fa-shirt"></i>
        <input
          type="text"
          name="size${current}"
          id="size${current}"
          placeholder="Enter size ${current}"
          required
        />
      </label>
    </div>`;
  input.insertAdjacentHTML("beforeend", code);

  const newBtn = document.createElement("button");
  newBtn.id = "addSize";
  newBtn.textContent = "Click to add a new size";
  newBtn.addEventListener("click", addSize);
  input.appendChild(newBtn);
}
function addVariant(e) {
  e.preventDefault();
  const input = document.querySelector(".variantInput");

  // Count how many color fields already exist
  const i = input.querySelectorAll("div").length + 1;

  const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
                <h2>Variant ${i}:</h2>
                <label for="searchName${i}">
                <i class="fa-solid fa-database"></i>
                <input
                  type="text"
                  name="searchName${i}"
                  id="searchName${i}"
                  placeholder="Enter variant search name${i}"
                />
                </label>
                <label for="variant${i}">
                <i class="fa-solid fa-database"></i>
                <input
                  type="text"
                  name="variant${i}"
                  id="variant${i}"
                  placeholder="Enter variant ${i}"
                />
                </label>
                <label for="cost-price${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="text"
                  name="cost-price${i}"
                  id="cost-price${i}"
                  placeholder="Enter cost price ${i}"            
                />
                </label>
                <label for="selling-price${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="text"
                  name="selling-price${i}"
                  id="selling-price${i}"
                  placeholder="Enter selling price ${i}"            
                />
                </label>
                <label for="stock${i}">
                <i class="fa-solid fa-box"></i>
                <input
                  type="text"
                  name="stock${i}"
                  id="stock${i}"
                  placeholder="Enter stock ${i}"            
                />
                </label>
              </div>`;

  // Remove old button
  input.querySelector("#addVariant").remove();

  // Append new color block
  input.insertAdjacentHTML("beforeend", code);

  // Re-add the button
  const newBtn = document.createElement("button");
  newBtn.id = "addVariant";
  newBtn.textContent = "Click to add a new variant";
  newBtn.addEventListener("click", addVariant);
  input.appendChild(newBtn);
}

function addModel(e) {
  e.preventDefault();
  const input = document.querySelector(".coverInput");

  // Count how many color fields already exist
  const i = input.querySelectorAll("input[type='text']").length + 1;

  const code = `
              <div style="display: flex;flex-direction:column;gap:10px;position:relative">
              <h2>Model ${i}:</h2>
                <label for="model${i}">
                <i class="fa-solid fa-mobile"></i>
                <input
                  type="text"
                  name="model${i}"
                  id="model${i}"
                  placeholder="Enter model ${i}"
                />
                </label>
              </div>`;

  // Remove old button
  input.querySelector("#addModel").remove();

  // Append new color block
  input.insertAdjacentHTML("beforeend", code);

  // Re-add the button
  const newBtn = document.createElement("button");
  newBtn.id = "addModel";
  newBtn.textContent = "Click to add a new model";
  newBtn.addEventListener("click", addModel);
  input.appendChild(newBtn);
}

function addBundle(e) {
  e.preventDefault();
  const input = document.querySelector(".quantityInput");

  // Count how many color fields already exist
  const i = input.querySelectorAll("input[id^='bundle']").length / 2 + 1;

  const code = `
              <div style="display: flex;flex-direction:column;gap:10px;position:relative">
                <label for="bundle${i}">
                <i class="fa-solid fa-mobile"></i>
                <input
                  type="text"
                  name="bundle${i}"
                  id="bundle${i}"
                  placeholder="Enter bundle ${i}"
                />
                </label>
                <label for="bundlePrice${i}">
                <i class="fa-solid fa-mobile"></i>
                <input
                  type="Number"
                  name="bundlePrice${i}"
                  id="bundlePrice${i}"
                  placeholder="Enter bundle price ${i}"
                />
                </label>
              </div>`;

  // Remove old button
  input.querySelector("#addBundle").remove();

  // Append new color block
  input.insertAdjacentHTML("beforeend", code);

  // Re-add the button
  const newBtn = document.createElement("button");
  newBtn.id = "addBundle";
  newBtn.textContent = "Click to add a new bundle";
  newBtn.addEventListener("click", addBundle);
  input.appendChild(newBtn);
}

const phoneSpecs = document.querySelector(".phoneSpecs");

const variantCountt = document.querySelector("#variantCountt");
const variantCount = document.querySelector("#variantCount");
const variantInput = document.querySelector(".variantInput");
// const coverCount = document.querySelector("#coverCountt");
// const coverInput = document.querySelector(".coverInput");
const quantityCountt = document.querySelector("#quantityCountt");
const quantityCount = document.querySelector("#quantityCount");
const quantityInput = document.querySelector(".quantityInput");

// Initialize the page
function initPage() {
  const id = url.searchParams.get("id");

  let modelName,
    productName,
    cp,
    sp,
    pc,
    psc,
    extras,
    imagesArray,
    video,
    description,
    keyFeatures,
    stock,
    sold,
    color,
    variant,
    models,
    bundle,
    processor,
    ram,
    storage,
    battery,
    display,
    camera,
    frontCamera,
    os,
    charging,
    connectivity,
    ipRating,
    mwarranty,
    model,
    chargeInput,
    chargeOutput,
    chargeType,
    connectorType,
    compatibility,
    cable,
    packageIncludes,
    warranty,
    lprocessor,
    lram,
    lstorage,
    lbattery,
    ldisplay,
    graphics,
    ports,
    los,
    build,
    lconnectivity,
    lwarranty,
    bluetoothVersion,
    batteryLife,
    chargingTime,
    driverSize,
    microphone,
    noiseCancellation,
    touchControls,
    eiprating,
    ecompatibility,
    especialFeatures,
    ewarranty,
    capacity,
    outputPort,
    inputPort,
    outputPower,
    inputPower,
    chargingTech,
    material,
    weight,
    pcompatibility,
    specialFeatures,
    pwarranty,
    wdisplay,
    resolution,
    wbatteryLife,
    wos,
    wconnectivity,
    sensors,
    waterResistance,
    wcompatibility,
    healthFeatures,
    wspecialFeatures,
    wwarranty,
    smodel,
    speakerType,
    soutputPower,
    sconnectivity,
    sbluetoothRange,
    sbatteryLife,
    splaybackTime,
    schargingTime,
    swaterResistance,
    sfrequencyResponse,
    sdimensions,
    sweight,
    spackageIncludes,
    swarranty;

  async function fetchProductDetails() {
    try {
      const response = await axios.get(`/api/product/id/${id}`);
      const data = response.data;

      modelName = data.modelName;
      productName = data.name;
      cp = data.costPrice;
      sp = data.sellingPrice;
      pc = data.parentCategory;
      psc = data.parentSubcategory;
      extras = data.extras;
      imagesArray = data.images;
      video = data.video;
      description = data.description;
      keyFeatures = data.keyFeatures;
      stock = data.stock;
      sold = data.sold;
      color = data.color;
      variant = data.variant;
      bundle = data.bundle || [];
      models = data.model;
      processor = data.specs?.processor;
      ram = data.specs?.ram;
      storage = data.specs?.storage;
      battery = data.specs?.battery;
      display = data.specs?.display;
      camera = data.specs?.camera;
      frontCamera = data.specs?.frontCamera;
      os = data.specs?.os;
      charging = data.specs?.charging;
      connectivity = data.specs?.connectivity;
      ipRating = data.specs?.ipRating;
      mwarranty = data.specs?.warranty;
      model = data.chargerSpecs?.model;
      chargeInput = data.chargerSpecs?.chargeInput;
      chargeOutput = data.chargerSpecs?.chargeOutput;
      connectorType = data.chargerSpecs?.connectorType;
      chargeType = data.chargerSpecs?.chargeType;
      compatibility = data.chargerSpecs?.compatibility;
      cable = data.chargerSpecs?.cable;
      packageIncludes = data.chargerSpecs?.packageIncludes;
      warranty = data.chargerSpecs?.warranty;
      lprocessor = data.laptopSpecs?.processor;
      lram = data.laptopSpecs?.ram;
      lstorage = data.laptopSpecs?.storage;
      lbattery = data.laptopSpecs?.battery;
      ldisplay = data.laptopSpecs?.display;
      graphics = data.laptopSpecs?.graphics;
      ports = data.laptopSpecs?.ports;
      los = data.laptopSpecs?.os;
      build = data.laptopSpecs?.build;
      lconnectivity = data.laptopSpecs?.connectivity;
      lwarranty = data.laptopSpecs?.warranty;
      bluetoothVersion = data.earbudSpecs?.bluetoothVersion;
      batteryLife = data.earbudSpecs?.batteryLife;
      chargingTime = data.earbudSpecs?.chargingTime;
      driverSize = data.earbudSpecs?.driverSize;
      microphone = data.earbudSpecs?.microphone;
      noiseCancellation = data.earbudSpecs?.noiseCancellation;
      touchControls = data.earbudSpecs?.touchControls;
      eiprating = data.earbudSpecs?.ipRating;
      ecompatibility = data.earbudSpecs?.compatibility;
      especialFeatures = data.earbudSpecs?.specialFeatures;
      ewarranty = data.earbudSpecs?.warranty;
      capacity = data.powerbankSpecs?.capacity;
      outputPort = data.powerbankSpecs?.outputPort;
      inputPort = data.powerbankSpecs?.inputPort;
      outputPower = data.powerbankSpecs?.outputPower;
      inputPower = data.powerbankSpecs?.inputPower;
      chargingTech = data.powerbankSpecs?.chargingTech;
      material = data.powerbankSpecs?.material;
      weight = data.powerbankSpecs?.weight;
      pcompatibility = data.powerbankSpecs?.compatibility;
      specialFeatures = data.powerbankSpecs?.specialFeatures;
      pwarranty = data.powerbankSpecs?.warranty;
      wdisplay = data.watchSpecs?.display || "N/A";
      resolution = data.watchSpecs?.resolution || "N/A";
      wbatteryLife = data.watchSpecs?.batteryLife || "N/A";
      wos = data.watchSpecs?.os || "N/A";
      wconnectivity = data.watchSpecs?.connectivity || "N/A";
      sensors = data.watchSpecs?.sensors || "N/A";
      waterResistance = data.watchSpecs?.waterResistance || "N/A";
      wcompatibility = data.watchSpecs?.compatibility || "N/A";
      healthFeatures = data.watchSpecs?.healthFeatures || "N/A";
      wspecialFeatures = data.watchSpecs?.specialFeatures || "N/A";
      wwarranty = data.watchSpecs?.warranty || "N/A";
      smodel = data.speakerSpecs?.model || "N/A";
      speakerType = data.speakerSpecs?.speakerType || "N/A";
      soutputPower = data.speakerSpecs?.outputPower || "N/A";
      sconnectivity = data.speakerSpecs?.connectivity || "N/A";
      sbluetoothRange = data.speakerSpecs?.bluetoothRange || "N/A";
      sbatteryLife = data.speakerSpecs?.batteryLife || "N/A";
      splaybackTime = data.speakerSpecs?.playbackTime || "N/A";
      schargingTime = data.speakerSpecs?.chargingTime || "N/A";
      swaterResistance = data.speakerSpecs?.waterResistance || "N/A";
      sfrequencyResponse = data.speakerSpecs?.frequencyResponse || "N/A";
      sdimensions = data.speakerSpecs?.dimensions || "N/A";
      sweight = data.speakerSpecs?.weight || "N/A";
      spackageIncludes = data.speakerSpecs?.packageIncludes || "N/A";
      swarranty = data.speakerSpecs?.warranty || "N/A";

      const existingModels = Array.isArray(data?.models)
        ? data.models
        : Array.isArray(data?.model)
        ? data.model
        : [];
      const size = Array.isArray(data?.size) ? data.size : [];
      document.querySelector("#sizes").value = size.length;
      loadSizes(size);
      const imageInput = document.querySelectorAll(".images");
      const imagesInput = document.querySelectorAll(".image-input");
      const videoInput = document.querySelector(".video-upload-container");

      if (pc == "Phone") {
        document.querySelector(".phoneSpecs").style =
          "display:flex;flex-direction:column;gap:15px";
        variantCountt.style.display = "flex";
        variantCount.value = variant.length;
        variantInput.style =
          "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
        variantInput.innerHTML = "";
        for (let i = 1; i <= variant.length; i++) {
          const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
                <h2>Variant ${i}:</h2>
                <label for="searchName${i}">
                <i class="fa-solid fa-search"></i>
                <input
                  type="text"
                  name="searchName${i}"
                  id="searchName${i}"
                  value="${variant[i - 1].searchName}"
                  placeholder="Enter variant search name ${i}"
                />
                </label>
                <label for="variant${i}">
                <i class="fa-solid fa-database"></i>
                <input
                  type="text"
                  name="variant${i}"
                  id="variant${i}"
                  value="${variant[i - 1].variantName}"
                  placeholder="Enter variant ${i}"
                />
                </label>
                <label for="cost-price${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="text"
                  name="cost-price${i}"
                  id="cost-price${i}"
                  value="${variant[i - 1].variantCP}"
                  placeholder="Enter cost price ${i}"            
                />
                </label>
                <label for="selling-price${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="text"
                  name="selling-price${i}"
                  id="selling-price${i}"
                  value="${variant[i - 1].variantSP}"
                  placeholder="Enter selling price ${i}"            
                />
                </label>
                <label for="stock${i}">
                <i class="fa-solid fa-box"></i>
                <input
                  type="text"
                  name="stock${i}"
                  id="stock${i}"
                  value="${variant[i - 1].variantStock}"
                  placeholder="Enter stock ${i}"            
                />
                </label>
              </div>`;
          variantInput.innerHTML += code;
        }
        const addBtn = document.createElement("button");
        addBtn.id = "addVariant";
        addBtn.textContent = "Click to add a new variant";
        addBtn.addEventListener("click", addVariant);
        variantInput.appendChild(addBtn);
        document.querySelector("#processor").value = processor;
        document.querySelector("#ram").value = ram;
        document.querySelector("#storage").value = storage;
        document.querySelector("#battery").value = battery;
        document.querySelector("#display").value = display;
        document.querySelector("#camera").value = camera;
        document.querySelector("#frontCamera").value = frontCamera;
        document.querySelector("#os").value = os;
        document.querySelector("#charging").value = charging;
        document.querySelector("#connectivity").value = connectivity;
        document.querySelector("#ipRating").value = ipRating;
        document.querySelector("#mwarranty").value = mwarranty;
      } else if (pc == "Charger") {
        document.querySelector(".chargerSpecs").style =
          "display:flex;flex-direction:column;gap:15px";
        document.querySelector("#model").value = model;
        document.querySelector("#chargeInput").value = chargeInput;
        document.querySelector("#chargeOutput").value = chargeOutput;
        document.querySelector("#chargeType").value = chargeType;
        document.querySelector("#connectorType").value = connectorType;
        document.querySelector("#compatibility").value = compatibility;
        document.querySelector("#cable").value = cable;
        document.querySelector("#packageIncludes").value = packageIncludes;
        document.querySelector("#warranty").value = warranty;
      } else if (pc == "Laptop") {
        document.querySelector(".laptopSpecs").style =
          "display:flex;flex-direction:column;gap:15px";
        document.querySelector("#lprocessor").value = lprocessor;
        document.querySelector("#lram").value = lram;
        document.querySelector("#lstorage").value = lstorage;
        document.querySelector("#lbattery").value = lbattery;
        document.querySelector("#ldisplay").value = ldisplay;
        document.querySelector("#graphics").value = graphics;
        document.querySelector("#ports").value = ports;
        document.querySelector("#los").value = los;
        document.querySelector("#build").value = build;
        document.querySelector("#lconnectivity").value = lconnectivity;
        document.querySelector("#lwarranty").value = lwarranty;
      } else if (pc == "Earbud") {
        document.querySelector(".earbudSpecs").style =
          "display:flex;flex-direction:column;gap:15px";
        document.querySelector("#bluetoothVersion").value = bluetoothVersion;
        document.querySelector("#batteryLife").value = batteryLife;
        document.querySelector("#chargingTime").value = chargingTime;
        document.querySelector("#driverSize").value = driverSize;
        document.querySelector("#microphone").value = microphone;
        document.querySelector("#noiseCancellation").value = noiseCancellation;
        document.querySelector("#touchControls").value = touchControls;
        document.querySelector("#eiprating").value = eiprating;
        document.querySelector("#ecompatibility").value = ecompatibility;
        document.querySelector("#especialFeatures").value = especialFeatures;
        document.querySelector("#ewarranty").value = ewarranty;
      } else if (pc == "Powerbank") {
        document.querySelector(".powerbankSpecs").style =
          "display:flex;flex-direction:column;gap:15px";
        document.querySelector("#capacity").value = capacity;
        document.querySelector("#outputPort").value = outputPort;
        document.querySelector("#inputPort").value = inputPort;
        document.querySelector("#outputPower").value = outputPower;
        document.querySelector("#inputPower").value = inputPower;
        document.querySelector("#chargingTech").value = chargingTech;
        document.querySelector("#material").value = material;
        document.querySelector("#weight").value = weight;
        document.querySelector("#pcompatibility").value = pcompatibility;
        document.querySelector("#specialFeatures").value = specialFeatures;
        document.querySelector("#pwarranty").value = pwarranty;
      } else if (pc == "Smartwatch") {
        document.querySelector(".watchSpecs").style =
          "display:flex;flex-direction:column;gap:15px";
        document.querySelector("#wdisplay").value = wdisplay;
        document.querySelector("#resolution").value = resolution;
        document.querySelector("#wbatterylife").value = wbatteryLife;
        document.querySelector("#wos").value = wos;
        document.querySelector("#wconnectivity").value = wconnectivity;
        document.querySelector("#sensors").value = sensors;
        document.querySelector("#waterResistance").value = waterResistance;
        document.querySelector("#wcompatibility").value = wcompatibility;
        document.querySelector("#healthFeatures").value = healthFeatures;
        document.querySelector("#wspecialfeatures").value = wspecialFeatures;
        document.querySelector("#wwarranty").value = wwarranty;
      } else if (pc == "Cover") {
        // coverCount.style = "display:flex";
        // document.querySelector("#coverCount").value = models.length;
        // coverInput.style =
        //   "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
        // coverInput.innerHTML = "";
        // for (let i = 1; i <= models.length; i++) {
        //   const code = `
        //     <div style="display: flex;flex-direction:column;gap:10px;">
        //     <h2>Model ${i}:</h2>
        //       <label for="model${i}">
        //       <i class="fa-solid fa-mobile"></i>
        //       <input
        //         type="text"
        //         name="model${i}"
        //         id="model${i}"
        //         value="${models[i - 1]}"
        //         placeholder="Enter model ${i}"
        //       />
        //       </label>
        //     </div>`;
        //   coverInput.innerHTML += code;
        // }
        // const addBtn = document.createElement("button");
        // addBtn.id = "addModel";
        // addBtn.textContent = "Click to add a new model";
        // addBtn.addEventListener("click", addModel);
        // coverInput.appendChild(addBtn);
      } else if (pc == "Speaker") {
        document.querySelector(".speakerSpecs").style =
          "display:flex;flex-direction:column;gap:15px";
        document.querySelector("#smodel").value = smodel;
        document.querySelector("#speakerType").value = speakerType;
        document.querySelector("#soutputPower").value = soutputPower;
        document.querySelector("#sconnectivity").value = sconnectivity;
        document.querySelector("#sbluetoothRange").value = sbluetoothRange;
        document.querySelector("#sbatteryLife").value = sbatteryLife;
        document.querySelector("#splaybackTime").value = splaybackTime;
        document.querySelector("#schargingTime").value = schargingTime;
        document.querySelector("#swaterResistance").value = swaterResistance;
        document.querySelector("#sfrequencyResponse").value =
          sfrequencyResponse;
        document.querySelector("#sdimensions").value = sdimensions;
        document.querySelector("#sweight").value = sweight;
        document.querySelector("#spackageIncludes").value = spackageIncludes;
        document.querySelector("#swarranty").value = swarranty;
      } else if (pc == "SD Card") {
        variantCountt.style.display = "flex";
        variantCount.value = variant.length;
        variantInput.style =
          "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
        variantInput.innerHTML = "";
        for (let i = 1; i <= variant.length; i++) {
          const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
                <h2>Variant ${i}:</h2>
                <label for="searchName${i}">
                <i class="fa-solid fa-database"></i>
                <input
                  type="text"
                  name="searchName${i}"
                  id="searchName${i}"
                  value="${variant[i - 1].searchName}"
                  placeholder="Enter variant ${i}"
                />
                </label>
                <label for="variant${i}">
                <i class="fa-solid fa-database"></i>
                <input
                  type="text"
                  name="variant${i}"
                  id="variant${i}"
                  value="${variant[i - 1].variantName}"
                  placeholder="Enter variant ${i}"
                />
                </label>
                <label for="cost-price${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="text"
                  name="cost-price${i}"
                  id="cost-price${i}"
                  value="${variant[i - 1].variantCP}"
                  placeholder="Enter cost price ${i}"            
                />
                </label>
                <label for="selling-price${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="text"
                  name="selling-price${i}"
                  id="selling-price${i}"
                  value="${variant[i - 1].variantSP}"
                  placeholder="Enter selling price ${i}"            
                />
                </label>
                <label for="stock${i}">
                <i class="fa-solid fa-box"></i>
                <input
                  type="text"
                  name="stock${i}"
                  id="stock${i}"
                  value="${variant[i - 1].variantStock}"
                  placeholder="Enter stock ${i}"            
                />
                </label>
              </div>`;
          variantInput.innerHTML += code;
        }
        const addBtn = document.createElement("button");
        addBtn.id = "addVariant";
        addBtn.textContent = "Click to add a new variant";
        addBtn.addEventListener("click", addVariant);
        variantInput.appendChild(addBtn);
      } else if (pc == "Screen Protector") {
        // coverCount.style = "display:flex";
        // document.querySelector("#coverCount").value = models.length;
        // coverInput.style =
        //   "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
        // coverInput.innerHTML = "";
        // for (let i = 1; i <= models.length; i++) {
        //   const code = `
        //     <div style="display: flex;flex-direction:column;gap:10px;">
        //     <h2>Model ${i}:</h2>
        //       <label for="model${i}">
        //       <i class="fa-solid fa-mobile"></i>
        //       <input
        //         type="text"
        //         name="model${i}"
        //         id="model${i}"
        //         value="${models[i - 1]}"
        //         placeholder="Enter model ${i}"
        //       />
        //       </label>
        //     </div>`;
        //   coverInput.innerHTML += code;
        // }
        // const addBtn = document.createElement("button");
        // addBtn.id = "addModel";
        // addBtn.textContent = "Click to add a new model";
        // addBtn.addEventListener("click", addModel);
        // coverInput.appendChild(addBtn);

        quantityCountt.style.display = "flex";
        quantityCount.value = bundle.length;
        quantityInput.style =
          "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
        quantityInput.innerHTML = "";
        for (let i = 1; i <= bundle.length; i++) {
          const code = `
            <div style="display: flex;flex-direction:column;gap:10px;">
              <label for="bundle${i}">
              <i class="fa-solid fa-mobile"></i>
              <input
                type="text"
                name="bundle${i}"
                id="bundle${i}"
                value="${bundle[i - 1].bundle}"
                placeholder="Enter bundle ${i}"
              />
              </label>
              <label for="bundlePrice${i}">
              <i class="fa-solid fa-money-bill"></i>
              <input
                type="Number"
                name="bundlePrice${i}"
                id="bundlePrice${i}"
                value="${bundle[i - 1].bundlePrice}"
                placeholder="Enter bundle price ${i}"            
              />
              </label>
            </div>`;
          quantityInput.innerHTML += code;
        }
        const addBtnn = document.createElement("button");
        addBtnn.id = "addBundle";
        addBtnn.textContent = "Click to add a new bundle";
        addBtnn.addEventListener("click", addBundle);
        quantityInput.appendChild(addBtnn);
      }

      imagesArray.forEach((item, index) => {
        imageInput[
          index
        ].innerHTML = `<img src="${item.url}" alt="product-image" width="100%" height="100%" style="object-fit: cover"/><p style="position:absolute;top:0px;right:0px;cursor:pointer;font-size:15px;" onclick="deleteImage('${imageInput[index].id}', ${index})">X</p>`;
        imageInput[index].classList.remove("images");
        imagesInput[index].classList.remove("image-input");
        document
          .querySelectorAll(".upload-item")
          [index].setAttribute("data-public-id", item.publicId);
      });

      if (video) {
        videoInput.innerHTML = `<video src="${video.url}" width="100%" height="100%" style="object-fit: cover"></video><p style="position:absolute;top:5px;right:5px;cursor:pointer;background-color:red;color:white;border-radius:50%;font-size:17px;width:20px;height:20px;display:flex;justify-content:center;align-items:center;" onclick="deleteVideo('${videoInput.id}')">X</p>`;
        videoInput.classList.remove("video-upload");
        videoInput.setAttribute("data-public-id", video.publicId);
      }

      // Set up event listeners
      setupImageInputListeners();

      // Set form values
      document.querySelector("#modelName").value = modelName;
      document.querySelector("#product").value = productName;
      document.querySelector("#costPrice").value = cp;
      document.querySelector("#sellingPrice").value = sp;
      document.querySelector("#description").value = description;
      document.querySelector("#extras").value = extras;
      document.querySelector("#keyFeatures").value = keyFeatures;
      document.querySelector("#stock").value = stock;
      document.querySelector("#sold").value = sold;
      document.querySelector("#colorsNumber").value = color.length;
      document.querySelector("#hidden-id").value = id;

      //For colors
      loadColors(color);
      document.querySelectorAll(".color-image").forEach((input) => {
        input.addEventListener("change", handleColorImageChange);
      });
      // Load categories
      axios
        .get("/api/category")
        .then((response) => {
          const select = document.querySelector("#catDown");
          const myArray = response.data;
          myArray.forEach((item) => {
            if (item.categoryName == pc) {
              select.innerHTML += `<option value="${item.categoryName}" selected>${item.categoryName}</option>`;
              return;
            } else {
              select.innerHTML += `<option value="${item.categoryName}">${item.categoryName}</option>`;
            }
          });
          handleChange();
        })
        .catch((error) => {
          console.error("Error fetching categories:", error);
        });

      // Load subcategories
      axios
        .get("/api/subcategory")
        .then((response) => {
          const select = document.querySelector("#subDown");
          const myArray = response.data;
          myArray.forEach((item) => {
            if (item.subcategoryName == psc) {
              select.innerHTML += `<option value="${item.subcategoryName}" selected>${item.subcategoryName}</option>`;
            } else {
              select.innerHTML += `<option value="${item.subcategoryName}">${item.subcategoryName}</option>`;
            }
          });

          if (pc === "Cover" || pc == "Screen Protector") {
            handleCovermodel(existingModels);
          }
        })
        .catch((error) => {
          console.error("Error fetching categories:", error);
        });
    } catch (err) {
      console.log("Error while fetching product: ", err);
    }
  }

  fetchProductDetails();

  document.querySelector("#coverCount").addEventListener("input", () => {
    const count = document.querySelector("#coverCount").value;
    const input = document.querySelector(".coverInput");
    input.style =
      "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
    input.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
              <h2>Model ${i}:</h2>
                <label for="model${i}">
                <i class="fa-solid fa-mobile"></i>
                <input
                  type="text"
                  name="model${i}"
                  id="model${i}"
                  placeholder="Enter model ${i}"
                />
                </label>
              </div>`;
      input.innerHTML += code;
    }
  });

  variantCount.addEventListener("input", () => {
    const count = variantCount.value;
    const variantInput = document.querySelector(".variantInput");
    variantInput.style =
      "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
    variantInput.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
                <h2>Variant ${i}:</h2>
                <label for="searchName${i}">
                <i class="fa-solid fa-database"></i>
                <input
                  type="text"
                  name="searchName${i}"
                  id="searchName${i}"
                  placeholder="Enter variant search name ${i}"
                />
                </label>
                <label for="variant${i}">
                <i class="fa-solid fa-database"></i>
                <input
                  type="text"
                  name="variant${i}"
                  id="variant${i}"
                  placeholder="Enter variant ${i}"
                />
                </label>
                <label for="cost-price${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="text"
                  name="cost-price${i}"
                  id="cost-price${i}"
                  placeholder="Enter cost price ${i}"            
                />
                </label>
                <label for="selling-price${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="text"
                  name="selling-price${i}"
                  id="selling-price${i}"
                  placeholder="Enter selling price ${i}"            
                />
                </label>
                <label for="stock${i}">
                <i class="fa-solid fa-box"></i>
                <input
                  type="text"
                  name="stock${i}"
                  id="stock${i}"
                  placeholder="Enter stock ${i}"            
                />
                </label>
              </div>`;
      variantInput.innerHTML += code;
    }
  });

  quantityCount.addEventListener("input", () => {
    const count = quantityCount.value;
    quantityInput.style =
      "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
    quantityInput.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const code = `
              <div style="display: flex;flex-direction:column;gap:10px;position:relative">
                <label for="bundle${i}">
                <i class="fa-solid fa-mobile"></i>
                <input
                  type="text"
                  name="bundle${i}"
                  id="bundle${i}"
                  placeholder="Enter bundle ${i}"
                />
                </label>
                <label for="bundlePrice${i}">
                <i class="fa-solid fa-money-bill"></i>
                <input
                  type="Number"
                  name="bundlePrice${i}"
                  id="bundlePrice${i}"
                  placeholder="Enter bundle price ${i}"
                />
                </label>
              </div>`;
      quantityInput.innerHTML += code;
    }

    const addBtn = document.createElement("button");
    addBtn.id = "addBundle";
    addBtn.textContent = "Click to add a new bundle";
    addBtn.addEventListener("click", addBundle);
    quantityInput.appendChild(addBtn);
  });
}

// Initialize the page when loaded
initPage();

// Delete image function
function deleteImage(elementId, index) {
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  document.querySelector(".delete-loader").innerHTML = "Deleting Image...";
  const imageDiv = document.getElementById(elementId);
  const publicId = imageDiv.getAttribute("data-public-id"); // Get Cloudinary public_id

  if (!publicId) {
    alert("Public ID not found.");
    return;
  }

  axios
    .delete(`/api/delete-image/${publicId}`)
    .then((response) => {
      alert(response.data.message);
    })
    .then(() => {
      console.log(document.querySelectorAll(".image-input"));
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";

      // Clear the image container completely
      imageDiv.innerHTML = "+";
      imageDiv.classList.add("images");
      imageDiv.setAttribute("data-public-id", ""); // Clear public_id attribute

      // Reset the file input
      const imageInput = document.querySelector(`#images${index + 1}`);
      if (imageInput) {
        imageInput.value = ""; // Clear the file input
        imageInput.classList.add("image-input");
        imageInput.name = `image${index + 1}`; // Ensure the name attribute is set correctly
      }

      // Re-setup the event listeners
      setupImageInputListeners();
    })
    .catch((error) => {
      alert("Failed to delete image.");
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
      console.error("Error:", error);
    });
}

function deleteVideo(elementId) {
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  const videoDiv = document.getElementById(elementId);
  const publicId = videoDiv.getAttribute("data-public-id"); // Get Cloudinary public_id

  if (!publicId) {
    alert("Public ID not found.");
    document.querySelector("main").style = "opacity: 1";
    document.querySelector(".delete-loader").style = "display: none";
    return;
  }

  axios
    .delete(`/api/delete-video/${publicId}`)
    .then((response) => {
      alert(response.data.message);
      // Clear the video container
      videoDiv.innerHTML = "+";
      videoDiv.classList.add("video-upload-container");
      videoDiv.removeAttribute("data-public-id");
      videoDiv.classList.add("video-upload");

      // Reset the video input if it exists
      const videoInput = document.querySelector("#video");
      if (videoInput) {
        videoInput.value = ""; // Clear the file input
      }
    })
    .catch((error) => {
      alert(
        "Failed to delete video: " +
          (error.response?.data?.message || error.message)
      );
      console.error("Error:", error);
    })
    .finally(() => {
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
    });
}

// Form submission
document.querySelector("#submit").addEventListener("click", async (e) => {
  e.preventDefault();
  isFormDirty = false;
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  document.querySelector(".delete-loader").innerHTML = "Updating Product...";

  // Get product details
  const modelName = document.querySelector("#modelName").value.trim();
  const name = document.querySelector("#product").value.trim();
  const costPrice = document.querySelector("#costPrice").value.trim();
  const sellingPrice = document.querySelector("#sellingPrice").value.trim();
  const parentCategory = document.querySelector("#catDown").value.trim();
  const parentSubcategory = document.querySelector("#subDown").value.trim();
  const extras = document.querySelector("#extras").value.trim();
  const description = document.querySelector("#description").value.trim();
  const keyFeatures = document.querySelector("#keyFeatures").value;
  const stock = document.querySelector("#stock").value.trim();
  const sold = document.querySelector("#sold").value.trim();
  const processor = document.querySelector("#processor").value.trim();
  const ram = document.querySelector("#ram").value.trim();
  const storage = document.querySelector("#storage").value.trim();
  const battery = document.querySelector("#battery").value.trim();
  const display = document.querySelector("#display").value.trim();
  const camera = document.querySelector("#camera").value.trim();
  const frontCamera = document.querySelector("#frontCamera").value.trim();
  const os = document.querySelector("#os").value.trim();
  const charging = document.querySelector("#charging").value.trim();
  const connectivity = document.querySelector("#connectivity").value.trim();
  const ipRating = document.querySelector("#ipRating").value.trim();
  const mwarranty = document.querySelector("#mwarranty").value.trim();
  const model = document.querySelector("#model").value.trim();
  const chargeInput = document.querySelector("#chargeInput").value.trim();
  const chargeOutput = document.querySelector("#chargeOutput").value.trim();
  const chargeType = document.querySelector("#chargeType").value.trim();
  const connectorType = document.querySelector("#connectorType").value.trim();
  const compatibility = document.querySelector("#compatibility").value.trim();
  const cable = document.querySelector("#cable").value.trim();
  const packageIncludes = document
    .querySelector("#packageIncludes")
    .value.trim();
  const warranty = document.querySelector("#warranty").value.trim();
  const lprocessor = document.querySelector("#lprocessor").value.trim();
  const lram = document.querySelector("#lram").value.trim();
  const lstorage = document.querySelector("#lstorage").value.trim();
  const lbattery = document.querySelector("#lbattery").value.trim();
  const ldisplay = document.querySelector("#ldisplay").value.trim();
  const graphics = document.querySelector("#graphics").value.trim();
  const ports = document.querySelector("#ports").value.trim();
  const los = document.querySelector("#los").value.trim();
  const build = document.querySelector("#build").value.trim();
  const lconnectivity = document.querySelector("#lconnectivity").value.trim();
  const lwarranty = document.querySelector("#lwarranty").value.trim();
  const bluetoothVersion = document
    .querySelector("#bluetoothVersion")
    .value.trim();
  const batteryLife = document.querySelector("#batteryLife").value.trim();
  const chargingTime = document.querySelector("#chargingTime").value.trim();
  const driverSize = document.querySelector("#driverSize").value.trim();
  const microphone = document.querySelector("#microphone").value.trim();
  const noiseCancellation = document
    .querySelector("#noiseCancellation")
    .value.trim();
  const touchControls = document.querySelector("#touchControls").value.trim();
  const eiprating = document.querySelector("#eiprating").value.trim();
  const ecompatibility = document.querySelector("#ecompatibility").value.trim();
  const especialFeatures = document
    .querySelector("#especialFeatures")
    .value.trim();
  const ewarranty = document.querySelector("#ewarranty").value.trim();
  const capacity = document.querySelector("#capacity").value.trim();
  const outputPort = document.querySelector("#outputPort").value.trim();
  const inputPort = document.querySelector("#inputPort").value.trim();
  const outputPower = document.querySelector("#outputPower").value.trim();
  const inputPower = document.querySelector("#inputPower").value.trim();
  const chargingTech = document.querySelector("#chargingTech").value.trim();
  const material = document.querySelector("#material").value.trim();
  const weight = document.querySelector("#weight").value.trim();
  const pcompatibility = document.querySelector("#pcompatibility").value.trim();
  const specialFeatures = document
    .querySelector("#specialFeatures")
    .value.trim();
  const pwarranty = document.querySelector("#pwarranty").value.trim();
  const wdisplay = document.querySelector("#wdisplay").value.trim();
  const resolution = document.querySelector("#resolution").value.trim();
  const wbatteryLife = document.querySelector("#wbatterylife").value.trim();
  const wos = document.querySelector("#wos").value.trim();
  const wconnectivity = document.querySelector("#wconnectivity").value.trim();
  const sensors = document.querySelector("#sensors").value.trim();
  const waterResistance = document
    .querySelector("#waterResistance")
    .value.trim();
  const wcompatibility = document.querySelector("#wcompatibility").value.trim();
  const healthFeatures = document.querySelector("#healthFeatures").value.trim();
  const wspecialFeatures = document
    .querySelector("#wspecialfeatures")
    .value.trim();
  const wwarranty = document.querySelector("#wwarranty").value.trim();
  const smodel = document.querySelector("#smodel").value.trim();
  const speakerType = document.querySelector("#speakerType").value.trim();
  const soutputPower = document.querySelector("#soutputPower").value.trim();
  const sconnectivity = document.querySelector("#sconnectivity").value.trim();
  const sbluetoothRange = document
    .querySelector("#sbluetoothRange")
    .value.trim();
  const sbatteryLife = document.querySelector("#sbatteryLife").value.trim();
  const splaybackTime = document.querySelector("#splaybackTime").value.trim();
  const schargingTime = document.querySelector("#schargingTime").value.trim();
  const swaterResistance = document
    .querySelector("#swaterResistance")
    .value.trim();
  const sfrequencyResponse = document
    .querySelector("#sfrequencyResponse")
    .value.trim();
  const sdimensions = document.querySelector("#sdimensions").value.trim();
  const sweight = document.querySelector("#sweight").value.trim();
  const spackageIncludes = document
    .querySelector("#spackageIncludes")
    .value.trim();
  const swarranty = document.querySelector("#swarranty").value.trim();

  const productId = document.querySelector("#hidden-id").value;

  const formData = new FormData();

  formData.append("modelName", modelName);
  formData.append("name", name);
  formData.append("costPrice", costPrice);
  formData.append("sellingPrice", sellingPrice);
  formData.append("parentCategory", parentCategory);
  formData.append("parentSubcategory", parentSubcategory);
  formData.append("extras", extras);
  formData.append("description", description);
  formData.append("keyFeatures", keyFeatures);
  formData.append("stock", stock);
  formData.append("sold", sold);
  formData.append("productId", productId);
  formData.append("processor", processor);
  formData.append("ram", ram);
  formData.append("storage", storage);
  formData.append("battery", battery);
  formData.append("display", display);
  formData.append("camera", camera);
  formData.append("frontCamera", frontCamera);
  formData.append("os", os);
  formData.append("charging", charging);
  formData.append("connectivity", connectivity);
  formData.append("ipRating", ipRating);
  formData.append("mwarranty", mwarranty);

  formData.append("model", model);
  formData.append("chargeInput", chargeInput);
  formData.append("chargeOutput", chargeOutput);
  formData.append("chargeType", chargeType);
  formData.append("connectorType", connectorType);
  formData.append("compatibility", compatibility);
  formData.append("cable", cable);
  formData.append("packageIncludes", packageIncludes);
  formData.append("warranty", warranty);

  formData.append("lprocessor", lprocessor);
  formData.append("lram", lram);
  formData.append("lstorage", lstorage);
  formData.append("lbattery", lbattery);
  formData.append("ldisplay", ldisplay);
  formData.append("graphics", graphics);
  formData.append("ports", ports);
  formData.append("los", los);
  formData.append("build", build);
  formData.append("lconnectivity", lconnectivity);
  formData.append("lwarranty", lwarranty);

  formData.append("bluetoothVersion", bluetoothVersion);
  formData.append("batteryLife", batteryLife);
  formData.append("chargingTime", chargingTime);
  formData.append("driverSize", driverSize);
  formData.append("microphone", microphone);
  formData.append("noiseCancellation", noiseCancellation);
  formData.append("touchControls", touchControls);
  formData.append("eiprating", eiprating);
  formData.append("ecompatibility", ecompatibility);
  formData.append("especialFeatures", especialFeatures);
  formData.append("ewarranty", ewarranty);

  formData.append("capacity", capacity);
  formData.append("outputPort", outputPort);
  formData.append("inputPort", inputPort);
  formData.append("outputPower", outputPower);
  formData.append("inputPower", inputPower);
  formData.append("chargingTech", chargingTech);
  formData.append("material", material);
  formData.append("weight", weight);
  formData.append("pcompatibility", pcompatibility);
  formData.append("specialFeatures", specialFeatures);
  formData.append("pwarranty", pwarranty);

  formData.append("wdisplay", wdisplay);
  formData.append("resolution", resolution);
  formData.append("wbatteryLife", wbatteryLife);
  formData.append("wos", wos);
  formData.append("wconnectivity", wconnectivity);
  formData.append("sensors", sensors);
  formData.append("waterResistance", waterResistance);
  formData.append("wcompatibility", wcompatibility);
  formData.append("healthFeatures", healthFeatures);
  formData.append("wspecialFeatures", wspecialFeatures);
  formData.append("wwarranty", wwarranty);

  formData.append("smodel", smodel);
  formData.append("speakerType", speakerType);
  formData.append("soutputPower", soutputPower);
  formData.append("sconnectivity", sconnectivity);
  formData.append("sbluetoothRange", sbluetoothRange);
  formData.append("sbatteryLife", sbatteryLife);
  formData.append("splaybackTime", splaybackTime);
  formData.append("schargingTime", schargingTime);
  formData.append("swaterResistance", swaterResistance);
  formData.append("sfrequencyResponse", sfrequencyResponse);
  formData.append("sdimensions", sdimensions);
  formData.append("sweight", sweight);
  formData.append("spackageIncludes", spackageIncludes);
  formData.append("swarranty", swarranty);

  // General product images
  const images = [];
  for (let i = 1; i <= 10; i++) {
    const input = document.querySelector(`#images${i}`);
    const file = input?.files[0];
    // If there's no new file uploaded, check if there's an existing image
    const imageContainer = document.querySelector(`#upload-item${i}`);
    const hasExistingImage = imageContainer?.querySelector("img") !== null;

    // Push the file or a placeholder if there's an existing image
    if (file) {
      images.push({ file, index: i });
    } else if (!hasExistingImage) {
      // If no file and no existing image, push empty string to maintain position
      images.push({ file: "", index: i });
    }
  }

  // Append images to formData, maintaining their position
  images.forEach(({ file, index }) => {
    formData.append(`image${index}`, file);
  });

  // Append video to formData
  const videoInput = document.querySelector("#video1");
  if (videoInput && videoInput.files && videoInput.files[0]) {
    formData.append("video", videoInput.files[0]);
  }

  // Dynamic colors and color-images
  // Only select text inputs (not file inputs)
  const colorInputs = document.querySelectorAll(
    'input[type="text"][id^="color"]'
  );

  colorInputs.forEach((colorInput) => {
    const match = colorInput.id.match(/\d+/); // safer: store match result
    if (match) {
      const colorId = match[0];
      const colorName = colorInput.value.trim();
      const colorImageInput = document.querySelector(`#color-image${colorId}`);

      if (colorName) {
        formData.append(`colorName${colorId}`, colorName);
      }

      // Only append colorImage if a file is selected
      if (
        colorImageInput &&
        colorImageInput.files &&
        colorImageInput.files.length > 0
      ) {
        formData.append(`colorImage${colorId}`, colorImageInput.files[0]);
      }
    }
  });

  const variantInputs = document.querySelectorAll(
    'input[type="text"][id^="variant"]'
  );

  variantInputs.forEach((variantInput) => {
    const variantId = variantInput.id.match(/\d+/)?.[0]; // Extract number like 1, 2, etc.
    if (variantId) {
      const searchName = document
        .querySelector(`#searchName${variantId}`)
        .value.trim();
      const variantName = variantInput.value.trim();
      const cp = document.querySelector(`#cost-price${variantId}`).value.trim();
      const sp = document
        .querySelector(`#selling-price${variantId}`)
        .value.trim();
      const stock = document.querySelector(`#stock${variantId}`).value.trim();

      if (variantName && cp && sp && stock) {
        formData.append(`searchName${variantId}`, searchName);
        formData.append(`variant${variantId}`, variantName);
        formData.append(`cost-price${variantId}`, cp);
        formData.append(`selling-price${variantId}`, sp);
        formData.append(`stock${variantId}`, stock);
      }
    }
  });
  // const coverInputs = document.querySelectorAll(
  //   'input[type="text"][id^="model"]'
  // );

  // coverInputs.forEach((coverInput) => {
  //   const index = coverInput.id.match(/\d+/)?.[0]; // Extract number like 1, 2, etc.
  //   if (index) {
  //     const modelName = coverInput.value.trim();

  //     if (modelName) {
  //       formData.append(`model${index}`, modelName);
  //     }
  //   }
  // });

  document
    .querySelectorAll('input[name="models[]"]:checked')
    .forEach((checkbox) => {
      formData.append("models[]", checkbox.value);
    });

  const quantityInputs = document.querySelectorAll(
    'input[type="text"][id^="bundle"]'
  );

  quantityInputs.forEach((quantityInput) => {
    const index = quantityInput.id.match(/\d+/)?.[0]; // Extract number like 1, 2, etc.
    if (index) {
      const bundle = quantityInput.value.trim();
      const bundlePrice = document
        .querySelector(`#bundlePrice${index}`)
        .value.trim();

      if (bundle && bundlePrice) {
        formData.append(`bundle${index}`, bundle);
        formData.append(`bundlePrice${index}`, bundlePrice);
      }
    }
  });
  // just before the axios.put call:
  const sizeInputs = document.querySelectorAll(
    'input[type="text"][id^="size"]'
  );
  sizeInputs.forEach((el) => {
    const idx = el.id.match(/\d+/)?.[0];
    const val = el.value.trim();
    if (idx && val) {
      formData.append(`sizeName${idx}`, val);
    }
  });

  try {
    const response = await axios.put("/api/product", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    alert(response.data.message);
    window.close();
  } catch (error) {
    console.error("Error updating product:", error.response?.data || error);
    alert(error.response?.data?.message || "Failed to update product.");
    window.location.href = "/admin";
  }
});

function handleChange() {
  const select = document.querySelector("#catDown");
  const value = select.value;

  const specMap = {
    Phone: ".phoneSpecs",
    Charger: ".chargerSpecs",
    Laptop: ".laptopSpecs",
    Powerbank: ".powerbankSpecs",
    Earbud: ".earbudSpecs",
    Smartwatch: ".watchSpecs",
    Speaker: ".speakerSpecs",
  };

  // Hide all spec sections first
  Object.values(specMap).forEach((selector) => {
    document.querySelector(selector).style.display = "none";
  });

  // Show the selected spec section if it exists
  if (specMap[value]) {
    const selected = document.querySelector(specMap[value]);
    selected.style.display = "flex";
    selected.style.flexDirection = "column";
    selected.style.gap = "15px";
  }

  // Toggle variantCountt and variantInput only for Phone
  if (value === "Phone" || value === "SD Card") {
    variantCountt.style.display = "flex";
    if (variantInput) variantInput.style.display = "block";
    // coverCount.style.display = "none";
    // if (coverInput) coverInput.style.display = "none";
    quantityCountt.style.display = "none";
    if (quantityInput) quantityInput.style.display = "none";
  } else if (value == "Cover") {
    // coverCount.style.display = "flex";
    // if (coverInput) coverInput.style.display = "block";
    variantCountt.style.display = "none";
    if (variantInput) variantInput.style.display = "none";
    quantityCountt.style.display = "none";
    if (quantityInput) quantityInput.style.display = "none";
  } else if (value == "Screen Protector") {
    // coverCount.style.display = "flex";
    // if (coverInput) coverInput.style.display = "block";
    variantCountt.style.display = "none";
    if (variantInput) variantInput.style.display = "none";
    quantityCountt.style.display = "flex";
    if (quantityInput) quantityInput.style.display = "block";
  } else {
    variantCountt.style.display = "none";
    if (variantInput) variantInput.style.display = "none";
    // coverCount.style.display = "none";
    // if (coverInput) coverInput.style.display = "none";
    quantityCountt.style.display = "none";
    if (quantityInput) quantityInput.style.display = "none";
  }
}

function deleteColor(index) {
  const productId = url.searchParams.get("id");
  if (!productId) {
    alert("Product ID not found");
    return;
  }

  // Show loading state
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";

  axios
    .delete(`/api/delete-color/${productId}/${index - 1}`)
    .then((response) => {
      alert(response.data.message);
      // Reload the page to show updated colors
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
      const ci = document.querySelector(".colorInput div");
      ci.querySelector("div").remove();
    })
    .catch((error) => {
      alert(
        "Failed to delete color: " +
          (error.response?.data?.message || error.message)
      );
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
    });
}
function deleteSize(index) {
  const productId = url.searchParams.get("id");
  if (!productId) {
    alert("Product ID not found");
    return;
  }

  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";

  axios
    .delete(`/api/delete-size/${productId}/${index - 1}`)
    .then((response) => {
      alert(response.data.message);
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";

      // remove the specific DOM block (1-based -> 0-based)
      const rows = document.querySelectorAll(".sizesInput .size-row");
      const row = rows[index - 1];
      row?.remove();

      // update the heading numbers (optional)
      document.querySelectorAll(".sizesInput .size-row h2").forEach((h, i) => {
        h.textContent = `Size ${i + 1}:`;
      });
    })
    .catch((error) => {
      alert(
        "Failed to delete size: " +
          (error.response?.data?.message || error.message)
      );
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
    });
}

async function handleCovermodel(selectedModels = []) {
  const subDown = document.getElementById("subDown");
  const phoneModel = document.getElementById("phoneModel");
  const parentCategory = document.querySelector("#catDown");

  if (!phoneModel) {
    console.error("Missing #phoneModel container in DOM");
    return;
  }

  // Only run for Cover
  if (
    !parentCategory ||
    (parentCategory.value !== "Cover" &&
      parentCategory.value !== "Screen Protector")
  ) {
    console.log("Not a cover");
    phoneModel.style.display = "none";
    return;
  }

  if (!subDown || !subDown.value) {
    phoneModel.textContent = "Select a brand first.";
    phoneModel.style.display = "";
    return;
  }

  try {
    const { data } = await axios.get(`/api/phonemodels/brand/${subDown.value}`);

    const models = Array.isArray(data?.models) ? data.models : [];

    if (!models.length) {
      phoneModel.textContent = "No models found for this brand.";
      phoneModel.style.display = "";
      return;
    }

    const selectedSet = new Set(
      (selectedModels || []).map((m) => String(m).trim())
    );

    const frag = document.createDocumentFragment();

    models.forEach((model, i) => {
      const safeId =
        "model_" +
        i +
        "_" +
        String(model)
          .toLowerCase()
          .replace(/[^a-z0-9]+/gi, "_");

      // <label><input type="checkbox" ... /><span>Model Name</span></label>
      const label = document.createElement("label");
      label.setAttribute("for", safeId);
      label.className = "model-option"; // optional class for styling
      label.style.flexDirection = "row";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = safeId;
      input.name = "models[]"; // so backend gets an array
      input.value = model;

      if (selectedSet.has(String(model).trim())) {
        input.checked = true;
      }

      const text = document.createElement("span");
      text.textContent = model;

      label.appendChild(input);
      label.appendChild(text);

      frag.appendChild(label);
    });

    phoneModel.innerHTML = `<i class="fa-solid fa-cube"></i> Choose phone models: <br />`;
    phoneModel.appendChild(frag);
    phoneModel.style.display = "";
  } catch (err) {
    console.error("Failed to fetch phone models:", err);
    phoneModel.textContent = "Could not load models. Please try again.";
    phoneModel.style.display = "";
  }
}
