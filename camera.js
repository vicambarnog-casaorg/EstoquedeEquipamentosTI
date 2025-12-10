// camera.js
// Abre câmera, captura foto e dispara evento global 'camera:capture' com Blob
(function(){
  const cameraModal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');
  let stream = null;

  window.openCamera = async function() {
    cameraModal.classList.add('show');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error('Erro ao abrir câmera', err);
      alert('Não foi possível acessar a câmera: ' + err.message);
      closeCamera();
    }
  };

  window.closeCamera = function() {
    cameraModal.classList.remove('show');
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    video.srcObject = null;
  };

  window.capturePhoto = function() {
    if (!video || video.readyState < 2) throw new Error('Câmera não pronta');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
    });
  };

  // botões do DOM
  document.getElementById('closeCameraBtn').addEventListener('click', closeCamera);
  document.getElementById('captureBtn').addEventListener('click', async () => {
    try {
      const blob = await capturePhoto();
      // evento global
      window.dispatchEvent(new CustomEvent('camera:capture', { detail: { blob } }));
      // opcional: fechar depois de capturar
      window.closeCamera();
    } catch (err) {
      console.error(err);
      alert('Erro ao capturar: ' + err.message);
    }
  });
})();
