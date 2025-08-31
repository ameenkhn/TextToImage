const HF_TOKEN = ""; // <-- paste your Hugging Face token here
const API_URL = "https://router.huggingface.co/nebius/v1/images/generations";
const el = {
  prompt: document.getElementById("prompt"),
  negative: document.getElementById("negativePrompt"),
  size: document.getElementById("size"),
  btn: document.getElementById("generateBtn"),
  loader: document.getElementById("loader"),
  img: document.getElementById("resultImage"),
  imageContainer: document.getElementById("imageContainer"),
  placeholder: document.getElementById("placeholder"),
  genCount: document.getElementById("genCount"),
};
function setLoading(isLoading) {
  el.loader.classList.toggle("hidden", !isLoading);
  el.btn.classList.toggle("loading", isLoading);
  el.btn.disabled = isLoading;
}

function incrementCounter() {
  const n = Number(el.genCount.textContent || "0") + 1;
  el.genCount.textContent = String(n);
}
async function generateImageB64({ prompt, negative, size }) {
  const payload = {
    response_format: "b64_json",
    prompt: prompt,
    model: "black-forest-labs/flux-dev",
    size: size, // e.g., "1024x1024"
    ...(negative && { negative_prompt: negative }),
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let details = "";
    try {
      const err = await res.json();
      if (err?.error) details = ` - ${err.error}`;
    } catch {}
    throw new Error(`Request failed: ${res.status} ${res.statusText}${details}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    console.warn("Unexpected response shape:", data);
    throw new Error("No image data in response");
  }
  return `data:image/png;base64,${b64}`;
}

async function onGenerate() {
  const prompt = (el.prompt.value || "").trim();
  if (!prompt) {
    alert("Please enter a prompt.");
    return;
  }

  const size = el.size ? el.size.value : "1024x1024";
  const negative = el.negative ? el.negative.value.trim() : "";

  try {
    setLoading(true);
    el.imageContainer.classList.add("hidden");

    const src = await generateImageB64({ prompt, negative, size });
    el.img.src = src;

    el.placeholder && el.placeholder.classList.add("hidden");
    el.imageContainer.classList.remove("hidden");
    incrementCounter();
  } catch (e) {
    console.error(e);
    alert(`Error generating image: ${e.message}`);
  } finally {
    setLoading(false);
  }
}
el.btn.addEventListener("click", onGenerate);
el.prompt.addEventListener("keydown", (ev) => { if (ev.key === "Enter") onGenerate(); });