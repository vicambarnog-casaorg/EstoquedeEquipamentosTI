// camera.js
(function(){
  const cameraModal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');
  const captureBtn = document.getElementById('captureBtn');
  const closeCameraBtn = document.getElementById('closeCameraBtn');
  let stream = null;

  window.openCameraModal = async function() {
    cameraModal.classList.add('show');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error('Erro câmera:', err);
      alert('Não foi possível acessar a câmera: ' + (err.message || err));
      closeCameraModal();
    }
  };

  window.closeCameraModal = function() {
    cameraModal.classList.remove('show');
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    video.srcObject = null;
  };

  captureBtn.addEventListener('click', async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9));
      // Dispatch global event with captured blob
      window.dispatchEvent(new CustomEvent('camera:captured', { detail: { blob } }));
      closeCameraModal();
    } catch (err) {
      console.error('Erro capturar:', err);
      alert('Erro ao capturar foto: ' + err.message);
    }
  });

  closeCameraBtn.addEventListener('click', closeCameraModal);
})();
