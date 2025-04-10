
let showContentIfOriginal = document.querySelectoryAll(".showContentIfOriginal");
let showContentIfReferenced = document.querySelectoryAll(".showContentIfReferenced");

function showIfOriginal() {
    showContentIfOriginal.forEach((content) => {
        content.classList.remove("hidden");
    })

    showContentIfReferenced.forEach((content) => {
        content.classList.add("hidden");
    })
}

function showIfReferenced() {
    showContentIfOriginal.forEach((content) => {
        content.classList.add("hidden");
    })

    showContentIfReferenced.forEach((content) => {
        content.classList.remove("hidden");
    })
}

document.addEventListener("DOMContentLoaded", function () {
    if (contentOrigin === "Original" || contentOrigin === "") {
        showIfOriginal();
    } else {
        showIfReferenced();
    }
});