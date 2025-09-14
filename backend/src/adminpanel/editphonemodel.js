const url = new URL(window.location.href);

const id = url.searchParams.get("id");

document.addEventListener("DOMContentLoaded", () => {
  axios
    .get(`/api/phonemodels/${id}`)
    .then((response) => {
      const model = response.data;
      document.querySelector("#brand").value = model.brand;
      document.querySelector("#phone-model").value = model.models.join(", ");
      document.querySelector("#hidden-id").value = model._id;
    })
    .catch((error) => {
      console.error("Error fetching phone model:", error);
    });
});

document.querySelector("#submit").addEventListener("click", async (e) => {
  e.preventDefault();
  const idd = document.querySelector("#hidden-id").value;
  const brand = document.querySelector("#brand").value;
  const models = document.querySelector("#phone-model").value;
  const main = document.querySelector("main");
  const loader = document.querySelector(".delete-loader");
  const submitBtn = document.querySelector("#submit");
  main.style.opacity = "0.5";
  loader.style.display = "block";

  const payload = {
    brand: brand,
    models: models,
  };

  if (!idd || !brand || !models) {
    alert("Please provide brand and at least one model.");
    return;
  }

  submitBtn.disabled = true;

  try {
    const response = await axios.put(`/api/phonemodels/${idd}`, payload);
    alert(response.data.message);
    window.close();
  } catch (error) {
    console.log("Error while updating phone model: ", error);
    alert(error.response?.data?.message || "Failed to update phone model.");
    window.location.href = "/admin";
  } finally {
    submitBtn.disabled = false;
    main.style.opacity = "1";
    loader.style.display = "none";
  }
});
