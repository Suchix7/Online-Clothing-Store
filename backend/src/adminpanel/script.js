document.querySelectorAll(".images").forEach((item, index) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".image-input")[index].click();
  });
});

document.querySelectorAll(".image-input").forEach((item, index) => {
  item.addEventListener("change", function (e) {
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
  });
});

// Video upload functionality
document
  .querySelector(".video-upload-container")
  .addEventListener("click", () => {
    document.querySelector(".video-input").click();
  });

document.querySelector(".video-input").addEventListener("change", function (e) {
  const preview = document.querySelector(".video");
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

function showVideoUpload() {
  document
    .querySelectorAll(".upload-section")[1]
    .classList.add("active-section");
  document.querySelector(".video-upload-container").style.display = "grid";
  document.querySelector(".video-upload-container").style.placeItems = "center";
}

let content = [];
let lists = [];

document.addEventListener("DOMContentLoaded", function () {
  content = document.querySelectorAll(".menu-content");
  lists = document.querySelectorAll(".container ul li");
  window.addEventListener("DOMContentLoaded", () => {
    const savedIndex = parseInt(sessionStorage.getItem("index")) || 0;
    showList(savedIndex);
  });

  axios
    .get("/api/category")
    .then((response) => {
      const select = document.querySelectorAll(".catDown");
      const myArray = response.data;
      select.forEach((selectItem) =>
        myArray.forEach(
          (item) =>
            (selectItem.innerHTML += `<option value="${item.categoryName}">${item.categoryName}</option>`)
        )
      );
      handleChange();
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });
  axios
    .get("/api/subcategory")
    .then((response) => {
      const select = document.querySelector("#subDown");
      const myArray = response.data;
      myArray.forEach(
        (item) =>
          (select.innerHTML += `<option value="${item.subcategoryName}">${item.subcategoryName}</option>`)
      );
    })
    .catch((error) => {
      console.error("Error fetching subcategories:", error);
    });

  axios
    .get("/api/count")
    .then((response) => {
      const count = response.data;
      document.querySelectorAll(".dashboard-items").forEach((item, index) => {
        item.innerHTML += `<h1 class="count-heading">${count[index]}</h1>`;
      });
    })
    .catch((error) => {
      console.error("Error fetching count:", error);
    });

  axios
    .get("/api/category")
    .then((response) => {
      const myArray = response.data;
      const tbody = document.querySelector(".manage-category table tbody");

      myArray.forEach((item, index) => {
        const tr = document.createElement("tr");
        tbody.appendChild(tr);
        const td1 = document.createElement("td");
        const td2 = document.createElement("td");
        const td3 = document.createElement("td");
        td1.innerText = index + 1;
        td2.innerText = item.categoryName;
        tr.appendChild(td1);
        tr.appendChild(td2);
        const editBtn = document.createElement("a");
        editBtn.setAttribute("class", "action-btn");
        editBtn.href = `editcategory.html?category=${item.categoryName}&id=${item._id}&image=${item.image}`;
        const deleteBtn = document.createElement("a");
        deleteBtn.setAttribute("class", "action-btn");
        editBtn.innerText = "Edit";
        deleteBtn.innerText = "Delete";
        deleteBtn.setAttribute("onclick", `deleteCategory('${item._id}')`);
        td3.appendChild(editBtn);
        td3.appendChild(deleteBtn);
        tr.appendChild(td3);
      });
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });

  axios
    .get("/api/subcategory")
    .then((response) => {
      const subCategories = response.data;
      const tbody = document.querySelector(".manage-subcategory table tbody");

      subCategories.forEach((item, index) => {
        const tr = document.createElement("tr");
        tbody.appendChild(tr);
        const td1 = document.createElement("td");
        const td2 = document.createElement("td");
        const td3 = document.createElement("td");
        const td4 = document.createElement("td");
        td3.innerText = item.parentCategory;
        td1.innerText = index + 1;
        td2.innerText = item.subcategoryName;
        tr.appendChild(td1);
        tr.appendChild(td2);
        const editBtn = document.createElement("a");
        editBtn.setAttribute("class", "action-btn");
        editBtn.href = `editsubcategory.html?subcategory=${item.subcategoryName}&parentCategory=${item.parentCategory}&id=${item._id}&image=${item.image}&logo=${item.logo}`;
        const deleteBtn = document.createElement("a");
        deleteBtn.setAttribute("class", "action-btn");
        editBtn.innerText = "Edit";
        deleteBtn.innerText = "Delete";
        deleteBtn.setAttribute("onclick", `deleteSubcategory('${item._id}')`);
        td4.appendChild(editBtn);
        td4.appendChild(deleteBtn);
        tr.appendChild(td3);
        tr.appendChild(td4);
      });
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });

  axios
    .get("/api/product")
    .then((response) => {
      const originalProducts = response.data; // Store original full list
      let filteredProducts = [...originalProducts]; // Local copy for filtering

      const tbody = document.querySelector(".manage-product table tbody");
      const searchInput = document.querySelector("#search-bar");

      const renderProducts = (productsToRender) => {
        tbody.innerHTML = ""; // Clear table first

        productsToRender.forEach((item, index) => {
          const colors = item.color.map((color) => color.colorName).join(", ");

          const code = `<tr>
                          <td>${index + 1}</td>
                          <td>${item.createdAt?.split("T")[0]}</td>
                          <td>${item.name}</td>
                          <td>${item.costPrice}</td>
                          <td>${item.sellingPrice}</td>
                          <td>${item.parentCategory}</td>
                          <td>${item.parentSubcategory}</td>
                          <td>${colors}</td>
                          <td style="display:flex;">
                            <a class="action-btn" href="editproduct.html?id=${
                              item._id
                            }">Edit</a>
                            <a class="action-btn" onclick="deleteProduct('${
                              item._id
                            }', ${index})">Delete</a>
                          </td>
                        </tr>`;
          tbody.innerHTML += code;
        });
      };

      // Initial render
      renderProducts(filteredProducts);

      // Filtering on input
      searchInput.addEventListener("input", (e) => {
        const search = e.target.value.toLowerCase();

        filteredProducts = originalProducts.filter(
          (item) =>
            item.name.toLowerCase().includes(search) ||
            item.parentCategory.toLowerCase().includes(search) ||
            item.parentSubcategory.toLowerCase().includes(search) ||
            item.createdAt.includes(search)
        );

        renderProducts(filteredProducts);
      });
    })
    .catch((err) => console.log(err));

  axios
    .get("/api/orders")
    .then((response) => {
      const originalOrders = response.data; // Store original full list
      let filteredOrders = [...originalOrders]; // Local copy for filtering

      const tbody = document.querySelector(".manage-orders table tbody");
      const shippedBody = document.querySelector(
        ".manage-shipped-orders table tbody"
      );
      const deliveredBody = document.querySelector(
        ".manage-delivered-orders table tbody"
      );
      const cancelledBody = document.querySelector(
        ".manage-cancelled-orders table tbody"
      );
      const dashboardOrders = document.querySelector(
        ".orders-container table tbody"
      );
      const searchInput = document.querySelector("#orders-search-bar");

      const year = String(new Date().getFullYear());
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const day = String(new Date().getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;
      const todaysOrder = [];

      const renderOrders = (ordersToRender) => {
        tbody.innerHTML = ""; // Clear orders table
        shippedBody.innerHTML = ""; // Clear shipped table
        deliveredBody.innerHTML = ""; // Clear delivered table
        cancelledBody.innerHTML = ""; // Clear cancelled table
        dashboardOrders.innerHTML = ""; // Clear dashboard table

        ordersToRender.forEach((item, index) => {
          const orderDate = item.createdAt.split("T")[0];

          const code = `<tr>
                        <td>
                          ${index + 1}
                        </td>
                         <td>${orderDate}</td>
                        <td>
                          ${item.orderId}
                        </td>
                        <td>
                          ${item.username}
                        </td>
                        <td>
                          ${item.products
                            .map((item) => item.name.substring(0, 40) + "...")
                            .join(",\n")}
                        </td>
                        <td>
                          ${item.products
                            .map((item) => item.quantity)
                            .join(",\n")}
                        </td>
                        <td>
                            ${item.products
                              .map((item) => item.color)
                              .join(",\n")}
                        </td>
                        <td>
                          ${item.products
                            .map((item) => item.variant)
                            .join(",\n")}
                        </td>
                        <td>
                            ${item.products
                              .map((item) => item.model)
                              .join(",\n")}
                        </td>
                        <td>
                          ${item.shippingAddress.street}, ${
            item.shippingAddress.city
          }, ${item.shippingAddress.landMark}
                        </td>
                        <td>
                          ${item.mail}, ${item.phoneNumber}
                        </td>
                        <td>
                          ${item.shippingAddress.shortnote?.trim()}
                        </td>
                        <td>
                          ${item.status}
                        </td>
                        <td style="display:flex;flex-direction:column;gap:5px;">
                          <button class="action-btn" onclick="orderShipped('${
                            item.orderId
                          }')">Shipped</button>
                          <button class="action-btn" onclick="orderDelievered('${
                            item.orderId
                          }')">Delivered</button>
                          <button class="action-btn" onclick="orderCancelled('${
                            item.orderId
                          }')">Cancelled</button>
                        </td>
                      </tr>`;

          const code1 = `<tr>
                        <td>
                          ${index + 1}
                        </td>
                         <td>${orderDate}</td>
                        <td>
                          ${item.orderId}
                        </td>
                        <td>
                          ${item.checkoutId}
                        </td>
                        <td>
                          ${item.username}
                        </td>
                        <td>
                          ${item.products.map((item) => item.name).join(", ")}
                        </td>
                        <td>
                          ${item.products
                            .map((item) => item.quantity)
                            .join(", ")}
                        </td>
                        <td>
                          ${item.shippingAddress.street}, ${
            item.shippingAddress.city
          }, ${item.shippingAddress.landMark}
                        </td>
                      </tr>`;

          if (item.status == "shipped") {
            shippedBody.innerHTML += code1;
          } else if (item.status == "delivered") {
            deliveredBody.innerHTML += code1;
          } else if (item.status == "cancelled") {
            cancelledBody.innerHTML += code1;
          } else {
            tbody.innerHTML += code;
          }

          if (orderDate == today && item.status == "processing") {
            alert(
              `We have an order of ${item.products
                .map((item) => item.name)
                .join(",")} from ${item.username} today`
            );
            todaysOrder.push(item);
            dashboardOrders.innerHTML += code;
          }
        });

        if (todaysOrder.length == 0) {
          dashboardOrders.innerHTML =
            "<tr align='center'>No Orders Today.</tr>";
        }
      };

      // Initial render
      renderOrders(filteredOrders);

      // Setup search functionality for all order sections
      const setupSearch = (inputId, status = null) => {
        const searchInput = document.querySelector(`#${inputId}`);
        if (searchInput) {
          // Prevent form submission if search bar is inside a form
          const form = searchInput.closest("form");
          if (form) {
            form.addEventListener("submit", (e) => {
              e.preventDefault();
              e.stopPropagation();
            });
          }

          // Optional: prevent Enter key from submitting
          searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          });

          let searchTimeout;
          searchInput.addEventListener("keyup", (e) => {
            e.preventDefault();
            e.stopPropagation();

            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
              const search = e.target.value.toLowerCase().trim();

              // Filter orders based on status if specified
              let statusFilteredOrders = status
                ? originalOrders.filter((item) => item.status === status)
                : originalOrders;

              filteredOrders = statusFilteredOrders.filter(
                (item) =>
                  item.orderId?.toLowerCase().includes(search) ||
                  item.username?.toLowerCase().includes(search) ||
                  item.products.some((prod) =>
                    prod.name?.toLowerCase().includes(search)
                  ) ||
                  item.checkoutId?.toLowerCase().includes(search) ||
                  item.createdAt?.includes(search)
              );

              renderOrders(filteredOrders);
            }, 100);
          });
        }
      };

      // Setup search for each order section
      setupSearch("orders-search-bar");
      setupSearch("shipped-orders-search-bar", "shipped");
      setupSearch("delivered-orders-search-bar", "delivered");
      setupSearch("cancelled-orders-search-bar", "cancelled");
    })
    .catch((err) => console.log(err));

  let index;

  lists.forEach((item, i) => {
    if (item.classList.contains("active")) {
      index = i;
    }
  });
  if (index == 0) {
    document.querySelector(".dashboard").classList.remove("hide");
  } else if (index == 1) {
    document.querySelector(".category").classList.remove("hide");
  } else if (index == 2) {
    document.querySelector(".sub-category").classList.remove("hide");
  } else {
    document.querySelector(".product").classList.remove("hide");
  }
});

