async function compressImageToBase64(fileOrBlob, maxKB = 100) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX_WIDTH = 1024;
      const ratio = MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let quality = 0.7;

      function tryCompress() {
        const base64 = canvas.toDataURL("image/jpeg", quality);
        const sizeKB = Math.round((base64.length * 0.75) / 1024);

        if (sizeKB <= maxKB || quality <= 0.2) {
          resolve(base64.replace(/^data:image\/jpeg;base64,/, ""));
        } else {
          quality -= 0.1;
          tryCompress();
        }
      }

      tryCompress();
    };

    img.src = url;
  });
}


async function uploadImageToImageKit(blobOriginal) {
  const compressedBase64 = await compressImageToBase64(blobOriginal, 100);

  const formData = new FormData();
  formData.append("file", compressedBase64);
  formData.append("fileName", "foto_" + Date.now() + ".jpg");
  formData.append("publicKey", "public_pv4335DWuuh9X5Gj/mPWOkQIDPg=");
  formData.append("folder", "/produtos");

  const urlEndpoint = "https://ik.imagekit.io/vvvvv";

  const response = await fetch(urlEndpoint + "/api/v1/files/upload", {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!data.url) throw new Error("Falha no upload ImageKit");

  return data.url;
}

window.uploadImageToImageKit = uploadImageToImageKit;
