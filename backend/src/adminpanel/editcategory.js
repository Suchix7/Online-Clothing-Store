const url = new URL(window.location.href);

// Get the 'id' parameter
const categoryName = url.searchParams.get("category");
const id = url.searchParams.get("id");
const image = url.searchParams.get("image");

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(
    ".preview-container"
  ).innerHTML = `<img src="${image}" alt="Preview" width="100%" height="100%">`;
});

console.log(image);

document.querySelector("#category").value = categoryName;
document.querySelector("#hidden-id").value = id;
document.querySelector("#submit").addEventListener("click", async (e) => {
  e.preventDefault();
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";

  const categoryName = document.querySelector("#category").value;
  const id = document.querySelector("#hidden-id").value;
  const imageFile = document.querySelector("#category-image").files[0];

  const formData = new FormData();
  formData.append("id", id);
  formData.append("categoryName", categoryName);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  try {
    const response = await axios.put("/api/category", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    document.querySelector("main").style = "opacity: 1";
    document.querySelector(".delete-loader").style = "display: none";
    alert(response.data.message);
    window.location.href = "/admin";
  } catch (error) {
    document.querySelector("main").style = "opacity: 1";
    document.querySelector(".delete-loader").style = "display: none";
    console.error("Error:", error);
    alert(error?.response?.data?.message || "Update failed");
  }
});

document.querySelector("#category-image").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file.type.match("image.*")) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    document.querySelector(
      ".preview-container"
    ).innerHTML = `<img src="${e.target.result}" alt="Preview" width="100%" height="100%">`;
  };
  reader.readAsDataURL(file);
});
