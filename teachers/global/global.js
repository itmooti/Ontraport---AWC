let showContentIfOriginal = document.querySelectorAll(".showContentIfOriginal");
let showContentIfReferenced = document.querySelectorAll(
  ".showContentIfReferenced"
);

function showIfOriginal() {
  showContentIfOriginal.forEach((content) => {
    content.classList.remove("hidden");
  });

  showContentIfReferenced.forEach((content) => {
    content.classList.add("hidden");
  });
}

function showIfReferenced() {
  showContentIfOriginal.forEach((content) => {
    content.classList.add("hidden");
  });

  showContentIfReferenced.forEach((content) => {
    content.classList.remove("hidden");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  if (contentOrigin === "Original" || contentOrigin === "") {
    showIfOriginal();
  } else {
    showIfReferenced();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll("img");
  if (images.src == "") {
    img.src =
      "https://files.ontraport.com/media/eb5d901d928f4785a1e822bf73b36dd5.phputv7sh?Expires=4895182624&Signature=gCWTVS2J4k7XtOHkrCjHaHMboB-OX5DIBA3ugCyfO~mHWkpJdEurKSpxBaYjEsmGAWkqzIN-~0UmQ1v2y-CAwjFtS~fDY5sOMjq1yG9JImwknUHqTQ2Nvm1u3fU0sAWu2JQzBjMhcEU~udsvVbLyA9NvyyDGFsGap3wQMZQH-GADUxvjCdiA0wn0ytysrFrnUw-rQAo7NQsSgvuTeTQVtG4rZ~fFQMdD8ulJJciOTFp9n-l71BEAqpnrmGFLNCYYSx5yFhZTadboSp121TjWKQfPNzEFipGxFNYi~GtG73tN3aX1~ICuzmKzgl5TUeA18NtzNG6EGj-cSi6zUfUHMw__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA";
  }
});

const buttonLinks = new Map();

function toggleButton(button, isSliderOff) {
  const onOffBtn = button.querySelector(".onOffTxt");
  const children = Array.from(button.children);

  button.innerHTML = "";
  children.reverse().forEach((child) => button.appendChild(child));

  if (isSliderOff) {
    button.style.setProperty("background-color", "#007c8f", "important");
    onOffBtn.innerText = "ON";
    onOffBtn.style.setProperty("color", "#fff", "important");
  } else {
    button.style.setProperty("background-color", "#bfbfbf", "important");
    onOffBtn.innerText = "OFF";
    onOffBtn.style.setProperty("color", "#fff", "important");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".notificationButton");

  const buttonStates = new Map();

  buttons.forEach((button, index) => {
    buttonStates.set(button, true);
    button.dataset.index = index;

    button.addEventListener("click", (e) => {
      e.stopPropagation();

      const isSliderOff = buttonStates.get(button);
      toggleButton(button, isSliderOff);
      buttonStates.set(button, !isSliderOff);

      if (buttonLinks.has(button.dataset.index)) {
        const linkedButtons = buttonLinks.get(button.dataset.index);
        linkedButtons.forEach((linkedIndex) => {
          const linkedButton = Array.from(buttons).find(
            (btn) => btn.dataset.index === linkedIndex
          );
          if (linkedButton && buttonStates.get(linkedButton) === isSliderOff) {
            toggleButton(linkedButton, isSliderOff);
            buttonStates.set(linkedButton, !isSliderOff);
          }
        });
      }
    });
  });

  const linkButtons = (btnIndex1, btnIndex2) => {
    if (!buttonLinks.has(btnIndex1)) buttonLinks.set(btnIndex1, []);
    if (!buttonLinks.has(btnIndex2)) buttonLinks.set(btnIndex2, []);
    buttonLinks.get(btnIndex1).push(btnIndex2);
    buttonLinks.get(btnIndex2).push(btnIndex1);
  };

  linkButtons("1", "2");
});
