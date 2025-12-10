// storage-cloudinary.js
(async function(){
  const CLOUD_NAME = "dwanrvvob";            // você confirmou
  const UPLOAD_PRESET = "unsigned_patrimonio";

  async function compressImageToBase64(fileOrBlob, maxKB = 100) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(fileOrBlob);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_WIDTH = 1280;
          const ratio = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let quality = 0.75;
          (function tryCompress(){
            canvas.toDataURL('image/jpeg', quality);
            const base64 = canvas.toDataURL('image/jpeg', quality);
            const sizeKB = Math.round((base64.length * 0.75) / 1024);
            if (sizeKB <= maxKB || quality <= 0.2) {
              resolve(base64);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          })();
        } catch (e) { reject(e); }
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  async function uploadImageCloudinary(blob) {
    const base64 = await compressImageToBase64(blob, 100); // data:image/jpeg;base64,...
    const form = new FormData();
    form.append('file', base64);
    form.append('upload_preset', UPLOAD_PRESET);
    form.append('folder', 'produtos');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form
    });

    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      console.error('Cloudinary upload error', res.status, text);
      throw new Error('Falha no upload para Cloudinary');
    }

    const data = await res.json();
    if (!data.secure_url) throw new Error('Resposta inválida Cloudinary');
    return data.secure_url;
  }

  window.uploadImageCloudinary = uploadImageCloudinary;
})();
