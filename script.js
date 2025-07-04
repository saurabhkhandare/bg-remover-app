// === DOM Elements ===
const fileInput = document.getElementById("fileInput");
const previewArea = document.getElementById("previewArea");
const removeBtn = document.getElementById("removeBtn");
const removeBtnText = document.getElementById("removeBtnText");
const removeBtnSpinner = document.getElementById("removeBtnSpinner");
const downloadBtn = document.getElementById("downloadBtn");
const downloadBtnText = document.getElementById("downloadBtnText");
const downloadBtnSpinner = document.getElementById("downloadBtnSpinner");
const uploadLabel = document.getElementById("uploadLabel");
const uploadText = document.getElementById("uploadText");

// === State ===
let originalFile = null;
let resultBlob = null;

// --- Handle file input ---
fileInput.addEventListener("change", handleFileChange);

function handleFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!/^image\/(png|jpeg)$/.test(file.type)) {
    showError("Only PNG or JPG images allowed.");
    fileInput.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showError("Image must be less than 5MB.");
    fileInput.value = "";
    return;
  }
  originalFile = file;
  resultBlob = null;
  showPreview(file);
  removeBtn.disabled = false;
  downloadBtn.style.display = "none";
}

// --- Show image preview ---
function showPreview(file) {
  const reader = new FileReader();
  previewArea.innerHTML = "";
  reader.onload = function (evt) {
    const img = document.createElement("img");
    img.src = evt.target.result;
    img.alt = "Uploaded image preview";
    previewArea.appendChild(img);
  };
  reader.readAsDataURL(file);
}

// --- Show error in preview area ---
function showError(msg) {
  previewArea.innerHTML = `<span style="color:#e24d4d;">${msg}</span>`;
  removeBtn.disabled = true;
  downloadBtn.style.display = "none";
}

// --- Remove background button ---
removeBtn.addEventListener("click", async function () {
  if (!originalFile) return;
  removeBtn.disabled = true;
  removeBtnSpinner.style.display = "inline-block";
  removeBtnText.textContent = "Processing...";
  downloadBtn.style.display = "none";
  showProcessing();

  try {
    // Prepare API request for api4.ai
    const formData = new FormData();
    formData.append("image", originalFile);

    // Call api4.ai Background Removal API
    const res = await fetch(
      "https://demo.api4ai.cloud/img-bg-removal/v1/general/results",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error("API Error: " + (errText || res.status));
    }
    const data = await res.json();

    // Extract base64 PNG from response
    const base64png = data.results?.[0]?.entities?.[0]?.image;
    if (!base64png) {
      throw new Error("No result image found.");
    }

    // Convert base64 to Blob
    const byteString = atob(base64png);
    const arrayBuffer = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      arrayBuffer[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: "image/png" });
    resultBlob = blob;
    showResult(blob);
    removeBtn.disabled = false;
  } catch (err) {
    showError("Failed: " + (err.message || "Unknown error"));
    removeBtn.disabled = false;
  } finally {
    removeBtnSpinner.style.display = "none";
    removeBtnText.textContent = "Remove Background";
  }
});

// --- Show processing animation ---
function showProcessing() {
  previewArea.innerHTML = `
        <div class="processing">
          <div class="spinner"></div>
          Removing background...
        </div>
      `;
}

// --- Show result image and enable download ---
function showResult(blob) {
  const url = URL.createObjectURL(blob);
  previewArea.innerHTML = "";
  const img = document.createElement("img");
  img.src = url;
  img.alt = "Background removed";
  previewArea.appendChild(img);

  downloadBtn.style.display = "inline-block";
  downloadBtnText.textContent = "Download Image";
  downloadBtnSpinner.style.display = "none";
}

// --- Download button (robust file download) ---
downloadBtn.addEventListener("click", function (e) {
  if (!resultBlob) return;
  // Animate button
  downloadBtn.disabled = true;
  downloadBtnText.textContent = "Preparing...";
  downloadBtnSpinner.style.display = "inline-block";

  setTimeout(() => {
    // Create a Blob URL and trigger download
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bg-removed.png";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url); // Clean up
    }, 100);
    // Animate back
    downloadBtn.disabled = false;
    downloadBtnText.textContent = "Download Image";
    downloadBtnSpinner.style.display = "none";
  }, 400);
});

// --- Drag and drop support for upload area ---
uploadLabel.addEventListener("dragover", function (e) {
  e.preventDefault();
  uploadLabel.style.borderColor = "#43b97f";
});
uploadLabel.addEventListener("dragleave", function (e) {
  e.preventDefault();
  uploadLabel.style.borderColor = "";
});
uploadLabel.addEventListener("drop", function (e) {
  e.preventDefault();
  uploadLabel.style.borderColor = "";
  const files = e.dataTransfer.files;
  if (files && files[0]) {
    fileInput.files = files;
    fileInput.dispatchEvent(new Event("change"));
  }
});

// --- Reset on new upload ---
uploadLabel.addEventListener("click", function () {
  fileInput.value = "";
});

// --- Responsive: reset preview area on resize (optional, keeps UI clean) ---
window.addEventListener("resize", function () {
  // No action needed; CSS handles responsiveness
});

// --- Initial UI state ---
removeBtn.disabled = true;
downloadBtn.style.display = "none";
