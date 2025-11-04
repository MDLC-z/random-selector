import "./index.css";

const folderPathInput = document.getElementById("folderPath");
const browseButton = document.getElementById("browseButton");
const addFavoriteButton = document.getElementById("addFavoriteButton");
const favoritePathsList = document.getElementById("favoritePathsList");
const amountInput = document.getElementById("amountInput");
const selectRandomButton = document.getElementById("selectRandomButton");
const selectedFilesList = document.getElementById("selectedFilesList");
const filterChipsContainer = document.getElementById("filter-chips-container");

let favoritePaths = [];
let activeFilters = [];

// Collapse functionality
document.querySelectorAll(".collapse-button").forEach((button) => {
  button.addEventListener("click", () => {
    const content = button.parentElement.nextElementSibling;
    content.classList.toggle("collapsed");
    button.textContent = content.classList.contains("collapsed") ? "+" : "-";
  });
});

// Opens a folder dialog and sets the selected path in the input field.
browseButton.addEventListener("click", async () => {
  const path = await window.electronAPI.openFolder();
  if (path) {
    folderPathInput.value = path;
    updateFiltersAndChips(path);
  }
});

// Fetches all files from a path and updates the filter chips.
async function updateFiltersAndChips(path) {
  try {
    const files = await window.electronAPI.getFiles(path);
    updateFilterChips(files);
  } catch (error) {
    console.error("Error updating filter chips:", error);
    // Silently fail, or show a non-blocking notification
  }
}

// Adds the current folder path to the list of favorite paths.
addFavoriteButton.addEventListener("click", () => {
  const path = folderPathInput.value;
  if (path && !favoritePaths.includes(path)) {
    favoritePaths.push(path);
    saveFavoritePaths();
    renderFavoritePaths();
  }
});

// Clicking a favorite path sets it as the current folder path.
favoritePathsList.addEventListener("click", (event) => {
  if (event.target.tagName === "SPAN") {
    const path = event.target.textContent;
    folderPathInput.value = path;
    updateFiltersAndChips(path);
  }
  if (event.target.tagName === "BUTTON") {
    const pathToRemove =
      event.target.parentElement.querySelector("span").textContent;
    favoritePaths = favoritePaths.filter((p) => p !== pathToRemove);
    saveFavoritePaths();
    renderFavoritePaths();
  }
});

// Selects a random number of files from the specified folder and displays them.
selectRandomButton.addEventListener("click", async () => {
  const path = folderPathInput.value;
  const amount = parseInt(amountInput.value, 10);

  if (!path || isNaN(amount) || amount <= 0) {
    alert(
      "Please provide a valid folder path and a positive number of files to select."
    );
    return;
  }

  try {
    const files = await window.electronAPI.getFiles(path);
    if (files.length === 0) {
      alert("The selected folder is empty.");
      return;
    }

    const filteredFiles =
      activeFilters.length === 0
        ? files
        : files.filter((file) =>
            activeFilters.includes(file.slice(file.lastIndexOf(".")))
          );

    if (filteredFiles.length === 0) {
      alert("No files match the current filter.");
      return;
    }

    const selectedFiles = getRandomFiles(filteredFiles, amount);
    renderSelectedFiles(selectedFiles, path);
  } catch (error) {
    console.error("Error selecting random files:", error);
    alert(`Error: ${error.message}`);
  }
});

// Renders the list of favorite paths
function renderFavoritePaths() {
  favoritePathsList.innerHTML = "";
  favoritePaths.forEach((path) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${path}</span> <button>❌</button>`;
    favoritePathsList.appendChild(li);
  });
}

// Renders the list of randomly selected files.
async function renderSelectedFiles(files, basePath) {
  selectedFilesList.innerHTML = "";

  const filteredFiles =
    activeFilters.length === 0
      ? files
      : files.filter((file) =>
          activeFilters.includes(file.slice(file.lastIndexOf(".")))
        );

  for (const file of filteredFiles) {
    const li = document.createElement("li");
    const fullPath = await window.electronAPI.joinPath(basePath, file);
    const dataUrl = await window.electronAPI.readFile(fullPath);

    let mediaElement = "";
    if (dataUrl) {
      if (isImage(file)) {
        mediaElement = `<img src="${dataUrl}" alt="${file}" style="max-width: 100px; max-height: 100px;" />`;
      } else if (isVideo(file)) {
        mediaElement = `<video src="${dataUrl}" controls style="max-width: 100px; max-height: 100px;"></video>`;
      }
    }

    li.innerHTML = `
      <div class="media-preview">${mediaElement}</div>
      <div class="file-info">
        <span>${file}</span>
        <button class="open-file-button" data-path="${fullPath}">Open</button>
      </div>
    `;
    selectedFilesList.appendChild(li);
  }

  document.querySelectorAll(".open-file-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const path = event.target.getAttribute("data-path");
      window.electronAPI.openFile(path);
    });
  });
}

// Checks if a file is an image based on its extension.
function isImage(fileName) {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return imageExtensions.includes(extension);
}

//Checks if a file is a video based on its extension.
function isVideo(fileName) {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return videoExtensions.includes(extension);
}

// Selects a specified number of random items from an array.
function getRandomFiles(array, numItems) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numItems);
}

// Updates the filter chips based on the selected files.
function updateFilterChips(files) {
  filterChipsContainer.innerHTML = "";
  const extensions = [
    ...new Set(files.map((file) => file.slice(file.lastIndexOf(".")))),
  ];

  extensions.forEach((ext) => {
    const chip = document.createElement("div");
    chip.classList.add("filter-chip");
    chip.textContent = ext;
    chip.dataset.ext = ext;
    if (activeFilters.includes(ext)) {
      chip.classList.add("active");
    }
    filterChipsContainer.appendChild(chip);
  });
}

// Handles clicks on the filter chips.
filterChipsContainer.addEventListener("click", (event) => {
  if (event.target.classList.contains("filter-chip")) {
    const ext = event.target.dataset.ext;
    if (activeFilters.includes(ext)) {
      activeFilters = activeFilters.filter((f) => f !== ext);
      event.target.classList.remove("active");
    } else {
      activeFilters.push(ext);
      event.target.classList.add("active");
    }
  }
});

// Saves the favorite paths to persistent storage.
function saveFavoritePaths() {
  window.electronAPI.saveData({ favoritePaths });
}

// Loads favorite paths from persistent storage on startup.
async function loadFavoritePaths() {
  const data = await window.electronAPI.loadData();
  if (data && data.favoritePaths) {
    favoritePaths = data.favoritePaths;
    renderFavoritePaths();
  }
}

// Initial Load
loadFavoritePaths();
