document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll(".accordion-header");
  const toggleAllBtn = document.getElementById("toggleAll");

  headers.forEach(header => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      const isOpen = header.classList.contains("active");

      if (isOpen) {
        header.classList.remove("active");
        content.style.display = "none";
      } else {
        header.classList.add("active");
        content.style.display = "block";

        // Cuộn mượt đến phần mới mở
        const offsetTop = header.offsetTop - 10;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth"
        });
      }
    });
  });

  // Mở / thu gọn tất cả
  toggleAllBtn.addEventListener("click", () => {
    const isOpenAll = toggleAllBtn.dataset.open === "true";

    headers.forEach(header => {
      const content = header.nextElementSibling;
      if (isOpenAll) {
        header.classList.remove("active");
        content.style.display = "none";
      } else {
        header.classList.add("active");
        content.style.display = "block";
      }
    });

    toggleAllBtn.dataset.open = (!isOpenAll).toString();
    toggleAllBtn.textContent = isOpenAll ? "Mở tất cả" : "Thu gọn tất cả";

    // Nếu mở tất cả thì cuộn lên đầu trang
    if (!isOpenAll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});
