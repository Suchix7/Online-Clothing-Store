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
      const code = myArray
        .map((item) => {
          return `<option value="${item.subcategoryName}">${item.subcategoryName}</option>`;
        })
        .join("");
      select.innerHTML += code;
    })
    .catch((error) => {
      console.error("Error fetching subcategories:", error);
    });

  axios
    .get("/api/subcategory/phonemodels")
    .then((response) => {
      const subcategorySelect = document.querySelector("#csm-sub-cat");
      const myArray = response.data;
      const code = myArray
        .map((item) => {
          return `<option value="${item.subcategoryName}">${item.subcategoryName}</option>`;
        })
        .join("");
      subcategorySelect.innerHTML += code;
    })
    .catch((error) => {
      console.error("Error fetching subcategories:", error);
    });

  axios
    .get("/api/count")
    .then((response) => {
      const count = response.data;
      document.querySelector("#total-categories").innerHTML =
        count.totalCategories;
      document.querySelector("#total-subcategories").innerHTML =
        count.totalSubcategories;
      document.querySelector("#total-products").innerHTML = count.totalProducts;

      // Update total users count in both mobile menu and sidebar
      const totalUsersElements = document.querySelectorAll(
        "#total-users, .mobile-total-users"
      );
      totalUsersElements.forEach((element) => {
        if (element) element.innerText = count.totalUsers.length;
      });

      const userCode = count.totalUsers
        .map((item, index) => {
          return `
          <tr id="${item._id}">
            <td>${index + 1}</td>
            <td>${item._id}</td>
            <td>${item.fullName}</td>
            <td>${item.email}</td>
            <td>${item.phoneNumber}</td>
            <td>${item.createdAt.split("T")[0]}</td>
            <td><span class="status-inactive" id="u-${
              item._id
            }">Inactive</span></td>
            <td>
              <div class="action-buttons">
                <button class="btn-action user-view-btn" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-edit" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" title="Delete" onclick="deleteUser('${
                  item._id
                }', ${index})">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
        })
        .join("");
      document.querySelector("#users-body").innerHTML = userCode;
      document.querySelector("#new-orders-count").innerHTML = count.totalOrders;
      const today = new Date();
      const todayString = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const todaySales = count.totalSales.filter(
        (item) => item.createdAt.split("T")[0] === todayString
      );
      const weeklySales = count.totalSales.filter((item) => {
        const itemDate = new Date(item.createdAt);
        const today = new Date();
        const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays < 7; // Last 7 days including today
      });
      const weeklySalesAmount = weeklySales.reduce((acc, item) => {
        return acc + item.totalAmount;
      }, 0);
      document.querySelector("#weekly-sales").innerHTML =
        weeklySalesAmount.toFixed(2);
      const monthlySales = count.totalSales.filter((item) => {
        const itemDate = new Date(item.createdAt);
        const today = new Date();
        return (
          itemDate.getFullYear() === today.getFullYear() &&
          itemDate.getMonth() === today.getMonth()
        );
      });

      const monthlySalesAmount = monthlySales.reduce((acc, item) => {
        return acc + item.totalAmount;
      }, 0);
      document.querySelector("#monthly-sales").innerHTML =
        monthlySalesAmount.toFixed(2);
      const totalSales = todaySales.reduce((acc, item) => {
        return acc + item.totalAmount;
      }, 0);

      document.querySelector("#today-sales").innerHTML = totalSales.toFixed(2);
    })
    .catch((error) => {
      console.error("Error fetching count:", error);
    });

  axios
    .get("/api/inquiryCount")
    .then((response) => {
      const count = response.data.inquiries;
      document.querySelector("#customer-inquiries").innerHTML = count?.length;
      const tbody = document.querySelector("#inquiries-body");
      tbody.innerHTML = ""; // clear previous rows
      const code = count
        .map((item, index) => {
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.email}</td>
            <td>${item.message}</td>  
            <td>${item.createdAt?.split("T")[0]}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-action inquiry-view-btn" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-delete inquiry-delete-btn" title="Delete Details" onclick="deleteInquiry('${
                  item._id
                }', '${index}') ">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
        })
        .join("");
      tbody.innerHTML = code;
    })
    .catch((error) => {
      console.error("Error fetching inquiry count:", error);
    });

  axios
    .get("/api/testimonials")
    .then((response) => {
      const count = response.data;
      const tbody = document.querySelector("#testimonials-body");
      tbody.innerHTML = ""; // clear previous rows
      const code = count
        .map((item, index) => {
          return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.experience}</td>
            <td>${item.location}</td>  
            <td>${item.createdAt?.split("T")[0]}</td>
            <td>${item.show}</td>
            <td>
              <div class="action-buttons">
                <button class="visibility-btn" title="Toggle Visibility" onclick="toggleTestimonialVisibility('${
                  item._id
                }', '${item.show ? "hidden" : "visible"}')">
                  ${
                    item.show
                      ? "<i class='fas fa-eye'></i>"
                      : "<i class='fas fa-eye-slash'></i>"
                  }
                  
                </button>
                <button class="btn-delete inquiry-delete-btn" title="Delete Details" onclick="deleteTestimonial('${
                  item._id
                }', '${index}') ">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
        })
        .join("");
      tbody.innerHTML = code;
    })
    .catch((error) => {
      console.error("Error fetching inquiry count:", error);
    });

  axios
    .get("/api/phonemodels")
    .then((response) => {
      const models = response.data;
      const tbody = document.querySelector("#csm-body");
      tbody.innerHTML = "";
      const code = models.map((item, index) => {
        return `
                 <tr id="csm-${
                   item._id
                 }" style="animation: slideIn 0.5s ease-in-out;">
                  <td>${index + 1}</td>
                  <td>${item.brand}</td>
                  <td>${item.models.join(", ")}</td>
                  <td> 
                   <div class="action-buttons">
                      <a href="editphonemodel.html?id=${
                        item._id
                      }" target="_blank"><button class="btn-edit title="Edit""><i class="fas fa-edit"></i></button></a>
                      <button class="btn-delete" title="Delete" onclick="deleteModel('${
                        item._id
                      }')"> <i class="fas fa-trash-alt"></i></button>
                    </div>
                    </td>
                 </tr>
               `;
      });
      tbody.innerHTML = code.join("");
    })
    .catch((error) => {
      console.error("Error fetching inquiry count:", error);
    });

  axios
    .get("/api/category")
    .then((response) => {
      const myArray = response.data;
      const tbody = document.querySelector("#categories-body");

      const categoriesCode = myArray
        .map(
          (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.categoryName}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action category-view-btn" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              <a href="editcategory.html?category=${item.categoryName}&id=${
            item._id
          }&image=${item.image}" target="_blank">
              <button class="btn-edit" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              </a>
              <button class="btn-delete" title="Delete" onclick="deleteCategory('${
                item._id
              }')">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `
        )
        .join("");

      tbody.innerHTML = categoriesCode;
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });

  axios
    .get("/api/subcategory")
    .then((response) => {
      const subCategories = response.data;
      const tbody = document.querySelector("#subcategories-body");

      const subcategoriesCode = subCategories
        .map(
          (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.subcategoryName}</td>
          <td>${item.parentCategory}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action subcategory-view-btn" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              <a href="editsubcategory.html?subcategory=${
                item.subcategoryName
              }&parentCategory=${item.parentCategory}&id=${item._id}&image=${
            item.image
          }&logo=${item.logo}" target="_blank">
              <button class="btn-edit" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              </a>
              <button class="btn-delete" title="Delete" onclick="deleteSubcategory('${
                item._id
              }')">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `
        )
        .join("");

      tbody.innerHTML = subcategoriesCode;
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });

  axios
    .get("/api/product")
    .then((response) => {
      const originalProducts = response.data; // Store original full list
      let filteredProducts = [...originalProducts]; // Local copy for filtering

      const tbody = document.querySelector("#products-body");
      const searchInput = document.querySelector("#search-bar");

      const renderProducts = (productsToRender) => {
        tbody.innerHTML = ""; // Clear table first

        productsToRender.forEach((item, index) => {
          const sizes = item.size.map((size) => size.sizeName).join(", ");
          const code1 = `<tr id="p-${
            item._id
          }" style="animation: slideIn 0.5s ease-in-out;">
                          <td>${index + 1}</td>
                          <td>${item.createdAt?.split("T")[0]}</td>
                          <td>${item.modelName}</td>
                          <td>${item.name}</td>
                          <td>${item.costPrice}</td>
                          <td>${item.sellingPrice}</td>
                          <td>${item.parentCategory}</td>
                          <td>${item.parentSubcategory}</td>
                          <td>${sizes}</td>
                          <td>${item.stock}</td>
                          <td> <div class="action-buttons">
                                <button class="btn-action" title="View Details">
                                  <i class="fas fa-eye"></i>
                                </button>
                          <a href="editproduct.html?id=${
                            item._id
                          }" target="_blank"><button class="btn-edit title="Edit""><i class="fas fa-edit"></i></button></a>
                          <button class="btn-delete" title="Delete" onclick="deleteProduct('${
                            item._id
                          }')"> <i class="fas fa-trash-alt"></i></button>
                          </div>
                        </td>
                         </tr> `;
          tbody.innerHTML += code1;
        });
      };

      filteredProducts.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

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

  let orderProductsData = {};
  axios
    .get("/api/orders")
    .then((response) => {
      const originalOrders = response.data; // Store original full list
      let filteredOrders = [...originalOrders]; // Local copy for filtering

      const tbody = document.querySelector("#manage-orders #orders-body");
      const shippedBody = document.querySelector(
        "#orders-shipped #shipped-orders-body"
      );
      const deliveredBody = document.querySelector(
        "#orders-delivered #delivered-orders-body"
      );
      const cancelledBody = document.querySelector(
        "#orders-cancelled #cancelled-orders-body"
      );
      const dashboardOrders = document.querySelector("#dashboard-orders-body");
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

        // ✅ Define and initialize todaysOrder ONCE before the loop
        const today = new Date().toISOString().split("T")[0];
        let todaysOrder =
          JSON.parse(sessionStorage.getItem("todaysOrder")) || [];

        // ✅ Show alert only once
        let alertShown = !!todaysOrder.length;

        ordersToRender.forEach((item, index) => {
          const orderDate = item.createdAt?.split("T")[0];

          const code = `<tr style="animation: slideIn 0.5s ease-in-out;" class="o-${
            item.orderId
          }">
            <td>${index + 1}</td>
            <td>${orderDate}</td>
            <td>${item.orderId}</td>
            <td>${item.username}</td>
            <td><a href="javascript:void(0)" onclick="showOrderProducts('${
              item.orderId
            }')"><b>See Details</b></a></td>
            <td>${item.shippingAddress?.municipality}, ${
            item.shippingAddress?.district
          }, ${item.shippingAddress?.province}, ${
            item.shippingAddress?.location?.lat
          }, ${item.shippingAddress?.location?.lng}</td>
            <td>${item.mail}, ${item.phoneNumber}</td>
            <td>${item.status}</td>
            <td style="display:flex;flex-direction:column;gap:5px;">
              <button class="action-btn" style="background-color: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;" onclick="orderShipped('${
                item.orderId
              }')">Shipped</button>
              <button class="action-btn" style="background-color: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;" onclick="orderDelievered('${
                item.orderId
              }')">Delivered</button>
              <button class="action-btn" style="background-color: #F44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;" onclick="orderCancelled('${
                item.orderId
              }')">Cancelled</button>
            </td>
          </tr>`;

          const code1 = `<tr style="animation: slideIn 0.5s ease-in-out;">
            <td>${index + 1}</td>
            <td>${orderDate}</td>
            <td>${item.orderId}</td>
            <td>${item.checkoutId}</td>
            <td>${item.username}</td>
            <td><a href="javascript:void(0)" onclick="showOrderProducts('${
              item.orderId
            }')"><b>See Details</b></a></td>
            <td>${item.shippingAddress.street}, ${item.shippingAddress.city}, ${
            item.shippingAddress.landMark
          }</td>
          </tr>`;

          // Render in appropriate section
          if (item.status == "shipped") {
            shippedBody.innerHTML += code1;
          } else if (item.status == "delivered") {
            deliveredBody.innerHTML += code1;
          } else if (item.status == "cancelled") {
            cancelledBody.innerHTML += code1;
          } else {
            tbody.innerHTML += code;
          }

          // ✅ Check if it's today's processing order
          if (orderDate === today && item.status === "processing") {
            if (!alertShown) {
              alert(
                `We have an order of ${item.products
                  .map((p) => p.name)
                  .join(", ")} from ${item.username} today`
              );
              alertShown = true;
            }

            todaysOrder.push(item);
            dashboardOrders.innerHTML += code;
          }
        });

        // ✅ Store updated today's orders in sessionStorage
        sessionStorage.setItem("todaysOrder", JSON.stringify(todaysOrder));

        // ✅ If still empty, show "No Orders Today"
        if (todaysOrder.length === 0) {
          dashboardOrders.innerHTML =
            "<tr align='center'>No Orders Today.</tr>";
        }

        console.log("Today's Orders:", todaysOrder);
      };

      filteredOrders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
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

  // let index;

  // lists.forEach((item, i) => {
  //   if (item.classList.contains("active")) {
  //     index = i;
  //   }
  // });
  // if (index == 0) {
  //   document.querySelector(".dashboard").classList.remove("hide");
  // } else if (index == 1) {
  //   document.querySelector(".category").classList.remove("hide");
  // } else if (index == 2) {
  //   document.querySelector(".sub-category").classList.remove("hide");
  // } else {
  //   document.querySelector(".product").classList.remove("hide");
  // }
});
function showOrderProducts(orderId) {
  const modal = document.getElementById("orderProductsModal");
  const container = document.getElementById("orderProductsTableContainer");
  axios
    .get(`/api/orders/dashboard/${orderId}`)
    .then((response) => {
      const order = response.data;
      const products = order.products || [];
      if (products.length === 0) {
        container.innerHTML = "<p>No products found for this order.</p>";
      } else {
        let table = `<table style="width:100%;min-width: 400px; border-collapse:collapse;">
      <thead>
        <tr>
          <th style="border-bottom:1px solid #ddd; padding:8px;">Product Name</th>
          <th style="border-bottom:1px solid #ddd; padding:8px;">Quantity</th>
          <th style="border-bottom:1px solid #ddd; padding:8px;">Price</th>
          <th style="border-bottom:1px solid #ddd; padding:8px;">Color</th>
          <th style="border-bottom:1px solid #ddd; padding:8px;">Variant</th>
          <th style="border-bottom:1px solid #ddd; padding:8px;">Model</th>
          <th style="border-bottom:1px solid #ddd; padding:8px;">Customer Note</th>
          <th style="border-bottom:1px solid #ddd; padding:8px;">Total</th>
        </tr>
      </thead>
      <tbody>`;
        products.forEach((prod) => {
          table += `<tr>
        <td style="padding:8px;">${prod.name}</td>
        <td style="padding:8px;">${prod.quantity}</td>
        <td style="padding:8px;">${prod.price}</td>
        <td style="padding:8px;">${prod.color}</td>
        <td style="padding:8px;">${prod.variant}</td>
        <td style="padding:8px;">${prod.model}</td>
        <td style="padding:8px;">${order.shippingAddress?.shortnote}</td>
        <td style="padding:8px;">${prod.price * prod.quantity}</td>
      </tr>`;
        });
        table += `</tbody></table>`;
        container.innerHTML = table;
      }

      modal.style.display = "flex";
    })
    .catch((err) => console.log(err));
}

function closeOrderProductsModal() {
  document.getElementById("orderProductsModal").style.display = "none";
}

const container = document.querySelector(".container");
function showMenu() {
  container.classList.toggle("toggleMenu");
}

function showList(index) {
  if (index < 0 || index >= content.length) {
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

function deleteProduct(id) {
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
      document.querySelector(`#p-${id}`).remove();
    })
    .catch((err) => {
      document.querySelector(".delete-loader").style = "display: none";
      alert(err.response.data.message);
      location.reload();
    });
}

function deleteCategory(id) {
  if (!confirm("Are you sure you want to delete this category?")) return;
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  document.querySelector(".delete-loader").innerHTML = "Deleting Category...";

  axios
    .delete(`/api/category/${id}`)
    .then(() => {
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
      alert("Category deleted");
      location.reload();
    })
    .catch((err) => {
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
      alert(err.response.data.message);
      location.reload();
    });
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

function deleteModel(id) {
  if (!confirm("Are you sure you want to delete this phone models?")) return;
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  document.querySelector(".delete-loader").innerHTML =
    "Deleting Phone Models...";
  axios
    .delete(`/api/phonemodels/${id}`)
    .then(() => {
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
      alert("Phone Model Deleted");
      document.querySelector(`#csm-${id}`).remove();
    })
    .catch((err) => {
      document.querySelector(".delete-loader").style = "display: none";
      alert(err.response.data.message);
      location.reload();
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
        document.querySelectorAll(`.o-${orderId}`).forEach((item) => {
          item.remove();
        });
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
        document.querySelectorAll(`.o-${orderId}`).forEach((item) => {
          item.remove();
        });
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
        document.querySelectorAll(`.o-${orderId}`).forEach((item) => {
          item.remove();
        });
      })
      .catch((err) => alert(err));
  });
}

