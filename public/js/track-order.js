(() => {
  const form = document.getElementById("tracking-form");
  const input = document.getElementById("order-number");
  const button = document.getElementById("track-button");
  const message = document.getElementById("message");
  const result = document.getElementById("result");
  const timeline = document.getElementById("timeline");
  const statuses = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"];

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#f0a0a0" : "#aaa";
  }
  function render(data) {
    const order = data.order;
    document.getElementById("result-number").textContent = order.order_number;
    document.getElementById("result-status").textContent = order.status;
    timeline.replaceChildren();
    if (order.status === "Cancelled") {
      const item = document.createElement("li");
      item.className = "cancelled";
      const dot = document.createElement("span");
      dot.className = "dot";
      const label = document.createElement("span");
      label.textContent = "Order cancelled";
      item.append(dot, label);
      timeline.append(item);
    } else {
      const completed = new Set((data.history || []).map(entry => entry.status));
      completed.add(order.status);
      const currentIndex = statuses.indexOf(order.status);
      statuses.forEach((status, index) => {
        const item = document.createElement("li");
        if (completed.has(status) || index <= currentIndex) item.classList.add("done");
        const dot = document.createElement("span");
        dot.className = "dot";
        const label = document.createElement("span");
        label.textContent = status;
        item.append(dot, label);
        timeline.append(item);
      });
    }
    result.classList.remove("hidden");
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const number = input.value.trim().toUpperCase();
    if (!/^ADZ\\d{3,}$/.test(number)) {
      result.classList.add("hidden");
      showMessage("Enter a valid order number, for example ADZ001.", true);
      return;
    }
    button.disabled = true;
    button.textContent = "Checking…";
    result.classList.add("hidden");
    showMessage("Looking up your order…");
    try {
      const response = await fetch("/api/track-order?number=" + encodeURIComponent(number), {
        headers: { "accept": "application/json" },
        cache: "no-store"
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to find this order.");
      render(payload);
      showMessage("Your latest order status is shown below.");
    } catch (error) {
      showMessage(error.message || "Something went wrong. Please try again.", true);
    } finally {
      button.disabled = false;
      button.textContent = "Track order";
    }
  });
})();
