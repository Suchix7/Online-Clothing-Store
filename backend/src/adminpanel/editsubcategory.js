const url = new URL(window.location.href);

// Get the 'id' parameter
const subcategoryName = url.searchParams.get("subcategory");
const parentCategory = url.searchParams.get("parentCategory");
const id = url.searchParams.get("id");
const image = url.searchParams.get("image");
const logo = url.searchParams.get("logo");

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(
    ".preview-container"
  ).innerHTML = `<img src="${image}" alt="Preview" width="100%" height="100%">`;
  document.querySelector(
    ".preview-logo"
  ).innerHTML = `<img src="${logo}" alt="Preview" width="100%" height="100%">`;
});

document.querySelector("#subcategory").value = subcategoryName;
document.querySelector("#hidden-id").value = id;

axios
  .get("/api/category")
  .then((response) => {
    const select = document.querySelector("#catDown");
    const myArray = response.data;
    myArray.forEach((item) => {
      if (item.categoryName == parentCategory) {
        select.innerHTML += `<option value="${item.categoryName}" selected>${item.categoryName}</option>`;
      } else {
        select.innerHTML += `<option value="${item.categoryName}">${item.categoryName}</option>`;
      }
    });
  })
  .catch((error) => {
    console.error("Error fetching categories:", error);
  });

document.querySelector("#submit").addEventListener("click", async (e) => {
  e.preventDefault();
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  const subcategoryName = document.querySelector("#subcategory").value;
  const parentCategory = document.querySelector("#catDown").value;
  const id = document.querySelector("#hidden-id").value;
  const image = document.querySelector("#subcategory-image").files[0];
  const logo = document.querySelector("#subcategory-logo").files[0];
  const formData = new FormData();
  formData.append("id", id);
  formData.append("subcategoryName", subcategoryName);
  formData.append("parentCategory", parentCategory);
  formData.append("image", image);
  formData.append("logo", logo);

  try {
    const response = await axios.put("/api/subcategory", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    document.querySelector("main").style = "opacity: 1";
    document.querySelector(".delete-loader").style = "display: none";
    alert(response.data.message);
    window.location.href = "/";
  } catch (error) {
    document.querySelector("main").style = "opacity: 1";
    document.querySelector(".delete-loader").style = "display: none";
    console.error("Error:", error); // Handle error response
  }
});

document.querySelector("#subcategory-image").addEventListener("change", (e) => {
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
document.querySelector("#subcategory-logo").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file.type.match("image.*")) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    document.querySelector(
      ".preview-logo"
    ).innerHTML = `<img src="${e.target.result}" alt="Preview" width="100%" height="100%">`;
  };
  reader.readAsDataURL(file);
});