const variantCountt = document.querySelector("#variantCountt");
const variantInput = document.querySelector(".variantInput");
// const coverCountt = document.querySelector("#coverCountt");
// const coverInput = document.querySelector(".coverInput");
const quantityCountt = document.querySelector("#quantityCountt");
const quantityInput = document.querySelector(".quantityInput");

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
  if (value === "Phone" || value === "SD Card") {
    variantCountt.style.display = "flex";
    if (variantInput) variantInput.style.display = "block";
    // coverCountt.style.display = "none";
    // if (coverInput) coverInput.style.display = "none";
    quantityCountt.style.display = "none";
    if (quantityInput) quantityInput.style.display = "none";
  } else if (value == "Cover") {
    // coverCountt.style.display = "flex";
    // if (coverInput) coverInput.style.display = "block";
    variantCountt.style.display = "none";
    if (variantInput) variantInput.style.display = "none";
    quantityCountt.style.display = "none";
    if (quantityInput) quantityInput.style.display = "none";
  } else if (value == "Screen Protector") {
    // coverCountt.style.display = "flex";
    // if (coverInput) coverInput.style.display = "block";
    variantCountt.style.display = "none";
    if (variantInput) variantInput.style.display = "none";
    quantityCountt.style.display = "flex";
    if (quantityInput) quantityInput.style.display = "block";
  } else {
    variantCountt.style.display = "none";
    if (variantInput) variantInput.style.display = "none";
    // coverCountt.style.display = "none";
    // if (coverInput) coverInput.style.display = "none";
    quantityCountt.style.display = "none";
    if (quantityInput) quantityInput.style.display = "none";
  }
}
function sizes() {
  const number = document.querySelector("#sizes").value;
  const input = document.querySelector(".sizesInput");
  const code = `<label for="size">
              <i class="fa-solid fa-palette"></i>
              <input
                type="text"
                name="size"
                id="size"
                placeholder="Enter product size"
                required
              />
            </label>`;
  for (let i = 1; i <= number; i++) {
    input.innerHTML += code;
  }
}
const numbers = document.querySelector("#sizes");
numbers.addEventListener("input", () => {
  const count = numbers.value;
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
                <h2>Size ${i}:</h2>
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

  const addBtn = document.createElement("button");
  addBtn.id = "addSize";
  addBtn.textContent = "Click to add a new Size";
  addBtn.addEventListener("click", addSize);
  input.appendChild(addBtn);
});