const container = document.querySelector(".container");
function showMenu() {
  container.classList.toggle("toggleMenu");
}

// sidebar.addEventListener("click", function (event) {
//   if (!container.contains(event.target)) {
//     sidebar.classList.toggle("toggleBar"); // Hide the sidebar
//     container.classList.toggle("toggleMenu");
//   }
// });

function showList(index) {
  if (index < 0 || index >= content.length) {
    console.warn("Invalid index:", index);
    return;
  }

  sessionStorage.setItem("index", index);
  document.querySelector(".form-title").innerHTML =
    content[index].dataset.heading;

  const content1 = document.querySelectorAll(".menu-content");

  content1.forEach((item, i) => {
    if (index === i) {
      item.classList.remove("hide");
    } else {
      item.classList.add("hide");
    }
  });

  lists.forEach((item, i) => {
    if (index == i) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  if (window.innerWidth <= 1000) {
    showMenu();
  }
}

function showUpload() {
  document
    .querySelectorAll(".upload-section")[0]
    .classList.add("active-section");
  document.querySelector(".upload-container").style = "display: flex";
}

function deleteProduct(id, index) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  document.querySelector(".delete-loader").innerHTML = "Deleting Product...";
  axios
    .delete(`/api/product/${id}`)
    .then(() => {
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
      alert("Product Deleted");
      location.reload();
    })
    .catch((err) => alert(err));
}

function deleteCategory(id) {
  if (!confirm("Are you sure you want to delete this category?")) return;

  axios
    .delete(`/api/category/${id}`)
    .then(() => {
      alert("Category deleted");
      location.reload();
    })
    .catch((err) => alert(err.response.data.message));
}

function deleteSubcategory(id) {
  if (!confirm("Are you sure you want to delete this sub-category?")) return;

  axios
    .delete(`/api/subcategory/${id}`)
    .then(() => {
      alert("Sub-category deleted");
      location.reload();
    })
    .catch((err) => {
      alert(err.response.data.message);
    });
}

function orderShipped(orderId) {
  if (!confirm("Are you sure you want to mark this order as shipped?")) return;
  axios.get("/api/orders/user/" + orderId).then((response) => {
    const order = response.data;
    const updatedOrder = {
      ...order,
      status: "shipped",
    };

    const data = {
      to: order.mail,
      subject: "Your order is shipped!",
      text: "Hi",
      name: order.username,
      total: order.totalAmount,
      createdAt: new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      shippingAddress: order.shippingAddress,
      id: order.orderId,
    };

    axios
      .post("/api/sendMail", data)
      .then(() => {
        alert("Mail sent to our customer.");
      })
      .catch((err) => {
        alert(err);
      });

    axios
      .put("/api/orders/" + orderId, updatedOrder)
      .then(() => {
        alert("Order status updated to Shipped");
        // location.reload();
      })
      .catch((err) => alert(err));
  });
}

function orderDelievered(orderId) {
  if (!confirm("Are you sure you want to mark this order as delivered?"))
    return;
  axios.get("/api/orders/user/" + orderId).then((response) => {
    const order = response.data;
    const updatedOrder = {
      ...order,
      status: "delivered",
    };

    axios
      .put("/api/orders/" + orderId, updatedOrder)
      .then(() => {
        alert("Order status updated to delivered");
        location.reload();
      })
      .catch((err) => alert(err));
  });
}
function orderCancelled(orderId) {
  if (!confirm("Are you sure you want to mark this order as cancelled?"))
    return;
  axios.get("api/orders/user/" + orderId).then((response) => {
    const order = response.data;
    const updatedOrder = {
      ...order,
      status: "cancelled",
    };
    axios
      .put("/api/orders/" + orderId, updatedOrder)
      .then(() => {
        alert("Order status updated to Cancelled");
        location.reload();
      })
      .catch((err) => alert(err));
  });
}

const variantCountt = document.querySelector("#variantCountt");
const variantInput = document.querySelector(".variantInput");
const coverCountt = document.querySelector("#coverCountt");
const coverInput = document.querySelector(".coverInput");

function handleChange() {
  const select = document.querySelector(".phoneSpecShow");
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
  if (value === "Phone") {
    variantCountt.style.display = "flex";
    if (variantInput) variantInput.style.display = "block";
    coverCountt.style.display = "none";
    if (coverInput) coverInput.style.display = "none";
  } else if (value == "Cover") {
    coverCountt.style.display = "flex";
    if (coverInput) coverInput.style.display = "block";
    variantCountt.style.display = "none";
    if (variantInput) variantInput.style.display = "none";
  } else {
    variantCountt.style.display = "none";
    if (variantInput) variantInput.style.display = "none";
    coverCountt.style.display = "none";
    if (coverInput) coverInput.style.display = "none";
  }
}

function colorsNumber() {
  const number = document.querySelector("#colorsNumber").value;
  const input = document.querySelector(".colorInput");
  const code = `<label for="color">
              <i class="fa-solid fa-palette"></i>
              <input
                type="text"
                name="color"
                id="color"
                placeholder="Enter product color"
                required
              />
            </label>`;

  for (let i = 1; i <= number; i++) {
    input.innerHTML += code;
  }
}

const number = document.querySelector("#colorsNumber");
number.addEventListener("input", () => {
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
    input.innerHTML += code;
  }

  const addBtn = document.createElement("button");
  addBtn.id = "addColor";
  addBtn.textContent = "Click to add a new color";
  addBtn.addEventListener("click", addColor);
  input.appendChild(addBtn);
});

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

