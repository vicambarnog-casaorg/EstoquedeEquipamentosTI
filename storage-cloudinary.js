async function compressImageToBase64(fileOrBlob, maxKB = 100) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX_WIDTH = 1280;
      const ratio = MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let quality = 0.7;

      function tryCompress() {
        const base64 = canvas.toDataURL("image/jpeg", quality);
        const sizeKB = Math.round((base64.length * 0.75) / 1024);

        if (sizeKB <= maxKB || quality <= 0.2) {
          resolve(base64);
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

async function uploadImageCloudinary(blobOriginal) {
  const compressedBase64 = await compressImageToBase64(blobOriginal, 100);

  const cloudName = "root"; // <<<<<< SOMENTE ISSO
  const uploadPreset = "unsigned_patrimonio"; // <<<< ESTE É O NOME DO PRESET

  const formData = new FormData();
  formData.append("file", compressedBase64);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "produtos");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!data.secure_url) {
    console.error(data);
    throw new Error("Erro ao enviar para Cloudinary");
  }

  return data.secure_url;
}

window.uploadImageCloudinary = uploadImageCloudinary;