function addSize(e) {
  e.preventDefault();
  const inputs = document.querySelector(".sizesInput");

  const i = inputs.querySelectorAll("input[type='text']").length + 1;

  if (i > 8) {
    alert("You cannot put more than 8 colors");
    return;
  }

  const code = `
    <div style="display: flex;flex-direction:column;gap:10px;">
      <h2>Size ${i}:</h2>
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

  // Remove old button
  inputs.querySelector("#addSize").remove();

  // Append new color block
  inputs.insertAdjacentHTML("beforeend", code);

  // Re-add the button
  const newBtn = document.createElement("button");
  newBtn.id = "addSize";
  newBtn.textContent = "Click to add a new color";
  newBtn.addEventListener("click", addColor);
  inputs.appendChild(newBtn);
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
                <label for="searchName${i}">
                <i class="fa-solid fa-search"></i>
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
                <label for="searchName${i}">
                <i class="fa-solid fa-search"></i>
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

const coverCount = document.querySelector("#coverCount");

coverCount.addEventListener("input", () => {
  const count = coverCount.value;
  coverInput.style =
    "display: flex;flex-direction: column;gap: 10px;border-radius: 20px;border: 2px solid white;padding: 20px;";
  coverInput.innerHTML = "";

  for (let i = 1; i <= count; i++) {
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

const quantityCount = document.querySelector("#quantityCount");

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
                <i class="fa-solid fa-money-bill"></i>
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

/*For color theme*/
// const darkbtn = document.querySelector(".dark-mode");
// const circle = document.querySelector(".circle");
// const lightMode = document.querySelector(".light-mode");
// const darkMode = document.querySelector(".darkMode");
// const mode = localStorage.getItem("mode");
// const r = document.querySelector(":root");
// const image = document.querySelector(".logo-container img");

// if (mode == "dark") {
//   circle.classList.add("shift");
//   lightMode.classList.add("dark-mode-shift");
//   darkMode.classList.remove("dark-mode-shift");
//   r.style.setProperty("--lightergray--", "black");
//   r.style.setProperty("--black--", "#f4f4f4");
//   r.style.setProperty("--darkgray--", "#bbb");
//   image.style.filter = "brightness(0)";
// } else {
//   circle.classList.remove("shift");
//   lightMode.classList.remove("dark-mode-shift");
//   darkMode.classList.add("dark-mode-shift");
//   r.style.setProperty("--lightergray--", "#f4f4f4");
//   r.style.setProperty("--black--", "black");
//   r.style.setProperty("--darkgray--", "#333333");
//   image.style.filter = "brightness(100%)";
// }

// darkbtn.addEventListener("click", () => {
//   if (window.innerWidth <= 600) {
//     circle.classList.remove("shift");
//     circle.classList.toggle("mobile-shift");
//   } else {
//     circle.classList.remove("mobile-shift");
//     circle.classList.toggle("shift");
//   }
//   if (darkMode.classList.contains("dark-mode-shift")) {
//     localStorage.setItem("mode", "dark");
//     lightMode.classList.toggle("dark-mode-shift");
//     darkMode.classList.toggle("dark-mode-shift");
//     r.style.setProperty("--lightergray--", "black");
//     r.style.setProperty("--black--", "#f4f4f4");
//     r.style.setProperty("--darkgray--", "#bbb");
//     image.style.filter = "brightness(0)";
//   } else {
//     localStorage.setItem("mode", "light");
//     lightMode.classList.toggle("dark-mode-shift");
//     darkMode.classList.toggle("dark-mode-shift");
//     r.style.setProperty("--lightergray--", "#f4f4f4");
//     r.style.setProperty("--black--", "black");
//     r.style.setProperty("--darkgray--", "#333333");
//     image.style.filter = "brightness(100%)";
//   }
// });

const addProduct = document.querySelector("input[type='submit']");

addProduct.addEventListener("click", (e) => {
  document.querySelector(".form").style.opacity = "0";
  document.querySelector(".loader").style.display = "inline-block";
});

function showLoadingScreen(status) {
  if (status == "add-product") {
    document.querySelector("main").style.opacity = "0.5";
    document.querySelector(".delete-loader").style.display = "none";

    document.querySelector(".delete-loader").innerHTML = "Adding Product...";
  } else if (status == "add-category") {
    document.querySelector("main").style.opacity = "0.5";
    document.querySelector(".delete-loader").style.display = "none";

    document.querySelector(".delete-loader").innerHTML = "Adding Category...";
  } else if (status == "add-subcategory") {
    document.querySelector("main").style.opacity = "0.5";
    document.querySelector(".delete-loader").style.display = "none";
    document.querySelector(".delete-loader").innerHTML =
      "Adding Subcategory...";
  }
}

function deleteUser(id, index) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  document.querySelector(".delete-loader").innerHTML = "Deleting User...";
  axios
    .delete(`/api/user/${id}`)
    .then(() => {
      document.querySelector("main").style.opacity = "1";
      document.querySelector(".delete-loader").style.display = "none";

      alert("User Deleted");
      document.querySelector(`#${id}`).remove();
    })
    .catch((err) => {
      document.querySelector(".delete-loader").style = "display: none";
      alert(err.response.data.message);
      location.reload();
    });
}
//Function to delete inquiry
function deleteInquiry(id, index) {
  if (!confirm("Are you sure you want to delete this inquiry?")) return;
  document.querySelector("main").style.opacity = "0.5";
  document.querySelector(".delete-loader").style.display = "none";

  document.querySelector(".delete-loader").innerHTML = "Deleting Inquiry...";
  axios
    .delete(`/api/inquiry/${id}`)
    .then(() => {
      document.querySelector("main").style.opacity = "1";
      document.querySelector(".delete-loader").style.display = "none";

      alert("Inbox Deleted");
      document.querySelectorAll("#inquiries-body tr")[index].remove();
    })
    .catch((err) => {
      document.querySelector(".delete-loader").style = "display: none";
      alert(err.response.data.message);
      location.reload();
    });
}
function deleteTestimonial(id, index) {
  if (!confirm("Are you sure you want to delete this testimonial?")) return;
  document.querySelector(".main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  document.querySelector(".delete-loader").innerHTML =
    "Deleting Testimonial...";
  axios
    .delete(`/api/testimonial/${id}`)
    .then(() => {
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
      alert("Testimonial Deleted");
      document.querySelectorAll("#testimonials-body tr")[index].remove();
    })
    .catch((err) => {
      document.querySelector(".delete-loader").style = "display: none";
      alert(err.response.data.message);
      location.reload();
    });
}

function toggleTestimonialVisibility(id, show) {
  if (
    !confirm("Are you sure you want to toggle this testimonial's visibility?")
  )
    return;
  document.querySelector("main").style = "opacity: 0.5";
  document.querySelector(".delete-loader").style = "display: block";
  document.querySelector(".delete-loader").innerHTML =
    "Updating Testimonial...";
  axios
    .put(`/api/testimonial/${id}`)
    .then(() => {
      document.querySelector("main").style = "opacity: 1";
      document.querySelector(".delete-loader").style = "display: none";
      alert(`Testimonial now ${show}`);
      location.reload();
    })
    .catch((err) => {
      document.querySelector(".delete-loader").style = "display: none";
      alert(err.response.data.message);
      location.reload();
    });
}

// View modal functions
function showViewModal(type, data) {
  const modal = document.getElementById("viewDetailsModal");
  const title = document.getElementById("viewModalTitle");
  const thead = document.getElementById("viewModalTableHead");
  const tbody = document.getElementById("viewModalTableBody");

  // Clear previous content
  thead.innerHTML = "";
  tbody.innerHTML = "";

  switch (type) {
    case "product":
      title.textContent = "Product Details";
      thead.innerHTML = `
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      `;
      tbody.innerHTML = `
        <tr><td>Name</td><td>${data.name}</td></tr>
        <tr><td>Cost Price</td><td>$ ${data.costPrice}</td></tr>
        <tr><td>Selling Price</td><td>$ ${data.sellingPrice}</td></tr>
        <tr><td>Stock</td><td>${data.stock}</td></tr>
        <tr><td>Category</td><td>${data.parentCategory}</td></tr>
        <tr><td>Subcategory</td><td>${data.parentSubcategory}</td></tr>
        <tr><td>Description</td><td>${data.description}</td></tr>
        <tr><td>Added Date</td><td>${data.createdAt.split("T")[0]}</td></tr>
      `;
      break;

    case "category":
      title.textContent = "Category Details";
      thead.innerHTML = `
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      `;
      tbody.innerHTML = `
        <tr><td>Category Name</td><td>${data.categoryName}</td></tr>
        <tr><td>Added Date</td><td>${data.createdAt.split("T")[0]}</td></tr>
        <tr><td>Total Products</td><td>${data.productCount || 0}</td></tr>
        <tr><td>Total Subcategories</td><td>${
          data.subcategoryCount || 0
        }</td></tr>
      `;
      break;

    case "subcategory":
      title.textContent = "Subcategory Details";
      thead.innerHTML = `
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      `;
      tbody.innerHTML = `
        <tr><td>Subcategory Name</td><td>${data.subcategoryName}</td></tr>
        <tr><td>Parent Category</td><td>${data.parentCategory}</td></tr>
        <tr><td>Added Date</td><td>${data.createdAt.split("T")[0]}</td></tr>
        <tr><td>Total Products</td><td>${data.productCount || 0}</td></tr>
      `;
      break;

    case "user":
      title.textContent = "User Details";
      thead.innerHTML = `
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      `;
      tbody.innerHTML = `
        <tr><td>Full Name</td><td>${data.fullName}</td></tr>
        <tr><td>Email</td><td>${data.email}</td></tr>
        <tr><td>Phone</td><td>${data.phoneNumber}</td></tr>
        <tr><td>Registration Date</td><td>${
          data.createdAt.split("T")[0]
        }</td></tr>
        <tr><td>Status</td><td>${data.status || "Active"}</td></tr>
        <tr><td>Total Orders</td><td>${data.orderCount || 0}</td></tr>
      `;
      break;

    case "inquiry":
      title.textContent = "Inquiry Details";
      thead.innerHTML = `
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      `;
      tbody.innerHTML = `
        <tr><td>Name</td><td>${data.name}</td></tr>
        <tr><td>Email</td><td>${data.email}</td></tr>
        <tr><td>Message</td><td>${data.message}</td></tr>
        <tr><td>Date</td><td>${data.createdAt}</td></tr>
      `;
      break;
  }

  modal.style.display = "flex";
}

function closeViewModal() {
  const modal = document.getElementById("viewDetailsModal");
  modal.style.display = "none";
}

// Update the view button click handlers
function setupViewButtons() {
  // For products
  document.querySelectorAll(".btn-action").forEach((button) => {
    button.onclick = function () {
      const row = this.closest("tr");
      const productData = {
        name: row.querySelector("td:nth-child(3)").textContent,
        costPrice: row.querySelector("td:nth-child(4)").textContent,
        sellingPrice: row.querySelector("td:nth-child(5)").textContent,
        parentCategory: row.querySelector("td:nth-child(6)").textContent,
        parentSubcategory: row.querySelector("td:nth-child(7)").textContent,
        stock: row.querySelector("td:nth-child(9)").textContent,
        createdAt: row.querySelector("td:nth-child(2)").textContent,
        description: "Sample product description", // Mock data
      };
      showViewModal("product", productData);
    };
  });

  // For categories
  document.querySelectorAll(".category-view-btn").forEach((button) => {
    button.onclick = function () {
      const row = this.closest("tr");
      const categoryData = {
        categoryName: row.querySelector("td:nth-child(2)").textContent,
        createdAt: new Date().toISOString(), // Mock data
        productCount: Math.floor(Math.random() * 50), // Mock data
        subcategoryCount: Math.floor(Math.random() * 10), // Mock data
      };
      showViewModal("category", categoryData);
    };
  });

  // For subcategories
  document.querySelectorAll(".subcategory-view-btn").forEach((button) => {
    button.onclick = function () {
      const row = this.closest("tr");
      const subcategoryData = {
        subcategoryName: row.querySelector("td:nth-child(2)").textContent,
        parentCategory: row.querySelector("td:nth-child(3)").textContent,
        createdAt: new Date().toISOString(), // Mock data
        productCount: Math.floor(Math.random() * 30), // Mock data
      };
      showViewModal("subcategory", subcategoryData);
    };
  });

  // For users
  document.querySelectorAll(".user-view-btn").forEach((button) => {
    button.onclick = function () {
      const row = this.closest("tr");
      const userData = {
        fullName: row.querySelector("td:nth-child(3)").textContent,
        email: row.querySelector("td:nth-child(4)").textContent,
        phoneNumber: row.querySelector("td:nth-child(5)").textContent,
        createdAt: row.querySelector("td:nth-child(6)").textContent,
        status: row.querySelector("td:nth-child(7)").textContent,
        orderCount: Math.floor(Math.random() * 20), // Mock data
      };
      showViewModal("user", userData);
    };
  });

  // For inquiries
  document.querySelectorAll(".inquiry-view-btn").forEach((button) => {
    button.onclick = function () {
      const row = this.closest("tr");
      const inquiryData = {
        name: row.querySelector("td:nth-child(2)").textContent,
        email: row.querySelector("td:nth-child(3)").textContent,
        message: row.querySelector("td:nth-child(4)").textContent,
        createdAt: row.querySelector("td:nth-child(5)").textContent,
      };
      showViewModal("inquiry", inquiryData);
    };
  });
}

// Call setupViewButtons after content is loaded
document.addEventListener("DOMContentLoaded", setupViewButtons);

// Also call setupViewButtons after any table updates
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === "childList") {
      setupViewButtons();
    }
  });
});

// Observe tables for changes
const tables = document.querySelectorAll("tbody");
tables.forEach((table) => {
  observer.observe(table, { childList: true, subtree: true });
});

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("viewDetailsModal");
  if (event.target === modal) {
    closeViewModal();
  }
};

async function handleCovermodel() {
  const subDown = document.getElementById("subDown");
  const phoneModel = document.getElementById("phoneModel");
  const parentCategory = document.querySelector(".phoneSpecShow");

  if (!phoneModel) {
    console.error("Missing #phoneModel container in DOM");
    return;
  }

  if (
    !parentCategory ||
    (parentCategory.value !== "Cover" &&
      parentCategory.value !== "Screen Protector")
  ) {
    console.log("Not a cover or screen protector");
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
    console.log(data);

    const models = Array.isArray(data?.models) ? data.models : [];
    console.log(models);

    if (!models.length) {
      phoneModel.textContent = "No models found for this brand.";
      phoneModel.style.display = "";
      return;
    }

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

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = safeId;
      input.name = "models[]"; // so backend gets an array
      input.value = model;

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