const variantCount = document.querySelector("#variantCount");

variantCount.addEventListener("input", () => {
  const count = variantCount.value;
  variantInput.style =
    "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
  variantInput.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
                <h2>Variant ${i}:</h2>
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

  const addBtn = document.createElement("button");
  addBtn.id = "addVariant";
  addBtn.textContent = "Click to add a new variant";
  addBtn.addEventListener("click", addVariant);
  variantInput.appendChild(addBtn);
});

function addVariant(e) {
  e.preventDefault();
  const input = document.querySelector(".variantInput");

  // Count how many color fields already exist
  const i = input.querySelectorAll("div").length + 1;

  const code = `
              <div style="display: flex;flex-direction:column;gap:10px;">
                <h2>Variant ${i}:</h2>
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

const coverCount = document.querySelector("#coverCount");

coverCount.addEventListener("input", () => {
  const count = coverCount.value;
  coverInput.style =
    "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
  coverInput.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const code = `
              <div style="display: flex;flex-direction:column;gap:10px;position:relative">
                <label for="model${i}">
                <i class="fa-solid fa-mobile"></i>
                <input
                  type="text"
                  name="model${i}"
                  id="model${i}"
                  placeholder="Enter model ${i}"
                />
                </label>
                <!-- button style="position:absolute;right:0;bottom:0" class="deleteModel">Delete</button> --!>
              </div>`;
    coverInput.innerHTML += code;
  }

  const addBtn = document.createElement("button");
  addBtn.id = "addModel";
  addBtn.textContent = "Click to add a new model";
  addBtn.addEventListener("click", addModel);
  coverInput.appendChild(addBtn);
  // document.querySelectorAll(".deleteModel").forEach((item) => {
  //   item.addEventListener("click", deleteModel);
  // });
});

// function deleteModel(e) {
//   e.preventDefault();
//   console.log(e.target);
// }

function addModel(e) {
  e.preventDefault();
  const input = document.querySelector(".coverInput");

  // Count how many color fields already exist
  const i = input.querySelectorAll("input[type='text']").length + 1;

  const code = `
              <div style="display: flex;flex-direction:column;gap:10px;position:relative">
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

/*For color theme*/
const darkbtn = document.querySelector(".dark-mode");
const circle = document.querySelector(".circle");
const lightMode = document.querySelector(".light-mode");
const darkMode = document.querySelector(".darkMode");
const mode = localStorage.getItem("mode");
const r = document.querySelector(":root");
const image = document.querySelector(".logo-container img");

if (mode == "dark") {
  circle.classList.add("shift");
  lightMode.classList.add("dark-mode-shift");
  darkMode.classList.remove("dark-mode-shift");
  r.style.setProperty("--lightergray--", "black");
  r.style.setProperty("--black--", "#f4f4f4");
  r.style.setProperty("--darkgray--", "#bbb");
  image.style.filter = "brightness(0)";
} else {
  circle.classList.remove("shift");
  lightMode.classList.remove("dark-mode-shift");
  darkMode.classList.add("dark-mode-shift");
  r.style.setProperty("--lightergray--", "#f4f4f4");
  r.style.setProperty("--black--", "black");
  r.style.setProperty("--darkgray--", "#333333");
  image.style.filter = "brightness(100%)";
}

darkbtn.addEventListener("click", () => {
  if (window.innerWidth <= 600) {
    circle.classList.remove("shift");
    circle.classList.toggle("mobile-shift");
  } else {
    circle.classList.remove("mobile-shift");
    circle.classList.toggle("shift");
  }
  if (darkMode.classList.contains("dark-mode-shift")) {
    localStorage.setItem("mode", "dark");
    lightMode.classList.toggle("dark-mode-shift");
    darkMode.classList.toggle("dark-mode-shift");
    r.style.setProperty("--lightergray--", "black");
    r.style.setProperty("--black--", "#f4f4f4");
    r.style.setProperty("--darkgray--", "#bbb");
    image.style.filter = "brightness(0)";
  } else {
    localStorage.setItem("mode", "light");
    lightMode.classList.toggle("dark-mode-shift");
    darkMode.classList.toggle("dark-mode-shift");
    r.style.setProperty("--lightergray--", "#f4f4f4");
    r.style.setProperty("--black--", "black");
    r.style.setProperty("--darkgray--", "#333333");
    image.style.filter = "brightness(100%)";
  }
});

const addProduct = document.querySelector("input[type='submit']");

addProduct.addEventListener("click", (e) => {
  document.querySelector(".form").style.opacity = "0";
  document.querySelector(".loader").style.display = "inline-block";
});

function showLoadingScreen(status) {
  if (status == "add-product") {
    document.querySelector("main").style = "opacity: 0.5";
    document.querySelector(".delete-loader").style = "display: block";
    document.querySelector(".delete-loader").innerHTML = "Adding Product...";
  } else if (status == "add-category") {
    document.querySelector("main").style = "opacity: 0.5";
    document.querySelector(".delete-loader").style = "display: block";
    document.querySelector(".delete-loader").innerHTML = "Adding Category...";
  } else if (status == "add-subcategory") {
    document.querySelector("main").style = "opacity: 0.5";
    document.querySelector(".delete-loader").style = "display: block";
    document.querySelector(".delete-loader").innerHTML =
      "Adding Subcategory...";
  }
}
