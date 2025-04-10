document.addEventListener("DOMContentLoaded", () => {
    const submissionWrappers = document.querySelectorAll(".submissionsWrapper");
    const iframeWrapper = document.querySelector(".iframeWrapper");
    const iframe = document.querySelector(".submissionContent");
    const closeIframe = document.querySelector(".closeIframe");
    submissionWrappers.forEach(wrapper => {
        wrapper.addEventListener("click", () => {
            const url = wrapper.getAttribute("data-src");
            if (url) {
                iframe.src = url;
                iframeWrapper.classList.remove("hidden");
                iframeWrapper.classList.add("flex");
            }
        });
    });
    closeIframe.addEventListener("click", () => {
        iframeWrapper.classList.add("hidden");
        iframeWrapper.classList.remove("flex");
        iframe.src = "";
    });
});


function openIframeModal(iframeSrc) {
    const iframeWrapper = document.querySelector(".iframeWrapper");
    const iframe = document.querySelector(".submissionContent");
    const closeIframe = document.querySelector(".closeIframe");

    if (iframe && iframeWrapper) {
        iframe.src = iframeSrc;
        iframeWrapper.classList.remove("hidden");
        iframeWrapper.classList.add("flex");
    }

    if (closeIframe) {
        closeIframe.addEventListener("click", () => {
            iframeWrapper.classList.add("hidden");
            iframeWrapper.classList.remove("flex");
            iframe.src = "";
        }, { once: true });
    }
}