(async function () {
  const response = await fetch("https://androiddev.social/@svenjacobs.rss");

  if (response.status === 200) {
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "text/xml");

    const toots = doc.querySelectorAll("item");
    if (toots?.length > 0) {
      await setToot(toots, 0);
    }
  }
})();

/**
 * @param {NodeListOf<Element>} toots
 * @param {number} index
 * @returns {Promise}
 */
const setToot = async (toots, index) => {
  if (index === 5 || index > toots.length - 1) {
    await setToot(toots, 0);
    return;
  }

  const el = document.getElementById("toots");
  const item = toots[index];
  const description = item.querySelector("description")?.textContent;
  const link = item.querySelector("link")?.textContent;

  if (description) {
    if (!el.classList.contains("hide")) {
      el.classList.add("hide");
      await sleep(1_000);
    }
    await sleep(500);

    el.innerHTML = link
      ? description + `<p><a href="${link}">${link}</a></p>`
      : description;

    el.classList.remove("hide");

    await sleep(7_000);
  }

  await setToot(toots, index + 1);
};

/**
 * @param {number} ms
 * @returns {Promise}
 */
const sleep = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
